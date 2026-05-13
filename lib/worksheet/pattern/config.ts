import { z } from "zod";

/**
 * ASCII-safe IDs for each kawaii shape. The display label and the
 * actual filename (which may contain umlauts) are mapped separately below.
 */
export const SHAPE_IDS = [
  "kreis",
  "dreieck",
  "viereck",
  "rechteck",
  "raute",
  "fuenfeck",
  "sechseck",
  "stern",
] as const;

export type ShapeId = (typeof SHAPE_IDS)[number];

/** German display labels shown in the form chips. */
export const SHAPE_LABELS: Record<ShapeId, string> = {
  kreis: "Kreis",
  dreieck: "Dreieck",
  viereck: "Viereck",
  rechteck: "Rechteck",
  raute: "Raute",
  fuenfeck: "Fünfeck",
  sechseck: "Sechseck",
  stern: "Stern",
};

/**
 * Filenames under `public/geometrics/`. Filenames contain umlauts — Windows
 * handles them fine; keep as-is to match the assets on disk.
 */
export const SHAPE_FILENAMES: Record<ShapeId, string> = {
  kreis: "kreis_gelb.png",
  dreieck: "dreieck_grün.png",
  viereck: "viereck_grün.png",
  rechteck: "rechteck_blau.png",
  raute: "raute_blau.png",
  fuenfeck: "fünfteck_rot.png",
  sechseck: "sechseck_rot.png",
  stern: "stern_gelb.png",
};

export const DIFFICULTY_IDS = ["abab", "abcabc", "abbabb", "gemischt"] as const;
export type Difficulty = (typeof DIFFICULTY_IDS)[number];

/** The three concrete sub-difficulties that gemischt draws from at row level. */
export const PURE_DIFFICULTY_IDS = ["abab", "abcabc", "abbabb"] as const;
export type PureDifficulty = (typeof PURE_DIFFICULTY_IDS)[number];

/**
 * Number of distinct shapes required in the repeating unit per difficulty.
 * `gemischt` is handled at row level by the generator and is intentionally
 * absent from this map — each row picks a sub-difficulty and looks up its
 * arity independently.
 */
export const DIFFICULTY_ARITY: Record<PureDifficulty, number> = {
  abab: 2,
  abcabc: 3,
  abbabb: 2,
};

/** German labels for the difficulty radio cards. */
export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  abab: "ABAB",
  abcabc: "ABCABC",
  abbabb: "ABBABB",
  gemischt: "Gemischt",
};

/** Short example strings shown inside the radio cards (using unicode shapes). */
export const DIFFICULTY_EXAMPLES: Record<Difficulty, string> = {
  abab: "●▲●▲",
  abcabc: "●▲■●▲■",
  abbabb: "●▲▲●▲▲",
  gemischt: "●▲●▲ · ●▲■",
};

/**
 * How many trailing positions are left blank per difficulty.
 * `gemischt` is handled at row level by the generator and is intentionally
 * absent from this map — each row picks a sub-difficulty and looks up its
 * blank count independently.
 */
export const DIFFICULTY_BLANK_COUNT: Record<PureDifficulty, number> = {
  abab: 2,
  abcabc: 3,
  abbabb: 2,
};

export const ROW_COUNT_OPTIONS = [4, 5, 6] as const;
export type RowCount = (typeof ROW_COUNT_OPTIONS)[number];

export const ITEMS_PER_ROW_OPTIONS = [6, 8] as const;
export type ItemsPerRow = (typeof ITEMS_PER_ROW_OPTIONS)[number];

export const PATTERN_MODE_IDS = ["fill", "cutout"] as const;
export type PatternMode = (typeof PATTERN_MODE_IDS)[number];

/** German labels for the mode radio cards. */
export const PATTERN_MODE_LABELS: Record<PatternMode, string> = {
  fill: "Eintragen",
  cutout: "Ausschneiden und aufkleben",
};

/** Helper text shown under each mode radio option. */
export const PATTERN_MODE_DESCRIPTIONS: Record<PatternMode, string> = {
  fill: "Kinder zeichnen die fehlenden Formen in die leeren Kästchen.",
  cutout: "Kinder schneiden Formen unten aus und kleben sie in die Lücken.",
};

export const PatternConfigSchema = z.object({
  shapes: z
    .array(z.enum(SHAPE_IDS))
    .min(2, "Mindestens 2 Formen auswählen.")
    .max(8),
  difficulty: z.enum(DIFFICULTY_IDS),
  rowCount: z.union([z.literal(4), z.literal(5), z.literal(6)]),
  itemsPerRow: z.union([z.literal(6), z.literal(8)]),
  mode: z.enum(PATTERN_MODE_IDS).default("fill"),
  includeSolutions: z.boolean().default(true),
});

export type PatternConfig = z.infer<typeof PatternConfigSchema>;
