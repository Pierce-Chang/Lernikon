import { z } from "zod";

/** All supported shape IDs — match the `public/geometrics/` filled-PNG filenames. */
export const SHAPE_IDS = [
  "kreis",
  "dreieck",
  "viereck",
  "rechteck",
  "raute",
  "fuenfeck",
  "sechseck",
  "stern",
] as const;

export type ShapeId = (typeof SHAPE_IDS)[number];

/** German display labels for the shape IDs. */
export const SHAPE_LABELS: Record<ShapeId, string> = {
  kreis: "Kreis",
  dreieck: "Dreieck",
  viereck: "Viereck",
  rechteck: "Rechteck",
  raute: "Raute",
  fuenfeck: "Funfeck",
  sechseck: "Sechseck",
  stern: "Stern",
};

/** Valid quantity ranges for counting tasks. */
export const RANGE_IDS = ["1-5", "1-10"] as const;
export type RangeId = (typeof RANGE_IDS)[number];

/** German display labels for the range options. */
export const RANGE_LABELS: Record<RangeId, string> = {
  "1-5": "1 bis 5",
  "1-10": "1 bis 10",
};

/** Number of tasks per worksheet. */
export const COUNT_OPTIONS = [6, 12, 18] as const;
export type CountOption = (typeof COUNT_OPTIONS)[number];

/** Zod schema for the mengen generator config. */
export const mengenConfigSchema = z.object({
  topic: z.literal("mathe-mengen"),
  range: z.enum(RANGE_IDS).default("1-10"),
  count: z.union([z.literal(6), z.literal(12), z.literal(18)]).default(12),
  seed: z.number().int().optional(),
});

export type MengenConfig = z.infer<typeof mengenConfigSchema>;
