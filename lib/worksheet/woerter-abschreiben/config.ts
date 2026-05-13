import { z } from "zod";

export const KLASSE_OPTIONS = [1, 2] as const;
export type Klasse = (typeof KLASSE_OPTIONS)[number];

export const COUNT_OPTIONS = [5, 8, 10] as const;
export type Count = (typeof COUNT_OPTIONS)[number];

export const LINES_PER_WORD_OPTIONS = [1, 2, 3] as const;
export type LinesPerWord = (typeof LINES_PER_WORD_OPTIONS)[number];

// Schreibschrift uses Playwrite DE SAS. In the PDF renderer, full SAS words
// are drawn as vector outlines because React-PDF drops some word-initial
// contextual glyphs when it renders this font as normal text.
export const STYLE_OPTIONS = ["druck", "schreib"] as const;
export type LetterStyle = (typeof STYLE_OPTIONS)[number];

export const STYLE_LABELS: Record<LetterStyle, string> = {
  druck: "Druckschrift",
  schreib: "Schreibschrift",
};

export const STYLE_HINTS: Record<LetterStyle, string> = {
  druck: "Vorschule / 1. Klasse",
  schreib: "Ab 2. Klasse",
};

export const WoerterConfigSchema = z.object({
  klasse: z.union([z.literal(1), z.literal(2)]),
  count: z.union([z.literal(5), z.literal(8), z.literal(10)]),
  linesPerWord: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  style: z.enum(STYLE_OPTIONS),
  seed: z.number().int().optional(),
});

export type WoerterConfig = z.infer<typeof WoerterConfigSchema>;
