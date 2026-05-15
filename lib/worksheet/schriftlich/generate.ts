import { schriftlichConfigSchema, type SchriftlichConfig, type SchriftlichOperation } from "./config";

export interface SchriftlichProblem {
  a: number;
  b: number;
  operation: "addition" | "subtraktion";
  result: number;
}

/**
 * Tiny seedable PRNG (mulberry32). Same algorithm used by einmaleins and
 * diktat generators — keeps tests deterministic and lets callers regenerate
 * an identical sheet by seed.
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

/** Operand range bounds for a given digit count. */
const stellenRange = (stellen: 3 | 4): { min: number; max: number } =>
  stellen === 3 ? { min: 100, max: 999 } : { min: 1000, max: 9999 };

/**
 * Pick the concrete operation for a single problem. For "gemischt" the
 * decision flips based on the PRNG so the mix is deterministic from the seed.
 */
const pickOperation = (
  rng: () => number,
  operation: SchriftlichOperation,
): "addition" | "subtraktion" => {
  if (operation === "addition") return "addition";
  if (operation === "subtraktion") return "subtraktion";
  return rng() < 0.5 ? "addition" : "subtraktion";
};

/**
 * Generates column-arithmetic problems for Klasse 4 schriftliche Verfahren.
 * For each problem both operands are within the range defined by `stellen`.
 * Subtraction always has a >= b (no negative results).
 * Duplicate operand pairs are avoided up to the pool capacity; beyond that
 * duplicates are allowed rather than looping forever.
 */
export const generateSchriftlich = (
  rawConfig: SchriftlichConfig,
  seed?: number,
): SchriftlichProblem[] => {
  const config = schriftlichConfigSchema.parse(rawConfig),
    rng = mulberry32(seed ?? config.seed ?? Math.floor(Math.random() * 2 ** 31)),
    { min, max } = stellenRange(config.stellen),
    seen = new Set<string>(),
    problems: SchriftlichProblem[] = [];

  const maxAttempts = config.count * 50;
  let attempts = 0;

  while (problems.length < config.count && attempts < maxAttempts) {
    attempts += 1;
    const op = pickOperation(rng, config.operation);
    let a = randInt(rng, min, max),
      b = randInt(rng, min, max);

    // Ensure a >= b for subtraction so the result is never negative.
    if (op === "subtraktion" && a < b) {
      const tmp = a;
      a = b;
      b = tmp;
    }

    const key = `${op}|${a}|${b}`;
    if (seen.has(key)) continue;
    seen.add(key);

    problems.push({
      a,
      b,
      operation: op,
      result: op === "addition" ? a + b : a - b,
    });
  }

  // Pad with duplicates if the unique pool is exhausted.
  while (problems.length < config.count) {
    const op = pickOperation(rng, config.operation);
    let a = randInt(rng, min, max),
      b = randInt(rng, min, max);
    if (op === "subtraktion" && a < b) {
      const tmp = a;
      a = b;
      b = tmp;
    }
    problems.push({
      a,
      b,
      operation: op,
      result: op === "addition" ? a + b : a - b,
    });
  }

  return problems;
};
