import { einmaleinsConfigSchema, ROW_IDS, type EinmaleinsConfig, type RowId } from "./config";

export interface EinmaleinsProblem {
  question: string;
  answer: number;
  row: number;
  multiplier: number;
}

/**
 * Tiny seedable PRNG (mulberry32). Gives deterministic output for the same
 * seed, which keeps tests stable and allows regenerating a sheet by seed.
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
 * Generates Einmaleins problems for the given config.
 * Each problem picks a row from `config.rows` and a multiplier 1-10.
 * Duplicates are avoided up to the unique pair capacity; if the pool is
 * exhausted (e.g. only 1 row selected and count > 10), duplicates are
 * allowed rather than looping forever.
 */
export const generateEinmaleinsProblems = (
  rawConfig: EinmaleinsConfig,
  seed?: number,
): EinmaleinsProblem[] => {
  const config = einmaleinsConfigSchema.parse(rawConfig),
    rng = mulberry32(seed ?? Math.floor(Math.random() * 2 ** 31)),
    seen = new Set<string>(),
    problems: EinmaleinsProblem[] = [];

  const maxAttempts = config.count * 50;
  let attempts = 0;

  while (problems.length < config.count && attempts < maxAttempts) {
    attempts += 1;
    const row = config.rows[randInt(rng, 0, config.rows.length - 1)] as RowId,
      multiplier = randInt(rng, 1, 10),
      key = `${row}|${multiplier}`;
    if (seen.has(key)) continue;
    seen.add(key);
    problems.push({
      question: `${row} · ${multiplier} =`,
      answer: row * multiplier,
      row,
      multiplier,
    });
  }

  // Pad with duplicates when the unique pool is smaller than count.
  while (problems.length < config.count) {
    const row = config.rows[randInt(rng, 0, config.rows.length - 1)] as RowId,
      multiplier = randInt(rng, 1, 10);
    problems.push({
      question: `${row} · ${multiplier} =`,
      answer: row * multiplier,
      row,
      multiplier,
    });
  }

  return problems;
};
