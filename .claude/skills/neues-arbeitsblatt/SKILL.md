---
name: neues-arbeitsblatt
description: Briefing-Workflow für ein neues Lernikon-Worksheet-Topic. Verwende diesen Skill IMMER wenn der Founder ein neues Arbeitsblatt / einen neuen Topic-Generator bauen will (z. B. "lass uns ein Klasse-3-Mathe-Blatt für Geld bauen"). Der Skill scoped, prüft gegen die Topic-Registry und delegiert dann pro Specialist (dev, optional designer, optional marketing) direkt aus der Hauptsession. Ruft niemals selbst Code-Writes auf.
---

# Skill: Neues Lernikon-Arbeitsblatt

Diese Datei ist ein vollständiges Briefing-Workflow. Wichtig: **Per `CLAUDE.md` ist die Hauptsession selbst der CEO.** `subagent_type: "ceo"` aufzurufen funktioniert NICHT zuverlässig — der gespawnte CEO-Subagent hat in CLI-Sessions oft kein eigenes `Agent`-Tool (kann also keine weiteren Specialists spawnen) und macht den Workflow nur eine Stufe tiefer und langsamer. Stattdessen: Du in der Hauptsession übernimmst die CEO-Rolle direkt und spawnst Specialists per `Agent`-Tool (dev / designer / marketing / legal / devops, je nach Bedarf). Du schreibst selbst keinen Produktcode.

---

## Phase 0 — Pre-Flight (Hauptsession, BEVOR du den CEO startest)

Pflicht-Lektüre, in dieser Reihenfolge:

1. `VISION.md` §7 (Non-Goals) und §10 (MVP Scope / Phase 1c / Phase 2).
2. `lib/worksheet/topics.ts` — **komplett**. Die Datei hat oben eine Coverage-Matrix und unten eine "Echte Lücken"-Liste. Jeder existierende Topic hat einen JSDoc-Block mit "Aufgabentyp / Konfig-Achsen / NICHT in scope".
3. `AGENTS.md` (Next 16 Caveats, Lernikon-Guardrails) und das projekt-`CLAUDE.md` (Codebase-Gotchas).

Dann prüfe in dieser Reihenfolge:

- **Existiert das Topic schon?** Wenn ja → Founder darauf hinweisen, Skill stoppt.
- **Fällt es unter Phase 2 (Klasse 5–10, neue Fächer wie Englisch/Sachunterricht)?** Wenn ja → exakter Wortlaut aus `ceo.md`: *"Out of MVP scope per VISION.md. Adding to Phase 2 backlog. Continuing with current task."*
- **Fällt es unter VISION §7 (Non-Goals)?** Gleiches Skript, dann stop.

## Phase 1 — Topic-Scoping mit dem Founder

Wenn nicht aus der ersten Founder-Message klar, frage mit **einem** `AskUserQuestion`-Aufruf (gebündelt, nicht nacheinander) folgende Achsen ab. Schlage immer eine *konkrete Default-Option zuerst* vor, basierend auf bestehenden Lücken aus `lib/worksheet/topics.ts`:

1. **Fach + Klasse** (Mathe / Deutsch / Denken × Vorschule–4)
2. **Aufgabentyp** (z. B. Listenformat / Spaltenlayout / Spurschrift / Tabelle mit Checkboxen / Lückenwörter / Volldiktat)
3. **Konfig-Achsen** (welche Knöpfe hat der Eltern im Form? Default-Werte? Lösungsblatt ja/nein?)
4. **Theme-Eignung** (ist Theme-Personalisierung sinnvoll für diesen Topic, oder bleibt es rein funktional wie bei Spurschrift?)

Surface JEDE produktrelevante Trade-off-Entscheidung an den Founder, bevor du delegierst (Pricing-Gate, Paywall-Trigger, Scope-Erweiterung — der CEO entscheidet sonst still, das ist verboten).

## Phase 2 — Delegation aus der Hauptsession

Sobald Scope steht: spawne den `dev`-Specialist mit dem unteren Briefing-Template via `Agent`-Tool (`subagent_type: "dev"`) in Foreground. **NICHT `subagent_type: "ceo"`** — du bist der CEO. Bei einfach gespeccten Klon-Topics (Pattern-Kopie von einem existierenden Modul) reicht der dev allein. Bei Topics mit echten neuen Layout- oder Wording-Fragen: spawne zusätzlich `designer` und/oder `marketing` parallel im selben Message-Turn (mehrere `Agent`-Tool-Calls), aber nur wenn sie reale unabhängige Arbeit haben (Wording-Vorschläge, Layout-Mockup) — sonst sind sie Overhead. Du schreibst nicht selbst Code, edite nicht selbst Files. Du orchestrierst und reportest am Ende kompakt an den Founder.

---

## Briefing-Template für den `dev`-Specialist

Verwende dieses Template wortwörtlich (mit eingesetzten Werten) als `prompt` des `Agent`-Calls an `dev` (`subagent_type: "dev"`). Der dev-Specialist liefert die 6 Commits in fester Reihenfolge.

````
Neues Worksheet-Topic implementieren. Founder-Spec:

Topic-Slug:        <kebab-case, z. B. "mathe-geld">
Fach:              <mathe | deutsch | denken>
Klasse(n):         <z. B. [3] oder [1, 2]>
Topic-ID:          <subject-slug, z. B. "mathe-geld">
Aufgabentyp:       <eine Zeile, z. B. "Listenformat mit Geldbeträgen in Euro/Cent und Lösungsblatt">
Konfig-Achsen:     <Bullet-Liste mit Default-Werten>
Theme-relevant:    <ja/nein + ggf. Begründung>
Lösungsblatt:      <ja/nein, optional/pflicht>

Dies ist ein neues Topic für Phase 1c per VISION §10. Bitte folge der Pflicht-Checkliste
und delegiere parallel an dev (Backend-Module + API-Dispatcher + Route + Form) und designer
(PDF-Layout-Review + Form-UX-Polish). Marketing nur für Form-Subtitle / UI-Strings einbeziehen.
Legal + devops sind nicht betroffen.

## Pflicht-Checkliste (alles in dieser Reihenfolge, ein Commit pro Datei-Gruppe)

### 1. Topic-Registry (zuerst — Single Source of Truth)
- `lib/worksheet/topics.ts`:
  - Eintrag in `TOPIC_IDS` (am Ende, exakte Reihenfolge folgt subject-Gruppierung).
  - JSDoc-Block über dem `TOPIC_REGISTRY`-Eintrag mit: Klasse · Fach · Kurzbeschreibung;
    Aufgabentyp (1 Absatz); Konfig-Achsen (Bullet-Liste mit Defaults); NICHT in scope
    (welche Nachbar-Topics dieser nicht ersetzt + welche Phase-2-Erweiterungen draußen sind).
  - Eintrag in `TOPIC_REGISTRY` mit: `id`, `subject`, `label`, `description`, `href`,
    `grades`, `implemented: true`.
  - **Coverage-Matrix** ganz oben in der Datei manuell aktualisieren (neue Zelle).
  - **"Echte Lücken"-Liste** unter der Matrix anpassen, falls das neue Topic eine vorher
    gelistete Lücke schließt.

### 2. Module unter `lib/worksheet/<slug>/`
- `config.ts`:
  - Konstanten-Arrays für Multiselect-Options (`as const`).
  - `<X>ConfigSchema = z.object({...})`, optional mit `superRefine`.
  - Labels-Records für Subtitles und Filenames (z. B. `STELLEN_LABELS`).
  - Optional `seed: z.number().int().optional()` für deterministische Tests.
- `generate.ts`:
  - Pure function `generate<X>(config, seed?)`, die das Config-Schema NICHT erneut parst
    *außer* die Funktion ist auch außerhalb des Dispatchers aufrufbar — dann wie multiplikation.
  - PRNG: kopiere `mulberry32` aus `lib/worksheet/multiplikation/generate.ts` (kanonisch).
  - Anti-Duplikat: `seen: Set<string>` mit Key wie `"a|b"` oder Wort-ID. Max-Attempts-Schutz
    falls Pool kleiner als `count` werden kann.
  - Bei korpus-basierten Topics: separater `corpus.ts` mit klar typisierten Einträgen
    (siehe `lib/worksheet/wortarten/corpus.ts` als Referenz).
  - JSDoc in **English**, kommentiert WIE und WARUM (nicht WAS — das sagt der Code).
- `generate.test.ts` (Vitest):
  - Zod rejection für offensichtlich ungültige Inputs.
  - Exakte `count`-Länge pro Modus.
  - Range-Constraints (jede Operand-Achse innerhalb der dokumentierten Grenzen).
  - Keine doppelten `(a, b)`-Tupel bei Standard-`count`.
  - Determinismus: gleicher `seed` → gleiches Ergebnis.
  - Unterschiedliche Seeds → unterschiedliches Ergebnis.
  - Topic-spezifische Invarianten (z. B. Subtraktion: linker Operand ≥ rechter; Brüche:
    Zähler < Nenner; Wortarten-Balance: mindestens N pro Kategorie).
- `pdf.tsx`:
  - `Document` mit `title/author/creator/producer` = "Lernikon".
  - Page-Style `paddingTop: 56, paddingBottom: 64, paddingLeft: 52, paddingRight: 52`
    (oder 70 wenn Inhalt eng zusammengeschoben werden soll — siehe Wortarten).
  - Header: `Lernikon` Brand + `lernikon.de` Domain (klein, color `#1E4A7C`).
  - Footer: `LOGO_LOCKUP_BUFFER` (paperplane navy 800px PNG) zentriert + optionaler
    `Kostenfreie Version von lernikon.de · Family Pro entsperrt alle Themes`-Watermark
    nur wenn `showWatermark: true`.
  - `<ThemeDecoration theme={themeMeta} />` als ERSTES Kind in JEDER `<Page>` (auch
    Lösungsblatt-Page).
  - Brand-Palette ausschließlich aus `COLOR` (brand `#1E4A7C`, accent `#F4B942`,
    textDark `#1F2937`, textMuted `#6B7280`, line `#E5E7EB`).
  - Optionales Lösungsblatt als zweite `<Page>` (gleiche Header-/Footer-Struktur,
    Lösungen in `COLOR.brand`).
  - **Kein** `topAccent`-Streifen (entfernt 2026-05-16 wegen Druckerrand-Clipping).
  - Export: `renderToStream(<XDocument {...props} />)` als `NodeJS.ReadableStream`.

### 3. API-Dispatcher
- `app/api/worksheet/generate/route.ts`:
  - Neue Imports für config/generate/pdf am Datei-Anfang.
  - Neuer `case "<topic-id>":` im `dispatchTopic`-Switch — Reihenfolge spielt keine Rolle,
    aber Mathe-Topics nahe der anderen Mathe-Topics platzieren.
  - Bei Multiselects: serverseitig kanonisch sortieren (siehe `einmaleins`/`muster`):
    `config = { ...parsed.data, items: ITEM_IDS.filter((id) => parsed.data.items.includes(id)) }`.
  - `RenderResult`-Felder: `filenameBase` mit `Lernikon - <Fach> - <Topic> - <Konfig>`,
    `logSubject` (subject-id), `logOperation` (kebab-case operation oder `null`),
    `logConfig: config`.

### 4. Route + Form
- `app/app/<subject>/<short-slug>/page.tsx`:
  - Server Component. Pattern aus `app/app/mathe/multiplikation/page.tsx` kopieren.
  - `getCurrentUser` → redirect /login, `getActiveChildProfile` → redirect /onboarding,
    `getQuota(user.id, userRow)`. Title via `metadata`.
- `app/app/<subject>/<short-slug>/<slug>-form.tsx`:
  - Dünner Wrapper. `dynamic(() => import("./<slug>-form-impl").then(...), { ssr: false, loading: FormSkeleton })`.
- `app/app/<subject>/<short-slug>/<slug>-form-impl.tsx`:
  - `"use client"`. `useLocalSettings<Settings>("lernikon.settings.<topic-id>", DEFAULT_SETTINGS)`.
  - Bei neu hinzugefügten Settings-Feldern: ES-default beim Destructure
    (`const { ..., neuesFeld = false } = settings;`) damit alte localStorage-Werte nicht
    "uncontrolled → controlled"-Warnings produzieren.
  - shadcn `Card` / `CardHeader` / `CardContent` als Konfig-Sections (eine pro Achse).
  - Submit → `POST /api/worksheet/generate` mit `{ topic, childId, ...config }`. Response
    in `Blob` → `URL.createObjectURL` → `WorksheetPreview`-Modal.
  - PostHog-Capture `worksheet_generated` mit subject-typischen Properties beim Erfolg.
  - PostHog-Capture `paywall_hit` mit `trigger: "rate_limit"` bei HTTP 429.

### 5. VISION.md Task-Eintrag
- Neuer Task in §0 Status-Liste und §11 Concrete Tasks. Nummerierung fortlaufend (letzter
  shipped war Task 26). Inhalt: Route, Topic-ID, Konfig-Achsen, Datenformat, PDF-Layout,
  Rate-Limit-Eintrag-Hinweis.

### 6. Tests, Typecheck, Commits
- `npm run typecheck` — muss grün sein.
- `npm test -- <slug>` — muss grün sein.
- Conventional Commits, ein Commit pro logische Datei-Gruppe:
  1. `feat(<slug>): module (config + generate + tests)`
  2. `feat(<slug>): pdf renderer`
  3. `feat(<slug>): api dispatcher case`
  4. `feat(<slug>): route + form`
  5. `feat(<slug>): topic registry + coverage matrix`
  6. `docs(vision): task <N> shipped`
  Reihenfolge: 1 → 2 → 3 → 4 → 5 → 6. Niemals `--no-verify`, niemals `--amend`,
  niemals push.

## Gotchas (alle in dieser Codebase einmal mit Schmerzen gelernt)

- **WinAnsi / Latin-1 (Helvetica):** ✓ `×` U+00D7, `²` U+00B2; ✗ `→` U+2192, `←` U+2190,
  `−` U+2212 (Minus), `–` U+2013 (en dash), `—` U+2014 (em dash). Für Annotationen
  Klammern verwenden: `(345 × 2)`, nicht `345 × 2 ←`.
- **Em-/En-Dashes in User-Facing Copy:** verboten (Founder-Präferenz). Komma, Punkt,
  Klammern verwenden — sowohl in PDFs als auch in der Web-UI.
- **Playwrite DE SAS Glyph-Drop-Bug:** mehrzeichige Wörter in `<Text>` mit Family
  `PlaywriteDE-SAS` verlieren den ersten Glyphen ("Mama" → "ama"). Workaround:
  `fontkit.openSync()` + `<Svg><Path d={glyph.path.toSVG()} />`. Referenz:
  `lib/worksheet/woerter-abschreiben/pdf.tsx` (`OutlinedGhostWord`). Single-Char durch
  `<Text>` geht (Buchstaben-Spurschrift, Zahlen-Spurschrift).
- **Kein `fontWeight: "bold"` auf PlaywriteDE-Familien:** Google Fonts liefert kein
  Bold-Variant, React-PDF-Font-Cache kann dadurch *andere* Fonts beschädigen. Nur
  Regular.
- **React-PDF Limitations:** kein `gap` (durch `marginRight`/`marginBottom` ersetzen),
  SVG-Attribute numerisch (`r={2}`, niemals `r="2"`), lokale Bilder als `Buffer`
  (siehe `LOGO_LOCKUP_BUFFER`-Pattern).
- **Server-side canonical sort von Multiselects:** Form schickt unter Umständen
  stale-state (umsortiert) → Dispatcher sortiert defensiv: `items: ITEM_IDS.filter(...)`.
- **`useLocalSettings` Migration:** alte Browser-Werte haben neue Felder als `undefined`.
  ES-default-Destructure (`{ x = false } = settings;`) verhindert "uncontrolled →
  controlled"-React-Warning.
- **Theme-Decoration ist global:** `lib/worksheet/theme-decoration.tsx` ist Single
  Source of Truth für Position/Größe (`MAX_DIM`, `bottom`, `right`, `opacity`). Per-Topic-
  Overrides existieren bewusst nicht.
- **Druckerränder:** Vollflächige Hintergründe / Streifen am Seitenrand werden auf
  vielen Consumer-Druckern abgeschnitten oder erzwingen "An Druckbereich anpassen"-
  Weißrand. Inhalt mindestens 22pt vom Rand. `topAccent` wurde 2026-05-16 deshalb global
  entfernt — nicht wieder einführen.
- **Rate-Limit:** das Insert in `worksheets_log` ist die Quota-Quelle. Der Dispatcher
  loggt VOR dem Stream-Start, damit ein vom Client gecanceltes Generate trotzdem zählt.
- **Kid-Display-Schrift:** Ziffern in Aufgaben/Lösungen + Buchstaben/Wörter in Schreib-Übungen → `fontFamily: "PlaywriteDEGrund"`. Helvetica nur für Header, Anweisung, Brand, Footer, Eltern-Vorleseblätter. Pattern für Font-Registrierung: `lib/worksheet/letter-tracing/pdf.tsx`. Nie `fontWeight: "bold"` auf PlaywriteDE-Familien.
- **Achtung Grund-Umlaut-Bug:** Multi-Char-Strings mit ä/ö/ü/ß durch `<Text fontFamily="PlaywriteDEGrund">` rendern die Diakritika falsch positioniert oder gar nicht ("Schüler" → "Schuler"). Reine Ziffern und ASCII-Wörter funktionieren. Falls dein Topic deutsche Wörter mit Umlauten als Kid-Display zeigt (Sätze, Vokabeln, Lösungswörter), nutze den fontkit-Outline-Workaround. Referenz: `OutlinedGrundText` in `lib/worksheet/faelle/pdf.tsx`. Topics ohne Umlaute (mathe-rechnen, mathe-mengen, mathe-marienkaefer etc.) sind nicht betroffen.
- **Brand-Presence Pflicht (auch Pro-User):** `Lernikon` + `lernikon.de` oben links,
  paperplane-Lockup unten zentriert. Nur die `showWatermark`-Zeile darunter ist
  Free-only.

## VISION §9 Code Conventions (alle nicht-verhandelbar)

- Arrow-Params immer in Klammern: `(entry) => {}`.
- Comma-`const` für zusammengehörige Deklarationen.
- JSDoc in einfachem Englisch.
- `console.warn` statt `console.log`.
- TS strict, kein `any` (lieber `unknown` + narrowing).
- Zod-Schemas an JEDER externen Boundary.
- Server Actions bevorzugen, API-Routes nur für Streaming/PDF (wie hier).
- Eine Komponente pro Datei.
- Tailwind only, kein CSS-in-JS, keine CSS-Modules.
- Code-Kommentare auf Englisch, UI-Strings auf Deutsch (de-DE).

## Reporting
Wenn alles geshipped ist, melde dem Founder zurück:
- Topic-ID + Route
- Pfade der neuen Files (kompakt, eine Zeile je File)
- Commit-SHAs in Reihenfolge
- Offene Design-Tweaks falls ein Specialist welche markiert hat
````

---

## Referenz-Module zum Spickeln (Reihenfolge nach Komplexität)

Wenn der CEO den dev briefen will, was er als Pattern kopieren soll, nimm diese je nach Topic-Form:

| Form | Referenz |
|------|----------|
| Listenformat mit `+/-/×`-Aufgaben + optional Lösungsblatt | `lib/worksheet/einmaleins/` + `lib/worksheet/pdf.tsx` |
| Spaltenlayout mit fixbreiten Digit-Zellen + Übertrag | `lib/worksheet/schriftlich/` und `lib/worksheet/multiplikation/` |
| Korpus-basiert (Wortlisten, Sätze, Wortarten) | `lib/worksheet/wortarten/`, `lib/worksheet/rechtschreibung/`, `lib/worksheet/woerter-abschreiben/` |
| 3-Linien-Schreiblernlineatur + Ghost-Glyphen | `lib/worksheet/letter-tracing/`, `lib/worksheet/number-tracing/` |
| Vektor-Outline-Workaround für Schreibschrift | `lib/worksheet/woerter-abschreiben/pdf.tsx` (`OutlinedGhostWord`) |
| SVG-Formen / Diagramme im PDF | `lib/worksheet/pattern/`, `lib/worksheet/brueche/pdf.tsx` (Path-Kreissektor) |
| Zwei-Seiten-PDF (Eltern + Kinder) | `lib/worksheet/diktat/pdf.tsx` |
| Tabelle mit Checkbox-Spalten | `lib/worksheet/wortarten/pdf.tsx` |

## Bekannte Stolperfallen aus früheren Sessions

- **TypeScript-Strict-Compile pro Commit:** Der Dispatcher-Switch (Commit 3) referenziert `TopicId` aus `TOPIC_IDS`. Wenn der Topic-ID-String dort noch nicht steht, ist Commit 3 nicht für sich kompilierbar. Lösung: in Commit 3 schon einen **minimalen** Stub-Eintrag (`TOPIC_IDS` + leerer/Placeholder `TOPIC_REGISTRY`-Entry) einfügen, in Commit 5 den vollen JSDoc + Coverage-Matrix nachschieben. Der dev macht das in der Praxis von selbst, aber erwähne es im Briefing falls relevant.
- **PostHog `worksheet_generated`-Event-Type ist strikt:** `lib/analytics/events.ts` erlaubt aktuell nur `{ operation, range_min, range_max, count }`. Topic-spezifische Felder (stellen, verfahren, mitRest, modus, …) gehen nicht ohne Schema-Erweiterung. Standard: dev lässt sie raus und reportet als `[decision]`. Wenn der Founder Feature-spezifische Funnel-Daten will, ist die Event-Schema-Erweiterung ein separater Task (Discriminated Union pro operation).
- **CEO als Subagent ist tot:** `subagent_type: "ceo"`-Calls funktionieren in CLI nicht — der gespawnte CEO hat kein eigenes `Agent`-Tool, kann also keine Specialists spawnen, blockiert nur den Workflow.

## Skill-Done-Kriterien

Der Skill ist abgeschlossen, wenn:

1. Alle sechs Commits sind lokal angelegt (1 module, 2 pdf, 3 dispatcher, 4 route+form, 5 registry, 6 vision).
2. `npm run typecheck` ist grün (dev verifiziert).
3. `npm test` läuft komplett grün (inkl. der neuen `generate.test.ts`, dev reportet die Test-Anzahl).
4. Dashboard zeigt das Topic für die richtige(n) Klasse(n) (Topic-Registry ist die einzige Anbindung — Dashboard liest automatisch).
5. Founder bekommt eine kompakte Smoke-Test-Anleitung (welche Konfig-Achsen × welche Werte er einmal durchklicken sollte) für die manuelle Browser/Print-Probe.

Wenn 1–4 rot sind: zurück an den dev nachbessern, BEVOR an den Founder zurückreportet wird. Punkt 5 ist Founder-Aufgabe — du kannst den Smoke-Test nicht ausführen, nur anleiten.
