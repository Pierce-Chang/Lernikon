import { describe, expect, it } from "vitest";
import { generateFormenZuordnen } from "./generate";
import { formenZuordnenConfigSchema, PASTELL_COLORS } from "./config";

const BASE_CONFIG = {
  paarCount: 6 as const,
  seed: 42,
};

describe("formenZuordnenConfigSchema", () => {
  it("rejects invalid paarCount", () => {
    const result = formenZuordnenConfigSchema.safeParse({
      ...BASE_CONFIG,
      paarCount: 5,
    });
    expect(result.success).toBe(false);
  });

  it("accepts paarCount=4", () => {
    const result = formenZuordnenConfigSchema.safeParse({ ...BASE_CONFIG, paarCount: 4 });
    expect(result.success).toBe(true);
  });

  it("accepts paarCount=6", () => {
    const result = formenZuordnenConfigSchema.safeParse(BASE_CONFIG);
    expect(result.success).toBe(true);
  });

  it("accepts paarCount=8", () => {
    const result = formenZuordnenConfigSchema.safeParse({ ...BASE_CONFIG, paarCount: 8 });
    expect(result.success).toBe(true);
  });
});

describe("generateFormenZuordnen", () => {
  it("produces exactly 6 leftItems for paarCount=6", () => {
    const sheet = generateFormenZuordnen(BASE_CONFIG, 1);
    expect(sheet.leftItems).toHaveLength(6);
  });

  it("produces exactly 4 leftItems for paarCount=4", () => {
    const sheet = generateFormenZuordnen({ ...BASE_CONFIG, paarCount: 4 }, 1);
    expect(sheet.leftItems).toHaveLength(4);
  });

  it("produces exactly 8 leftItems for paarCount=8", () => {
    const sheet = generateFormenZuordnen({ ...BASE_CONFIG, paarCount: 8 }, 1);
    expect(sheet.leftItems).toHaveLength(8);
  });

  it("rightOrder has same length as leftItems", () => {
    const sheet = generateFormenZuordnen(BASE_CONFIG, 1);
    expect(sheet.rightOrder).toHaveLength(sheet.leftItems.length);
  });

  it("left side has no duplicate shapeIds", () => {
    const sheet = generateFormenZuordnen(BASE_CONFIG, 1);
    const ids = sheet.leftItems.map((item) => item.shapeId);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it("right side contains same multiset of shapeIds as left", () => {
    const sheet = generateFormenZuordnen(BASE_CONFIG, 1);
    const leftSorted = sheet.leftItems.map((item) => item.shapeId).sort().join(",");
    const rightSorted = [...sheet.rightOrder].sort().join(",");
    expect(rightSorted).toBe(leftSorted);
  });

  it("right order differs from left order (across several seeds)", () => {
    let hasDiff = false;
    for (let seed = 0; seed < 20; seed++) {
      const sheet = generateFormenZuordnen(BASE_CONFIG, seed);
      const leftOrder = sheet.leftItems.map((item) => item.shapeId).join(",");
      const rightOrder = sheet.rightOrder.join(",");
      if (leftOrder !== rightOrder) {
        hasDiff = true;
        break;
      }
    }
    expect(hasDiff).toBe(true);
  });

  it("all colours come from PASTELL_COLORS", () => {
    const sheet = generateFormenZuordnen(BASE_CONFIG, 1);
    const validColors = new Set(PASTELL_COLORS);
    for (const item of sheet.leftItems) {
      expect(validColors.has(item.color as typeof PASTELL_COLORS[number])).toBe(true);
    }
  });

  it("no duplicate colours within a sheet (paarCount <= 10)", () => {
    const sheet = generateFormenZuordnen(BASE_CONFIG, 1);
    const colors = sheet.leftItems.map((item) => item.color);
    const unique = new Set(colors);
    expect(unique.size).toBe(colors.length);
  });

  it("is deterministic for the same seed", () => {
    const a = generateFormenZuordnen(BASE_CONFIG, 99);
    const b = generateFormenZuordnen(BASE_CONFIG, 99);
    expect(a).toEqual(b);
  });

  it("produces different sheets for different seeds", () => {
    const a = generateFormenZuordnen(BASE_CONFIG, 1);
    const b = generateFormenZuordnen(BASE_CONFIG, 2);
    const aKey = a.leftItems.map((item) => item.shapeId).join(",");
    const bKey = b.leftItems.map((item) => item.shapeId).join(",");
    expect(aKey).not.toBe(bKey);
  });

  it("leftItem ids are sequential starting at 0", () => {
    const sheet = generateFormenZuordnen(BASE_CONFIG, 1);
    sheet.leftItems.forEach((item, i) => {
      expect(item.id).toBe(i);
    });
  });
});
