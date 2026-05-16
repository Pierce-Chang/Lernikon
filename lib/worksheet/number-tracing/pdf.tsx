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
import type { NumberBlock, NumberTracingSheet } from "./generate";
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

// Playwrite DE Grund: German printed Grundschrift used in Vorschule / Klasse 1.
// Digits only have one form so we don't need the SAS (cursive) variant.
Font.register({
  family: "PlaywriteDEGrund",
  src: path.join(
    process.cwd(),
    "public",
    "fonts",
    "PlaywriteDEGrund-Regular.ttf",
  ),
});

export interface NumberTracingPdfProps {
  childName: string;
  date: string;
  sheet: NumberTracingSheet;
  theme: ThemeId;
  showWatermark: boolean;
}

const COLOR = {
  brand: "#1E4A7C",
  accent: "#F4B942",
  textDark: "#1F2937",
  textMuted: "#6B7280",
  line: "#94A3B8",
  lineHelper: "#CBD5E1",
  digitGhost: "#A0AEC0",
} as const;

// Schreiblernlineatur — 3 lines, 2 bands (same structure as letter-tracing):
//   line 1 = top (cap-height top)
//   line 2 = mid-helper (lighter)
//   line 3 = baseline
// Digits span the full two-band height, matching uppercase letters.
const BAND_HEIGHT = 20;
const ROW_HEIGHT = BAND_HEIGHT * 2;
const ROW_GAP = 28;

// Ghost digit sizing — same starting values as ghostLetterUpper in letter-tracing,
// confirmed to align Playwrite DE Grund glyphs between top and baseline lines.
const GHOST_FONT_SIZE = 42;
const GHOST_TOP = -16;

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
  ghostDigit: {
    position: "absolute",
    left: 10,
    lineHeight: 1,
    fontFamily: "PlaywriteDEGrund",
    color: COLOR.digitGhost,
    top: GHOST_TOP,
    fontSize: GHOST_FONT_SIZE,
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

const LineaturRow = ({ digit }: { digit: string }) => (
  <View style={styles.row} wrap={false}>
    <View style={styles.lineTop} />
    <View style={styles.lineMid} />
    <View style={styles.lineBottom} />
    <Text style={styles.ghostDigit}>{digit}</Text>
  </View>
);

const Block = ({ block }: { block: NumberBlock }) => {
  const rows = Array.from({ length: block.lines }, (_, i) => i);
  return (
    <View wrap={false}>
      <Text style={styles.blockHeader}>Ziffer {block.digit}</Text>
      {rows.map((i) => (
        <LineaturRow key={i} digit={block.digit} />
      ))}
    </View>
  );
};

const NumberTracingDocument = ({
  childName,
  date,
  sheet,
  theme,
  showWatermark,
}: NumberTracingPdfProps): ReactElement => {
  const themeMeta = getTheme(theme);
  return (
    <Document
      title={`Zahlen schreiben für ${childName}`}
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
            <Text style={styles.title}>Zahlen schreiben</Text>
            <Text style={styles.subtitle}>
              Druckschrift · Spurschrift mit Lineatur
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
          <Block key={i} block={block} />
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

export const renderNumberTracingPdf = async (
  props: NumberTracingPdfProps,
) => {
  return renderToStream(<NumberTracingDocument {...props} />);
};
