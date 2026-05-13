/**
 * Klasse 1: lautgetreue Grundwoerter, kurz (3-6 Buchstaben mostly).
 * Familie, Tiere, Koerper, Essen, Schule, Zuhause, Spielzeug, Natur.
 * Alphabetisch sortiert.
 */
export const WOERTER_KLASSE_1 = [
  "Affe", "Apfel", "Arm", "Auge", "Auto",
  "Bagger", "Ball", "Banane", "Baum", "Berg", "Bett", "Birne", "Blume", "Brot", "Buch",
  "Drache",
  "Ei", "Eis", "Ente", "Esel",
  "Familie", "Fenster", "Fisch", "Frosch",
  "Garten",
  "Haar", "Hand", "Hase", "Haus", "Heft", "Hund",
  "Igel",
  "Käse", "Katze", "Kind", "Kopf", "Kuh", "Kran",
  "Lama", "Lampe", "Löwe",
  "Mama", "malen", "Maus", "Milch", "Mond", "Mund",
  "Nase", "Nest",
  "Ofen", "Ohr", "Oma", "Onkel", "Opa",
  "Papa", "Pferd", "Puppe",
  "Reis", "Rose",
  "Saft", "Salat", "Schaf", "Schnee", "Schule", "See", "singen", "Sofa", "Sonne", "spielen", "Stern", "Stift", "Stuhl",
  "Tafel", "Tante", "Tasche", "Tier", "Tiger", "Tisch", "Topf", "Tür",
  "Vogel",
  "Wolf",
  "Zahn", "Zelt", "Zoo",
] as const;

/**
 * Klasse 2: laengere Woerter, Doppelkonsonanten, ss, Umlaute,
 * Wochentage, Monate, mehr abstrakte Wortschatz.
 * Alphabetisch sortiert.
 */
export const WOERTER_KLASSE_2 = [
  "Abendessen", "Apfelsaft", "Aufgabe", "Ausflug",
  "Blumenstrauß", "Brücke", "Bruder", "Buchstabe", "Bücher",
  "Cousin", "Cousine",
  "Daumen", "Dienstag", "Donnerstag",
  "Eichhörnchen", "Elefant", "Eltern", "Erdbeere",
  "Fahrrad", "Federmappe", "Ferien", "Fernseher", "Freund", "Freundin", "Frühling", "Frühstück",
  "Gemüse", "Gewitter", "Giraffe", "Glück", "Großmutter", "Großvater",
  "Hamster", "Hausaufgabe", "Herbst", "Himmel", "Hubschrauber",
  "Insel",
  "Jacke", "Januar",
  "Käfer", "Kaninchen", "Klasse", "Klassenzimmer", "Kleber",
  "Lehrer", "Lehrerin", "lernen", "lesen", "Lineal",
  "Marienkäfer", "März", "Mittagessen", "Mittwoch", "Montag", "Mutter", "Müsli",
  "Nachbar", "November",
  "Obst", "Oktober",
  "Pinguin", "Pinsel", "Pizza", "Pullover",
  "Quark", "Quelle",
  "Radiergummi", "Regenbogen", "Reise", "Rucksack",
  "Samstag", "Sandkasten", "Schere", "Schiff", "Schmetterling", "Schnecke", "Schokolade", "Schwester", "Schwimmbad", "September", "Sommer", "Sonntag", "Spinne", "Sportplatz", "Sturm",
  "Tasse", "Telefon", "Tinte", "Tomate",
  "Uhr", "Urlaub",
  "Vater",
  "Wasser", "Weihnachten", "Werkzeug", "Wiese", "Winter", "Wochenende",
  "Zebra", "Zeitung", "Zucker",
] as const;

export type WoerterKlasse = 1 | 2;

export const WOERTER_BY_KLASSE: Record<WoerterKlasse, readonly string[]> = {
  1: WOERTER_KLASSE_1,
  2: WOERTER_KLASSE_2,
};
