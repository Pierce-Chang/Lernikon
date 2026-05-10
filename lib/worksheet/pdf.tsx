import {
  Document,
  Page,
  StyleSheet,
  Svg,
  Text,
  View,
  Circle,
  Path,
  renderToStream,
} from "@react-pdf/renderer";
import type { ReactElement } from "react";
import type { Problem } from "./generate";
import type { ThemeId } from "@/lib/themes";

export interface WorksheetPdfProps {
  childName: string;
  date: string;
  operation: "addition" | "subtraktion";
  rangeLabel: string;
  problems: Problem[];
  theme: ThemeId;
  showWatermark: boolean;
}

const styles = StyleSheet.create({
  page: {
    paddingTop: 48,
    paddingBottom: 56,
    paddingHorizontal: 48,
    fontFamily: "Helvetica",
    color: "#111827",
    position: "relative",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 28,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    paddingBottom: 14,
  },
  title: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
  },
  subtitle: {
    fontSize: 11,
    color: "#6B7280",
    marginTop: 4,
  },
  metaRight: {
    fontSize: 10,
    color: "#374151",
    textAlign: "right",
  },
  metaRow: {
    fontSize: 11,
    color: "#374151",
    marginBottom: 18,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  cell: {
    width: "50%",
    paddingVertical: 14,
    paddingRight: 12,
  },
  problemRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
  },
  problemNumber: {
    fontSize: 11,
    color: "#9CA3AF",
    width: 22,
  },
  problemText: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
  },
  writeLine: {
    marginTop: 12,
    height: 28,
    borderBottomWidth: 1,
    borderBottomColor: "#9CA3AF",
    borderStyle: "dashed",
  },
  answerKeyTitle: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    marginBottom: 18,
  },
  answerCell: {
    width: "33.3333%",
    paddingVertical: 8,
    flexDirection: "row",
    gap: 8,
  },
  answerNumber: {
    fontSize: 11,
    color: "#9CA3AF",
    width: 22,
  },
  answerText: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    color: "#1F2937",
  },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 48,
    right: 48,
    textAlign: "center",
    fontSize: 9,
    color: "#9CA3AF",
  },
  decoTL: { position: "absolute", top: 18, left: 18 },
  decoBR: { position: "absolute", bottom: 28, right: 18 },
});

const Planet = () => (
  <Svg width={64} height={64} viewBox="0 0 64 64">
    <Circle cx="32" cy="34" r="18" fill="#E0E7FF" />
    <Path
      d="M10 40 Q32 22 54 40"
      stroke="#A5B4FC"
      strokeWidth={2}
      fill="none"
    />
    <Circle cx="20" cy="14" r="2" fill="#A5B4FC" />
    <Circle cx="50" cy="20" r="1.5" fill="#A5B4FC" />
  </Svg>
);

const Stars = () => (
  <Svg width={72} height={72} viewBox="0 0 72 72">
    <Circle cx="10" cy="10" r="1.5" fill="#C7D2FE" />
    <Circle cx="30" cy="22" r="2" fill="#A5B4FC" />
    <Circle cx="55" cy="14" r="1.5" fill="#C7D2FE" />
    <Circle cx="48" cy="48" r="2" fill="#A5B4FC" />
    <Circle cx="20" cy="60" r="1.5" fill="#C7D2FE" />
  </Svg>
);

const ThemeDecorations = ({ theme }: { theme: ThemeId }) => {
  if (theme !== "weltraum") return null;
  return (
    <>
      <View style={styles.decoTL} render={() => <Stars />} fixed />
      <View style={styles.decoBR} render={() => <Planet />} fixed />
    </>
  );
};

const operationLabel = (op: "addition" | "subtraktion") =>
  op === "addition" ? "Addition" : "Subtraktion";

const WorksheetDocument = ({
  childName,
  date,
  operation,
  rangeLabel,
  problems,
  theme,
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
      <ThemeDecorations theme={theme} />
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Übungsblatt</Text>
          <Text style={styles.subtitle}>
            {operationLabel(operation)} · Zahlenraum {rangeLabel}
          </Text>
        </View>
        <View>
          <Text style={styles.metaRight}>Name: {childName}</Text>
          <Text style={styles.metaRight}>Datum: {date}</Text>
        </View>
      </View>

      <View style={styles.grid}>
        {problems.map((problem, i) => (
          <View key={i} style={styles.cell} wrap={false}>
            <View style={styles.problemRow}>
              <Text style={styles.problemNumber}>{i + 1}.</Text>
              <Text style={styles.problemText}>{problem.question}</Text>
            </View>
            <View style={styles.writeLine} />
          </View>
        ))}
      </View>

      {showWatermark && (
        <Text style={styles.footer} fixed>
          Erstellt mit Lernikon — lernikon.de
        </Text>
      )}
    </Page>

    {/* page 2 — answer key */}
    <Page size="A4" style={styles.page}>
      <ThemeDecorations theme={theme} />
      <Text style={styles.answerKeyTitle}>Lösungen</Text>
      <View style={styles.grid}>
        {problems.map((problem, i) => (
          <View key={i} style={styles.answerCell} wrap={false}>
            <Text style={styles.answerNumber}>{i + 1}.</Text>
            <Text style={styles.answerText}>
              {problem.question} {problem.answer}
            </Text>
          </View>
        ))}
      </View>
      {showWatermark && (
        <Text style={styles.footer} fixed>
          Erstellt mit Lernikon — lernikon.de
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
