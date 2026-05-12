import {
  AVAILABLE_LETTERS,
  letterTracingConfigSchema,
  type LetterTracingConfig,
} from "./config";

export type LetterDisplayCase = "upper" | "lower";

export interface LetterBlock {
  char: string;
  displayCase: LetterDisplayCase;
  lines: number;
}

export interface LetterTracingSheet {
  blocks: LetterBlock[];
}

const letterOrder = (l: string) => AVAILABLE_LETTERS.indexOf(l.toUpperCase());

/**
 * Expands the user's selection into render-ready blocks. Output is always
 * in canonical alphabetical order (A → Z); for "both" each letter emits an
 * uppercase block followed by its lowercase counterpart. The UI toggle also
 * sorts, but we re-sort here so the PDF is correct even if a stale client
 * sends an unsorted array.
 */
export const generateLetterTracing = (
  rawConfig: LetterTracingConfig,
): LetterTracingSheet => {
  const config = letterTracingConfigSchema.parse(rawConfig),
    sorted = [...config.letters].sort((a, b) => letterOrder(a) - letterOrder(b)),
    blocks: LetterBlock[] = [];

  for (const letter of sorted) {
    const upper = letter.toUpperCase(),
      lower = letter.toLowerCase();
    if (config.case === "upper" || config.case === "both") {
      blocks.push({ char: upper, displayCase: "upper", lines: config.linesPerLetter });
    }
    if (config.case === "lower" || config.case === "both") {
      blocks.push({ char: lower, displayCase: "lower", lines: config.linesPerLetter });
    }
  }

  return { blocks };
};
