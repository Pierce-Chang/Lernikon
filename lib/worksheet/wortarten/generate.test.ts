import { describe, expect, it } from "vitest";
import { generateWortarten } from "./generate";
import { NOMEN_COUNT, VERBEN_COUNT, ADJEKTIVE_COUNT } from "./corpus";
import type { WortartenConfig } from "./config";

const base: WortartenConfig = {
  klasse: 2,
  count: 15,
  solutions: false,
  seed: 42,
};

// ── Corpus size minimums ──────────────────────────────────────────────────────

describe("corpus sizes", () => {
  it("NOMEN has at least 35 entries", () => {
    expect(NOMEN_COUNT).toBeGreaterThanOrEqual(35);
  });

  it("VERBEN has at least 35 entries", () => {
    expect(VERBEN_COUNT).toBeGreaterThanOrEqual(35);
  });

  it("ADJEKTIVE has at least 35 entries", () => {
    expect(ADJEKTIVE_COUNT).toBeGreaterThanOrEqual(35);
  });
});

// ── Config validation ────────────────────────────────────────────────────────

describe("config validation", () => {
  it("rejects count 7 (not in union)", () => {
    expect(() =>
      generateWortarten({ ...base, count: 7 as unknown as 10 }),
    ).toThrow();
  });

  it("rejects count 25 (not in union)", () => {
    expect(() =>
      generateWortarten({ ...base, count: 25 as unknown as 20 }),
    ).toThrow();
  });

  it("accepts count 10", () => {
    expect(() => generateWortarten({ ...base, count: 10 })).not.toThrow();
  });

  it("accepts count 15", () => {
    expect(() => generateWortarten({ ...base, count: 15 })).not.toThrow();
  });

  it("accepts count 20", () => {
    expect(() => generateWortarten({ ...base, count: 20 })).not.toThrow();
  });
});

// ── Output shape ─────────────────────────────────────────────────────────────

describe("generateWortarten — output shape", () => {
  it("returns exactly count items for count=10", () => {
    const { items } = generateWortarten({ ...base, count: 10 });
    expect(items).toHaveLength(10);
  });

  it("returns exactly count items for count=15", () => {
    const { items } = generateWortarten({ ...base, count: 15 });
    expect(items).toHaveLength(15);
  });

  it("returns exactly count items for count=20", () => {
    const { items } = generateWortarten({ ...base, count: 20 });
    expect(items).toHaveLength(20);
  });

  it("items are numbered starting from 1", () => {
    const { items } = generateWortarten(base);
    items.forEach((item, i) => {
      expect(item.id).toBe(i + 1);
    });
  });

  it("words are rendered lowercase", () => {
    const { items } = generateWortarten(base);
    for (const item of items) {
      expect(item.word).toBe(item.word.toLowerCase());
    }
  });

  it("no duplicate words in one sheet", () => {
    const { items } = generateWortarten({ ...base, count: 20 });
    const words = items.map((i) => i.word);
    expect(new Set(words).size).toBe(words.length);
  });

  it("all wortart values are valid", () => {
    const valid = new Set(["nomen", "verb", "adjektiv"]);
    const { items } = generateWortarten(base);
    for (const item of items) {
      expect(valid.has(item.wortart)).toBe(true);
    }
  });
});

// ── Determinism ──────────────────────────────────────────────────────────────

describe("determinism", () => {
  it("same seed gives same output", () => {
    const a = generateWortarten({ ...base, seed: 1234 }),
      b = generateWortarten({ ...base, seed: 1234 });
    expect(a.items.map((i) => i.word)).toEqual(b.items.map((i) => i.word));
  });

  it("different seeds give different outputs", () => {
    const a = generateWortarten({ ...base, seed: 1 }),
      b = generateWortarten({ ...base, seed: 9999 });
    expect(a.items.map((i) => i.word)).not.toEqual(b.items.map((i) => i.word));
  });

  it("seed from config is used when present", () => {
    const a = generateWortarten({ ...base, seed: 77 }),
      b = generateWortarten({ ...base, seed: 77 });
    expect(a.items.map((i) => i.word)).toEqual(b.items.map((i) => i.word));
  });
});

// ── Balance guarantee ────────────────────────────────────────────────────────

describe("balance guarantee", () => {
  const seeds = [1, 2, 3, 42, 99, 500, 1337, 9999];

  it("count=10 has at least 2 Nomen, 2 Verben, 2 Adjektive across seeds", () => {
    for (const seed of seeds) {
      const { items } = generateWortarten({ ...base, count: 10, seed });
      const nomen = items.filter((i) => i.wortart === "nomen").length,
        verben = items.filter((i) => i.wortart === "verb").length,
        adjektive = items.filter((i) => i.wortart === "adjektiv").length;
      expect(nomen).toBeGreaterThanOrEqual(2);
      expect(verben).toBeGreaterThanOrEqual(2);
      expect(adjektive).toBeGreaterThanOrEqual(2);
    }
  });

  it("count=15 has at least 3 Nomen, 3 Verben, 3 Adjektive across seeds", () => {
    for (const seed of seeds) {
      const { items } = generateWortarten({ ...base, count: 15, seed });
      const nomen = items.filter((i) => i.wortart === "nomen").length,
        verben = items.filter((i) => i.wortart === "verb").length,
        adjektive = items.filter((i) => i.wortart === "adjektiv").length;
      expect(nomen).toBeGreaterThanOrEqual(3);
      expect(verben).toBeGreaterThanOrEqual(3);
      expect(adjektive).toBeGreaterThanOrEqual(3);
    }
  });

  it("count=20 has at least 3 Nomen, 3 Verben, 3 Adjektive across seeds", () => {
    for (const seed of seeds) {
      const { items } = generateWortarten({ ...base, count: 20, seed });
      const nomen = items.filter((i) => i.wortart === "nomen").length,
        verben = items.filter((i) => i.wortart === "verb").length,
        adjektive = items.filter((i) => i.wortart === "adjektiv").length;
      expect(nomen).toBeGreaterThanOrEqual(3);
      expect(verben).toBeGreaterThanOrEqual(3);
      expect(adjektive).toBeGreaterThanOrEqual(3);
    }
  });
});
