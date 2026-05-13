/**
 * One-shot: derive black-outline-only PNGs from the colored geometric
 * shape assets. Used by the "Ausmalen" mode of Muster fortsetzen, where
 * the kid colors the outline in the correct shape color.
 *
 * Algorithm:
 *   1. Read the colored shape PNG (already cleaned + resized).
 *   2. Build a binary silhouette mask from the alpha channel.
 *   3. Erode the silhouette N times (one pixel per iteration).
 *   4. Outline = silhouette AND NOT eroded → a ring of N pixels along
 *      the inside edge of the shape.
 *   5. Write the outline as black-on-transparent PNG to
 *      public/geometrics/outlines/<same-filename>.
 *
 * Idempotent: re-running regenerates from the current source images
 * (no backup, since the source is the authoritative input and outlines
 * are derived).
 *
 * Run:  node scripts/generate-shape-outlines.mjs
 */
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const TARGET_DIR = path.resolve("public/geometrics"),
  OUT_DIR = path.join(TARGET_DIR, "outlines"),
  // 16 px at 512 px source ≈ 1.88pt outline at a 60pt PDF cell, which
  // prints around 0.66mm — thick enough to see, thin enough to leave
  // generous coloring room inside.
  OUTLINE_THICKNESS_PX = 16,
  ALPHA_THRESHOLD = 128;

/** Compute one-pixel erosion: a pixel survives only if itself and all 4 neighbours are set. */
const erodeOnce = (mask, width, height) => {
  const next = new Uint8Array(width * height);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const idx = y * width + x;
      if (!mask[idx]) continue;
      if (x === 0 || y === 0 || x === width - 1 || y === height - 1) continue;
      if (
        mask[idx - 1] &&
        mask[idx + 1] &&
        mask[idx - width] &&
        mask[idx + width]
      ) {
        next[idx] = 1;
      }
    }
  }
  return next;
};

async function generateOutline(file) {
  const src = path.join(TARGET_DIR, file),
    out = path.join(OUT_DIR, file),
    { data, info } = await sharp(src)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true }),
    { width, height } = info,
    total = width * height,
    silhouette = new Uint8Array(total);

  for (let i = 0; i < total; i += 1) {
    silhouette[i] = data[i * 4 + 3] >= ALPHA_THRESHOLD ? 1 : 0;
  }

  let eroded = silhouette;
  for (let i = 0; i < OUTLINE_THICKNESS_PX; i += 1) {
    eroded = erodeOnce(eroded, width, height);
  }

  const outline = Buffer.alloc(total * 4);
  let edgePixels = 0;
  for (let i = 0; i < total; i += 1) {
    if (silhouette[i] && !eroded[i]) {
      const p = i * 4;
      outline[p] = 0;
      outline[p + 1] = 0;
      outline[p + 2] = 0;
      outline[p + 3] = 255;
      edgePixels += 1;
    }
  }

  await sharp(outline, { raw: { width, height, channels: 4 } })
    .png({ compressionLevel: 9 })
    .toFile(out);

  console.log(
    `  ✓ ${file}  (${width}x${height}, ${edgePixels.toLocaleString()} outline pixels)`,
  );
}

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true });
  const entries = await fs.readdir(TARGET_DIR),
    pngs = entries.filter(
      (name) => name.toLowerCase().endsWith(".png") && !name.startsWith("_"),
    );
  console.log(`Generating outlines for ${pngs.length} shapes in ${TARGET_DIR} ...`);
  for (const file of pngs) {
    await generateOutline(file);
  }
  console.log(`Done. Outlines written to ${OUT_DIR}`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
