import { describe, expect, it } from "vitest";
import { generateWoerter } from "./generate";
import { WOERTER_BY_KLASSE } from "./corpus";
import type { WoerterConfig } from "./config";

const base: WoerterConfig = {
  klasse: 1,
  count: 5,
  linesPerWord: 2,
  style: "druck",
};

describe("generateWoerter", () => {
  it("returns exactly count blocks", () => {
    const blocks = generateWoerter(base, 42);
    expect(blocks).toHaveLength(5);
  });

  it("returns exactly count=8 blocks", () => {
    const blocks = generateWoerter({ ...base, count: 8 }, 42);
    expect(blocks).toHaveLength(8);
  });

  it("returns exactly count=10 blocks", () => {
    const blocks = generateWoerter({ ...base, count: 10 }, 42);
    expect(blocks).toHaveLength(10);
  });

  it("all words come from the Klasse 1 corpus", () => {
    const corpus = WOERTER_BY_KLASSE[1];
    const blocks = generateWoerter(base, 99);
    for (const block of blocks) {
      expect(corpus).toContain(block.word);
    }
  });

  it("all words come from the Klasse 2 corpus", () => {
    const corpus = WOERTER_BY_KLASSE[2];
    const blocks = generateWoerter({ ...base, klasse: 2 }, 99);
    for (const block of blocks) {
      expect(corpus).toContain(block.word);
    }
  });

  it("no duplicate words within one worksheet", () => {
    const blocks = generateWoerter({ ...base, count: 10 }, 7);
    const words = blocks.map((b) => b.word);
    expect(new Set(words).size).toBe(words.length);
  });

  it("is deterministic with the same seed", () => {
    const a = generateWoerter(base, 1234),
      b = generateWoerter(base, 1234);
    expect(a.map((b) => b.word)).toEqual(b.map((b) => b.word));
  });

  it("different seeds produce different word selections", () => {
    const a = generateWoerter(base, 1),
      b = generateWoerter(base, 9999);
    // With 5 words from an 80+ word corpus two random seeds almost certainly differ.
    expect(a.map((x) => x.word)).not.toEqual(b.map((x) => x.word));
  });

  it("each block has lines equal to linesPerWord", () => {
    const blocks = generateWoerter({ ...base, linesPerWord: 3 }, 42);
    for (const block of blocks) {
      expect(block.lines).toBe(3);
    }
  });
});
