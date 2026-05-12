/**
 * Trim transparent padding off the theme PNGs so each illustration has a
 * tight bounding box. Combined with "longest side = N pt" in the renderer
 * (see lib/worksheet/theme-decoration.tsx), this makes every theme appear
 * at roughly the same visual size on the page.
 *
 * Idempotent: trimming an already-trimmed PNG is a no-op.
 *
 * Run:  node scripts/trim-theme-padding.mjs
 */
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const THEMES_DIR = path.resolve("public/themes");
const FILES = [
  "einhorn_theme.png",
  "pferd_theme.png",
  "rakete_theme.png",
  "auto_theme_rot.png",
  "auto_theme_blau.png",
];

for (const file of FILES) {
  const src = path.join(THEMES_DIR, file);
  const tmp = `${src}.tmp`;
  const before = await sharp(src).metadata();

  // Trim against fully-transparent background. Threshold 0 keeps anti-alias
  // edges intact instead of nibbling into the artwork.
  await sharp(src)
    .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 }, threshold: 0 })
    .png({ compressionLevel: 9 })
    .toFile(tmp);

  await fs.rename(tmp, src);
  const after = await sharp(src).metadata();
  console.log(
    `  ✓ ${file}  ${before.width}×${before.height} → ${after.width}×${after.height}`,
  );
}
