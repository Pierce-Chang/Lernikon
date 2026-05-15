/**
 * Klasse 3 Rechtschreibung word corpus.
 * Each entry pairs a correctly spelled word with the blank substring the child must fill in.
 * Invariant: blank appears exactly once in word (word.indexOf(blank) === word.lastIndexOf(blank)).
 * Words where the target substring appears more than once are excluded.
 */

export type RuleId = "ie-i" | "ss-sz" | "doppelkons" | "endung";

export interface RechtschreibEntry {
  rule: RuleId;
  /** Fully correct spelling. */
  word: string;
  /** The substring the child must write into the blank. */
  blank: string;
}

// ── ie / i / ih ──────────────────────────────────────────────────────────────
// Focus: the long-i sound can be spelled as ie, plain i (open syllable loanwords),
// or ih (pronominal forms). Kids must learn which spelling applies.
// Mix: ~50% ie, ~40% i, ~10% ih.
// blank is exactly the substring as it appears in word.
const IE_I_ENTRIES: readonly RechtschreibEntry[] = [
  // ie — long-i written as digraph (native German words)
  { rule: "ie-i", word: "Liebe", blank: "ie" },
  { rule: "ie-i", word: "Tier", blank: "ie" },
  { rule: "ie-i", word: "Biene", blank: "ie" },
  { rule: "ie-i", word: "Wiese", blank: "ie" },
  { rule: "ie-i", word: "Riese", blank: "ie" },
  { rule: "ie-i", word: "Sieger", blank: "ie" },
  { rule: "ie-i", word: "Lied", blank: "ie" },
  { rule: "ie-i", word: "Brief", blank: "ie" },
  { rule: "ie-i", word: "Knie", blank: "ie" },
  { rule: "ie-i", word: "Ziege", blank: "ie" },
  { rule: "ie-i", word: "Dieb", blank: "ie" },
  { rule: "ie-i", word: "riechen", blank: "ie" },
  { rule: "ie-i", word: "Spiegel", blank: "ie" },
  { rule: "ie-i", word: "Niete", blank: "ie" },
  { rule: "ie-i", word: "viele", blank: "ie" },
  { rule: "ie-i", word: "Niere", blank: "ie" },
  // i — long-i in open syllable (mostly loanwords, not spelled ie)
  { rule: "ie-i", word: "Tiger", blank: "i" },
  { rule: "ie-i", word: "Pilot", blank: "i" },
  { rule: "ie-i", word: "Kino", blank: "i" },
  { rule: "ie-i", word: "Mine", blank: "i" },
  { rule: "ie-i", word: "Sirup", blank: "i" },
  { rule: "ie-i", word: "Turnier", blank: "i" },
  { rule: "ie-i", word: "Papier", blank: "i" },
  { rule: "ie-i", word: "Fibel", blank: "i" },
  { rule: "ie-i", word: "Klima", blank: "i" },
  { rule: "ie-i", word: "Bibel", blank: "i" },
  { rule: "ie-i", word: "Krise", blank: "i" },
  { rule: "ie-i", word: "Ninja", blank: "i" },
  // ih — long-i in pronominal forms
  { rule: "ie-i", word: "ihm", blank: "ih" },
  { rule: "ie-i", word: "ihn", blank: "ih" },
  { rule: "ie-i", word: "ihr", blank: "ih" },
] as const;

// ── ss / ß ───────────────────────────────────────────────────────────────────
// Rule: ss after short vowel, ß after long vowel or diphthong.
const SS_SZ_ENTRIES: readonly RechtschreibEntry[] = [
  // ss — short vowel before the double consonant
  { rule: "ss-sz", word: "Wasser", blank: "ss" },
  { rule: "ss-sz", word: "lassen", blank: "ss" },
  { rule: "ss-sz", word: "essen", blank: "ss" },
  { rule: "ss-sz", word: "Kasse", blank: "ss" },
  { rule: "ss-sz", word: "Tasse", blank: "ss" },
  { rule: "ss-sz", word: "Fluss", blank: "ss" },
  { rule: "ss-sz", word: "Kissen", blank: "ss" },
  { rule: "ss-sz", word: "besser", blank: "ss" },
  { rule: "ss-sz", word: "Messer", blank: "ss" },
  { rule: "ss-sz", word: "Nuss", blank: "ss" },
  { rule: "ss-sz", word: "Schloss", blank: "ss" },
  { rule: "ss-sz", word: "Bissen", blank: "ss" },
  // ß — long vowel or diphthong before the letter
  { rule: "ss-sz", word: "Straße", blank: "ß" },
  { rule: "ss-sz", word: "Fuß", blank: "ß" },
  { rule: "ss-sz", word: "groß", blank: "ß" },
  { rule: "ss-sz", word: "heißen", blank: "ß" },
  { rule: "ss-sz", word: "Grüße", blank: "ß" },
  { rule: "ss-sz", word: "Maße", blank: "ß" },
  { rule: "ss-sz", word: "beißen", blank: "ß" },
  { rule: "ss-sz", word: "Stoß", blank: "ß" },
  { rule: "ss-sz", word: "Strauß", blank: "ß" },
  { rule: "ss-sz", word: "Spaß", blank: "ß" },
] as const;

// ── Doppelkonsonanten ────────────────────────────────────────────────────────
// Doubles: nn, ll, tt, mm, ff, pp, rr, ck, gg.
const DOPPELKONS_ENTRIES: readonly RechtschreibEntry[] = [
  // nn
  { rule: "doppelkons", word: "Sonne", blank: "nn" },
  { rule: "doppelkons", word: "rennen", blank: "nn" },
  { rule: "doppelkons", word: "kennen", blank: "nn" },
  { rule: "doppelkons", word: "Tonne", blank: "nn" },
  { rule: "doppelkons", word: "Wanne", blank: "nn" },
  // ll
  { rule: "doppelkons", word: "Wolle", blank: "ll" },
  { rule: "doppelkons", word: "stellen", blank: "ll" },
  { rule: "doppelkons", word: "wollen", blank: "ll" },
  { rule: "doppelkons", word: "Halle", blank: "ll" },
  // tt
  { rule: "doppelkons", word: "Butter", blank: "tt" },
  { rule: "doppelkons", word: "Mitte", blank: "tt" },
  { rule: "doppelkons", word: "Bett", blank: "tt" },
  { rule: "doppelkons", word: "bitten", blank: "tt" },
  // mm
  { rule: "doppelkons", word: "kommen", blank: "mm" },
  { rule: "doppelkons", word: "Hammer", blank: "mm" },
  { rule: "doppelkons", word: "schwimmen", blank: "mm" },
  // ff
  { rule: "doppelkons", word: "Affe", blank: "ff" },
  { rule: "doppelkons", word: "hoffen", blank: "ff" },
  { rule: "doppelkons", word: "treffen", blank: "ff" },
  // pp
  { rule: "doppelkons", word: "Puppe", blank: "pp" },
  { rule: "doppelkons", word: "tippen", blank: "pp" },
  // ck
  { rule: "doppelkons", word: "Zucker", blank: "ck" },
  { rule: "doppelkons", word: "Jacke", blank: "ck" },
  { rule: "doppelkons", word: "wecken", blank: "ck" },
  { rule: "doppelkons", word: "drucken", blank: "ck" },
  // rr
  { rule: "doppelkons", word: "Karre", blank: "rr" },
  { rule: "doppelkons", word: "irren", blank: "rr" },
  // gg
  { rule: "doppelkons", word: "Egge", blank: "gg" },
  { rule: "doppelkons", word: "Roggen", blank: "gg" },
] as const;

// ── Wortendungen (-ig / -lich / -isch / -ich) ─────────────────────────────
const ENDUNG_ENTRIES: readonly RechtschreibEntry[] = [
  // -ig
  { rule: "endung", word: "lustig", blank: "ig" },
  { rule: "endung", word: "mutig", blank: "ig" },
  { rule: "endung", word: "fertig", blank: "ig" },
  { rule: "endung", word: "richtig", blank: "ig" },
  { rule: "endung", word: "ruhig", blank: "ig" },
  { rule: "endung", word: "nötig", blank: "ig" },
  // -lich
  { rule: "endung", word: "freundlich", blank: "lich" },
  { rule: "endung", word: "herrlich", blank: "lich" },
  { rule: "endung", word: "wirklich", blank: "lich" },
  { rule: "endung", word: "täglich", blank: "lich" },
  { rule: "endung", word: "möglich", blank: "lich" },
  { rule: "endung", word: "endlich", blank: "lich" },
  // -isch
  { rule: "endung", word: "kindisch", blank: "isch" },
  { rule: "endung", word: "frisch", blank: "isch" },
  { rule: "endung", word: "komisch", blank: "isch" },
  { rule: "endung", word: "typisch", blank: "isch" },
  { rule: "endung", word: "praktisch", blank: "isch" },
  { rule: "endung", word: "heimisch", blank: "isch" },
  // -ich
  { rule: "endung", word: "mich", blank: "ich" },
  { rule: "endung", word: "dich", blank: "ich" },
  { rule: "endung", word: "sich", blank: "ich" },
  { rule: "endung", word: "fröhlich", blank: "lich" },
  { rule: "endung", word: "ärgerlich", blank: "lich" },
  { rule: "endung", word: "weiblich", blank: "lich" },
] as const;

/** Full corpus, all rules combined. */
export const RECHTSCHREIB_CORPUS: readonly RechtschreibEntry[] = [
  ...IE_I_ENTRIES,
  ...SS_SZ_ENTRIES,
  ...DOPPELKONS_ENTRIES,
  ...ENDUNG_ENTRIES,
];

/** Entries for one specific rule. */
export const corpusForRule = (rule: RuleId): readonly RechtschreibEntry[] =>
  RECHTSCHREIB_CORPUS.filter((e) => e.rule === rule);

/** Count of entries per rule — exported for vitest. */
export const IE_I_COUNT = IE_I_ENTRIES.length,
  SS_SZ_COUNT = SS_SZ_ENTRIES.length,
  DOPPELKONS_COUNT = DOPPELKONS_ENTRIES.length,
  ENDUNG_COUNT = ENDUNG_ENTRIES.length;
