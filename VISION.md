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
- [x] Task 17 — Deutsch Vorschule: Buchstaben schreiben (Spurschrift) (Phase 1b) — neuer Generator + 4-Linien-PDF
- [x] Task 18 — Multi-Kind (Phase 1c) — Free=1 / Pro=3, Kind-Selector im Dashboard, Add/Edit/Delete im Account

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
6. Free tier: 3 worksheets per 24 h window, watermark in footer
7. Family Pro via Stripe Checkout (€7,99/Monat oder €59/Jahr): unbegrenzt, kein Watermark
8. Account page (Abo verwalten, Kindprofil editieren)
9. Legal pages: Impressum, Datenschutz, AGB (with `[TODO: lawyer-review]` markers)
10. Analytics: PostHog client-side, consent-gated

### Phase 1b — Dashboard + first non-math subject (in progress)

1. Dashboard at `/app` replaces the single `Generator` page: tile grid `Fach → Klasse → Thema`, History der letzten Arbeitsblätter
2. Header-Nav: „Übersicht" / „Mein Konto" / „Abmelden" (kein „Generator"-Eintrag mehr)
3. Math generator wandert nach `/app/mathe/[topic]`; Generator-Architektur generalisiert für mehrere Übungstypen (Math word problems vs. Spurschrift sind grundlegend verschiedene PDF-Layouts und Configs)
4. Grade enum erweitert von `1–4` auf `Vorschule, 1, 2, 3, 4` (DB: `children_profiles.grade` als `int` mit `0` = Vorschule, CHECK `0..10` für spätere Phase 2)
5. **Neuer Übungstyp: Deutsch Vorschule — Buchstaben schreiben (Spurschrift)**
   - Konfig: Buchstaben-Multiselect (A–Z), Groß/Klein/Beides, Zeilen pro Buchstabe (2 / 3 / 4)
   - PDF: 4-Linien-Schreiblernlineatur, gepunktetes Buchstaben-Outline links pro Zeile, Rest zum Nachschreiben leer
   - Kein Lösungsblatt
   - Brand-Presence wie Mathe (lernikon.de oben + Footer-Lockup)

### Phase 1c — Multi-Kind + Content-Tiefe + Conversion-Mechanik (next)

1. ✅ Multi-Kind-Support (Task 18 erledigt): Free = 1 Kind, Family Pro = bis zu 3 Kinder. Kind-Selector im Dashboard. Account-Liste statt Single-Editor.
2. Mehr Mathe-Topics: Vorschule (Mengen, Zahlen 1–10), Klasse 3 (Einmaleins), Klasse 4 (schriftliche Verfahren, einfache Brüche)
3. Mehr Deutsch-Topics: Klasse 1 (ABC, einfache Wörter), Klasse 2 (Diktate, Wortarten), Klasse 3 (Rechtschreibung, Leseverstehen), Klasse 4 (Aufsatz-Bausteine, Grammatik)
4. **Theme-Expansion + Theme-Paywall**: 3 neue Themes (Einhorn / Pferde / Autos) deckt Mädchen-/Jungen-/neutral-Tier-Fall. Sobald Assets da sind: Free behält „Weltraum", Pro entsperrt alle Themes. Stärkster kid-driven Conversion-Hebel. Asset-Commission ist Founder-Job (Designer external).

### Conversion-Strategie (Stand 2026-05-12, vom CEO entschieden)

Pre-Launch-Posture: **wenig restrictivity, viel Daten sammeln**. Reasoning: ohne aktive User ist jede Paywall-Härtegrad-Entscheidung Spekulation. Erst Funnel-Daten, dann tunen.

- **Quota bleibt bei 3/Tag** (nicht 2). Reduktion erst wenn `paywall_hit{trigger:rate_limit}` zeigt dass aktive User regelmäßig dran scheitern.
- **Deutsch bleibt komplett free** (nicht ab Klasse 1 Pro). Top-of-Funnel-Schutz für die frische Multi-Subject-Botschaft. Re-evaluate in Phase 2 mit 50+ aktiven Konten.
- **Theme-Paywall** ist der primäre Conversion-Hebel, kommt mit Theme-Expansion (Bullet 4 oben).
- **Lösungen-Blatt bleibt für Free verfügbar** — table stakes für Eltern. Nicht hinter Paywall stecken.
- **AI-Sachaufgaben** (gpt-4o-mini) sind Pro-only **wenn** sie kommen. Phase 2.
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
- Konfig-UI: Buchstaben-Multiselect (A–Z), Case-Select (Großbuchstaben / Kleinbuchstaben / Beides), Zeilen pro Buchstabe (2 / 3 / 4)
- Pure function `generateLetterTracing(config) → { letters: { char, case, lines }[] }`; Zod schema; vitest für Konfig-Validierung
- PDF: Schreiblernlineatur (4 Linien: Oberlänge, Mittelband oben/unten, Unterlänge), gepunktetes Buchstaben-Outline links pro Zeile, Rest leer zum Nachfahren
- Kein Lösungsblatt
- Brand-Presence wie Mathe (lernikon.de Top + Footer-Lockup)
- Rate-Limit-Eintrag analog Mathe (zählt gegen das Free-Tier-Tageslimit)

### Task 18 — Multi-Kind (Phase 1c, paused behind Tasks 15–17)
- Free = 1 Kind, Family Pro = bis zu 3 Kinder. App-Layer-Cap; Schema unterstützt bereits N Kinder.
- Kind-Selector im Dashboard-Header (nicht im Generator)
- Account-Seite: Liste aller Kinder mit Add / Edit / Delete (Free-User: Add zeigt Paywall-CTA)
- API + Zod nehmen `childId`; Server validiert Ownership
- Default-Kind: zuletzt benutztes (aus `worksheets_log`), fallback erstes nach `created_at`

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
