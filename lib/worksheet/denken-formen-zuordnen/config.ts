/**
 * Configuration schema and constants for the "Formen zuordnen" worksheet.
 * Zod schema validates all external inputs (API body, form submissions).
 */

import { z } from "zod";

export const PAAR_COUNT_OPTIONS = [4, 6, 8] as const;
export type PaarCount = (typeof PAAR_COUNT_OPTIONS)[number];

/**
 * Pastel colour pool for left-column shapes.
 * One colour is assigned per pair; no repeats when paarCount <= 10.
 */
export const PASTELL_COLORS = [
  "#FDBA74", // Orange
  "#FECDD3", // Rosa
  "#FEF3C7", // Hellgelb
  "#C7A8E0", // Lila
  "#BAE6FD", // Hellblau
  "#D9F99D", // Grunlich
  "#FCA5A5", // Rot-Rosa
  "#FED7AA", // Pfirsich
  "#A7F3D0", // Mintgrun
  "#DDD6FE", // Lavendel
] as const;

export const formenZuordnenConfigSchema = z.object({
  paarCount: z.union([z.literal(4), z.literal(6), z.literal(8)]),
  solutions: z.boolean(),
  seed: z.number().int().optional(),
});

export type FormenZuordnenConfig = z.infer<typeof formenZuordnenConfigSchema>;
