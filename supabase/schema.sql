-- =============================================================
-- Liftly Full Schema v2
-- =============================================================

create extension if not exists "pgcrypto";

-- =============================================================
-- POSTS TABLE (enhanced)
-- =============================================================
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  title text not null unique,
  content jsonb not null default '[]'::jsonb,
  category text not null,
  source text not null,
  image_url text,
  author_id uuid references auth.users(id) on delete set null,
  is_user_created boolean default false,
  tags text[] default '{}',
  views_count integer default 0,
  gradient text default 'ocean',
  created_at timestamptz not null default now()
);

-- =============================================================
-- USER PROFILES TABLE
-- =============================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  display_name text,
  avatar_url text,
  bio text,
  vibe_score integer default 0,
  invite_code text unique,
  invited_by uuid references public.profiles(id),
  streak_current integer default 0,
  streak_longest integer default 0,
  streak_last_active date,
  created_at timestamptz not null default now()
);

-- =============================================================
-- INVITE CODES TABLE
-- =============================================================
create table if not exists public.invite_codes (
  code text primary key,
  created_by uuid references public.profiles(id),
  used_by uuid references public.profiles(id),
  used_at timestamptz,
  created_at timestamptz not null default now()
);

-- =============================================================
-- REACTIONS TABLE (replaces simple likes)
-- =============================================================
create table if not exists public.reactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  post_id uuid not null references public.posts(id) on delete cascade,
  reaction_type text not null check (reaction_type in ('sparked', 'fired_up', 'bookmarked')),
  created_at timestamptz not null default now(),
  unique(user_id, post_id, reaction_type)
);

-- =============================================================
-- COMMENTS TABLE
-- =============================================================
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  post_id uuid not null references public.posts(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

-- =============================================================
-- FOLLOWS TABLE
-- =============================================================
create table if not exists public.follows (
  follower_id uuid not null references auth.users(id) on delete cascade,
  following_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id)
);

-- =============================================================
-- DAILY CHALLENGES TABLE
-- =============================================================
create table if not exists public.daily_challenges (
  id uuid primary key default gen_random_uuid(),
  date date unique not null,
  post_id uuid references public.posts(id),
  challenge_text text not null,
  completions_count integer default 0,
  created_at timestamptz not null default now()
);

-- =============================================================
-- CHALLENGE COMPLETIONS TABLE
-- =============================================================
create table if not exists public.challenge_completions (
  user_id uuid not null references auth.users(id) on delete cascade,
  challenge_id uuid not null references public.daily_challenges(id) on delete cascade,
  note text,
  completed_at timestamptz not null default now(),
  primary key (user_id, challenge_id)
);

-- =============================================================
-- IMPACT JOURNAL TABLE
-- =============================================================
create table if not exists public.impact_journal (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  post_id uuid not null references public.posts(id) on delete cascade,
  action_taken text not null,
  created_at timestamptz not null default now()
);

-- =============================================================
-- INDEXES
-- =============================================================
create index if not exists posts_created_at_idx on public.posts (created_at desc);
create index if not exists posts_category_idx on public.posts (category);
create index if not exists posts_author_idx on public.posts (author_id);
create index if not exists reactions_post_id_idx on public.reactions (post_id);
create index if not exists reactions_user_id_idx on public.reactions (user_id);
create index if not exists comments_post_id_idx on public.comments (post_id);
create index if not exists follows_follower_idx on public.follows (follower_id);
create index if not exists follows_following_idx on public.follows (following_id);
create index if not exists profiles_username_idx on public.profiles (username);
create index if not exists impact_journal_user_idx on public.impact_journal (user_id);
create index if not exists daily_challenges_date_idx on public.daily_challenges (date desc);

-- =============================================================
-- ROW LEVEL SECURITY
-- =============================================================
alter table public.posts enable row level security;
alter table public.profiles enable row level security;
alter table public.invite_codes enable row level security;
alter table public.reactions enable row level security;
alter table public.comments enable row level security;
alter table public.follows enable row level security;
alter table public.daily_challenges enable row level security;
alter table public.challenge_completions enable row level security;
alter table public.impact_journal enable row level security;

-- POSTS POLICIES
create policy "Posts viewable by authenticated users"
  on public.posts for select using (auth.role() = 'authenticated');
create policy "Users can create posts"
  on public.posts for insert with check (auth.uid() = author_id or author_id is null);
create policy "Users can update own posts"
  on public.posts for update using (auth.uid() = author_id);
create policy "Users can delete own posts"
  on public.posts for delete using (auth.uid() = author_id and is_user_created = true);

-- PROFILES POLICIES
create policy "Profiles viewable by authenticated users"
  on public.profiles for select using (auth.role() = 'authenticated');
create policy "Users can insert own profile"
  on public.profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

-- INVITE CODES POLICIES
create policy "Invite codes readable by all"
  on public.invite_codes for select using (true);
create policy "Invite codes insertable by all"
  on public.invite_codes for insert with check (true);
create policy "Invite codes updatable by all"
  on public.invite_codes for update using (true);

-- REACTIONS POLICIES
create policy "Reactions viewable by authenticated users"
  on public.reactions for select using (auth.role() = 'authenticated');
create policy "Users can manage own reactions"
  on public.reactions for all using (auth.uid() = user_id);

-- COMMENTS POLICIES
create policy "Comments viewable by authenticated users"
  on public.comments for select using (auth.role() = 'authenticated');
create policy "Users can insert own comments"
  on public.comments for insert with check (auth.uid() = user_id);
create policy "Users can delete own comments"
  on public.comments for delete using (auth.uid() = user_id);

-- FOLLOWS POLICIES
create policy "Follows viewable by authenticated users"
  on public.follows for select using (auth.role() = 'authenticated');
create policy "Users can manage own follows"
  on public.follows for all using (auth.uid() = follower_id);

-- DAILY CHALLENGES POLICIES
create policy "Challenges viewable by authenticated users"
  on public.daily_challenges for select using (auth.role() = 'authenticated');
create policy "Challenges insertable by anyone"
  on public.daily_challenges for insert with check (true);

-- CHALLENGE COMPLETIONS POLICIES
create policy "Completions viewable by authenticated users"
  on public.challenge_completions for select using (auth.role() = 'authenticated');
create policy "Users can manage own completions"
  on public.challenge_completions for all using (auth.uid() = user_id);

-- IMPACT JOURNAL POLICIES
create policy "Users can view own journal"
  on public.impact_journal for select using (auth.uid() = user_id);
create policy "Users can insert own journal entries"
  on public.impact_journal for insert with check (auth.uid() = user_id);

-- =============================================================
-- STREAK UPDATE FUNCTION
-- =============================================================
create or replace function public.update_user_streak(user_uuid uuid)
returns void as $$
declare
  last_active date;
  current_streak int;
  longest_streak int;
begin
  select streak_last_active, streak_current, streak_longest
  into last_active, current_streak, longest_streak
  from public.profiles where id = user_uuid;

  if last_active is null then
    current_streak := 1;
  elsif last_active < current_date - interval '1 day' then
    -- missed a day or more, reset streak
    current_streak := 1;
  elsif last_active = current_date - interval '1 day' then
    -- came back the next day, increment
    current_streak := current_streak + 1;
  elsif last_active = current_date then
    -- already active today, no change
    return;
  end if;

  if current_streak > coalesce(longest_streak, 0) then
    longest_streak := current_streak;
  end if;

  update public.profiles set
    streak_current = current_streak,
    streak_longest = longest_streak,
    streak_last_active = current_date,
    vibe_score = vibe_score + 1
  where id = user_uuid;
end;
$$ language plpgsql security definer;

-- =============================================================
-- SEED INITIAL INVITE CODES (10 bootstrap codes)
-- =============================================================
insert into public.invite_codes (code, created_by) values
  ('SPARK-RISE-001', null),
  ('SPARK-RISE-002', null),
  ('SPARK-RISE-003', null),
  ('LIFT-UP-2025', null),
  ('GLOW-UP-REELS', null),
  ('MINDSET-FIRST', null),
  ('BETTER-DAILY-1', null),
  ('GRIND-SMART-01', null),
  ('INNER-FIRE-001', null),
  ('POSITIVITY-KEY', null)
on conflict do nothing;

-- =============================================================
-- SEED INITIAL DAILY CHALLENGE
-- =============================================================
insert into public.daily_challenges (date, challenge_text, completions_count)
values (current_date, 'Write down one thing you will do differently today after watching a reel. Share it with someone you trust.', 0)
on conflict (date) do nothing;
