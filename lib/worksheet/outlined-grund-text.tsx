import { createRequire } from "node:module";
import path from "node:path";
import { Path, Svg } from "@react-pdf/renderer";
import type { ReactElement } from "react";

interface FontkitGlyph {
  path: {
    toSVG: () => string;
  };
}

interface FontkitPosition {
  xAdvance: number;
  xOffset: number;
  yOffset: number;
}

interface FontkitRun {
  glyphs: FontkitGlyph[];
  positions: FontkitPosition[];
}

interface FontkitFont {
  ascent: number;
  descent: number;
  unitsPerEm: number;
  layout: (text: string) => FontkitRun;
}

interface FontkitModule {
  openSync: (fontPath: string) => FontkitFont;
}

const require = createRequire(import.meta.url),
  fontkit = require("fontkit") as FontkitModule;

export const PLAYWRITE_DEGRUND_FONT_PATH = path.join(
  process.cwd(),
  "public",
  "fonts",
  "PlaywriteDEGrund-Regular.ttf",
);

/** Fontkit handle opened once at module init. Used for outline rendering only. */
export const PLAYWRITE_DEGRUND_FONT: FontkitFont =
  fontkit.openSync(PLAYWRITE_DEGRUND_FONT_PATH);

/** Returns the rendered width of a Playwrite DE Grund string at the given size. */
export const measureGrundText = (text: string, fontSize: number): number => {
  const run = PLAYWRITE_DEGRUND_FONT.layout(text),
    scale = fontSize / PLAYWRITE_DEGRUND_FONT.unitsPerEm;

  return run.positions.reduce((total, position) => total + position.xAdvance * scale, 0);
};

/**
 * Wraps Playwrite DE Grund text to the given max width.
 * When maxWidth is undefined the text is treated as a single line (auto-width).
 */
const wrapGrundText = (text: string, fontSize: number, maxWidth?: number): string[] => {
  if (maxWidth === undefined) return [text];

  const words = text.split(/\s+/).filter((word) => word.length > 0),
    lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (current && measureGrundText(candidate, fontSize) > maxWidth) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }

  if (current) lines.push(current);
  return lines.length > 0 ? lines : [text];
};

export interface OutlinedGrundTextProps {
  /** Text to render as Playwrite DE Grund vector outlines. */
  text: string;
  /** Font size in points. */
  fontSize: number;
  /** Fill color (CSS hex string). */
  color: string;
  /**
   * Max line width in points. When set, text wraps to this width.
   * When omitted, the SVG is sized to the actual text width (no wrap).
   */
  width?: number;
  /**
   * Line height multiplier applied to fontSize.
   * Defaults to 1.45. Use a smaller value (e.g. 1.0 or 1.1)
   * in tight containers where vertical space is constrained.
   */
  lineHeight?: number;
}

/**
 * Renders Playwrite DE Grund text as fontkit vector outlines so that umlaut
 * combining marks sit correctly above their base glyphs.
 *
 * React-PDF's text shaper misplaces combining marks (e.g. the diaeresis on
 * Ü/Ä/Ö) in this font family. Rendering every glyph as a <Path> bypasses the
 * shaper entirely and produces correct output.
 *
 * When `width` is provided, text is wrapped to that width (useful for sentence
 * columns). When `width` is omitted, the SVG is auto-sized to the text (useful
 * for single-word inline elements).
 */
export const OutlinedGrundText = ({
  text,
  fontSize,
  color,
  width,
  lineHeight = 1.45,
}: OutlinedGrundTextProps): ReactElement => {
  const lines = wrapGrundText(text, fontSize, width),
    scale = fontSize / PLAYWRITE_DEGRUND_FONT.unitsPerEm,
    baseline = PLAYWRITE_DEGRUND_FONT.ascent * scale,
    lineHeightPx = fontSize * lineHeight,
    svgHeight = lineHeightPx * lines.length;

  // When no fixed width is given, measure the widest line.
  const svgWidth =
    width !== undefined
      ? width
      : Math.max(...lines.map((line) => measureGrundText(line, fontSize)));

  const paths = lines.flatMap((line, lineIndex) => {
    const run = PLAYWRITE_DEGRUND_FONT.layout(line),
      lineTop = lineIndex * lineHeightPx;
    let cursorX = 0;

    return run.glyphs.map((glyph, glyphIndex) => {
      const position = run.positions[glyphIndex],
        translateX = (cursorX + position.xOffset) * scale,
        translateY = lineTop + baseline - position.yOffset * scale,
        transform = `matrix(${scale} 0 0 ${-scale} ${translateX} ${translateY})`;
      cursorX += position.xAdvance;

      return (
        <Path
          key={`${lineIndex}-${glyphIndex}`}
          d={glyph.path.toSVG()}
          fill={color}
          transform={transform}
        />
      );
    });
  });

  return (
    <Svg width={svgWidth} height={svgHeight} viewBox={`0 0 ${svgWidth} ${svgHeight}`}>
      {paths}
    </Svg>
  );
};
