create extension if not exists "pgcrypto";

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  title text not null unique,
  content jsonb not null default '[]'::jsonb,
  category text not null,
  source text not null,
  image_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.likes (
  user_id text not null,
  post_id uuid not null references public.posts(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, post_id)
);

create table if not exists public.saved_posts (
  user_id text not null,
  post_id uuid not null references public.posts(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, post_id)
);

create index if not exists posts_created_at_idx on public.posts (created_at desc);
create index if not exists posts_category_idx on public.posts (category);
create index if not exists likes_post_id_idx on public.likes (post_id);
create index if not exists saved_posts_post_id_idx on public.saved_posts (post_id);
