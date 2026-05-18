import { marienkaeferConfigSchema, type MarienkaeferConfig } from "./config";

/** Output of the Marienkaefer generator. */
export interface MarienkaeferSheet {
  /** Numbers to display, one per ladybird cell. */
  numbers: number[];
  count: number;
  seed: number;
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

/**
 * Fisher-Yates in-place shuffle of an array.
 * Mutates and returns the input array.
 */
const shuffle = (arr: number[], rng: () => number): number[] => {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = arr[i];
    arr[i] = arr[j] as number;
    arr[j] = tmp as number;
  }
  return arr;
};

/**
 * Generates numbers for the Marienkaefer worksheet.
 * count=6: pick 6 distinct numbers from [1..10] via Fisher-Yates subset.
 * count=10: shuffle all numbers [1..10].
 * No duplicates guaranteed by the algorithm design.
 */
export const generateMarienkaefer = (
  rawConfig: MarienkaeferConfig,
  explicitSeed?: number,
): MarienkaeferSheet => {
  const config = marienkaeferConfigSchema.parse(rawConfig),
    seed = explicitSeed ?? config.seed ?? Math.floor(Math.random() * 2 ** 31),
    rng = mulberry32(seed),
    pool = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  shuffle(pool, rng);

  const numbers = pool.slice(0, config.count);

  return { numbers, count: config.count, seed };
};
