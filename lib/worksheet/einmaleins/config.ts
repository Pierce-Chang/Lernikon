import { z } from "zod";

export const ROW_IDS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;
export type RowId = (typeof ROW_IDS)[number];

export const COUNT_OPTIONS = [10, 15, 20] as const;
export type Count = (typeof COUNT_OPTIONS)[number];

/** Difficulty label shown on each row chip in the UI. */
export const ROW_DIFFICULTY_LABEL: Record<RowId, string> = {
  1: "Einfach",
  2: "Einfach",
  3: "Mittel",
  4: "Mittel",
  5: "Einfach",
  6: "Schwer",
  7: "Schwer",
  8: "Schwer",
  9: "Schwer",
  10: "Einfach",
};

export const einmaleinsConfigSchema = z.object({
  rows: z
    .array(
      z.union([
        z.literal(1),
        z.literal(2),
        z.literal(3),
        z.literal(4),
        z.literal(5),
        z.literal(6),
        z.literal(7),
        z.literal(8),
        z.literal(9),
        z.literal(10),
      ]),
    )
    .min(1)
    .max(10),
  count: z.union([z.literal(10), z.literal(15), z.literal(20)]),
  includeSolutions: z.boolean().default(true),
});

export type EinmaleinsConfig = z.infer<typeof einmaleinsConfigSchema>;
