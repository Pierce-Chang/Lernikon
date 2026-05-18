---
name: neues-vorschulblatt
description: Briefing-Workflow für ein neues Lernikon-Vorschul-Topic (Klasse 0, Kinder 5-6 Jahre). Verwende diesen Skill IMMER wenn der Founder ein neues Vorschul-Arbeitsblatt bauen will (z. B. "lass uns Mengen zählen für Vorschule bauen"). Skill scoped, klärt Asset-Bedarf, bietet Claude-SVG-Generation als Default wenn passend, und delegiert dann direkt aus der Hauptsession an dev (Pattern-Klon, falls Topic ein bestehendes Layout wiederverwendet) oder dev + designer (bei neuem Layout). Ruft niemals selbst Code-Writes auf.
---

# Skill: Neues Lernikon-Vorschulblatt

Diese Datei ist ein Workflow für Vorschul-spezifische Topics. **Hauptsession ist der CEO per [[main-session-is-ceo]] / `CLAUDE.md`** — nicht `subagent_type: "ceo"` aufrufen, sondern direkt an Specialists delegieren.

Vorschule = Klasse 0 in der Grade-Enum (`children_profiles.grade = 0`). Kinder 5–6 Jahre, können meist nicht lesen, brauchen großzügige Layouts, viel Visuelles, wenige bis keine Wort-Anweisungen.

---

## Phase 0 — Pre-Flight (Hauptsession)

Pflicht-Lektüre:

1. `VISION.md` §7 (Non-Goals) und §10 (MVP Scope / Phase 1c).
2. `lib/worksheet/topics.ts` — speziell die Vorschul-Zeilen der Coverage-Matrix und die "Echte Lücken"-Liste am Ende. Aktuell shipped (Stand 2026-05-17):
   - `mathe-zahlen-schreiben` (Ziffern 0-9 Spurschrift)
   - `deutsch-buchstaben-schreiben` (A-Z Spurschrift, auch K1+K2)
   - `denken-muster` (Form-Muster fortsetzen)
   - `mathe-mengen` (comingSoon, **erster Default-Vorschlag**)
3. `AGENTS.md` + projekt-`CLAUDE.md`.

Vorschul-Lehrplan-Domains (zur Orientierung, nicht alle MVP-relevant):

- **Feinmotorik:** Schwung-Übungen, Striche, Bögen, Wellen — Vorbereitung aufs Schreiben.
- **Mengenerfassung 1-10:** Objekte zählen, Ziffer zuordnen, mehr/weniger vergleichen.
- **Form- und Farberkennung:** Formen benennen, sortieren, gruppieren.
- **Visuelle Wahrnehmung:** Unterschiede finden, Muster fortsetzen, Pärchen suchen.
- **Räumliche Orientierung:** oben/unten/links/rechts, Wege durchs Labyrinth.
- **Phonologische Bewusstheit:** Anlaute erkennen, Reime, Silben klatschen.
- **Konzentration / Ausdauer:** Ausmal-Vorlagen, Punkt-zu-Punkt, Suchbilder.

Dann prüfe in dieser Reihenfolge:

- **Existiert das Topic schon?** Wenn ja → Founder darauf hinweisen, Skill stoppt.
- **Fällt es unter Phase 2** (Klasse 5+, neue Fächer wie Englisch)? Antwort exakt: *"Out of MVP scope per VISION.md. Adding to Phase 2 backlog. Continuing with current task."*
- **Fällt es unter §7 Non-Goals** (Gamification mit Avatars, Photo-Scan, Sharing-Library)? Gleiches Skript, dann stop.

---

## Phase 1 — Topic-Scoping mit dem Founder

Wenn nicht aus der Founder-Message klar, frage **gebündelt** (ein `AskUserQuestion`-Call) folgende Achsen. Schlage den `mathe-mengen` (oder eine andere offene Lücke) als ersten Default vor.

1. **Fach + Aufgabentyp** (Recommendation aus dem Topic-Inventar unten, basierend auf bestehenden Lücken).
2. **Konfig-Achsen** (welche Knöpfe haben Eltern? Default-Werte?).
3. **Asset-Bedarf** (Frei-Text/SVG-Primitiven only / einfache Cliparts / komplexe Illustrationen).
4. **Theme-Eignung** (manche Vorschul-Topics gewinnen sehr durch Theme-Personalisierung, z. B. "zähle die Raketen" — Weltraum-Theme; bei Spurschrift bleibt es funktional).

Surface JEDE produktrelevante Trade-off-Entscheidung an den Founder (Paywall-Gate, neue Konfig-Komplexität, Asset-Aufwand).

### Topic-Inventar für Vorschule (was praktisch baubar ist)

| Aufgabentyp | Asset-Bedarf | Bestehendes Pattern wiederverwendbar? | Beispiel-Topic |
|-------------|--------------|---------------------------------------|----------------|
| Spurschrift (Buchstaben/Ziffern/Wörter) | Keine (Lineatur + Font/Glyph) | Ja → `letter-tracing`/`number-tracing` | Anlaute spuren, Vorname spuren |
| Schwung-Übungen / Striche | Keine (SVG-Pfade) | Nein, neues Layout (Lineatur + vorgezeichnete Schwünge) | Wellen, Bögen, Schleifen nachfahren |
| Mustererkennung (Formen/Farben) | Keine bis gering (existierende geometrics) | Ja → `pattern` | Form-Muster, Farb-Muster |
| Mengen zählen + Ziffer zuordnen | Mittel (Bildchen für Objekte) | Nein, neues Layout — **SVG-Generation passt sehr gut** | Mengen 1-10, "zähle die Sterne" |
| Pärchen / Memory / Zuordnen | Mittel (zwei Sets Bildchen) | Nein, neues Layout | Schatten-Bilder zuordnen, Hälften paaren |
| Größer/Kleiner Vergleich | Gering (zwei Bildchen pro Reihe) | Nein, neues Layout | "Welcher Ball ist größer?" |
| Labyrinth / Wege | Keine (SVG-Pfade) | Nein, neues Layout (SVG-Path-Generation) | Hund zum Knochen führen |
| Ausmal-Vorlagen nach Anweisung | Mittel (Bildchen mit nummerierten Bereichen) | Nein, neues Layout | Malen nach Zahlen einfach |
| Unterschiede finden | Hoch (zwei fast identische Bilder) | Nein, sehr asset-aufwendig | NOT recommended für MVP |
| Anlaut-Erkennung (Foto + Buchstabe) | Mittel-Hoch (4-6 Cliparts pro Aufgabe) | Nein, neues Layout | "Was beginnt mit A?" |

---

## Phase 2 — Asset-Klärung (wenn Topic Assets braucht)

Wenn das Topic ohne Bildchen auskommt (Spurschrift, Schwung-Übungen, Labyrinth-via-SVG-Path): überspring diese Phase und geh direkt zu Phase 3.

Wenn Bildchen gebraucht sind, frage **bevor** du dev spawnst:

1. **Reichen existierende Assets?** Inventar:
   - `public/geometrics/*.png` — 8 farbige geometrische Formen (Kreis, Dreieck, Viereck, Rechteck, Raute, Fünfeck, Sechseck, Stern) plus Outlines unter `public/geometrics/outlines/`.
   - `public/themes/*.png` — 5 Theme-Illustrationen (Auto blau, Auto rot, Einhorn, Pferd, Rakete).
   - `public/logos/paperplane/` — Lernikon-Branding, nicht für Aufgaben-Content.
   - Wenn die genug sind: keine Asset-Phase, direkt zu Phase 3.

2. **Sind die nötigen Assets thematisch eindeutig** (Tiere, Obst, Spielzeug, Natur, Fahrzeuge) und **geometrisch-stilisiert darstellbar**? Wenn ja → **biete dem Founder Claude-SVG-Generation an** als bevorzugte Option.

3. **Decision-Frage an Founder** (per `AskUserQuestion`):
   - **Option A (Recommended):** Claude generiert das nötige Asset-Set als SVG-React-Komponenten (kein Asset-File, direkt in `lib/worksheet/<slug>/assets.tsx`). Reproduzierbar, lizenzfrei, Brand-konform.
   - **Option B:** Founder liefert PNG/SVG-Assets selbst (z. B. von einem Designer oder Stock-Lib). Pfad und Lizenz-Status klären.
   - **Option C:** Topic-Spec ändern, sodass weniger oder keine Assets nötig sind (z. B. Mengen als Punkte/Kreise statt als Tiere darstellen).

### SVG-Generation-Vorgaben (wenn Option A gewählt)

Claude erzeugt die Assets als **React-PDF-kompatible SVG-Komponenten** direkt in `lib/worksheet/<slug>/assets.tsx`. Vorgaben:

- **Komponenten-Form:**
  ```tsx
  import { Svg, Path, G } from "@react-pdf/renderer";
  import type { ReactElement } from "react";

  export const Apfel = ({ size = 32 }: { size?: number }): ReactElement => (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Path d="..." fill="#DC2626" stroke="#1E4A7C" strokeWidth={2} />
      <Path d="..." fill="#16A34A" />
    </Svg>
  );
  ```
- **ViewBox standardisiert:** `0 0 100 100` für alle Assets (gleiche Skala, austauschbar).
- **Numerische Attribute:** `strokeWidth={2}`, `r={4}`, niemals als String (React-PDF Yoga-Parser-Bug, siehe CLAUDE.md).
- **Farbpalette:**
  - Primary Outline: `#1E4A7C` (Brand-Navy, gleicher Stroke wie Logo)
  - Akzent / Highlight: `#F4B942` (Brand-Gold)
  - Sekundärfarben okay aber sparsam: rot `#DC2626`, grün `#16A34A`, blau `#3B82F6`, gelb `#FACC15`
  - StrokeWidth: 2 (gut sichtbar im PDF-Druck, kindgerechter Kontrast)
- **Stil:** geometrisch-stilisiert, nicht photorealistisch. Maximale Lesbarkeit auf 32×32pt bis 64×64pt.
- **Komplexität:** max 15 `<Path>`-Elemente pro Asset. Komplexere Cliparts splitten in mehrere Sub-Komponenten oder Topic-Spec vereinfachen.
- **Konsistenz:** alle Assets eines Topics im gleichen Stil. Wenn Apfel umrandet ist, ist Banane auch umrandet.
- **Kein Text in SVG:** Beschriftungen kommen außerhalb der SVG als `<Text>`-Element.
- **Test-Render:** dev rendert nach Asset-Commit einmal lokal und Founder reviewt visuell, BEVOR die Aufgaben-Logik integriert wird.

### Asset-Commit-Workflow

Wenn Option A:
1. Hauptsession bekommt vom Founder Asset-Bedarf-Liste (z. B. "5 Tiere: Hund, Katze, Fisch, Vogel, Maus; 5 Obst: Apfel, Banane, Orange, Erdbeere, Birne").
2. **Hauptsession spawnt designer** (nicht dev — designer ist der SVG-Spec-Owner) mit Brief: SVG-Komponenten in `lib/worksheet/<slug>/assets.tsx` schreiben, ein Commit `feat(<slug>): vorschule assets (svg)`.
3. Designer liefert. Founder reviewt visuell (du fragst: "Sehen die Tiere okay aus? Klick die Preview-URL und schick mir Feedback oder ein OK").
4. Erst nach Founder-OK: weiter zu Phase 3 (dev baut die Topic-Logik mit den Asset-Refs).

Wenn Option B:
1. Founder liefert Asset-Dateien. Du fragst: Pfad? Lizenz? Format (PNG/SVG)?
2. Assets unter `public/vorschule-assets/<slug>/` ablegen (oder PNG in `public/<sinnvolle-gruppe>/` analog zu `public/geometrics/`).
3. Pfade vorab dem dev geben.

---

## Phase 3 — Delegation aus der Hauptsession

### Wenn Pattern-Klon (Spurschrift / Form-Muster):
Spawne nur `dev` mit dem unteren Briefing-Template. Schnell und schlank.

### Wenn neues Layout (Mengen / Pärchen / Labyrinth / Anlaute):
Spawne `dev` (für Module + Generator + Tests + Route + Form + Dispatcher + Registry + VISION) **und parallel** `designer` (für PDF-Layout-Mockup oder direkten Layout-Vorschlag, falls noch kein klares Pattern existiert) in einem einzigen Message-Turn.

### Wenn Assets via Claude-SVG:
Asset-Phase 2 ZUERST (designer-Commit für `assets.tsx`), dann Founder-OK, **dann** dev-Phase.

Marketing nur einbinden, wenn das Topic ungewöhnliche Strings hat (z. B. Anlaut-Wortlisten kurator). Bei reinen Visual-Topics ist marketing überflüssig.

---

## Briefing-Template für `dev` (Vorschule-spezifisch)

Verwende wortwörtlich als `prompt`, eingesetzte Werte ergänzt:

````
Implementiere Vorschul-Topic `<topic-id>` (Klasse 0, Phase 1c, Task <N>). Vollständige End-to-End-Lieferung in 6 Commits, fester Reihenfolge. Niemals --no-verify, niemals --amend, niemals push.

## Spec

Topic-Slug:   <slug, kebab-case>
Topic-ID:     <topic-id>
Fach:         <mathe | deutsch | denken>
Klasse:       [0]   (Vorschule)
Aufgabentyp:  <eine Zeile, z. B. "Mengen 1-10 erkennen und passende Ziffer eintragen">
Konfig-Achsen:
  - <Achse 1>: <Optionen> — Default: <wert>
  - <Achse 2>: <Optionen> — Default: <wert>
  - Lösungsblatt (an/aus) — Default: <an für Mengen/Vergleich, weglassen bei Spurschrift>

Pattern-Wiederverwendung: <"klon von lib/worksheet/letter-tracing/" | "klon von lib/worksheet/pattern/" | "neues Layout mit SVG-Assets aus lib/worksheet/<slug>/assets.tsx" | "neues Layout, eigenes Design">
Theme-relevant:    <ja/nein + Begründung>

## Vorschul-spezifische Layout-Vorgaben

- **Großzügige Skalierung:** Aufgaben-Elemente min. 32pt groß, Schreib-/Klickflächen min. 40pt. Kinder-Hand-Motorik braucht Platz.
- **Wenig Text:** Anweisungen kommen vom Eltern-Vorleseblatt-Pattern (siehe `lib/worksheet/diktat/pdf.tsx`) ODER aus dem Topic-Subtitle. Auf der Aufgaben-Seite selbst max. 1 kurze Anweisung (5-8 Wörter), in Helvetica 14pt, navy.
- **Lineatur** nur wenn Schreibübung — sonst rauslassen. Pattern: 3-Linien-Schreiblernlineatur aus `lib/worksheet/letter-tracing/pdf.tsx`.
- **Lösungsblatt:** weglassen bei Spurschrift / Schwung-Übungen / Labyrinth. Mitgeben bei Mengen / Vergleich / Anlaut / Zuordnen (Eltern brauchen Kontrolle).
- **Kontrast:** Outlines `#1E4A7C` (navy) auf weiß. Akzente nur Brand-Gold `#F4B942`.

## Commit-Reihenfolge (strikt)

1. `feat(<slug>): module (config + generate + tests)` — `lib/worksheet/<slug>/{config.ts, generate.ts, generate.test.ts}`
2. `feat(<slug>): pdf renderer` — `lib/worksheet/<slug>/pdf.tsx` (referenziert ggf. `lib/worksheet/<slug>/assets.tsx`, falls in Asset-Phase angelegt)
3. `feat(<slug>): api dispatcher case` — `app/api/worksheet/generate/route.ts`
4. `feat(<slug>): route + form` — `app/app/<subject>/<short-slug>/{page.tsx, <slug>-form.tsx, <slug>-form-impl.tsx}`
5. `feat(<slug>): topic registry + coverage matrix` — `lib/worksheet/topics.ts`
6. `docs(vision): task <N> <topic-name> shipped` — `VISION.md`

Stage nur die jeweils berührten Files, niemals `git add -A`.

## Module-Pflicht

- `config.ts`: Konstanten-Arrays `as const`, Zod-Schema, Labels-Records. ES-default für neue Boolean-Felder.
- `generate.ts`: Pure function, `mulberry32` PRNG aus `lib/worksheet/multiplikation/generate.ts` kopieren. Anti-Duplikat-Set wenn Pool begrenzt. Seedable für Tests.
- `generate.test.ts`: Zod-Rejection, Count-Constraint, Range-/Domain-Constraints, keine Duplikate, Determinismus, topic-spezifische Invarianten.
- `pdf.tsx`: Document mit "Lernikon" als author/creator/producer. Page-Style `paddingTop: 56, paddingBottom: 64, paddingLeft: 52, paddingRight: 52`. Header (Lernikon + lernikon.de + Title + Subtitle). Footer (LOGO_LOCKUP_BUFFER zentriert + optionaler Free-Watermark). `<ThemeDecoration theme={themeMeta} />` als erstes Kind in JEDER Page. COLOR-Palette ausschließlich. Kein topAccent-Streifen.
- Wenn `assets.tsx` existiert: Import aus `./assets`, Inline-Render via `<AssetName size={40} />` in den Aufgaben-Cells.

## Dispatcher (`app/api/worksheet/generate/route.ts`)

- Imports am Datei-Anfang ergänzen.
- Neuer `case "<topic-id>":` im Switch.
- Bei Multiselects: serverseitig kanonisch sortieren (Pattern: `items: ITEM_IDS.filter((id) => parsed.data.items.includes(id))`).
- RenderResult: filenameBase, logSubject (subject-id), logOperation (kebab-case), logConfig.

## Route + Form

- `page.tsx`: Server Component. Pattern aus `app/app/mathe/multiplikation/page.tsx` oder `app/app/denken/muster/page.tsx` kopieren.
- `<slug>-form.tsx`: dynamic-Wrapper mit `ssr: false`.
- `<slug>-form-impl.tsx`: useLocalSettings (Key `"lernikon.settings.<topic-id>"`), shadcn Card Sections, fetch `/api/worksheet/generate`. PostHog `worksheet_generated` + `paywall_hit` bei 429. ES-default-Destructure für neue Boolean-Felder.

## Topic-Registry (`lib/worksheet/topics.ts`)

- TOPIC_IDS-Eintrag nach den anderen subject-Topics.
- JSDoc-Block (Template aus `mathe-zahlen-schreiben` Zeilen 130-154 oder `denken-muster` Zeilen 463-490 nehmen).
- Registry-Eintrag mit `grades: [0]`, `implemented: true`.
- **comingSoon-Flag entfernen** falls das Topic vorher als comingSoon gelistet war (z. B. `mathe-mengen`).
- Coverage-Matrix Vorschul-Zelle aktualisieren.
- "Echte Lücken"-Liste anpassen.

## VISION.md

- §0 Status-Liste: neuer Task-Eintrag als `[x]`.
- §10 Punkt 3/4/5 (je nach Fach): Vorschul-Lücke als geshipped markieren.
- §11 neuer Task-Block.

## Gotchas

- WinAnsi/Latin-1 (Helvetica): `×` OK, `:` OK, ASCII `-` und `+` OK. NICHT: `÷`, `−`, `–`, `—`, `→`.
- Keine em/en-dashes in User-Facing Strings.
- React-PDF: kein `gap`, SVG-Attribute numerisch, lokale Bilder als Buffer.
- PlaywriteDE SAS: mehrzeichige Wörter via fontkit-Outline (siehe `OutlinedGhostWord` in `lib/worksheet/woerter-abschreiben/pdf.tsx`), Single-Char durch `<Text>` ok.
- **Kid-Display-Schrift:** Ziffern in Aufgaben/Lösungen + Buchstaben/Wörter in Schreib-Übungen → `fontFamily: "PlaywriteDEGrund"`. Helvetica nur für Header, Anweisung, Brand, Footer, Eltern-Vorleseblätter. Pattern für Font-Registrierung: `lib/worksheet/letter-tracing/pdf.tsx`. Nie `fontWeight: "bold"` auf PlaywriteDE-Familien.
- **Achtung Grund-Umlaut-Bug:** Multi-Char-Strings mit ä/ö/ü/ß durch `<Text fontFamily="PlaywriteDEGrund">` rendern die Diakritika falsch positioniert oder gar nicht ("Schüler" → "Schuler"). Reine Ziffern und ASCII-Wörter funktionieren. Bei Vorschule meistens unkritisch (Ziffern-Topics), aber falls dein Topic deutsche Wörter mit Umlauten als Kid-Display zeigt: fontkit-Outline-Workaround. Referenz: `OutlinedGrundText` in `lib/worksheet/faelle/pdf.tsx`.
- Kein `fontWeight: "bold"` auf PlaywriteDE-Familien.
- ThemeDecoration als erstes Kind in JEDER Page (auch Lösungsblatt).
- Kein topAccent-Streifen.
- Rate-Limit: Dispatcher loggt VOR Stream-Start.
- Brand-Presence Pflicht: `Lernikon` + `lernikon.de` oben links, paperplane-Lockup unten zentriert.

## VISION §9 Code Conventions

- Arrow-Params in Klammern, comma-`const`, JSDoc Englisch, `console.warn`, TS strict, Zod an Boundaries, Server Actions bevorzugt, Tailwind only, UI-Strings de-DE.

## Quality Gates

- `npm run typecheck` grün nach jedem Commit.
- `npm test -- <slug>` grün nach Commit 1.
- `npm test` total grün nach Commit 5.

## Reporting

Nach Commit 6:
1. Topic-ID + Route
2. Pfade aller neuen Files (eine Zeile je File)
3. 6 Commit-SHAs in Reihenfolge mit Subject
4. Test-Output: Anzahl neue Tests + Gesamtstatus
5. Wenn du eine Design-Entscheidung außerhalb der Spec getroffen hast: `[decision]`-Marker + Trade-off.
````

---

## Briefing-Template für `designer` (Asset-Phase, wenn Option A SVG-Generation)

Verwende wortwörtlich, eingesetzte Werte ergänzt:

````
Erstelle SVG-React-PDF-Komponenten für Vorschul-Topic `<topic-id>`. Asset-Liste:

<liste der gewünschten Assets, z. B.:>
- Hund
- Katze
- Fisch
- Vogel
- Maus

Ziel-File: `lib/worksheet/<slug>/assets.tsx`. Ein einziger Commit `feat(<slug>): vorschule assets (svg)`.

## Vorgaben

- Komponenten-Form pro Asset:
  ```tsx
  import { Svg, Path, G } from "@react-pdf/renderer";
  import type { ReactElement } from "react";

  export const Hund = ({ size = 32 }: { size?: number }): ReactElement => (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Path d="..." fill="..." stroke="#1E4A7C" strokeWidth={2} />
    </Svg>
  );
  ```
- ViewBox standardisiert `0 0 100 100`.
- Outline-Stroke immer `#1E4A7C` (Brand-Navy), strokeWidth `2`.
- Akzent-Fill `#F4B942` (Brand-Gold) wenn möglich. Sekundärfarben sparsam: rot `#DC2626`, grün `#16A34A`, blau `#3B82F6`, gelb `#FACC15`.
- Stil: geometrisch-stilisiert, KEIN Photorealismus. Maximale Lesbarkeit auf 32-64pt.
- Komplexität: max 15 `<Path>` pro Asset. Komplexere splitten oder vereinfachen.
- Konsistenz: alle Assets eines Topics im gleichen Stil (gleicher Stroke, gleiche Farb-Logik).
- Kein Text in SVG. Numerische Attribute ausschließlich.

## Test-Render

Nach dem Commit liefere zusätzlich:
- Ein Mini-Test-Script (`scripts/preview-<slug>-assets.tsx`, NICHT committen) das die Assets als A4-PDF in `tmp/<slug>-assets-preview.pdf` rendert, damit der Founder visuell reviewen kann.
- Pfad zur Preview-PDF in deiner Antwort.

## Reporting

Commit-SHA + Liste der exportierten Komponenten-Namen + Preview-PDF-Pfad.
````

---

## Referenz-Module zum Spickeln

| Form | Referenz |
|------|----------|
| 3-Linien-Schreiblernlineatur + Ghost-Glyphen | `lib/worksheet/letter-tracing/pdf.tsx`, `lib/worksheet/number-tracing/pdf.tsx` |
| Form-Reihen mit cells + Schwierigkeitspills + Mode-Modi | `lib/worksheet/pattern/pdf.tsx` |
| SVG-Path-Generation via Polarkoordinaten (Kreissektor etc.) | `lib/worksheet/brueche/pdf.tsx` |
| Zwei-Seiten-PDF (Eltern-Vorleseblatt + Kinder-Schreibblatt) | `lib/worksheet/diktat/pdf.tsx` |
| Korpus-basierte Generierung mit Fisher-Yates | `lib/worksheet/wortarten/`, `lib/worksheet/rechtschreibung/` |
| Existierende Vorschul-Topics komplett | `mathe-zahlen-schreiben`, `deutsch-buchstaben-schreiben` (auch K1+K2), `denken-muster` |

---

## Bekannte Vorschul-Stolperfallen

- **Spurschrift-Schreibschrift-Bug:** PlaywriteDE SAS dropt den ersten Glyph mehrzeichiger Wörter. Bei Vorschul-Spurschrift fast immer nur Einzel-Zeichen, also kein Problem für Buchstaben/Ziffern. Bei Topics mit Wörtern: fontkit-Outline-Workaround verwenden, siehe `lib/worksheet/woerter-abschreiben/pdf.tsx`.
- **Klein-Schriftgrößen-Falle:** Erwachsene unterschätzen wie groß Vorschul-Elemente sein müssen. Min. 32pt für Aufgaben-Elemente, min. 40pt für Schreib-/Klickflächen. Lieber 4 Aufgaben pro Reihe statt 6.
- **Kontrast vs. Brand:** Versuch nicht, Brand-Navy aufzuhellen damit es "freundlicher" wirkt. Vorschul-Augen brauchen den vollen Kontrast.
- **Anweisungs-Text:** Vorschul-Kinder lesen nicht. Anweisungen sind für Eltern. Maximal 1 kurze Anweisungs-Zeile auf der Seite, Eltern erklären den Rest mündlich.
- **Theme-Lock-Risiko:** Wenn das Topic theme-spezifische Bildchen rendert (z. B. "zähle die Raketen" mit Theme=Weltraum, aber Kind hat Theme=Einhorn), entscheide explizit: (a) Topic ist theme-agnostisch und nutzt eigene Asset-Sets, (b) Topic nutzt Theme-Assets und ist somit Theme-spezifisch (Theme-Wechsler löst Asset-Wechsel aus). Default: (a). Theme-Decoration in der Ecke ist unabhängig davon.
- **TypeScript-Strict-Compile pro Commit:** Dispatcher-Switch (Commit 3) referenziert `TopicId` aus `TOPIC_IDS`. In Commit 3 minimalen Stub im Array + Registry einfügen, in Commit 5 voller JSDoc + Coverage-Matrix. Pattern wie `[[neues-arbeitsblatt]]`.
- **PostHog-Event-Schema:** `worksheet_generated` erlaubt aktuell nur `{ operation, range_min, range_max, count }`. Vorschul-spezifische Konfigs (lines, shapes, count) gehen nicht durch ohne Schema-Erweiterung. Standard: dev lässt sie raus und markiert `[decision]`.

---

## Skill-Done-Kriterien

1. Alle 6 Module-Commits sind angelegt (Module → PDF → Dispatcher → Route+Form → Registry → VISION).
2. Wenn Asset-Phase: Ein zusätzlicher früherer Commit `feat(<slug>): vorschule assets (svg)` mit Founder-Review-Approved-Status.
3. `npm run typecheck` grün, `npm test` total grün.
4. Dashboard zeigt das Topic für Vorschule (Filter `grades.includes(0)` zieht automatisch aus dem Registry).
5. Founder bekommt eine kompakte Smoke-Test-Anleitung (Konfig-Achsen × Werte zum Durchklicken, plus mindestens 1 PDF-Generation pro Achse).

Wenn 1–4 rot: zurück an dev / designer nachbessern, BEVOR an Founder reportet wird. Punkt 5 ist Founder-Aufgabe.

---

## Workflow-Verweis

Die generische Worksheet-Logik (Pflicht-Checkliste, VISION §9 Konventionen, Gotchas die nicht Vorschul-spezifisch sind) ist im Schwester-Skill [[neues-arbeitsblatt]] dokumentiert. Bei Konflikt: dieser Skill (Vorschul-spezifisch) hat Vorrang für die Vorschul-Specials, der andere Skill bleibt Single Source of Truth für die generischen Module-/Dispatcher-/Form-/Registry-Pattern.
