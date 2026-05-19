import { describe, expect, it } from "vitest";
import {
  generateEnglischSimpleSentences,
  validateCorpusInvariants,
} from "./generate";
import { CORPUS_SIZE, ENGLISCH_SIMPLE_SENTENCES_CORPUS } from "./corpus";
import type { EnglischSimpleSentencesConfig } from "./config";

const base: EnglischSimpleSentencesConfig = {
  topic: "englisch-simple-sentences",
  count: 15,
  includeSolutions: true,
  seed: 42,
};

// ── Corpus size ───────────────────────────────────────────────────────────────

describe("corpus size", () => {
  it("has at least 25 entries", () => {
    expect(CORPUS_SIZE).toBeGreaterThanOrEqual(25);
  });
});

// ── Corpus invariants ─────────────────────────────────────────────────────────

describe("corpus invariants", () => {
  it("every template contains exactly one ___ placeholder", () => {
    const { violations } = validateCorpusInvariants();
    expect(violations).toEqual([]);
  });

  it("all answers are in [am, is, are]", () => {
    for (const entry of ENGLISCH_SIMPLE_SENTENCES_CORPUS) {
      expect(["am", "is", "are"]).toContain(entry.answer);
    }
  });

  it('all hints are "to be"', () => {
    for (const entry of ENGLISCH_SIMPLE_SENTENCES_CORPUS) {
      expect(entry.hint).toBe("to be");
    }
  });

  it("all templates are ASCII-only", () => {
    const asciiPrintable = /^[\x20-\x7E]+$/;
    for (const entry of ENGLISCH_SIMPLE_SENTENCES_CORPUS) {
      expect(entry.template).toMatch(asciiPrintable);
      expect(entry.answer).toMatch(asciiPrintable);
      expect(entry.hint).toMatch(asciiPrintable);
    }
  });
});

// ── Zod rejection ─────────────────────────────────────────────────────────────

describe("Zod rejection", () => {
  it("rejects count: 12", () => {
    expect(() =>
      generateEnglischSimpleSentences(
        { ...base, count: 12 as EnglischSimpleSentencesConfig["count"] },
        1,
      ),
    ).toThrow();
  });

  it("rejects non-boolean includeSolutions", () => {
    expect(() =>
      generateEnglischSimpleSentences(
        { ...base, includeSolutions: "yes" as unknown as boolean },
        1,
      ),
    ).toThrow();
  });
});

// ── Output shape ──────────────────────────────────────────────────────────────

describe("generateEnglischSimpleSentences — output shape", () => {
  it("returns exactly 10 tasks when count is 10", () => {
    const sheet = generateEnglischSimpleSentences({ ...base, count: 10 }, 1);
    expect(sheet.tasks).toHaveLength(10);
  });

  it("returns exactly 15 tasks when count is 15", () => {
    const sheet = generateEnglischSimpleSentences(base, 1);
    expect(sheet.tasks).toHaveLength(15);
  });

  it("returns exactly 20 tasks when count is 20", () => {
    const sheet = generateEnglischSimpleSentences({ ...base, count: 20 }, 1);
    expect(sheet.tasks).toHaveLength(20);
  });

  it("tasks are numbered from 1", () => {
    const sheet = generateEnglischSimpleSentences(base, 42);
    sheet.tasks.forEach((t, i) => {
      expect(t.id).toBe(i + 1);
    });
  });

  it("no duplicate templates in one sheet", () => {
    const sheet = generateEnglischSimpleSentences(base, 7);
    const templates = sheet.tasks.map((t) => t.template);
    expect(new Set(templates).size).toBe(templates.length);
  });
});

// ── Determinism ───────────────────────────────────────────────────────────────

describe("determinism", () => {
  it("same seed gives same output", () => {
    const a = generateEnglischSimpleSentences(base, 1234),
      b = generateEnglischSimpleSentences(base, 1234);
    expect(a.tasks.map((t) => t.template)).toEqual(
      b.tasks.map((t) => t.template),
    );
  });

  it("different seeds give different outputs", () => {
    const a = generateEnglischSimpleSentences(base, 1),
      b = generateEnglischSimpleSentences(base, 9999);
    // At least one item must differ (corpus is large enough to virtually guarantee this).
    const aTemplates = a.tasks.map((t) => t.template),
      bTemplates = b.tasks.map((t) => t.template);
    expect(aTemplates).not.toEqual(bTemplates);
  });

  it("seed from config is used when no explicit seed given", () => {
    const a = generateEnglischSimpleSentences({ ...base, seed: 77 }),
      b = generateEnglischSimpleSentences({ ...base, seed: 77 });
    expect(a.tasks.map((t) => t.template)).toEqual(
      b.tasks.map((t) => t.template),
    );
  });
});
