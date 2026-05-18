import fs from "node:fs";
import path from "node:path";
import {
  Document,
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
// count=6 uses width 100 → height = 100 * (717/835) ≈ 86
// count=10 uses width 70  → height = 70  * (717/835) ≈ 60
const ASPECT_RATIO = 717 / 835;

const CELL_LAYOUT = {
  6: {
    imageWidth: 100,
    imageHeight: Math.round(100 * ASPECT_RATIO),
    fontSize: 72,
    cols: 2,
    rows: 3,
  },
  10: {
    imageWidth: 70,
    imageHeight: Math.round(70 * ASPECT_RATIO),
    fontSize: 52,
    cols: 2,
    rows: 5,
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
      <Text style={styles.title}>Zahlen mit Marienkaefern</Text>
      <Text style={styles.subtitle}>
        Vorschule - Mathe - Zahlen erkennen und Mengen darstellen
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
 * One cell: ladybird image on the left third, digit on the right two-thirds.
 * The outer border forms a table together with neighbouring cells by using
 * borderWidth:1 on each cell with marginLeft:-1, marginTop:-1 to collapse
 * the shared borders.
 */
const TaskCell = ({
  number,
  imageWidth,
  imageHeight,
  fontSize,
  cellWidth,
  cellHeight,
}: {
  number: number;
  imageWidth: number;
  imageHeight: number;
  fontSize: number;
  cellWidth: number;
  cellHeight: number;
}) => (
  <View
    wrap={false}
    style={{
      width: cellWidth,
      height: cellHeight,
      borderWidth: 1,
      borderColor: COLOR.navy,
      marginLeft: -1,
      marginTop: -1,
      flexDirection: "row",
      alignItems: "center",
      paddingLeft: 12,
      paddingRight: 12,
    }}
  >
    {/* Left third: ladybird image */}
    <View
      style={{
        width: imageWidth + 12,
        alignItems: "flex-start",
        justifyContent: "center",
      }}
    >
      <Image
        src={MARIENKAEFER_BUFFER}
        style={{ width: imageWidth, height: imageHeight }}
      />
    </View>

    {/* Right portion: digit */}
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text
        style={{
          fontFamily: "Helvetica-Bold",
          fontSize,
          color: COLOR.navy,
        }}
      >
        {String(number)}
      </Text>
    </View>
  </View>
);

const MarienkaeferDocument = ({
  childName,
  date,
  sheet,
  theme,
  showWatermark,
}: MarienkaeferPdfProps): ReactElement => {
  const themeMeta = getTheme(theme),
    layout = CELL_LAYOUT[sheet.count as 6 | 10],
    // Usable width: A4 595 - 2*52 padding = 491pt
    // Two columns with collapsed borders: each cell gets half the usable width + 1 for border overlap
    cellWidth = Math.floor((491 + 1) / layout.cols),
    // Usable height between header and footer: approximately 680 - header(~90) - footer(~50) = ~540
    // Distribute across rows with some padding
    cellHeight = Math.floor(440 / layout.rows);

  return (
    <Document
      title={`Zahlen mit Marienkaefern fur ${childName}`}
      author="Lernikon"
      creator="Lernikon"
      producer="Lernikon"
    >
      <Page size="A4" style={styles.page}>
        <ThemeDecoration theme={themeMeta} />

        <PageHeader childName={childName} date={date} />

        <Text style={styles.instruction}>
          Male auf jeden Marienkaefer so viele Punkte, wie die Zahl rechts
          daneben zeigt.
        </Text>

        {/* Table grid: outer wrapper adds 1pt offset so first row/col borders sit flush */}
        <View
          style={{
            marginLeft: 1,
            marginTop: 1,
            flexDirection: "row",
            flexWrap: "wrap",
          }}
        >
          {sheet.numbers.map((num, i) => (
            <TaskCell
              key={i}
              number={num}
              imageWidth={layout.imageWidth}
              imageHeight={layout.imageHeight}
              fontSize={layout.fontSize}
              cellWidth={cellWidth}
              cellHeight={cellHeight}
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
