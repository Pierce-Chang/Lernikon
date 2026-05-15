import { KLASSE_2_SENTENCES } from "./corpus";
import { DiktatConfigSchema, type DiktatConfig } from "./config";

export interface DiktatSentence {
  id: number;
  text: string;
}

export interface DiktatSheet {
  sentences: DiktatSentence[];
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
 * Picks `count` distinct sentences from the Klasse 2 corpus using a
 * seedable Fisher-Yates shuffle. Returns numbered sentence objects.
 * Deterministic for a given seed.
 */
export const generateDiktat = (rawConfig: DiktatConfig, seed?: number): DiktatSheet => {
  const config = DiktatConfigSchema.parse(rawConfig),
    corpus = [...KLASSE_2_SENTENCES],
    rng = mulberry32(seed ?? config.seed ?? Math.floor(Math.random() * 2 ** 31));

  // Partial Fisher-Yates: shuffle only until we have `count` items.
  for (let i = 0; i < config.count; i++) {
    const j = i + Math.floor(rng() * (corpus.length - i));
    const tmp = corpus[i];
    corpus[i] = corpus[j];
    corpus[j] = tmp;
  }

  const sentences = corpus.slice(0, config.count).map((text, index) => ({
    id: index + 1,
    text,
  }));

  return { sentences };
};
