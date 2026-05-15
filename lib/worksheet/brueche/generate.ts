import { bruecheConfigSchema, type BruecheConfig } from "./config";

// ── Problem types ─────────────────────────────────────────────────────────────

export type DarstellenProblem = {
  kind: "darstellen";
  shape: "kreis" | "rechteck";
  numerator: number;
  denominator: number;
};

export type VergleichenProblem = {
  kind: "vergleichen";
  left: { n: number; d: number };
  right: { n: number; d: number };
  answer: "<" | ">" | "=";
};

export type RechnenProblem = {
  kind: "rechnen";
  left: { n: number; d: number };
  op: "+" | "-";
  right: { n: number; d: number };
  resultN: number;
  resultD: number;
};

export type BruecheProblem = DarstellenProblem | VergleichenProblem | RechnenProblem;

export interface BruecheSheet {
  problems: BruecheProblem[];
}

// ── PRNG ──────────────────────────────────────────────────────────────────────

/**
 * Mulberry32 seedable PRNG. Same algorithm used across other generators for
 * consistent deterministic behaviour.
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

/** Random integer in [min, max] inclusive. */
const randInt = (rng: () => number, min: number, max: number): number =>
  Math.floor(rng() * (max - min + 1)) + min;

// ── Darstellen generator ──────────────────────────────────────────────────────

const generateDarstellen = (
  rng: () => number,
  count: number,
): DarstellenProblem[] => {
  const seen = new Set<string>(),
    problems: DarstellenProblem[] = [];
  const maxAttempts = count * 50;
  let attempts = 0;

  while (problems.length < count && attempts < maxAttempts) {
    attempts += 1;
    const shape: "kreis" | "rechteck" = rng() < 0.5 ? "kreis" : "rechteck",
      denominator = randInt(rng, 2, 10),
      numerator = randInt(rng, 1, denominator - 1);

    const key = `${shape}|${numerator}|${denominator}`;
    if (seen.has(key)) continue;
    seen.add(key);
    problems.push({ kind: "darstellen", shape, numerator, denominator });
  }

  // Pad without dedup if pool is exhausted.
  while (problems.length < count) {
    const shape: "kreis" | "rechteck" = rng() < 0.5 ? "kreis" : "rechteck",
      denominator = randInt(rng, 2, 10),
      numerator = randInt(rng, 1, denominator - 1);
    problems.push({ kind: "darstellen", shape, numerator, denominator });
  }

  return problems;
};

// ── Vergleichen generator ─────────────────────────────────────────────────────

/**
 * Picks a fraction pair where the denominators are either equal or one is a
 * clean multiple of the other (no coprime LCD work needed). Mix is ~60% same
 * denominator, ~40% multiple-denominator.
 */
const pickVergleichenPair = (
  rng: () => number,
): { left: { n: number; d: number }; right: { n: number; d: number } } => {
  const useSameDenominator = rng() < 0.6;

  if (useSameDenominator) {
    const d = randInt(rng, 2, 10),
      n1 = randInt(rng, 1, d - 1),
      n2 = randInt(rng, 1, d - 1);
    return { left: { n: n1, d }, right: { n: n2, d } };
  }

  // Multiple-denominator: pick a base denominator and a multiplier (2 or 3).
  // Base must stay in [2, 5] so the larger denominator fits in [2, 10].
  const base = randInt(rng, 2, 5),
    multiplier = rng() < 0.5 ? 2 : 3,
    larger = base * multiplier;

  // Which side gets the larger denominator?
  const leftIsLarger = rng() < 0.5;
  const dLeft = leftIsLarger ? larger : base,
    dRight = leftIsLarger ? base : larger;

  const nLeft = randInt(rng, 1, dLeft - 1),
    nRight = randInt(rng, 1, dRight - 1);

  return { left: { n: nLeft, d: dLeft }, right: { n: nRight, d: dRight } };
};

/** Compute comparison answer without floating-point: cross-multiply. */
const compareAnswer = (
  left: { n: number; d: number },
  right: { n: number; d: number },
): "<" | ">" | "=" => {
  const lhs = left.n * right.d,
    rhs = right.n * left.d;
  if (lhs < rhs) return "<";
  if (lhs > rhs) return ">";
  return "=";
};

const generateVergleichen = (
  rng: () => number,
  count: number,
): VergleichenProblem[] => {
  const seen = new Set<string>(),
    problems: VergleichenProblem[] = [];
  const maxAttempts = count * 50;
  let attempts = 0;

  while (problems.length < count && attempts < maxAttempts) {
    attempts += 1;
    const { left, right } = pickVergleichenPair(rng),
      answer = compareAnswer(left, right),
      key = `${left.n}/${left.d}|${right.n}/${right.d}`;
    if (seen.has(key)) continue;
    seen.add(key);
    problems.push({ kind: "vergleichen", left, right, answer });
  }

  while (problems.length < count) {
    const { left, right } = pickVergleichenPair(rng),
      answer = compareAnswer(left, right);
    problems.push({ kind: "vergleichen", left, right, answer });
  }

  return problems;
};

// ── Rechnen generator ─────────────────────────────────────────────────────────

const generateRechnen = (
  rng: () => number,
  count: number,
): RechnenProblem[] => {
  const seen = new Set<string>(),
    problems: RechnenProblem[] = [];
  const maxAttempts = count * 50;
  let attempts = 0;

  while (problems.length < count && attempts < maxAttempts) {
    attempts += 1;
    const d = randInt(rng, 2, 12),
      op: "+" | "-" = rng() < 0.5 ? "+" : "-";

    let n1 = randInt(rng, 1, d - 1),
      n2 = randInt(rng, 1, d - 1);

    // Subtraction: ensure left >= right so result is non-negative.
    if (op === "-" && n1 < n2) {
      const tmp = n1;
      n1 = n2;
      n2 = tmp;
    }

    const resultN = op === "+" ? n1 + n2 : n1 - n2,
      key = `${n1}/${d}${op}${n2}/${d}`;
    if (seen.has(key)) continue;
    seen.add(key);
    problems.push({
      kind: "rechnen",
      left: { n: n1, d },
      op,
      right: { n: n2, d },
      resultN,
      resultD: d,
    });
  }

  while (problems.length < count) {
    const d = randInt(rng, 2, 12),
      op: "+" | "-" = rng() < 0.5 ? "+" : "-";
    let n1 = randInt(rng, 1, d - 1),
      n2 = randInt(rng, 1, d - 1);
    if (op === "-" && n1 < n2) {
      const tmp = n1;
      n1 = n2;
      n2 = tmp;
    }
    const resultN = op === "+" ? n1 + n2 : n1 - n2;
    problems.push({
      kind: "rechnen",
      left: { n: n1, d },
      op,
      right: { n: n2, d },
      resultN,
      resultD: d,
    });
  }

  return problems;
};

// ── Public entry point ────────────────────────────────────────────────────────

/**
 * Generates a Brueche worksheet from the given config.
 * Returns exactly `config.count` problems of the selected modus.
 */
export const generateBrueche = (
  rawConfig: BruecheConfig,
  seed?: number,
): BruecheSheet => {
  const config = bruecheConfigSchema.parse(rawConfig),
    rng = mulberry32(seed ?? config.seed ?? Math.floor(Math.random() * 2 ** 31));

  let problems: BruecheProblem[];

  switch (config.modus) {
    case "darstellen":
      problems = generateDarstellen(rng, config.count);
      break;
    case "vergleichen":
      problems = generateVergleichen(rng, config.count);
      break;
    case "rechnen":
      problems = generateRechnen(rng, config.count);
      break;
  }

  return { problems };
};
