/**
 * Klasse 4 Grammatik corpus for the four German cases (Fälle).
 * Each entry contains a sentence template with a single underscore placeholder,
 * the correct solution to fill in, and a helper question for the child.
 *
 * Invariant: template.match(/_+/g) matches exactly once per entry.
 * Entries use Klasse-4-appropriate vocabulary (animals, family, school, sport,
 * nature, everyday life). No en/em dashes — ASCII only.
 */

export type FallId = "nominativ" | "genitiv" | "dativ" | "akkusativ";

export interface FaelleEntry {
  /** Which case the blank tests. */
  fall: FallId;
  /** Sentence with a single underscore placeholder for the blank. */
  template: string;
  /** The correct form that fills the blank. */
  loesung: string;
  /** Helper question shown next to the sentence to guide the child. */
  frage: string;
}

// ── Nominativ ──────────────────────────────────────────────────────────────
// The subject of the sentence. Blank typically placed at the sentence start.
// Question: "wer oder was?"
const NOMINATIV_ENTRIES: readonly FaelleEntry[] = [
  {
    fall: "nominativ",
    template: "___ Hund bellt laut.",
    loesung: "Der",
    frage: "wer oder was?",
  },
  {
    fall: "nominativ",
    template: "___ Katze schläft auf dem Sofa.",
    loesung: "Die",
    frage: "wer oder was?",
  },
  {
    fall: "nominativ",
    template: "___ Kind spielt im Garten.",
    loesung: "Das",
    frage: "wer oder was?",
  },
  {
    fall: "nominativ",
    template: "___ Vogel singt ein Lied.",
    loesung: "Der",
    frage: "wer oder was?",
  },
  {
    fall: "nominativ",
    template: "___ Lehrerin erklärt die Aufgabe.",
    loesung: "Die",
    frage: "wer oder was?",
  },
  {
    fall: "nominativ",
    template: "___ Ball liegt auf dem Rasen.",
    loesung: "Der",
    frage: "wer oder was?",
  },
  {
    fall: "nominativ",
    template: "___ Sonne scheint hell.",
    loesung: "Die",
    frage: "wer oder was?",
  },
  {
    fall: "nominativ",
    template: "___ Baum ist sehr alt.",
    loesung: "Der",
    frage: "wer oder was?",
  },
  {
    fall: "nominativ",
    template: "___ Blume blüht im Frühling.",
    loesung: "Die",
    frage: "wer oder was?",
  },
  {
    fall: "nominativ",
    template: "___ Fahrrad steht vor der Schule.",
    loesung: "Das",
    frage: "wer oder was?",
  },
  {
    fall: "nominativ",
    template: "___ Junge rennt sehr schnell.",
    loesung: "Der",
    frage: "wer oder was?",
  },
  {
    fall: "nominativ",
    template: "___ Mädchen lacht herzlich.",
    loesung: "Das",
    frage: "wer oder was?",
  },
  {
    fall: "nominativ",
    template: "___ Fisch schwimmt im Teich.",
    loesung: "Der",
    frage: "wer oder was?",
  },
  {
    fall: "nominativ",
    template: "___ Wolke zieht über den Himmel.",
    loesung: "Die",
    frage: "wer oder was?",
  },
  {
    fall: "nominativ",
    template: "___ Pferd galoppiert über die Wiese.",
    loesung: "Das",
    frage: "wer oder was?",
  },
  {
    fall: "nominativ",
    template: "___ Schüler liest ein Buch.",
    loesung: "Der",
    frage: "wer oder was?",
  },
  {
    fall: "nominativ",
    template: "___ Tisch steht in der Mitte.",
    loesung: "Der",
    frage: "wer oder was?",
  },
  {
    fall: "nominativ",
    template: "___ Straße ist gesperrt.",
    loesung: "Die",
    frage: "wer oder was?",
  },
  {
    fall: "nominativ",
    template: "___ Mond scheint durch das Fenster.",
    loesung: "Der",
    frage: "wer oder was?",
  },
  {
    fall: "nominativ",
    template: "___ Apfel liegt auf dem Tisch.",
    loesung: "Der",
    frage: "wer oder was?",
  },
  {
    fall: "nominativ",
    template: "___ Buch gehört mir.",
    loesung: "Das",
    frage: "wer oder was?",
  },
  {
    fall: "nominativ",
    template: "___ Vater kocht das Mittagessen.",
    loesung: "Der",
    frage: "wer oder was?",
  },
];

// ── Genitiv ────────────────────────────────────────────────────────────────
// Shows possession or belonging. Typical constructions: "des/der + Noun".
// Question: "wessen?"
const GENITIV_ENTRIES: readonly FaelleEntry[] = [
  {
    fall: "genitiv",
    template: "Das Auto ___ Lehrers ist blau.",
    loesung: "des",
    frage: "wessen?",
  },
  {
    fall: "genitiv",
    template: "Die Farbe ___ Autos gefällt mir.",
    loesung: "des",
    frage: "wessen?",
  },
  {
    fall: "genitiv",
    template: "Das Buch ___ Lehrerin liegt auf dem Tisch.",
    loesung: "der",
    frage: "wessen?",
  },
  {
    fall: "genitiv",
    template: "Der Hals ___ Giraffe ist sehr lang.",
    loesung: "der",
    frage: "wessen?",
  },
  {
    fall: "genitiv",
    template: "Die Aufgaben ___ Schülers sind fertig.",
    loesung: "des",
    frage: "wessen?",
  },
  {
    fall: "genitiv",
    template: "Das Spielzeug ___ Kindes liegt im Zimmer.",
    loesung: "des",
    frage: "wessen?",
  },
  {
    fall: "genitiv",
    template: "Die Stimme ___ Sängerin ist wunderschön.",
    loesung: "der",
    frage: "wessen?",
  },
  {
    fall: "genitiv",
    template: "Das Fell ___ Hundes ist weich.",
    loesung: "des",
    frage: "wessen?",
  },
  {
    fall: "genitiv",
    template: "Die Blätter ___ Baumes fallen im Herbst.",
    loesung: "des",
    frage: "wessen?",
  },
  {
    fall: "genitiv",
    template: "Das Nest ___ Vogels hängt hoch oben.",
    loesung: "des",
    frage: "wessen?",
  },
  {
    fall: "genitiv",
    template: "Die Arbeit ___ Bäuerin ist hart.",
    loesung: "der",
    frage: "wessen?",
  },
  {
    fall: "genitiv",
    template: "Der Rucksack ___ Mädchens ist schwer.",
    loesung: "des",
    frage: "wessen?",
  },
  {
    fall: "genitiv",
    template: "Die Pfoten ___ Katze sind sauber.",
    loesung: "der",
    frage: "wessen?",
  },
  {
    fall: "genitiv",
    template: "Das Ergebnis ___ Aufgabe ist richtig.",
    loesung: "der",
    frage: "wessen?",
  },
  {
    fall: "genitiv",
    template: "Das Tor ___ Spielers war ein Treffer.",
    loesung: "des",
    frage: "wessen?",
  },
  {
    fall: "genitiv",
    template: "Die Mähne ___ Pferdes ist lang.",
    loesung: "des",
    frage: "wessen?",
  },
  {
    fall: "genitiv",
    template: "Die Regeln ___ Spiels sind einfach.",
    loesung: "des",
    frage: "wessen?",
  },
  {
    fall: "genitiv",
    template: "Die Jacke ___ Bruders hängt an der Tür.",
    loesung: "des",
    frage: "wessen?",
  },
  {
    fall: "genitiv",
    template: "Das Ende ___ Geschichte ist traurig.",
    loesung: "der",
    frage: "wessen?",
  },
  {
    fall: "genitiv",
    template: "Das Zimmer ___ Schwester ist aufgeräumt.",
    loesung: "der",
    frage: "wessen?",
  },
  {
    fall: "genitiv",
    template: "Die Augen ___ Eule sind groß.",
    loesung: "der",
    frage: "wessen?",
  },
  {
    fall: "genitiv",
    template: "Das Gewicht ___ Koffers überraschte uns.",
    loesung: "des",
    frage: "wessen?",
  },
];

// ── Dativ ──────────────────────────────────────────────────────────────────
// The indirect object (receiver of an action). Question: "wem?"
const DATIV_ENTRIES: readonly FaelleEntry[] = [
  {
    fall: "dativ",
    template: "Ich gebe ___ Bruder einen Apfel.",
    loesung: "meinem",
    frage: "wem?",
  },
  {
    fall: "dativ",
    template: "Sie hilft ___ Lehrerin mit den Heften.",
    loesung: "der",
    frage: "wem?",
  },
  {
    fall: "dativ",
    template: "Wir schreiben ___ Freund eine Karte.",
    loesung: "dem",
    frage: "wem?",
  },
  {
    fall: "dativ",
    template: "Er zeigt ___ Mutter das Bild.",
    loesung: "der",
    frage: "wem?",
  },
  {
    fall: "dativ",
    template: "Das Buch gehört ___ Schüler.",
    loesung: "dem",
    frage: "wem?",
  },
  {
    fall: "dativ",
    template: "Sie bringt ___ Hund sein Futter.",
    loesung: "dem",
    frage: "wem?",
  },
  {
    fall: "dativ",
    template: "Er dankt ___ Vater für die Hilfe.",
    loesung: "dem",
    frage: "wem?",
  },
  {
    fall: "dativ",
    template: "Die Lehrerin erklärt ___ Kind die Regel.",
    loesung: "dem",
    frage: "wem?",
  },
  {
    fall: "dativ",
    template: "Ich glaube ___ Freundin.",
    loesung: "der",
    frage: "wem?",
  },
  {
    fall: "dativ",
    template: "Wir geben ___ Oma Blumen.",
    loesung: "der",
    frage: "wem?",
  },
  {
    fall: "dativ",
    template: "Er leiht ___ Schwester sein Fahrrad.",
    loesung: "der",
    frage: "wem?",
  },
  {
    fall: "dativ",
    template: "Sie erklärt ___ Schüler die Aufgabe.",
    loesung: "dem",
    frage: "wem?",
  },
  {
    fall: "dativ",
    template: "Das Mädchen winkt ___ Vater.",
    loesung: "dem",
    frage: "wem?",
  },
  {
    fall: "dativ",
    template: "Ich schreibe ___ Großvater einen Brief.",
    loesung: "dem",
    frage: "wem?",
  },
  {
    fall: "dativ",
    template: "Er bringt ___ Nachbarin die Post.",
    loesung: "der",
    frage: "wem?",
  },
  {
    fall: "dativ",
    template: "Sie folgt ___ Lehrer in den Klassenraum.",
    loesung: "dem",
    frage: "wem?",
  },
  {
    fall: "dativ",
    template: "Ich kaufe ___ Freund ein Geschenk.",
    loesung: "meinem",
    frage: "wem?",
  },
  {
    fall: "dativ",
    template: "Er zeigt ___ Tierarzt die Wunde.",
    loesung: "dem",
    frage: "wem?",
  },
  {
    fall: "dativ",
    template: "Wir geben ___ Hund eine Leine.",
    loesung: "dem",
    frage: "wem?",
  },
  {
    fall: "dativ",
    template: "Sie hilft ___ kleinen Bruder beim Lesen.",
    loesung: "dem",
    frage: "wem?",
  },
  {
    fall: "dativ",
    template: "Er schenkt ___ Mutter einen Blumenstrauß.",
    loesung: "seiner",
    frage: "wem?",
  },
  {
    fall: "dativ",
    template: "Die Lehrerin lobt ___ Schülerin.",
    loesung: "der",
    frage: "wem?",
  },
];

// ── Akkusativ ──────────────────────────────────────────────────────────────
// The direct object (receives the action). Question: "wen oder was?"
const AKKUSATIV_ENTRIES: readonly FaelleEntry[] = [
  {
    fall: "akkusativ",
    template: "Der Hund frisst ___ Knochen.",
    loesung: "den",
    frage: "wen oder was?",
  },
  {
    fall: "akkusativ",
    template: "Ich sehe ___ Vogel im Baum.",
    loesung: "den",
    frage: "wen oder was?",
  },
  {
    fall: "akkusativ",
    template: "Das Kind malt ___ Bild.",
    loesung: "ein",
    frage: "wen oder was?",
  },
  {
    fall: "akkusativ",
    template: "Sie liest ___ Buch.",
    loesung: "das",
    frage: "wen oder was?",
  },
  {
    fall: "akkusativ",
    template: "Er schlägt ___ Ball ins Tor.",
    loesung: "den",
    frage: "wen oder was?",
  },
  {
    fall: "akkusativ",
    template: "Wir besuchen ___ Opa am Sonntag.",
    loesung: "den",
    frage: "wen oder was?",
  },
  {
    fall: "akkusativ",
    template: "Sie kauft ___ Apfel auf dem Markt.",
    loesung: "einen",
    frage: "wen oder was?",
  },
  {
    fall: "akkusativ",
    template: "Er trägt ___ Rucksack.",
    loesung: "den",
    frage: "wen oder was?",
  },
  {
    fall: "akkusativ",
    template: "Ich kenne ___ Lehrerin schon lange.",
    loesung: "die",
    frage: "wen oder was?",
  },
  {
    fall: "akkusativ",
    template: "Das Kind streichelt ___ Katze.",
    loesung: "die",
    frage: "wen oder was?",
  },
  {
    fall: "akkusativ",
    template: "Er wirft ___ Stein ins Wasser.",
    loesung: "den",
    frage: "wen oder was?",
  },
  {
    fall: "akkusativ",
    template: "Wir essen ___ Pizza zum Abendessen.",
    loesung: "eine",
    frage: "wen oder was?",
  },
  {
    fall: "akkusativ",
    template: "Sie sucht ___ Schlüssel.",
    loesung: "den",
    frage: "wen oder was?",
  },
  {
    fall: "akkusativ",
    template: "Ich höre ___ Musik gern.",
    loesung: "die",
    frage: "wen oder was?",
  },
  {
    fall: "akkusativ",
    template: "Er malt ___ Haus.",
    loesung: "das",
    frage: "wen oder was?",
  },
  {
    fall: "akkusativ",
    template: "Die Schüler lernen ___ Gedicht auswendig.",
    loesung: "das",
    frage: "wen oder was?",
  },
  {
    fall: "akkusativ",
    template: "Er ruft ___ Freund an.",
    loesung: "seinen",
    frage: "wen oder was?",
  },
  {
    fall: "akkusativ",
    template: "Sie beobachtet ___ Schmetterling.",
    loesung: "den",
    frage: "wen oder was?",
  },
  {
    fall: "akkusativ",
    template: "Das Kind verliert ___ Handschuh.",
    loesung: "den",
    frage: "wen oder was?",
  },
  {
    fall: "akkusativ",
    template: "Er öffnet ___ Tür.",
    loesung: "die",
    frage: "wen oder was?",
  },
  {
    fall: "akkusativ",
    template: "Wir finden ___ Lösung.",
    loesung: "die",
    frage: "wen oder was?",
  },
  {
    fall: "akkusativ",
    template: "Sie pflegt ___ kranken Hund.",
    loesung: "den",
    frage: "wen oder was?",
  },
];

/** The full corpus, all four cases combined. */
export const FAELLE_CORPUS: readonly FaelleEntry[] = [
  ...NOMINATIV_ENTRIES,
  ...GENITIV_ENTRIES,
  ...DATIV_ENTRIES,
  ...AKKUSATIV_ENTRIES,
];

/** Per-fall corpus slices for filtered generation. */
export const corpusForFall = (fall: FallId): readonly FaelleEntry[] =>
  FAELLE_CORPUS.filter((e) => e.fall === fall);

// Exported counts for tests.
export const NOMINATIV_COUNT = NOMINATIV_ENTRIES.length;
export const GENITIV_COUNT = GENITIV_ENTRIES.length;
export const DATIV_COUNT = DATIV_ENTRIES.length;
export const AKKUSATIV_COUNT = AKKUSATIV_ENTRIES.length;
