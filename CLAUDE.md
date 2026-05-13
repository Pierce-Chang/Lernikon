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
- **React-PDF + Playwrite DE SAS** drops the first glyph of multi-character words (the M in "Mama", the E in "Esel", …). The fix is *not* a different font — it's to bypass the text shaper. Render full SAS words as vector outlines via `fontkit.openSync()` + `<Svg><Path d={glyph.path.toSVG()} />`. See `OutlinedGhostWord` in `lib/worksheet/woerter-abschreiben/pdf.tsx`. Single-character SAS through normal `<Text>` works fine (that's why `deutsch-buchstaben-schreiben` never hit this). Do not waste hours swapping fonts (VA, LA, Guides, Bienchen all behave the same through `<Text>`); the bug is in React-PDF's shaping, not the glyph file.
- **React-PDF `fontWeight: "bold"` on a family without a registered bold variant** can poison its font cache and break *other* sibling fonts. Playwrite has no bold weight on Google Fonts — never set `fontWeight: "bold"` on a `PlaywriteDE*` family. Use only `Regular`.
- **Local env**: `npx supabase` is the install path (not winget/choco/scoop on this machine). Mailpit at `:54324` catches all outgoing mail.
