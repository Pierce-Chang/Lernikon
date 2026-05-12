/**
 * One-shot: turn the baked-in transparency-checker background of the theme
 * PNGs into a real RGBA alpha channel.
 *
 * Some asset packs export "transparent" PNGs as RGB with the photoshop
 * checker pattern rendered into the visible pixels. This script flood-fills
 * from the edges, treating any near-white/light-gray pixel reachable from
 * the border as background, and sets its alpha to 0.
 *
 * Originals are copied to public/themes/_originals/ before being overwritten.
 *
 * Run:  node scripts/strip-theme-backgrounds.mjs
 */
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const THEMES_DIR = path.resolve("public/themes");
const TARGETS = [
  "einhorn_theme.png",
  "pferd_theme.png",
  "rakete_theme.png",
  "auto_theme_blau.png",
];

// A pixel counts as background if it's brightish AND near-grayscale.
// Wider threshold catches both the white and the light-gray cells of
// the checker pattern, plus the AA halo between them.
const isBackgroundLike = (r, g, b) => {
  if (r < 195 || g < 195 || b < 195) return false;
  const maxDelta = Math.max(
    Math.abs(r - g),
    Math.abs(g - b),
    Math.abs(r - b),
  );
  return maxDelta < 18;
};

async function stripBackground(file) {
  const src = path.join(THEMES_DIR, file);
  const { data, info } = await sharp(src)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height } = info;
  const pixels = Buffer.from(data); // 4 channels (RGBA)
  const visited = new Uint8Array(width * height);
  const stack = [];

  const considerPixel = (idx) => {
    if (visited[idx]) return;
    const p = idx * 4;
    if (isBackgroundLike(pixels[p], pixels[p + 1], pixels[p + 2])) {
      visited[idx] = 1;
      stack.push(idx);
    }
  };

  // Seed from all four edges.
  for (let x = 0; x < width; x++) {
    considerPixel(x);
    considerPixel((height - 1) * width + x);
  }
  for (let y = 0; y < height; y++) {
    considerPixel(y * width);
    considerPixel(y * width + (width - 1));
  }

  // Iterative flood-fill (4-connected). pop() is O(1).
  let processed = 0;
  while (stack.length) {
    const idx = stack.pop();
    pixels[idx * 4 + 3] = 0;
    processed++;

    const x = idx % width;
    const y = (idx / width) | 0;
    if (x > 0) considerPixel(idx - 1);
    if (x < width - 1) considerPixel(idx + 1);
    if (y > 0) considerPixel(idx - width);
    if (y < height - 1) considerPixel(idx + width);
  }

  await sharp(pixels, { raw: { width, height, channels: 4 } })
    .png({ compressionLevel: 9 })
    .toFile(src);

  console.log(
    `  ✓ ${file}  (${width}×${height}, ${processed.toLocaleString()} pixels → transparent)`,
  );
}

async function main() {
  const backupDir = path.join(THEMES_DIR, "_originals");
  await fs.mkdir(backupDir, { recursive: true });

  console.log(`Backing up + processing ${TARGETS.length} files ...`);
  for (const file of TARGETS) {
    const src = path.join(THEMES_DIR, file);
    const bak = path.join(backupDir, file);
    try {
      await fs.copyFile(src, bak);
    } catch (err) {
      console.warn(`  ! could not back up ${file}: ${err.message}`);
      continue;
    }
    await stripBackground(file);
  }
  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
