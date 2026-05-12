# Lernikon

> Druckfertige, personalisierte Übungsblätter für Vorschule bis Klasse 10 (DACH) — in 30 Sekunden, mit Lösungen. Mehrere Fächer (Mathe, Deutsch, …).

Brand & domain: **lernikon.de** (Lernen + Lexikon). Working title in code paths is still `Aufgabenblatt`. Single source of truth for product scope: [`VISION.md`](./VISION.md).

**Current implementation phase:** Vorschule bis Klasse 4, Fächer Mathe (vorhanden) + Deutsch (Vorschule erst). Klasse 5–10 + weitere Fächer = Phase 2.

## Stack

- Next.js 16 (App Router, Turbopack) · React 19 · TypeScript
- Tailwind v4 + shadcn/ui (Base UI, not Radix)
- Supabase (Postgres + Auth, EU)
- Stripe (Subscriptions, EU VAT)
- React-PDF for worksheet PDFs
- PostHog (analytics, EU cloud, consent-gated)
- Vitest

## Quick start

Prereqs: **Node 20+**, **Docker Desktop running**.

```bash
# Install deps
npm install

# Boot the local Supabase stack (Postgres, Auth, Studio, Mailpit) via Docker
npx supabase start

# Copy + fill env vars (anon/service keys come from `npx supabase status`)
cp .env.example .env.local

# Run the app
npm run dev
```

Open http://localhost:3000. Outgoing mails (signup confirmation, password reset) land in **Mailpit** at http://127.0.0.1:54324, not in real inboxes. DB is browsable in **Studio** at http://127.0.0.1:54323.

## Useful commands

```bash
npm run dev          # Next dev server (Turbopack)
npm run build        # Prod build (set SKIP_ENV_VALIDATION=1 to build without env)
npm run typecheck    # tsc --noEmit
npm run lint         # ESLint
npm run format       # Prettier write
npm test             # Vitest run
npx supabase start   # Boot local Supabase
npx supabase stop    # Stop local Supabase (data preserved)
npx supabase db reset      # Wipe + reapply all migrations + seed
npx supabase migration up  # Apply pending migrations only
npx supabase status        # Print local URLs + auth keys
```

## Project layout

```
app/
  (marketing)               landing, legal, marketing-shell
  app/                      authenticated app — generator, account
  api/                      API routes (Stripe webhook, worksheet PDF)
  auth/                     OAuth-style callback + sign-out
  login/, signup/, forgot-password/, reset-password/
  onboarding/
components/                 shadcn/ui + app-level components
lib/
  analytics/                PostHog client + event types
  db/                       Supabase types + queries
  supabase/                 client/server/middleware factories
  worksheet/                generation logic + React-PDF doc
proxy.ts                    Next 16 middleware (was middleware.ts)
supabase/
  migrations/               SQL migrations
  config.toml               local Supabase config
```

## Deploy

Pending — see VISION §11 Task 14. Vercel + Supabase EU + Stripe live keys + PostHog cloud.

## Auth & admin

- Email + password (signup → email confirmation → onboarding → app)
- Founder email `pierce@mailbox.org` is auto-flagged `is_admin = true` by the signup trigger; admins bypass the free-tier rate limit
- Add admins by editing `admin_emails` in `supabase/migrations/20260510130000_add_admin.sql` and shipping a new migration

## License

Private. © Lernikon.
