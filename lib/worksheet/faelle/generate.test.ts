import { describe, expect, it } from "vitest";
import { generateFaelle, validateCorpusInvariants } from "./generate";
import {
  NOMINATIV_COUNT,
  GENITIV_COUNT,
  DATIV_COUNT,
  AKKUSATIV_COUNT,
  corpusForFall,
} from "./corpus";
import type { FaelleConfig } from "./config";

const base: FaelleConfig = {
  topic: "deutsch-faelle",
  mode: "gemischt",
  count: 15,
  showSolutions: true,
  seed: 42,
};

// ── Corpus size minimums ──────────────────────────────────────────────────────

describe("corpus sizes", () => {
  it("nominativ has at least 20 entries", () => {
    expect(NOMINATIV_COUNT).toBeGreaterThanOrEqual(20);
  });

  it("genitiv has at least 20 entries", () => {
    expect(GENITIV_COUNT).toBeGreaterThanOrEqual(20);
  });

  it("dativ has at least 20 entries", () => {
    expect(DATIV_COUNT).toBeGreaterThanOrEqual(20);
  });

  it("akkusativ has at least 20 entries", () => {
    expect(AKKUSATIV_COUNT).toBeGreaterThanOrEqual(20);
  });
});

// ── Corpus invariants ────────────────────────────────────────────────────────

describe("corpus invariants", () => {
  it("every template has exactly one underscore run", () => {
    const { violations } = validateCorpusInvariants();
    expect(violations).toEqual([]);
  });

  it("all entries have a non-empty loesung", () => {
    const falls = ["nominativ", "genitiv", "dativ", "akkusativ"] as const;
    for (const fall of falls) {
      for (const entry of corpusForFall(fall)) {
        expect(entry.loesung.length).toBeGreaterThan(0);
      }
    }
  });

  it("all entries have a non-empty frage", () => {
    const falls = ["nominativ", "genitiv", "dativ", "akkusativ"] as const;
    for (const fall of falls) {
      for (const entry of corpusForFall(fall)) {
        expect(entry.frage.length).toBeGreaterThan(0);
      }
    }
  });
});

// ── Zod rejection ────────────────────────────────────────────────────────────

describe("Zod rejection", () => {
  it("rejects an invalid mode", () => {
    expect(() =>
      generateFaelle({ ...base, mode: "plural" as FaelleConfig["mode"] }, 1),
    ).toThrow();
  });

  it("rejects an invalid count", () => {
    expect(() =>
      generateFaelle({ ...base, count: 7 as FaelleConfig["count"] }, 1),
    ).toThrow();
  });

  it("rejects non-boolean showSolutions", () => {
    expect(() =>
      generateFaelle(
        { ...base, showSolutions: "yes" as unknown as boolean },
        1,
      ),
    ).toThrow();
  });
});

// ── Single-fall mode ──────────────────────────────────────────────────────────

describe("generateFaelle — single fall", () => {
  const falls = ["nominativ", "genitiv", "dativ", "akkusativ"] as const;

  it.each(falls)('fall "%s": all tasks have that fall', (fall) => {
    const sheet = generateFaelle({ ...base, mode: fall, count: 10 }, 42);
    for (const task of sheet.tasks) {
      expect(task.fall).toBe(fall);
    }
  });

  it("returns exactly 10 tasks", () => {
    const sheet = generateFaelle({ ...base, mode: "nominativ", count: 10 }, 42);
    expect(sheet.tasks).toHaveLength(10);
  });

  it("returns exactly 15 tasks", () => {
    const sheet = generateFaelle({ ...base, mode: "dativ", count: 15 }, 42);
    expect(sheet.tasks).toHaveLength(15);
  });

  it("returns exactly 20 tasks", () => {
    const sheet = generateFaelle({ ...base, mode: "akkusativ", count: 20 }, 42);
    expect(sheet.tasks).toHaveLength(20);
  });

  it("tasks are numbered from 1", () => {
    const sheet = generateFaelle({ ...base, mode: "nominativ", count: 10 }, 42);
    sheet.tasks.forEach((t, i) => {
      expect(t.id).toBe(i + 1);
    });
  });

  it("no duplicate templates in one sheet", () => {
    const sheet = generateFaelle({ ...base, mode: "akkusativ", count: 10 }, 7);
    const templates = sheet.tasks.map((t) => t.template);
    expect(new Set(templates).size).toBe(templates.length);
  });
});

// ── Gemischt mode ─────────────────────────────────────────────────────────────

describe("generateFaelle — gemischt", () => {
  it("returns exactly count tasks for count: 15", () => {
    const sheet = generateFaelle(base, 42);
    expect(sheet.tasks).toHaveLength(15);
  });

  it("returns exactly count tasks for count: 10", () => {
    const sheet = generateFaelle({ ...base, count: 10 }, 99);
    expect(sheet.tasks).toHaveLength(10);
  });

  it("returns exactly count tasks for count: 20", () => {
    const sheet = generateFaelle({ ...base, count: 20 }, 5);
    expect(sheet.tasks).toHaveLength(20);
  });

  it("count: 20 produces tasks from all four falls", () => {
    const sheet = generateFaelle({ ...base, count: 20 }, 42);
    const fallsPresent = new Set(sheet.tasks.map((t) => t.fall));
    expect(fallsPresent.size).toBe(4);
  });

  it("count: 20 distributes 5 tasks per fall", () => {
    // 20 / 4 = 5 exact, no remainder
    const sheet = generateFaelle({ ...base, count: 20 }, 42);
    const counts: Record<string, number> = { nominativ: 0, genitiv: 0, dativ: 0, akkusativ: 0 };
    for (const task of sheet.tasks) counts[task.fall]++;
    expect(counts.nominativ).toBe(5);
    expect(counts.genitiv).toBe(5);
    expect(counts.dativ).toBe(5);
    expect(counts.akkusativ).toBe(5);
  });

  it("tasks.length === count for all valid counts", () => {
    for (const count of [10, 15, 20] as const) {
      const sheet = generateFaelle({ ...base, count }, 1);
      expect(sheet.tasks).toHaveLength(count);
    }
  });
});

// ── Determinism ───────────────────────────────────────────────────────────────

describe("determinism", () => {
  it("same seed gives same output", () => {
    const a = generateFaelle(base, 1234),
      b = generateFaelle(base, 1234);
    expect(a.tasks.map((t) => t.template)).toEqual(b.tasks.map((t) => t.template));
  });

  it("different seeds give different outputs", () => {
    const a = generateFaelle(base, 1),
      b = generateFaelle(base, 9999);
    expect(a.tasks.map((t) => t.template)).not.toEqual(b.tasks.map((t) => t.template));
  });

  it("seed from config is used when no explicit seed given", () => {
    const a = generateFaelle({ ...base, seed: 77 }),
      b = generateFaelle({ ...base, seed: 77 });
    expect(a.tasks.map((t) => t.template)).toEqual(b.tasks.map((t) => t.template));
  });
});
