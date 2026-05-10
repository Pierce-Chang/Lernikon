import { z } from "zod";

export const OPERATIONS = ["addition", "subtraktion"] as const;
export type Operation = (typeof OPERATIONS)[number];

export const EXERCISE_COUNTS = [5, 10, 15, 20] as const;
export type ExerciseCount = (typeof EXERCISE_COUNTS)[number];

export const SUBJECTS = ["mathe"] as const;
export type Subject = (typeof SUBJECTS)[number];

export const worksheetConfigSchema = z
  .object({
    subject: z.enum(SUBJECTS),
    operation: z.enum(OPERATIONS),
    rangeMin: z.number().int().min(1).max(100),
    rangeMax: z.number().int().min(1).max(100),
    count: z.union([z.literal(5), z.literal(10), z.literal(15), z.literal(20)]),
    seed: z.number().int().optional(),
  })
  .refine((value) => value.rangeMax >= value.rangeMin, {
    message: "rangeMax must be ≥ rangeMin",
    path: ["rangeMax"],
  });

export type WorksheetConfig = z.infer<typeof worksheetConfigSchema>;
