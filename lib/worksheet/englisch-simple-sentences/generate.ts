import {
  ENGLISCH_SIMPLE_SENTENCES_CORPUS,
  type EnglischSimpleSentencesEntry,
} from "./corpus";
import {
  englischSimpleSentencesConfigSchema,
  type EnglischSimpleSentencesConfig,
} from "./config";

export interface EnglischSimpleSentencesTask extends EnglischSimpleSentencesEntry {
  /** 1-based display index. */
  id: number;
}

export interface EnglischSimpleSentencesSheet {
  tasks: EnglischSimpleSentencesTask[];
  count: number;
  includeSolutions: boolean;
  seed: number;
}

/** Tiny seedable PRNG (mulberry32). Same algorithm used across all Lernikon generators. */
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

/** In-place partial Fisher-Yates on a mutable copy — returns the first `n` elements. */
const pickN = <T>(rng: () => number, arr: T[], n: number): T[] => {
  const pool = [...arr];
  const take = Math.min(n, pool.length);
  for (let i = 0; i < take; i++) {
    const j = i + Math.floor(rng() * (pool.length - i));
    const tmp = pool[i];
    pool[i] = pool[j];
    pool[j] = tmp;
  }
  return pool.slice(0, take);
};

/**
 * Generates gap-fill sentences testing the English verb "to be".
 *
 * Forward-compat: the pool is filtered on struct === "to-be" so that adding
 * new struct values to the corpus (to-have, present-simple, etc.) in a
 * future task requires no changes here beyond pool filter logic.
 */
export const generateEnglischSimpleSentences = (
  rawConfig: EnglischSimpleSentencesConfig,
  explicitSeed?: number,
): EnglischSimpleSentencesSheet => {
  const config = englischSimpleSentencesConfigSchema.parse(rawConfig),
    resolvedSeed =
      explicitSeed ?? config.seed ?? Math.floor(Math.random() * 2 ** 31),
    rng = mulberry32(resolvedSeed);

  // Forward-compat: when multi-struct support arrives, filter on config.struct.
  const pool = ENGLISCH_SIMPLE_SENTENCES_CORPUS.filter(
    (e) => e.struct === "to-be",
  );

  const picked = pickN(rng, pool, config.count);

  const tasks: EnglischSimpleSentencesTask[] = picked.map((entry, i) => ({
    ...entry,
    id: i + 1,
  }));

  return {
    tasks,
    count: config.count,
    includeSolutions: config.includeSolutions,
    seed: resolvedSeed,
  };
};

/**
 * Validates corpus invariants. Called only from tests — not in production.
 */
export const validateCorpusInvariants = (): { violations: string[] } => {
  const violations: string[] = [];
  for (const entry of ENGLISCH_SIMPLE_SENTENCES_CORPUS) {
    const matches = entry.template.match(/___/g);
    if (!matches || matches.length !== 1) {
      violations.push(
        `template "${entry.template}": expected exactly 1 "___" placeholder, got ${matches?.length ?? 0}`,
      );
    }
    if (!["am", "is", "are"].includes(entry.answer)) {
      violations.push(
        `template "${entry.template}": answer "${entry.answer}" not in [am, is, are]`,
      );
    }
    if (entry.hint !== "to be") {
      violations.push(
        `template "${entry.template}": hint "${entry.hint}" must be "to be"`,
      );
    }
  }
  return { violations };
};
