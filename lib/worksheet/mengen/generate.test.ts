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
    const sheet = generateMengen({ ...BASE, range: "1-10", count: 12 }, 2);
    expect(sheet.tasks).toHaveLength(12);
  });

  it("all quantities are in [1..5] for range 1-5", () => {
    const sheet = generateMengen({ ...BASE, range: "1-5", count: 6 }, 3);
    sheet.tasks.forEach((t) => {
      expect(t.quantity).toBeGreaterThanOrEqual(1);
      expect(t.quantity).toBeLessThanOrEqual(5);
    });
  });

  it("all quantities are in [1..10] for range 1-10", () => {
    const sheet = generateMengen({ ...BASE, range: "1-10", count: 12 }, 4);
    sheet.tasks.forEach((t) => {
      expect(t.quantity).toBeGreaterThanOrEqual(1);
      expect(t.quantity).toBeLessThanOrEqual(10);
    });
  });

  // New: round-robin guarantees all-distinct quantities when count <= rangeMax.
  it("yields all-distinct quantities when count <= rangeMax (range 1-10, count 6)", () => {
    const sheet = generateMengen({ ...BASE, range: "1-10", count: 6 }, 5);
    const quantities = sheet.tasks.map((t) => t.quantity);
    expect(new Set(quantities).size).toBe(quantities.length);
  });

  // New: when count > rangeMax, repetitions occur but only after a full round.
  it("repeats quantities only after a full round (range 1-5, count 6)", () => {
    // rangeMax=5, count=6 → exactly one quantity repeats once (6 tasks from pool of 5).
    const sheet = generateMengen({ ...BASE, range: "1-5", count: 6 }, 6);
    const quantities = sheet.tasks.map((t) => t.quantity);
    const freq = new Map<number, number>();
    quantities.forEach((q) => freq.set(q, (freq.get(q) ?? 0) + 1));
    const repeatedCount = [...freq.values()].filter((v) => v > 1).length;
    expect(repeatedCount).toBe(1);
  });

  it("repeats quantities only after a full round (range 1-10, count 12)", () => {
    // rangeMax=10, count=12 → exactly 2 quantities repeat once each.
    const sheet = generateMengen({ ...BASE, range: "1-10", count: 12 }, 7);
    const quantities = sheet.tasks.map((t) => t.quantity);
    const freq = new Map<number, number>();
    quantities.forEach((q) => freq.set(q, (freq.get(q) ?? 0) + 1));
    const repeatedCount = [...freq.values()].filter((v) => v > 1).length;
    expect(repeatedCount).toBe(2);
  });

  // New: adjacency pass must eliminate back-to-back identical quantities.
  it("never places identical quantities back-to-back across all common configs", () => {
    const configs = [
      { range: "1-5" as const, count: 6 as const },
      { range: "1-5" as const, count: 12 as const },
      { range: "1-10" as const, count: 6 as const },
      { range: "1-10" as const, count: 12 as const },
    ];
    const seeds = [1, 2, 3, 42, 100, 999, 12345];
    configs.forEach((cfg) => {
      seeds.forEach((seed) => {
        const sheet = generateMengen({ ...BASE, ...cfg }, seed);
        for (let i = 1; i < sheet.tasks.length; i++) {
          expect(sheet.tasks[i]!.quantity).not.toBe(sheet.tasks[i - 1]!.quantity);
        }
      });
    });
  });

  // Kept but scoped to count=10 where distinct (shape,quantity) pairs are guaranteed
  // by round-robin: 10 distinct quantities × rotating shape pointer = no pair repeats
  // within the single round that covers all 10 tasks.
  it("has no duplicate (shape, quantity) pairs when count equals rangeMax", () => {
    const sheet = generateMengen({ ...BASE, range: "1-10", count: 6 }, 5);
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
    const same = a.tasks.every((t, i) => t.shape === b.tasks[i]!.shape && t.quantity === b.tasks[i]!.quantity);
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
