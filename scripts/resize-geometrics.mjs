/**
 * One-shot: shrink decorative PNG assets to a sane render size.
 *
 * Source PNGs from image-generation tools often ship at 1000+ px per side
 * (1MB+ each). We render them tiny in practice: 40px in form chips, 46pt
 * in PDF corner decorations, 64px in theme picker tiles. Capping the
 * longest side at 512px keeps headroom for 300dpi print up to ~43mm and
 * cuts file size by 80-95%.
 *
 * Aspect is preserved — square sources stay square, wide/tall stay so.
 *
 * Originals are copied to <dir>/_resized-originals/ before being
 * overwritten. Idempotent: skips files that already fit within the cap.
 *
 * Run:  node scripts/resize-geometrics.mjs                  (default: public/geometrics)
 *       node scripts/resize-geometrics.mjs public/themes
 *       node scripts/resize-geometrics.mjs public/themes 384 (custom cap)
 */
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const DEFAULT_DIR = "public/geometrics",
  DEFAULT_SIZE = 512;

const cliDir = process.argv[2],
  cliSize = process.argv[3] ? Number(process.argv[3]) : null,
  TARGET_DIR = path.resolve(cliDir ?? DEFAULT_DIR),
  BACKUP_DIR = path.join(TARGET_DIR, "_resized-originals"),
  TARGET_SIZE = cliSize ?? DEFAULT_SIZE;

async function resizeOne(file) {
  const src = path.join(TARGET_DIR, file),
    bak = path.join(BACKUP_DIR, file),
    meta = await sharp(src).metadata(),
    longest = Math.max(meta.width ?? 0, meta.height ?? 0);
  if (longest <= TARGET_SIZE) {
    console.log(`  · ${file}  (already ${meta.width}x${meta.height}, skipped)`);
    return;
  }
  // Back up only if no backup exists yet — re-runs must not clobber
  // the pre-resize copy.
  let alreadyBackedUp = false;
  try {
    await fs.access(bak);
    alreadyBackedUp = true;
  } catch {
    // No backup yet.
  }
  if (!alreadyBackedUp) {
    await fs.copyFile(src, bak);
  }
  // `fit: inside` preserves aspect ratio and caps the longest side at
  // TARGET_SIZE without padding. Square inputs stay square; wide and tall
  // inputs keep their natural aspect.
  const buf = await sharp(src)
    .resize(TARGET_SIZE, TARGET_SIZE, { fit: "inside", withoutEnlargement: true })
    .png({ compressionLevel: 9 })
    .toBuffer();
  const out = await sharp(buf).metadata();
  await fs.writeFile(src, buf);
  console.log(
    `  ✓ ${file}  (${meta.width}x${meta.height} → ${out.width}x${out.height}, ${(buf.length / 1024).toFixed(0)}KB)`,
  );
}

async function main() {
  await fs.mkdir(BACKUP_DIR, { recursive: true });
  const entries = await fs.readdir(TARGET_DIR),
    pngs = entries.filter(
      (name) => name.toLowerCase().endsWith(".png") && !name.startsWith("_"),
    );
  console.log(
    `Resizing ${pngs.length} files in ${TARGET_DIR} (cap ${TARGET_SIZE}px) ...`,
  );
  for (const file of pngs) {
    await resizeOne(file);
  }
  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
