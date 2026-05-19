import { VOCABULARY_CORPUS, type VocabularyEntry } from "./corpus";
import { vokabelnConfigSchema, BUCKET_IDS, type VokabelnConfig } from "./config";

export type { VocabularyEntry };

export interface VokabelnSheet {
  items: VocabularyEntry[];
  linesPerWord: number;
  seed: number;
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
 * Picks `count` distinct vocabulary entries from the enabled buckets using a
 * seedable Fisher-Yates shuffle. Server applies canonical bucket sort before
 * calling this so the result is deterministic regardless of client-side bucket order.
 */
export const generateVokabelnAbschreiben = (
  rawConfig: VokabelnConfig,
  explicitSeed?: number,
): VokabelnSheet => {
  const config = vokabelnConfigSchema.parse(rawConfig),
    // Canonical bucket order: BUCKET_IDS order, not client submission order.
    canonicalBuckets = BUCKET_IDS.filter((id) => config.buckets.includes(id)),
    pool = VOCABULARY_CORPUS.filter((entry) =>
      canonicalBuckets.includes(entry.bucket),
    ),
    resolvedSeed =
      explicitSeed ?? config.seed ?? Math.floor(Math.random() * 2 ** 31);

  if (pool.length < config.count) {
    throw new Error(
      `Pool size ${pool.length} is smaller than requested count ${config.count}. Select more buckets.`,
    );
  }

  const rng = mulberry32(resolvedSeed),
    mutablePool = [...pool];

  // Partial Fisher-Yates: shuffle only until we have `count` items.
  for (let i = 0; i < config.count; i++) {
    const j = i + Math.floor(rng() * (mutablePool.length - i)),
      tmp = mutablePool[i];
    mutablePool[i] = mutablePool[j];
    mutablePool[j] = tmp;
  }

  return {
    items: mutablePool.slice(0, config.count),
    linesPerWord: config.linesPerWord,
    seed: resolvedSeed,
  };
};
