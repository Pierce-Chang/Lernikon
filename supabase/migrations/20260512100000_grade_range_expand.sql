-- ===========================================================================
-- Expand children_profiles.grade range:
--   0  = Vorschule
--   1..10 = Klasse 1..10
--
-- Phase 1b UI offers 0..4 only (Vorschule + Grundschule); the schema already
-- covers 5..10 so Phase 2 can light up Sekundarstufe I without another
-- migration.
-- ===========================================================================

alter table public.children_profiles
  drop constraint if exists children_profiles_grade_check;

alter table public.children_profiles
  add constraint children_profiles_grade_check
  check (grade between 0 and 10);
