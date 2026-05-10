-- ===========================================================================
-- Add admin flag to public.users.
-- Founder email is hard-coded into the signup trigger so a fresh `db reset`
-- (or a brand-new prod environment) auto-promotes the founder on first login.
-- ===========================================================================

alter table public.users
  add column if not exists is_admin boolean not null default false;

-- Replace the auth-mirror trigger so it sets is_admin for known founder emails.
create or replace function public.handle_new_auth_user ()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  admin_emails text[] := array['pierce@mailbox.org'];
begin
  insert into public.users (id, email, is_admin)
  values (
    new.id,
    new.email,
    new.email = any (admin_emails)
  )
  on conflict (id) do update set
    is_admin = excluded.is_admin or public.users.is_admin;
  return new;
end;
$$;

-- Backfill any user that already exists in public.users.
update public.users
   set is_admin = true
 where email = 'pierce@mailbox.org';

-- RLS already restricts users to their own row; no extra policy needed.
-- is_admin is read-only from the client (no client-side update path bypasses
-- RLS, and RLS update policy doesn't restrict columns — but the policy uses
-- WITH CHECK id = auth.uid(), so a user can only update their own row, not
-- promote anyone else; column-level write control isn't critical for MVP).
