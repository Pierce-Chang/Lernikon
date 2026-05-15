import { describe, it, expect } from "vitest";
import { generateBrueche } from "./generate";
import type { BruecheConfig } from "./config";
import type { DarstellenProblem, VergleichenProblem, RechnenProblem } from "./generate";

const BASE: BruecheConfig = {
  modus: "darstellen",
  count: 6,
  solutions: false,
  seed: 42,
};

// ── Shared: count + seed reproducibility ──────────────────────────────────────

describe("generateBrueche — count", () => {
  it("darstellen: returns exactly 6 problems", () => {
    expect(generateBrueche({ ...BASE, modus: "darstellen", count: 6 }, 1).problems).toHaveLength(6);
  });
  it("darstellen: returns exactly 12 problems", () => {
    expect(generateBrueche({ ...BASE, modus: "darstellen", count: 12 }, 2).problems).toHaveLength(12);
  });
  it("darstellen: returns exactly 18 problems", () => {
    expect(generateBrueche({ ...BASE, modus: "darstellen", count: 18 }, 3).problems).toHaveLength(18);
  });
  it("vergleichen: returns exactly 6 problems", () => {
    expect(generateBrueche({ ...BASE, modus: "vergleichen", count: 6 }, 4).problems).toHaveLength(6);
  });
  it("vergleichen: returns exactly 12 problems", () => {
    expect(generateBrueche({ ...BASE, modus: "vergleichen", count: 12 }, 5).problems).toHaveLength(12);
  });
  it("vergleichen: returns exactly 18 problems", () => {
    expect(generateBrueche({ ...BASE, modus: "vergleichen", count: 18 }, 6).problems).toHaveLength(18);
  });
  it("rechnen: returns exactly 6 problems", () => {
    expect(generateBrueche({ ...BASE, modus: "rechnen", count: 6 }, 7).problems).toHaveLength(6);
  });
  it("rechnen: returns exactly 12 problems", () => {
    expect(generateBrueche({ ...BASE, modus: "rechnen", count: 12 }, 8).problems).toHaveLength(12);
  });
  it("rechnen: returns exactly 18 problems", () => {
    expect(generateBrueche({ ...BASE, modus: "rechnen", count: 18 }, 9).problems).toHaveLength(18);
  });
});

// ── Seed reproducibility ──────────────────────────────────────────────────────

describe("generateBrueche — seed reproducibility", () => {
  it("darstellen: same seed produces identical output", () => {
    const a = generateBrueche({ ...BASE, modus: "darstellen" }, 17).problems as DarstellenProblem[],
      b = generateBrueche({ ...BASE, modus: "darstellen" }, 17).problems as DarstellenProblem[];
    expect(a.map((p) => `${p.shape}|${p.numerator}/${p.denominator}`)).toEqual(
      b.map((p) => `${p.shape}|${p.numerator}/${p.denominator}`),
    );
  });
  it("vergleichen: same seed produces identical output", () => {
    const a = generateBrueche({ ...BASE, modus: "vergleichen" }, 17).problems as VergleichenProblem[],
      b = generateBrueche({ ...BASE, modus: "vergleichen" }, 17).problems as VergleichenProblem[];
    expect(a.map((p) => `${p.left.n}/${p.left.d}${p.answer}${p.right.n}/${p.right.d}`)).toEqual(
      b.map((p) => `${p.left.n}/${p.left.d}${p.answer}${p.right.n}/${p.right.d}`),
    );
  });
  it("rechnen: same seed produces identical output", () => {
    const a = generateBrueche({ ...BASE, modus: "rechnen" }, 17).problems as RechnenProblem[],
      b = generateBrueche({ ...BASE, modus: "rechnen" }, 17).problems as RechnenProblem[];
    expect(a.map((p) => `${p.left.n}/${p.left.d}${p.op}${p.right.n}`)).toEqual(
      b.map((p) => `${p.left.n}/${p.left.d}${p.op}${p.right.n}`),
    );
  });
});

// ── Darstellen constraints ────────────────────────────────────────────────────

describe("generateBrueche — darstellen constraints", () => {
  it("denominator in [2, 10]", () => {
    const problems = generateBrueche({ ...BASE, modus: "darstellen", count: 18 }, 99).problems as DarstellenProblem[];
    for (const p of problems) {
      expect(p.denominator).toBeGreaterThanOrEqual(2);
      expect(p.denominator).toBeLessThanOrEqual(10);
    }
  });

  it("1 <= numerator < denominator (no zero, no whole fraction)", () => {
    const problems = generateBrueche({ ...BASE, modus: "darstellen", count: 18 }, 99).problems as DarstellenProblem[];
    for (const p of problems) {
      expect(p.numerator).toBeGreaterThanOrEqual(1);
      expect(p.numerator).toBeLessThan(p.denominator);
    }
  });

  it("shape is kreis or rechteck", () => {
    const problems = generateBrueche({ ...BASE, modus: "darstellen", count: 18 }, 55).problems as DarstellenProblem[];
    for (const p of problems) {
      expect(["kreis", "rechteck"]).toContain(p.shape);
    }
  });

  it("no duplicate (shape, numerator, denominator) triples", () => {
    const problems = generateBrueche({ ...BASE, modus: "darstellen", count: 6 }, 42).problems as DarstellenProblem[];
    const keys = problems.map((p) => `${p.shape}|${p.numerator}/${p.denominator}`);
    expect(new Set(keys).size).toBe(6);
  });
});

// ── Vergleichen constraints ───────────────────────────────────────────────────

describe("generateBrueche — vergleichen constraints", () => {
  it("answer matches actual comparison (cross-multiply)", () => {
    const problems = generateBrueche({ ...BASE, modus: "vergleichen", count: 18 }, 77).problems as VergleichenProblem[];
    for (const p of problems) {
      const lhs = p.left.n * p.right.d,
        rhs = p.right.n * p.left.d;
      if (lhs < rhs) expect(p.answer).toBe("<");
      else if (lhs > rhs) expect(p.answer).toBe(">");
      else expect(p.answer).toBe("=");
    }
  });

  it("no coprime-denominator pairs (one must divide the other)", () => {
    const problems = generateBrueche({ ...BASE, modus: "vergleichen", count: 18 }, 88).problems as VergleichenProblem[];
    for (const p of problems) {
      const ok =
        p.left.d === p.right.d ||
        p.left.d % p.right.d === 0 ||
        p.right.d % p.left.d === 0;
      expect(ok).toBe(true);
    }
  });

  it("no duplicate fraction-pair tuples", () => {
    const problems = generateBrueche({ ...BASE, modus: "vergleichen", count: 6 }, 42).problems as VergleichenProblem[];
    const keys = problems.map((p) => `${p.left.n}/${p.left.d}|${p.right.n}/${p.right.d}`);
    expect(new Set(keys).size).toBe(6);
  });
});

// ── Rechnen constraints ───────────────────────────────────────────────────────

describe("generateBrueche — rechnen constraints", () => {
  it("same denominator on both sides and in result", () => {
    const problems = generateBrueche({ ...BASE, modus: "rechnen", count: 18 }, 33).problems as RechnenProblem[];
    for (const p of problems) {
      expect(p.left.d).toBe(p.right.d);
      expect(p.left.d).toBe(p.resultD);
    }
  });

  it("denominator in [2, 12]", () => {
    const problems = generateBrueche({ ...BASE, modus: "rechnen", count: 18 }, 33).problems as RechnenProblem[];
    for (const p of problems) {
      expect(p.left.d).toBeGreaterThanOrEqual(2);
      expect(p.left.d).toBeLessThanOrEqual(12);
    }
  });

  it("resultN === left.n + right.n for addition", () => {
    const problems = generateBrueche({ ...BASE, modus: "rechnen", count: 18 }, 20).problems as RechnenProblem[];
    for (const p of problems.filter((q) => (q as RechnenProblem).op === "+")) {
      expect(p.resultN).toBe(p.left.n + p.right.n);
    }
  });

  it("resultN === left.n - right.n for subtraction", () => {
    const problems = generateBrueche({ ...BASE, modus: "rechnen", count: 18 }, 20).problems as RechnenProblem[];
    for (const p of problems.filter((q) => (q as RechnenProblem).op === "-")) {
      expect(p.resultN).toBe(p.left.n - p.right.n);
    }
  });

  it("resultN >= 0 always (no negative results)", () => {
    const problems = generateBrueche({ ...BASE, modus: "rechnen", count: 18 }, 20).problems as RechnenProblem[];
    for (const p of problems) {
      expect(p.resultN).toBeGreaterThanOrEqual(0);
    }
  });

  it("no duplicate problems", () => {
    const problems = generateBrueche({ ...BASE, modus: "rechnen", count: 6 }, 42).problems as RechnenProblem[];
    const keys = problems.map((p) => `${p.left.n}/${p.left.d}${p.op}${p.right.n}/${p.right.d}`);
    expect(new Set(keys).size).toBe(6);
  });
});
