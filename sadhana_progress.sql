-- ============================================================
-- SADHANA PROGRESS ENGINE — SUPABASE SQL
-- Run this in your Supabase SQL Editor.
-- ============================================================

-- ── Enable UUID extension (already on by default in Supabase) ─
create extension if not exists "uuid-ossp";

-- ============================================================
-- TABLE: sadhana_progress
-- One row per user. Upserted on every practice completion.
-- ============================================================
create table if not exists public.sadhana_progress (
  id                        uuid primary key default uuid_generate_v4(),
  user_id                   uuid not null unique references auth.users(id) on delete cascade,

  -- XP & Level
  current_xp                integer      not null default 0,
  level_number              smallint     not null default 1,
  level_name                text         not null default 'Temple Entrance',

  -- Streak
  current_streak            integer      not null default 0,
  longest_streak            integer      not null default 0,
  last_completed_date       date,

  -- Today's snapshot (reset each new day by the engine)
  today_date                date         not null default current_date,
  today_meditation_done     boolean      not null default false,
  today_japa_done           boolean      not null default false,
  today_mantra_done         boolean      not null default false,
  today_gratitude_done      boolean      not null default false,
  completion_percentage     smallint     not null default 0,  -- 0–100

  -- Lifetime totals
  total_meditation_sessions integer      not null default 0,
  total_meditation_minutes  integer      not null default 0,
  total_japa_count          integer      not null default 0,
  total_mantra_sessions     integer      not null default 0,
  total_audio_minutes       integer      not null default 0,
  total_gratitude_entries   integer      not null default 0,

  -- Milestones: array of streak-day counts already awarded
  milestones_achieved       integer[]    not null default '{}',

  created_at                timestamptz  not null default now(),
  updated_at                timestamptz  not null default now()
);

-- ── Indexes ──────────────────────────────────────────────────
create index if not exists idx_sadhana_progress_user_id
  on public.sadhana_progress(user_id);

create index if not exists idx_sadhana_progress_today_date
  on public.sadhana_progress(today_date);

-- ── Auto-update updated_at ────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_sadhana_progress_updated_at on public.sadhana_progress;
create trigger trg_sadhana_progress_updated_at
  before update on public.sadhana_progress
  for each row execute function public.set_updated_at();

-- ============================================================
-- TABLE: sadhana_practice_log
-- Append-only log of every individual practice event.
-- Useful for history, analytics, and future features.
-- ============================================================
create table if not exists public.sadhana_practice_log (
  id                uuid        primary key default uuid_generate_v4(),
  user_id           uuid        not null references auth.users(id) on delete cascade,
  practice_type     text        not null check (practice_type in ('meditation','japa','mantra','gratitude')),
  xp_awarded        integer     not null default 0,
  duration_minutes  integer,    -- meditation / mantra
  japa_count        integer,    -- japa repetitions
  listen_ratio      numeric(4,3), -- mantra: 0.000–1.000
  level_at_time     smallint    not null default 1,
  logged_at         timestamptz not null default now()
);

create index if not exists idx_practice_log_user_id
  on public.sadhana_practice_log(user_id);

create index if not exists idx_practice_log_logged_at
  on public.sadhana_practice_log(logged_at desc);

create index if not exists idx_practice_log_type
  on public.sadhana_practice_log(practice_type);

-- ============================================================
-- TABLE: sadhana_milestones
-- Records each milestone achievement with a timestamp.
-- Prevents duplicate rewards via unique constraint.
-- ============================================================
create table if not exists public.sadhana_milestones (
  id           uuid        primary key default uuid_generate_v4(),
  user_id      uuid        not null references auth.users(id) on delete cascade,
  streak_days  integer     not null,  -- 3, 7, 14, 21, 30, 50, 100, 365
  achieved_at  timestamptz not null default now(),

  unique (user_id, streak_days)  -- prevents duplicate milestone rewards
);

create index if not exists idx_milestones_user_id
  on public.sadhana_milestones(user_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- Users can only read/write their own rows.
-- ============================================================

-- sadhana_progress
alter table public.sadhana_progress enable row level security;

create policy "Users can view own progress"
  on public.sadhana_progress for select
  using (auth.uid() = user_id);

create policy "Users can insert own progress"
  on public.sadhana_progress for insert
  with check (auth.uid() = user_id);

create policy "Users can update own progress"
  on public.sadhana_progress for update
  using (auth.uid() = user_id);

-- sadhana_practice_log
alter table public.sadhana_practice_log enable row level security;

create policy "Users can view own practice log"
  on public.sadhana_practice_log for select
  using (auth.uid() = user_id);

create policy "Users can insert own practice log"
  on public.sadhana_practice_log for insert
  with check (auth.uid() = user_id);

-- sadhana_milestones
alter table public.sadhana_milestones enable row level security;

create policy "Users can view own milestones"
  on public.sadhana_milestones for select
  using (auth.uid() = user_id);

create policy "Users can insert own milestones"
  on public.sadhana_milestones for insert
  with check (auth.uid() = user_id);

-- ============================================================
-- REALTIME
-- Enable realtime so the UI updates live without polling.
-- ============================================================
alter publication supabase_realtime add table public.sadhana_progress;
alter publication supabase_realtime add table public.sadhana_practice_log;
alter publication supabase_realtime add table public.sadhana_milestones;

-- ============================================================
-- HELPER VIEW: today_sadhana_summary
-- Convenient read for the home/sadhana screens.
-- ============================================================
create or replace view public.today_sadhana_summary as
select
  sp.user_id,
  sp.current_xp,
  sp.level_number,
  sp.level_name,
  sp.current_streak,
  sp.longest_streak,
  sp.today_meditation_done,
  sp.today_japa_done,
  sp.today_mantra_done,
  sp.today_gratitude_done,
  sp.completion_percentage,
  sp.milestones_achieved,
  sp.last_completed_date,
  sp.updated_at
from public.sadhana_progress sp
where sp.today_date = current_date;
