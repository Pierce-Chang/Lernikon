import { z } from "zod";

export const STELLEN_OPTIONS = ["3:1", "4:1", "4:2"] as const;
export type DivStellen = (typeof STELLEN_OPTIONS)[number];

export const COUNT_OPTIONS = [4, 8, 12] as const;
export type DivCount = (typeof COUNT_OPTIONS)[number];

export const VERFAHREN_OPTIONS = ["abzieh", "ergaenzung"] as const;
export type DivVerfahren = (typeof VERFAHREN_OPTIONS)[number];

export const divisionConfigSchema = z.object({
  stellen: z.enum(["3:1", "4:1", "4:2"]),
  count: z.union([z.literal(4), z.literal(8), z.literal(12)]),
  verfahren: z.enum(["abzieh", "ergaenzung"]),
  mitRest: z.boolean(),
  merkkasten: z.boolean(),
  solutions: z.boolean(),
  seed: z.number().int().optional(),
});

export type DivisionConfig = z.infer<typeof divisionConfigSchema>;

/** Human-readable label per Stellen option, used in PDF subtitles and filenames. */
export const STELLEN_LABELS: Record<DivStellen, string> = {
  "3:1": "3-stellig : 1-stellig",
  "4:1": "4-stellig : 1-stellig",
  "4:2": "4-stellig : 2-stellig",
};

/** Human-readable label per Verfahren option. */
export const VERFAHREN_LABELS: Record<DivVerfahren, string> = {
  abzieh: "Abziehverfahren",
  ergaenzung: "Erganzungsverfahren",
};

/** Fixed quotient digit count per Stellen mode. */
export const MAX_QUOTIENT_DIGITS: Record<DivStellen, number> = {
  "3:1": 3,
  "4:1": 4,
  "4:2": 3,
};
