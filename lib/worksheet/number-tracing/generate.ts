import {
  DIGITS,
  numberTracingConfigSchema,
  type NumberTracingConfig,
} from "./config";

export interface NumberBlock {
  digit: string;
  lines: number;
}

export interface NumberTracingSheet {
  blocks: NumberBlock[];
}

const digitOrder = (d: string) => DIGITS.indexOf(d as (typeof DIGITS)[number]);

/**
 * Converts the user's digit selection into render-ready blocks. Output is
 * always in canonical numeric order (0 → 9) regardless of the order the
 * client picked them. The UI toggle also sorts, but we re-sort here so the
 * PDF is correct even if a stale client sends an unsorted array.
 */
export const generateNumberTracing = (
  rawConfig: NumberTracingConfig,
): NumberTracingSheet => {
  const config = numberTracingConfigSchema.parse(rawConfig),
    sorted = [...config.digits].sort((a, b) => digitOrder(a) - digitOrder(b)),
    blocks: NumberBlock[] = sorted.map((digit) => ({
      digit,
      lines: config.linesPerDigit,
    }));

  return { blocks };
};
