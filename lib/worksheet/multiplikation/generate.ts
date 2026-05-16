import { multiplikationConfigSchema, type MultiplikationConfig } from "./config";

export interface MulProblem {
  id: number;
  multiplicand: number;
  multiplier: number;
  /**
   * Partial products, one per digit of the multiplier, least-significant first.
   * For 345 × 12: partialProducts = [690, 345] (345×2 then 345×1).
   */
  partialProducts: number[];
  result: number;
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
 * Compute partial products for a multiplication.
 * Returns one value per digit of the multiplier, least-significant digit first.
 * Example: 345 × 12 → [345×2, 345×1] = [690, 345].
 */
const computePartialProducts = (multiplicand: number, multiplier: number): number[] => {
  const digits: number[] = [];
  let rem = multiplier;
  while (rem > 0) {
    digits.push(rem % 10);
    rem = Math.floor(rem / 10);
  }
  return digits.map((d) => multiplicand * d);
};

/**
 * Generates schriftliche Multiplikation problems for Klasse 4.
 * Operands are drawn within the range defined by `stellen`:
 *   - "3x1": multiplicand 100-999, multiplier 2-9
 *   - "3x2": multiplicand 100-999, multiplier 10-99
 * Duplicate (multiplicand, multiplier) pairs are avoided where the pool allows.
 */
export const generateMultiplikation = (
  rawConfig: MultiplikationConfig,
  seed?: number,
): MulProblem[] => {
  const config = multiplikationConfigSchema.parse(rawConfig),
    rng = mulberry32(seed ?? config.seed ?? Math.floor(Math.random() * 2 ** 31)),
    is3x1 = config.stellen === "3x1",
    multiplicandMin = 100,
    multiplicandMax = 999,
    multiplierMin = is3x1 ? 2 : 10,
    multiplierMax = is3x1 ? 9 : 99,
    seen = new Set<string>(),
    problems: MulProblem[] = [];

  const maxAttempts = config.count * 50;
  let attempts = 0;

  while (problems.length < config.count && attempts < maxAttempts) {
    attempts += 1;
    const multiplicand = randInt(rng, multiplicandMin, multiplicandMax),
      multiplier = randInt(rng, multiplierMin, multiplierMax),
      key = `${multiplicand}|${multiplier}`;
    if (seen.has(key)) continue;
    seen.add(key);
    problems.push({
      id: problems.length + 1,
      multiplicand,
      multiplier,
      partialProducts: computePartialProducts(multiplicand, multiplier),
      result: multiplicand * multiplier,
    });
  }

  // Pad with duplicates if the unique pool is exhausted (only possible for 3x1
  // with small count, pool is 900×8 = 7200 for 3x2 so practically unreachable).
  while (problems.length < config.count) {
    const multiplicand = randInt(rng, multiplicandMin, multiplicandMax),
      multiplier = randInt(rng, multiplierMin, multiplierMax);
    problems.push({
      id: problems.length + 1,
      multiplicand,
      multiplier,
      partialProducts: computePartialProducts(multiplicand, multiplier),
      result: multiplicand * multiplier,
    });
  }

  return problems;
};
