import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import {
  Document,
  Font,
  Image,
  Page,
  Path,
  StyleSheet,
  Svg,
  Text,
  View,
  renderToStream,
} from "@react-pdf/renderer";
import type { ReactElement } from "react";
import type { WoerterBlock } from "./generate";
import type { LetterStyle } from "./config";
import { STYLE_LABELS } from "./config";
import { getTheme, type ThemeId } from "@/lib/themes";
import { ThemeDecoration } from "../theme-decoration";
import { OutlinedGrundText } from "@/lib/worksheet/outlined-grund-text";

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

// Cached once at module init — React-PDF can't fetch local paths.
const LOGO_LOCKUP_BUFFER = fs.readFileSync(
  path.join(
    process.cwd(),
    "public",
    "logos",
    "paperplane",
    "png",
    "lockup-horizontal-navy-800.png",
  ),
);

const require = createRequire(import.meta.url),
  fontkit = require("fontkit") as FontkitModule,
  PLAYWRITE_DESAS_FONT_PATH = path.join(
    process.cwd(),
    "public",
    "fonts",
    "PlaywriteDESAS-Regular.ttf",
  ),
  PLAYWRITE_DESAS_FONT = fontkit.openSync(PLAYWRITE_DESAS_FONT_PATH);

// Same school-typography fonts as letter-tracing (see that module for details).
Font.register({
  family: "PlaywriteDEGrund",
  src: path.join(
    process.cwd(),
    "public",
    "fonts",
    "PlaywriteDEGrund-Regular.ttf",
  ),
});
// Playwrite DE SAS needs outline rendering for full words in this module.
Font.register({
  family: "PlaywriteDESAS",
  src: PLAYWRITE_DESAS_FONT_PATH,
});

export interface WoerterPdfProps {
  childName: string;
  date: string;
  blocks: WoerterBlock[];
  theme: ThemeId;
  style: LetterStyle;
  showWatermark: boolean;
}

const STYLE_FONT_FAMILY: Record<LetterStyle, string> = {
  druck: "PlaywriteDEGrund",
  schreib: "PlaywriteDESAS",
};

const COLOR = {
  brand: "#1E4A7C",
  accent: "#F4B942",
  textDark: "#1F2937",
  textMuted: "#6B7280",
  line: "#94A3B8",
  lineHelper: "#CBD5E1",
  wordGhost: "#A0AEC0",
} as const;

// Same 3-line lineature constants as letter-tracing.
// Words span the full cap-height (both bands) so we use the uppercase sizing.
const BAND_HEIGHT = 20; // pt per band
const ROW_HEIGHT = BAND_HEIGHT * 2; // 40pt total
const ROW_GAP = 14; // pt between rows inside one word group
const WORD_GAP = 24; // pt between word groups

// Ghost word sizing and vertical offset per style. Druckschrift (Playwrite
// Grund) and Schreibschrift (Playwrite DE SAS) have different metrics, so
// each needs its own tuning to sit correctly inside the 40pt lineature.
//
// Tweak per style:
//   - GHOST_FONT_SIZE: scales the glyphs. Bigger = letters fill more of
//     the lineature; smaller = letters sit lower in the band.
//   - GHOST_TOP: vertical offset within the row. More negative = type
//     moves up, less negative = type moves down.
const GHOST_FONT_SIZE: Record<LetterStyle, number> = {
  druck: 43.5,
  schreib: 43.5,
};
const GHOST_TOP: Record<LetterStyle, number> = {
  druck: -17,
  schreib: -17,
};
const OUTLINE_WORD_WIDTH = 463;

const styles = StyleSheet.create({
  page: {
    paddingTop: 56,
    paddingBottom: 64,
    paddingLeft: 56,
    paddingRight: 56,
    fontFamily: "Helvetica",
    color: COLOR.textDark,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 28,
    paddingBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  brand: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: COLOR.brand,
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  brandDomain: {
    fontSize: 8,
    color: COLOR.textMuted,
    marginTop: 2,
    marginBottom: 6,
  },
  title: {
    fontSize: 26,
    fontFamily: "Helvetica-Bold",
    color: COLOR.textDark,
  },
  subtitle: {
    fontSize: 12,
    color: COLOR.brand,
    fontFamily: "Helvetica-Bold",
    marginTop: 6,
  },
  metaCol: {
    alignItems: "flex-end",
  },
  metaLabel: {
    fontSize: 9,
    color: COLOR.textMuted,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  metaValue: {
    fontSize: 12,
    color: COLOR.textDark,
    fontFamily: "Helvetica-Bold",
    marginTop: 2,
    marginBottom: 8,
  },
  wordGroup: {
    marginBottom: WORD_GAP,
  },
  wordLabel: {
    fontSize: 8,
    color: COLOR.brand,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 4,
  },
  row: {
    position: "relative",
    height: ROW_HEIGHT,
    marginBottom: ROW_GAP,
  },
  lineTop: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: 0.5,
    backgroundColor: COLOR.line,
  },
  lineMid: {
    position: "absolute",
    left: 0,
    right: 0,
    top: BAND_HEIGHT,
    height: 0.5,
    backgroundColor: COLOR.lineHelper,
  },
  lineBottom: {
    position: "absolute",
    left: 0,
    right: 0,
    top: BAND_HEIGHT * 2,
    height: 0.5,
    backgroundColor: COLOR.line,
  },
  // Container that handles the absolute positioning. `top` is set per-render
  // based on the style (see GHOST_TOP). The Text inside renders naturally
  // from the View's left edge.
  ghostWordContainer: {
    position: "absolute",
    left: 10,
    right: 10,
  },
  ghostWord: {
    // fontSize + fontFamily set per-render based on the style.
    lineHeight: 1,
    color: COLOR.wordGhost,
  },
  footer: {
    position: "absolute",
    bottom: 22,
    left: 56,
    right: 56,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    flexDirection: "column",
    alignItems: "center",
  },
  footerLogo: {
    width: 92,
    height: 22,
  },
  footerWatermark: {
    fontSize: 7,
    color: COLOR.textMuted,
    letterSpacing: 0.5,
    marginTop: 6,
  },
});

/** Renders Playwrite SAS as vector outlines to avoid dropped initial glyphs in React-PDF text shaping. */
const OutlinedGhostWord = ({
  word,
  fontSize,
}: {
  word: string;
  fontSize: number;
}) => {
  const run = PLAYWRITE_DESAS_FONT.layout(word),
    scale = fontSize / PLAYWRITE_DESAS_FONT.unitsPerEm,
    baseline = PLAYWRITE_DESAS_FONT.ascent * scale,
    height =
      (PLAYWRITE_DESAS_FONT.ascent - PLAYWRITE_DESAS_FONT.descent) * scale + 2;

  const paths = run.glyphs.map((glyph, glyphIndex) => {
    const position = run.positions[glyphIndex],
      cursorX = run.positions
        .slice(0, glyphIndex)
        .reduce((total, current) => total + current.xAdvance, 0),
      translateX = (cursorX + position.xOffset) * scale,
      translateY = baseline - position.yOffset * scale,
      transform = `matrix(${scale} 0 0 ${-scale} ${translateX} ${translateY})`;

    return (
      <Path
        key={glyphIndex}
        d={glyph.path.toSVG()}
        fill={COLOR.wordGhost}
        transform={transform}
      />
    );
  });

  return (
    <Svg
      width={OUTLINE_WORD_WIDTH}
      height={height}
      viewBox={`0 0 ${OUTLINE_WORD_WIDTH} ${height}`}
    >
      {paths}
    </Svg>
  );
};

/** One lineatur row. First row in each group shows the ghost word; others are blank. */
const LineaturRow = ({
  word,
  isFirst,
  style,
}: {
  word: string;
  isFirst: boolean;
  style: LetterStyle;
}) => (
  <View style={styles.row} wrap={false}>
    <View style={styles.lineTop} />
    <View style={styles.lineMid} />
    <View style={styles.lineBottom} />
    {isFirst && (
      <View style={[styles.ghostWordContainer, { top: GHOST_TOP[style] }]}>
        {style === "schreib" ? (
          <OutlinedGhostWord word={word} fontSize={GHOST_FONT_SIZE[style]} />
        ) : (
          <OutlinedGrundText
            text={word}
            fontSize={GHOST_FONT_SIZE[style]}
            color={COLOR.wordGhost}
            lineHeight={1}
          />
        )}
      </View>
    )}
  </View>
);

/** Word group: optional small label + N practice rows. */
const WordBlock = ({
  block,
  style,
}: {
  block: WoerterBlock;
  style: LetterStyle;
}) => {
  const rows = Array.from({ length: block.lines }, (_, i) => i);
  return (
    <View style={styles.wordGroup} wrap={false}>
      <Text style={styles.wordLabel}>{block.word}</Text>
      {rows.map((i) => (
        <LineaturRow
          key={i}
          word={block.word}
          isFirst={i === 0}
          style={style}
        />
      ))}
    </View>
  );
};

const WoerterDocument = ({
  childName,
  date,
  blocks,
  theme,
  style,
  showWatermark,
}: WoerterPdfProps): ReactElement => {
  const themeMeta = getTheme(theme),
    styleLabel = STYLE_LABELS[style];
  return (
    <Document
      title={`Woerter abschreiben fuer ${childName}`}
      author="Lernikon"
      creator="Lernikon"
      producer="Lernikon"
    >
      <Page size="A4" style={styles.page}>
<ThemeDecoration theme={themeMeta} />

        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>Lernikon</Text>
            <Text style={styles.brandDomain}>lernikon.de</Text>
            <Text style={styles.title}>Wörter abschreiben</Text>
            <Text style={styles.subtitle}>
              {styleLabel} · Abschreiben mit Lineatur
            </Text>
          </View>
          <View style={styles.metaCol}>
            <Text style={styles.metaLabel}>Name</Text>
            <Text style={styles.metaValue}>{childName}</Text>
            <Text style={styles.metaLabel}>Datum</Text>
            <Text style={styles.metaValue}>{date}</Text>
          </View>
        </View>

        {blocks.map((block, i) => (
          <WordBlock key={i} block={block} style={style} />
        ))}

        <View style={styles.footer} fixed>
          <Image src={LOGO_LOCKUP_BUFFER} style={styles.footerLogo} />
          {showWatermark && (
            <Text style={styles.footerWatermark}>
              Kostenfreie Version von lernikon.de · Family Pro entsperrt alle Themes
            </Text>
          )}
        </View>
      </Page>
    </Document>
  );
};

/** Renders the Woerter-abschreiben worksheet to a Node.js readable stream. */
export const renderWoerterPdf = async (props: WoerterPdfProps) => {
  return renderToStream(<WoerterDocument {...props} />);
};
