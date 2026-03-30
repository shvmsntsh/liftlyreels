-- =============================================================
-- Phase 1: Questions & Advice System
-- =============================================================

-- Extend posts table to support questions
alter table public.posts
  add column if not exists type text default 'reel' check (type in ('reel', 'question'));

alter table public.posts
  add column if not exists is_anonymous boolean default false;

-- =============================================================
-- ADVICE TABLE (answers/suggestions to questions)
-- =============================================================
create table if not exists public.advice (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  text text not null,
  is_anonymous boolean default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_advice_question_id on public.advice(question_id);
create index if not exists idx_advice_user_id on public.advice(user_id);

-- =============================================================
-- ADVICE UPVOTES TABLE (track helpful suggestions)
-- =============================================================
create table if not exists public.advice_upvotes (
  id uuid primary key default gen_random_uuid(),
  advice_id uuid not null references public.advice(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(advice_id, user_id)
);

create index if not exists idx_advice_upvotes_advice_id on public.advice_upvotes(advice_id);
create index if not exists idx_advice_upvotes_user_id on public.advice_upvotes(user_id);

-- =============================================================
-- RLS POLICIES
-- =============================================================

-- Enable RLS on advice table
alter table public.advice enable row level security;

-- Advice: public read, owner/service write
create policy "Advice is publicly readable" on public.advice
  for select using (true);

create policy "Users can insert their own advice" on public.advice
  for insert with check (auth.uid() = user_id);

create policy "Users can delete their own advice" on public.advice
  for delete using (auth.uid() = user_id);

-- Enable RLS on advice_upvotes table
alter table public.advice_upvotes enable row level security;

-- Upvotes: public read, authenticated users can create/delete
create policy "Upvotes are publicly readable" on public.advice_upvotes
  for select using (true);

create policy "Authenticated users can upvote advice" on public.advice_upvotes
  for insert with check (auth.role() = 'authenticated');

create policy "Users can delete their own upvotes" on public.advice_upvotes
  for delete using (auth.uid() = user_id);
