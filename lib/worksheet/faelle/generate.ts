import { FAELLE_CORPUS, corpusForFall, type FallId, type FaelleEntry } from "./corpus";
import { faelleConfigSchema, FALL_IDS, type FaelleConfig } from "./config";

export interface FaelleTask extends FaelleEntry {
  /** 1-based index for display. */
  id: number;
}

export interface FaelleSheet {
  tasks: FaelleTask[];
  mode: FaelleConfig["mode"];
  count: number;
  showSolutions: boolean;
  seed: number;
}

/** Tiny seedable PRNG (mulberry32). Same algorithm used across Lernikon generators. */
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
 * Generates 4-Fälle gap-fill tasks for Klasse 4.
 *
 * Single-fall mode: picks `count` distinct entries from that fall's slice.
 * Gemischt mode: distributes `count` evenly across the four base falls
 * (remainder assigned to the first falls), then Fisher-Yates shuffles
 * the combined list so entries are not grouped by fall.
 */
export const generateFaelle = (
  rawConfig: FaelleConfig,
  explicitSeed?: number,
): FaelleSheet => {
  const config = faelleConfigSchema.parse(rawConfig),
    resolvedSeed = explicitSeed ?? config.seed ?? Math.floor(Math.random() * 2 ** 31),
    rng = mulberry32(resolvedSeed);

  let picked: FaelleEntry[];

  if (config.mode === "gemischt") {
    // Distribute count across four falls as evenly as possible.
    // Remainder is distributed to the first `remainder` falls in FALL_IDS order.
    const base = Math.floor(config.count / FALL_IDS.length),
      remainder = config.count % FALL_IDS.length;

    const perFall: number[] = FALL_IDS.map((_, i) => (i < remainder ? base + 1 : base));

    // Pick from each fall's slice independently so PRNG state advances fall-by-fall.
    const slices = FALL_IDS.map((fallId, i) => {
      const slice = [...corpusForFall(fallId as FallId)];
      return pickN(rng, slice, perFall[i]);
    });

    // Flatten then Fisher-Yates the combined list so fall groups are mixed.
    const combined = slices.flat();
    for (let i = combined.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      const tmp = combined[i];
      combined[i] = combined[j];
      combined[j] = tmp;
    }
    picked = combined;
  } else {
    const slice = [...corpusForFall(config.mode as FallId)];
    picked = pickN(rng, slice, config.count);
  }

  const tasks: FaelleTask[] = picked.map((entry, i) => ({
    ...entry,
    id: i + 1,
  }));

  return {
    tasks,
    mode: config.mode,
    count: config.count,
    showSolutions: config.showSolutions,
    seed: resolvedSeed,
  };
};

/**
 * Validates the corpus invariant for every entry: template must contain
 * exactly one sequence of underscores. Called only in tests.
 */
export const validateCorpusInvariants = (): { violations: string[] } => {
  const violations: string[] = [];
  for (const entry of FAELLE_CORPUS) {
    const matches = entry.template.match(/_+/g);
    if (!matches || matches.length !== 1) {
      violations.push(
        `"${entry.template}": expected exactly 1 underscore run, got ${matches?.length ?? 0}`,
      );
    }
  }
  return { violations };
};
