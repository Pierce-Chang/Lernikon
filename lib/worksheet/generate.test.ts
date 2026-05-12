import { describe, expect, it } from "vitest";
import { generateProblems } from "./generate";
import type { MathRechnenConfig } from "./config";

const baseConfig: MathRechnenConfig = {
  operation: "addition",
  rangeMin: 1,
  rangeMax: 20,
  count: 12,
  includeSolutions: true,
  seed: 42,
};

describe("generateProblems", () => {
  it("returns the requested number of problems", () => {
    for (const count of [8, 12, 16, 20, 24] as const) {
      const result = generateProblems({ ...baseConfig, count });
      expect(result).toHaveLength(count);
    }
  });

  it("addition result stays within rangeMax (Zahlenraum bis N semantics)", () => {
    for (const rangeMax of [10, 20, 50, 100]) {
      const result = generateProblems({
        ...baseConfig,
        operation: "addition",
        rangeMin: 1,
        rangeMax,
        count: 20,
      });
      for (const problem of result) {
        expect(problem.answer).toBeLessThanOrEqual(rangeMax);
        expect(problem.answer).toBeGreaterThanOrEqual(2);
      }
    }
  });

  it("gemischt mode never exceeds rangeMax on additions", () => {
    const result = generateProblems({
      ...baseConfig,
      operation: "gemischt",
      rangeMin: 1,
      rangeMax: 10,
      count: 20,
    });
    for (const problem of result) {
      expect(problem.answer).toBeLessThanOrEqual(10);
      expect(problem.answer).toBeGreaterThanOrEqual(0);
    }
  });

  it("never produces a negative result for subtraction", () => {
    const result = generateProblems({
      ...baseConfig,
      operation: "subtraktion",
      rangeMin: 1,
      rangeMax: 100,
      count: 20,
    });
    for (const problem of result) {
      expect(problem.answer).toBeGreaterThanOrEqual(0);
    }
  });

  it("addition results match the rendered question", () => {
    const result = generateProblems({ ...baseConfig, operation: "addition", count: 20 });
    for (const problem of result) {
      const [a, b] = problem.question.replace("=", "").split("+").map((s) => Number(s.trim()));
      expect(a + b).toBe(problem.answer);
    }
  });

  it("avoids duplicates when the unique space is large enough", () => {
    const result = generateProblems({ ...baseConfig, rangeMin: 1, rangeMax: 100, count: 20 });
    const keys = result.map((problem) => problem.question);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("operands stay within the requested range", () => {
    const result = generateProblems({ ...baseConfig, rangeMin: 1, rangeMax: 10, count: 20 });
    for (const problem of result) {
      const numbers = problem.question.match(/\d+/g)?.map(Number) ?? [];
      for (const n of numbers) {
        expect(n).toBeGreaterThanOrEqual(1);
        expect(n).toBeLessThanOrEqual(10);
      }
    }
  });

  it("is deterministic given the same seed", () => {
    const a = generateProblems({ ...baseConfig, seed: 12345 }),
      b = generateProblems({ ...baseConfig, seed: 12345 });
    expect(a).toEqual(b);
  });

  it("rejects invalid configs", () => {
    expect(() =>
      generateProblems({
        operation: "addition",
        rangeMin: 50,
        rangeMax: 10,
        count: 12,
      } as MathRechnenConfig),
    ).toThrow();
  });

  it("gemischt mode mixes both operators and stays correct", () => {
    const result = generateProblems({
      ...baseConfig,
      operation: "gemischt",
      count: 20,
      rangeMin: 1,
      rangeMax: 50,
    });
    let plus = 0,
      minus = 0;
    for (const problem of result) {
      if (problem.question.includes("+")) {
        plus += 1;
        const [a, b] = problem.question.replace("=", "").split("+").map((s) => Number(s.trim()));
        expect(a + b).toBe(problem.answer);
      } else {
        minus += 1;
        const [a, b] = problem.question.replace("=", "").split("-").map((s) => Number(s.trim()));
        expect(a - b).toBe(problem.answer);
        expect(problem.answer).toBeGreaterThanOrEqual(0);
      }
    }
    // With 20 draws on a 50/50 RNG split, both should appear at least once.
    expect(plus).toBeGreaterThan(0);
    expect(minus).toBeGreaterThan(0);
  });
});
