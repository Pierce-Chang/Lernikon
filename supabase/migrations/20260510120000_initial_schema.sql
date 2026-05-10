-- ===========================================================================
-- Lernikon — initial schema
-- Tables: users, children_profiles, worksheets_log
-- All tables use Row Level Security; users can only access their own rows.
-- ===========================================================================

-- ── extensions ──────────────────────────────────────────────────────────────
create extension if not exists "pgcrypto";

-- ── public.users (extends auth.users) ───────────────────────────────────────
create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  stripe_customer_id text unique,
  subscription_status text not null default 'none'
    check (subscription_status in ('none', 'active', 'trialing', 'past_due', 'canceled', 'incomplete')),
  subscription_period_end timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists users_stripe_customer_id_idx
  on public.users (stripe_customer_id);

-- ── public.children_profiles ────────────────────────────────────────────────
create table if not exists public.children_profiles (
  id uuid primary key default gen_random_uuid (),
  user_id uuid not null references public.users (id) on delete cascade,
  name text not null check (char_length (name) between 1 and 50),
  grade smallint not null check (grade between 1 and 4),
  theme_preference text not null default 'weltraum',
  created_at timestamptz not null default now()
);

create index if not exists children_profiles_user_id_idx
  on public.children_profiles (user_id);

-- ── public.worksheets_log (rate-limit + analytics) ─────────────────────────
create table if not exists public.worksheets_log (
  id uuid primary key default gen_random_uuid (),
  user_id uuid not null references public.users (id) on delete cascade,
  child_id uuid references public.children_profiles (id) on delete set null,
  subject text not null,
  operation text,
  config_json jsonb not null,
  generated_at timestamptz not null default now()
);

create index if not exists worksheets_log_user_generated_idx
  on public.worksheets_log (user_id, generated_at desc);

-- ── trigger: mirror new auth.users into public.users ───────────────────────
create or replace function public.handle_new_auth_user ()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user ();

-- ===========================================================================
-- Row Level Security
-- ===========================================================================

alter table public.users enable row level security;
alter table public.children_profiles enable row level security;
alter table public.worksheets_log enable row level security;

-- ── users: read/update own row only ─────────────────────────────────────────
drop policy if exists "users select own" on public.users;
create policy "users select own"
  on public.users for select
  using (id = auth.uid ());

drop policy if exists "users update own" on public.users;
create policy "users update own"
  on public.users for update
  using (id = auth.uid ())
  with check (id = auth.uid ());

-- (no insert/delete policy: rows are inserted by the trigger;
--  deletion happens via auth.users cascade)

-- ── children_profiles: full CRUD on own rows ───────────────────────────────
drop policy if exists "child_profiles select own" on public.children_profiles;
create policy "child_profiles select own"
  on public.children_profiles for select
  using (user_id = auth.uid ());

drop policy if exists "child_profiles insert own" on public.children_profiles;
create policy "child_profiles insert own"
  on public.children_profiles for insert
  with check (user_id = auth.uid ());

drop policy if exists "child_profiles update own" on public.children_profiles;
create policy "child_profiles update own"
  on public.children_profiles for update
  using (user_id = auth.uid ())
  with check (user_id = auth.uid ());

drop policy if exists "child_profiles delete own" on public.children_profiles;
create policy "child_profiles delete own"
  on public.children_profiles for delete
  using (user_id = auth.uid ());

-- ── worksheets_log: insert + read own rows ─────────────────────────────────
drop policy if exists "worksheets_log select own" on public.worksheets_log;
create policy "worksheets_log select own"
  on public.worksheets_log for select
  using (user_id = auth.uid ());

drop policy if exists "worksheets_log insert own" on public.worksheets_log;
create policy "worksheets_log insert own"
  on public.worksheets_log for insert
  with check (user_id = auth.uid ());

-- updates/deletes intentionally not allowed for log integrity
