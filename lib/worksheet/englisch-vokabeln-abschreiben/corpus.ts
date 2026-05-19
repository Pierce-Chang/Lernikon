import type { BucketId } from "./config";

/** One vocabulary entry: English word + German translation. */
export interface VocabularyEntry {
  bucket: BucketId;
  english: string;
  german: string;
}

/**
 * Klasse 3 vocabulary corpus. 16 entries per bucket = 80 total.
 * Words are short, phonetically clear, and avoid AmE/BrE conflicts.
 * German translations may contain umlauts (rendered in Helvetica = safe).
 * English words are ASCII-only (no combining marks, no WinAnsi issues).
 */
export const VOCABULARY_CORPUS: VocabularyEntry[] = [
  // ---- Familie ----
  { bucket: "familie", english: "mother", german: "Mutter" },
  { bucket: "familie", english: "father", german: "Vater" },
  { bucket: "familie", english: "sister", german: "Schwester" },
  { bucket: "familie", english: "brother", german: "Bruder" },
  { bucket: "familie", english: "baby", german: "Baby" },
  { bucket: "familie", english: "grandma", german: "Oma" },
  { bucket: "familie", english: "grandpa", german: "Opa" },
  { bucket: "familie", english: "son", german: "Sohn" },
  { bucket: "familie", english: "daughter", german: "Tochter" },
  { bucket: "familie", english: "aunt", german: "Tante" },
  { bucket: "familie", english: "uncle", german: "Onkel" },
  { bucket: "familie", english: "cousin", german: "Cousine" },
  { bucket: "familie", english: "family", german: "Familie" },
  { bucket: "familie", english: "child", german: "Kind" },
  { bucket: "familie", english: "parent", german: "Elternteil" },
  { bucket: "familie", english: "friend", german: "Freund" },

  // ---- Tiere ----
  { bucket: "tiere", english: "dog", german: "Hund" },
  { bucket: "tiere", english: "cat", german: "Katze" },
  { bucket: "tiere", english: "bird", german: "Vogel" },
  { bucket: "tiere", english: "fish", german: "Fisch" },
  { bucket: "tiere", english: "horse", german: "Pferd" },
  { bucket: "tiere", english: "cow", german: "Kuh" },
  { bucket: "tiere", english: "pig", german: "Schwein" },
  { bucket: "tiere", english: "mouse", german: "Maus" },
  { bucket: "tiere", english: "rabbit", german: "Hase" },
  { bucket: "tiere", english: "sheep", german: "Schaf" },
  { bucket: "tiere", english: "duck", german: "Ente" },
  { bucket: "tiere", english: "frog", german: "Frosch" },
  { bucket: "tiere", english: "bear", german: "Bär" },
  { bucket: "tiere", english: "lion", german: "Löwe" },
  { bucket: "tiere", english: "monkey", german: "Affe" },
  { bucket: "tiere", english: "snake", german: "Schlange" },

  // ---- Farben ----
  { bucket: "farben", english: "red", german: "rot" },
  { bucket: "farben", english: "blue", german: "blau" },
  { bucket: "farben", english: "green", german: "grün" },
  { bucket: "farben", english: "yellow", german: "gelb" },
  { bucket: "farben", english: "black", german: "schwarz" },
  { bucket: "farben", english: "white", german: "weiß" },
  { bucket: "farben", english: "pink", german: "rosa" },
  { bucket: "farben", english: "orange", german: "orange" },
  { bucket: "farben", english: "brown", german: "braun" },
  { bucket: "farben", english: "purple", german: "lila" },
  { bucket: "farben", english: "grey", german: "grau" },
  { bucket: "farben", english: "gold", german: "golden" },
  { bucket: "farben", english: "silver", german: "silbern" },
  { bucket: "farben", english: "dark", german: "dunkel" },
  { bucket: "farben", english: "light", german: "hell" },
  { bucket: "farben", english: "bright", german: "leuchtend" },

  // ---- Zahlen ----
  { bucket: "zahlen", english: "one", german: "eins" },
  { bucket: "zahlen", english: "two", german: "zwei" },
  { bucket: "zahlen", english: "three", german: "drei" },
  { bucket: "zahlen", english: "four", german: "vier" },
  { bucket: "zahlen", english: "five", german: "fünf" },
  { bucket: "zahlen", english: "six", german: "sechs" },
  { bucket: "zahlen", english: "seven", german: "sieben" },
  { bucket: "zahlen", english: "eight", german: "acht" },
  { bucket: "zahlen", english: "nine", german: "neun" },
  { bucket: "zahlen", english: "ten", german: "zehn" },
  { bucket: "zahlen", english: "eleven", german: "elf" },
  { bucket: "zahlen", english: "twelve", german: "zwölf" },
  { bucket: "zahlen", english: "twenty", german: "zwanzig" },
  { bucket: "zahlen", english: "hundred", german: "hundert" },
  { bucket: "zahlen", english: "thousand", german: "tausend" },
  { bucket: "zahlen", english: "zero", german: "null" },

  // ---- Schule ----
  { bucket: "schule", english: "book", german: "Buch" },
  { bucket: "schule", english: "pen", german: "Stift" },
  { bucket: "schule", english: "pencil", german: "Bleistift" },
  { bucket: "schule", english: "paper", german: "Papier" },
  { bucket: "schule", english: "bag", german: "Tasche" },
  { bucket: "schule", english: "teacher", german: "Lehrer" },
  { bucket: "schule", english: "student", german: "Schüler" },
  { bucket: "schule", english: "school", german: "Schule" },
  { bucket: "schule", english: "desk", german: "Tisch" },
  { bucket: "schule", english: "chair", german: "Stuhl" },
  { bucket: "schule", english: "ruler", german: "Lineal" },
  { bucket: "schule", english: "eraser", german: "Radiergummi" },
  { bucket: "schule", english: "board", german: "Tafel" },
  { bucket: "schule", english: "lesson", german: "Stunde" },
  { bucket: "schule", english: "homework", german: "Hausaufgaben" },
  { bucket: "schule", english: "class", german: "Klasse" },
];
