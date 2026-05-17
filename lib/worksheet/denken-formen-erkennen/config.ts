/**
 * Configuration schema and constants for the "Formen erkennen" worksheet.
 * Zod schema validates all external inputs (API body, form submissions).
 */

import { z } from "zod";
import { SHAPE_IDS, SHAPE_LABELS } from "./shapes";

export { SHAPE_IDS, SHAPE_LABELS };
export type { ShapeId } from "./shapes";

export const TOTAL_COUNT_OPTIONS = [12, 18] as const;
export type TotalCount = (typeof TOTAL_COUNT_OPTIONS)[number];

export const SCHWIERIGKEIT_OPTIONS = ["einfach", "mittel"] as const;
export type Schwierigkeit = (typeof SCHWIERIGKEIT_OPTIONS)[number];

export const SCHWIERIGKEIT_LABELS: Record<Schwierigkeit, string> = {
  einfach: "Einfach",
  mittel: "Mittel",
};

export const formenErkennenConfigSchema = z.object({
  zielForm: z.enum(SHAPE_IDS),
  totalCount: z.union([z.literal(12), z.literal(18)]),
  schwierigkeit: z.enum(SCHWIERIGKEIT_OPTIONS),
  solutions: z.boolean(),
  seed: z.number().int().optional(),
});

export type FormenErkennenConfig = z.infer<typeof formenErkennenConfigSchema>;
