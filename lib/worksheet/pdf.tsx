import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
  renderToStream,
} from "@react-pdf/renderer";
import type { ReactElement } from "react";
import type { Problem } from "./generate";
import { operationLabel, type Operation } from "./config";
import type { ThemeId } from "@/lib/themes";

export interface WorksheetPdfProps {
  childName: string;
  date: string;
  operation: Operation;
  rangeLabel: string;
  problems: Problem[];
  theme: ThemeId;
  showWatermark: boolean;
}

// ── Brand palette ─────────────────────────────────────────────────────────
const COLOR = {
  brand: "#6366F1",
  brandSoft: "#EEF2FF",
  brandLine: "#C7D2FE",
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
  cell: {
    width: "50%",
    paddingTop: 12,
    paddingBottom: 12,
    paddingRight: 16,
  },
  problemRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  numberBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLOR.brandSoft,
    color: COLOR.brand,
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
    paddingTop: 5,
    marginRight: 10,
  },
  problemText: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: COLOR.textDark,
  },
  writeLine: {
    marginTop: 14,
    marginLeft: 32,
    height: 26,
    borderBottomWidth: 1,
    borderBottomColor: COLOR.writeLine,
  },
  // ── answer key (page 2) ────────────────────────────────────────────────
  answerKeyHeader: {
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLOR.line,
  },
  answerCell: {
    width: "33%",
    paddingTop: 6,
    paddingBottom: 6,
    paddingRight: 8,
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
  answerNumber: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: COLOR.brand,
    width: 14,
  },
  answerText: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: COLOR.textDark,
  },
  // ── footer ─────────────────────────────────────────────────────────────
  footer: {
    position: "absolute",
    bottom: 28,
    left: 56,
    right: 56,
    textAlign: "center",
    fontSize: 8,
    color: COLOR.textMuted,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLOR.line,
  },
});

const WorksheetDocument = ({
  childName,
  date,
  operation,
  rangeLabel,
  problems,
  showWatermark,
}: WorksheetPdfProps): ReactElement => (
  <Document
    title={`Übungsblatt — ${childName}`}
    author="Lernikon"
    creator="Lernikon"
    producer="Lernikon"
  >
    {/* page 1 — worksheet */}
    <Page size="A4" style={styles.page}>
      <View style={styles.topAccent} fixed />

      <View style={styles.header}>
        <View>
          <Text style={styles.brand}>Lernikon</Text>
          <Text style={styles.title}>Übungsblatt</Text>
          <Text style={styles.subtitle}>
            {operationLabel(operation)} · Zahlenraum {rangeLabel}
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
          <View key={i} style={styles.cell} wrap={false}>
            <View style={styles.problemRow}>
              <Text style={styles.numberBadge}>{i + 1}</Text>
              <Text style={styles.problemText}>{problem.question}</Text>
            </View>
            <View style={styles.writeLine} />
          </View>
        ))}
      </View>

      {showWatermark && (
        <Text style={styles.footer} fixed>
          Erstellt mit Lernikon · lernikon.de
        </Text>
      )}
    </Page>

    {/* page 2 — answer key */}
    <Page size="A4" style={styles.page}>
      <View style={styles.topAccent} fixed />

      <View style={styles.answerKeyHeader}>
        <Text style={styles.brand}>Lernikon</Text>
        <Text style={styles.title}>Lösungen</Text>
        <Text style={styles.subtitle}>
          {operationLabel(operation)} · Zahlenraum {rangeLabel}
        </Text>
      </View>

      <View style={styles.grid}>
        {problems.map((problem, i) => (
          <View key={i} style={styles.answerCell} wrap={false}>
            <View style={styles.answerInner}>
              <Text style={styles.answerNumber}>{i + 1}</Text>
              <Text style={styles.answerText}>
                {problem.question} {problem.answer}
              </Text>
            </View>
          </View>
        ))}
      </View>

      {showWatermark && (
        <Text style={styles.footer} fixed>
          Erstellt mit Lernikon · lernikon.de
        </Text>
      )}
    </Page>
  </Document>
);

/**
 * Renders the worksheet to a Node Readable stream.
 * Caller wraps it in a Web ReadableStream for the Response body.
 */
export const renderWorksheetPdf = async (props: WorksheetPdfProps) => {
  return renderToStream(<WorksheetDocument {...props} />);
};
