import { WOERTER_BY_KLASSE } from "./corpus";
import { WoerterConfigSchema, type WoerterConfig } from "./config";

export interface WoerterBlock {
  word: string;
  lines: number;
}

/** Mulberry32 seedable PRNG — same algorithm used across all Lernikon generators. */
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
 * Picks `count` distinct words from the corpus for the given Klasse using a
 * seedable Fisher-Yates shuffle. Returns one block per word with the
 * requested number of practice lines. Deterministic for a given seed.
 */
export const generateWoerter = (rawConfig: WoerterConfig, seed?: number): WoerterBlock[] => {
  const config = WoerterConfigSchema.parse(rawConfig),
    corpus = [...WOERTER_BY_KLASSE[config.klasse]],
    rng = mulberry32(seed ?? config.seed ?? Math.floor(Math.random() * 2 ** 31));

  // Partial Fisher-Yates: shuffle only until we have `count` items.
  for (let i = 0; i < config.count; i++) {
    const j = i + Math.floor(rng() * (corpus.length - i));
    const tmp = corpus[i];
    corpus[i] = corpus[j];
    corpus[j] = tmp;
  }

  return corpus.slice(0, config.count).map((word) => ({
    word,
    lines: config.linesPerWord,
  }));
};
