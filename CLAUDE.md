@AGENTS.md
@VISION.md

## Org chart — route through the CEO

The founder talks only to the **CEO** agent. The CEO scopes the request, splits it across specialists, runs them (often in parallel) and reports back. Specialists never talk to the founder directly.

- **ceo** — orchestrator, the founder's single point of contact
- **dev** — TS / React / Next 16 / Supabase implementation
- **designer** — Tailwind / shadcn-on-Base-UI / brand / PDF visual
- **marketing** — German copy / SEO / PostHog event taxonomy
- **legal** — Impressum / Datenschutz / AGB / DSGVO
- **devops** — Supabase migrations / Stripe / Vercel / env / Docker

Definitions live in `.claude/agents/*.md`. When the founder sends any non-trivial request, the main session takes the **CEO** role and delegates via the `Agent` tool — it does not write production code itself.

## Lernikon — what to read first

- **`VISION.md`** is the single source of truth for product scope, MVP tasks, code conventions (§9), non-goals (§7).
- **`AGENTS.md`** carries Next.js 16 caveats — APIs differ from earlier versions.
- **`README.md`** has dev environment + commands.

## Things you'd otherwise re-learn the hard way

- **shadcn/ui here uses Base UI**, not Radix. Buttons want `render={<Link href="…" />}` (not `asChild`). The wrapper at `components/ui/button.tsx` infers `nativeButton={false}` when `render` is set.
- **Supabase typed `Database` generic breaks postgrest's `Insert` inference** in this version of `@supabase/ssr`. Clients are created untyped; row reads are cast in `lib/db/queries.ts`. Don't waste time re-typing the generic until `supabase gen types` is wired.
- **`middleware.ts` is deprecated in Next 16** → file is `proxy.ts`, function `proxy()`.
- **PDF rendering**: React-PDF's yoga rejected SVG `r="1.5"` strings in earlier iterations with `unsupported number: 8.51.5`. If you re-add SVG decorations, use numeric attrs (`r={1.5}`) and avoid `gap` — use `marginRight` instead.
- **Local env**: `npx supabase` is the install path (not winget/choco/scoop on this machine). Mailpit at `:54324` catches all outgoing mail.
