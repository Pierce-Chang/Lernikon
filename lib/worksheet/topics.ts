/**
 * Topic registry — the source of truth for which exercise types Lernikon
 * supports. Each entry binds a `TopicId` to a subject, a UI label, a route,
 * and the set of grades it is offered for.
 *
 * To add a topic:
 *   1. Add an entry below.
 *   2. Implement its config schema + generator + PDF renderer.
 *   3. Add a case to the dispatcher in `app/api/worksheet/generate/route.ts`.
 *   4. Add the route page under `app/app/<subject>/<short-slug>/page.tsx`.
 */

/**
 * Coverage-Matrix (Stand: wird bei jedem neuen Topic manuell mitgepflegt).
 *
 * Legende: [*] = comingSoon / noch nicht implementiert
 *
 *            | Vorschule          | Klasse 1         | Klasse 2              | Klasse 3                   | Klasse 4                         |
 * -----------|--------------------|------------------|-----------------------|----------------------------|----------------------------------|
 * Mathe      | Zahlen schreiben   | Rechnen (+ -)    | Rechnen (+ -)         | Rechnen (+ -), Einmaleins  | Rechnen (+ -), Schriftlich,      |
 *            | Mengen 1-10 [*]    |                  |                       |                            | Brüche, Schriftliche Mul         |
 * -----------|--------------------|------------------|-----------------------|----------------------------|----------------------------------|
 * Deutsch    | Buchst. schreiben  | Buchst. schreib. | Buchst. schreiben,    | Rechtschreibung            | -                                |
 *            |                    | Wörter abschr.   | Wörter abschreiben,   |                            |                                  |
 *            |                    |                  | Diktat, Wortarten     |                            |                                  |
 * -----------|--------------------|------------------|-----------------------|----------------------------|----------------------------------|
 * Denken     | Muster fortsetzen  | -                | -                     | -                          | -                                |
 *
 * Echte Lücken (kein comingSoon, einfach nicht da):
 *   - Mathe Klasse 1-4: Zehnerübergang als eigener didaktischer Fokus
 *   - Mathe Klasse 4: schriftliche Division
 *   - Mathe Klasse 4: Bruchrechnen mit ungleichen Nennern, Dezimalzahlen
 *   - Deutsch Klasse 2: Lückendiktat
 *   - Deutsch Klasse 3: Leseverstehen
 *   - Deutsch Klasse 4: komplett ohne Topic
 *   - Denken Klasse 1-4: Zahlen-Reihen-Fortsetzung, Logik-Rätsel
 *
 * Wenn du ein Topic hinzufügst oder entfernst, MUSS diese Matrix manuell
 * mitgepflegt werden. Drift ist nicht akzeptabel.
 */

export const TOPIC_IDS = [
  "mathe-rechnen",
  "mathe-zahlen-schreiben",
  "mathe-mengen",
  "mathe-einmaleins",
  "mathe-schriftlich",
  "mathe-brueche",
  "mathe-multiplikation",
  "deutsch-buchstaben-schreiben",
  "deutsch-woerter-abschreiben",
  "deutsch-diktate",
  "deutsch-rechtschreibung",
  "deutsch-wortarten",
  "denken-muster",
] as const;

export type TopicId = (typeof TOPIC_IDS)[number];

export const SUBJECT_IDS = ["mathe", "deutsch", "denken"] as const;
export type SubjectId = (typeof SUBJECT_IDS)[number];

export const SUBJECT_LABELS: Record<SubjectId, string> = {
  mathe: "Mathe",
  deutsch: "Deutsch",
  denken: "Denken",
};

/**
 * Default brand color per subject. Used as the pill tint in the dashboard
 * catalog and anywhere else we visually group topics by Fach.
 *
 * Phase 2 plan: lift this into a per-user setting on `/app/account` because
 * each Bundesland / school often has its own Hefter-color convention.
 *
 * Reserved values for upcoming Phase 2 subjects (not yet in SUBJECT_IDS):
 *   englisch  -> #EAB308 (yellow-500)
 */
export const SUBJECT_COLOR_HEX: Record<SubjectId, string> = {
  mathe: "#1E4A7C", // Navy, matches Lernikon brand
  deutsch: "#DC2626", // Red, Tailwind red-600
  denken: "#9333EA", // Flieder / Lila, Tailwind purple-600
};

export interface TopicMeta {
  id: TopicId;
  subject: SubjectId;
  label: string;
  description: string;
  href: string;
  /** Grades this topic is offered for (0 = Vorschule, 1..10 = Klasse n). */
  grades: ReadonlyArray<number>;
  /** True once the topic is shipped. Topics not yet implemented stay `false` and don't appear on the dashboard. */
  implemented: boolean;
  /** True for roadmap topics that appear as "Bald" teaser cards on the dashboard. */
  comingSoon?: boolean;
}

export const TOPIC_REGISTRY: Record<TopicId, TopicMeta> = {
  /**
   * Klasse 1-4 · Mathe · Addition und Subtraktion im wählbaren Zahlenraum.
   *
   * Aufgabentyp: Einzelne Aufgaben im Listenformat (5/10/15/20 Stück),
   * jede Aufgabe mit Platz zum Rechnen. Optionales Lösungsblatt auf Seite 2.
   *
   * Konfig-Achsen:
   *   - Rechenart (Addition / Subtraktion / Gemischt) — Default: Gemischt
   *   - Zahlenraum (1-10 / 1-20 / 1-100) — Default: 1-20
   *   - Anzahl (5 / 10 / 15 / 20) — Default: 10
   *   - Theme (Weltraum / Einhorn / Pferde / Autos) — Pro-Themes hinter Paywall
   *
   * NICHT in scope:
   *   - Multiplikation / Division → "mathe-einmaleins"
   *   - Schriftliche Verfahren mit Übertrag → "mathe-schriftlich"
   *   - Brüche → "mathe-brueche"
   *   - Zehnerübergang als eigener didaktischer Fokus: existiert nicht
   *     (Zahlenraum 1-20 kommt dem am nächsten, trennt aber keine Aufgaben
   *     mit Überschreitung der 10er gezielt heraus)
   */
  "mathe-rechnen": {
    id: "mathe-rechnen",
    subject: "mathe",
    label: "Rechnen (+ und -)",
    description: "Addition, Subtraktion oder gemischt im wählbaren Zahlenraum.",
    href: "/app/mathe/rechnen",
    grades: [1, 2, 3, 4],
    implemented: true,
  },

  /**
   * Vorschule · Mathe · Ziffern 0-9 in der 3-Linien-Schreiblernlineatur nachfahren.
   *
   * Aufgabentyp: Pro Zeile ein Ghost-Glyph ganz links, der Rest der Zeile ist
   * leer zum Nachfahren. Playwrite DE Grund (Druckschrift) — Schreibschrift
   * ergibt für Ziffern keinen Sinn. Kein Lösungsblatt.
   *
   * Konfig-Achsen:
   *   - Ziffern-Multiselect (0-9, alle vorausgewählt)
   *   - Zeilen pro Ziffer (1 / 2 / 3 / 4) — Default: 2
   *
   * NICHT in scope:
   *   - Buchstaben nachschreiben → "deutsch-buchstaben-schreiben"
   *   - Mengenverständnis (Objekte zählen, Ziffer zuordnen) → "mathe-mengen"
   *     (comingSoon, noch nicht implementiert)
   */
  "mathe-zahlen-schreiben": {
    id: "mathe-zahlen-schreiben",
    subject: "mathe",
    label: "Zahlen schreiben",
    description: "Ziffern 0-9 nachfahren mit Lineatur.",
    href: "/app/mathe/zahlen-schreiben",
    grades: [0],
    implemented: true,
  },

  /**
   * Vorschule · Mathe · Mengen erkennen und Ziffern zuordnen.
   *
   * Status: NOCH NICHT IMPLEMENTIERT. Erscheint als "Bald"-Karte im Dashboard.
   * Geplantes Format: Bildkarten mit Objekt-Gruppen (z.B. 3 Äpfel), Kind trägt
   * die passende Ziffer ein. Kein Lösungsblatt geplant.
   *
   * NICHT in scope (derzeit):
   *   - Ziffern nachschreiben → "mathe-zahlen-schreiben" (implementiert)
   */
  "mathe-mengen": {
    id: "mathe-mengen",
    subject: "mathe",
    label: "Mengen 1-10",
    description: "Mengen erkennen und Ziffern zuordnen.",
    href: "/app/mathe/mengen",
    grades: [0],
    implemented: false,
    comingSoon: true,
  },

  /**
   * Klasse 3 · Mathe · Multiplikation mit den Reihen 1-10.
   *
   * Aufgabentyp: Einzelne Multiplikationsaufgaben im Listenformat (10/20/30
   * Stück). Jede Reihe trägt eine Ampel-Pill (Einfach grün / Mittel gelb /
   * Schwer rot) als visuellen Schwierigkeits-Hinweis. Optionales Lösungsblatt.
   *
   * Konfig-Achsen:
   *   - Reihen-Multiselect (1-10, jede mit Ampel-Pill) — Default: Reihen 1-5
   *   - Anzahl (10 / 20 / 30) — Default: 20
   *   - Lösungsblatt (an / aus) — Default: an
   *
   * NICHT in scope:
   *   - Division (Gegenpart zum Einmaleins): existiert noch nicht
   *   - Faktoren > 10: existiert nicht
   *   - Addition / Subtraktion → "mathe-rechnen"
   */
  "mathe-einmaleins": {
    id: "mathe-einmaleins",
    subject: "mathe",
    label: "Einmaleins",
    description: "Multiplikation üben mit den Reihen 1 bis 10",
    href: "/app/mathe/einmaleins",
    grades: [3],
    implemented: true,
  },

  /**
   * Klasse 4 · Mathe · Schriftliche Addition und Subtraktion mit Übertrag.
   *
   * Aufgabentyp: Spaltenlayout mit fixbreiten Digit-Zellen (14 pt je Stelle),
   * separater Übertragszeile, Trennlinie und leerer Antwortszeile. 6 Aufgaben
   * werden 2-spaltig gesetzt, 12 und 18 Aufgaben 3-spaltig. Optionales
   * Lösungsblatt auf Seite 2 (Antworten in Brandblau).
   *
   * Konfig-Achsen:
   *   - Rechenart (Addition / Subtraktion / Gemischt) — Default: Gemischt
   *   - Stellen (3-stellig 100-999 / 4-stellig 1000-9999) — Default: 3-stellig
   *   - Anzahl (6 / 12 / 18) — Default: 12
   *   - Lösungsblatt (an / aus) — Default: an
   *
   * NICHT in scope:
   *   - Schriftliche Multiplikation: existiert nicht
   *   - Schriftliche Division: existiert nicht
   *   - Einfache Addition/Subtraktion ohne Spaltenlayout → "mathe-rechnen"
   */
  "mathe-schriftlich": {
    id: "mathe-schriftlich",
    subject: "mathe",
    label: "Schriftliche Verfahren",
    description: "Addition und Subtraktion im Spaltenlayout mit Übertrag.",
    href: "/app/mathe/schriftlich",
    grades: [4],
    implemented: true,
  },

  /**
   * Klasse 4 · Mathe · Brüche darstellen, vergleichen und addieren/subtrahieren.
   *
   * Aufgabentyp: Drei exklusive Modi pro Arbeitsblatt:
   *   - Darstellen: geshadete Form (Kreis oder Rechteck) + leere ___/___-Lücke.
   *     50/50 Kreise und Rechtecke. Nenner 2-10.
   *   - Vergleichen: zwei Brüche nebeneinander, Kästchen-Operator-Slot (</>/ =).
   *     Gleicher Nenner (~60%) oder einer teilt den anderen (~40%). 2-up Grid.
   *   - Rechnen: Addition oder Subtraktion mit gleichem Nenner. Nenner 2-12.
   *     Subtraktion: linker Zähler >= rechter (kein negatives Ergebnis). 2-up Grid.
   * Optionales Lösungsblatt auf Seite 2.
   *
   * Konfig-Achsen:
   *   - Modus (Darstellen / Vergleichen / Rechnen) — Default: Darstellen
   *   - Anzahl: Darstellen (6 / 12 / 18), Vergleichen + Rechnen (6 / 14 / 24)
   *   - Lösungsblatt (an / aus) — Default: an
   *
   * NICHT in scope:
   *   - Bruchrechnen mit ungleichen Nennern (Kürzen, Erweitern): existiert nicht
   *   - Dezimalzahlen: existiert nicht
   *   - Schriftliche Verfahren → "mathe-schriftlich"
   */
  "mathe-brueche": {
    id: "mathe-brueche",
    subject: "mathe",
    label: "Brüche",
    description: "Brüche darstellen, vergleichen und mit gleichem Nenner rechnen.",
    href: "/app/mathe/brueche",
    grades: [4],
    implemented: true,
  },

  /**
   * Klasse 4 · Mathe · Schriftliche Multiplikation mit Teilprodukten.
   *
   * Aufgabentyp: Spaltenlayout mit fixbreiten Digit-Zellen (14 pt je Stelle).
   * Pro Aufgabe: Multiplikand (oben), × Multiplikator (darunter), Trennlinie,
   * leere Teilprodukt-Zeilen (eine pro Multiplikator-Stelle), zweite Trennlinie,
   * leere Ergebniszeile. 4 Aufgaben → 2x2, 8 → 2x4, 12 → 3x4.
   * Optionales Lösungsblatt auf Seite 2 (Teilprodukte + Ergebnis in Brandblau).
   *
   * Konfig-Achsen:
   *   - Stellen ("3x1": Multiplikand 100-999, Multiplikator 2-9 /
   *     "3x2": Multiplikand 100-999, Multiplikator 10-99) — Default: "3x2"
   *   - Anzahl (4 / 8 / 12) — Default: 8
   *   - Lösungsblatt (an / aus) — Default: an
   *
   * NICHT in scope:
   *   - Schriftliche Division: existiert noch nicht
   *   - Multiplikation als Einmaleins-Trockenübung → "mathe-einmaleins"
   *   - Addition / Subtraktion schriftlich → "mathe-schriftlich"
   */
  "mathe-multiplikation": {
    id: "mathe-multiplikation",
    subject: "mathe",
    label: "Schriftliche Multiplikation",
    description: "Multiplikation im Spaltenlayout mit Teilprodukten.",
    href: "/app/mathe/multiplikation",
    grades: [4],
    implemented: true,
  },

  /**
   * Vorschule + Klasse 1-2 · Deutsch · Buchstaben-Spurschrift in 3-Linien-Lineatur.
   *
   * Aufgabentyp: Pro Zeile ein Ghost-Glyph ganz links (halbtransparent),
   * der Rest der Zeile ist leer zum Nachfahren. Kein Lösungsblatt.
   * Schrift wählbar: Druck (Playwrite DE Grund) oder Schreib (Playwrite DE SAS).
   * Einzelne Buchstaben laufen sauber durch <Text>; der SAS-Glyph-Drop-Bug
   * trifft nur mehrzeichige Strings (betrifft dieses Topic nicht).
   *
   * Konfig-Achsen:
   *   - Buchstaben-Multiselect (A-Z) — Default: alle
   *   - Case (Großbuchstaben / Kleinbuchstaben / Beides) — Default: Beides
   *   - Zeilen pro Buchstabe (1 / 2 / 3 / 4) — Default: 2
   *   - Schrift (Druck / Schreib) — Default: Druck
   *
   * NICHT in scope:
   *   - Wörter abschreiben → "deutsch-woerter-abschreiben"
   *   - Ziffern nachschreiben → "mathe-zahlen-schreiben"
   */
  "deutsch-buchstaben-schreiben": {
    id: "deutsch-buchstaben-schreiben",
    subject: "deutsch",
    label: "Buchstaben schreiben",
    description: "Spurschrift mit Lineatur in Druck- oder Schreibschrift.",
    href: "/app/deutsch/buchstaben-schreiben",
    grades: [0, 1, 2],
    implemented: true,
  },

  /**
   * Klasse 1-2 · Deutsch · Wörter aus klassenspezifischem Korpus abschreiben.
   *
   * Aufgabentyp: Pro Zeile ein Ghost-Wort ganz links (Druck- oder Schreibschrift),
   * der Rest der Zeile ist leer zum Abschreiben. Kein Lösungsblatt.
   * Druckschrift: normales <Text> mit Playwrite DE Grund.
   * Schreibschrift: Playwrite DE SAS hat einen React-PDF-Bug (erster Glyph
   * mehrzeichiger Wörter wird gedropt). Workaround: Wörter als Vektor-Outlines
   * via fontkit.openSync() + <Svg><Path> rendern (OutlinedGhostWord).
   *
   * Wort-Korpus (lib/worksheet/woerter-abschreiben/corpus.ts):
   *   - Klasse 1: lautgetreue Grundwörter (Familie, Tiere, Körper, Essen,
   *     Schule, Spielzeug, Natur)
   *   - Klasse 2: längere Wörter, Doppelkonsonanten, ß, Umlaute, Wochentage,
   *     Monate
   * Fisher-Yates-Auswahl mit seedable PRNG; deterministisch.
   *
   * Konfig-Achsen:
   *   - Klasse-Toggle (1 / 2) — Default: 1
   *   - Anzahl Wörter (5 / 8 / 10) — Default: 8
   *   - Zeilen pro Wort (1 / 2 / 3) — Default: 2
   *   - Schrift (Druck / Schreib) — Default: Druck
   *
   * NICHT in scope:
   *   - Diktat (Eltern lesen vor) → "deutsch-diktate"
   *   - Wortarten-Übung → "deutsch-wortarten"
   *   - Buchstaben-Spurschrift einzeln → "deutsch-buchstaben-schreiben"
   */
  "deutsch-woerter-abschreiben": {
    id: "deutsch-woerter-abschreiben",
    subject: "deutsch",
    label: "Wörter abschreiben",
    description: "Wörter lesen und in der Schreiblernlineatur abschreiben",
    href: "/app/deutsch/woerter-abschreiben",
    grades: [1, 2],
    implemented: true,
  },

  /**
   * Klasse 2 · Deutsch · Volldiktat mit zwei-Seiten-PDF.
   *
   * Aufgabentyp: Zwei-Seiten-PDF:
   *   - Seite 1 (Eltern-Vorleseblatt): nummerierte Satzliste, Helvetica, klar
   *     lesbar. Seite 1 ist gleichzeitig der Schlüssel — kein separates
   *     Lösungsblatt nötig.
   *   - Seite 2+ (Kinder-Schreibblatt): nummerierte Blöcke mit je 2 Zeilen
   *     3-Linien-Lineatur. Bei 12 Sätzen kann Seite 3 überlaufen (keine
   *     Komprimierung der Lineatur).
   * Korpus: ~68 kurze Sätze für Klasse 2 (Doppelkonsonanten, ss/ß, Umlaute,
   * ie/i, eu/au). Themen: Familie, Schule, Tiere, Wetter, Spielen, Essen,
   * Jahreszeiten. Fisher-Yates mit seedable PRNG.
   *
   * Konfig-Achsen:
   *   - Anzahl Sätze (5 / 8 / 12) — Default: 8
   *
   * NICHT in scope:
   *   - Lückendiktat (Teile des Satzes fehlen): existiert nicht, wir machen Volldiktat
   *   - Lese-Diktat (Kind liest selbst): existiert nicht
   *   - Wörter abschreiben → "deutsch-woerter-abschreiben"
   */
  "deutsch-diktate": {
    id: "deutsch-diktate",
    subject: "deutsch",
    label: "Diktat",
    description: "Eltern lesen Satze vor, Kinder schreiben sie in die Lineatur.",
    href: "/app/deutsch/diktate",
    grades: [2],
    implemented: true,
  },

  /**
   * Klasse 3 · Deutsch · Lückenwörter zu klassischen Klasse-3-Rechtschreibregeln.
   *
   * Aufgabentyp: Zweispaltige Wortliste. Pro Wort eine Unterstrich-Lücke
   * (borderBottom-View mit weißem Spacer-Text) für die fehlende Schreibung.
   * Optionales Lösungsblatt auf Seite 2 (volles Wort in Brand-Navy).
   *
   * Korpus (lib/worksheet/rechtschreibung/corpus.ts): ~110 Einträge über
   * vier Regeln:
   *   - ie / i / ih: 31 Einträge
   *   - ss / ß: 22 Einträge
   *   - Doppelkonsonanten: 31 Einträge
   *   - Wortendungen: 24 Einträge
   * Gemischt-Modus verteilt count gleichmäßig auf alle vier Regeln.
   *
   * Konfig-Achsen:
   *   - Regel (ie-i / ss-ß / Doppelkonsonanten / Wortendungen / Gemischt)
   *     — Default: Gemischt
   *   - Anzahl (10 / 15 / 20) — Default: 15
   *   - Lösungsblatt (an / aus) — Default: an
   *
   * NICHT in scope:
   *   - Aufsatz-Bausteine: existiert noch nicht (geplant Klasse 4)
   *   - Leseverstehen: existiert noch nicht (geplant Klasse 3)
   *   - Wortarten → "deutsch-wortarten"
   */
  "deutsch-rechtschreibung": {
    id: "deutsch-rechtschreibung",
    subject: "deutsch",
    label: "Rechtschreibung",
    description: "Lückenwörter zu klassischen Klasse-3-Rechtschreibregeln.",
    href: "/app/deutsch/rechtschreibung",
    grades: [3],
    implemented: true,
  },

  /**
   * Klasse 2 · Deutsch · Nomen / Verb / Adjektiv ankreuzen.
   *
   * Aufgabentyp: Einspaltige Tabelle mit Wort in Spalte 1 und drei
   * Checkbox-Spalten (Nomen / Verb / Adjektiv). Wörter im Worksheet
   * kleingeschrieben (kein Capitalize-Hinweis). Optionales Lösungsblatt
   * auf Seite 2 mit gefüllten Kästchen.
   *
   * Korpus (lib/worksheet/wortarten/corpus.ts):
   *   - 40 Nomen, 40 Verben, 40 Adjektive
   * Fisher-Yates-Auswahl mit seedable PRNG; Wortarten werden gleichmäßig
   * verteilt, dann gemischt (kein Block-Format).
   *
   * Konfig-Achsen:
   *   - Anzahl Wörter (10 / 15 / 20) — Default: 15
   *   - Lösungsblatt (an / aus) — Default: an
   *
   * NICHT in scope:
   *   - Satzteil-Bestimmung (Subjekt / Prädikat / Objekt): existiert nicht
   *   - Wortfamilien: existiert nicht
   *   - Rechtschreibregeln → "deutsch-rechtschreibung"
   */
  "deutsch-wortarten": {
    id: "deutsch-wortarten",
    subject: "deutsch",
    label: "Wortarten erkennen",
    description: "Nomen, Verb oder Adjektiv ankreuzen - mit gemischtem Wortschatz.",
    href: "/app/deutsch/wortarten",
    grades: [2],
    implemented: true,
  },

  /**
   * Vorschule · Denken · Form-Muster in Reihen vervollständigen.
   *
   * Aufgabentyp: Reihen aus Formen (Kreis, Quadrat, Dreieck, Stern u.a.)
   * mit einer oder mehreren Lücken. Das Kind erkennt das Muster und zeichnet
   * die fehlende(n) Form(en) ein. Kein Lösungsblatt nötig — die Antworten
   * ergeben sich direkt aus dem Muster.
   *
   * Konfig-Achsen:
   *   - Schwierigkeit (Einfach / Mittel / Schwer) — Default: Einfach
   *   - Reihenzahl — Default: 6
   *   - Formen pro Reihe — Default: 5
   *   - Lückenmodus (letzte Position / zufällige Position / mehrere Lücken)
   *     — Default: letzte Position
   *
   * NICHT in scope:
   *   - Zahlen-Reihen-Fortsetzung (1, 3, 5, ___): existiert nicht
   *   - Logik-Rätsel (welches Bild passt nicht dazu?): existiert nicht
   */
  "denken-muster": {
    id: "denken-muster",
    subject: "denken",
    label: "Muster fortsetzen",
    description: "Reihen aus Formen vervollständigen",
    href: "/app/denken/muster",
    grades: [0],
    implemented: true,
  },
};

/** Topics ready to be shown on the dashboard for a given grade. */
export const topicsForGrade = (grade: number): TopicMeta[] =>
  Object.values(TOPIC_REGISTRY).filter(
    (t) => t.implemented && t.grades.includes(grade),
  );

/** All implemented topics, regardless of grade. Used for admin/staff previews. */
export const listAllImplementedTopics = (): TopicMeta[] =>
  Object.values(TOPIC_REGISTRY).filter((t) => t.implemented);

/**
 * Returns implemented topics plus comingSoon roadmap tiles for a given grade.
 * Implemented topics come first, then comingSoon; within each bucket sorted
 * by subject ("mathe" before "deutsch").
 */
export const topicsForGradeWithRoadmap = (grade: number): TopicMeta[] => {
  const matches = Object.values(TOPIC_REGISTRY).filter(
    (t) => t.grades.includes(grade) && (t.implemented || t.comingSoon),
  );
  const subjectOrder: Record<SubjectId, number> = {
    mathe: 0,
    deutsch: 1,
    denken: 2,
  };
  return matches.sort((a, b) => {
    const bucketA = a.implemented ? 0 : 1,
      bucketB = b.implemented ? 0 : 1;
    if (bucketA !== bucketB) return bucketA - bucketB;
    return subjectOrder[a.subject] - subjectOrder[b.subject];
  });
};

export const getTopic = (id: TopicId): TopicMeta => TOPIC_REGISTRY[id];

export const isTopicId = (value: unknown): value is TopicId =>
  typeof value === "string" && (TOPIC_IDS as readonly string[]).includes(value);

/**
 * Wenn du ein neues Topic hinzufügst:
 *  1. Eintrag in TOPIC_IDS und TOPIC_REGISTRY.
 *  2. JSDoc-Block mit Klasse, Format, Konfig-Achsen und "NICHT in scope" über dem Eintrag.
 *  3. Coverage-Matrix am Anfang der Datei anpassen.
 *  4. Generator, PDF, Form-Pages und Dispatcher-Case implementieren (siehe Header-JSDoc).
 *
 * Wenn du ein Topic entfernst: Eintrag aus TOPIC_IDS und TOPIC_REGISTRY raus,
 * JSDoc-Block löschen, Matrix aktualisieren, Schritte rückwärts.
 */
