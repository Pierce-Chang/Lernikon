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
import type { WortartenSheet, WortartenItem } from "./generate";
import type { Wortart } from "./corpus";
import { getTheme, type ThemeId } from "@/lib/themes";
import { ThemeDecoration } from "@/lib/worksheet/theme-decoration";

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

const COLOR = {
  brand: "#1E4A7C",
  accent: "#F4B942",
  textDark: "#1F2937",
  textMuted: "#6B7280",
  line: "#E5E7EB",
} as const;

/** Column header labels and their corresponding wortart key. */
const COLUMNS: Array<{ label: string; wortart: Wortart }> = [
  { label: "Nomen", wortart: "nomen" },
  { label: "Verb", wortart: "verb" },
  { label: "Adjektiv", wortart: "adjektiv" },
];

/** Width (pt) of each checkbox cell column. */
const CHECKBOX_COL_WIDTH = 52;
/** Size of each checkbox square. */
const CHECKBOX_SIZE = 13;

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
    marginBottom: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLOR.line,
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
    fontSize: 11,
    color: COLOR.brand,
    fontFamily: "Helvetica-Bold",
    marginTop: 5,
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
  // Table
  table: {
    flexDirection: "row",
  },
  // Left column: word list
  wordCol: {
    width: 130,
    paddingRight: 8,
  },
  // Right columns: one per wortart
  checkboxCol: {
    width: CHECKBOX_COL_WIDTH,
    alignItems: "center",
  },
  // Column header row
  tableHead: {
    flexDirection: "row",
    marginBottom: 6,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: COLOR.line,
  },
  colHeaderWord: {
    width: 130,
  },
  colHeaderText: {
    width: CHECKBOX_COL_WIDTH,
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: COLOR.brand,
    textAlign: "center",
  },
  // Data row
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 5,
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  rowNumber: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: COLOR.brand,
    width: 22,
    flexShrink: 0,
  },
  rowWord: {
    fontSize: 13,
    color: COLOR.textDark,
    fontFamily: "Helvetica",
    flex: 1,
  },
  // Empty checkbox
  checkbox: {
    width: CHECKBOX_SIZE,
    height: CHECKBOX_SIZE,
    borderWidth: 1,
    borderColor: COLOR.brand,
  },
  // Filled checkbox (solution)
  checkboxFilled: {
    width: CHECKBOX_SIZE,
    height: CHECKBOX_SIZE,
    backgroundColor: COLOR.brand,
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

/** One data row with a word and three checkbox cells. */
const TableRow = ({
  item,
  showSolution,
}: {
  item: WortartenItem;
  showSolution: boolean;
}): ReactElement => (
  <View style={styles.tableRow} wrap={false}>
    <View style={styles.wordCol}>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <Text style={styles.rowNumber}>{item.id}.</Text>
        <Text style={styles.rowWord}>{item.word}</Text>
      </View>
    </View>
    {COLUMNS.map((col) => (
      <View key={col.wortart} style={styles.checkboxCol}>
        {showSolution && item.wortart === col.wortart ? (
          <View style={styles.checkboxFilled} />
        ) : (
          <View style={styles.checkbox} />
        )}
      </View>
    ))}
  </View>
);

/** Column header row — shown once above the item list. */
const TableHead = (): ReactElement => (
  <View style={styles.tableHead}>
    <View style={styles.colHeaderWord} />
    {COLUMNS.map((col) => (
      <Text key={col.wortart} style={styles.colHeaderText}>
        {col.label}
      </Text>
    ))}
  </View>
);

export interface WortartenPdfProps {
  childName: string;
  date: string;
  sheet: WortartenSheet;
  theme: ThemeId;
  showWatermark: boolean;
  includeSolutions: boolean;
}

const WortartenDocument = ({
  childName,
  date,
  sheet,
  theme,
  showWatermark,
  includeSolutions,
}: WortartenPdfProps): ReactElement => {
  const themeMeta = getTheme(theme);

  return (
    <Document
      title={`Wortarten fuer ${childName}`}
      author="Lernikon"
      creator="Lernikon"
      producer="Lernikon"
    >
      {/* Page 1 — Aufgabenblatt */}
      <Page size="A4" style={styles.page}>
        <View style={styles.topAccent} fixed />
        <ThemeDecoration theme={themeMeta} />

        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>Lernikon</Text>
            <Text style={styles.brandDomain}>lernikon.de</Text>
            <Text style={styles.title}>Wortarten erkennen</Text>
            <Text style={styles.subtitle}>Kreuze die richtige Wortart an.</Text>
          </View>
          <View style={styles.metaCol}>
            <Text style={styles.metaLabel}>Name</Text>
            <Text style={styles.metaValue}>{childName}</Text>
            <Text style={styles.metaLabel}>Datum</Text>
            <Text style={styles.metaValue}>{date}</Text>
          </View>
        </View>

        <View style={styles.table}>
          <View style={{ flex: 1 }}>
            <TableHead />
            {sheet.items.map((item) => (
              <TableRow key={item.id} item={item} showSolution={false} />
            ))}
          </View>
        </View>

        <View style={styles.footer} fixed>
          <Image src={LOGO_LOCKUP_BUFFER} style={styles.footerLogo} />
          {showWatermark && (
            <Text style={styles.footerWatermark}>
              Kostenfreie Version von lernikon.de - Family Pro entsperrt alle Themes
            </Text>
          )}
        </View>
      </Page>

      {/* Page 2 — Losungsblatt (optional) */}
      {includeSolutions && (
        <Page size="A4" style={styles.page}>
          <View style={styles.topAccent} fixed />
          <ThemeDecoration theme={themeMeta} />

          <View style={styles.header}>
            <View>
              <Text style={styles.brand}>Lernikon</Text>
              <Text style={styles.brandDomain}>lernikon.de</Text>
              <Text style={styles.title}>Losungen</Text>
              <Text style={styles.subtitle}>Wortarten erkennen - Klasse 2</Text>
            </View>
            <View style={styles.metaCol}>
              <Text style={styles.metaLabel}>Name</Text>
              <Text style={styles.metaValue}>{childName}</Text>
              <Text style={styles.metaLabel}>Datum</Text>
              <Text style={styles.metaValue}>{date}</Text>
            </View>
          </View>

          <View style={styles.table}>
            <View style={{ flex: 1 }}>
              <TableHead />
              {sheet.items.map((item) => (
                <TableRow key={item.id} item={item} showSolution={true} />
              ))}
            </View>
          </View>

          <View style={styles.footer} fixed>
            <Image src={LOGO_LOCKUP_BUFFER} style={styles.footerLogo} />
            {showWatermark && (
              <Text style={styles.footerWatermark}>
                Kostenfreie Version von lernikon.de - Family Pro entsperrt alle Themes
              </Text>
            )}
          </View>
        </Page>
      )}
    </Document>
  );
};

/** Renders the Wortarten worksheet to a Node.js readable stream. */
export const renderWortartenPdf = async (
  props: WortartenPdfProps,
): Promise<NodeJS.ReadableStream> =>
  renderToStream(<WortartenDocument {...props} />);
