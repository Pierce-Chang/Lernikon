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
import type { MarienkaeferSheet } from "./generate";
import { getTheme, type ThemeId } from "@/lib/themes";
import { ThemeDecoration } from "../theme-decoration";

// Load logo lockup and marienkaefer asset once at module init.
// React-PDF cannot fetch local filesystem paths — buffers must be passed directly.
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

const MARIENKAEFER_BUFFER = fs.readFileSync(
  path.join(
    process.cwd(),
    "public",
    "images",
    "blacknwhite",
    "blacknwhite_marienkaefer_ohne_punkte.png",
  ),
);

// Kid-display font: single-storey German schoolbook print script (Grundschrift).
// Multi-char <Text> renders cleanly — no shaping bug unlike PlaywriteDESAS.
Font.register({
  family: "PlaywriteDEGrund",
  src: path.join(
    process.cwd(),
    "public",
    "fonts",
    "PlaywriteDEGrund-Regular.ttf",
  ),
});

export interface MarienkaeferPdfProps {
  childName: string;
  date: string;
  sheet: MarienkaeferSheet;
  theme: ThemeId;
  showWatermark: boolean;
}

// ── Brand palette ─────────────────────────────────────────────────────────────
const COLOR = {
  navy: "#1E4A7C",
  textDark: "#1F2937",
  textMuted: "#6B7280",
  line: "#E5E7EB",
} as const;

// Natural dimensions of the marienkaefer PNG: 835 x 717.
const ASPECT_RATIO = 717 / 835;

// ── Layout-Tuning ─────────────────────────────────────────────────────────────
// Founder-tweakable Größen pro count-Variante.
//
// imageWidth = PNG-Breite des Marienkäfers in Punkten.
// imageHeight = wird aus ASPECT_RATIO (717/835) berechnet, NICHT manuell setzen.
// fontSize = Ziffergröße. Beachte: "10" braucht ~1.1 × fontSize Breite in
//            der digit-Cell. digitColWidth muss daher >= 1.1 × fontSize + Margin.
// bugColWidth / rowHeight ≈ 1:1 für quadratische Bug-Cells.
// digitPaddingBottom = schiebt die zentrierte Ziffer optisch nach oben (gegen
//                      Descender-Clipping bei engen rowHeight-Werten).
//
// 4-Spalten-Row-Budget: 2 × (bugColWidth + digitColWidth) muss <= 491pt sein
// (A4 595pt - 2×52pt Padding). Body-Höhe-Budget: rows × rowHeight muss
// <= ~500pt sein (Page minus Header, Instruction, Footer).
const CELL_LAYOUT = {
  6: {
    imageWidth: 145,                                       // <- Bug-Größe count=6 tweaken
    imageHeight: Math.round(145 * ASPECT_RATIO),
    fontSize: 60,                                          // <- Ziffer-Größe count=6
    rows: 3,
    bugColWidth: 155,
    digitColWidth: 90,
    rowHeight: 160,
    digitPaddingBottom: 34,                                 // <- Ziffer nach oben schieben count=6
  },
  10: {
    imageWidth: 100,                                       // <- Bug-Größe count=10 tweaken
    imageHeight: Math.round(100 * ASPECT_RATIO),
    fontSize: 60,                                          // <- Ziffer-Größe count=10
    rows: 5,
    bugColWidth: 120,
    digitColWidth: 125,
    rowHeight: 110,
    digitPaddingBottom: 46,                                // <- Ziffer nach oben schieben count=10
  },
} as const;

const styles = StyleSheet.create({
  page: {
    paddingTop: 56,
    paddingBottom: 64,
    paddingLeft: 52,
    paddingRight: 52,
    fontFamily: "Helvetica",
    color: COLOR.textDark,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLOR.line,
  },
  brand: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: COLOR.navy,
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
    color: COLOR.navy,
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
  instruction: {
    fontSize: 14,
    color: COLOR.navy,
    fontFamily: "Helvetica-Bold",
    marginBottom: 16,
  },
  footer: {
    position: "absolute",
    bottom: 22,
    left: 52,
    right: 52,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLOR.line,
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

const PageHeader = ({
  childName,
  date,
}: {
  childName: string;
  date: string;
}) => (
  <View style={styles.header}>
    <View>
      <Text style={styles.brand}>Lernikon</Text>
      <Text style={styles.brandDomain}>lernikon.de</Text>
      <Text style={styles.title}>Zählen mit Marienkäfern</Text>
      <Text style={styles.subtitle}>
        Vorschule · Mathe · Zahlen erkennen und Mengen darstellen
      </Text>
    </View>
    <View style={styles.metaCol}>
      <Text style={styles.metaLabel}>Name</Text>
      <Text style={styles.metaValue}>{childName}</Text>
      <Text style={styles.metaLabel}>Datum</Text>
      <Text style={styles.metaValue}>{date}</Text>
    </View>
  </View>
);

const PageFooter = ({ showWatermark }: { showWatermark: boolean }) => (
  <View style={styles.footer} fixed>
    <Image src={LOGO_LOCKUP_BUFFER} style={styles.footerLogo} />
    {showWatermark && (
      <Text style={styles.footerWatermark}>
        Kostenfreie Version von lernikon.de - Family Pro entsperrt alle Themes
      </Text>
    )}
  </View>
);

/**
 * One row of the 4-column table: [bug cell | digit cell | bug cell | digit cell].
 * Each cell has its own border; marginLeft:-1 / marginTop:-1 collapses shared borders.
 */
const TaskRow = ({
  leftNum,
  rightNum,
  imageWidth,
  imageHeight,
  fontSize,
  bugColWidth,
  digitColWidth,
  rowHeight,
  digitPaddingBottom,
}: {
  leftNum: number;
  rightNum: number;
  imageWidth: number;
  imageHeight: number;
  fontSize: number;
  bugColWidth: number;
  digitColWidth: number;
  rowHeight: number;
  digitPaddingBottom: number;
}) => {
  const cellBase = {
    borderWidth: 1,
    borderColor: COLOR.navy,
    marginLeft: -1,
    marginTop: -1,
    flexShrink: 0,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  };

  return (
    <View wrap={false} style={{ flexDirection: "row" }}>
      {/* Left bug cell */}
      <View style={{ ...cellBase, width: bugColWidth, height: rowHeight }}>
        <Image
          src={MARIENKAEFER_BUFFER}
          style={{ width: imageWidth, height: imageHeight }}
        />
      </View>

      {/* Left digit cell */}
      <View style={{ ...cellBase, width: digitColWidth, height: rowHeight, paddingBottom: digitPaddingBottom }}>
        <Text
          style={{
            fontFamily: "PlaywriteDEGrund",
            fontSize: fontSize + 2,
            lineHeight: 1,
            color: COLOR.navy,
          }}
        >
          {String(leftNum)}
        </Text>
      </View>

      {/* Right bug cell */}
      <View style={{ ...cellBase, width: bugColWidth, height: rowHeight }}>
        <Image
          src={MARIENKAEFER_BUFFER}
          style={{ width: imageWidth, height: imageHeight }}
        />
      </View>

      {/* Right digit cell */}
      <View style={{ ...cellBase, width: digitColWidth, height: rowHeight, paddingBottom: digitPaddingBottom }}>
        <Text
          style={{
            fontFamily: "PlaywriteDEGrund",
            fontSize: fontSize + 2,
            lineHeight: 1,
            color: COLOR.navy,
          }}
        >
          {String(rightNum)}
        </Text>
      </View>
    </View>
  );
};

const MarienkaeferDocument = ({
  childName,
  date,
  sheet,
  theme,
  showWatermark,
}: MarienkaeferPdfProps): ReactElement => {
  const themeMeta = getTheme(theme),
    layout = CELL_LAYOUT[sheet.count as 6 | 10],
    // Pair up numbers into rows of 2 for the 4-column layout.
    rows: [number, number][] = [];

  for (let i = 0; i < sheet.numbers.length; i += 2) {
    rows.push([sheet.numbers[i], sheet.numbers[i + 1] ?? 0]);
  }

  return (
    <Document
      title={`Zählen mit Marienkäfern fur ${childName}`}
      author="Lernikon"
      creator="Lernikon"
      producer="Lernikon"
    >
      <Page size="A4" style={styles.page}>
        <ThemeDecoration theme={themeMeta} />

        <PageHeader childName={childName} date={date} />

        <Text style={styles.instruction}>
          Male auf jeden Marienkäfer so viele Punkte, wie die Zahl rechts
          daneben zeigt.
        </Text>

        {/* Table grid: outer wrapper adds 1pt offset so first row/col borders sit flush */}
        <View style={{ marginLeft: 1, marginTop: 1 }}>
          {rows.map(([left, right], i) => (
            <TaskRow
              key={i}
              leftNum={left}
              rightNum={right}
              imageWidth={layout.imageWidth}
              imageHeight={layout.imageHeight}
              fontSize={layout.fontSize}
              bugColWidth={layout.bugColWidth}
              digitColWidth={layout.digitColWidth}
              rowHeight={layout.rowHeight}
              digitPaddingBottom={layout.digitPaddingBottom}
            />
          ))}
        </View>

        <PageFooter showWatermark={showWatermark} />
      </Page>
    </Document>
  );
};

/** Renders the Marienkaefer worksheet to a Node Readable stream. */
export const renderMarienkaeferPdf = async (props: MarienkaeferPdfProps) =>
  renderToStream(<MarienkaeferDocument {...props} />);
