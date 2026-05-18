import { z } from "zod";
import type { FallId } from "./corpus";

export const FALL_IDS = ["nominativ", "genitiv", "dativ", "akkusativ"] as const;
export type FallIdTuple = typeof FALL_IDS;

/** Human-readable labels with the helper question for each case. */
export const FALL_LABELS: Record<FallId, string> = {
  nominativ: "Nominativ (wer/was?)",
  genitiv: "Genitiv (wessen?)",
  dativ: "Dativ (wem?)",
  akkusativ: "Akkusativ (wen/was?)",
};

/** Short pill labels used in the UI config form. */
export const FALL_PILL_LABELS: Record<FallId, string> = {
  nominativ: "Nominativ",
  genitiv: "Genitiv",
  dativ: "Dativ",
  akkusativ: "Akkusativ",
};

export const MODE_IDS = [
  "nominativ",
  "genitiv",
  "dativ",
  "akkusativ",
  "gemischt",
] as const;
export type FaelleMode = (typeof MODE_IDS)[number];

/** Short pill labels for the mode selector. */
export const MODE_LABELS: Record<FaelleMode, string> = {
  nominativ: "Nominativ",
  genitiv: "Genitiv",
  dativ: "Dativ",
  akkusativ: "Akkusativ",
  gemischt: "Gemischt",
};

export const COUNT_OPTIONS = [10, 15, 20] as const;
export type FaelleCount = (typeof COUNT_OPTIONS)[number];

/** Subtitle shown under the title on both PDF pages. */
export const MODE_SUBTITLES: Record<FaelleMode, string> = {
  nominativ: "Nominativ - wer oder was?",
  genitiv: "Genitiv - wessen?",
  dativ: "Dativ - wem?",
  akkusativ: "Akkusativ - wen oder was?",
  gemischt: "Alle vier Fälle gemischt.",
};

export const faelleConfigSchema = z.object({
  topic: z.literal("deutsch-faelle"),
  mode: z.enum(MODE_IDS).default("gemischt"),
  count: z.union([z.literal(10), z.literal(15), z.literal(20)]).default(15),
  showSolutions: z.boolean().default(true),
  seed: z.number().int().optional(),
});

export type FaelleConfig = z.infer<typeof faelleConfigSchema>;
