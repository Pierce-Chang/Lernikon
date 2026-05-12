import { z } from "zod";

export const DIGITS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"] as const;
export type Digit = (typeof DIGITS)[number];

export const LINES_PER_DIGIT_OPTIONS = [1, 2, 3, 4] as const;
export type LinesPerDigit = (typeof LINES_PER_DIGIT_OPTIONS)[number];

export const numberTracingConfigSchema = z.object({
  digits: z
    .array(z.enum(DIGITS))
    .min(1, "Mindestens eine Ziffer.")
    .max(10, "Maximal 10 Ziffern pro Blatt."),
  linesPerDigit: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
});

export type NumberTracingConfig = z.infer<typeof numberTracingConfigSchema>;
