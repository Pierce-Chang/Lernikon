import { z } from "zod";

export const COUNT_OPTIONS = [10, 15, 20] as const;
export type WortartenCount = (typeof COUNT_OPTIONS)[number];

export const wortartenConfigSchema = z.object({
  klasse: z.literal(2),
  count: z.union([z.literal(10), z.literal(15), z.literal(20)]),
  solutions: z.boolean(),
  seed: z.number().int().optional(),
});

export type WortartenConfig = z.infer<typeof wortartenConfigSchema>;
