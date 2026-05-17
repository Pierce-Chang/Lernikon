import { describe, it, expect } from "vitest";
import { generateDivision } from "./generate";
import type { DivisionConfig } from "./config";

const BASE_3x1: DivisionConfig = {
  stellen: "3:1",
  count: 8,
  verfahren: "abzieh",
  mitRest: false,
  merkkasten: false,
  solutions: true,
  seed: 42,
};

const BASE_4x1: DivisionConfig = {
  stellen: "4:1",
  count: 8,
  verfahren: "abzieh",
  mitRest: false,
  merkkasten: false,
  solutions: true,
  seed: 42,
};

const BASE_4x2: DivisionConfig = {
  stellen: "4:2",
  count: 8,
  verfahren: "abzieh",
  mitRest: false,
  merkkasten: false,
  solutions: true,
  seed: 42,
};

describe("generateDivision", () => {
  it("rejects invalid stellen", () => {
    expect(() =>
      generateDivision({ ...BASE_3x1, stellen: "2:1" as "3:1" }),
    ).toThrow();
  });

  it("rejects invalid count", () => {
    expect(() =>
      generateDivision({ ...BASE_3x1, count: 5 as 4 }),
    ).toThrow();
  });

  it("rejects invalid verfahren", () => {
    expect(() =>
      generateDivision({ ...BASE_3x1, verfahren: "subtraction" as "abzieh" }),
    ).toThrow();
  });

  it("returns exactly 4 problems", () => {
    expect(generateDivision({ ...BASE_3x1, count: 4 })).toHaveLength(4);
  });

  it("returns exactly 8 problems", () => {
    expect(generateDivision(BASE_3x1)).toHaveLength(8);
  });

  it("returns exactly 12 problems", () => {
    expect(generateDivision({ ...BASE_3x1, count: 12 })).toHaveLength(12);
  });

  it("3:1: dividend in [100, 999], divisor in [2, 9]", () => {
    const problems = generateDivision({ ...BASE_3x1, seed: 77 });
    for (const p of problems) {
      expect(p.dividend).toBeGreaterThanOrEqual(100);
      expect(p.dividend).toBeLessThanOrEqual(999);
      expect(p.divisor).toBeGreaterThanOrEqual(2);
      expect(p.divisor).toBeLessThanOrEqual(9);
    }
  });

  it("4:1: dividend in [1000, 9999], divisor in [2, 9]", () => {
    const problems = generateDivision({ ...BASE_4x1, seed: 77 });
    for (const p of problems) {
      expect(p.dividend).toBeGreaterThanOrEqual(1000);
      expect(p.dividend).toBeLessThanOrEqual(9999);
      expect(p.divisor).toBeGreaterThanOrEqual(2);
      expect(p.divisor).toBeLessThanOrEqual(9);
    }
  });

  it("4:2: dividend in [1000, 9999], divisor in [11, 99]", () => {
    const problems = generateDivision({ ...BASE_4x2, seed: 77 });
    for (const p of problems) {
      expect(p.dividend).toBeGreaterThanOrEqual(1000);
      expect(p.dividend).toBeLessThanOrEqual(9999);
      expect(p.divisor).toBeGreaterThanOrEqual(11);
      expect(p.divisor).toBeLessThanOrEqual(99);
    }
  });

  it("mitRest=false: all problems have remainder 0", () => {
    const problems = generateDivision({ ...BASE_3x1, mitRest: false, count: 12, seed: 42 });
    for (const p of problems) {
      expect(p.remainder).toBe(0);
    }
  });

  it("mitRest=true: at least 1 problem has remainder > 0", () => {
    const problems = generateDivision({ ...BASE_3x1, mitRest: true, count: 12, seed: 42 });
    const hasRemainder = problems.some((p) => p.remainder > 0);
    expect(hasRemainder).toBe(true);
  });

  it("quotient * divisor + remainder === dividend for every problem", () => {
    const problems = generateDivision({ ...BASE_3x1, count: 12, seed: 55 });
    for (const p of problems) {
      expect(p.quotient * p.divisor + p.remainder).toBe(p.dividend);
    }
  });

  it("steps length equals quotient digit count", () => {
    const problems = generateDivision({ ...BASE_3x1, count: 12, seed: 99 });
    for (const p of problems) {
      expect(p.steps).toHaveLength(String(p.quotient).length);
    }
  });

  it("each step: partial - sub === remainder", () => {
    const problems = generateDivision({ ...BASE_3x1, count: 8, seed: 7 });
    for (const p of problems) {
      for (const step of p.steps) {
        expect(step.partial - step.sub).toBe(step.remainder);
      }
    }
  });

  it("no duplicate (dividend, divisor) pairs at count=12 seed=42", () => {
    const problems = generateDivision({ ...BASE_3x1, count: 12, seed: 42 });
    const keys = problems.map((p) => `${p.dividend}|${p.divisor}`);
    expect(new Set(keys).size).toBe(12);
  });

  it("is deterministic with the same seed", () => {
    const a = generateDivision(BASE_3x1),
      b = generateDivision(BASE_3x1);
    expect(a.map((p) => `${p.dividend}|${p.divisor}`)).toEqual(
      b.map((p) => `${p.dividend}|${p.divisor}`),
    );
  });

  it("produces different output for different seeds", () => {
    const a = generateDivision({ ...BASE_3x1, seed: 1 }),
      b = generateDivision({ ...BASE_3x1, seed: 2 });
    expect(a.map((p) => `${p.dividend}|${p.divisor}`)).not.toEqual(
      b.map((p) => `${p.dividend}|${p.divisor}`),
    );
  });

  it("verfahren does not affect the generated problems", () => {
    const abzieh = generateDivision({ ...BASE_3x1, verfahren: "abzieh", seed: 17 }),
      ergaenzung = generateDivision({ ...BASE_3x1, verfahren: "ergaenzung", seed: 17 });
    expect(abzieh.map((p) => `${p.dividend}|${p.divisor}`)).toEqual(
      ergaenzung.map((p) => `${p.dividend}|${p.divisor}`),
    );
  });
});
