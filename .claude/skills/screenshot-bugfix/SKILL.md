---
name: screenshot-bugfix
description: Bugfix-Workflow für Founder-Screenshots. Verwende diesen Skill IMMER wenn der Founder sagt sinngemäß "Screenshot in root gepackt" / "Screenshot liegt in root" / "habe dir ein Bild hinterlegt" / "schau dir das Bildschirmfoto an" — egal ob explizit /screenshot-bugfix aufgerufen oder nur beiläufig erwähnt. Skill findet den neuesten Screenshot in der Projekt-Root, vergleicht ihn mit der letzten Implementation (HEAD-Commit), diagnostiziert den Fehler, fragt bei Unsicherheit nach, delegiert sonst direkt einen Fix an dev, und löscht nach erfolgreichem Fix den Screenshot wieder.
---

# Skill: Bugfix aus Founder-Screenshot

Der Founder schiebt Screenshots als visuelles Bug-Feedback in die Projekt-Root (`C:\DEV\Dev-Projects\Lernikon\Screenshot YYYY-MM-DD HHMMSS.png`). Die meisten Screenshots beziehen sich auf das gerade-geshippte Feature — Layout-Verschiebungen, abgeschnittene Inhalte, falsche Farben, Wording-Stolpersteine, ungewollte leere Seiten, Drucker-Clipping, etc. Dein Job: zuverlässig diagnostizieren, fixen, aufräumen.

---

## Phase 0 — Screenshot finden

Verwende eine Bash-Anweisung um den **neuesten** Screenshot in Root zu finden:

```bash
ls -lt C:/DEV/Dev-Projects/Lernikon/*.png 2>&1 | head -3
```

Erwartetes Pattern: `Screenshot YYYY-MM-DD HHMMSS.png` direkt im Projekt-Wurzelverzeichnis (nicht in Unterordnern). Wenn mehrere existieren: nimm den mit dem neuesten Timestamp im Filename (oder der `ls -lt`-Ausgabe an Position 1).

**Edge Cases:**
- **Kein Screenshot in Root:** sag dem Founder "Ich finde keinen Screenshot in `C:\DEV\Dev-Projects\Lernikon\`. Pfad checken oder Datei neu reinpacken?" und stoppe.
- **Screenshot, aber ältere Datei vom letzten Bugfix übrig:** zeige dem Founder den Filename + Timestamp und frage ob das wirklich der gemeinte ist. Manchmal hat er einen alten Screenshot vergessen zu löschen.
- **Datei ist nicht .png** (z. B. .jpg, .gif, kein Suffix): nimm sie trotzdem an, Read-Tool funktioniert auch mit JPG. Falls die Datei-Endung exotisch ist (.webp, .heic), Founder fragen ob es geht.

---

## Phase 1 — Screenshot analysieren

Verwende den `Read`-Tool mit dem absoluten Pfad zum Screenshot. Claude ist multimodal, das Bild kommt visuell rein:

```
Read tool, file_path: "C:\DEV\Dev-Projects\Lernikon\Screenshot 2026-05-17 205529.png"
```

Schau dir das Bild aufmerksam an. Erfasse:
- **Was ist sichtbar?** (Worksheet-PDF? Web-UI? Console-Error? Browser-Devtools? Print-Preview? OS-Dialog?)
- **Wo ist das Problem?** (visuell isolierbarer Bereich, oder generelle Auffälligkeit?)
- **Was sollte stattdessen sein?** (anhand des Branding, Conventions aus CLAUDE.md, oder gerade-gemerkter Founder-Wünsche aus dem Chat-Kontext)

---

## Phase 2 — Mit letzter Implementation korrelieren

Der Bug hängt fast immer mit dem zuletzt geshippten Code zusammen. Lies den HEAD-Commit:

```bash
git -C C:/DEV/Dev-Projects/Lernikon log -1 --stat
```

Bei Bedarf auch den Diff:

```bash
git -C C:/DEV/Dev-Projects/Lernikon show HEAD
```

Korreliere die geänderten Files mit dem Screenshot-Inhalt:
- Screenshot zeigt ein **PDF**? → die letzten geänderten Files unter `lib/worksheet/<topic>/` (vor allem `pdf.tsx`, `generate.ts`, `config.ts`) sind die heißen Kandidaten.
- Screenshot zeigt eine **Web-Seite**? → Files unter `app/app/`, `components/`, oder `app/(landing)/` sind die Kandidaten.
- Screenshot zeigt einen **Konsolen-Fehler / Stack Trace**? → Source-Files am Stack-Trace-Top sind die Kandidaten.

Wenn der letzte Commit überhaupt nichts mit dem Screenshot-Inhalt zu tun hat: schau dir auch HEAD-1 und HEAD-2 an. Aber: meistens ist es HEAD.

---

## Phase 3 — Diagnose entscheiden

Du hast jetzt: was im Screenshot sichtbar ist + was zuletzt geändert wurde. Bilde eine Hypothese:

- **Layout-Overflow / leere Folgeseite:** Canvas-Höhe + Header + Instruction überschreitet A4-Page (842pt). Pattern wie `f264a46` bei `denken-formen-erkennen`. Fix: Canvas schrumpfen.
- **Form-/Symbol-Cross-Axis falsch ausgerichtet:** `alignItems` fehlt oder default `stretch`/`flex-start` an einer Stelle wo `flex-end` gebraucht wird. Pattern wie `41e8d16` bei rechtem Form-Spaltenrand.
- **Symbole zu klein/groß:** `shapeSize`-Funktion oder `MAX_DIM`-Konstante in `theme-decoration.tsx` oder analog.
- **Falsche Farbe / Brand-Kollision:** `COLOR`-Objekt im PDF-Renderer oder Tailwind-Klassen in Form-Components.
- **Text falsch gerendert:** WinAnsi-Encoding-Issue (U+2192, U+2212, em-dashes), oder PlaywriteDE SAS Glyph-Drop, oder fehlender Multiplikationsschritt im Merkkasten-Walkthrough.
- **Wort/Wording stolperig:** Garden-Path-Satz, redundante Phrase, oder ungewöhnliche Großschreibung — kann pädagogisch problematisch sein.
- **Drucker-Clipping / weißer Rand:** Topaccent / vollflächige Page-Hintergrund-Streifen am Rand. Pattern wie `8b30a64` (topAccent global entfernt).
- **PDF-Generation-Crash:** React-PDF Yoga-Parser-Error wegen String-Attribute, fehlender Buffer, oder unsupported SVG-Syntax.

---

## Phase 4a — Bei klarer Diagnose: dev briefen

Wenn die Diagnose eindeutig ist (z. B. "Canvas ist 620pt, sollte 565pt sein wegen Overflow"): spawne `dev` mit einem präzisen, kurzen Brief.

Brief-Template:

```
Bug-Fix: <kurze Beschreibung des sichtbaren Problems im Screenshot>.

## Ursache

<File:Zeile> — <was steht da aktuell und warum produziert es den Bug>.

## Fix

<konkrete Code-Änderung, möglichst eine Zeile oder ein kleiner Block>.

## Constraints

- Nur <File> anfassen.
- Keine anderen Änderungen.
- Commit: `fix(<scope>): <one-liner>`. Conventional Commits, kein --no-verify, kein --amend, kein push.

## Quality Gate

- `npm run typecheck` grün.

## Reporting

Commit-SHA + 1-Satz Diff.
```

Sobald der dev gemeldet hat: **Phase 5** (Cleanup).

---

## Phase 4b — Bei unklarer Diagnose: Founder fragen

Wenn du zwei oder mehr plausible Hypothesen hast, oder der Screenshot mehrdeutig ist: stelle eine gebündelte `AskUserQuestion` mit 2-3 Hypothesen + Empfehlung.

Beispiel:

```
[AskUserQuestion]
- Frage: "Was ist im Screenshot konkret das Problem?"
- Optionen:
  1. "Die rechten Formen sind zu weit links (Recommended)" — Hypothese A
  2. "Der grüne Hintergrund ist noch da" — Hypothese B
  3. "Die Verbindungspunkte fehlen" — Hypothese C
```

Sobald der Founder geantwortet hat: zurück zu Phase 4a mit der gewählten Hypothese.

**Nicht falsch interpretieren:** wenn der Founder explizit ein Detail nennt ("die linien sind zu kurz"), fokussiere darauf. Wenn er nur "schau es dir an" sagt: du musst selbst urteilen oder fragen.

---

## Phase 5 — Cleanup: Screenshot löschen

Nach erfolgreichem dev-Commit: **lösche den Screenshot** aus Root, damit das Verzeichnis sauber bleibt und der nächste Screenshot nicht mit dem alten verwechselt wird.

```bash
rm "C:/DEV/Dev-Projects/Lernikon/Screenshot YYYY-MM-DD HHMMSS.png"
```

(Quoting beachten — der Filename enthält Leerzeichen.)

**Sicherheit:**
- Nur den einen Screenshot löschen den du in Phase 0 identifiziert hast. Niemals `rm *.png` oder ähnliches.
- Wenn der Fix nicht erfolgreich war (Test-Fail, Typecheck-Fail, Founder lehnt ab): Screenshot NICHT löschen, damit Founder ihn ein zweites Mal nutzen kann.

---

## Phase 6 — Reporten

Knappe Status-Nachricht an den Founder:

- Commit-SHA + Subject in einem Satz.
- Was wurde gefixt (1 Satz).
- Bestätigung dass der Screenshot gelöscht wurde.
- Optional: "Generier nochmal und schau ob's stimmt" — vor allem bei PDF-Layout-Fixes.

Beispiel:

> Geshipped in `f264a46`. Canvas von 620 auf 565pt geschrumpft, damit die leere zweite Seite verschwindet. Screenshot gelöscht. Generier ein neues Blatt zum Verifizieren.

---

## Bekannte Bug-Pattern aus früheren Sessions

| Symptom im Screenshot | Wahrscheinliche Ursache | Bekannter Fix |
|----------------------|------------------------|---------------|
| Leere zweite/dritte PDF-Seite | Canvas + Header + Instruction > nutzbare A4-Höhe | Canvas-Höhe schrumpfen (Pattern: `f264a46`) |
| Rechte Spalte klebt links | `alignItems` fehlt oder default | `alignItems: "flex-end"` (Pattern: `41e8d16`) |
| Grüne/farbige Hintergründe ungewollt | Inline-Background-Style übrig | `backgroundColor` entfernen + COLOR-Token aufräumen (Pattern: `b923d0c`) |
| Topaccent-Streifen am Druckerrand abgeschnitten | topAccent reicht zu nah an Page-Rand | topAccent komplett entfernen (Pattern: `8b30a64`) |
| Erstes Glyph mehrzeichiger Schreibschrift-Wörter fehlt | PlaywriteDE SAS Glyph-Drop-Bug | fontkit-Outline-Workaround (Pattern: `OutlinedGhostWord` in `lib/worksheet/woerter-abschreiben/pdf.tsx`) |
| Garden-Path-Satz im Walkthrough | Zweite identische Zahl ohne Brücke | Multiplikationsschritt explizit machen (Pattern: `ff71114`) |
| Bubble-Inhalt unscharf / unleserlich | Asset-Größe vs. Bubble-Größe mismatch | Bubble vergrößern + transparenten Background oder größeres Asset (Pattern: `755905b`) |
| `÷` `→` `−` em-dash im PDF-Text | WinAnsi/Latin-1 Helvetica kann's nicht | Auf `:`, ASCII `-`, `(...)`-Klammer-Notation umstellen |
| `fontWeight: "bold"` poisiert React-PDF Font-Cache | PlaywriteDE hat kein Bold-Variant | `fontWeight` nur auf Familien anwenden die Bold haben (Helvetica-Bold etc.) |

---

## Konstanten und Pfade

- **Projekt-Root:** `C:\DEV\Dev-Projects\Lernikon\`
- **Screenshot-Namenspattern:** `Screenshot YYYY-MM-DD HHMMSS.png`
- **PDF-Renderer-Pfade:** `lib/worksheet/<topic>/pdf.tsx`
- **Web-UI-Pfade:** `app/app/<route>/`, `components/`
- **Brand-Color-Tokens:** Navy `#1E4A7C`, Gold `#F4B942`, TextDark `#1F2937`, TextMuted `#6B7280`, Line `#E5E7EB`
- **Standard-Commit-Scope:** Topic-Slug (z. B. `division`, `denken-formen-zuordnen`) oder funktionaler Bereich (z. B. `dashboard`, `vision`)

---

## Anti-Pattern (NICHT tun)

- **Niemals den Screenshot committen.** Er gehört nicht ins Repo.
- **Niemals den Fix als `--amend` machen.** Immer neuen Commit pro Fix (siehe `[[feedback_dev_commits_per_change]]`).
- **Niemals einen Fix raten ohne den Screenshot zu lesen.** Read-Tool ist Pflicht in Phase 1.
- **Niemals "alle .png in Root löschen".** Targeted-rm nur auf den identifizierten Screenshot.
- **Niemals den Founder eine Liste mit 5 Hypothesen vorlegen.** Max 3, mit klarer Recommendation.
- **Niemals einen `subagent_type: "ceo"`-Hop einbauen.** Hauptsession IST der CEO (siehe `[[main-session-is-ceo]]`), spawn direkt dev.

---

## Skill-Done-Kriterien

1. Screenshot wurde gelesen und analysiert.
2. Bug ist diagnostiziert (entweder durch dich oder durch Founder-Antwort auf Hypothesen).
3. Ein Fix-Commit liegt vor (`fix(<scope>): ...`), Typecheck grün.
4. Screenshot ist aus Root gelöscht.
5. Founder hat eine knappe Status-Bestätigung erhalten.

Wenn 1–4 rot: zurück zur entsprechenden Phase. Wenn Founder den Fix ablehnt (selten): Screenshot WIEDER reaktivieren oder zumindest nicht löschen.
