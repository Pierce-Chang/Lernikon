import { describe, it, expect } from "vitest";
import { generateEinmaleinsProblems } from "./generate";
import type { EinmaleinsConfig } from "./config";

const BASE: EinmaleinsConfig = {
  rows: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  count: 15,
  includeSolutions: true,
};

describe("generateEinmaleinsProblems", () => {
  it("produces exactly count problems", () => {
    const problems = generateEinmaleinsProblems(BASE, 42);
    expect(problems).toHaveLength(15);
  });

  it("produces exactly count problems for count 10", () => {
    const problems = generateEinmaleinsProblems({ ...BASE, count: 10 }, 1);
    expect(problems).toHaveLength(10);
  });

  it("produces exactly count problems for count 20", () => {
    const problems = generateEinmaleinsProblems({ ...BASE, count: 20 }, 7);
    expect(problems).toHaveLength(20);
  });

  it("all problems use rows from config.rows", () => {
    const config: EinmaleinsConfig = { ...BASE, rows: [2, 5, 10] };
    const problems = generateEinmaleinsProblems(config, 99);
    for (const p of problems) {
      expect([2, 5, 10]).toContain(p.row);
    }
  });

  it("multipliers are always in [1, 10]", () => {
    const problems = generateEinmaleinsProblems(BASE, 123);
    for (const p of problems) {
      expect(p.multiplier).toBeGreaterThanOrEqual(1);
      expect(p.multiplier).toBeLessThanOrEqual(10);
    }
  });

  it("answer equals row * multiplier", () => {
    const problems = generateEinmaleinsProblems(BASE, 55);
    for (const p of problems) {
      expect(p.answer).toBe(p.row * p.multiplier);
    }
  });

  it("is deterministic with the same seed", () => {
    const a = generateEinmaleinsProblems(BASE, 17),
      b = generateEinmaleinsProblems(BASE, 17);
    expect(a.map((p) => p.question)).toEqual(b.map((p) => p.question));
  });

  it("produces different output for different seeds", () => {
    const a = generateEinmaleinsProblems(BASE, 1),
      b = generateEinmaleinsProblems(BASE, 2);
    expect(a.map((p) => p.question)).not.toEqual(b.map((p) => p.question));
  });

  it("no duplicates when count <= total unique pairs", () => {
    // 10 rows * 10 multipliers = 100 unique pairs. count=20 should have no dupes.
    const problems = generateEinmaleinsProblems({ ...BASE, count: 20 }, 42);
    const keys = problems.map((p) => `${p.row}|${p.multiplier}`);
    expect(new Set(keys).size).toBe(20);
  });

  it("no duplicates with a single row, count <= 10", () => {
    const problems = generateEinmaleinsProblems({ ...BASE, rows: [3], count: 10 }, 9);
    const keys = problems.map((p) => `${p.row}|${p.multiplier}`);
    expect(new Set(keys).size).toBe(10);
  });

  it("question format uses the middle dot", () => {
    const problems = generateEinmaleinsProblems(BASE, 5);
    for (const p of problems) {
      expect(p.question).toMatch(/^\d+ · \d+ =$/);
    }
  });
});
