import { describe, expect, it } from "vitest";
import { generateLetterTracing } from "./generate";
import type { LetterTracingConfig } from "./config";

const base: LetterTracingConfig = {
  letters: ["A", "B"],
  case: "upper",
  linesPerLetter: 1,
  style: "druck",
};

describe("generateLetterTracing", () => {
  it("produces one block per letter in upper-only mode", () => {
    const sheet = generateLetterTracing(base);
    expect(sheet.blocks).toHaveLength(2);
    expect(sheet.blocks[0]).toMatchObject({ char: "A", displayCase: "upper", lines: 1 });
    expect(sheet.blocks[1]).toMatchObject({ char: "B", displayCase: "upper", lines: 1 });
  });

  it("respects linesPerLetter when set to 3", () => {
    const sheet = generateLetterTracing({ ...base, linesPerLetter: 3 });
    for (const block of sheet.blocks) expect(block.lines).toBe(3);
  });

  it("sorts unordered input into canonical A–Z order", () => {
    const sheet = generateLetterTracing({
      ...base,
      letters: ["M", "A", "Z", "C"],
    });
    expect(sheet.blocks.map((b) => b.char)).toEqual(["A", "C", "M", "Z"]);
  });

  it("emits upper then lower per letter in 'both' mode", () => {
    const sheet = generateLetterTracing({ ...base, case: "both" });
    expect(sheet.blocks).toHaveLength(4);
    expect(sheet.blocks.map((b) => `${b.char}/${b.displayCase}`)).toEqual([
      "A/upper",
      "a/lower",
      "B/upper",
      "b/lower",
    ]);
  });

  it("lowercases the char in lower-only mode", () => {
    const sheet = generateLetterTracing({ ...base, case: "lower" });
    expect(sheet.blocks.map((b) => b.char)).toEqual(["a", "b"]);
    for (const block of sheet.blocks) expect(block.displayCase).toBe("lower");
  });

  it("rejects letters outside A–Z", () => {
    expect(() =>
      generateLetterTracing({ ...base, letters: ["A", "Ä"] } as LetterTracingConfig),
    ).toThrow();
  });

  it("rejects empty letter list", () => {
    expect(() =>
      generateLetterTracing({ ...base, letters: [] } as LetterTracingConfig),
    ).toThrow();
  });

  it("rejects more than 10 letters", () => {
    expect(() =>
      generateLetterTracing({
        ...base,
        letters: "ABCDEFGHIJK".split(""),
      } as LetterTracingConfig),
    ).toThrow();
  });
});
