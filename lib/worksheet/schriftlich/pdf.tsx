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
import type { SchriftlichProblem } from "./generate";
import type { SchriftlichOperation } from "./config";
import { OPERATION_LABELS } from "./config";
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

// ── Brand palette (mirrors lib/worksheet/pdf.tsx) ─────────────────────────
const COLOR = {
  brand: "#1E4A7C",
  accent: "#F4B942",
  textDark: "#1F2937",
  textMuted: "#6B7280",
  line: "#E5E7EB",
  writeLine: "#C8CDD5",
  answerBg: "#F9FAFB",
  answerBorder: "#E5E7EB",
} as const;

// Each digit column has a fixed width so digits right-align correctly.
// The same width is used for both the problem and solution rows.
// Chosen so a 4-digit number fits comfortably at fontSize 20.
const DIGIT_W = 14; // pt per digit slot
const OP_W = 14; // pt for the operator column

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
    marginBottom: 28,
    paddingBottom: 16,
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
  // ── problem grid ──────────────────────────────────────────────────────────
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  cellHalf: {
    width: "50%",
    paddingLeft: 6,
    paddingRight: 6,
    paddingTop: 5,
    paddingBottom: 5,
  },
  cellThird: {
    width: "33.333%",
    paddingLeft: 5,
    paddingRight: 5,
    paddingTop: 4,
    paddingBottom: 4,
  },
  cellInner: {
    paddingTop: 10,
    paddingBottom: 10,
    paddingLeft: 10,
    paddingRight: 10,
    borderWidth: 0.75,
    borderStyle: "dotted",
    borderColor: COLOR.line,
    borderRadius: 6,
  },
  problemLabel: {
    fontSize: 8,
    color: COLOR.textMuted,
    fontFamily: "Helvetica-Bold",
    marginBottom: 6,
  },
  // Horizontal row that holds digit cells + optional operator cell.
  digitRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  // The operator column (left of the bottom operand).
  operatorCell: {
    width: OP_W,
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: COLOR.brand,
    textAlign: "center",
  },
  // One cell per digit; fixed width gives right-alignment.
  digitCell: {
    width: DIGIT_W,
    fontSize: 20,
    fontFamily: "PlaywriteDEGrund",
    color: COLOR.textDark,
    textAlign: "center",
  },
  digitCellBold: {
    width: DIGIT_W,
    fontSize: 20,
    fontFamily: "PlaywriteDEGrund",
    color: COLOR.textDark,
    textAlign: "center",
  },
  // Thin carry row between addends — gives pencil space.
  carryRow: {
    height: 9,
  },
  // Horizontal rule between the two operands and the answer area.
  ruleLine: {
    marginTop: 3,
    marginBottom: 3,
    borderBottomWidth: 1,
    borderBottomColor: COLOR.textDark,
  },
  // Blank answer row — same digit-cell layout but cells are empty underlines.
  answerDigitCell: {
    width: DIGIT_W,
    height: 22,
    borderBottomWidth: 1,
    borderBottomColor: COLOR.writeLine,
    marginLeft: 1,
    marginRight: 1,
  },
  // ── answer key (page 2) ──────────────────────────────────────────────────
  answerKeyHeader: {
    marginBottom: 22,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLOR.line,
  },
  answerDigitCellFilled: {
    width: DIGIT_W,
    fontSize: 20,
    fontFamily: "PlaywriteDEGrund",
    color: COLOR.brand,
    textAlign: "center",
  },
  answerInner: {
    paddingTop: 10,
    paddingBottom: 10,
    paddingLeft: 10,
    paddingRight: 10,
    borderWidth: 1,
    borderColor: COLOR.answerBorder,
    borderRadius: 6,
    backgroundColor: COLOR.answerBg,
  },
  // ── footer ────────────────────────────────────────────────────────────────
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

/** Split a number into its individual digit characters, padded to `width`. */
const digitChars = (n: number, width: number): string[] => {
  const s = String(n).padStart(width, " ");
  return s.split("");
};

/**
 * Renders one row of right-aligned digit cells. Leading spaces become blank
 * cells so shorter numbers align with longer ones in the same column block.
 */
const DigitRow = ({
  value,
  width,
  bold,
}: {
  value: number;
  width: number;
  bold?: boolean;
}): ReactElement => {
  const chars = digitChars(value, width);
  const cellStyle = bold ? styles.digitCellBold : styles.digitCell;
  return (
    <View style={styles.digitRow}>
      {chars.map((ch, i) => (
        <Text key={i} style={cellStyle}>
          {ch === " " ? "" : ch}
        </Text>
      ))}
    </View>
  );
};

/**
 * Blank answer row — `width` empty underline cells right-aligned like the
 * operand rows above. Used on the Aufgabenblatt (page 1).
 */
const BlankAnswerRow = ({ width }: { width: number }): ReactElement => (
  <View style={styles.digitRow}>
    {Array.from({ length: width }).map((_, i) => (
      <View key={i} style={styles.answerDigitCell} />
    ))}
  </View>
);

/**
 * Filled answer row shown on the Lösungsblatt (page 2) in brand blue.
 */
const FilledAnswerRow = ({
  value,
  width,
}: {
  value: number;
  width: number;
}): ReactElement => {
  const chars = digitChars(value, width);
  return (
    <View style={styles.digitRow}>
      {chars.map((ch, i) => (
        <Text key={i} style={styles.answerDigitCellFilled}>
          {ch === " " ? "" : ch}
        </Text>
      ))}
    </View>
  );
};

/**
 * The column layout for one arithmetic problem. The answer area is either
 * blank underline cells (Aufgabenblatt) or the filled result (Lösungsblatt).
 */
const ProblemCell = ({
  problem,
  index,
  digitWidth,
  showAnswer,
  cellStyle,
}: {
  problem: SchriftlichProblem;
  index: number;
  /** Max digits across operands and result, so all rows have the same width. */
  digitWidth: number;
  showAnswer: boolean;
  cellStyle: (typeof styles)[keyof typeof styles];
}): ReactElement => {
  const opSymbol = problem.operation === "addition" ? "+" : "-";
  const innerStyle = showAnswer ? styles.answerInner : styles.cellInner;
  return (
    <View style={cellStyle} wrap={false}>
      <View style={innerStyle}>
        <Text style={styles.problemLabel}>{index + 1}.</Text>
        {/* Top operand (a) */}
        <View style={styles.digitRow}>
          {/* operator column placeholder so numbers align with bottom row */}
          <View style={{ width: OP_W }} />
          <DigitRow value={problem.a} width={digitWidth} />
        </View>
        {/* Thin carry space */}
        <View style={styles.carryRow} />
        {/* Bottom operand (b) with operator on the left */}
        <View style={styles.digitRow}>
          <Text style={styles.operatorCell}>{opSymbol}</Text>
          <DigitRow value={problem.b} width={digitWidth} />
        </View>
        {/* Rule line */}
        <View style={styles.ruleLine} />
        {/* Answer row */}
        {showAnswer ? (
          <FilledAnswerRow value={problem.result} width={digitWidth} />
        ) : (
          <BlankAnswerRow width={digitWidth} />
        )}
      </View>
    </View>
  );
};

/** Build the subtitle string shown under the title on both pages. */
const buildSubtitle = (
  operation: SchriftlichOperation,
  stellen: 3 | 4,
  count: number,
): string => `${OPERATION_LABELS[operation]} · ${stellen}-stellig · ${count} Aufgaben`;

export interface SchriftlichPdfProps {
  childName: string;
  date: string;
  problems: SchriftlichProblem[];
  operation: SchriftlichOperation;
  stellen: 3 | 4;
  theme: ThemeId;
  showWatermark: boolean;
  includeSolutions: boolean;
}

const SchriftlichDocument = ({
  childName,
  date,
  problems,
  operation,
  stellen,
  theme,
  showWatermark,
  includeSolutions,
}: SchriftlichPdfProps): ReactElement => {
  const themeMeta = getTheme(theme),
    count = problems.length,
    // 6 problems → 2 cols, 12 → 3 cols, 18 → 3 cols
    threeColumns = count > 6,
    cellStyle = threeColumns ? styles.cellThird : styles.cellHalf,
    subtitle = buildSubtitle(operation, stellen, count);

  // Max digit count needed to display any number in the sheet (result can be
  // one digit wider than the operands when addition carries into a new place).
  const maxValue = Math.max(...problems.map((p) => Math.max(p.a, p.b, p.result))),
    digitWidth = String(maxValue).length;

  return (
    <Document
      title={`Schriftliche Rechnung fur ${childName}`}
      author="Lernikon"
      creator="Lernikon"
      producer="Lernikon"
    >
      {/* Page 1 — Aufgabenblatt */}
      <Page size="A4" style={styles.page}>
<ThemeDecoration theme={themeMeta} />

        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>Lernikon</Text>
            <Text style={styles.brandDomain}>lernikon.de</Text>
            <Text style={styles.title}>Schriftlich rechnen</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
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
            <ProblemCell
              key={i}
              problem={problem}
              index={i}
              digitWidth={digitWidth}
              showAnswer={false}
              cellStyle={cellStyle}
            />
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

      {/* Page 2 — Losungsblatt (optional) */}
      {includeSolutions && (
        <Page size="A4" style={styles.page}>
    <ThemeDecoration theme={themeMeta} />

          <View style={styles.answerKeyHeader}>
            <Text style={styles.brand}>Lernikon</Text>
            <Text style={styles.brandDomain}>lernikon.de</Text>
            <Text style={styles.title}>Losungen</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
          </View>

          <View style={styles.grid}>
            {problems.map((problem, i) => (
              <ProblemCell
                key={i}
                problem={problem}
                index={i}
                digitWidth={digitWidth}
                showAnswer={true}
                cellStyle={cellStyle}
              />
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
 * Renders the Schriftliche Verfahren worksheet to a Node Readable stream.
 * Caller wraps it in a Web ReadableStream for the Response body.
 */
export const renderSchriftlichPdf = async (
  props: SchriftlichPdfProps,
): Promise<NodeJS.ReadableStream> => renderToStream(<SchriftlichDocument {...props} />);
