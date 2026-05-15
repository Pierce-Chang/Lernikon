import { z } from "zod";

export const COUNT_OPTIONS = [5, 8, 12] as const;
export type DiktatCount = (typeof COUNT_OPTIONS)[number];

export const DiktatConfigSchema = z.object({
  klasse: z.literal(2),
  count: z.union([z.literal(5), z.literal(8), z.literal(12)]),
  seed: z.number().int().optional(),
});

export type DiktatConfig = z.infer<typeof DiktatConfigSchema>;
