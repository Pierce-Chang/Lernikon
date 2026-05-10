@AGENTS.md
@VISION.md

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
