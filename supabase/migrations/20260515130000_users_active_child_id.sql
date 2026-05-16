-- ===========================================================================
-- Per-user active child selection, persisted on the account row instead of an
-- httpOnly cookie. Travels across browsers and devices, survives cookie clears.
-- ON DELETE SET NULL keeps the foreign key intact when a child profile is
-- deleted, the dashboard then falls back to the worksheets_log heuristic.
-- ===========================================================================

alter table public.users
  add column if not exists active_child_id uuid
    references public.children_profiles (id) on delete set null;

create index if not exists users_active_child_id_idx
  on public.users (active_child_id);
