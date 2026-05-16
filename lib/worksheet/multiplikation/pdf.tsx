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
import type { MulProblem } from "./generate";
import type { MulStellen } from "./config";
import { STELLEN_LABELS } from "./config";
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

// ── Merkkasten step arrays (chosen per stellen mode) ──────────────────────
const STEPS_3X1 = [
  "Schreibe beide Zahlen stellenrichtig untereinander. Das × steht links neben der unteren Zahl.",
  "Multipliziere die obere Zahl mit dem Multiplikator, Stelle für Stelle und mit Übertrag.",
  "Schreibe das Ergebnis unter den Strich. Bei einstelligen Multiplikatoren ist das gleich das Endergebnis.",
] as const;

const STEPS_3X2 = [
  "Schreibe beide Zahlen stellenrichtig untereinander. Das × steht links neben der unteren Zahl.",
  "Multipliziere die obere Zahl mit der Einerstelle des Multiplikators. Schreibe das Ergebnis unter den Strich.",
  "Multipliziere die obere Zahl mit der Zehnerstelle. Schreibe dieses Teilprodukt eine Stelle weiter nach links versetzt.",
  "Ziehe einen Strich unter die Teilprodukte und addiere sie zum Endergebnis.",
] as const;

/** Hardcoded examples — not part of the generated exercise set. */
const EXAMPLE_3X1 = { a: 345, b: 6, partials: [2070], result: 2070 } as const;
const EXAMPLE_3X2 = { a: 345, b: 12, partials: [690, 345], result: 4140 } as const;

// ── Brand palette (mirrors lib/worksheet/schriftlich/pdf.tsx) ─────────────
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

// Fixed width per digit cell (pt). Right-alignment is achieved by padding
// shorter numbers with blank leading cells.
const DIGIT_W = 14;
// Width of the operator column (the × sign sits here).
const OP_W = 16;

// Total column count: multiplicand is at most 3 digits; result/partial products
// can be up to 6 digits for 3x2 (999×99 = 98,901 → 5 digits, plus one carry
// guard). Using 6 gives comfortable overflow margin for all cases.
const TOTAL_COLS = 6;

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
  // One row that holds the operator placeholder + digit cells.
  digitRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  // The × operator sits in this fixed-width cell to the left of the digits.
  operatorCell: {
    width: OP_W,
    fontSize: 17,
    fontFamily: "Helvetica-Bold",
    color: COLOR.brand,
    textAlign: "center",
  },
  // Spacer keeping the top rows aligned with the multiplier row that has OP_W.
  operatorSpacer: {
    width: OP_W,
  },
  digitCell: {
    width: DIGIT_W,
    fontSize: 20,
    fontFamily: "Helvetica",
    color: COLOR.textDark,
    textAlign: "center",
  },
  digitCellBrand: {
    width: DIGIT_W,
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    color: COLOR.brand,
    textAlign: "center",
  },
  // Horizontal rule between problem lines.
  ruleLine: {
    marginTop: 3,
    marginBottom: 3,
    borderBottomWidth: 1,
    borderBottomColor: COLOR.textDark,
  },
  // Blank answer cells: underline-only, no text.
  blankCell: {
    width: DIGIT_W,
    height: 22,
    borderBottomWidth: 1,
    borderBottomColor: COLOR.writeLine,
    marginLeft: 1,
    marginRight: 1,
  },
  // Empty spacer cell (no underline) — used for leading positions in partial rows.
  emptyCell: {
    width: DIGIT_W,
    height: 22,
    marginLeft: 1,
    marginRight: 1,
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
  merkkastenBody: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  merkkastenSteps: {
    flex: 1.6,
  },
  merkkastenStep: {
    fontSize: 9,
    fontFamily: "Helvetica",
    color: COLOR.textDark,
    marginBottom: 3,
  },
  merkkastenExample: {
    marginLeft: 16,
    alignItems: "flex-end",
  },
  merkkastenExampleRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  merkkastenExampleText: {
    fontSize: 8,
    fontFamily: "Helvetica",
    color: COLOR.textDark,
  },
  merkkastenExampleOp: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: COLOR.brand,
    marginRight: 2,
  },
  merkkastenExampleNote: {
    fontSize: 7,
    fontFamily: "Helvetica",
    color: COLOR.textMuted,
    marginLeft: 4,
  },
  merkkastenRule: {
    borderBottomWidth: 1,
    borderBottomColor: COLOR.textDark,
    marginTop: 2,
    marginBottom: 2,
  },
  merkkastenResult: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: COLOR.brand,
    textAlign: "right",
  },
});

/** Split a number into individual digit characters, left-padded with spaces to `width`. */
const digitChars = (n: number, width: number): string[] =>
  String(n).padStart(width, " ").split("");

/**
 * Renders a row of right-aligned digit cells.
 * Leading spaces render as blank (no character) so shorter numbers still
 * right-align with wider ones in the same box.
 */
const DigitRow = ({
  value,
  bold,
  brand,
}: {
  value: number;
  bold?: boolean;
  brand?: boolean;
}): ReactElement => {
  const chars = digitChars(value, TOTAL_COLS),
    cellStyle = brand ? styles.digitCellBrand : styles.digitCell;
  return (
    <View style={styles.digitRow}>
      <View style={styles.operatorSpacer} />
      {chars.map((ch, i) => (
        <Text key={i} style={cellStyle}>
          {ch === " " ? "" : ch}
        </Text>
      ))}
    </View>
  );
};

/**
 * Renders a partial-product row shifted left by `shift` positions.
 * The shift mimics the schoolbook layout where the second partial is written
 * one position to the left. Blank underline cells fill the trailing positions.
 * On the Aufgabenblatt both the partial digits and trailing cells are blank
 * (blank underlines across the full width). On the Lösungsblatt the digits
 * are shown in brand color and trailing cells are also blank underlines.
 */
const PartialRow = ({
  value,
  shift,
  showAnswer,
}: {
  value: number;
  shift: number;
  showAnswer: boolean;
}): ReactElement => {
  // Width of the digit portion of this partial product.
  const valueStr = String(value),
    valueLen = valueStr.length,
    // Total visible positions = valueLen + shift trailing blanks (the positions
    // that would be 0s in long multiplication).
    totalPositions = TOTAL_COLS;

  // Build the character array for the full row (TOTAL_COLS wide).
  // The partial value is right-aligned into the row, then shifted left by `shift`
  // positions (i.e. the value occupies columns [shift, shift+valueLen-1] from right).
  const cells: Array<{ kind: "digit" | "blank"; ch?: string }> = [];

  // How the TOTAL_COLS columns map:
  // column 0 = leftmost (most significant), column TOTAL_COLS-1 = rightmost
  // The value right-aligns at column TOTAL_COLS-1-shift to TOTAL_COLS-1-shift-valueLen+1.
  const valueStart = totalPositions - shift - valueLen;

  for (let col = 0; col < totalPositions; col++) {
    if (col >= valueStart && col < valueStart + valueLen) {
      cells.push({ kind: "digit", ch: valueStr[col - valueStart] });
    } else {
      cells.push({ kind: "blank" });
    }
  }

  return (
    <View style={styles.digitRow}>
      <View style={styles.operatorSpacer} />
      {cells.map((cell, i) => {
        if (cell.kind === "blank") {
          // On Aufgabenblatt blank the entire row; on Lösungsblatt show underlines
          // only in trailing (shift) positions, rest are empty.
          const isTrailing = i >= totalPositions - shift;
          if (isTrailing) {
            return <View key={i} style={styles.blankCell} />;
          }
          return <View key={i} style={styles.emptyCell} />;
        }
        // Digit cell
        if (!showAnswer) {
          return <View key={i} style={styles.blankCell} />;
        }
        return (
          <Text key={i} style={styles.digitCellBrand}>
            {cell.ch}
          </Text>
        );
      })}
    </View>
  );
};

/** Blank row of underline cells for the result line (Aufgabenblatt). */
const BlankResultRow = (): ReactElement => (
  <View style={styles.digitRow}>
    <View style={styles.operatorSpacer} />
    {Array.from({ length: TOTAL_COLS }).map((_, i) => (
      <View key={i} style={styles.blankCell} />
    ))}
  </View>
);

/**
 * One complete problem box.
 * Layout (schoolbook style):
 *   multiplicand row (right-aligned, top)
 *   × multiplier row
 *   ───────────────   (rule)
 *   partial product row 1   (units digit of multiplier)
 *   partial product row 2   (tens digit — shifted left by 1, if 3x2)
 *   ───────────────   (rule)
 *   result row
 */
const ProblemCell = ({
  problem,
  index,
  showAnswer,
  cellStyle,
}: {
  problem: MulProblem;
  index: number;
  showAnswer: boolean;
  cellStyle: (typeof styles)[keyof typeof styles];
}): ReactElement => {
  const innerStyle = showAnswer ? styles.answerInner : styles.cellInner;
  return (
    <View style={cellStyle} wrap={false}>
      <View style={innerStyle}>
        <Text style={styles.problemLabel}>{index + 1}.</Text>

        {/* Multiplicand row */}
        <DigitRow value={problem.multiplicand} />

        {/* Multiplier row with × operator */}
        <View style={styles.digitRow}>
          <Text style={styles.operatorCell}>{"×"}</Text>
          {digitChars(problem.multiplier, TOTAL_COLS).map((ch, i) => (
            <Text key={i} style={styles.digitCell}>
              {ch === " " ? "" : ch}
            </Text>
          ))}
        </View>

        {/* Rule between operands and partial products */}
        <View style={styles.ruleLine} />

        {/* Partial product rows (one per multiplier digit, LSB first) */}
        {problem.partialProducts.map((pp, i) => (
          <PartialRow key={i} value={pp} shift={i} showAnswer={showAnswer} />
        ))}

        {/* Rule + result row — only when there are 2 partial products to sum.
            For single-digit multiplier (3x1) the single partial product IS the result. */}
        {problem.partialProducts.length > 1 && (
          <>
            <View style={styles.ruleLine} />
            {showAnswer ? (
              <DigitRow value={problem.result} brand />
            ) : (
              <BlankResultRow />
            )}
          </>
        )}
      </View>
    </View>
  );
};

/**
 * Renders the step-by-step explanation box for parents.
 * Shown only on the Aufgabenblatt (Page 1), not on the Losungsblatt.
 * Content adapts to the stellen mode: 3x1 omits the Zehnerstelle step.
 */
const Merkkasten = ({ stellen }: { stellen: MulStellen }): ReactElement => {
  const steps = stellen === "3x1" ? STEPS_3X1 : STEPS_3X2,
    ex = stellen === "3x1" ? EXAMPLE_3X1 : EXAMPLE_3X2;

  return (
    <View style={styles.merkkastenWrap}>
      <Text style={styles.merkkastenTitle}>
        {"Merkkasten · So rechnest du schriftlich mal"}
      </Text>
      <View style={styles.merkkastenBody}>
        {/* Step list */}
        <View style={styles.merkkastenSteps}>
          {steps.map((step, i) => (
            <Text key={i} style={styles.merkkastenStep}>
              {`${i + 1}. ${step}`}
            </Text>
          ))}
        </View>

        {/* Example column */}
        <View style={styles.merkkastenExample}>
          {/* Multiplicand */}
          <View style={styles.merkkastenExampleRow}>
            <Text style={styles.merkkastenExampleText}>
              {String(ex.a).padStart(6, " ")}
            </Text>
          </View>

          {/* Multiplier row with × operator (U+00D7 — in WinAnsi/Latin-1) */}
          <View style={styles.merkkastenExampleRow}>
            <Text style={styles.merkkastenExampleOp}>{"×"}</Text>
            <Text style={styles.merkkastenExampleText}>
              {String(ex.b).padStart(5, " ")}
            </Text>
          </View>

          {/* Rule */}
          <View style={styles.merkkastenRule} />

          {/* Partial products with parens annotation (no arrows — WinAnsi lacks ← →) */}
          {ex.partials.map((pp, i) => (
            <View key={i} style={styles.merkkastenExampleRow}>
              <Text style={styles.merkkastenExampleText}>
                {String(pp).padStart(7, " ")}
              </Text>
              {stellen === "3x2" && (
                <Text style={styles.merkkastenExampleNote}>
                  {i === 0
                    ? `(${ex.a} × ${ex.b % 10})`
                    : `(${ex.a} × ${Math.floor(ex.b / 10)}, eine Stelle versetzt)`}
                </Text>
              )}
            </View>
          ))}

          {/* Second rule + result — only for 3x2 (3x1 has one partial = result) */}
          {stellen === "3x2" && (
            <>
              <View style={styles.merkkastenRule} />
              <Text style={styles.merkkastenResult}>
                {String(ex.result).padStart(7, " ")}
              </Text>
            </>
          )}
        </View>
      </View>
    </View>
  );
};

/** Build the subtitle string shown under the heading. */
const buildSubtitle = (stellen: MulStellen, count: number): string =>
  `${STELLEN_LABELS[stellen]} · ${count} Aufgaben`;

export interface MultiplikationPdfProps {
  childName: string;
  date: string;
  problems: MulProblem[];
  stellen: MulStellen;
  theme: ThemeId;
  showWatermark: boolean;
  includeSolutions: boolean;
  merkkasten: boolean;
}

const MultiplikationDocument = ({
  childName,
  date,
  problems,
  stellen,
  theme,
  showWatermark,
  includeSolutions,
  merkkasten,
}: MultiplikationPdfProps): ReactElement => {
  const themeMeta = getTheme(theme),
    count = problems.length,
    threeColumns = count >= 12,
    cellStyle = threeColumns ? styles.cellThird : styles.cellHalf,
    subtitle = buildSubtitle(stellen, count);

  return (
    <Document
      title={`Schriftliche Multiplikation fur ${childName}`}
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
            <Text style={styles.title}>Schriftlich multiplizieren</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
          </View>
          <View style={styles.metaCol}>
            <Text style={styles.metaLabel}>Name</Text>
            <Text style={styles.metaValue}>{childName}</Text>
            <Text style={styles.metaLabel}>Datum</Text>
            <Text style={styles.metaValue}>{date}</Text>
          </View>
        </View>

        {merkkasten && <Merkkasten stellen={stellen} />}

        <View style={styles.grid}>
          {problems.map((problem, i) => (
            <ProblemCell
              key={i}
              problem={problem}
              index={i}
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
          <View style={styles.topAccent} fixed />
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
 * Renders the schriftliche Multiplikation worksheet to a Node Readable stream.
 * Caller wraps it in a Web ReadableStream for the Response body.
 */
export const renderMultiplikationPdf = async (
  props: MultiplikationPdfProps,
): Promise<NodeJS.ReadableStream> => renderToStream(<MultiplikationDocument {...props} />);
