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
import type { Problem } from "./generate";
import { operationLabel, type OperationLike } from "./config";
import { getTheme, type ThemeId } from "@/lib/themes";
import { ThemeDecoration } from "./theme-decoration";

// React-PDF tries to fetch any string passed to `<Image src>` as a URL, so a
// local filesystem path silently fails. Load the bytes once at module-init
// and reuse the buffer for every render.
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

// Playwrite DE Grund — the German Grundschrift kids learn to write in
// Klasse 1. Used for the math problems themselves so the worksheet matches
// the schoolbook style children copy from.
Font.register({
  family: "PlaywriteDEGrund",
  src: path.join(
    process.cwd(),
    "public",
    "fonts",
    "PlaywriteDEGrund-Regular.ttf",
  ),
});

export interface WorksheetPdfProps {
  childName: string;
  date: string;
  operation: OperationLike;
  rangeLabel: string;
  problems: Problem[];
  theme: ThemeId;
  showWatermark: boolean;
  includeSolutions: boolean;
}

// ── Brand palette ─────────────────────────────────────────────────────────
// Derived from the logo: blue `#1E4A7C` as the primary brand color, gold
// `#F4B942` as the playful accent (used on the number badge to mirror the
// yellow square in the mark).
const COLOR = {
  brand: "#1E4A7C",
  accent: "#F4B942",
  textDark: "#1F2937",
  textMuted: "#6B7280",
  line: "#E5E7EB",
  writeLine: "#D1D5DB",
  answerBg: "#F9FAFB",
  answerBorder: "#E5E7EB",
} as const;

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
    marginBottom: 32,
    paddingBottom: 18,
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
    fontSize: 28,
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
  // ── problem grid (page 1) ──────────────────────────────────────────────
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  cellHalf: {
    width: "50%",
    padding: 5,
  },
  cellThird: {
    width: "33.333%",
    padding: 4,
  },
  cellInner: {
    paddingTop: 10,
    paddingBottom: 10,
    paddingLeft: 10,
    paddingRight: 12,
    borderWidth: 0.75,
    borderStyle: "dotted",
    borderColor: COLOR.line,
    borderRadius: 6,
  },
  problemRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  numberBadge: {
    width: 17,
    height: 17,
    borderRadius: 8.5,
    backgroundColor: COLOR.accent,
    color: COLOR.brand,
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
    paddingTop: 4,
    marginRight: 8,
  },
  // Math problems render in Playwrite Grund (kid-style Grundschrift) so
  // the digits look like the ones first-graders are taught to write.
  // fontWeight: bold asks React-PDF for synthetic bold since Playwrite has
  // no bold variant on Google Fonts (max weight 400).
  problemText: {
    fontSize: 18,
    fontFamily: "PlaywriteDEGrund",
    fontWeight: "bold",
    color: COLOR.textDark,
  },
  problemTextSmall: {
    fontSize: 14,
    fontFamily: "PlaywriteDEGrund",
    fontWeight: "bold",
    color: COLOR.textDark,
  },
  answerLine: {
    flexGrow: 1,
    marginLeft: 6,
    // Sit on the text baseline instead of floating mid-row.
    alignSelf: "flex-end",
    marginBottom: 3,
    borderBottomWidth: 1,
    borderBottomColor: COLOR.writeLine,
  },
  // ── answer key (page 2) — same grid as page 1 ─────────────────────────
  answerKeyHeader: {
    marginBottom: 22,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLOR.line,
  },
  answerInner: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 8,
    paddingBottom: 8,
    paddingLeft: 10,
    paddingRight: 10,
    borderWidth: 1,
    borderColor: COLOR.answerBorder,
    borderRadius: 6,
    backgroundColor: COLOR.answerBg,
  },
  answerText: {
    fontSize: 14,
    fontFamily: "PlaywriteDEGrund",
    fontWeight: "bold",
    color: COLOR.textDark,
  },
  answerTextSmall: {
    fontSize: 12,
    fontFamily: "PlaywriteDEGrund",
    fontWeight: "bold",
    color: COLOR.textDark,
  },
  // ── footer ─────────────────────────────────────────────────────────────
  footer: {
    position: "absolute",
    bottom: 22,
    left: 56,
    right: 56,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLOR.line,
    flexDirection: "column",
    alignItems: "center",
  },
  footerLogo: {
    width: 92,
    // 92 / (1500/360) ≈ 22pt — matches the lockup's aspect ratio.
    height: 22,
  },
  footerWatermark: {
    fontSize: 7,
    color: COLOR.textMuted,
    letterSpacing: 0.5,
    marginTop: 6,
  },
});

const WorksheetDocument = ({
  childName,
  date,
  operation,
  rangeLabel,
  problems,
  theme,
  showWatermark,
  includeSolutions,
}: WorksheetPdfProps): ReactElement => {
  const themeMeta = getTheme(theme),
    // > 20 problems → 3 columns (slightly smaller text). ≤ 20 → 2 columns.
    threeColumns = problems.length > 20,
    cellStyle = threeColumns ? styles.cellThird : styles.cellHalf,
    problemTextStyle = threeColumns
      ? styles.problemTextSmall
      : styles.problemText,
    answerTextStyle = threeColumns
      ? styles.answerTextSmall
      : styles.answerText;
  return (
  <Document
    title={`Übungsblatt für ${childName}`}
    author="Lernikon"
    creator="Lernikon"
    producer="Lernikon"
  >
    {/* page 1 — worksheet */}
    <Page size="A4" style={styles.page}>
      <View style={styles.topAccent} fixed />
      <ThemeDecoration theme={themeMeta} />

      <View style={styles.header}>
        <View>
          <Text style={styles.brand}>Lernikon</Text>
          <Text style={styles.brandDomain}>lernikon.de</Text>
          <Text style={styles.title}>Übungsblatt</Text>
          <Text style={styles.subtitle}>
            {operationLabel(operation)} ·{" "}
            {operation === "einmaleins" ? `Reihen ${rangeLabel}` : `Zahlenraum ${rangeLabel}`}
          </Text>
        </View>
        <View style={styles.metaCol}>
          <Text style={styles.metaLabel}>Name</Text>
          <Text style={styles.metaValue}>{childName}</Text>
          <Text style={styles.metaLabel}>Datum</Text>
          <Text style={styles.metaValue}>{date}</Text>
        </View>
      </View>

      <View style={styles.grid}>
        {problems.map((problem, i) => (
          <View key={i} style={cellStyle} wrap={false}>
            <View style={styles.cellInner}>
              <View style={styles.problemRow}>
                <Text style={styles.numberBadge}>{i + 1}.</Text>
                <Text style={problemTextStyle}>{problem.question}</Text>
                <View style={styles.answerLine} />
              </View>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.footer} fixed>
        <Image src={LOGO_LOCKUP_BUFFER} style={styles.footerLogo} />
        {showWatermark && (
          <Text style={styles.footerWatermark}>
            Kostenfreie Version von lernikon.de · Family Pro entsperrt alle Themes
          </Text>
        )}
      </View>
    </Page>

    {/* page 2 — answer key (optional, same grid as page 1) */}
    {includeSolutions && (
      <Page size="A4" style={styles.page}>
        <View style={styles.topAccent} fixed />
        <ThemeDecoration theme={themeMeta} />

        <View style={styles.answerKeyHeader}>
          <Text style={styles.brand}>Lernikon</Text>
          <Text style={styles.brandDomain}>lernikon.de</Text>
          <Text style={styles.title}>Lösungen</Text>
          <Text style={styles.subtitle}>
            {operationLabel(operation)} ·{" "}
            {operation === "einmaleins" ? `Reihen ${rangeLabel}` : `Zahlenraum ${rangeLabel}`}
          </Text>
        </View>

        <View style={styles.grid}>
          {problems.map((problem, i) => (
            <View key={i} style={cellStyle} wrap={false}>
              <View style={styles.answerInner}>
                <Text style={styles.numberBadge}>{i + 1}.</Text>
                <Text style={answerTextStyle}>
                  {problem.question} {problem.answer}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.footer} fixed>
          <Image src={LOGO_LOCKUP_BUFFER} style={styles.footerLogo} />
          {showWatermark && (
            <Text style={styles.footerWatermark}>
              Kostenfreie Version von lernikon.de · Family Pro entsperrt alle Themes
            </Text>
          )}
        </View>
      </Page>
    )}
  </Document>
  );
};

/**
 * Renders the worksheet to a Node Readable stream.
 * Caller wraps it in a Web ReadableStream for the Response body.
 */
export const renderWorksheetPdf = async (props: WorksheetPdfProps) => {
  return renderToStream(<WorksheetDocument {...props} />);
};
