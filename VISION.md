# VISION.md — Worksheet Generator for Parents (DACH)

> Brand: `Lernikon` (lernikon.de — Lernen + Lexikon)
> Target market: Germany, Austria, Switzerland
> Target MRR: €5k+ within 12–18 months
> Build philosophy: Ship fast, stay narrow, no scope creep until 100+ active users

---

## 0. Status — 2026-05-12

**Scope pivot 2026-05-12 (founder decision):** Long-term goal expanded from "Grundschul-Mathe only" to **Vorschule bis Klasse 10, mehrere Fächer**. Current implementation phase narrows that to **Vorschule bis Klasse 4** with two subjects: Mathe (done) und Deutsch (Vorschule first). Klasse 5–10 plus weitere Fächer = Phase 2. Previous "Phase 1 = Math only" is now renamed Phase 1a; new in-flight work is Phase 1b (Dashboard + Deutsch Vorschule).

Phase 1a code complete (Tasks 1–13). Local dev runs end-to-end on `npx supabase start` + `npm run dev`. Task 14 (production deploy) pending. Phase 1b begins now.

- [x] Task 1 — Project Init (Next.js 16, React 19, Tailwind v4, shadcn/ui on Base UI)
- [x] Task 2 — DB Schema + RLS, plus `is_admin` migration
- [x] Task 3 — Auth — **deviation: email+password** instead of magic link per founder request (signup, signin, forgot/reset)
- [x] Task 4 — Onboarding (single child profile, theme picker)
- [x] Task 5 — Math Generator UI (Addition / Subtraktion / Gemischt; range 1–100; 5/10/15/20 problems)
- [x] Task 6 — Math Generation Logic (8 vitests passing, seedable PRNG, no negative subtractions)
- [x] Task 7 — PDF Rendering (rebuilt minimal after yoga `unsupported number` crash; SVG decoration removed for stability — re-add with numeric attrs only)
- [x] Task 8 — Rate Limit (3/24h free; admins + paid bypass)
- [x] Task 9 — Stripe (Checkout + Webhook + Billing Portal; **TODO**: server-side PostHog capture for `subscription_started/canceled`)
- [x] Task 10 — Account Page (status, child editor, portal/sign-out)
- [x] Task 11 — Landing Page (hero, features, pricing, FAQ, JSON-LD)
- [x] Task 12 — Legal Templates (`/impressum`, `/datenschutz`, `/agb` with `[TODO:]` markers — **needs lawyer review before launch**)
- [x] Task 13 — Analytics (PostHog client-side, consent-gated)
- [ ] Task 14 — Deployment (Vercel + Supabase Cloud + Stripe live keys + custom domain + Lighthouse)
- [x] Task 15 — Dashboard + IA (Phase 1b) — `/app` Dashboard, Math gewandert nach `/app/mathe/rechnen`, topic-discriminator-Dispatcher
- [x] Task 16 — Grade enum erweitern: Vorschule + Klasse 1–4 (Phase 1b) — Migration + `formatGrade` Helper
- [x] Task 17 — Deutsch Vorschule: Buchstaben schreiben (Spurschrift) (Phase 1b) — neuer Generator + 3-Linien-Schreiblernlineatur, Druck + Schreibschrift (Playwrite DE Grund / SAS)
- [x] Task 18 — Multi-Kind (Phase 1c) — Free=1 / Pro=3, Kind-Selector im Dashboard, Add/Edit/Delete im Account
- [x] Task 19 — Mathe Vorschule: Zahlen schreiben (Phase 1c) — Ziffern 0–9 Spurschrift, Wiederverwendung des 3-Linien-Layouts
- [x] Task 20 — Mathe Klasse 3: Einmaleins (Phase 1c) — Reihen 1–10, Ampel-Schwierigkeit, 10/20/30 Aufgaben, optionales Lösungsblatt
- [x] Task 21 — Denken/Logik: Muster fortsetzen (Phase 1c) — neues Fach „Denken" (lila), Formen-Reihen mit Lückenmodi, Vorschule
- [x] Task 22 — Deutsch Klasse 1–2: Wörter abschreiben (Phase 1c) — kuratiertes Korpus, 3-Linien-Lineatur, Druck + Schreibschrift (SAS via fontkit-Outline-Workaround)
- [x] Task 23 — Deutsch Klasse 2: Diktat (Phase 1c) — Volldiktat-Mode, zwei-Seiten-PDF (Eltern-Vorleseblatt + Kinder-Schreibblatt mit 3-Linien-Lineatur)
- [x] Task 24 — Mathe Klasse 4: Schriftliche Verfahren (Phase 1c) — Addition + Subtraktion im Spaltenlayout mit Übertrag, optionales Lösungsblatt
- [x] Task 25 — Deutsch Klasse 3: Rechtschreibung (Phase 1c) — Lückenwörter zu ie/i/ih, ss/sz, Doppelkonsonanten, Wortendungen; Gemischt-Modus; optionales Lösungsblatt
- [x] Task 26 — Mathe Klasse 4: Brüche (Phase 1c) — Multi-Modus (Darstellen / Vergleichen / Rechnen), SVG-Kreissektor + Rechteck-Darstellung, optionales Lösungsblatt
- [x] Task 27 — Mathe Klasse 4: Schriftliche Division (Phase 1c) — Heruntergeholt-Verfahren mit Abzieh- oder Ergänzungsmodus, optional mit Rest, optionaler Merkkasten, optionales Lösungsblatt
- [x] Task 28 — Vorschule Denken: Formen erkennen (Phase 1c) — 7 geometrische Formen als SVG, 1 Aufgabe pro Sheet, optionales Lösungsblatt
- [x] Task 29 — Vorschule Denken: Formen zuordnen (Phase 1c) — 4/6/8 Paerchen, farbige Formen links, weisse Silhouetten rechts
- [x] Task 30 — Mathe Vorschule: Mengen 1-10 (Phase 1c) — geometrische Form-Gruppen mit Ziffer-Eintrags-Kastchen, Bereich 1-5/1-10, 6/12 Aufgaben
- [x] Task 31 — Mathe Vorschule: Zahlen mit Marienkaefern (Phase 1c) — Ziffer 1-10 erkennen und entsprechend viele Punkte selbst auf einen Marienkaefer malen, schwarz-weiss druckfreundlich, 6 oder 10 Aufgaben

Repo: https://github.com/Pierce-Chang/Lernikon (branch `main`).

---

## 1. Mission

Build a web-first SaaS that lets parents in the DACH region generate beautiful, printable, personalized Übungsblätter for their children (Vorschule bis Klasse 10, ca. 5–16 Jahre) in under 30 seconds — across multiple subjects (Mathe, Deutsch, …). The product fills a clear market gap: existing free generators look outdated and ad-supported; professional tools (Worksheet Crafter, tutory.de) are built for teachers and far too complex for casual parental use. Nobody serves the parent who just wants to hand their kid a nice-looking sheet on a Saturday morning.

---

## 2. Target User

**Primary persona:** German-speaking parent, 30–45 years old, with one or more children in Vorschule, Grundschule or Sekundarstufe I (ca. 5–16 Jahre). Tech-comfortable but time-poor. Currently prints worksheets from random Google search results. Frustrated by inconsistent quality, irrelevant content, and zero personalization. Willing to pay €5–10/month for a tool that saves time and motivates the kid.

**Secondary personas:** Grandparents, tutors, homeschool parents.

**Explicitly NOT the target:** Teachers building classroom material. Different needs, different competitors, different buying process.

---

## 3. The Problem

1. Parents waste 10+ minutes per session hunting for printable worksheets
2. Free generators produce ugly, motivation-killing black-and-white sheets
3. Professional tools cost €100+/year and require learning a complex editor
4. No tool personalizes content (child's name, favorite theme, current school topic)
5. No tool maps to the DACH school curriculum (Bundesland-specific Lehrpläne)

---

## 4. The Solution

A web-based generator (PWA-ready) with this user flow:

1. Dashboard zeigt Tiles: Fach → Klasse → Thema (z. B. Mathe → Klasse 2 → Addition, oder Deutsch → Vorschule → Buchstaben schreiben)
2. Parent picks the topic (and child profile if multiple)
3. Picks topic-specific configuration (Mathe: range + count; Deutsch Buchstaben: welche Buchstaben, Groß/Klein, Zeilen pro Buchstabe; …)
4. Optional: theme (Dinosaurs, Unicorns, Space, Horses, Cars, …) für visuelle Personalisierung wo es passt
5. Clicks "Erstellen" → receives a beautifully designed PDF (mit Lösungsblatt wo sinnvoll)

Behind the scenes: AI personalizes word problems / story sentences using the child's name and chosen theme where appropriate. PDFs are pixel-perfect A4, print-ready, modern typography, theme illustrations that decorate without distracting.

---

## 5. Market Positioning

| Segment | Examples | Weakness |
|---|---|---|
| Free generators | grundschule-arbeitsblaetter.de, grundschulstoff.de, mathworksheetcreator.com | Outdated UI, ad-supported, generic output, no personalization |
| Professional teacher tools | Worksheet Crafter (€100+/yr), tutory.de | Built for teachers, complex editor, overkill for parents |
| Learning apps (digital) | Anton, Schlaukopf | Different category (on-screen exercises, not printable sheets) |

**Positioning line (German):** "Schöne, druckfertige Übungsblätter für dein Kind — in 30 Sekunden, personalisiert mit dem Lieblingsthema."

**Moat:** DACH-localization, curriculum awareness per Bundesland, theme system, AI personalization — none of which existing free or pro tools combine.

---

## 6. Core Differentiators

1. **Theme-based personalization** — the kid picks the visual world; the exercises stay the same but get framed in dinosaurs, unicorns, space, etc. (wo es Sinn ergibt — bei reinen Schreibübungen z. B. nicht).
2. **AI-personalized word problems / story sentences** — `gpt-4o-mini` generates content featuring the child's name and theme preferences (Mathe-Sachaufgaben, Deutsch-Lückentexte usw.)
3. **Vorschule bis Klasse 10, mehrere Fächer** — ein Tool für die ganze Schullaufbahn (Phase 1b: Vorschule–Klasse 4 in Mathe + Deutsch; danach iterativ erweitert)
4. **DACH curriculum awareness** — topics auto-match official Lehrpläne for the selected grade and Bundesland (Phase 3, not MVP)
5. **Multi-child support** — Family Pro plan supports up to 3 child profiles
6. **Auto-generated answer keys** — als separates Blatt wo sinnvoll (Mathe ja, Buchstaben-Spurschrift nein)
7. **Modern PDF design** — print-ready, kid-friendly typography, NOT Times New Roman from 1998
8. **Weekly bundles** — "generate 5 sheets for the coming week" as a single action (Phase 2)

---

## 7. Non-Goals (DO NOT BUILD in Phase 1)

To stay focused, the MVP explicitly does NOT include:

- Native iOS/Android apps (web/PWA only)
- Teacher features (classroom management, student tracking, lesson plans)
- Digital on-screen exercises (Anton/Schlaukopf-style — different category, do not enter)
- Video tutorials
- Live tutoring or human help
- Gamification with avatars, points, leveling (theme system carries enough motivation in Phase 1)
- Photo scan + auto-correction (Phase 4)
- Sharing worksheets between parents / community library
- Klasse 5–10 content (Phase 2 — current implementation phase is Vorschule bis Klasse 4)
- Weitere Fächer jenseits von Mathe + Deutsch (Englisch, Sachunterricht etc. = Phase 2)
- Weitere Themes über Weltraum hinaus (kommt in Phase 1c/2, nicht jetzt)

If the founder requests any of these during MVP build, the agent should respond with: "This is out of MVP scope per VISION.md. Adding to Phase 2 backlog. Continuing with current task."

---

## 8. Tech Stack

| Layer | Choice | Rationale |
|---|---|---|
| Frontend | Next.js 15 (App Router) + React 19 + TypeScript | SEO-critical for organic growth via "Mathe Arbeitsblätter Klasse 2" queries; PWA-ready |
| Styling | Tailwind CSS + shadcn/ui (de-DE locale) | Fastest path to a modern, consistent UI |
| Backend | Next.js Server Actions + API routes | Co-located with frontend, type-safe end-to-end |
| Database | Postgres via Supabase | Managed, GDPR-compliant (EU region), RLS built-in |
| Auth | Supabase Auth, magic-link email | No password friction; matches the audience expectation |
| Payments | Stripe Subscriptions | Handles EU VAT, supports SEPA + Klarna |
| PDF generation | `@react-pdf/renderer` | Declarative, design-controllable, no Puppeteer overhead |
| AI | OpenAI API (`gpt-4o-mini`) for word problems | Cost <€0.001 per worksheet |
| Hosting | Vercel + Supabase (EU region) | Standard, cheap, scales |
| Analytics | PostHog (EU cloud or self-hosted) | GDPR-friendly, captures funnels |

Total expected infra cost at MVP scale: **<€60/month**.

---

## 9. Code Conventions (MANDATORY for AI Agent)

The agent MUST follow these conventions in all generated code:

1. **No `await` inside loops.** Use `Promise.all` combined with `.map()` for parallel async operations.
2. **Arrow function parameters always in parentheses.** Write `(entry) => {}`, never `entry => {}` — even for a single parameter.
3. **Comma-separated `const` / `let` declarations.** Group related declarations: `const a = 1, b = 2, c = 3;` rather than three separate `const` statements.
4. **JSDoc comments in simple English**, matching the style of existing JSDoc in the project.
5. **Use `console.warn` instead of `console.log`** for any temporary debug or test log entries.
6. **TypeScript strict mode.** No `any`. Prefer `unknown` + narrowing.
7. **Zod schemas for all external boundaries** — API inputs, environment variables, third-party responses.
8. **Server Actions over API routes** for mutations whenever possible.
9. **One component per file.** Colocate tests and hooks next to components.
10. **No CSS-in-JS or CSS modules.** Tailwind only.
11. **Kid-Display-Schrift in PDFs:** Ziffern und Buchstaben, die Kinder direkt lesen oder schreiben (Aufgaben-Operanden, Lösungs-Antworten, Tracing-Glyphen, Lückenwörter), rendern in `PlaywriteDEGrund`. Header/Anweisungen/Brand/Footer bleiben Helvetica. SAS nur für Schreibschrift-Toggle in Tracing-Topics. SAS-Multi-Char braucht fontkit-Outline-Workaround; Grund-Multi-Char läuft sauber durch `<Text>`.

---

## 10. MVP Scope

**Long-term reach:** Übungsblätter für **Vorschule bis Klasse 10**, mehrere Fächer (Mathe, Deutsch, später Englisch / Sachunterricht / …).

**Current implementation phase:** **Vorschule bis Klasse 4**, zwei Fächer (Mathe — vorhanden, Deutsch — Vorschule first). Klasse 5–10 und weitere Fächer sind Phase 2.

### Phase 1a — Math foundation (✅ done 2026-05)

Built and working end-to-end:

1. Landing page (one route, SEO-optimized)
2. Email + password signup via Supabase (deviation from original magic-link plan — see §13)
3. Onboarding: one child profile (Name + Klasse 1–4 + Theme „Weltraum")
4. Math generator UI: Addition / Subtraktion / Gemischt, Zahlenraum 1–100, 5 / 10 / 15 / 20 Aufgaben, Theme „Weltraum"
5. PDF generation (Aufgabenblatt + separates Lösungsblatt)
6. Free tier: 3 worksheets per 24 h window, Footer-Tag „Kostenfreie Version von lernikon.de · Family Pro entsperrt alle Themes"
7. Family Pro via Stripe Checkout (€7,99/Monat oder €59/Jahr): unbegrenzt, kein Footer-Tag
8. Account page (Abo verwalten, Kindprofil editieren)
9. Legal pages: Impressum, Datenschutz, AGB (with `[TODO: lawyer-review]` markers)
10. Analytics: PostHog client-side, consent-gated

### Phase 1b — Dashboard + first non-math subject (in progress)

1. Dashboard at `/app` replaces the single `Generator` page: tile grid `Fach → Klasse → Thema`, History der letzten Arbeitsblätter
2. Header-Nav: „Übersicht" / „Mein Konto" / „Abmelden" (kein „Generator"-Eintrag mehr)
3. Math generator wandert nach `/app/mathe/[topic]`; Generator-Architektur generalisiert für mehrere Übungstypen (Math word problems vs. Spurschrift sind grundlegend verschiedene PDF-Layouts und Configs)
4. Grade enum erweitert von `1–4` auf `Vorschule, 1, 2, 3, 4` (DB: `children_profiles.grade` als `int` mit `0` = Vorschule, CHECK `0..10` für spätere Phase 2)
5. **Neuer Übungstyp: Deutsch Vorschule — Buchstaben schreiben (Spurschrift)**
   - Konfig: Buchstaben-Multiselect (A–Z), Groß/Klein/Beides, Zeilen pro Buchstabe (1 / 2 / 3 / 4), Schrift (Druck Playwrite DE Grund / Schreib Playwrite DE SAS)
   - PDF: 3-Linien-Schreiblernlineatur (Oberlinie, Mittellinie, Grundlinie), ghost-glyph links pro Zeile, Rest zum Nachschreiben leer
   - Kein Lösungsblatt
   - Server sortiert die Auswahl in kanonische A→Z-Reihenfolge, unabhängig von Client-State
   - Brand-Presence wie Mathe (lernikon.de oben + Footer-Lockup)

### Phase 1c — Multi-Kind + Content-Tiefe + Conversion-Mechanik (in progress)

1. ✅ Multi-Kind-Support (Task 18 erledigt): Free = 1 Kind, Family Pro = bis zu 3 Kinder. Kind-Selector im Dashboard. Account-Liste statt Single-Editor.
2. ✅ Theme-Expansion + Theme-Paywall (geshippt): 5 Themes (Weltraum, Einhorn, Pferde, Autos, Dinosaurier). Free behält „Weltraum", Pro entsperrt alle Themes. Stärkster kid-driven Conversion-Hebel.
3. Mehr Mathe-Topics:
   - ✅ Vorschule — Zahlen schreiben 0–9 (Task 19, geshippt)
   - ✅ Klasse 3 — Einmaleins (Task 20, geshippt)
   - ✅ Vorschule — Mengen 1-10 (Task 30, geshippt)
   - ✅ Vorschule — Zahlen mit Marienkaefern (Task 31, geshippt)
   - ✅ Klasse 4 — schriftliche Verfahren (Task 24, geshippt)
   - ✅ Klasse 4 — Brüche (Task 26, geshippt)
   - ✅ Klasse 4 — schriftliche Division (Task 27, geshippt)
4. Mehr Deutsch-Topics:
   - ✅ Klasse 1–2 — Wörter abschreiben (Task 22, geshippt)
   - ✅ Klasse 2 — Diktate (Task 23, geshippt)
   - ⏳ Klasse 2 — Wortarten
   - ✅ Klasse 3 — Rechtschreibung (Task 25, geshippt)
   - ⏳ Klasse 3 — Leseverstehen
   - ⏳ Klasse 4 — Aufsatz-Bausteine, Grammatik
5. Neues Fach „Denken" (Phase 1c):
   - ✅ Vorschule — Muster fortsetzen (Task 21, geshippt). Fach-Farbe lila (`#9333EA`), unabhängig von Mathe/Deutsch positioniert.

### Conversion-Strategie (Stand 2026-05-12, vom CEO entschieden)

Pre-Launch-Posture: **wenig restrictivity, viel Daten sammeln**. Reasoning: ohne aktive User ist jede Paywall-Härtegrad-Entscheidung Spekulation. Erst Funnel-Daten, dann tunen.

- **Quota bleibt bei 3/Tag** (nicht 2). Reduktion erst wenn `paywall_hit{trigger:rate_limit}` zeigt dass aktive User regelmäßig dran scheitern.
- **Deutsch bleibt komplett free** (nicht ab Klasse 1 Pro). Top-of-Funnel-Schutz für die frische Multi-Subject-Botschaft. Re-evaluate in Phase 2 mit 50+ aktiven Konten.
- **Theme-Paywall** ist der primäre Conversion-Hebel, kommt mit Theme-Expansion (Bullet 4 oben).
- **Lösungen-Blatt bleibt für Free verfügbar** — table stakes für Eltern. Nicht hinter Paywall stecken.
- **AI-Sachaufgaben** (gpt-4o-mini) sind Pro-only **wenn** sie kommen. Phase 2.
- **Watermark = dezenter Footer-Tag, kein diagonales Wasserzeichen** (CEO-Entscheidung 2026-05-12). Pre-Launch ist freundlicher besser; aggressives Watermark riskiert Bouncing bevor wir Funnel-Daten haben. Wording: „Kostenfreie Version von lernikon.de · Family Pro entsperrt alle Themes" — koppelt Brand + den primären Theme-Hebel.
- Paywall-Event-Taxonomie (`paywall_hit{trigger}`) ist auf `rate_limit | child_slot_locked | theme_locked | subject_locked | feature` typisiert — siehe `lib/analytics/events.ts`. Trigger-Werte feuern erst sobald die jeweilige Paywall geshippt ist.

### Phase 2 — Klasse 5–10 + weitere Fächer

Sobald 1c stabil ist und ≥ 50 aktive Konten erreicht sind: Klasse 5–10 in Mathe + Deutsch, dann neue Fächer (Englisch, Sachunterricht, …).

The agent must refuse scope additions außerhalb des aktuellen Phase-1b/1c-Plans, bis Phase 1b im Produktiv-Deploy ist (Task 14).

---

## 11. Concrete Tasks for the AI Agent

Execute in order. Each task is a deliverable. Mark complete only when working end-to-end.

### Task 1 — Project Initialization
- Initialize Next.js 15 project (App Router, TypeScript, Tailwind)
- Install dependencies: `@react-pdf/renderer`, `zod`, `stripe`, `@supabase/supabase-js`, `@supabase/ssr`, `posthog-js`, `@tanstack/react-query`, `lucide-react`
- Set up shadcn/ui (`npx shadcn@latest init`)
- Configure ESLint + Prettier matching the Code Conventions section
- Create `lib/env.ts` with Zod-validated environment variables
- Set up `.env.example` with all required keys documented

### Task 2 — Database Schema
Create Supabase migrations:
- `users` extension (id, email, stripe_customer_id, subscription_status, subscription_period_end, created_at)
- `children_profiles` (id, user_id FK, name, grade, theme_preference, created_at)
- `worksheets_log` (id, user_id FK, child_id FK, subject, operation, config_json, generated_at) — used for rate-limiting and analytics
- Row Level Security policies on all tables (users can only read/write their own rows)
- Seed script for local dev

### Task 3 — Authentication
- Supabase magic-link signup/login flow
- `middleware.ts` to protect `/app/*` routes
- Sign-out flow
- Server-side helpers to get current user in Server Components

### Task 4 — Onboarding
- After first sign-in, redirect to `/onboarding` if no child profile exists
- Form: child's name + grade (1–4 dropdown) + theme picker (Weltraum only for MVP, but UI built to extend)
- On submit, create `children_profiles` row, redirect to `/app/generator`

### Task 5 — Generator UI
- Route: `/app/generator`
- Form fields: subject (Math, disabled placeholder for future subjects), operation (Addition / Subtraktion), number range (slider 1–100), exercise count (radio: 5 / 10 / 15 / 20)
- Show selected child's name + theme (read-only chip)
- "Arbeitsblatt erstellen" button → triggers Server Action

### Task 6 — Worksheet Generation Logic
- Pure function `generateProblems(config)` that returns an array of `{ question: string, answer: number }`
- Validate config with Zod
- Ensure no duplicate problems within a single worksheet
- Ensure no negative results for subtraction
- Unit tests for edge cases (range 1–10, range 1–100, all exercise counts)

### Task 7 — PDF Rendering
- React-PDF document, A4 portrait
- Page 1: header (child's name, date, "Übungsblatt"), grid of problems with handwriting space below each
- Page 2: answer key with same layout
- Theme "Weltraum": subtle background graphics (small planet/star SVG decorations in corners) — must NOT distract from problems
- Footer with watermark for free users ("Erstellt mit LernZettel — lernzettel.de")
- **Brand presence on every worksheet (free + paid, every page):** small + discreet `lernikon.de` mark near the top of the page, and a more prominent "Lernikon" wordmark + logo in the footer. Logo asset is TBD — leave a sized placeholder slot until the founder commissions one. This is distinct from the free-tier watermark above; paid users still get the brand presence, just without the watermark line.
- Stream the PDF as a download (`Content-Disposition: attachment`)

### Task 8 — Free Tier Rate Limit
- Server-side check before generation: count rows in `worksheets_log` for the current user in the past 24 hours
- If user is free AND count >= 3, return 429 with upgrade CTA
- Display remaining count in UI: "Heute noch 2 von 3 Arbeitsblättern verfügbar"

### Task 9 — Stripe Integration
- Create a Stripe Product: "Family Pro" with two prices: €7.99/month and €59/year (set as recurring)
- Stripe Checkout session for new subscriptions
- Webhook handler at `/api/stripe/webhook` for `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`
- Update `users.subscription_status` and `subscription_period_end` from webhooks
- Stripe Billing Portal link on `/app/account` for self-service cancellation
- Local dev: use Stripe CLI for webhook forwarding

### Task 10 — Account Page
- Route: `/app/account`
- Display: email, subscription status, period end (if subscribed), child profile (name + grade, editable)
- Buttons: "Abo verwalten" (Stripe Portal), "Abmelden"

### Task 11 — Landing Page
- Route: `/`
- Hero: headline ("Schöne Übungsblätter für dein Kind — in 30 Sekunden"), subheadline, CTA button "Kostenlos starten", hero image (mockup of a generated worksheet)
- Three feature blocks: "Personalisiert", "Druckfertig", "Mit Lösungen"
- Pricing section: Free vs Family Pro side-by-side
- FAQ: 6–8 common parental questions
- Footer with legal links
- SEO meta tags targeting "Mathe Arbeitsblätter Klasse 1 / 2 / 3 / 4 ausdrucken"
- Schema.org `SoftwareApplication` JSON-LD

### Task 12 — Legal & Compliance
- `/impressum` — Impressum page (placeholder, founder fills in)
- `/datenschutz` — DSGVO-compliant privacy policy (draft template, founder to review with lawyer before launch)
- `/agb` — Terms of service
- Cookie consent banner (only set non-essential cookies after consent)
- Confirm Stripe is configured to handle EU 14-day right of withdrawal

### Task 13 — Analytics
- PostHog SDK integration
- Track events: `signup_completed`, `onboarding_completed`, `worksheet_generated`, `paywall_hit`, `checkout_started`, `subscription_started`, `subscription_canceled`
- Build a funnel dashboard: visit → signup → first worksheet → paywall hit → paid

### Task 14 — Deployment
- Deploy to Vercel
- Connect custom domain (lernzettel.de or final brand name)
- Set environment variables in Vercel project settings
- Configure Supabase EU region
- Generate `sitemap.xml` and `robots.txt`
- Lighthouse audit, target >90 on Performance and SEO

### Task 15 — Dashboard + IA (Phase 1b)
- `/app` wird Dashboard (heute leitet es nur weiter zu `/app/generator`)
- Tile-Grid: Fächer (Mathe, Deutsch) → klick → Klassen-Tiles (Vorschule, 1, 2, 3, 4) → klick → Themen-Liste → klick → topic-spezifischer Generator
- History-Block: letzte 5 Arbeitsblätter mit „Neu generieren"-Aktion (Source: `worksheets_log`)
- Header-Nav: „Übersicht" (→ `/app`) / „Mein Konto" (→ `/app/account`) / „Abmelden". Kein „Generator"-Link mehr.
- Math generator wandert von `/app/generator` nach `/app/mathe/[topic]` (z. B. `/app/mathe/addition`, `/app/mathe/subtraktion`, `/app/mathe/gemischt`). Alte Route 301-redirect oder neu mappen.
- Übungstyp-Abstraktion: Server-seitig einen `WorksheetKind`-Discriminator, der die Generator-Konfig + PDF-Renderer auswählt.

### Task 16 — Grade enum erweitern (Phase 1b)
- Migration: CHECK-Constraint auf `children_profiles.grade` (jetzt `int`) auf `0..10` setzen; `0` bedeutet Vorschule
- Onboarding-Form + Account-Editor: Dropdown listet „Vorschule, 1. Klasse, 2. Klasse, 3. Klasse, 4. Klasse" (Phase 1b); Klasse 5–10 erst in Phase 2 freischalten
- Label-Helper `formatGrade(n: number): string` in `lib/format/grade.ts` für UI-Display
- Existing rows (Klasse 1–4) bleiben unverändert

### Task 17 — Deutsch Vorschule: Buchstaben schreiben (Spurschrift) (Phase 1b)
- Route: `/app/deutsch/buchstaben-schreiben`
- Konfig-UI: Buchstaben-Multiselect (A–Z), Case-Select (Großbuchstaben / Kleinbuchstaben / Beides), Zeilen pro Buchstabe (1 / 2 / 3 / 4), Schrift (Druck Playwrite DE Grund / Schreib Playwrite DE SAS)
- Pure function `generateLetterTracing(config) → { blocks: { char, displayCase, lines }[] }`; Zod schema; vitest für Konfig-Validierung
- PDF: 3-Linien-Schreiblernlineatur (Oberlinie, Mittellinie, Grundlinie); ghost-glyph links pro Zeile, Rest leer zum Nachfahren
- Server sortiert die Buchstaben-Auswahl in kanonische A→Z-Reihenfolge (defensiv gegen stale Client-State)
- Kein Lösungsblatt
- Brand-Presence wie Mathe (lernikon.de Top + Footer-Lockup)
- Rate-Limit-Eintrag analog Mathe (zählt gegen das Free-Tier-Tageslimit)

### Task 18 — Multi-Kind (Phase 1c)
- Free = 1 Kind, Family Pro = bis zu 3 Kinder. App-Layer-Cap; Schema unterstützt bereits N Kinder.
- Kind-Selector im Dashboard-Header (nicht im Generator)
- Account-Seite: Liste aller Kinder mit Add / Edit / Delete (Free-User: Add zeigt Paywall-CTA)
- API + Zod nehmen `childId`; Server validiert Ownership
- Default-Kind: zuletzt benutztes (aus `worksheets_log`), fallback erstes nach `created_at`

### Task 19 — Mathe Vorschule: Zahlen schreiben (Spurschrift) (Phase 1c)
- Route: `/app/mathe/zahlen-schreiben`
- Topic-ID: `mathe-zahlen-schreiben`; im Topic-Registry unter `subject: "mathe"`, `grades: [0]`
- Konfig-UI: Ziffern-Multiselect (0–9, alle vorausgewählt), Zeilen pro Ziffer (1 / 2 / 3 / 4)
- Pure function `generateNumberTracing(config) → { blocks: { digit, lines }[] }`; Zod schema; vitest für Konfig-Validierung
- PDF: identisches 3-Linien-Layout wie Task 17, nur Playwrite DE Grund (Schreibschrift macht für Ziffern keinen Sinn); ghost-digit links pro Zeile
- Generator wiederverwendet die Tuning-Konstanten der Großbuchstaben (`fontSize 42`, `top -16`)
- Server sortiert die Ziffer-Auswahl in kanonische 0→9-Reihenfolge (defensiv gegen stale Client-State)
- Kein Lösungsblatt
- Rate-Limit-Eintrag analog Mathe

### Task 20 — Mathe Klasse 3: Einmaleins (Phase 1c)
- Route: `/app/mathe/einmaleins`
- Topic-ID: `mathe-einmaleins`; im Topic-Registry unter `subject: "mathe"`, `grades: [3]`
- Konfig-UI: Reihen-Multiselect (1–10) mit Ampel-Pill pro Reihe (Einfach / Mittel / Schwer in emerald / amber / rose, *außerhalb* des Buttons damit die Zahl mittig bleibt), Anzahl-Toggle (10 / 20 / 30), Lösungen optional
- Pure function `generateEinmaleinsProblems(config)`; Zod schema; vitest für Reihen-Filter + Anti-Duplikat-Logik
- PDF wiederverwendet das Mathe-Layout (`lib/worksheet/pdf.tsx`) inkl. optionales Lösungsblatt
- Subtitle zeigt „Reihen X, Y, Z" statt „Zahlenraum"
- Rate-Limit-Eintrag analog Mathe

### Task 21 — Denken/Logik: Muster fortsetzen (Phase 1c)
- Neues Fach „Denken" (3. Subject neben Mathe + Deutsch). Fach-Farbe lila (`#9333EA`)
- Route: `/app/denken/muster`
- Topic-ID: `denken-muster`; Vorschule (`grades: [0]`)
- Konfig-UI: Schwierigkeit (Einfach / Mittel / Schwer), Reihenzahl, Formen pro Reihe, Lückenmodus (letzte Position / zufällige Position / mehrere Lücken — "Ausmalen-Mode")
- Pure function `generatePatternSequences(config)`; eigener PDF-Renderer mit Form-Inventar (Kreis, Quadrat, Dreieck, Stern, …)
- Kein Lösungsblatt nötig (Antworten ergeben sich aus dem Muster)
- Rate-Limit-Eintrag analog Mathe

### Task 22 — Deutsch Klasse 1–2: Wörter abschreiben (Phase 1c)
- Route: `/app/deutsch/woerter-abschreiben`
- Topic-ID: `deutsch-woerter-abschreiben`; im Topic-Registry unter `subject: "deutsch"`, `grades: [1, 2]`
- Konfig-UI: Klasse-Toggle (1 / 2), Anzahl Wörter (5 / 8 / 10), Zeilen pro Wort (1 / 2 / 3), Schrift (Druck Playwrite DE Grund / Schreib Playwrite DE SAS)
- Wort-Korpus kuratiert pro Klasse in `lib/worksheet/woerter-abschreiben/corpus.ts`:
  - Klasse 1: lautgetreue Grundwörter (Familie, Tiere, Körper, Essen, Schule, Spielzeug, Natur), kurz
  - Klasse 2: längere Wörter, Doppelkonsonanten, ß, Umlaute, Wochentage, Monate
- Pure function `generateWoerter(config)`: seedable Fisher-Yates-Auswahl aus dem Klassen-Korpus, deterministisch
- PDF: 3-Linien-Schreiblernlineatur wie Task 17, ghost-word links in Lineatur-Höhe, Rest leer zum Abschreiben
- **Schreibschrift-Workaround (kritisch):** Playwrite DE SAS hat einen React-PDF-Bug der bei mehrzeichigen Wörtern den ersten Glyph droppt. Lösung: SAS wird über `fontkit.openSync()` als Vektor-Outlines (`<Svg><Path>`) gerendert, nicht über `<Text>`. Siehe `OutlinedGhostWord` in `lib/worksheet/woerter-abschreiben/pdf.tsx`. Druckschrift (Playwrite DE Grund) bleibt normales `<Text>`. Single-Char-Use-Cases (Task 17) sind nicht betroffen.
- Kein Lösungsblatt
- Rate-Limit-Eintrag analog Mathe

### Task 23 — Deutsch Klasse 2: Diktat (Volldiktat-Mode) (Phase 1c)
- Route: `/app/deutsch/diktate`
- Topic-ID: `deutsch-diktate`; im Topic-Registry unter `subject: "deutsch"`, `grades: [2]`
- Konfig-UI: Anzahl Satze (5 / 8 / 12)
- Satz-Korpus in `lib/worksheet/diktat/corpus.ts`: ~68 kurze Satze fur Klasse 2 (Doppelkonsonanten, ss/sz, Umlaute, ie/i, eu/au), Themen: Familie, Schule, Tiere, Wetter, Spielen, Essen, Jahreszeiten
- Pure function `generateDiktat(config)`: seedable Fisher-Yates-Auswahl, deterministisch, keine Duplikate
- PDF: zwei Seiten — Seite 1 (Eltern-Vorleseblatt) nummerierte Satzliste in Helvetica; Seite 2+ (Kinder-Schreibblatt) nummerierte Blocke mit je 2 Zeilen 3-Linien-Lineatur. count=12 kann auf Seite 3 uberlaufen (kein Komprimieren der Lineatur)
- Kein Losungsblatt (Seite 1 ist der Schlussel)
- Rate-Limit-Eintrag analog Mathe

### Task 24 — Mathe Klasse 4: Schriftliche Verfahren (Phase 1c)
- Route: `/app/mathe/schriftlich`
- Topic-ID: `mathe-schriftlich`; im Topic-Registry unter `subject: "mathe"`, `grades: [4]`
- Konfig-UI: Rechenart (Addition / Subtraktion / Gemischt), Stellen (3-stellig / 4-stellig), Anzahl Aufgaben (6 / 12 / 18), Losungsblatt-Toggle
- Operanden-Range: 3-stellig → 100..999, 4-stellig → 1000..9999. Subtraktion: a >= b immer erzwungen (kein negativer Wert)
- Pure function `generateSchriftlich(config)`: seedable mulberry32 PRNG, Anti-Duplikat-Set auf `operation|a|b`, deterministisch
- PDF: eigener Renderer `lib/worksheet/schriftlich/pdf.tsx`. Pro Aufgabe: Spaltenlayout mit fixbreiten Digit-Zellen (14pt je Stelle), Carry-Zeile (9pt) zwischen den Summanden, Trennlinie, leere Antwortzeile. 6 Aufgaben → 2 Spalten, 12/18 → 3 Spalten
- Optionales Losungsblatt (Seite 2): gleicher Spaltenlayout mit ausgefullter Antwort in Brandblau
- Digit-Ausrichtung: feste `<View>`-Zellen pro Stelle in Helvetica (kein Courier), textAlign center — sauberste Losung ohne zusatzlichen Font-Import
- Rate-Limit-Eintrag analog Mathe

### Task 25 — Deutsch Klasse 3: Rechtschreibung (Phase 1c)
- Route: `/app/deutsch/rechtschreibung`
- Topic-ID: `deutsch-rechtschreibung`; im Topic-Registry unter `subject: "deutsch"`, `grades: [3]`
- Konfig-UI: Regel-Pills (ie, i oder ih? / ss oder ß? / Doppelkonsonanten / Wortendungen / Gemischt), Anzahl Worter (10 / 15 / 20), Losungsblatt-Toggle; Default: ie-i, 15, Losungen an
- Wort-Korpus in `lib/worksheet/rechtschreibung/corpus.ts`: ~110 Eintrage uber vier Regeln (ie-i: 31, ss-sz: 22, doppelkons: 31, endung: 24). Jeder Eintrag: `{ rule, word, blank }`. Invariante: `blank` kommt genau einmal in `word` vor.
- Pure function `generateRechtschreibung(config)`: seedable mulberry32 PRNG, Fisher-Yates. Gemischt-Modus verteilt `count` gleichmasig auf alle vier Regeln und shuffelt dann die Gesamtliste.
- PDF: `lib/worksheet/rechtschreibung/pdf.tsx` in Helvetica. Zweispaltige Tabelle (50/50). Seite 1: `template` mit Platzhalter als Unterstrich-Underline (Ansatz: weisser Text auf `borderBottom`-View). Seite 2 (optional): volles Wort in Brandblau.
- Blank-Rendering: Unterstrich-View (`borderBottomWidth: 1`, weisser Text als Spacer) — proportionale Breite durch Zeichenzahl des `blank` plus Puffer. Fallback waren Underscores in Monospace (nicht genutzt).
- Rate-Limit-Eintrag analog Mathe

### Task 26 — Mathe Klasse 4: Brüche (Phase 1c)
- Route: `/app/mathe/brueche`
- Topic-ID: `mathe-brueche`; im Topic-Registry unter `subject: "mathe"`, `grades: [4]`
- Konfig-UI: Modus-Pills (Darstellen / Vergleichen / Rechnen), Anzahl-Pills (6 / 12 / 18), Losungsblatt-Toggle; Default: Darstellen, 12, Losungen an
- Drei Aufgabentypen (ein Modus pro Arbeitsblatt):
  - `darstellen`: geshadete Form (Kreis oder Rechteck) + leere `___/___`-Lucke. Nenner [2,10], Zahler [1, Nenner-1]. 50/50 Kreise/Rechtecke. Keine Duplikate.
  - `vergleichen`: zwei Bruche nebeneinander mit Lucke fur `<`, `>`, `=`. Nenner gleich oder einer teilt den anderen (kein echt-fremder Nenner). ~60% gleicher Nenner, ~40% Vielfaches. Antwort per Kreuzprodukt berechnet (kein Float-Fehler).
  - `rechnen`: Addition/Subtraktion mit gleichem Nenner. Nenner [2,12]. Zahler [1, Nenner-1]. Subtraktion: linker Zahler >= rechter (kein negatives Ergebnis). Ergebnis nicht kurzen.
- Bruch-Primitive `Bruch`/`BruchBlank` per gestapelter View+Text: Zahler oben, thin View als Bruchstrich, Nenner unten. Drei Groessen (sm/md/lg). Blank-Version: Unterstrich-Views mit sichtbarem Bruchstrich.
- SVG-Kreissektor: Path-basiert via Polarkoordinaten. Jeder Sektor ist ein separater `<Path>` (M center L start A ... Z), damit `fill` zuverlassig greift. `large-arc-flag` korrekt aus Winkel >= PI berechnet. Kreisumriss als eigener `<Path>` on top fur saubere Sektorubergange.
- Rechteck: N gleich breite vertikale Streifen, erste M gefullt (fill=brand), Rest weiss.
- Rate-Limit-Eintrag analog Mathe

### Task 27 — Mathe Klasse 4: Schriftliche Division (Phase 1c)
- Route: `/app/mathe/division`
- Topic-ID: `mathe-division`; im Topic-Registry unter `subject: "mathe"`, `grades: [4]`
- Konfig-UI: Stellen-Pills (3:1 / 4:1 / 4:2), Anzahl-Pills (4 / 8 / 12), Verfahren-Pills (Abziehverfahren / Erganzungsverfahren), Mit-Rest-Checkbox, Merkkasten-Checkbox, Losungsblatt-Checkbox; Defaults: 3:1, 8, Abzieh, kein Rest, kein Merkkasten, Losungen an
- Operanden-Range: 3:1 (Dividend 100-999, Divisor 2-9), 4:1 (Dividend 1000-9999, Divisor 2-9), 4:2 (Dividend 1000-9999, Divisor 11-99)
- `mitRest=false`: Dividend wird auf nachstkleineres Vielfaches des Divisors gerundet; wird das Ergebnis kleiner als Range-Minimum, Re-Roll
- Pure function `generateDivision(config)`: seedable mulberry32 PRNG, Anti-Duplikat-Set auf `dividend|divisor`, deterministisch. Steps-Berechnung per MSB-to-LSB-Loop; steps.length === quotient.toString().length
- PDF: eigener Renderer `lib/worksheet/division/pdf.tsx`. Pro Aufgabe: Gleichungszeile (Dividend : Divisor = [Quotient-Slots] [R-Slot wenn mitRest]), darunter eingerueckter Subtraktionsblock pro Schritt (Teildividend / Operator+Abzug / Linie / Rest). Abzieh: "-", Erganzung: "+". 4 Aufgaben 2x2, 8 Aufgaben 2x4, 12 Aufgaben 3x4. Optionales Losungsblatt Seite 2 (Werte in Brandblau).
- Optionaler Merkkasten (verfahren-sensitiv): 5 Schritte + Beispiel 728:4=182 + Walkthrough
- ThemeDecoration auf jeder Page (Aufgabenblatt + Losungsblatt)
- Rate-Limit-Eintrag analog Mathe

### Task 28 — Denken Vorschule: Formen erkennen (Phase 1c)
- Route: `/app/denken/formen-erkennen`
- Topic-ID: `denken-formen-erkennen`; im Topic-Registry unter `subject: "denken"`, `grades: [0]`
- Konfig-UI: Ziel-Form-Pills (7 Formen: Quadrat / Rechteck / Kreis / Dreieck / Raute / Stern / Sechseck), Anzahl-Pills (12 / 18), Schwierigkeit-Pills (Einfach / Mittel), Losungsblatt-Checkbox; Defaults: Quadrat, 12, Einfach, Losungen an
- PDF: 1 Aufgabe pro Sheet. Anweisungs-Zeile oben ("Male alle Quadrate aus." etc.). 12 oder 18 geometrische Outline-Formen als SVG verstreut auf der Seite, davon 4 (bei 12) oder 6 (bei 18) die Ziel-Form. Formen-Groessen 40-90pt, manuell platzierte Slots ohne Uberlappung
- Schwierigkeit einfach: 2-3 klar verschiedene Ablenkformen. Mittel: 4-5 Ablenkformen inkl. visuell ahnlicher Formen (z.B. Quadrat + Rechteck + Raute)
- Lösungsblatt: identisches Slot-Layout, Ziel-Formen werden ausgefullt (fill=brand navy) gerendert
- Pure function `generateFormenErkennen(config)`: seedable mulberry32 PRNG, statische Slot-Listen SLOTS_12 / SLOTS_18, Fisher-Yates-Shuffle
- SVG-Primitive (shapes.tsx): 7 Komponenten mit optionalem `filled`-Prop; numerische Attribute pflichtmassig, kein gap
- ThemeDecoration auf jeder Page (Aufgabenblatt + Losungsblatt)
- Rate-Limit-Eintrag analog Mathe

### Task 29 — Denken Vorschule: Formen zuordnen (Phase 1c)
- Route: `/app/denken/formen-zuordnen`
- Topic-ID: `denken-formen-zuordnen`; im Topic-Registry unter `subject: "denken"`, `grades: [0]`
- Konfig-UI: Anzahl-Paare-Pills (4 / 6 / 8; Default 6)
- PDF: Zwei-Spalten-Layout auf einer Seite. Anweisungs-Zeile: "Was passt zusammen? Verbinde die Paare mit einer Linie!". Linke Spalte (40%): paarCount farbige Formen (Pastell-Farben, jede Farbe einmalig), mit grauem Verbindungspunkt rechts daneben. Mittlere Zone (20%): leer fuer Kind-Linien. Rechte Spalte (40%): dieselben Formen als weisse Silhouetten in gemischter Reihenfolge, Verbindungspunkt links neben jeder Form
- Form-Inventar (shapes.tsx): 10 Formen — Kreis, Quadrat, Dreieck, Fuenfeck, Sechseck, Raute, Rechteck, Parallelogramm, Herz, Stern. Jede Form akzeptiert beliebige fill-Farbe (statt fixed-filled-boolean wie bei formen-erkennen)
- Pure function `generateFormenZuordnen(config)`: seedable mulberry32 PRNG, Fisher-Yates Sample ohne Ersatz fuer Formen und Farben, Re-Shuffle bis rechte Reihenfolge != linke Reihenfolge
- ThemeDecoration auf Aufgabenblatt
- Rate-Limit-Eintrag analog Mathe

### Task 30 — Mathe Vorschule: Mengen 1-10 (Phase 1c)
- Route: `/app/mathe/mengen`
- Topic-ID: `mathe-mengen`; im Topic-Registry unter `subject: "mathe"`, `grades: [0]`
- Konfig-UI: Bereich-Pills ("1 bis 5" / "1 bis 10"; Default "1-10"), Anzahl-Pills (6 / 12; Default 12)
- PDF: Eine Seite. Anweisungs-Zeile: "Wie viele sind es? Schreibe die Zahl in das Kastchen." Grid: 6 Aufgaben 2x3, 12 Aufgaben 3-spaltig. Pro Aufgabe-Cell: Form-Gruppe oben (quantity <= 5: eine Reihe horizontal; 6-10: zwei Reihen 5+Rest), darunter 40x40pt leeres Antwort-Kastchen (Brand-Navy-Rahmen, borderRadius 6). Kein Losungsblatt (Eltern zahlen die Form-Gruppen mit, Aufgabe ist visuell selbst-uberpruefbar).
- Formen: 8 filled Geometrics-PNGs aus `public/geometrics/` (kreis_gelb, dreieck_gruen, viereck_gruen, rechteck_blau, raute_blau, fuenfteck_rot, sechseck_rot, stern_gelb). Theme-agnostisch.
- Pure function `generateMengen(config)`: seedable mulberry32 PRNG, Anti-Duplikat-Set auf `shape|quantity`, Shape-Rotation uber 8 Formen. Kein Duplicate-Pair erlaubt.
- ThemeDecoration auf der Page
- Rate-Limit-Eintrag analog Mathe

### Task 31 — Mathe Vorschule: Zahlen mit Marienkaefern (Phase 1c)
- Route: `/app/mathe/marienkaefer`
- Topic-ID: `mathe-marienkaefer`; im Topic-Registry unter `subject: "mathe"`, `grades: [0]`
- Konfig-UI: Anzahl-Pills (6 / 10; Default 10). Kein Losungsblatt (Eltern zahlen die gemalten Punkte des Kindes).
- Asset: `public/images/blacknwhite/blacknwhite_marienkaefer_ohne_punkte.png` (835x717, schwarz-weiss, ohne Punkte auf den Flugeln). Geladen als Buffer via `fs.readFileSync` in Modul-Level-Cache.
- PDF: Eine Seite. Anweisungs-Zeile: "Male auf jeden Marienkaefer so viele Punkte, wie die Zahl rechts daneben zeigt." Grid: 2 Spalten x 3 Reihen (count=6) oder 2 Spalten x 5 Reihen (count=10). Pro Cell: Marienkaefer-PNG links (count=6: 100x86pt, count=10: 70x60pt), Ziffer Helvetica-Bold rechts zentriert (count=6: 72pt, count=10: 52pt), alles navy. Cell-Border: 1pt Brand-Navy, kollabiert durch `borderWidth:1, marginLeft:-1, marginTop:-1` je Cell.
- Kein Losungsblatt - Aufgabe ist visuell selbsterklaerend.
- ThemeDecoration als erstes Kind der Page. Kein topAccent-Streifen.
- Rate-Limit-Eintrag analog Mathe

---

## 12. Success Metrics

**Phase 1 launch (end of Week 6):**
- Functional end-to-end flow on production
- p95 PDF generation latency < 2 seconds
- Zero data leaks across users (RLS verified by penetration test)
- Legal pages reviewed and published

**Month 1 post-launch:**
- 100 signups
- 5+ paying subscribers (= ~€40 MRR)
- Conversion rate visit → signup ≥ 5%

**Month 6:**
- €400 MRR (~50 paying subscribers)
- 3+ themes shipped (Dinos, Unicorns, Cars added)
- German added as second subject (Diktate, Lückentexte)
- One viral post on r/Eltern or Mama-Blog feature

**Month 12:**
- €2.000 MRR (~250 paying subscribers)
- Mobile companion app in beta (scan-and-check)
- Curriculum matching live for Bayern + NRW

---

## 13. Open Questions for the Founder

Status as of 2026-05-12:

0. **Product scope.** ✅ **Resolved 2026-05-12: Vorschule–Klasse 10 als Nordstern, aktuelle Phase Vorschule–Klasse 4 mit Mathe + Deutsch.** Math-only-Beschränkung der Original-VISION wurde aufgehoben. Phase 1b liefert Dashboard + Deutsch Vorschule (Buchstaben-Spurschrift), Phase 1c liefert Multi-Kind + mehr Topics, Phase 2 öffnet Klasse 5–10 und weitere Fächer. Siehe §10.

1. **Final project name and domain.** ✅ **Resolved: Lernikon, lernikon.de** (Lernen + Lexikon). `aufgabenblatt.de` was taken. Repo: github.com/Pierce-Chang/Lernikon.
2. **Brand identity.** ✅ **Logo + palette landed 2026-05-11.** Selected design: `public/logos/paperplane/` — paper-plane motif with navy body + gold fold detail (replaced the earlier geometric-L draft). Full asset set: mark variants (`icon-primary`, `icon-app-tile`, `icon-inverse`, `icon-mono-{navy,black,white}`, `icon-outline`), horizontal + stacked lockups in navy/accent/white, plus `wordmark`, `social-avatar`, `og-image`. SVG + PNG (32/64/128/256/512/1024/2048). Palette: **navy `#1E4A7C`** as primary brand color, **gold `#F4B942`** as playful accent, cream `#FAFAF7` for inversions (carried into PDF: navy on the accent strip / headlines, gold on the number badge). Buttons (web) use gold as primary fill for visibility. Previous indigo `#6366F1` palette is retired. Font: Lexend (web) + Helvetica (PDF). **PDF branding placement (founder spec, 2026-05-11):** `lernikon.de` small + discreet near top of every worksheet page; "Lernikon" wordmark + logo more prominently in the footer — see Task 7.
3. **First theme depth.** ⚠️ **Subtle by default**, but currently **disabled**: SVG corner decorations triggered a yoga `unsupported number: 8.51.5` parse error and were removed. To re-enable: pass numeric attrs only (`r={2}`, not `r="2"`), avoid `gap` on parent.
4. **DSGVO posture.** ✅ **Hosting EU**: Supabase EU (Frankfurt), Vercel EU, PostHog EU cloud, Stripe EU. ⚠️ **OpenAI** integration not yet shipped — when adding, confirm EU data residency contract.
5. **Refund policy text.** ⚠️ **Draft in `/agb`** (14-day right of withdrawal with explicit waiver clause for digital goods per §356 BGB). Needs lawyer review before launch.
6. **Pricing test.** ✅ **Shipped with 3/day** per recommendation. Track conversion with PostHog `paywall_hit` → A/B-test later.

---

## 14. Working Principles for the AI Agent

- Ship Phase 1 features end-to-end before polishing any single one
- Refuse scope creep: every "wouldn't it be cool if…" goes to Phase 2 backlog, full stop
- Prefer boring, proven solutions over clever new ones
- Optimize for founder's iteration speed, not theoretical scalability
- Write code that the founder can maintain solo while holding a day job — clarity over cleverness
- All UI strings in German (de-DE), code comments in English
- Test critical paths only (PDF generation logic, rate limiting, Stripe webhooks). Skip exhaustive unit tests for UI.
- Commit messages: conventional commits format (`feat:`, `fix:`, `chore:`)

---

**End of VISION.md.** This document is the single source of truth. When in doubt, re-read it. When a request conflicts with it, surface the conflict to the founder before acting.
