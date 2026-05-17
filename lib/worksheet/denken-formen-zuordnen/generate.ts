/**
 * Generator for the "Formen zuordnen" worksheet.
 * Picks paarCount shapes and assigns each a unique pastel colour.
 * The right column shows the same shapes in a shuffled order so the child
 * can draw lines between matching pairs.
 * Uses mulberry32 PRNG so the same seed always yields the same sheet.
 */

import { formenZuordnenConfigSchema, PASTELL_COLORS, type FormenZuordnenConfig } from "./config";
import { SHAPE_IDS, type ShapeId } from "./shapes";

// ── PRNG (mulberry32 — same algorithm used across all Lernikon generators) ─────

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

/** In-place Fisher-Yates shuffle. Returns the same array. */
const shuffle = <T>(arr: T[], rng: () => number): T[] => {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

/**
 * Sample `n` items from `pool` without replacement using Fisher-Yates.
 * Does not mutate the original array.
 */
const sample = <T>(pool: readonly T[], n: number, rng: () => number): T[] => {
  const copy = [...pool];
  shuffle(copy, rng);
  return copy.slice(0, n);
};

// ── Output types ──────────────────────────────────────────────────────────────

export interface LeftItem {
  /** Stable index used to link left and right items. */
  id: number;
  shapeId: ShapeId;
  /** Pastel fill colour assigned to this pair. */
  color: string;
}

export interface FormenZuordnenSheet {
  /** Left column items in display order (fixed). */
  leftItems: LeftItem[];
  /**
   * Right column: the same shapeIds as leftItems but in a shuffled order.
   * Index i in rightOrder corresponds to leftItems[i].id via shapeId matching.
   * The renderer resolves which leftItem each right slot belongs to by shapeId.
   */
  rightOrder: ShapeId[];
}

// ── Generator ─────────────────────────────────────────────────────────────────

/**
 * Generate a "Formen zuordnen" sheet for the given config.
 * @param config Validated FormenZuordnenConfig.
 * @param seedOverride Optional seed override (takes priority over config.seed).
 */
export const generateFormenZuordnen = (
  config: FormenZuordnenConfig,
  seedOverride?: number,
): FormenZuordnenSheet => {
  const parsed = formenZuordnenConfigSchema.safeParse(config);
  if (!parsed.success) {
    throw new Error(`Invalid config: ${parsed.error.message}`);
  }

  const seed = seedOverride ?? config.seed ?? Math.floor(Math.random() * 0xffffffff);
  const rng = mulberry32(seed);

  const { paarCount } = config;

  // Pick paarCount unique shapes and paarCount unique colours.
  const chosenShapes = sample(SHAPE_IDS, paarCount, rng);
  const chosenColors = sample(PASTELL_COLORS, paarCount, rng);

  const leftItems: LeftItem[] = chosenShapes.map((shapeId, i) => ({
    id: i,
    shapeId,
    color: chosenColors[i],
  }));

  // Shuffle the right column. Re-shuffle if identical to left order (safety check).
  let rightOrder = [...chosenShapes];
  shuffle(rightOrder, rng);
  const leftOrder = chosenShapes.join(",");
  while (rightOrder.join(",") === leftOrder) {
    shuffle(rightOrder, rng);
  }

  return { leftItems, rightOrder };
};
