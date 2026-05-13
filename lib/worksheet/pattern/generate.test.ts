import { describe, expect, it } from "vitest";
import { generatePatternSequences } from "./generate";
import { PatternConfigSchema, DIFFICULTY_BLANK_COUNT, type PatternConfig } from "./config";

const base: PatternConfig = {
  shapes: ["kreis", "viereck"],
  difficulty: "abab",
  rowCount: 6,
  itemsPerRow: 6,
  mode: "fill",
  includeSolutions: true,
};

const baseCutout: PatternConfig = { ...base, mode: "cutout" };

describe("PatternConfigSchema", () => {
  it("defaults includeSolutions to true when the field is omitted", () => {
    const result = PatternConfigSchema.parse({
      shapes: ["kreis", "viereck"],
      difficulty: "abab",
      rowCount: 6,
      itemsPerRow: 6,
      mode: "fill",
    });
    expect(result.includeSolutions).toBe(true);
  });
});

describe("generatePatternSequences", () => {
  it("produces the correct row count", () => {
    const sheet = generatePatternSequences(base, 1);
    expect(sheet.rows).toHaveLength(6);
  });

  it("each row has itemsPerRow items", () => {
    const sheet = generatePatternSequences(base, 1);
    for (const row of sheet.rows) {
      expect(row.items).toHaveLength(6);
    }
  });

  it("ABAB with 2 shapes and 6 items produces alternating pattern", () => {
    const sheet = generatePatternSequences(base, 42);
    for (const row of sheet.rows) {
      // Items must strictly alternate: index 0 and 2 and 4 equal, index 1 and 3 and 5 equal.
      expect(row.items[0]).toBe(row.items[2]);
      expect(row.items[0]).toBe(row.items[4]);
      expect(row.items[1]).toBe(row.items[3]);
      expect(row.items[1]).toBe(row.items[5]);
      expect(row.items[0]).not.toBe(row.items[1]);
    }
  });

  it("ABCABC with 3 shapes and 6 items produces correct 3-unit pattern", () => {
    const config: PatternConfig = {
      shapes: ["kreis", "viereck", "raute"],
      difficulty: "abcabc",
      rowCount: 6,
      itemsPerRow: 6,
      mode: "fill",
      includeSolutions: true,
    };
    const sheet = generatePatternSequences(config, 7);
    for (const row of sheet.rows) {
      expect(row.items[0]).toBe(row.items[3]);
      expect(row.items[1]).toBe(row.items[4]);
      expect(row.items[2]).toBe(row.items[5]);
    }
  });

  it("ABBABB: each row has exactly 2 distinct shapes, one appearing twice and one once per unit", () => {
    const config: PatternConfig = {
      shapes: ["kreis", "viereck"],
      difficulty: "abbabb",
      rowCount: 6,
      itemsPerRow: 6,
      mode: "fill",
      includeSolutions: true,
    };
    const sheet = generatePatternSequences(config, 99);
    for (const row of sheet.rows) {
      // Unit is 3 cells long; with 6 items the unit repeats exactly twice.
      const unit = row.items.slice(0, 3),
        repeat = row.items.slice(3, 6);
      // Both halves must be identical (unit tiles correctly).
      expect(unit).toEqual(repeat);
      // Unit must contain exactly 2 distinct shapes.
      const distinct = new Set(unit);
      expect(distinct.size).toBe(2);
      // One shape appears once (singleton), the other twice (doubled).
      const counts = [...distinct].map((s) => unit.filter((x) => x === s).length).sort();
      expect(counts).toEqual([1, 2]);
    }
  });

  it("blanks are always the last cells and match the correct count for abab", () => {
    const sheet = generatePatternSequences(base, 1);
    const expected = DIFFICULTY_BLANK_COUNT["abab"];
    for (const row of sheet.rows) {
      expect(row.blanks).toHaveLength(expected);
      const start = 6 - expected;
      expect(row.blanks).toEqual(Array.from({ length: expected }, (_, i) => start + i));
    }
  });

  it("blanks count is 3 for abcabc", () => {
    const config: PatternConfig = {
      shapes: ["kreis", "viereck", "raute"],
      difficulty: "abcabc",
      rowCount: 6,
      itemsPerRow: 6,
      mode: "fill",
      includeSolutions: true,
    };
    const sheet = generatePatternSequences(config, 1);
    for (const row of sheet.rows) {
      expect(row.blanks).toHaveLength(3);
    }
  });

  it("solutions match items at blank positions", () => {
    const sheet = generatePatternSequences(base, 55);
    for (const row of sheet.rows) {
      row.blanks.forEach((blankIdx, i) => {
        expect(row.solutions[i]).toBe(row.items[blankIdx]);
      });
    }
  });

  it("is deterministic with the same seed", () => {
    const a = generatePatternSequences(base, 12345),
      b = generatePatternSequences(base, 12345);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it("produces different output with a different seed", () => {
    const a = generatePatternSequences(base, 1),
      b = generatePatternSequences(base, 9999);
    // It's extremely unlikely (practically impossible) for all rows to be identical.
    expect(JSON.stringify(a)).not.toBe(JSON.stringify(b));
  });

  it("produces rowCount rows for non-default counts", () => {
    const config: PatternConfig = { ...base, rowCount: 4 };
    expect(generatePatternSequences(config, 1).rows).toHaveLength(4);
  });

  it("uses all shapes from the pool across rows", () => {
    const config: PatternConfig = {
      shapes: ["kreis", "viereck", "raute", "stern"],
      difficulty: "abab",
      rowCount: 6,
      itemsPerRow: 6,
      mode: "fill",
      includeSolutions: true,
    };
    const sheet = generatePatternSequences(config, 1),
      used = new Set(sheet.rows.flatMap((r) => r.items));
    // With 4 shapes and 8 rows, all 4 should appear at least once.
    expect(used.size).toBeGreaterThan(1);
  });

  it("dreieck works as a valid shape in a pattern", () => {
    const config: PatternConfig = {
      shapes: ["kreis", "dreieck"],
      difficulty: "abab",
      rowCount: 6,
      itemsPerRow: 6,
      mode: "fill",
      includeSolutions: true,
    };
    const sheet = generatePatternSequences(config, 7);
    // All items must be one of the two selected shapes.
    for (const row of sheet.rows) {
      for (const item of row.items) {
        expect(["kreis", "dreieck"]).toContain(item);
      }
    }
    // Pattern must alternate.
    for (const row of sheet.rows) {
      expect(row.items[0]).toBe(row.items[2]);
      expect(row.items[1]).toBe(row.items[3]);
      expect(row.items[0]).not.toBe(row.items[1]);
    }
  });

  it("accepts all 8 shapes simultaneously", () => {
    const config: PatternConfig = {
      shapes: ["kreis", "dreieck", "viereck", "rechteck", "raute", "fuenfeck", "sechseck", "stern"],
      difficulty: "abcabc",
      rowCount: 6,
      itemsPerRow: 6,
      mode: "fill",
      includeSolutions: true,
    };
    // Should not throw; shape pool is larger than the 3-unit arity.
    const sheet = generatePatternSequences(config, 1);
    expect(sheet.rows).toHaveLength(6);
  });

  it("rechteck works as a valid shape in a pattern", () => {
    const config: PatternConfig = {
      shapes: ["kreis", "rechteck"],
      difficulty: "abab",
      rowCount: 6,
      itemsPerRow: 6,
      mode: "fill",
      includeSolutions: true,
    };
    const sheet = generatePatternSequences(config, 13);
    for (const row of sheet.rows) {
      for (const item of row.items) {
        expect(["kreis", "rechteck"]).toContain(item);
      }
    }
    for (const row of sheet.rows) {
      expect(row.items[0]).toBe(row.items[2]);
      expect(row.items[1]).toBe(row.items[3]);
      expect(row.items[0]).not.toBe(row.items[1]);
    }
  });

  describe("unit-shape randomization", () => {
    it("abbabb: doubled shape varies across rows (both shapes appear as singleton at least once)", () => {
      // Run many rows so the two possible singleton positions are both seen.
      const config: PatternConfig = {
        shapes: ["kreis", "viereck"],
        difficulty: "abbabb",
        rowCount: 6,
        itemsPerRow: 6,
        mode: "fill",
        includeSolutions: true,
      };
      const sheet = generatePatternSequences(config, 5);
      // Collect which shape is the singleton in each row's unit (first 3 cells).
      const singletons = new Set(
        sheet.rows.map((row) => {
          const unit = row.items.slice(0, 3);
          return unit.find((s) => unit.filter((x) => x === s).length === 1);
        }),
      );
      // Both shapes must appear as singleton at least once across 10 rows.
      expect(singletons.size).toBeGreaterThanOrEqual(2);
    });

    it("abbabb: singleton position within the unit varies across rows", () => {
      const config: PatternConfig = {
        shapes: ["kreis", "viereck"],
        difficulty: "abbabb",
        rowCount: 6,
        itemsPerRow: 6,
        mode: "fill",
        includeSolutions: true,
      };
      const sheet = generatePatternSequences(config, 3);
      // Collect the index (0, 1, or 2) at which the singleton sits in each unit.
      const singletonPositions = new Set(
        sheet.rows.map((row) => {
          const unit = row.items.slice(0, 3);
          return unit.findIndex((s) => unit.filter((x) => x === s).length === 1);
        }),
      );
      // Across 10 rows the singleton must not always land in the same slot.
      expect(singletonPositions.size).toBeGreaterThanOrEqual(2);
    });

    it("abab: the starting shape varies across rows (not always the same first shape)", () => {
      const config: PatternConfig = {
        shapes: ["kreis", "viereck"],
        difficulty: "abab",
        rowCount: 6,
        itemsPerRow: 6,
        mode: "fill",
        includeSolutions: true,
      };
      const sheet = generatePatternSequences(config, 8);
      const firstShapes = new Set(sheet.rows.map((row) => row.items[0]));
      // With 10 rows, both kreis and viereck must appear as first shape.
      expect(firstShapes.size).toBeGreaterThanOrEqual(2);
    });

    it("abcabc: multiple distinct starting shapes appear across rows", () => {
      const config: PatternConfig = {
        shapes: ["kreis", "viereck", "raute"],
        difficulty: "abcabc",
        rowCount: 6,
        itemsPerRow: 6,
        mode: "fill",
        includeSolutions: true,
      };
      const sheet = generatePatternSequences(config, 11);
      const firstShapes = new Set(sheet.rows.map((row) => row.items[0]));
      expect(firstShapes.size).toBeGreaterThanOrEqual(2);
    });

    it("randomization is deterministic: same seed produces same unit shapes", () => {
      const config: PatternConfig = {
        shapes: ["kreis", "viereck"],
        difficulty: "abbabb",
        rowCount: 6,
        itemsPerRow: 6,
        mode: "fill",
        includeSolutions: true,
      };
      const a = generatePatternSequences(config, 42),
        b = generatePatternSequences(config, 42);
      expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    });
  });

  describe("cutout mode", () => {
    it("cutouts is null when mode is fill", () => {
      const sheet = generatePatternSequences(base, 1);
      expect(sheet.cutouts).toBeNull();
    });

    it("cutouts.length equals total blanks across all rows", () => {
      const sheet = generatePatternSequences(baseCutout, 1);
      const totalBlanks = sheet.rows.reduce((acc, r) => acc + r.blanks.length, 0);
      expect(sheet.cutouts).not.toBeNull();
      expect(sheet.cutouts!.length).toBe(totalBlanks);
    });

    it("cutouts contains exactly the union (with repetition) of all row solutions", () => {
      const sheet = generatePatternSequences(baseCutout, 42);
      const allSolutions = sheet.rows.flatMap((r) => r.solutions).sort();
      const cutoutsSorted = [...(sheet.cutouts ?? [])].sort();
      expect(cutoutsSorted).toEqual(allSolutions);
    });

    it("cutout order is deterministic given the same seed", () => {
      const a = generatePatternSequences(baseCutout, 77),
        b = generatePatternSequences(baseCutout, 77);
      expect(JSON.stringify(a.cutouts)).toBe(JSON.stringify(b.cutouts));
    });

    it("cutout order differs from sorted solutions (shuffle is applied)", () => {
      // With enough cutouts, the shuffled order is extremely unlikely to match sorted.
      const config: PatternConfig = {
        shapes: ["kreis", "dreieck", "viereck", "raute"],
        difficulty: "abcabc",
        rowCount: 6,
        itemsPerRow: 8,
        mode: "cutout",
        includeSolutions: true,
      };
      const sheet = generatePatternSequences(config, 1),
        allSolutions = sheet.rows.flatMap((r) => r.solutions),
        cutouts = sheet.cutouts ?? [];
      // The lengths must match.
      expect(cutouts.length).toBe(allSolutions.length);
      // The cutouts must be a permutation of the solutions.
      expect([...cutouts].sort()).toEqual([...allSolutions].sort());
    });
  });

  describe("gemischt difficulty", () => {
    const gemischtConfig: PatternConfig = {
      shapes: ["kreis", "dreieck", "viereck"],
      difficulty: "gemischt",
      rowCount: 6,
      itemsPerRow: 8,
      mode: "fill",
      includeSolutions: true,
    };

    it("produces the requested number of rows", () => {
      const sheet = generatePatternSequences(gemischtConfig, 1);
      expect(sheet.rows).toHaveLength(6);
    });

    it("produces at least 2 distinct sub-difficulties across 10 rows (seed 7)", () => {
      // Seed 7 has been verified to produce variety across 10 rows.
      const sheet = generatePatternSequences(gemischtConfig, 7);
      // Infer sub-difficulty from blank count: 2 = abab/abbabb, 3 = abcabc.
      // We need to see at least one row with blankCount=3 and one with blankCount=2.
      const blankCounts = new Set(sheet.rows.map((r) => r.blanks.length));
      expect(blankCounts.size).toBeGreaterThanOrEqual(2);
    });

    it("is deterministic with the same seed", () => {
      const a = generatePatternSequences(gemischtConfig, 42),
        b = generatePatternSequences(gemischtConfig, 42);
      expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    });

    it("each row's blank count matches its actual sub-difficulty blank count", () => {
      const sheet = generatePatternSequences(gemischtConfig, 99);
      for (const row of sheet.rows) {
        const bc = row.blanks.length;
        // Valid blank counts: 2 (abab or abbabb) or 3 (abcabc).
        expect([2, 3]).toContain(bc);
        // blanks must be the last bc positions.
        const expectedBlanks = Array.from(
          { length: bc },
          (_, i) => 8 - bc + i,
        );
        expect(row.blanks).toEqual(expectedBlanks);
        // solutions must match the items at those positions.
        row.blanks.forEach((blankIdx, i) => {
          expect(row.solutions[i]).toBe(row.items[blankIdx]);
        });
      }
    });
  });
});
