import { describe, expect, it } from "vitest";
import { generateDiktat } from "./generate";
import { KLASSE_2_SENTENCES } from "./corpus";
import type { DiktatConfig } from "./config";

const base: DiktatConfig = {
  klasse: 2,
  count: 5,
};

describe("KLASSE_2_SENTENCES corpus", () => {
  it("has at least 50 entries", () => {
    expect(KLASSE_2_SENTENCES.length).toBeGreaterThanOrEqual(50);
  });
});

describe("generateDiktat", () => {
  it("returns exactly 5 sentences", () => {
    const sheet = generateDiktat(base, 42);
    expect(sheet.sentences).toHaveLength(5);
  });

  it("returns exactly 8 sentences", () => {
    const sheet = generateDiktat({ ...base, count: 8 }, 42);
    expect(sheet.sentences).toHaveLength(8);
  });

  it("returns exactly 12 sentences", () => {
    const sheet = generateDiktat({ ...base, count: 12 }, 42);
    expect(sheet.sentences).toHaveLength(12);
  });

  it("sentences are numbered starting from 1", () => {
    const sheet = generateDiktat(base, 42);
    sheet.sentences.forEach((s, i) => {
      expect(s.id).toBe(i + 1);
    });
  });

  it("all returned sentences appear in the corpus", () => {
    const sheet = generateDiktat(base, 99);
    for (const sentence of sheet.sentences) {
      expect(KLASSE_2_SENTENCES).toContain(sentence.text);
    }
  });

  it("no duplicate sentences within one worksheet", () => {
    const sheet = generateDiktat({ ...base, count: 12 }, 7);
    const texts = sheet.sentences.map((s) => s.text);
    expect(new Set(texts).size).toBe(texts.length);
  });

  it("is deterministic with the same seed", () => {
    const a = generateDiktat(base, 1234),
      b = generateDiktat(base, 1234);
    expect(a.sentences.map((s) => s.text)).toEqual(b.sentences.map((s) => s.text));
  });

  it("different seeds produce different selections", () => {
    const a = generateDiktat(base, 1),
      b = generateDiktat(base, 9999);
    expect(a.sentences.map((s) => s.text)).not.toEqual(b.sentences.map((s) => s.text));
  });

  it("seed passed in config is used when no explicit seed argument is given", () => {
    const a = generateDiktat({ ...base, seed: 42 }),
      b = generateDiktat({ ...base, seed: 42 });
    expect(a.sentences.map((s) => s.text)).toEqual(b.sentences.map((s) => s.text));
  });
});
