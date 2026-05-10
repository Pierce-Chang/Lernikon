import { worksheetConfigSchema, type Operation, type WorksheetConfig } from "./config";

export interface Problem {
  question: string;
  answer: number;
}

type ConcreteOp = Exclude<Operation, "gemischt">;

/**
 * Tiny seedable PRNG (mulberry32). Avoids non-determinism in tests
 * and lets us regenerate the same sheet from a stored seed.
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

const randInt = (rng: () => number, min: number, max: number): number =>
  Math.floor(rng() * (max - min + 1)) + min;

const renderQuestion = (operation: ConcreteOp, a: number, b: number): string => {
  switch (operation) {
    case "addition":
      return `${a} + ${b} =`;
    case "subtraktion":
      return `${a} − ${b} =`;
  }
};

const computeAnswer = (operation: ConcreteOp, a: number, b: number): number => {
  switch (operation) {
    case "addition":
      return a + b;
    case "subtraktion":
      return a - b;
  }
};

const draw = (
  rng: () => number,
  operation: ConcreteOp,
  rangeMin: number,
  rangeMax: number,
): { a: number; b: number } => {
  const a = randInt(rng, rangeMin, rangeMax),
    b = randInt(rng, rangeMin, rangeMax);
  // For subtraction, force a non-negative result by ordering operands.
  if (operation === "subtraktion" && b > a) {
    return { a: b, b: a };
  }
  return { a, b };
};

// In "gemischt" mode pick a concrete op per problem so add/sub interleave.
const concreteOpFor = (
  configOp: Operation,
  rng: () => number,
): ConcreteOp => {
  if (configOp === "gemischt") {
    return rng() < 0.5 ? "addition" : "subtraktion";
  }
  return configOp;
};

/**
 * Pure problem generator. Validates the config, returns an array of
 * unique problems matching the requested count. Throws on invalid config.
 */
export const generateProblems = (rawConfig: WorksheetConfig): Problem[] => {
  const config = worksheetConfigSchema.parse(rawConfig),
    rng = mulberry32(config.seed ?? Math.floor(Math.random() * 2 ** 31)),
    seen = new Set<string>(),
    problems: Problem[] = [];

  // Bound the search: with very small ranges it is possible to exhaust the
  // unique-pair space before hitting `count`. Cap attempts and fall back to
  // duplicates after the cap to avoid infinite loops.
  const maxAttempts = config.count * 50;
  let attempts = 0;

  while (problems.length < config.count && attempts < maxAttempts) {
    attempts += 1;
    const op = concreteOpFor(config.operation, rng),
      { a, b } = draw(rng, op, config.rangeMin, config.rangeMax),
      // Operator is part of the dedup key so 5+3 and 5−3 don't collide.
      key = `${op}|${a}|${b}`;
    if (seen.has(key)) continue;
    seen.add(key);
    problems.push({
      question: renderQuestion(op, a, b),
      answer: computeAnswer(op, a, b),
    });
  }

  // Pad with potentially-duplicate problems if the unique space was tiny.
  while (problems.length < config.count) {
    const op = concreteOpFor(config.operation, rng),
      { a, b } = draw(rng, op, config.rangeMin, config.rangeMax);
    problems.push({
      question: renderQuestion(op, a, b),
      answer: computeAnswer(op, a, b),
    });
  }

  return problems;
};
