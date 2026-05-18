import { mengenConfigSchema, SHAPE_IDS, type ShapeId, type MengenConfig } from "./config";

/** One counting task: a shape image group + expected answer. */
export interface MengenTask {
  shape: ShapeId;
  quantity: number;
}

/** Full output returned by the generator. */
export interface MengenSheet {
  tasks: MengenTask[];
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

/** Pick a random integer in [min, max] inclusive. */
const randInt = (rng: () => number, min: number, max: number): number =>
  Math.floor(rng() * (max - min + 1)) + min;

/**
 * Fisher-Yates shuffle in place. Returns the same array for convenience.
 */
const shuffle = <T>(arr: T[], rng: () => number): T[] => {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = arr[i];
    arr[i] = arr[j] as T;
    arr[j] = tmp as T;
  }
  return arr;
};

/**
 * Generates Mengen counting tasks for Vorschule.
 * Each task shows a group of identical shapes; the child counts and writes the number.
 *
 * Round-robin over the quantity pool: quantities [1..rangeMax] are shuffled into a
 * round, exhausted in order, then the pool is reshuffled for the next round.
 * At round boundaries the new round is rotated so its first element differs from the
 * last quantity already placed — this prevents cross-round adjacency conflicts without
 * any post-hoc swapping. Within a round the sequence is already collision-free because
 * every quantity appears exactly once.
 *
 * When count <= rangeMax every quantity on the sheet is distinct.
 * When count > rangeMax each quantity reappears only after a full round.
 * Shapes rotate independently via a pointer + small random offset for even distribution.
 */
export const generateMengen = (rawConfig: MengenConfig, explicitSeed?: number): MengenSheet => {
  const config = mengenConfigSchema.parse(rawConfig),
    seed = explicitSeed ?? config.seed ?? Math.floor(Math.random() * 2 ** 31),
    rng = mulberry32(seed),
    rangeMax = config.range === "1-5" ? 5 : 10;

  // Build the initial quantity pool [1..rangeMax].
  const basePool: number[] = Array.from({ length: rangeMax }, (_, i) => i + 1);

  const tasks: MengenTask[] = [];
  let shapePointer = 0,
    roundPool: number[] = [];

  while (tasks.length < config.count) {
    // Refill and reshuffle the pool when exhausted.
    if (roundPool.length === 0) {
      roundPool = shuffle([...basePool], rng);

      // Rotate the new round so its first element differs from the last placed quantity.
      // With rangeMax >= 2 this always succeeds within rangeMax-1 rotations.
      if (tasks.length > 0) {
        const lastQuantity = tasks[tasks.length - 1]!.quantity;
        let rotations = 0;
        while (roundPool[0] === lastQuantity && rotations < rangeMax - 1) {
          roundPool.push(roundPool.shift() as number);
          rotations++;
        }
      }
    }

    const quantity = roundPool.shift() as number,
      shapeIndex = (shapePointer + randInt(rng, 0, 1)) % SHAPE_IDS.length,
      shape = SHAPE_IDS[shapeIndex] as ShapeId;

    tasks.push({ shape, quantity });
    shapePointer = (shapePointer + 1) % SHAPE_IDS.length;
  }

  return { tasks, seed };
};
