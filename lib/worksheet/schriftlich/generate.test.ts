import { describe, it, expect } from "vitest";
import { generateSchriftlich } from "./generate";
import type { SchriftlichConfig } from "./config";

const BASE: SchriftlichConfig = {
  operation: "addition",
  stellen: 3,
  count: 6,
  solutions: false,
  seed: 42,
};

describe("generateSchriftlich", () => {
  it("returns exactly count problems (addition, 3-stellig, 6)", () => {
    const problems = generateSchriftlich(BASE, 42);
    expect(problems).toHaveLength(6);
  });

  it("returns exactly 12 problems", () => {
    const problems = generateSchriftlich({ ...BASE, count: 12 }, 1);
    expect(problems).toHaveLength(12);
  });

  it("returns exactly 18 problems", () => {
    const problems = generateSchriftlich({ ...BASE, count: 18 }, 7);
    expect(problems).toHaveLength(18);
  });

  it("all problems are addition when operation is addition", () => {
    const problems = generateSchriftlich(BASE, 42);
    for (const p of problems) {
      expect(p.operation).toBe("addition");
    }
  });

  it("all problems are subtraktion when operation is subtraktion", () => {
    const problems = generateSchriftlich({ ...BASE, operation: "subtraktion" }, 10);
    for (const p of problems) {
      expect(p.operation).toBe("subtraktion");
    }
  });

  it("subtraktion problems have a >= b (no negative results)", () => {
    const problems = generateSchriftlich(
      { ...BASE, operation: "subtraktion", count: 18 },
      99,
    );
    for (const p of problems) {
      expect(p.a).toBeGreaterThanOrEqual(p.b);
    }
  });

  it("result equals a + b for addition", () => {
    const problems = generateSchriftlich(BASE, 55);
    for (const p of problems) {
      expect(p.result).toBe(p.a + p.b);
    }
  });

  it("result equals a - b for subtraktion", () => {
    const problems = generateSchriftlich({ ...BASE, operation: "subtraktion" }, 55);
    for (const p of problems) {
      expect(p.result).toBe(p.a - p.b);
    }
  });

  it("3-stellig operands are in [100, 999]", () => {
    const problems = generateSchriftlich({ ...BASE, stellen: 3, count: 18 }, 77);
    for (const p of problems) {
      expect(p.a).toBeGreaterThanOrEqual(100);
      expect(p.a).toBeLessThanOrEqual(999);
      expect(p.b).toBeGreaterThanOrEqual(100);
      expect(p.b).toBeLessThanOrEqual(999);
    }
  });

  it("4-stellig operands are in [1000, 9999]", () => {
    const problems = generateSchriftlich({ ...BASE, stellen: 4, count: 18 }, 77);
    for (const p of problems) {
      expect(p.a).toBeGreaterThanOrEqual(1000);
      expect(p.a).toBeLessThanOrEqual(9999);
      expect(p.b).toBeGreaterThanOrEqual(1000);
      expect(p.b).toBeLessThanOrEqual(9999);
    }
  });

  it("is deterministic with the same seed", () => {
    const a = generateSchriftlich(BASE, 17),
      b = generateSchriftlich(BASE, 17);
    expect(a.map((p) => `${p.operation}|${p.a}|${p.b}`)).toEqual(
      b.map((p) => `${p.operation}|${p.a}|${p.b}`),
    );
  });

  it("produces different output for different seeds", () => {
    const a = generateSchriftlich(BASE, 1),
      b = generateSchriftlich(BASE, 2);
    expect(a.map((p) => `${p.a}|${p.b}`)).not.toEqual(b.map((p) => `${p.a}|${p.b}`));
  });

  it("no duplicate operand pairs in a normal run", () => {
    const problems = generateSchriftlich({ ...BASE, count: 6 }, 42);
    const keys = problems.map((p) => `${p.operation}|${p.a}|${p.b}`);
    expect(new Set(keys).size).toBe(6);
  });

  it("gemischt produces both operations across a large count", () => {
    const problems = generateSchriftlich(
      { ...BASE, operation: "gemischt", count: 18 },
      123,
    );
    const ops = problems.map((p) => p.operation);
    expect(ops).toContain("addition");
    expect(ops).toContain("subtraktion");
  });
});
