import { describe, expect, it } from "vitest";
import { generateNumberTracing } from "./generate";
import type { NumberTracingConfig } from "./config";

const base: NumberTracingConfig = {
  digits: ["1", "2", "3"],
  linesPerDigit: 1,
};

describe("generateNumberTracing", () => {
  it("produces one block per digit in numeric order", () => {
    const sheet = generateNumberTracing(base);
    expect(sheet.blocks).toHaveLength(3);
    expect(sheet.blocks[0]).toMatchObject({ digit: "1", lines: 1 });
    expect(sheet.blocks[1]).toMatchObject({ digit: "2", lines: 1 });
    expect(sheet.blocks[2]).toMatchObject({ digit: "3", lines: 1 });
  });

  it("sorts unordered input into canonical 0–9 order", () => {
    const sheet = generateNumberTracing({
      digits: ["5", "1", "9", "0", "3"],
      linesPerDigit: 1,
    });
    expect(sheet.blocks.map((b) => b.digit)).toEqual(["0", "1", "3", "5", "9"]);
  });

  it("reflects the linesPerDigit in every block", () => {
    const sheet = generateNumberTracing({ ...base, linesPerDigit: 4 });
    for (const block of sheet.blocks) expect(block.lines).toBe(4);
  });

  it("accepts all 10 digits", () => {
    const all = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"] as const;
    const sheet = generateNumberTracing({ digits: [...all], linesPerDigit: 2 });
    expect(sheet.blocks).toHaveLength(10);
    expect(sheet.blocks.map((b) => b.digit)).toEqual([...all]);
  });

  it("rejects empty digit list", () => {
    expect(() =>
      generateNumberTracing({ ...base, digits: [] } as NumberTracingConfig),
    ).toThrow();
  });

  it("rejects more than 10 digits", () => {
    expect(() =>
      generateNumberTracing({
        ...base,
        digits: ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0"] as NumberTracingConfig["digits"],
      }),
    ).toThrow();
  });
});
