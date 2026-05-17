/**
 * Trim transparent padding off theme PNGs so each illustration has a tight
 * bounding box. Combined with "longest side = N pt" in the renderer
 * (see lib/worksheet/theme-decoration.tsx), this makes every theme appear
 * at roughly the same visual size on the page.
 *
 * Idempotent: trimming an already-trimmed PNG is a no-op (dimensions stay
 * the same and the script says so in the log).
 *
 * Run:  node scripts/trim-theme-padding.mjs               (default list in public/themes)
 *       node scripts/trim-theme-padding.mjs <dir>          (auto-discovers all *.png in <dir>, skips _originals/)
 */
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const DEFAULT_DIR = "public/themes",
  DEFAULT_FILES = [
    "einhorn_theme.png",
    "pferd_theme.png",
    "rakete_theme.png",
    "auto_theme_rot.png",
    "auto_theme_blau.png",
  ];

const cliDir = process.argv[2],
  TARGET_DIR = path.resolve(cliDir ?? DEFAULT_DIR);

/**
 * Resolve the list of PNGs to process. With no CLI arg we keep the original
 * hardcoded theme list. With a dir arg we auto-discover *.png in the dir,
 * skipping the _originals/ backup folder.
 */
async function resolveTargets() {
  if (!cliDir) return DEFAULT_FILES;
  const entries = await fs.readdir(TARGET_DIR);
  return entries.filter(
    (name) => name.toLowerCase().endsWith(".png") && !name.startsWith("_"),
  );
}

async function main() {
  const targets = await resolveTargets();
  console.log(`Processing ${targets.length} files in ${TARGET_DIR} ...`);

  for (const file of targets) {
    const src = path.join(TARGET_DIR, file),
      tmp = `${src}.tmp`;
    const before = await sharp(src).metadata();

    // Trim against fully-transparent background. Threshold 0 keeps anti-alias
    // edges intact instead of nibbling into the artwork.
    await sharp(src)
      .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 }, threshold: 0 })
      .png({ compressionLevel: 9 })
      .toFile(tmp);

    await fs.rename(tmp, src);
    const after = await sharp(src).metadata();

    if (before.width === after.width && before.height === after.height) {
      console.log(`  · ${file}  ${before.width}×${before.height} (already trimmed, no-op)`);
    } else {
      console.log(
        `  ✓ ${file}  ${before.width}×${before.height} → ${after.width}×${after.height}`,
      );
    }
  }

  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
