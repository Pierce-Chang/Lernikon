import {
  PatternConfigSchema,
  DIFFICULTY_ARITY,
  getBlankCount,
  PURE_DIFFICULTY_IDS,
  SHAPE_IDS,
  type PatternConfig,
  type ShapeId,
  type Difficulty,
  type PureDifficulty,
} from "./config";

export interface PatternRow {
  /** Full sequence including the positions that will be blank on the sheet. */
  items: ShapeId[];
  /** Zero-based indices of the cells that are left empty for the child to fill. */
  blanks: number[];
  /** The shapes that belong in the blank positions (for the solution page). */
  solutions: ShapeId[];
}

export interface PatternSheet {
  rows: PatternRow[];
  /** Shapes to cut out, one per blank, in shuffled order. Null when mode is fill. */
  cutouts: ShapeId[] | null;
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
 * Fisher-Yates shuffle of a copy of `arr` using the shared PRNG.
 * Returns a new array; the original is not mutated.
 */
const shuffle = <T>(arr: T[], rng: () => number): T[] => {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = randInt(rng, 0, i),
      tmp = result[i];
    result[i] = result[j];
    result[j] = tmp;
  }
  return result;
};

/**
 * Expand a pattern unit into a full sequence of `length` items.
 * If `length` is not a multiple of the unit length, the sequence is
 * truncated at `length` — never padded with a partial unit.
 */
const tile = (unit: ShapeId[], length: number): ShapeId[] => {
  const result: ShapeId[] = [];
  for (let i = 0; i < length; i += 1) {
    result.push(unit[i % unit.length]);
  }
  return result;
};

/**
 * Build the repeating unit for a given pure (non-gemischt) difficulty using
 * `shapes` as the available pool. When the pool is smaller than the required
 * arity the shapes are reused (mod pool length).
 */
const buildUnit = (
  shapes: ShapeId[],
  difficulty: PureDifficulty,
  rng: () => number,
): ShapeId[] => {
  const arity = DIFFICULTY_ARITY[difficulty];

  // Pick `arity` distinct indices from the shape pool if possible.
  const pool = [...shapes];
  const picked: ShapeId[] = [];
  for (let i = 0; i < arity; i += 1) {
    if (pool.length === 0) {
      // Pool exhausted — wrap around.
      pool.push(...shapes);
    }
    const idx = randInt(rng, 0, pool.length - 1);
    picked.push(pool[idx]);
    pool.splice(idx, 1);
  }

  // Build the actual unit pattern based on difficulty, randomizing shape order.
  switch (difficulty) {
    case "abab":
      // 2 distinct shapes in shuffled order → [A,B] or [B,A].
      return shuffle([picked[0], picked[1]], rng);
    case "abcabc":
      // 3 distinct shapes in any of 6 permutations.
      return shuffle([picked[0], picked[1], picked[2]], rng);
    case "abbabb": {
      // 2 distinct shapes; one is doubled. Randomize WHICH shape is doubled
      // AND the position of the singleton within the 3-cell unit.
      const doubledIdx = randInt(rng, 0, 1);
      return shuffle([picked[0], picked[1], picked[doubledIdx]], rng);
    }
  }
};

/**
 * Generates a pattern-tracing sheet. Each row contains a partial sequence
 * with the last few cells blank (stored as blanks/solutions). Output is
 * deterministic when `seed` is supplied.
 *
 * When `difficulty` is `"gemischt"`, each row independently draws a random
 * sub-difficulty from the three pure difficulties so the sheet has visual
 * variety. The same PRNG instance is used throughout, keeping the whole sheet
 * deterministic for a given seed.
 */
export const generatePatternSequences = (
  rawConfig: PatternConfig,
  seed?: number,
): PatternSheet => {
  const config = PatternConfigSchema.parse(rawConfig),
    rng = mulberry32(seed ?? Math.floor(Math.random() * 2 ** 31)),
    { shapes, difficulty, rowCount, itemsPerRow } = config;

  // Canonical order for the shape pool — keeps rows internally consistent
  // regardless of the client's toggle order.
  const canonicalShapes = SHAPE_IDS.filter((id) => shapes.includes(id));

  const rows: PatternRow[] = Array.from({ length: rowCount }, () => {
    // For gemischt, pick a sub-difficulty per row from the same PRNG stream.
    const rowDifficulty: PureDifficulty =
      difficulty === "gemischt"
        ? PURE_DIFFICULTY_IDS[randInt(rng, 0, PURE_DIFFICULTY_IDS.length - 1)]
        : difficulty;

    const blankCount = getBlankCount(rowDifficulty, itemsPerRow),
      unit = buildUnit(canonicalShapes, rowDifficulty, rng),
      items = tile(unit, itemsPerRow),
      blankStart = itemsPerRow - blankCount,
      blanks = Array.from({ length: blankCount }, (_, i) => blankStart + i),
      solutions = blanks.map((idx) => items[idx]);

    return { items, blanks, solutions };
  });

  // Build cutout pool: all solutions from all rows, shuffled via the same PRNG.
  // Null for fill and ausmalen — only cutout mode provides a physical set to cut out.
  let cutouts: ShapeId[] | null = null;
  if (config.mode === "cutout") {
    cutouts = shuffle(rows.flatMap((r) => r.solutions), rng);
  }

  return { rows, cutouts };
};
