---
name: assets-aufbereiten
description: Asset-Cleanup-Pipeline für neu reingelegte PNG-Cliparts. Verwende diesen Skill IMMER wenn der Founder sagt sinngemäß "neue Assets reingelegt", "Cliparts bereinigen", "Karo-Hintergrund weg", "Padding zuschneiden", oder direkt /assets-aufbereiten aufruft (optional mit Pfad-Argument). Führt zwei Sharp-basierte Scripts hintereinander aus: `strip-theme-backgrounds.mjs` (Photoshop-Karo zu echtem Alpha) und `trim-theme-padding.mjs` (transparente Ränder weg). Beide sichern Originale unter `<dir>/_originals/`. Skill fragt nach Pfad falls nicht im Argument, zeigt Vorher/Nachher-Statistik, und bietet am Ende einen Commit an.
---

# Skill: Assets aufbereiten

Wenn der Founder neue PNG-Cliparts in einen `public/`-Unterordner legt (z. B. `public/images/coloured/`), sind die meist nicht direkt nutzbar:

1. Photoshop-/Stock-Lib-Exporte haben oft einen gerasterten Karo-Hintergrund statt echtem Alpha — sieht im Preview transparent aus, ist aber ein RGB-Karo-Pattern eingebrannt. Wenn man das so ins PDF rendert, kommt das Karo mit auf den Druck.
2. Cliparts haben oft mehrere Prozent transparentes Padding rundum, was bei `width={N}`-Rendering das Bild kleiner aussehen lässt als nötig — und macht Asset-Größen-Vergleiche zwischen Topics inkonsistent.

Beides wird durch die zwei Scripts unter `scripts/` behoben.

---

## Phase 0 — Pfad klären

Wenn der Founder direkt einen Pfad mitgegeben hat (`/assets-aufbereiten public/images/coloured`): nimm den und überspringe diese Phase.

Wenn nicht: frage mit einem gebündelten `AskUserQuestion`. Default-Optionen:

- `public/images/coloured/` (Recommended falls neu angelegt)
- `public/images/blacknwhite/`
- `public/themes/`
- `public/geometrics/`
- Anderer Pfad (Founder schreibt den selbst)

Nach Antwort: verifiziere via `ls <pfad>` dass das Verzeichnis existiert und mindestens eine `.png` enthält. Wenn nicht: meld dem Founder und stoppe.

---

## Phase 1 — Inventur + Sicherheits-Check

Vor dem Lauf zeige dem Founder:

```bash
ls -lh <pfad>/*.png
ls <pfad>/_originals/ 2>/dev/null
```

- **Wieviele PNGs:** Anzahl, Gesamtgröße. Bei 0 PNGs: stoppe mit Hinweis "keine PNGs im Verzeichnis gefunden".
- **`_originals/`-Folder existiert bereits?** Das passiert wenn der Skill schon mal gelaufen ist auf diesem Pfad. Beide Scripts überschreiben Backups nicht — sie skippen mit "already backed up". Das ist OK, aber zeige dem Founder: "Backup-Folder existiert bereits mit N Dateien. Die Scripts werden vorhandene Backups nicht überschreiben." Wenn der Founder ein frisches Backup will, soll er `_originals/` manuell löschen vor dem Lauf.

---

## Phase 2 — Pipeline ausführen

**Reihenfolge ist wichtig:** erst `strip` (macht Alpha sauber), dann `trim` (schneidet das jetzt-echte Alpha-Padding weg). Andersrum würde trim am Karo-Pattern scheitern.

```bash
node C:/DEV/Dev-Projects/Lernikon/scripts/strip-theme-backgrounds.mjs <pfad>
```

Output: pro File "stripped: <filename>" oder "skipped (no checker background detected): <filename>". Originale werden vor dem Schreiben nach `<pfad>/_originals/` kopiert.

```bash
node C:/DEV/Dev-Projects/Lernikon/scripts/trim-theme-padding.mjs <pfad>
```

Output: pro File "trimmed: <filename> (before: AxB, after: CxD)" oder "skipped (no padding): <filename>".

**Wenn ein Script crasht** (z. B. Sharp-Lib nicht installiert, korrupte PNG, unzulässiges Format wie 16-bit-PNG): zeige dem Founder den Fehler kompakt und stoppe. Der Cleanup ist transactional pro Datei — ein crashender File hindert die anderen nicht (außer das Script bricht generell ab, dann ja).

**Idempotenz beider Scripts:**
- `strip` ist idempotent: zweiter Lauf erkennt dass das Karo schon weg ist und no-ops.
- `trim` ist idempotent: zweiter Lauf erkennt dass kein Padding mehr da ist und no-ops.

Mehrmaliger Aufruf desselben Pfads ist also gefahrlos.

---

## Phase 3 — Verifikation

Nach Lauf zeige Vorher/Nachher-Statistik:

```bash
ls -lh <pfad>/*.png
du -sh <pfad>
du -sh <pfad>/_originals/
```

Hilfreich: prozentuale Größenreduktion. Klassische Werte:
- `strip` allein: -20% bis -40% (Karo weg, Bild bleibt sonst gleich groß).
- `trim` allein: -10% bis -30% (Pixel weniger, je nachdem wie viel Padding).
- Beides zusammen: -30% bis -60%.

Wenn die Reduktion < 5% ist: vermutlich war das Asset schon sauber, kein Schaden, aber auch kein Mehrwert.

Falls möglich: zeige ein einzelnes Vorher/Nachher-Beispiel als ASCII-Stat:

```
einhorn.png:  before 1.2MB (800x800)  →  after 340KB (612x590)
```

---

## Phase 4 — Cleanup-Optionen anbieten

Nach erfolgreicher Pipeline frage den Founder per `AskUserQuestion` was mit `_originals/` passieren soll:

- **`_originals/` behalten (Recommended):** sicherheitshalber lokal lassen, falls die Pipeline zu aggressiv geschnitten hat. `_originals/` sollte im `.gitignore` stehen — wenn nicht, vorschlagen das jetzt hinzuzufügen.
- **`_originals/` löschen:** wenn der Founder zufrieden ist und Platz sparen will. `rm -rf <pfad>/_originals/`.

---

## Phase 5 — Commit-Option

Frage den Founder ob die bereinigten Assets als Commit reingehen sollen:

- **Ja, jetzt committen** → spawne `dev` mit kurzem Brief: `git add <pfad>/*.png` + Commit `chore(assets): clean <slug> (strip checker + trim padding)`. Niemals `git add -A`, niemals `_originals/` mit-stagen (steht im `.gitignore` falls korrekt eingerichtet).
- **Nein, ich will erst manuell prüfen** → kein Commit, Founder reviewt erst.
- **Erst nach Founder-Verifikation** (z. B. wenn er erst ein PDF mit den neuen Assets rendern will) → Skill endet, Founder triggert Commit manuell oder ruft Skill nochmal mit "commit only".

---

## Bekannte Stolperfallen

- **`sharp`-Dependency:** beide Scripts brauchen `sharp` als npm-Modul. Wenn der Founder das frisch installiert hat oder auf neuem Rechner: `npm install` muss gelaufen sein.
- **`_originals/` ungewollt committed:** `.gitignore`-Eintrag sollte `_originals/` (oder spezifischer `public/**/_originals/`) enthalten. Wenn die Scripts schon mal gelaufen sind und `_originals/` nicht gitignored war: schaue mit `git status` ob jemand das versehentlich gestaged hat.
- **Trim-Script wurde im trim-theme-padding.mjs hardcoded.** Vor dem Skill-Lauf prüfen ob die Script-Datei einen CLI-Pfad-Parameter akzeptiert (analog zu strip). Wenn nicht: dev-Brief geben um das zu flexibilisieren, ODER den Founder weisen das Script vor dem Lauf zu editieren.
- **16-bit-PNGs / CMYK-PNGs / SVG-mit-PNG-Endung:** Sharp kann sie nicht alle. Falls Crash: Founder muss das Original in ein 8-bit RGBA-PNG konvertieren (z. B. mit Photoshop oder GIMP) und dann erneut den Skill aufrufen.
- **Echte Karo-Pattern vs. gewollte Karo-Inhalte:** wenn das Bild Schachbrett-Muster als Aufgaben-Element enthält (z. B. ein Karo-Kleid auf einem Charakter), wird `strip` das mit-strippen. Founder muss in dem Fall mit der Hand nacharbeiten oder das Bild aus dem strip-Set ausschließen.

---

## Aufruf-Beispiele

```
/assets-aufbereiten public/images/coloured
/assets-aufbereiten public/images/blacknwhite
/assets-aufbereiten public/themes
/assets-aufbereiten             (fragt Pfad ab)
```

---

## Anti-Pattern (NICHT tun)

- **Niemals `_originals/` löschen** ohne explizite Founder-Bestätigung — das ist das einzige Rollback-Sicherheitsnetz.
- **Niemals `git add -A`** beim Commit-Schritt. Stage nur die geänderten `.png`-Files im Ziel-Pfad.
- **Niemals manuelle Image-Edits** im Workflow (z. B. mit ImageMagick oder Sharp inline) — die Scripts sind die Single Source of Truth, der Skill orchestriert sie nur.
- **Niemals den Skill auf `public/logos/`** ausführen — Logo-Files sind brand-kuratiert und sollen NICHT durch automatische Pipelines laufen.

---

## Skill-Done-Kriterien

1. Pfad ist geklärt und enthält PNGs.
2. `strip` ist gelaufen ohne Crash.
3. `trim` ist gelaufen ohne Crash.
4. Founder hat die Vorher/Nachher-Statistik gesehen.
5. Cleanup-Entscheidung (Originals behalten / löschen) ist getroffen.
6. Commit-Entscheidung (jetzt / später / nie) ist getroffen.

Wenn ein Schritt scheitert: stoppe und reporte. Niemals Skripte parallel laufen lassen — sequenziell, fail-fast.
