import { describe, it, expect } from "vitest";
import { generateMengen } from "./generate";
import { mengenConfigSchema } from "./config";

const BASE = { topic: "mathe-mengen" as const };

describe("mengenConfigSchema", () => {
  it("rejects an invalid range", () => {
    const result = mengenConfigSchema.safeParse({ ...BASE, range: "1-20" });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid count", () => {
    const result = mengenConfigSchema.safeParse({ ...BASE, count: 7 });
    expect(result.success).toBe(false);
  });

  it("accepts valid config with defaults", () => {
    const result = mengenConfigSchema.safeParse({ topic: "mathe-mengen" });
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.range).toBe("1-10");
    expect(result.data.count).toBe(12);
  });
});

describe("generateMengen", () => {
  it("returns exactly count tasks for range 1-5", () => {
    const sheet = generateMengen({ ...BASE, range: "1-5", count: 6 }, 1);
    expect(sheet.tasks).toHaveLength(6);
  });

  it("returns exactly count tasks for range 1-10", () => {
    const sheet = generateMengen({ ...BASE, range: "1-10", count: 18 }, 2);
    expect(sheet.tasks).toHaveLength(18);
  });

  it("all quantities are in [1..5] for range 1-5", () => {
    const sheet = generateMengen({ ...BASE, range: "1-5", count: 6 }, 3);
    sheet.tasks.forEach((t) => {
      expect(t.quantity).toBeGreaterThanOrEqual(1);
      expect(t.quantity).toBeLessThanOrEqual(5);
    });
  });

  it("all quantities are in [1..10] for range 1-10", () => {
    const sheet = generateMengen({ ...BASE, range: "1-10", count: 18 }, 4);
    sheet.tasks.forEach((t) => {
      expect(t.quantity).toBeGreaterThanOrEqual(1);
      expect(t.quantity).toBeLessThanOrEqual(10);
    });
  });

  it("has no duplicate (shape, quantity) pairs", () => {
    const sheet = generateMengen({ ...BASE, range: "1-10", count: 18 }, 5);
    const keys = sheet.tasks.map((t) => `${t.shape}|${t.quantity}`);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("is deterministic: same seed produces identical output", () => {
    const cfg = { ...BASE, range: "1-10" as const, count: 12 as const };
    const a = generateMengen(cfg, 42);
    const b = generateMengen(cfg, 42);
    expect(a.tasks).toEqual(b.tasks);
    expect(a.seed).toBe(b.seed);
  });

  it("different seeds produce different output", () => {
    const cfg = { ...BASE, range: "1-10" as const, count: 12 as const };
    const a = generateMengen(cfg, 100);
    const b = generateMengen(cfg, 200);
    const same = a.tasks.every((t, i) => t.shape === b.tasks[i].shape && t.quantity === b.tasks[i].quantity);
    expect(same).toBe(false);
  });

  it("uses more than 1 shape for count >= 8", () => {
    const sheet = generateMengen({ ...BASE, range: "1-10", count: 12 }, 7);
    const shapes = new Set(sheet.tasks.map((t) => t.shape));
    expect(shapes.size).toBeGreaterThan(1);
  });

  it("seed is returned in the output", () => {
    const sheet = generateMengen({ ...BASE, range: "1-10", count: 6 }, 99);
    expect(sheet.seed).toBe(99);
  });
});
