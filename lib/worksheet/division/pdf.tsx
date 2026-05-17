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
import type { DivProblem } from "./generate";
import type { DivStellen, DivVerfahren } from "./config";
import { STELLEN_LABELS, VERFAHREN_LABELS, MAX_QUOTIENT_DIGITS } from "./config";
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

// ── Merkkasten step arrays ────────────────────────────────────────────────────

const STEPS_ABZIEH = [
  "Schreibe Dividend, Doppelpunkt, Divisor und Gleichheitszeichen nebeneinander.",
  "Schau dir die erste Stelle des Dividenden an. Passt der Divisor da rein? Wenn nein, nimm die ersten zwei Stellen.",
  "Schreibe wie oft der Divisor in diesen Wert passt, das ist die erste Quotient-Stelle.",
  "Multipliziere die Quotient-Stelle mit dem Divisor und ziehe das Ergebnis ab.",
  "Hole die nachste Stelle des Dividenden herunter und wiederhole.",
] as const;

const STEPS_ERGAENZUNG = [
  "Schreibe Dividend, Doppelpunkt, Divisor und Gleichheitszeichen nebeneinander.",
  "Schau dir die erste Stelle des Dividenden an. Passt der Divisor da rein? Wenn nein, nimm die ersten zwei Stellen.",
  "Frage dich, wie oft der Divisor in diesen Wert passt, das ist die erste Quotient-Stelle.",
  "Multipliziere die Quotient-Stelle mit dem Divisor. Erganze von diesem Ergebnis nach oben bis zum Teildividenden.",
  "Hole die nachste Stelle des Dividenden herunter und wiederhole.",
] as const;

// ── Walkthrough lines for 728 : 4 = 182 ─────────────────────────────────────

const WALKTHROUGH_ABZIEH = [
  "7 : 4 = 1 (4 passt einmal in 7), 7 minus 4 = 3 (Rest 3, schreibe 1 als erste Quotient-Stelle)",
  "2 herabgeholt, ergibt 32. 32 : 4 = 8, 32 minus 32 = 0 (schreibe 8 als zweite Quotient-Stelle)",
  "8 herabgeholt, ergibt 8. 8 : 4 = 2, 8 minus 8 = 0 (schreibe 2 als dritte Quotient-Stelle)",
  "Ergebnis: 182, kein Rest",
] as const;

const WALKTHROUGH_ERGAENZUNG = [
  "7 : 4 = 1 (4 passt einmal in 7), 4 plus 3 = 7 (schreibe 3 als Rest, 1 als erste Quotient-Stelle)",
  "2 herabgeholt, ergibt 32. 32 : 4 = 8, 32 plus 0 = 32 (schreibe 8 als zweite Quotient-Stelle, Rest 0)",
  "8 herabgeholt, ergibt 8. 8 : 4 = 2, 8 plus 0 = 8 (schreibe 2 als dritte Quotient-Stelle, Rest 0)",
  "Ergebnis: 182, kein Rest",
] as const;

// ── Brand palette ─────────────────────────────────────────────────────────────
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

// Fixed width per digit cell (pt).
const DIGIT_W = 14;
// Width of the operator column.
const OP_W = 16;

// Merkkasten example uses smaller cells.
const MK_DIGIT_W = 9,
  MK_OP_W = 12;

// Number of digit columns for the example 728:4=182 (3 dividend, 1 divisor, 3 quotient).
const MK_DIVIDEND_COLS = 3,
  MK_DIVISOR_COLS = 1,
  MK_QUOTIENT_COLS = 3;

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
  problemLabel: {
    fontSize: 8,
    color: COLOR.textMuted,
    fontFamily: "Helvetica-Bold",
    marginBottom: 6,
  },
  // The main equation row: dividend : divisor = quotient [R remainder]
  equationRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 22,
  },
  digitCell: {
    width: DIGIT_W,
    fontSize: 16,
    fontFamily: "Helvetica",
    color: COLOR.textDark,
    textAlign: "center",
  },
  digitCellBrand: {
    width: DIGIT_W,
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: COLOR.brand,
    textAlign: "center",
  },
  operatorCell: {
    width: OP_W,
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: COLOR.brand,
    textAlign: "center",
  },
  blankCell: {
    width: DIGIT_W,
    height: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLOR.writeLine,
    marginLeft: 1,
    marginRight: 1,
  },
  // ── subtraction block ─────────────────────────────────────────────────────
  subBlock: {
    marginTop: 6,
    paddingLeft: 6,
  },
  stepWrap: {
    marginBottom: 4,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 16,
    justifyContent: "flex-start",
  },
  stepDigitCell: {
    width: DIGIT_W,
    fontSize: 11,
    fontFamily: "Helvetica",
    color: COLOR.textDark,
    textAlign: "center",
  },
  stepDigitCellBrand: {
    width: DIGIT_W,
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: COLOR.brand,
    textAlign: "center",
  },
  stepOpCell: {
    width: OP_W,
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: COLOR.brand,
    textAlign: "center",
  },
  stepOpSpacer: {
    width: OP_W,
  },
  stepBlankCell: {
    width: DIGIT_W,
    height: 14,
    borderBottomWidth: 0.75,
    borderBottomColor: COLOR.writeLine,
    marginLeft: 1,
    marginRight: 1,
  },
  stepRule: {
    marginTop: 2,
    marginBottom: 2,
    borderBottomWidth: 0.75,
    borderBottomColor: COLOR.textDark,
    width: "100%",
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
  answerKeyHeader: {
    marginBottom: 22,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLOR.line,
  },
  // ── Merkkasten ─────────────────────────────────────────────────────────────
  merkkastenWrap: {
    marginBottom: 18,
    borderWidth: 1,
    borderColor: COLOR.brand,
    borderRadius: 4,
    backgroundColor: "#F4F7FA",
    paddingTop: 10,
    paddingBottom: 10,
    paddingLeft: 12,
    paddingRight: 12,
  },
  merkkastenTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: COLOR.brand,
    marginBottom: 6,
  },
  merkkastenStep: {
    fontSize: 9,
    fontFamily: "Helvetica",
    color: COLOR.textDark,
    marginBottom: 3,
  },
  merkkastenSectionGap: {
    marginTop: 8,
  },
  merkkastenSectionTitle: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: COLOR.brand,
    marginBottom: 4,
  },
  walkthroughTitle: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: COLOR.brand,
    marginTop: 8,
    marginBottom: 4,
  },
  walkthroughLine: {
    fontSize: 8,
    fontFamily: "Helvetica",
    color: COLOR.textDark,
    marginBottom: 2,
    lineHeight: 1.4,
  },
  // Merkkasten example layout: dividend : divisor = quotient
  mkExampleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  mkDigitCell: {
    width: MK_DIGIT_W,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: COLOR.textDark,
    textAlign: "center",
  },
  mkDigitCellBrand: {
    width: MK_DIGIT_W,
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: COLOR.brand,
    textAlign: "center",
  },
  mkOpCell: {
    width: MK_OP_W,
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: COLOR.brand,
    textAlign: "center",
  },
  mkOpSpacer: {
    width: MK_OP_W,
  },
  mkStepRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 13,
  },
  mkStepDigitCell: {
    width: MK_DIGIT_W,
    fontSize: 8,
    fontFamily: "Helvetica",
    color: COLOR.textDark,
    textAlign: "center",
  },
  mkStepDigitCellBrand: {
    width: MK_DIGIT_W,
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: COLOR.brand,
    textAlign: "center",
  },
  mkStepOpCell: {
    width: MK_OP_W,
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: COLOR.brand,
    textAlign: "center",
  },
  mkStepOpSpacer: {
    width: MK_OP_W,
  },
  mkRule: {
    marginTop: 2,
    marginBottom: 2,
    borderBottomWidth: 0.75,
    borderBottomColor: COLOR.textDark,
    width: MK_DIVIDEND_COLS * MK_DIGIT_W + MK_OP_W,
  },
  mkExampleNote: {
    fontSize: 7,
    fontFamily: "Helvetica",
    color: COLOR.textMuted,
    marginTop: 2,
  },
});

/** Render a number as right-aligned digit cells of fixed width. */
const DigitCells = ({
  value,
  cols,
  brand,
  cellWidth,
  fontSize,
}: {
  value: number;
  cols: number;
  brand?: boolean;
  cellWidth?: number;
  fontSize?: number;
}): ReactElement => {
  const str = String(value).padStart(cols, " ").split(""),
    w = cellWidth ?? DIGIT_W,
    fs = fontSize ?? 16,
    cellStyle = brand
      ? { width: w, fontSize: fs, fontFamily: "Helvetica-Bold" as const, color: COLOR.brand, textAlign: "center" as const }
      : { width: w, fontSize: fs, fontFamily: "Helvetica" as const, color: COLOR.textDark, textAlign: "center" as const };

  return (
    <>
      {str.map((ch, i) => (
        <Text key={i} style={cellStyle}>
          {ch === " " ? "" : ch}
        </Text>
      ))}
    </>
  );
};

/** Blank underline cells for a slot on the Aufgabenblatt. */
const BlankCells = ({ count, cellStyle }: { count: number; cellStyle: (typeof styles)[keyof typeof styles] }): ReactElement => (
  <>
    {Array.from({ length: count }).map((_, i) => (
      <View key={i} style={cellStyle} />
    ))}
  </>
);

/**
 * One step's subtraction block.
 * Abzieh:   partial row / "- sub" row / rule / remainder row
 * Ergaenzung: partial row / "+ sub" row / rule / remainder row
 * On Aufgabenblatt all values are blank underlines.
 * On Losungsblatt values are shown in brand color.
 */
const StepBlock = ({
  partial,
  sub,
  remainder,
  verfahren,
  showAnswer,
}: {
  partial: number;
  sub: number;
  remainder: number;
  verfahren: DivVerfahren;
  showAnswer: boolean;
}): ReactElement => {
  // How many digit columns wide is this step block?
  // Use the widest of partial, sub, remainder so the rule aligns.
  const maxVal = Math.max(partial, sub, remainder, 1),
    colCount = String(maxVal).length + 1; // +1 for breathing room

  const operator = verfahren === "abzieh" ? "-" : "+";

  return (
    <View style={styles.stepWrap}>
      {/* Row A: partial */}
      <View style={styles.stepRow}>
        <View style={styles.stepOpSpacer} />
        {showAnswer ? (
          <DigitCells value={partial} cols={colCount} brand cellWidth={DIGIT_W} fontSize={11} />
        ) : (
          <BlankCells count={colCount} cellStyle={styles.stepBlankCell} />
        )}
      </View>

      {/* Row B: operator + sub */}
      <View style={styles.stepRow}>
        <Text style={styles.stepOpCell}>{operator}</Text>
        {showAnswer ? (
          <DigitCells value={sub} cols={colCount} brand cellWidth={DIGIT_W} fontSize={11} />
        ) : (
          <BlankCells count={colCount} cellStyle={styles.stepBlankCell} />
        )}
      </View>

      {/* Rule */}
      <View style={{ ...styles.stepRule, width: OP_W + colCount * DIGIT_W }} />

      {/* Row C: remainder */}
      <View style={styles.stepRow}>
        <View style={styles.stepOpSpacer} />
        {showAnswer ? (
          <DigitCells value={remainder} cols={colCount} brand cellWidth={DIGIT_W} fontSize={11} />
        ) : (
          <BlankCells count={colCount} cellStyle={styles.stepBlankCell} />
        )}
      </View>
    </View>
  );
};

/**
 * One complete division problem box.
 * Top row: dividend : divisor = [quotient slots] [R slot]
 * Below: per-step subtraction blocks (indented).
 */
const ProblemCell = ({
  problem,
  index,
  stellen,
  verfahren,
  mitRest,
  showAnswer,
  cellStyle,
}: {
  problem: DivProblem;
  index: number;
  stellen: DivStellen;
  verfahren: DivVerfahren;
  mitRest: boolean;
  showAnswer: boolean;
  cellStyle: (typeof styles)[keyof typeof styles];
}): ReactElement => {
  const innerStyle = showAnswer ? styles.answerInner : styles.cellInner,
    quotientSlots = MAX_QUOTIENT_DIGITS[stellen],
    dividendStr = String(problem.dividend),
    divisorStr = String(problem.divisor),
    quotientStr = String(problem.quotient);

  // Leading blank slots before the actual quotient digits.
  const leadingBlanks = quotientSlots - quotientStr.length;

  return (
    <View style={cellStyle} wrap={false}>
      <View style={innerStyle}>
        <Text style={styles.problemLabel}>{index + 1}.</Text>

        {/* Equation row: dividend : divisor = [quotient blanks] [R blank] */}
        <View style={styles.equationRow}>
          {/* Dividend digits */}
          {dividendStr.split("").map((ch, i) => (
            <Text key={`d${i}`} style={styles.digitCell}>{ch}</Text>
          ))}

          {/* Colon operator */}
          <Text style={styles.operatorCell}>{":"}</Text>

          {/* Divisor digits */}
          {divisorStr.split("").map((ch, i) => (
            <Text key={`v${i}`} style={styles.digitCell}>{ch}</Text>
          ))}

          {/* Equals sign */}
          <Text style={styles.operatorCell}>{"="}</Text>

          {/* Quotient slots: leading blanks + actual digits */}
          {Array.from({ length: leadingBlanks }).map((_, i) => (
            <View key={`qlb${i}`} style={styles.blankCell} />
          ))}
          {showAnswer
            ? quotientStr.split("").map((ch, i) => (
                <Text key={`q${i}`} style={styles.digitCellBrand}>{ch}</Text>
              ))
            : Array.from({ length: quotientStr.length }).map((_, i) => (
                <View key={`qb${i}`} style={styles.blankCell} />
              ))}

          {/* R slot — only when mitRest */}
          {mitRest && (
            <>
              <Text style={{ ...styles.operatorCell, fontSize: 10, width: 20 }}>{" R "}</Text>
              {showAnswer ? (
                <Text style={styles.digitCellBrand}>{String(problem.remainder)}</Text>
              ) : (
                <View style={styles.blankCell} />
              )}
            </>
          )}
        </View>

        {/* Subtraction block per step */}
        <View style={styles.subBlock}>
          {problem.steps.map((step, i) => (
            <StepBlock
              key={i}
              partial={step.partial}
              sub={step.sub}
              remainder={step.remainder}
              verfahren={verfahren}
              showAnswer={showAnswer}
            />
          ))}
        </View>
      </View>
    </View>
  );
};

// ── Merkkasten ────────────────────────────────────────────────────────────────

/**
 * Example visual for 728 : 4 = 182.
 * Shows the equation header row plus all three steps of the long division.
 */
const MerkkastenExample = ({ verfahren }: { verfahren: DivVerfahren }): ReactElement => {
  // Hardcoded example: 728 : 4 = 182, no remainder.
  // Steps: 7/4=1 rem3, 32/4=8 rem0, 8/4=2 rem0
  const steps = [
    { partial: 7, sub: 4, remainder: 3, quotientDigit: 1 },
    { partial: 32, sub: 32, remainder: 0, quotientDigit: 8 },
    { partial: 8, sub: 8, remainder: 0, quotientDigit: 2 },
  ] as const;

  const operator = verfahren === "abzieh" ? "-" : "+";

  return (
    <View>
      <Text style={styles.merkkastenSectionTitle}>{"Beispiel: 728 : 4 = 182"}</Text>

      {/* Equation header */}
      <View style={styles.mkExampleRow}>
        {"728".split("").map((ch, i) => (
          <Text key={`dd${i}`} style={styles.mkDigitCell}>{ch}</Text>
        ))}
        <Text style={styles.mkOpCell}>{":"}</Text>
        <Text style={styles.mkDigitCell}>{"4"}</Text>
        <Text style={styles.mkOpCell}>{"="}</Text>
        {"182".split("").map((ch, i) => (
          <Text key={`qq${i}`} style={styles.mkDigitCellBrand}>{ch}</Text>
        ))}
      </View>

      {/* Steps */}
      {steps.map((step, si) => (
        <View key={si} style={{ marginTop: 4 }}>
          {/* Row A: partial */}
          <View style={styles.mkStepRow}>
            <View style={styles.mkStepOpSpacer} />
            {String(step.partial).padStart(2, " ").split("").map((ch, i) => (
              <Text key={i} style={styles.mkStepDigitCellBrand}>{ch === " " ? "" : ch}</Text>
            ))}
          </View>
          {/* Row B: operator + sub */}
          <View style={styles.mkStepRow}>
            <Text style={styles.mkStepOpCell}>{operator}</Text>
            {String(step.sub).padStart(2, " ").split("").map((ch, i) => (
              <Text key={i} style={styles.mkStepDigitCellBrand}>{ch === " " ? "" : ch}</Text>
            ))}
          </View>
          {/* Rule */}
          <View style={styles.mkRule} />
          {/* Row C: remainder */}
          <View style={styles.mkStepRow}>
            <View style={styles.mkStepOpSpacer} />
            {String(step.remainder).padStart(2, " ").split("").map((ch, i) => (
              <Text key={i} style={styles.mkStepDigitCellBrand}>{ch === " " ? "" : ch}</Text>
            ))}
          </View>
        </View>
      ))}
    </View>
  );
};

/**
 * Renders the step-by-step explanation box.
 * Two text variants depending on verfahren.
 */
const Merkkasten = ({ verfahren }: { verfahren: DivVerfahren }): ReactElement => {
  const steps = verfahren === "abzieh" ? STEPS_ABZIEH : STEPS_ERGAENZUNG,
    walkthrough = verfahren === "abzieh" ? WALKTHROUGH_ABZIEH : WALKTHROUGH_ERGAENZUNG;

  return (
    <View style={styles.merkkastenWrap}>
      <Text style={styles.merkkastenTitle}>
        {"Merkkasten - So rechnest du schriftlich geteilt"}
      </Text>

      {/* Numbered steps */}
      <View>
        {steps.map((step, i) => (
          <Text key={i} style={styles.merkkastenStep}>
            {`${i + 1}. ${step}`}
          </Text>
        ))}
      </View>

      {/* Example visual */}
      <View style={styles.merkkastenSectionGap}>
        <MerkkastenExample verfahren={verfahren} />
      </View>

      {/* Walkthrough */}
      <View>
        <Text style={styles.walkthroughTitle}>{"So rechnest du Schritt fur Schritt:"}</Text>
        {walkthrough.map((line, i) => (
          <Text key={i} style={styles.walkthroughLine}>{line}</Text>
        ))}
      </View>
    </View>
  );
};

/** Build the subtitle string shown under the heading. */
const buildSubtitle = (stellen: DivStellen, count: number, verfahren: DivVerfahren): string => {
  let s = `${STELLEN_LABELS[stellen]} - ${count} Aufgaben`;
  if (verfahren === "ergaenzung") s += ` - ${VERFAHREN_LABELS[verfahren]}`;
  return s;
};

export interface DivisionPdfProps {
  childName: string;
  date: string;
  problems: DivProblem[];
  stellen: DivStellen;
  verfahren: DivVerfahren;
  mitRest: boolean;
  theme: ThemeId;
  showWatermark: boolean;
  includeSolutions: boolean;
  merkkasten: boolean;
}

const DivisionDocument = ({
  childName,
  date,
  problems,
  stellen,
  verfahren,
  mitRest,
  theme,
  showWatermark,
  includeSolutions,
  merkkasten,
}: DivisionPdfProps): ReactElement => {
  const themeMeta = getTheme(theme),
    count = problems.length,
    threeColumns = count >= 12,
    cellStyle = threeColumns ? styles.cellThird : styles.cellHalf,
    subtitle = buildSubtitle(stellen, count, verfahren);

  return (
    <Document
      title={`Schriftliche Division fur ${childName}`}
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
            <Text style={styles.title}>Schriftlich dividieren</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
          </View>
          <View style={styles.metaCol}>
            <Text style={styles.metaLabel}>Name</Text>
            <Text style={styles.metaValue}>{childName}</Text>
            <Text style={styles.metaLabel}>Datum</Text>
            <Text style={styles.metaValue}>{date}</Text>
          </View>
        </View>

        {merkkasten && <Merkkasten verfahren={verfahren} />}

        <View style={styles.grid}>
          {problems.map((problem, i) => (
            <ProblemCell
              key={i}
              problem={problem}
              index={i}
              stellen={stellen}
              verfahren={verfahren}
              mitRest={mitRest}
              showAnswer={false}
              cellStyle={cellStyle}
            />
          ))}
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
                stellen={stellen}
                verfahren={verfahren}
                mitRest={mitRest}
                showAnswer={true}
                cellStyle={cellStyle}
              />
            ))}
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

/**
 * Renders the schriftliche Division worksheet to a Node Readable stream.
 * Caller wraps it in a Web ReadableStream for the Response body.
 */
export const renderDivisionPdf = async (
  props: DivisionPdfProps,
): Promise<NodeJS.ReadableStream> => renderToStream(<DivisionDocument {...props} />);
