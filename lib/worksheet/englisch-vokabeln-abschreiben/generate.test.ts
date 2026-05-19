import { describe, expect, it } from "vitest";
import { generateVokabelnAbschreiben } from "./generate";
import { vokabelnConfigSchema, BUCKET_IDS } from "./config";

describe("vokabelnConfigSchema", () => {
  it("rejects empty buckets array", () => {
    const result = vokabelnConfigSchema.safeParse({
      buckets: [],
      count: 8,
      linesPerWord: 2,
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid count value", () => {
    const result = vokabelnConfigSchema.safeParse({
      buckets: ["tiere"],
      count: 7,
      linesPerWord: 2,
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid linesPerWord value", () => {
    const result = vokabelnConfigSchema.safeParse({
      buckets: ["farben"],
      count: 5,
      linesPerWord: 4,
    });
    expect(result.success).toBe(false);
  });
});

describe("generateVokabelnAbschreiben", () => {
  const baseConfig = {
    buckets: [...BUCKET_IDS] as typeof BUCKET_IDS[number][],
    count: 8 as const,
    linesPerWord: 2 as const,
  };

  it("returns exactly count items", () => {
    const sheet = generateVokabelnAbschreiben({ ...baseConfig, count: 5 }, 42);
    expect(sheet.items).toHaveLength(5);
  });

  it("returns exactly count items for count=8", () => {
    const sheet = generateVokabelnAbschreiben({ ...baseConfig, count: 8 }, 42);
    expect(sheet.items).toHaveLength(8);
  });

  it("returns exactly count items for count=10", () => {
    const sheet = generateVokabelnAbschreiben({ ...baseConfig, count: 10 }, 42);
    expect(sheet.items).toHaveLength(10);
  });

  it("is deterministic: same seed produces same items", () => {
    const a = generateVokabelnAbschreiben(baseConfig, 99),
      b = generateVokabelnAbschreiben(baseConfig, 99);
    expect(a.items).toEqual(b.items);
  });

  it("different seeds produce different items (at least one differs)", () => {
    const a = generateVokabelnAbschreiben(baseConfig, 1),
      b = generateVokabelnAbschreiben(baseConfig, 9999);
    const aWords = a.items.map((i) => i.english),
      bWords = b.items.map((i) => i.english);
    expect(aWords).not.toEqual(bWords);
  });

  it("produces no duplicate english words within one sheet", () => {
    const sheet = generateVokabelnAbschreiben(baseConfig, 77);
    const uniqueWords = new Set(sheet.items.map((i) => i.english));
    expect(uniqueWords.size).toBe(baseConfig.count);
  });

  it("bucket filter: only-farben bucket returns farben items", () => {
    const sheet = generateVokabelnAbschreiben(
      { ...baseConfig, buckets: ["farben"], count: 5 },
      123,
    );
    expect(sheet.items.every((i) => i.bucket === "farben")).toBe(true);
  });

  it("all english words are ASCII-only", () => {
    const sheet = generateVokabelnAbschreiben(
      { ...baseConfig, count: 10 },
      55,
    );
    const asciiRegex = /^[\x20-\x7E]+$/;
    for (const item of sheet.items) {
      expect(item.english).toMatch(asciiRegex);
    }
  });
});
