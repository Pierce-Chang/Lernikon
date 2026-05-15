import { z } from "zod";
import type { RuleId } from "./corpus";

export const RULE_OPTIONS = ["ie-i", "ss-sz", "doppelkons", "endung", "gemischt"] as const;
export type RechtschreibRule = (typeof RULE_OPTIONS)[number];

export const COUNT_OPTIONS = [10, 15, 20] as const;
export type RechtschreibCount = (typeof COUNT_OPTIONS)[number];

export const rechtschreibungConfigSchema = z.object({
  klasse: z.literal(3),
  rule: z.enum(["ie-i", "ss-sz", "doppelkons", "endung", "gemischt"]),
  count: z.union([z.literal(10), z.literal(15), z.literal(20)]),
  solutions: z.boolean(),
  seed: z.number().int().optional(),
});

export type RechtschreibungConfig = z.infer<typeof rechtschreibungConfigSchema>;

/** Sentinel string used as the blank placeholder inside template strings. */
export const BLANK_PLACEHOLDER = "___";

/** One-line subtitle shown under the title on both PDF pages. */
export const RULE_SUBTITLES: Record<RechtschreibRule, string> = {
  "ie-i": "Schreibe ie, i oder ih.",
  "ss-sz": "Schreibe ss oder ß.",
  doppelkons: "Doppelkonsonanten ergänzen.",
  endung: "Wortendung ergänzen.",
  gemischt: "Verschiedene Regeln gemischt.",
};

/** Short pill labels used in the UI config form. */
export const RULE_LABELS: Record<RechtschreibRule, string> = {
  "ie-i": "ie, i oder ih?",
  "ss-sz": "ss oder ß?",
  doppelkons: "Doppelkonsonanten",
  endung: "Wortendungen",
  gemischt: "Gemischt",
};

/** The four concrete rule IDs that make up the gemischt mix. */
export const BASE_RULES: readonly RuleId[] = ["ie-i", "ss-sz", "doppelkons", "endung"];
