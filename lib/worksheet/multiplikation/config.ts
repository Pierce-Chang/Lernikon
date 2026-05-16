import { z } from "zod";

export const STELLEN_OPTIONS = ["3x1", "3x2"] as const;
export type MulStellen = (typeof STELLEN_OPTIONS)[number];

export const COUNT_OPTIONS = [4, 8, 12] as const;
export type MulCount = (typeof COUNT_OPTIONS)[number];

export const multiplikationConfigSchema = z.object({
  stellen: z.enum(["3x1", "3x2"]),
  count: z.union([z.literal(4), z.literal(8), z.literal(12)]),
  solutions: z.boolean(),
  seed: z.number().int().optional(),
});

export type MultiplikationConfig = z.infer<typeof multiplikationConfigSchema>;

/** Human-readable label per Stellen option, used in PDF subtitles and filenames. */
export const STELLEN_LABELS: Record<MulStellen, string> = {
  "3x1": "3-stellig × 1-stellig",
  "3x2": "3-stellig × 2-stellig",
};
