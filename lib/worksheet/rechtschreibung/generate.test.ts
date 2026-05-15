import { describe, expect, it } from "vitest";
import {
  generateRechtschreibung,
  validateCorpusInvariants,
} from "./generate";
import {
  IE_I_COUNT,
  SS_SZ_COUNT,
  DOPPELKONS_COUNT,
  ENDUNG_COUNT,
  corpusForRule,
} from "./corpus";
import { BLANK_PLACEHOLDER } from "./config";
import type { RechtschreibungConfig } from "./config";

const base: RechtschreibungConfig = {
  klasse: 3,
  rule: "ie-i",
  count: 10,
  solutions: false,
  seed: 42,
};

// ── Corpus size minimums ──────────────────────────────────────────────────────

describe("corpus sizes", () => {
  it("ie-i has at least 25 entries", () => {
    expect(IE_I_COUNT).toBeGreaterThanOrEqual(25);
  });

  it("ss-sz has at least 20 entries", () => {
    expect(SS_SZ_COUNT).toBeGreaterThanOrEqual(20);
  });

  it("doppelkons has at least 25 entries", () => {
    expect(DOPPELKONS_COUNT).toBeGreaterThanOrEqual(25);
  });

  it("endung has at least 20 entries", () => {
    expect(ENDUNG_COUNT).toBeGreaterThanOrEqual(20);
  });
});

// ── Corpus invariants ────────────────────────────────────────────────────────

describe("corpus invariants", () => {
  it("blank appears exactly once in every word", () => {
    const { violations } = validateCorpusInvariants();
    expect(violations).toEqual([]);
  });

  it("all entries have a non-empty blank", () => {
    for (const entry of corpusForRule("ie-i")) {
      expect(entry.blank.length).toBeGreaterThan(0);
    }
  });
});

// ── Single-rule generation ────────────────────────────────────────────────────

describe("generateRechtschreibung — single rule", () => {
  it("returns exactly 10 entries for ie-i", () => {
    const sheet = generateRechtschreibung(base, 42);
    expect(sheet.entries).toHaveLength(10);
  });

  it("returns exactly 15 entries", () => {
    const sheet = generateRechtschreibung({ ...base, count: 15 }, 42);
    expect(sheet.entries).toHaveLength(15);
  });

  it("returns exactly 20 entries", () => {
    const sheet = generateRechtschreibung({ ...base, count: 20 }, 42);
    expect(sheet.entries).toHaveLength(20);
  });

  it("entries are numbered starting from 1", () => {
    const sheet = generateRechtschreibung(base, 42);
    sheet.entries.forEach((e, i) => {
      expect(e.id).toBe(i + 1);
    });
  });

  it("no duplicate words in one sheet", () => {
    const sheet = generateRechtschreibung(base, 7);
    const words = sheet.entries.map((e) => e.word);
    expect(new Set(words).size).toBe(words.length);
  });

  it("same seed gives same selection in same order", () => {
    const a = generateRechtschreibung(base, 1234),
      b = generateRechtschreibung(base, 1234);
    expect(a.entries.map((e) => e.word)).toEqual(b.entries.map((e) => e.word));
  });

  it("different seeds produce different selections", () => {
    const a = generateRechtschreibung(base, 1),
      b = generateRechtschreibung(base, 9999);
    expect(a.entries.map((e) => e.word)).not.toEqual(b.entries.map((e) => e.word));
  });

  it("seed passed in config is used when no explicit seed argument given", () => {
    const a = generateRechtschreibung({ ...base, seed: 55 }),
      b = generateRechtschreibung({ ...base, seed: 55 });
    expect(a.entries.map((e) => e.word)).toEqual(b.entries.map((e) => e.word));
  });

  it("template contains the blank placeholder", () => {
    const sheet = generateRechtschreibung(base, 42);
    for (const entry of sheet.entries) {
      expect(entry.template).toContain(BLANK_PLACEHOLDER);
    }
  });

  it("template does not equal word (blank was replaced)", () => {
    const sheet = generateRechtschreibung(base, 42);
    for (const entry of sheet.entries) {
      expect(entry.template).not.toBe(entry.word);
    }
  });

  it("word includes blank (round-trip check)", () => {
    const sheet = generateRechtschreibung(base, 42);
    for (const entry of sheet.entries) {
      expect(entry.word).toContain(entry.blank);
    }
  });
});

// ── Rule filtering ────────────────────────────────────────────────────────────

describe("rule filtering", () => {
  const rules = ["ie-i", "ss-sz", "doppelkons", "endung"] as const;

  it.each(rules)('rule "%s": all returned entries belong to that rule', (rule) => {
    const sheet = generateRechtschreibung({ ...base, rule, count: 10 }, 42);
    for (const entry of sheet.entries) {
      const corpusEntry = corpusForRule(rule).find((c) => c.word === entry.word);
      expect(corpusEntry).toBeDefined();
    }
  });
});

// ── Gemischt ─────────────────────────────────────────────────────────────────

describe("generateRechtschreibung — gemischt", () => {
  it("count: 20 produces entries from all four rules", () => {
    const sheet = generateRechtschreibung({ ...base, rule: "gemischt", count: 20 }, 42);
    const rulesPresent = new Set<string>();
    for (const entry of sheet.entries) {
      for (const rule of ["ie-i", "ss-sz", "doppelkons", "endung"] as const) {
        if (corpusForRule(rule).some((c) => c.word === entry.word)) {
          rulesPresent.add(rule);
        }
      }
    }
    expect(rulesPresent.size).toBe(4);
  });

  it("returns exactly count entries for gemischt", () => {
    const sheet = generateRechtschreibung({ ...base, rule: "gemischt", count: 20 }, 99);
    expect(sheet.entries).toHaveLength(20);
  });

  it("gemischt count: 15 returns 15 entries", () => {
    const sheet = generateRechtschreibung({ ...base, rule: "gemischt", count: 15 }, 7);
    expect(sheet.entries).toHaveLength(15);
  });
});
