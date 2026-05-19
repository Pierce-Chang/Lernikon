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
import type { VokabelnSheet, VocabularyEntry } from "./generate";
import type { Schrift } from "./config";
import { BUCKET_LABELS } from "./config";
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

// PlaywriteDEGrund for the "Schulschrift" mode. English words are ASCII-only
// so the Grund umlaut-combining-mark bug does not apply here.
Font.register({
  family: "PlaywriteDEGrund",
  src: path.join(
    process.cwd(),
    "public",
    "fonts",
    "PlaywriteDEGrund-Regular.ttf",
  ),
});

export interface VokabelnPdfProps {
  childName: string;
  date: string;
  sheet: VokabelnSheet;
  theme: ThemeId;
  schrift: Schrift;
  bucketLabels: string[];
  showWatermark: boolean;
}

const COLOR = {
  brand: "#1E4A7C",
  accent: "#F4B942",
  textDark: "#1F2937",
  textMuted: "#6B7280",
  line: "#94A3B8",
  lineHelper: "#CBD5E1",
  wordGhost: "#A0AEC0",
} as const;

// Same 3-line lineature constants as letter-tracing and woerter-abschreiben.
const BAND_HEIGHT = 20, // pt per band
  ROW_HEIGHT = BAND_HEIGHT * 2, // 40pt total
  ROW_GAP = 8, // pt between rows inside one word block
  WORD_GAP = 20; // pt between word blocks

// Ghost word font sizing for each schrift option.
// PlaywriteDEGrund uses the same values as in woerter-abschreiben.
// Helvetica-Bold is slightly taller for the same point size, so we reduce it
// slightly to keep the ghost text comfortably inside the 40pt lineature.
const GHOST_FONT_SIZE: Record<Schrift, number> = {
  helvetica: 28,
  "playwrite-grund": 43.5,
};
const GHOST_TOP: Record<Schrift, number> = {
  helvetica: -2,
  "playwrite-grund": -17,
};
const GHOST_FONT_FAMILY: Record<Schrift, string> = {
  helvetica: "Helvetica-Bold",
  "playwrite-grund": "PlaywriteDEGrund",
};

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
  ghostWordContainer: {
    position: "absolute",
    left: 10,
    right: 10,
  },
  ghostWord: {
    lineHeight: 1,
    color: COLOR.wordGhost,
  },
  germanLine: {
    fontSize: 9,
    color: COLOR.textMuted,
    fontFamily: "Helvetica",
    marginTop: 3,
    marginBottom: 4,
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

/** One lineature row. First row in each group shows the ghost word; others are blank. */
const LineaturRow = ({
  word,
  isFirst,
  schrift,
}: {
  word: string;
  isFirst: boolean;
  schrift: Schrift;
}) => (
  <View style={styles.row} wrap={false}>
    <View style={styles.lineTop} />
    <View style={styles.lineMid} />
    <View style={styles.lineBottom} />
    {isFirst && (
      <View style={[styles.ghostWordContainer, { top: GHOST_TOP[schrift] }]}>
        <Text
          style={[
            styles.ghostWord,
            {
              fontFamily: GHOST_FONT_FAMILY[schrift],
              fontSize: GHOST_FONT_SIZE[schrift],
            },
          ]}
        >
          {word}
        </Text>
      </View>
    )}
  </View>
);

/** One vocabulary block: N practice rows above the German translation line. */
const WordBlock = ({
  entry,
  linesPerWord,
  schrift,
}: {
  entry: VocabularyEntry;
  linesPerWord: number;
  schrift: Schrift;
}) => {
  const rows = Array.from({ length: linesPerWord }, (_, i) => i);
  return (
    <View style={styles.wordGroup} wrap={false}>
      {rows.map((i) => (
        <LineaturRow
          key={i}
          word={entry.english}
          isFirst={i === 0}
          schrift={schrift}
        />
      ))}
      <Text style={styles.germanLine}>{entry.german}</Text>
    </View>
  );
};

const VokabelnDocument = ({
  childName,
  date,
  sheet,
  theme,
  schrift,
  bucketLabels,
  showWatermark,
}: VokabelnPdfProps): ReactElement => {
  const themeMeta = getTheme(theme);
  return (
    <Document
      title={`Englisch Vokabeln für ${childName}`}
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
            <Text style={styles.title}>Englisch Vokabeln</Text>
            <Text style={styles.subtitle}>{bucketLabels.join(", ")}</Text>
          </View>
          <View style={styles.metaCol}>
            <Text style={styles.metaLabel}>Name</Text>
            <Text style={styles.metaValue}>{childName}</Text>
            <Text style={styles.metaLabel}>Datum</Text>
            <Text style={styles.metaValue}>{date}</Text>
          </View>
        </View>

        {sheet.items.map((entry, i) => (
          <WordBlock
            key={i}
            entry={entry}
            linesPerWord={sheet.linesPerWord}
            schrift={schrift}
          />
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

/** Renders the Vokabeln-abschreiben worksheet to a Node.js readable stream. */
export const renderVokabelnPdf = async (props: VokabelnPdfProps) => {
  return renderToStream(<VokabelnDocument {...props} />);
};
