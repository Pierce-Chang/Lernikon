<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Lernikon-specific guardrails

- `VISION.md` is the contract. Before suggesting a feature, check VISION §7 (non-goals) and §10 (MVP scope). For requests outside that scope, respond with: *"Out of MVP scope per VISION.md. Adding to Phase 2 backlog. Continuing with current task."*
- Code conventions (mandatory) are in VISION §9: no `await` in loops, arrow params always parenthesised, comma-separated `const` declarations, JSDoc in simple English, `console.warn` not `console.log`, TS strict, Zod at every boundary, Server Actions over API routes, Tailwind only.
- All UI strings in German (de-DE); code comments in English.
- Brand is **Lernikon** in user-facing copy. The directory is still named `Aufgabenblatt` (working title) — leave it.
- Founder email `pierce@mailbox.org` is auto-promoted to admin via DB trigger (`supabase/migrations/20260510130000_add_admin.sql`). Admins bypass rate limit (`hasUnlimited` in `lib/worksheet/rate-limit.ts`).
- Auth is **email + password**, not magic link (VISION §8 is overridden).
