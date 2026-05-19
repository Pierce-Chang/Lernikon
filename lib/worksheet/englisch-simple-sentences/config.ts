import { z } from "zod";

/** Discriminator ids for sentence structures. Only "to-be" ships in the first release.
 *  Extend this array when to-have / present-simple / possessive are added. */
export const STRUCT_IDS = ["to-be"] as const;
export type StructId = (typeof STRUCT_IDS)[number];

export const COUNT_OPTIONS = [10, 15, 20] as const;
export type SimpleSentencesCount = (typeof COUNT_OPTIONS)[number];

/** Zod schema for the full configuration sent to the API. */
export const englischSimpleSentencesConfigSchema = z.object({
  topic: z.literal("englisch-simple-sentences"),
  /** Number of gap-fill sentences on the worksheet. */
  count: z.union([z.literal(10), z.literal(15), z.literal(20)]).default(15),
  /** Whether to append a solutions page. */
  includeSolutions: z.boolean().default(true),
  seed: z.number().int().optional(),
});

export type EnglischSimpleSentencesConfig = z.infer<typeof englischSimpleSentencesConfigSchema>;
