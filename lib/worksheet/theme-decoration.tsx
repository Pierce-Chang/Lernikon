import fs from "node:fs";
import path from "node:path";
import { Image, View } from "@react-pdf/renderer";
import type { ReactElement } from "react";
import { THEMES, type Theme, type ThemeId } from "@/lib/themes";

/**
 * PDF theme decoration. A single illustration anchored in the bottom-right
 * corner of every page — visible enough to feel personalised, quiet enough
 * to stay out of the way of the centred footer brand lockup.
 *
 * Each PNG has a different natural aspect after the transparent-padding
 * trim, so we read its real pixel dimensions once at module init and
 * rescale so that the *longest* side equals MAX_DIM. Every theme ends up
 * at roughly the same on-page size, no matter whether the artwork is
 * square (Einhorn), tall (Rakete) or wide (Auto).
 */

const MAX_DIM = 40; // pt — longest side of the rendered illustration

const loadThemeBuffer = (theme: Theme): Buffer =>
  fs.readFileSync(
    path.join(process.cwd(), "public", ...theme.assetPath.split("/").filter(Boolean)),
  );

/** PNGs put IHDR right after the 8-byte signature; width/height are 4-byte big-endian. */
const pngDimensions = (buf: Buffer) => ({
  width: buf.readUInt32BE(16),
  height: buf.readUInt32BE(20),
});

interface ThemeRender {
  buffer: Buffer;
  width: number;
  height: number;
}

const THEME_RENDER: Record<ThemeId, ThemeRender> = THEMES.reduce(
  (acc, theme) => {
    const buffer = loadThemeBuffer(theme);
    const { width: pw, height: ph } = pngDimensions(buffer);
    const aspect = pw / ph;
    const width = aspect >= 1 ? MAX_DIM : Math.round(MAX_DIM * aspect);
    const height = aspect >= 1 ? Math.round(MAX_DIM / aspect) : MAX_DIM;
    acc[theme.id] = { buffer, width, height };
    return acc;
  },
  {} as Record<ThemeId, ThemeRender>,
);

export const ThemeDecoration = ({ theme }: { theme: Theme }): ReactElement => {
  const r = THEME_RENDER[theme.id];
  return (
    <View
      style={{
        position: "absolute",
        bottom: 8,
        right: 8,
        width: MAX_DIM,
        height: MAX_DIM,
        alignItems: "center",
        justifyContent: "center",
      }}
      fixed
    >
      <Image
        src={r.buffer}
        style={{ width: r.width, height: r.height, opacity: 0.7 }}
      />
    </View>
  );
};
