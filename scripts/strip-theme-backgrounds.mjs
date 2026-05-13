/**
 * One-shot: turn the baked-in transparency-checker background of asset PNGs
 * into a real RGBA alpha channel.
 *
 * Some asset packs export "transparent" PNGs as RGB with the photoshop
 * checker pattern rendered into the visible pixels. This script flood-fills
 * from the edges, treating any near-white/light-gray pixel reachable from
 * the border as background, and sets its alpha to 0.
 *
 * Originals are copied to <dir>/_originals/ before being overwritten.
 *
 * Run:  node scripts/strip-theme-backgrounds.mjs               (themes, default list)
 *       node scripts/strip-theme-backgrounds.mjs public/geometrics
 *         (any dir; auto-discovers all *.png except _originals/)
 */
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const DEFAULT_DIR = "public/themes",
  DEFAULT_TARGETS = [
    "einhorn_theme.png",
    "pferd_theme.png",
    "rakete_theme.png",
    "auto_theme_blau.png",
  ];

const cliDir = process.argv[2],
  TARGET_DIR = path.resolve(cliDir ?? DEFAULT_DIR);

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
  const src = path.join(TARGET_DIR, file);
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

/**
 * Resolve the list of PNGs to process. With no CLI arg we keep the original
 * hardcoded theme list. With a dir arg we auto-discover *.png in the dir,
 * skipping the _originals/ backup folder.
 */
async function resolveTargets() {
  if (!cliDir) return DEFAULT_TARGETS;
  const entries = await fs.readdir(TARGET_DIR);
  return entries.filter(
    (name) => name.toLowerCase().endsWith(".png") && !name.startsWith("_"),
  );
}

async function main() {
  const backupDir = path.join(TARGET_DIR, "_originals");
  await fs.mkdir(backupDir, { recursive: true });

  const targets = await resolveTargets();
  console.log(
    `Backing up + processing ${targets.length} files in ${TARGET_DIR} ...`,
  );
  for (const file of targets) {
    const src = path.join(TARGET_DIR, file),
      bak = path.join(backupDir, file);
    // Skip if a backup already exists — that means we've processed this file
    // before and the disk version is already clean. Re-backing-up would
    // overwrite the dirty original with the clean current state.
    let alreadyBackedUp = false;
    try {
      await fs.access(bak);
      alreadyBackedUp = true;
    } catch {
      // No backup yet, proceed.
    }
    if (alreadyBackedUp) {
      console.log(`  · ${file}  (already clean, skipped)`);
      continue;
    }
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
