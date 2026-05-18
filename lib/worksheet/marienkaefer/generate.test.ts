import { describe, it, expect } from "vitest";
import { generateMarienkaefer } from "./generate";
import { marienkaeferConfigSchema } from "./config";

const BASE = { topic: "mathe-marienkaefer" as const };

describe("marienkaeferConfigSchema", () => {
  it("rejects invalid count 8", () => {
    const result = marienkaeferConfigSchema.safeParse({ ...BASE, count: 8 });
    expect(result.success).toBe(false);
  });

  it("rejects invalid count 12", () => {
    const result = marienkaeferConfigSchema.safeParse({ ...BASE, count: 12 });
    expect(result.success).toBe(false);
  });

  it("accepts count 6", () => {
    const result = marienkaeferConfigSchema.safeParse({ ...BASE, count: 6 });
    expect(result.success).toBe(true);
  });

  it("accepts count 10", () => {
    const result = marienkaeferConfigSchema.safeParse({ ...BASE, count: 10 });
    expect(result.success).toBe(true);
  });

  it("defaults count to 10", () => {
    const result = marienkaeferConfigSchema.safeParse({ ...BASE });
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.count).toBe(10);
  });
});

describe("generateMarienkaefer", () => {
  it("returns exactly 6 numbers when count=6", () => {
    const sheet = generateMarienkaefer({ ...BASE, count: 6 }, 1);
    expect(sheet.numbers).toHaveLength(6);
  });

  it("returns exactly 10 numbers when count=10", () => {
    const sheet = generateMarienkaefer({ ...BASE, count: 10 }, 2);
    expect(sheet.numbers).toHaveLength(10);
  });

  it("all numbers are in [1..10] for count=6", () => {
    const sheet = generateMarienkaefer({ ...BASE, count: 6 }, 3);
    sheet.numbers.forEach((n) => {
      expect(n).toBeGreaterThanOrEqual(1);
      expect(n).toBeLessThanOrEqual(10);
    });
  });

  it("all numbers are in [1..10] for count=10", () => {
    const sheet = generateMarienkaefer({ ...BASE, count: 10 }, 4);
    sheet.numbers.forEach((n) => {
      expect(n).toBeGreaterThanOrEqual(1);
      expect(n).toBeLessThanOrEqual(10);
    });
  });

  it("no duplicates for count=6", () => {
    const sheet = generateMarienkaefer({ ...BASE, count: 6 }, 5);
    expect(new Set(sheet.numbers).size).toBe(6);
  });

  it("no duplicates for count=10", () => {
    const sheet = generateMarienkaefer({ ...BASE, count: 10 }, 6);
    expect(new Set(sheet.numbers).size).toBe(10);
  });

  it("count=10 contains all numbers 1 through 10 exactly once", () => {
    const sheet = generateMarienkaefer({ ...BASE, count: 10 }, 7);
    const sorted = [...sheet.numbers].sort((a, b) => a - b);
    expect(sorted).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  it("count=6 contains 6 different values from [1..10]", () => {
    const sheet = generateMarienkaefer({ ...BASE, count: 6 }, 8);
    expect(sheet.numbers).toHaveLength(6);
    expect(new Set(sheet.numbers).size).toBe(6);
    sheet.numbers.forEach((n) => {
      expect(n).toBeGreaterThanOrEqual(1);
      expect(n).toBeLessThanOrEqual(10);
    });
  });

  it("is deterministic: same seed produces identical output", () => {
    const cfg = { ...BASE, count: 10 as const };
    const a = generateMarienkaefer(cfg, 42);
    const b = generateMarienkaefer(cfg, 42);
    expect(a.numbers).toEqual(b.numbers);
    expect(a.seed).toBe(b.seed);
  });

  it("different seeds produce different output", () => {
    const cfg = { ...BASE, count: 10 as const };
    const a = generateMarienkaefer(cfg, 100);
    const b = generateMarienkaefer(cfg, 200);
    expect(a.numbers).not.toEqual(b.numbers);
  });

  it("seed is returned in the output", () => {
    const sheet = generateMarienkaefer({ ...BASE, count: 6 }, 99);
    expect(sheet.seed).toBe(99);
  });

  it("count field in output matches config", () => {
    const sheet = generateMarienkaefer({ ...BASE, count: 6 }, 10);
    expect(sheet.count).toBe(6);
  });
});
