import { divisionConfigSchema, MAX_QUOTIENT_DIGITS, type DivisionConfig } from "./config";

/**
 * One step in the long-division procedure.
 * Represents the work done for a single quotient digit.
 */
export interface DivStep {
  /** Current partial dividend (e.g. 7 then 32 then 8 for 728 : 4). */
  partial: number;
  /** Digit brought down from the dividend this step (null on the first step). */
  downBring: number | null;
  /** What is subtracted: quotientDigit * divisor. */
  sub: number;
  /** Remainder after subtracting sub from partial. */
  remainder: number;
  /** The digit of the quotient produced by this step. */
  quotientDigit: number;
}

export interface DivProblem {
  id: number;
  dividend: number;
  divisor: number;
  quotient: number;
  remainder: number;
  steps: DivStep[];
}

/**
 * Tiny seedable PRNG (mulberry32). Same algorithm used across Lernikon
 * generators — keeps tests deterministic by seed.
 */
const mulberry32 = (seed: number) => {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

/** Pick a random integer in [min, max] inclusive. */
const randInt = (rng: () => number, min: number, max: number): number =>
  Math.floor(rng() * (max - min + 1)) + min;

/**
 * Compute the long-division steps for a given dividend and divisor.
 * Walks through the dividend digits left-to-right, accumulating a partial
 * dividend and producing one DivStep per quotient digit.
 * The number of steps always equals String(Math.floor(dividend / divisor)).length.
 */
const computeSteps = (dividend: number, divisor: number): DivStep[] => {
  const dividendStr = String(dividend),
    steps: DivStep[] = [];

  let partial = 0, prevRemainder = 0;

  for (let i = 0; i < dividendStr.length; i++) {
    const digit = Number(dividendStr[i]);
    const downBring = i === 0 ? null : digit;

    // Accumulate: bring down the next digit into the running partial.
    partial = prevRemainder * 10 + digit;

    // If partial < divisor we haven't started producing quotient digits yet
    // on the very first step — skip to accumulate more digits. This is handled
    // implicitly: quotientDigit will be 0, keeping the step in the array so
    // steps.length stays equal to quotient digit count.
    const quotientDigit = Math.floor(partial / divisor),
      sub = quotientDigit * divisor,
      remainder = partial - sub;

    steps.push({ partial, downBring, sub, remainder, quotientDigit });
    prevRemainder = remainder;
  }

  // Trim leading zero steps that occur when the first dividend digits are
  // smaller than the divisor (e.g. 1234 : 5 -> first digit "1" alone gives
  // quotientDigit=0; the real first step is when partial reaches 12).
  // We keep trimming until we hit the first step with a non-zero quotientDigit,
  // OR until only MAX_QUOTIENT_DIGITS[stellen] steps remain (which handles
  // the edge case where all quotient digits are non-zero from the start).
  // Strategy: merge leading zero-quotient steps into the next step by
  // re-accumulating. This keeps steps.length === quotient.toString().length.
  while (steps.length > 1 && steps[0].quotientDigit === 0) {
    const zeroStep = steps[0],
      nextStep = steps[1];
    // The zero step's partial becomes part of the next step's partial via downBring.
    // nextStep already has the correct partial (accumulated correctly in the loop).
    // We just remove the zero-leading step since it doesn't contribute a quotient digit.
    // nextStep.downBring needs to reflect the original dividend digit it brought down.
    steps.splice(0, 1);
    // Re-attach the downBring for the merged step: it is the digit from the
    // zeroed step's downBring (or null if it was the first).
    if (nextStep.downBring !== null) {
      // Keep nextStep.downBring as the digit it brought down; that is still correct.
      void zeroStep; // suppress unused warning
    }
  }

  return steps;
};

/**
 * Generates schriftliche Division problems for Klasse 4.
 * Operands are drawn within the range defined by `stellen`:
 *   - "3:1": dividend 100-999, divisor 2-9
 *   - "4:1": dividend 1000-9999, divisor 2-9
 *   - "4:2": dividend 1000-9999, divisor 11-99
 * When `mitRest=false`, dividends are forced to be exact multiples of the divisor.
 * The `verfahren` field affects only PDF rendering, not the generated data.
 */
export const generateDivision = (rawConfig: DivisionConfig): DivProblem[] => {
  const config = divisionConfigSchema.parse(rawConfig),
    rng = mulberry32(config.seed ?? Math.floor(Math.random() * 2 ** 31));

  const dividendMin = config.stellen === "3:1" ? 100 : 1000,
    dividendMax = config.stellen === "3:1" ? 999 : 9999,
    divisorMin = config.stellen === "4:2" ? 11 : 2,
    divisorMax = config.stellen === "4:2" ? 99 : 9,
    seen = new Set<string>(),
    problems: DivProblem[] = [];

  const maxAttempts = config.count * 50;
  let attempts = 0;

  while (problems.length < config.count && attempts < maxAttempts) {
    attempts += 1;

    let dividend = randInt(rng, dividendMin, dividendMax);
    const divisor = randInt(rng, divisorMin, divisorMax);

    if (!config.mitRest) {
      // Force exact division.
      const forced = Math.floor(dividend / divisor) * divisor;
      // If forcing drops below range minimum, try again.
      if (forced < dividendMin) continue;
      dividend = forced;
    }

    const key = `${dividend}|${divisor}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const quotient = Math.floor(dividend / divisor),
      remainder = dividend - quotient * divisor,
      steps = computeSteps(dividend, divisor);

    problems.push({ id: problems.length + 1, dividend, divisor, quotient, remainder, steps });
  }

  // Pad with duplicates if the unique pool is exhausted.
  while (problems.length < config.count) {
    let dividend = randInt(rng, dividendMin, dividendMax);
    const divisor = randInt(rng, divisorMin, divisorMax);
    if (!config.mitRest) {
      const forced = Math.floor(dividend / divisor) * divisor;
      if (forced >= dividendMin) dividend = forced;
    }
    const quotient = Math.floor(dividend / divisor),
      remainder = dividend - quotient * divisor,
      steps = computeSteps(dividend, divisor);
    problems.push({ id: problems.length + 1, dividend, divisor, quotient, remainder, steps });
  }

  return problems;
};

// Re-export for consumers that only need the quotient slots constant.
export { MAX_QUOTIENT_DIGITS };
