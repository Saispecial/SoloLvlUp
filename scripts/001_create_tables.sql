-- Create profiles table
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create quests table
create table if not exists public.quests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  xp_reward integer not null default 10,
  type text not null check (type in ('daily', 'weekly', 'main', 'side')),
  difficulty text not null check (difficulty in ('easy', 'medium', 'hard', 'extreme')),
  realm text not null check (realm in ('Physical Vitality', 'Mind & Skill', 'Social & Emotional', 'Spiritual Growth')),
  completed boolean default false,
  due_date timestamp with time zone,
  recurring boolean default false,
  stat_boosts jsonb default '{"iq": 0, "eq": 0, "strength": 0, "charisma": 0, "wisdom": 0, "luck": 0, "technical_attribute": 0, "aptitude": 0, "problem_solving": 0}'::jsonb,
  created_at timestamp with time zone default now(),
  completed_at timestamp with time zone
);

-- Create reflections table
create table if not exists public.reflections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  mood integer not null check (mood between 1 and 5),
  motivation integer not null check (motivation between 1 and 5),
  created_at timestamp with time zone default now()
);

-- Create player_stats table
create table if not exists public.player_stats (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade unique,
  level integer default 1,
  xp integer default 0,
  streak integer default 0,
  last_activity_date timestamp with time zone,
  stats jsonb default '{"iq": 0, "eq": 0, "strength": 0, "charisma": 0, "wisdom": 0, "luck": 0, "technical_attribute": 0, "aptitude": 0, "problem_solving": 0}'::jsonb,
  achievements jsonb default '[]'::jsonb,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create quest_history table for analytics
create table if not exists public.quest_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  quest_id uuid references public.quests(id) on delete set null,
  quest_title text not null,
  xp_gained integer not null,
  completed_at timestamp with time zone default now()
);

-- Enable Row Level Security
alter table public.profiles enable row level security;
alter table public.quests enable row level security;
alter table public.reflections enable row level security;
alter table public.player_stats enable row level security;
alter table public.quest_history enable row level security;

-- Profiles policies
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Quests policies
create policy "Users can view own quests"
  on public.quests for select
  using (auth.uid() = user_id);

create policy "Users can insert own quests"
  on public.quests for insert
  with check (auth.uid() = user_id);

create policy "Users can update own quests"
  on public.quests for update
  using (auth.uid() = user_id);

create policy "Users can delete own quests"
  on public.quests for delete
  using (auth.uid() = user_id);

-- Reflections policies
create policy "Users can view own reflections"
  on public.reflections for select
  using (auth.uid() = user_id);

create policy "Users can insert own reflections"
  on public.reflections for insert
  with check (auth.uid() = user_id);

create policy "Users can update own reflections"
  on public.reflections for update
  using (auth.uid() = user_id);

create policy "Users can delete own reflections"
  on public.reflections for delete
  using (auth.uid() = user_id);

-- Player stats policies
create policy "Users can view own stats"
  on public.player_stats for select
  using (auth.uid() = user_id);

create policy "Users can insert own stats"
  on public.player_stats for insert
  with check (auth.uid() = user_id);

create policy "Users can update own stats"
  on public.player_stats for update
  using (auth.uid() = user_id);

-- Quest history policies
create policy "Users can view own quest history"
  on public.quest_history for select
  using (auth.uid() = user_id);

create policy "Users can insert own quest history"
  on public.quest_history for insert
  with check (auth.uid() = user_id);
