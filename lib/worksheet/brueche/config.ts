import { z } from "zod";

export const MODUS_OPTIONS = ["darstellen", "vergleichen", "rechnen"] as const;
export type BruecheModus = (typeof MODUS_OPTIONS)[number];

/** Count options for the "darstellen" modus (shapes are large, limited packing). */
export const COUNT_OPTIONS_DARSTELLEN = [6, 12, 18] as const;
/** Count options for "vergleichen" and "rechnen" modus (2-up grid fits denser). */
export const COUNT_OPTIONS_VERGLEICHEN_RECHNEN = [6, 14, 24] as const;

export type BruecheCount = 6 | 12 | 14 | 18 | 24;

export const bruecheConfigSchema = z
  .object({
    modus: z.enum(["darstellen", "vergleichen", "rechnen"]),
    count: z.union([
      z.literal(6),
      z.literal(12),
      z.literal(14),
      z.literal(18),
      z.literal(24),
    ]),
    solutions: z.boolean(),
    seed: z.number().int().optional(),
  })
  .superRefine((data, ctx) => {
    const valid: readonly number[] =
      data.modus === "darstellen"
        ? COUNT_OPTIONS_DARSTELLEN
        : COUNT_OPTIONS_VERGLEICHEN_RECHNEN;
    if (!valid.includes(data.count)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["count"],
        message: `count ${data.count} ist für modus ${data.modus} nicht erlaubt`,
      });
    }
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
