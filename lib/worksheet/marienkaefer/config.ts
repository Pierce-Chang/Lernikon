import { z } from "zod";

/** Valid task counts for the Marienkaefer worksheet. */
export const COUNT_OPTIONS = [6, 10] as const;
export type CountOption = (typeof COUNT_OPTIONS)[number];

/**
 * Zod schema for the Marienkaefer generator config.
 * count=6: 6 distinct numbers from [1..10].
 * count=10: all 10 numbers from [1..10] shuffled.
 */
export const marienkaeferConfigSchema = z.object({
  topic: z.literal("mathe-marienkaefer"),
  count: z.union([z.literal(6), z.literal(10)]).default(10),
  seed: z.number().int().optional(),
});

export type MarienkaeferConfig = z.infer<typeof marienkaeferConfigSchema>;
