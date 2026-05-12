import fs from "node:fs";
import path from "node:path";
import {
  Document,
  Font,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
  renderToStream,
} from "@react-pdf/renderer";
import type { ReactElement } from "react";
import type { LetterBlock, LetterTracingSheet } from "./generate";
import type { LetterStyle } from "./config";
import { getTheme, type ThemeId } from "@/lib/themes";
import { ThemeDecoration } from "../theme-decoration";

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

// School-typography fonts (both OFL via Google Fonts):
//
//   PlaywriteDEGrund — German printed Grundschrift, Vorschule / 1. Klasse.
//                      Single-storey a/g, schoolbook letter shapes.
//   PlaywriteDESAS   — Schulausgangsschrift, the cursive taught from
//                      2. Klasse onwards. Fully connected handwriting.
//
// The form picks which one to render via the `style` prop.
Font.register({
  family: "PlaywriteDEGrund",
  src: path.join(
    process.cwd(),
    "public",
    "fonts",
    "PlaywriteDEGrund-Regular.ttf",
  ),
});
Font.register({
  family: "PlaywriteDESAS",
  src: path.join(
    process.cwd(),
    "public",
    "fonts",
    "PlaywriteDESAS-Regular.ttf",
  ),
});

export interface LetterTracingPdfProps {
  childName: string;
  date: string;
  sheet: LetterTracingSheet;
  theme: ThemeId;
  style: LetterStyle;
  showWatermark: boolean;
}

const STYLE_FONT_FAMILY: Record<LetterStyle, string> = {
  druck: "PlaywriteDEGrund",
  schreib: "PlaywriteDESAS",
};

const STYLE_LABEL: Record<LetterStyle, string> = {
  druck: "Druckschrift",
  schreib: "Schreibschrift",
};

const COLOR = {
  brand: "#1E4A7C",
  accent: "#F4B942",
  textDark: "#1F2937",
  textMuted: "#6B7280",
  line: "#94A3B8", // Lineatur lines — visible but not heavy
  lineHelper: "#CBD5E1", // optional upper-mid helper line (lighter)
  letterGhost: "#A0AEC0", // ghost letter — darkened so strokes feel solid
} as const;

// Schreiblernlineatur — 3 lines forming 2 bands (Vorschule / Klasse 1 Standard):
//   line 1 = top of letter (cap-height top)
//   line 2 = through the middle of the letter (x-height top for lowercase)
//   line 3 = baseline (letter sits here)
// Uppercase glyphs span top → baseline (both bands).
// Lowercase glyphs sit in the lower band only (between mid line and baseline)
// — ascenders like "b" / "l" / "t" naturally extend a bit above the mid line,
// which matches Schreiblernheft typography.
const BAND_HEIGHT = 20; // pt per band
const ROW_HEIGHT = BAND_HEIGHT * 2; // 40pt total
const ROW_GAP = 28; // pt between rows — wide enough that the next row's
//                    top line doesn't look like a 4th line of the current
//                    row's lineatur
// Empirically tuned against PNG previews from scripts/preview-letter-pdf.ts.
// Playwrite's line-height baseline differs from Helvetica's; we pin
// `lineHeight: 1` on the ghost glyph to keep the text-box exactly = fontSize
// and make `top` predictable.
const GHOST_FONT_SIZE_UPPER = 42;
const GHOST_TOP_UPPER = -16;
const GHOST_FONT_SIZE_LOWER = 36;
const GHOST_TOP_LOWER = -8.5;

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
  topAccent: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 6,
    backgroundColor: COLOR.brand,
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
  blockHeader: {
    fontSize: 11,
    color: COLOR.brand,
    fontFamily: "Helvetica-Bold",
    marginTop: 14,
    marginBottom: 6,
  },
  row: {
    position: "relative",
    height: ROW_HEIGHT,
    marginBottom: ROW_GAP,
  },
  // 3 horizontal lines forming the Schreiblernlineatur. 0.5pt for crisp print.
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
  ghostLetterBase: {
    position: "absolute",
    left: 10,
    lineHeight: 1,
    // fontFamily is set per-render based on the chosen `style`. The base
    // here only carries position + colour.
    color: COLOR.letterGhost,
  },
  ghostLetterUpper: {
    top: GHOST_TOP_UPPER,
    fontSize: GHOST_FONT_SIZE_UPPER,
  },
  ghostLetterLower: {
    top: GHOST_TOP_LOWER,
    fontSize: GHOST_FONT_SIZE_LOWER,
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

const LineaturRow = ({
  char,
  displayCase,
  fontFamily,
}: {
  char: string;
  displayCase: "upper" | "lower";
  fontFamily: string;
}) => {
  const sizeStyle =
    displayCase === "upper" ? styles.ghostLetterUpper : styles.ghostLetterLower;
  return (
    <View style={styles.row} wrap={false}>
      <View style={styles.lineTop} />
      <View style={styles.lineMid} />
      <View style={styles.lineBottom} />
      <Text style={[styles.ghostLetterBase, sizeStyle, { fontFamily }]}>
        {char}
      </Text>
    </View>
  );
};

const Block = ({
  block,
  fontFamily,
}: {
  block: LetterBlock;
  fontFamily: string;
}) => {
  const caseLabel = block.displayCase === "upper" ? "Großbuchstabe" : "Kleinbuchstabe";
  const rows = Array.from({ length: block.lines }, (_, i) => i);
  return (
    <View wrap={false}>
      <Text style={styles.blockHeader}>
        {caseLabel} {block.char}
      </Text>
      {rows.map((i) => (
        <LineaturRow
          key={i}
          char={block.char}
          displayCase={block.displayCase}
          fontFamily={fontFamily}
        />
      ))}
    </View>
  );
};

const LetterTracingDocument = ({
  childName,
  date,
  sheet,
  theme,
  style,
  showWatermark,
}: LetterTracingPdfProps): ReactElement => {
  const themeMeta = getTheme(theme),
    fontFamily = STYLE_FONT_FAMILY[style],
    styleLabel = STYLE_LABEL[style];
  return (
  <Document
    title={`Buchstaben schreiben für ${childName}`}
    author="Lernikon"
    creator="Lernikon"
    producer="Lernikon"
  >
    <Page size="A4" style={styles.page}>
      <View style={styles.topAccent} fixed />
      <ThemeDecoration theme={themeMeta} />

      <View style={styles.header}>
        <View>
          <Text style={styles.brand}>Lernikon</Text>
          <Text style={styles.brandDomain}>lernikon.de</Text>
          <Text style={styles.title}>Buchstaben schreiben</Text>
          <Text style={styles.subtitle}>
            {styleLabel} · Spurschrift mit Lineatur
          </Text>
        </View>
        <View style={styles.metaCol}>
          <Text style={styles.metaLabel}>Name</Text>
          <Text style={styles.metaValue}>{childName}</Text>
          <Text style={styles.metaLabel}>Datum</Text>
          <Text style={styles.metaValue}>{date}</Text>
        </View>
      </View>

      {sheet.blocks.map((block, i) => (
        <Block key={i} block={block} fontFamily={fontFamily} />
      ))}

      <View style={styles.footer} fixed>
        <Image src={LOGO_LOCKUP_BUFFER} style={styles.footerLogo} />
        {showWatermark && (
          <Text style={styles.footerWatermark}>Kostenlose Version</Text>
        )}
      </View>
    </Page>
  </Document>
  );
};

export const renderLetterTracingPdf = async (props: LetterTracingPdfProps) => {
  return renderToStream(<LetterTracingDocument {...props} />);
};
