-- ============================================================
-- Ascend — Phase 1 schema + Row-Level Security
-- ============================================================
-- HOW TO RUN: Supabase Dashboard → SQL Editor → New query →
-- paste this whole file → Run. Safe to re-run (idempotent).
--
-- PRIVACY MODEL (non-negotiable, per spec §2):
--   Every table carries user_id and has RLS ENABLED with policies
--   that only allow rows where user_id = auth.uid(). Single user,
--   but real per-row isolation. gen_random_uuid() is available by
--   default on Supabase (pgcrypto).
-- ============================================================

-- ------------------------------------------------------------
-- Tables
-- ------------------------------------------------------------

-- life_areas — used now for habit tagging, expands in Phase 2
create table if not exists public.life_areas (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name       text not null,
  color      text,
  created_at timestamptz not null default now()
);

-- habits
create table if not exists public.habits (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name           text not null,
  type           text not null check (type in ('boolean', 'quantitative')),
  unit           text,
  target         numeric,
  frequency      text not null default 'daily' check (frequency in ('daily', 'weekly', 'x_per_week')),
  times_per_week int,
  color          text,
  icon           text,
  sort_order     int not null default 0,
  life_area_id   uuid references public.life_areas (id) on delete set null,
  archived       boolean not null default false,
  created_at     timestamptz not null default now()
);

-- habit_logs — one log per habit per day
create table if not exists public.habit_logs (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  habit_id   uuid not null references public.habits (id) on delete cascade,
  log_date   date not null,
  completed  boolean,           -- for boolean habits
  value      numeric,           -- for quantitative habits
  created_at timestamptz not null default now(),
  unique (habit_id, log_date)
);

-- people
create table if not exists public.people (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name                text not null,
  how_we_met          text,
  relationship        text,
  qualities_to_learn  text,
  weaknesses_to_avoid text,
  what_theyre_good_at text,
  my_thoughts         text,
  questions_to_ask    text,
  last_interaction    date,
  created_at          timestamptz not null default now()
);

-- person_traits — optional private 1–10 ratings
create table if not exists public.person_traits (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  person_id  uuid not null references public.people (id) on delete cascade,
  trait      text not null,
  rating     int check (rating between 1 and 10),
  created_at timestamptz not null default now()
);

-- person_lessons — running, dated log
create table if not exists public.person_lessons (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  person_id   uuid not null references public.people (id) on delete cascade,
  lesson      text not null,
  lesson_date date not null default current_date,
  created_at  timestamptz not null default now()
);

-- journal_entries — one entry per day per user
create table if not exists public.journal_entries (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  entry_date date not null,
  content    text,
  intention  text, -- the Command Center's editable "daily intention"
  mood       int check (mood between 1 and 5),
  energy     int check (energy between 1 and 5),
  tags       text[] not null default '{}',
  created_at timestamptz not null default now(),
  unique (user_id, entry_date)
);
-- For existing databases (table already created without the column):
alter table public.journal_entries add column if not exists intention text;

-- ------------------------------------------------------------
-- Indexes (query by user + common lookups)
-- ------------------------------------------------------------
create index if not exists idx_life_areas_user      on public.life_areas (user_id);
create index if not exists idx_habits_user          on public.habits (user_id);
create index if not exists idx_habit_logs_user      on public.habit_logs (user_id);
create index if not exists idx_habit_logs_habit_date on public.habit_logs (habit_id, log_date);
create index if not exists idx_people_user          on public.people (user_id);
create index if not exists idx_person_traits_person on public.person_traits (person_id);
create index if not exists idx_person_lessons_person on public.person_lessons (person_id);
create index if not exists idx_journal_user_date    on public.journal_entries (user_id, entry_date);

-- ------------------------------------------------------------
-- Row-Level Security
-- ------------------------------------------------------------
-- For each table: ENABLE RLS, then a single FOR ALL policy that
-- gates both reads (USING) and writes (WITH CHECK) to the owner.
-- WITH CHECK is essential — USING alone lets bad inserts through.

alter table public.life_areas      enable row level security;
alter table public.habits          enable row level security;
alter table public.habit_logs      enable row level security;
alter table public.people          enable row level security;
alter table public.person_traits   enable row level security;
alter table public.person_lessons  enable row level security;
alter table public.journal_entries enable row level security;

drop policy if exists "own rows" on public.life_areas;
create policy "own rows" on public.life_areas
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "own rows" on public.habits;
create policy "own rows" on public.habits
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "own rows" on public.habit_logs;
create policy "own rows" on public.habit_logs
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "own rows" on public.people;
create policy "own rows" on public.people
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "own rows" on public.person_traits;
create policy "own rows" on public.person_traits
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "own rows" on public.person_lessons;
create policy "own rows" on public.person_lessons
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "own rows" on public.journal_entries;
create policy "own rows" on public.journal_entries
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
