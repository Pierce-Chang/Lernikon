-- ===========================================================================
-- Local-dev seed.
-- Creates one test user (in auth.users) plus a child profile.
-- Use only against a local Supabase instance — never run in production.
-- ===========================================================================

-- A deterministic UUID for the test user.
do $$
declare
  v_user_id uuid := '00000000-0000-0000-0000-000000000001';
  v_email text := 'parent@example.test';
begin
  insert into auth.users (id, email, instance_id, aud, role, email_confirmed_at, created_at, updated_at)
  values (
    v_user_id,
    v_email,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    now(),
    now(),
    now()
  )
  on conflict (id) do nothing;

  -- public.users row is created by the trigger; ensure it exists for re-runs
  insert into public.users (id, email)
  values (v_user_id, v_email)
  on conflict (id) do nothing;

  insert into public.children_profiles (user_id, name, grade, theme_preference)
  values (v_user_id, 'Lina', 2, 'weltraum')
  on conflict do nothing;
end $$;
