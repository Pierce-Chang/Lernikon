import { z } from "zod";

/** The five vocabulary theme buckets available in this topic. */
export const BUCKET_IDS = [
  "familie",
  "tiere",
  "farben",
  "zahlen",
  "schule",
] as const;
export type BucketId = (typeof BUCKET_IDS)[number];

/** German UI labels for each bucket. */
export const BUCKET_LABELS: Record<BucketId, string> = {
  familie: "Familie",
  tiere: "Tiere",
  farben: "Farben",
  zahlen: "Zahlen",
  schule: "Schule",
};

/** Zod schema for the full configuration sent to the API. */
export const vokabelnConfigSchema = z.object({
  buckets: z.array(z.enum(BUCKET_IDS)).min(1).max(BUCKET_IDS.length),
  count: z.union([z.literal(5), z.literal(8), z.literal(10)]),
  linesPerWord: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  seed: z.number().int().optional(),
});

export type VokabelnConfig = z.infer<typeof vokabelnConfigSchema>;
