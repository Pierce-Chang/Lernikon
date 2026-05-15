import { corpusForRule, RECHTSCHREIB_CORPUS, type RuleId } from "./corpus";
import {
  rechtschreibungConfigSchema,
  BASE_RULES,
  BLANK_PLACEHOLDER,
  type RechtschreibungConfig,
} from "./config";

export interface RechtschreibItem {
  id: number;
  /** Fully correct spelling. */
  word: string;
  /** The substring the child must fill in. */
  blank: string;
  /**
   * Display string with the blank replaced by BLANK_PLACEHOLDER.
   * e.g. "L___be" for word="Liebe", blank="ie".
   */
  template: string;
}

export interface RechtschreibSheet {
  entries: RechtschreibItem[];
}

/** Mulberry32 seedable PRNG — identical to other Lernikon generators. */
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
 * Generates Rechtschreibung Lückenwörter for Klasse 3.
 *
 * For a single rule, picks `count` distinct entries from that rule's slice.
 * For "gemischt", distributes `count` evenly across the four base rules, then
 * Fisher-Yates shuffles the combined pick so entries are not grouped by rule.
 */
export const generateRechtschreibung = (
  rawConfig: RechtschreibungConfig,
  seed?: number,
): RechtschreibSheet => {
  const config = rechtschreibungConfigSchema.parse(rawConfig),
    rng = mulberry32(seed ?? config.seed ?? Math.floor(Math.random() * 2 ** 31));

  let picked: import("./corpus").RechtschreibEntry[];

  if (config.rule === "gemischt") {
    // Distribute count across four rules as evenly as possible.
    const base = Math.floor(config.count / BASE_RULES.length),
      remainder = config.count % BASE_RULES.length;

    const perRule: number[] = BASE_RULES.map((_, i) => (i < remainder ? base + 1 : base));

    // Pick from each rule slice independently so the PRNG state advances rule-by-rule.
    const slices = BASE_RULES.map((ruleId, i) => {
      const slice = [...corpusForRule(ruleId as RuleId)];
      return pickN(rng, slice, perRule[i]);
    });

    // Flatten then Fisher-Yates the combined list so rule groups are mixed.
    const combined = slices.flat();
    for (let i = combined.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      const tmp = combined[i];
      combined[i] = combined[j];
      combined[j] = tmp;
    }
    picked = combined;
  } else {
    const slice = [...corpusForRule(config.rule)];
    picked = pickN(rng, slice, config.count);
  }

  const entries: RechtschreibItem[] = picked.map((entry, i) => ({
    id: i + 1,
    word: entry.word,
    blank: entry.blank,
    template: entry.word.replace(entry.blank, BLANK_PLACEHOLDER),
  }));

  return { entries };
};

/**
 * Validates the corpus invariant for every entry in the full corpus.
 * Called only in tests — not on the hot path.
 */
export const validateCorpusInvariants = (): { violations: string[] } => {
  const violations: string[] = [];
  for (const entry of RECHTSCHREIB_CORPUS) {
    const first = entry.word.indexOf(entry.blank),
      last = entry.word.lastIndexOf(entry.blank);
    if (first === -1) {
      violations.push(`"${entry.word}": blank "${entry.blank}" not found`);
    } else if (first !== last) {
      violations.push(
        `"${entry.word}": blank "${entry.blank}" appears more than once (at ${first} and ${last})`,
      );
    }
  }
  return { violations };
};
