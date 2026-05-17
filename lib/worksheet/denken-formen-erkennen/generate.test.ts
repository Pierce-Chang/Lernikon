import { describe, expect, it } from "vitest";
import { generateFormenErkennen } from "./generate";
import { formenErkennenConfigSchema } from "./config";
import { SLOTS_12, SLOTS_18 } from "./generate";

const BASE_CONFIG = {
  zielForm: "quadrat" as const,
  totalCount: 12 as const,
  schwierigkeit: "einfach" as const,
  solutions: true,
  seed: 42,
};

describe("formenErkennenConfigSchema", () => {
  it("rejects invalid zielForm", () => {
    const result = formenErkennenConfigSchema.safeParse({
      ...BASE_CONFIG,
      zielForm: "pentagon",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid totalCount", () => {
    const result = formenErkennenConfigSchema.safeParse({
      ...BASE_CONFIG,
      totalCount: 15,
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid schwierigkeit", () => {
    const result = formenErkennenConfigSchema.safeParse({
      ...BASE_CONFIG,
      schwierigkeit: "schwer",
    });
    expect(result.success).toBe(false);
  });

  it("accepts a valid config", () => {
    const result = formenErkennenConfigSchema.safeParse(BASE_CONFIG);
    expect(result.success).toBe(true);
  });
});

describe("generateFormenErkennen", () => {
  it("produces exactly 12 slots for totalCount=12", () => {
    const sheet = generateFormenErkennen(BASE_CONFIG, 1);
    expect(sheet.slots).toHaveLength(12);
  });

  it("produces exactly 18 slots for totalCount=18", () => {
    const sheet = generateFormenErkennen(
      { ...BASE_CONFIG, totalCount: 18 },
      1,
    );
    expect(sheet.slots).toHaveLength(18);
  });

  it("contains exactly 4 ziel slots for totalCount=12", () => {
    const sheet = generateFormenErkennen(BASE_CONFIG, 1);
    const zielCount = sheet.slots.filter((s) => s.isZiel).length;
    expect(zielCount).toBe(4);
  });

  it("contains exactly 6 ziel slots for totalCount=18", () => {
    const sheet = generateFormenErkennen(
      { ...BASE_CONFIG, totalCount: 18 },
      1,
    );
    const zielCount = sheet.slots.filter((s) => s.isZiel).length;
    expect(zielCount).toBe(6);
  });

  it("distractor slots never have the same shapeId as zielForm", () => {
    const sheet = generateFormenErkennen(BASE_CONFIG, 1);
    const distractorShapes = sheet.slots
      .filter((s) => !s.isZiel)
      .map((s) => s.shapeId);
    expect(distractorShapes.every((id) => id !== BASE_CONFIG.zielForm)).toBe(true);
  });

  it("mittel with zielForm=quadrat includes rechteck or raute as distractor", () => {
    // Run several seeds to confirm similar shapes appear statistically
    let found = false;
    for (let seed = 0; seed < 20; seed++) {
      const sheet = generateFormenErkennen(
        { ...BASE_CONFIG, schwierigkeit: "mittel" },
        seed,
      );
      const distractorShapes = new Set(
        sheet.slots.filter((s) => !s.isZiel).map((s) => s.shapeId),
      );
      if (distractorShapes.has("rechteck") || distractorShapes.has("raute")) {
        found = true;
        break;
      }
    }
    expect(found).toBe(true);
  });

  it("slot x coordinates are within expected canvas bounds", () => {
    const sheet = generateFormenErkennen(BASE_CONFIG, 1);
    expect(sheet.slots.every((s) => s.x >= 0 && s.x <= 480)).toBe(true);
  });

  it("slot y coordinates are within expected canvas bounds", () => {
    const sheet = generateFormenErkennen(BASE_CONFIG, 1);
    expect(sheet.slots.every((s) => s.y >= 0 && s.y <= 700)).toBe(true);
  });

  it("is deterministic for the same seed", () => {
    const a = generateFormenErkennen(BASE_CONFIG, 99);
    const b = generateFormenErkennen(BASE_CONFIG, 99);
    expect(a).toEqual(b);
  });

  it("produces different layouts for different seeds", () => {
    const a = generateFormenErkennen(BASE_CONFIG, 1);
    const b = generateFormenErkennen(BASE_CONFIG, 2);
    const aShapes = a.slots.map((s) => s.shapeId).join(",");
    const bShapes = b.slots.map((s) => s.shapeId).join(",");
    expect(aShapes).not.toBe(bShapes);
  });

  it("quadrat slots always have rotation=0 (avoid quadrat-as-raute ambiguity)", () => {
    const sheet = generateFormenErkennen(
      { ...BASE_CONFIG, zielForm: "quadrat" },
      1,
    );
    const quadratSlots = sheet.slots.filter((s) => s.shapeId === "quadrat");
    expect(quadratSlots.every((s) => s.rotation === 0)).toBe(true);
  });

  it("SLOTS_12 has length 12", () => {
    expect(SLOTS_12).toHaveLength(12);
  });

  it("SLOTS_18 has length 18", () => {
    expect(SLOTS_18).toHaveLength(18);
  });
});
