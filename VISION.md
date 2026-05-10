# VISION.md — Worksheet Generator for Parents (DACH)

> Working title: `LernZettel` (placeholder — final name TBD by founder)
> Target market: Germany, Austria, Switzerland
> Target MRR: €5k+ within 12–18 months
> Build philosophy: Ship fast, stay narrow, no scope creep until 100+ active users

---

## 1. Mission

Build a web-first SaaS that lets parents in the DACH region generate beautiful, printable, personalized worksheets for their children (ages 6–12) in under 30 seconds. The product fills a clear market gap: existing free generators look outdated and ad-supported; professional tools (Worksheet Crafter, tutory.de) are built for teachers and far too complex for casual parental use. Nobody serves the parent who just wants to hand their kid a nice-looking math sheet on a Saturday morning.

---

## 2. Target User

**Primary persona:** German-speaking parent, 30–45 years old, with one or more elementary-school-age children. Tech-comfortable but time-poor. Currently prints worksheets from random Google search results. Frustrated by inconsistent quality, irrelevant content, and zero personalization. Willing to pay €5–10/month for a tool that saves time and motivates the kid.

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

1. Parent picks child's grade and (optionally) Bundesland
2. Picks subject → topic → difficulty (e.g., Math → Addition → Range 1–20)
3. Picks a theme (Dinosaurs, Unicorns, Space, Horses, Cars, etc.)
4. Picks number of exercises (5 / 10 / 15 / 20)
5. Clicks "Generate" → receives a beautifully designed PDF + separate answer key

Behind the scenes: AI personalizes word problems using the child's name and chosen theme. PDFs are pixel-perfect A4, print-ready, modern typography, theme illustrations that decorate without distracting.

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

1. **Theme-based personalization** — the kid picks the visual world; the math is the same but framed in dinosaurs, unicorns, space, etc.
2. **AI-personalized word problems** — `gpt-4o-mini` generates word problems featuring the child's name and theme preferences
3. **DACH curriculum awareness** — topics auto-match official Lehrpläne for the selected grade and Bundesland (Phase 3, not MVP)
4. **Multi-child support** — Family Pro plan supports up to 3 child profiles
5. **Auto-generated answer keys** — always a separate page, ready to grade
6. **Modern PDF design** — print-ready, kid-friendly typography, NOT Times New Roman from 1998
7. **Weekly bundles** — "generate 5 sheets for the coming week" as a single action (Phase 2)

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
- More than one theme (Phase 1 ships with "Weltraum" only)
- More than one subject (Phase 1 ships with Math only)

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

## 10. MVP Scope (Phase 1 — ship within 4–6 weeks)

Build exactly this, nothing more:

1. Landing page (one route, SEO-optimized)
2. Email magic-link signup via Supabase
3. Onboarding: capture one child profile (name + grade 1–4)
4. Generator UI for **Math only**:
   - Operations: Addition, Subtraktion
   - Number range slider (1–100)
   - Exercise count: 5 / 10 / 15 / 20
   - Single theme: "Weltraum"
5. PDF generation (worksheet + separate answer key page)
6. Free tier: 3 worksheets per 24-hour window, watermark in footer
7. Paid tier via Stripe Checkout: unlimited, no watermark
8. Basic account page (manage subscription, edit child profile)
9. Legal pages: Impressum, Datenschutz, AGB (German legal compliance is non-negotiable)

That is the entire Phase 1. The agent must refuse scope additions until the success metrics below are hit.

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

Before MVP launch, these need resolution:

1. **Final project name and domain.** Suggestions: `LernZettel`, `Übungsheft`, `Aufgabenblatt`, `Klassenheft`, `Schulpilot`. Founder picks one, confirms .de availability.
2. **Brand identity.** Minimal logo. No Comic Sans. Two-color palette.
3. **First theme depth.** How elaborate should "Weltraum" be? Full illustrated borders, or subtle corner decorations only? Recommendation: subtle, low cognitive load.
4. **DSGVO posture.** Confirm children's data never leaves the EU. If OpenAI API is used for word problems, confirm OpenAI EU data residency is configured.
5. **Refund policy text.** Standard 14-day EU right of withdrawal, but explicit text needed.
6. **Pricing test.** Should free tier be 3/day or 5/week? Recommendation: ship with 3/day, A/B-test later.

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
