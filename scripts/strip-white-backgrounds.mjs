/**
 * Turn a plain white background into real RGBA alpha.
 *
 * When to use which script:
 *   strip-theme-backgrounds.mjs  — use when the PNG was exported with a
 *     Photoshop/Figma transparency-checker pattern (alternating white + light-
 *     gray squares). The checker pattern is recognised by its near-grayscale
 *     hue with a brightness threshold of ~195.
 *
 *   strip-white-backgrounds.mjs  — use when the PNG was exported with a solid
 *     plain white background (no checker pattern). The threshold is tight
 *     (R>240, G>240, B>240) so only near-white pixels are erased, leaving
 *     light-colored artwork pixels intact.
 *
 * Both scripts use an edge-seeded flood-fill so only background pixels that
 * are reachable from the image border are made transparent. Interior white
 * areas (e.g. eyes or teeth on an illustration) are never touched.
 *
 * Extended seeding: this script also seeds from any pixel that already has
 * alpha=0 (transparent). This handles images where a prior strip pass left
 * a semi-transparent drop-shadow halo at the border — the white background
 * sits behind that halo and would otherwise be unreachable from the image
 * edge alone.
 *
 * Originals are backed up to <dir>/_originals/ before being overwritten.
 * If a backup already exists the file is re-processed (the backup is the
 * pristine original; the working file may be from a prior partial pass).
 *
 * Run:  node scripts/strip-white-backgrounds.mjs <dir>     (all *.png in dir)
 *       node scripts/strip-white-backgrounds.mjs <file>    (single PNG)
 */
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const cliArg = process.argv[2];
if (!cliArg) {
  console.error("Usage: node scripts/strip-white-backgrounds.mjs <dir-or-file>");
  process.exitCode = 1;
  process.exit();
}

const TARGET_PATH = path.resolve(cliArg);

/** A pixel is background-like if all three channels are near-white. */
const isWhiteLike = (r, g, b) => r > 240 && g > 240 && b > 240;

/**
 * Flood-fill white background pixels to alpha=0.
 *
 * Seeds from:
 *   1. All four image edges (catches direct white borders).
 *   2. All pixels that are already alpha=0 (catches white pixels hidden
 *      behind a semi-transparent shadow halo that blocks edge access).
 *
 * Returns the number of pixels made transparent, or 0 if none qualify.
 */
async function stripWhiteBackground(filePath) {
  const { data, info } = await sharp(filePath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height } = info;
  const pixels = Buffer.from(data);
  const visited = new Uint8Array(width * height);
  const stack = [];

  const considerPixel = (idx) => {
    if (visited[idx]) return;
    const p = idx * 4;
    if (isWhiteLike(pixels[p], pixels[p + 1], pixels[p + 2])) {
      visited[idx] = 1;
      stack.push(idx);
    }
  };

  // Seed pass 1: all four image edges.
  for (let x = 0; x < width; x++) {
    considerPixel(x);
    considerPixel((height - 1) * width + x);
  }
  for (let y = 0; y < height; y++) {
    considerPixel(y * width);
    considerPixel(y * width + (width - 1));
  }

  // Seed pass 2: neighbours of all already-transparent pixels.
  // This lets the flood-fill reach white pixels that are enclosed by a
  // semi-transparent shadow halo whose own R/G/B values aren't near-white.
  for (let idx = 0; idx < width * height; idx++) {
    if (pixels[idx * 4 + 3] === 0) {
      const x = idx % width, y = (idx / width) | 0;
      if (x > 0) considerPixel(idx - 1);
      if (x < width - 1) considerPixel(idx + 1);
      if (y > 0) considerPixel(idx - width);
      if (y < height - 1) considerPixel(idx + width);
    }
  }

  if (stack.length === 0) {
    return 0;
  }

  // Iterative 4-connected flood-fill.
  let processed = 0;
  while (stack.length) {
    const idx = stack.pop();
    pixels[idx * 4 + 3] = 0;
    processed++;

    const x = idx % width, y = (idx / width) | 0;
    if (x > 0) considerPixel(idx - 1);
    if (x < width - 1) considerPixel(idx + 1);
    if (y > 0) considerPixel(idx - width);
    if (y < height - 1) considerPixel(idx + width);
  }

  await sharp(pixels, { raw: { width, height, channels: 4 } })
    .png({ compressionLevel: 9 })
    .toFile(filePath);

  return processed;
}

/**
 * Process one PNG file: back up if not already done, then strip white bg.
 */
async function processFile(filePath, backupDir) {
  const fileName = path.basename(filePath);
  const bakPath = path.join(backupDir, fileName);

  let alreadyBackedUp = false;
  try {
    await fs.access(bakPath);
    alreadyBackedUp = true;
  } catch {
    // No backup yet — proceed.
  }

  if (!alreadyBackedUp) {
    try {
      await fs.copyFile(filePath, bakPath);
    } catch (err) {
      console.warn(`  ! could not back up ${fileName}: ${err.message}`);
      return;
    }
  }

  const count = await stripWhiteBackground(filePath);
  if (count === 0) {
    console.log(`  · ${fileName}  (skipped, no white background detected)`);
  } else {
    console.log(`  ✓ ${fileName}  transparent: ${count.toLocaleString()} pixels`);
  }
}

async function main() {
  let stat;
  try {
    stat = await fs.stat(TARGET_PATH);
  } catch {
    console.error(`Path not found: ${TARGET_PATH}`);
    process.exitCode = 1;
    return;
  }

  if (stat.isFile()) {
    // Single-file mode: backup dir lives next to the file.
    const backupDir = path.join(path.dirname(TARGET_PATH), "_originals");
    await fs.mkdir(backupDir, { recursive: true });
    console.log(`Processing single file: ${TARGET_PATH}`);
    await processFile(TARGET_PATH, backupDir);
  } else {
    // Directory mode: auto-discover all *.png except _originals/.
    const backupDir = path.join(TARGET_PATH, "_originals");
    await fs.mkdir(backupDir, { recursive: true });

    const entries = await fs.readdir(TARGET_PATH);
    const targets = entries.filter(
      (name) => name.toLowerCase().endsWith(".png") && !name.startsWith("_"),
    );

    console.log(`Processing ${targets.length} PNG(s) in ${TARGET_PATH} ...`);
    await Promise.all(
      targets.map((name) =>
        processFile(path.join(TARGET_PATH, name), backupDir),
      ),
    );
  }

  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
