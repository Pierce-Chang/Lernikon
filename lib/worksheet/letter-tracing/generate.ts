import {
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

/**
 * Expands the user's selection into render-ready blocks. For "both" we emit
 * an uppercase block followed by a lowercase block per chosen letter, in the
 * order the letters were picked.
 */
export const generateLetterTracing = (
  rawConfig: LetterTracingConfig,
): LetterTracingSheet => {
  const config = letterTracingConfigSchema.parse(rawConfig),
    blocks: LetterBlock[] = [];

  for (const letter of config.letters) {
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
