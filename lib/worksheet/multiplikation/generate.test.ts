import { describe, it, expect } from "vitest";
import { generateMultiplikation } from "./generate";
import type { MultiplikationConfig } from "./config";

const BASE_3x2: MultiplikationConfig = {
  stellen: "3x2",
  count: 8,
  solutions: false,
  seed: 42,
};

const BASE_3x1: MultiplikationConfig = {
  stellen: "3x1",
  count: 4,
  solutions: false,
  seed: 42,
};

describe("generateMultiplikation", () => {
  it("rejects invalid stellen", () => {
    expect(() =>
      generateMultiplikation({ stellen: "2x1" as "3x1", count: 4, solutions: false }),
    ).toThrow();
  });

  it("rejects invalid count", () => {
    expect(() =>
      generateMultiplikation({ stellen: "3x2", count: 5 as 4, solutions: false }),
    ).toThrow();
  });

  it("returns exactly 4 problems", () => {
    expect(generateMultiplikation(BASE_3x1, 1)).toHaveLength(4);
  });

  it("returns exactly 8 problems", () => {
    expect(generateMultiplikation(BASE_3x2, 1)).toHaveLength(8);
  });

  it("returns exactly 12 problems", () => {
    expect(generateMultiplikation({ ...BASE_3x2, count: 12 }, 1)).toHaveLength(12);
  });

  it("3x1: multiplicand in [100, 999], multiplier in [2, 9]", () => {
    const problems = generateMultiplikation({ ...BASE_3x1, count: 4 }, 77);
    for (const p of problems) {
      expect(p.multiplicand).toBeGreaterThanOrEqual(100);
      expect(p.multiplicand).toBeLessThanOrEqual(999);
      expect(p.multiplier).toBeGreaterThanOrEqual(2);
      expect(p.multiplier).toBeLessThanOrEqual(9);
    }
  });

  it("3x2: multiplicand in [100, 999], multiplier in [10, 99]", () => {
    const problems = generateMultiplikation({ ...BASE_3x2, count: 8 }, 77);
    for (const p of problems) {
      expect(p.multiplicand).toBeGreaterThanOrEqual(100);
      expect(p.multiplicand).toBeLessThanOrEqual(999);
      expect(p.multiplier).toBeGreaterThanOrEqual(10);
      expect(p.multiplier).toBeLessThanOrEqual(99);
    }
  });

  it("3x1: multiplier is never 0 or 1", () => {
    const problems = generateMultiplikation({ ...BASE_3x1, count: 4 }, 5);
    for (const p of problems) {
      expect(p.multiplier).toBeGreaterThanOrEqual(2);
    }
  });

  it("3x2: multiplier is never below 10", () => {
    const problems = generateMultiplikation({ ...BASE_3x2, count: 8 }, 5);
    for (const p of problems) {
      expect(p.multiplier).toBeGreaterThanOrEqual(10);
    }
  });

  it("result equals multiplicand × multiplier", () => {
    const problems = generateMultiplikation(BASE_3x2, 55);
    for (const p of problems) {
      expect(p.result).toBe(p.multiplicand * p.multiplier);
    }
  });

  it("partialProducts are correct per multiplier digit (least-significant first)", () => {
    const problems = generateMultiplikation(BASE_3x2, 99);
    for (const p of problems) {
      const digits: number[] = [];
      let rem = p.multiplier;
      while (rem > 0) {
        digits.push(rem % 10);
        rem = Math.floor(rem / 10);
      }
      const expected = digits.map((d) => p.multiplicand * d);
      expect(p.partialProducts).toEqual(expected);
    }
  });

  it("sum of partial products × place values equals result", () => {
    const problems = generateMultiplikation(BASE_3x2, 11);
    for (const p of problems) {
      const sumFromPartials = p.partialProducts.reduce(
        (acc, pp, i) => acc + pp * Math.pow(10, i),
        0,
      );
      expect(sumFromPartials).toBe(p.result);
    }
  });

  it("no duplicate (multiplicand, multiplier) pairs", () => {
    const problems = generateMultiplikation({ ...BASE_3x2, count: 12 }, 42);
    const keys = problems.map((p) => `${p.multiplicand}|${p.multiplier}`);
    expect(new Set(keys).size).toBe(12);
  });

  it("is deterministic with the same seed", () => {
    const a = generateMultiplikation(BASE_3x2, 17),
      b = generateMultiplikation(BASE_3x2, 17);
    expect(a.map((p) => `${p.multiplicand}|${p.multiplier}`)).toEqual(
      b.map((p) => `${p.multiplicand}|${p.multiplier}`),
    );
  });

  it("produces different output for different seeds", () => {
    const a = generateMultiplikation(BASE_3x2, 1),
      b = generateMultiplikation(BASE_3x2, 2);
    expect(a.map((p) => `${p.multiplicand}|${p.multiplier}`)).not.toEqual(
      b.map((p) => `${p.multiplicand}|${p.multiplier}`),
    );
  });

  it("id field matches 1-based index", () => {
    const problems = generateMultiplikation(BASE_3x2, 42);
    problems.forEach((p, i) => {
      expect(p.id).toBe(i + 1);
    });
  });
});
