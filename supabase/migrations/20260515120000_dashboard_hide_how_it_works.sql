-- ===========================================================================
-- Add per-user toggle to hide the "So funktioniert's" explainer strip on
-- the Dashboard once the user has seen it. Stored on the account (not in
-- localStorage) so the preference travels across browsers and devices.
-- ===========================================================================

alter table public.users
  add column if not exists hide_how_it_works boolean not null default false;
