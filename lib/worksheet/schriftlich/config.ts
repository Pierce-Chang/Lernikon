import { z } from "zod";

export const OPERATION_OPTIONS = ["addition", "subtraktion", "gemischt"] as const;
export type SchriftlichOperation = (typeof OPERATION_OPTIONS)[number];

export const STELLEN_OPTIONS = [3, 4] as const;
export type Stellen = (typeof STELLEN_OPTIONS)[number];

export const COUNT_OPTIONS = [6, 12, 18] as const;
export type SchriftlichCount = (typeof COUNT_OPTIONS)[number];

export const schriftlichConfigSchema = z.object({
  operation: z.enum(["addition", "subtraktion", "gemischt"]),
  stellen: z.union([z.literal(3), z.literal(4)]),
  count: z.union([z.literal(6), z.literal(12), z.literal(18)]),
  solutions: z.boolean(),
  seed: z.number().int().optional(),
});

export type SchriftlichConfig = z.infer<typeof schriftlichConfigSchema>;

/** Human-readable label for the operation, used in PDF subtitles and filenames. */
export const OPERATION_LABELS: Record<SchriftlichOperation, string> = {
  addition: "Addition",
  subtraktion: "Subtraktion",
  gemischt: "Gemischt",
};
