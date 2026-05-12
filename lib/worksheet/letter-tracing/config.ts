import { z } from "zod";

export const LETTER_CASES = ["upper", "lower", "both"] as const;
export type LetterCase = (typeof LETTER_CASES)[number];

export const LETTER_CASE_LABELS: Record<LetterCase, string> = {
  upper: "Großbuchstaben",
  lower: "Kleinbuchstaben",
  both: "Groß + Klein",
};

export const LETTER_STYLES = ["druck", "schreib"] as const;
export type LetterStyle = (typeof LETTER_STYLES)[number];

export const LETTER_STYLE_LABELS: Record<LetterStyle, string> = {
  druck: "Druckschrift",
  schreib: "Schreibschrift",
};

export const LETTER_STYLE_HINTS: Record<LetterStyle, string> = {
  druck: "Vorschule / 1. Klasse",
  schreib: "Ab 2. Klasse",
};

export const LINES_PER_LETTER = [1, 2, 3, 4] as const;
export type LinesPerLetter = (typeof LINES_PER_LETTER)[number];

/**
 * Buchstaben-Auswahl: nur Latin A–Z für v1. Umlaute (Ä/Ö/Ü/ß) kommen, wenn der
 * erste Lernzyklus läuft — bewusst klein gehalten.
 */
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
export const AVAILABLE_LETTERS = ALPHABET.split("");

export const letterTracingConfigSchema = z.object({
  letters: z
    .array(z.string().length(1).regex(/^[A-Z]$/, "Nur A bis Z erlaubt."))
    .min(1, "Mindestens ein Buchstabe.")
    .max(10, "Maximal 10 Buchstaben pro Blatt."),
  case: z.enum(LETTER_CASES),
  linesPerLetter: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
  style: z.enum(LETTER_STYLES).default("druck"),
});

export type LetterTracingConfig = z.infer<typeof letterTracingConfigSchema>;
