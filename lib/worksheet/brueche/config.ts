import { z } from "zod";

export const MODUS_OPTIONS = ["darstellen", "vergleichen", "rechnen"] as const;
export type BruecheModus = (typeof MODUS_OPTIONS)[number];

export const COUNT_OPTIONS = [6, 12, 18] as const;
export type BruecheCount = (typeof COUNT_OPTIONS)[number];

export const bruecheConfigSchema = z.object({
  modus: z.enum(["darstellen", "vergleichen", "rechnen"]),
  count: z.union([z.literal(6), z.literal(12), z.literal(18)]),
  solutions: z.boolean(),
  seed: z.number().int().optional(),
});

export type BruecheConfig = z.infer<typeof bruecheConfigSchema>;

/** Human-readable label per modus, used in UI pills. */
export const MODUS_LABELS: Record<BruecheModus, string> = {
  darstellen: "Darstellen",
  vergleichen: "Vergleichen",
  rechnen: "Rechnen",
};

/** Subtitle shown in the PDF under the title, per modus. */
export const MODUS_SUBTITLES: Record<BruecheModus, string> = {
  darstellen: "Schreibe den Bruch zur Darstellung.",
  vergleichen: "Vergleiche die Bruche: <, > oder =.",
  rechnen: "Rechne mit gleichem Nenner.",
};
