import { z } from "zod";

/**
 * Math-Rechnen topic config. Each topic has its own config schema; the
 * topic itself is dispatched on the request body's `topic` field (see
 * `app/api/worksheet/generate/route.ts`).
 */

export const OPERATIONS = ["addition", "subtraktion", "gemischt"] as const;
export type Operation = (typeof OPERATIONS)[number];

export const operationLabel = (op: Operation): string => {
  switch (op) {
    case "addition":
      return "Addition";
    case "subtraktion":
      return "Subtraktion";
    case "gemischt":
      return "Addition + Subtraktion";
  }
};

// Counts chosen so the grid stays symmetric on a single page:
//   8 / 12 / 16 / 20 → 2 columns (4 / 6 / 8 / 10 rows)
//   24             → 3 columns (8 rows), text shrinks slightly to fit
export const EXERCISE_COUNTS = [8, 12, 16, 20, 24] as const;
export type ExerciseCount = (typeof EXERCISE_COUNTS)[number];

export const mathRechnenConfigSchema = z
  .object({
    operation: z.enum(OPERATIONS),
    rangeMin: z.number().int().min(1).max(100),
    rangeMax: z.number().int().min(1).max(100),
    count: z.union([
      z.literal(8),
      z.literal(12),
      z.literal(16),
      z.literal(20),
      z.literal(24),
    ]),
    includeSolutions: z.boolean().default(true),
    seed: z.number().int().optional(),
  })
  .refine((value) => value.rangeMax >= value.rangeMin, {
    message: "rangeMax must be ≥ rangeMin",
    path: ["rangeMax"],
  });

export type MathRechnenConfig = z.infer<typeof mathRechnenConfigSchema>;
