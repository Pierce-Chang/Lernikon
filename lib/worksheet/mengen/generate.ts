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
 * Generates Mengen counting tasks for Vorschule.
 * Each task shows a group of identical shapes; the child counts and writes the number.
 * Shapes rotate evenly across the 8 available types. No duplicate (shape, quantity) pairs.
 */
export const generateMengen = (rawConfig: MengenConfig, explicitSeed?: number): MengenSheet => {
  const config = mengenConfigSchema.parse(rawConfig),
    seed = explicitSeed ?? config.seed ?? Math.floor(Math.random() * 2 ** 31),
    rng = mulberry32(seed),
    rangeMax = config.range === "1-5" ? 5 : 10,
    seen = new Set<string>(),
    tasks: MengenTask[] = [];

  // Shape rotation pointer — keeps distribution even across the 8 shapes.
  let shapePointer = 0;
  const maxAttempts = config.count * 100;
  let attempts = 0;

  while (tasks.length < config.count && attempts < maxAttempts) {
    attempts += 1;

    // Rotate through shapes in order, with a small random offset to break monotony.
    const shapeIndex = (shapePointer + randInt(rng, 0, 1)) % SHAPE_IDS.length,
      shape = SHAPE_IDS[shapeIndex],
      quantity = randInt(rng, 1, rangeMax),
      key = `${shape}|${quantity}`;

    if (seen.has(key)) continue;
    seen.add(key);
    tasks.push({ shape, quantity });
    shapePointer = (shapePointer + 1) % SHAPE_IDS.length;
  }

  return { tasks, seed };
};
