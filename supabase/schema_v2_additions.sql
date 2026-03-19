-- =============================================================
-- Liftly Schema v2 Additions — Unique Feature Set
-- Run this AFTER schema.sql
-- =============================================================

-- =============================================================
-- EARLY TESTERS / FOUNDERS TABLE
-- First 100 users get permanent Founder status + perks
-- =============================================================
create table if not exists public.early_testers (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  tester_number integer unique,  -- e.g. #1, #2, #42
  tier text default 'founder' check (tier in ('founder', 'pioneer', 'contributor')),
  bug_reports_count integer default 0,
  joined_at timestamptz not null default now()
);

alter table public.early_testers enable row level security;
create policy "Early tester records readable by all authenticated"
  on public.early_testers for select using (auth.role() = 'authenticated');
create policy "Service can manage early testers"
  on public.early_testers for all using (true);

-- Sequence for tester number
create sequence if not exists public.tester_number_seq start 1;

-- =============================================================
-- BUG REPORTS TABLE
-- Users can submit bugs, earn Vibe + "Bug Crusher" badge
-- =============================================================
create table if not exists public.bug_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text not null,
  severity text default 'low' check (severity in ('low', 'medium', 'high', 'critical')),
  status text default 'open' check (status in ('open', 'triaging', 'fixed', 'wontfix')),
  reward_given boolean default false,
  created_at timestamptz not null default now()
);

alter table public.bug_reports enable row level security;
create policy "Users can view all bug reports"
  on public.bug_reports for select using (auth.role() = 'authenticated');
create policy "Users can submit bug reports"
  on public.bug_reports for insert with check (auth.uid() = user_id);

-- =============================================================
-- BADGES TABLE
-- Achievement system — earned via actions
-- =============================================================
create table if not exists public.badges (
  id text primary key,  -- e.g. 'first_spark', 'streak_7', 'bug_crusher'
  name text not null,
  description text not null,
  emoji text not null,
  rarity text default 'common' check (rarity in ('common', 'rare', 'epic', 'legendary'))
);

create table if not exists public.user_badges (
  user_id uuid not null references public.profiles(id) on delete cascade,
  badge_id text not null references public.badges(id),
  earned_at timestamptz not null default now(),
  primary key (user_id, badge_id)
);

alter table public.badges enable row level security;
alter table public.user_badges enable row level security;
create policy "Badges readable by all"
  on public.badges for select using (true);
create policy "User badges readable by authenticated"
  on public.user_badges for select using (auth.role() = 'authenticated');
create policy "Service can manage user badges"
  on public.user_badges for all using (true);

-- Seed badge definitions
insert into public.badges (id, name, description, emoji, rarity) values
  ('founder', 'Founding Member', 'One of the first 100 people on Liftly', '🏛️', 'legendary'),
  ('pioneer', 'Pioneer', 'Joined in the first 500', '⚡', 'epic'),
  ('bug_crusher', 'Bug Crusher', 'Reported a valid bug that was fixed', '🐛', 'rare'),
  ('first_spark', 'First Spark', 'Sent your first ⚡ Spark reaction', '✨', 'common'),
  ('streak_3', '3-Day Streak', 'Showed up 3 days in a row', '🌱', 'common'),
  ('streak_7', 'Week Warrior', 'Kept a 7-day streak', '🔥', 'common'),
  ('streak_14', '2-Week Legend', '14 days straight — you''re serious', '💎', 'rare'),
  ('streak_30', 'Month Master', '30-day streak. Unstoppable.', '🏆', 'epic'),
  ('first_reel', 'Content Creator', 'Posted your very first reel', '🎬', 'common'),
  ('impact_logger', 'Action Taker', 'Logged your first real-world impact', '📓', 'common'),
  ('ripple_1', 'Ripple Starter', 'Your invite grew into a 5-person tree', '🌊', 'rare'),
  ('challenge_5', 'Challenger', 'Completed 5 daily challenges', '💪', 'common'),
  ('vibe_100', 'Vibe Rising', 'Reached 100 Vibe Score', '⭐', 'common'),
  ('vibe_500', 'Vibe Legend', 'Reached 500 Vibe Score', '🌟', 'epic'),
  ('wisdomkeeper', 'Wisdom Keeper', 'Bookmarked 10+ reels', '📚', 'common')
on conflict do nothing;

-- =============================================================
-- BLINDSPOT REELS — track which categories user has engaged with
-- =============================================================
create table if not exists public.user_category_engagement (
  user_id uuid not null references public.profiles(id) on delete cascade,
  category text not null,
  engagement_count integer default 1,
  last_engaged_at timestamptz default now(),
  primary key (user_id, category)
);

alter table public.user_category_engagement enable row level security;
create policy "Users can manage own category engagement"
  on public.user_category_engagement for all using (auth.uid() = user_id);

-- =============================================================
-- MICRO COMMITMENTS — reminder system for bookmarked reels
-- =============================================================
create table if not exists public.micro_commitments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  post_id uuid not null references public.posts(id) on delete cascade,
  remind_at timestamptz not null,
  reminder_type text default '24h' check (reminder_type in ('24h', '7d')),
  completed boolean default false,
  created_at timestamptz not null default now()
);

alter table public.micro_commitments enable row level security;
create policy "Users can manage own commitments"
  on public.micro_commitments for all using (auth.uid() = user_id);

-- =============================================================
-- REEL CHAINS — series of reels (like episodes)
-- =============================================================
create table if not exists public.reel_chains (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  author_id uuid references public.profiles(id),
  is_curated boolean default false,
  cover_gradient text default 'ocean',
  created_at timestamptz not null default now()
);

create table if not exists public.chain_posts (
  chain_id uuid not null references public.reel_chains(id) on delete cascade,
  post_id uuid not null references public.posts(id) on delete cascade,
  position integer not null,
  primary key (chain_id, post_id)
);

alter table public.reel_chains enable row level security;
alter table public.chain_posts enable row level security;
create policy "Chains readable by authenticated"
  on public.reel_chains for select using (auth.role() = 'authenticated');
create policy "Users can create chains"
  on public.reel_chains for insert with check (auth.uid() = author_id);
create policy "Chain posts readable by authenticated"
  on public.chain_posts for select using (auth.role() = 'authenticated');
create policy "Authors can manage chain posts"
  on public.chain_posts for all using (true);

-- =============================================================
-- WISDOM ARCHIVE — personal searchable library of bookmarked reels
-- (view over reactions with bookmarked type)
-- =============================================================
create or replace view public.wisdom_archive as
  select
    r.user_id,
    r.post_id,
    r.created_at as bookmarked_at,
    p.title,
    p.category,
    p.content,
    p.gradient,
    p.source
  from public.reactions r
  join public.posts p on p.id = r.post_id
  where r.reaction_type = 'bookmarked';

-- =============================================================
-- WEEKLY GRATITUDE JOURNAL (Gratitude Glitch)
-- =============================================================
create table if not exists public.gratitude_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  week_start date not null,
  what_worked text not null,
  what_to_change text not null,
  who_inspired text,
  created_at timestamptz not null default now(),
  unique (user_id, week_start)
);

alter table public.gratitude_entries enable row level security;
create policy "Users can manage own gratitude entries"
  on public.gratitude_entries for all using (auth.uid() = user_id);

-- =============================================================
-- PARTNERSHIP INTEGRATIONS (health app data connections)
-- =============================================================
create table if not exists public.health_integrations (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  apple_health_connected boolean default false,
  steps_today integer,
  sleep_hours_last_night numeric(4,2),
  active_calories_today integer,
  synced_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.health_integrations enable row level security;
create policy "Users can manage own health integrations"
  on public.health_integrations for all using (auth.uid() = user_id);

-- =============================================================
-- PREMIUM SUBSCRIPTIONS
-- =============================================================
create table if not exists public.subscriptions (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  tier text default 'free' check (tier in ('free', 'pro', 'founding_pro')),
  stripe_customer_id text,
  stripe_subscription_id text,
  current_period_end timestamptz,
  created_at timestamptz not null default now()
);

alter table public.subscriptions enable row level security;
create policy "Users can view own subscription"
  on public.subscriptions for select using (auth.uid() = user_id);
create policy "Service manages subscriptions"
  on public.subscriptions for all using (true);

-- Add columns to profiles for premium feature tracking
alter table public.profiles
  add column if not exists has_founding_badge boolean default false,
  add column if not exists tester_number integer,
  add column if not exists momentum_mode_start time,  -- preferred viewing window start
  add column if not exists momentum_mode_end time;    -- preferred viewing window end

-- =============================================================
-- RIPPLE TREE VIEW
-- Shows invite lineage and collective vibe
-- =============================================================
create or replace function public.get_ripple_tree(root_user uuid, max_depth int default 4)
returns table(user_id uuid, username text, vibe_score int, depth int, parent_id uuid) as $$
  with recursive tree as (
    select
      p.id as user_id,
      p.username,
      p.vibe_score,
      0 as depth,
      null::uuid as parent_id
    from public.profiles p
    where p.id = root_user

    union all

    select
      p.id,
      p.username,
      p.vibe_score,
      t.depth + 1,
      p.invited_by
    from public.profiles p
    join tree t on t.user_id = p.invited_by
    where t.depth < max_depth
  )
  select * from tree;
$$ language sql security definer;
