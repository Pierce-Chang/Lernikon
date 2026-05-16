import { WORTARTEN_CORPUS, type Wortart, type WortartEntry } from "./corpus";
import { wortartenConfigSchema, type WortartenConfig } from "./config";

export interface WortartenItem {
  id: number;
  /** Word displayed on the worksheet — always lowercase. */
  word: string;
  wortart: Wortart;
}

export interface WortartenSheet {
  items: WortartenItem[];
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

/** Minimum guaranteed entries per wortart category. */
const minPerWortart = (count: number): number => (count <= 10 ? 2 : 3);

/**
 * Returns a balanced selection from the corpus, ensuring at least
 * `minPerWortart(count)` entries from each of the three categories.
 * Uses a single Fisher-Yates pass then enforces the balance with targeted swaps.
 */
const balancedPick = (rng: () => number, count: number): WortartEntry[] => {
  const pool = pickN(rng, [...WORTARTEN_CORPUS], count);
  const min = minPerWortart(count);
  const wortarten: Wortart[] = ["nomen", "verb", "adjektiv"];

  // Count how many of each category are in `pool`.
  const inPool = (w: Wortart) => pool.filter((e) => e.wortart === w).length;

  for (const wortart of wortarten) {
    const deficit = min - inPool(wortart);
    if (deficit <= 0) continue;

    // Find indices in pool that are NOT this wortart and have excess (> min).
    for (let filled = 0; filled < deficit; filled++) {
      // Pick a surplus category to steal from.
      const surplusIdx = pool.findIndex(
        (e) =>
          e.wortart !== wortart &&
          inPool(e.wortart) > min,
      );
      if (surplusIdx === -1) break; // Safety — should not happen with corpus sizes.

      // Find a replacement from the full corpus that belongs to `wortart`
      // and is not already in the pool.
      const poolWords = new Set(pool.map((e) => e.word));
      const candidates = WORTARTEN_CORPUS.filter(
        (e) => e.wortart === wortart && !poolWords.has(e.word),
      );
      if (candidates.length === 0) break;

      const replacement = candidates[Math.floor(rng() * candidates.length)];
      pool[surplusIdx] = replacement;
    }
  }

  // Final shuffle so wortart groups are not clustered.
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = pool[i];
    pool[i] = pool[j];
    pool[j] = tmp;
  }

  return pool;
};

/**
 * Generates a Wortarten worksheet for Klasse 2.
 * All three word types are always mixed. Words are rendered lowercase so
 * capitalisation does not give away the Nomen answer.
 */
export const generateWortarten = (rawConfig: WortartenConfig): WortartenSheet => {
  const config = wortartenConfigSchema.parse(rawConfig),
    rng = mulberry32(config.seed ?? Math.floor(Math.random() * 2 ** 31));

  const picked = balancedPick(rng, config.count);

  const items: WortartenItem[] = picked.map((entry, i) => ({
    id: i + 1,
    word: entry.word.toLowerCase(),
    wortart: entry.wortart,
  }));

  return { items };
};
