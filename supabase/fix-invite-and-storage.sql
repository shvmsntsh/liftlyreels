-- =============================================================
-- Liftly: Fix invite codes + avatar storage
-- =============================================================
-- Run this ENTIRE script in your Supabase SQL Editor:
--   Dashboard → SQL Editor → New query → Paste → Run
-- =============================================================

-- =============================================================
-- 1. AVATARS STORAGE BUCKET
-- =============================================================
-- Create the bucket if it doesn't exist
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = true;

-- Storage policies for avatars bucket
-- (drop first to avoid "already exists" errors on re-run)
drop policy if exists "Public avatar access" on storage.objects;
drop policy if exists "Users can upload their own avatar" on storage.objects;
drop policy if exists "Users can update their own avatar" on storage.objects;
drop policy if exists "Users can delete their own avatar" on storage.objects;

create policy "Public avatar access"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "Users can upload their own avatar"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and auth.role() = 'authenticated'
  );

create policy "Users can update their own avatar"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and auth.role() = 'authenticated'
  );

create policy "Users can delete their own avatar"
  on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and auth.role() = 'authenticated'
  );

-- =============================================================
-- 2. INVITE CODE VALIDATION FUNCTION (bypasses RLS)
-- =============================================================
create or replace function public.check_invite_code(code_input text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text;
  v_used_by uuid;
  v_created_by uuid;
  v_profile_id uuid;
begin
  v_code := upper(trim(code_input));

  -- Check invite_codes table
  select ic.code, ic.used_by, ic.created_by
  into v_code, v_used_by, v_created_by
  from public.invite_codes ic
  where ic.code = v_code;

  if found then
    if v_used_by is not null then
      return json_build_object('valid', false, 'used', true);
    end if;
    return json_build_object('valid', true, 'code', v_code, 'created_by', v_created_by);
  end if;

  -- Check profiles table for personal invite codes
  select p.id into v_profile_id
  from public.profiles p
  where p.invite_code = v_code;

  if found then
    -- Also insert into invite_codes for future lookups
    insert into public.invite_codes (code, created_by)
    values (v_code, v_profile_id)
    on conflict (code) do nothing;

    return json_build_object('valid', true, 'code', v_code, 'created_by', v_profile_id);
  end if;

  return json_build_object('valid', false);
end;
$$;

-- Allow anyone (including anon) to call this function
grant execute on function public.check_invite_code(text) to anon, authenticated;

-- =============================================================
-- 3. ENSURE RLS POLICIES EXIST
-- =============================================================
-- These are idempotent — safe to re-run

-- invite_codes policies (permissive — allow all)
do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'Invite codes readable by all' and tablename = 'invite_codes') then
    create policy "Invite codes readable by all" on public.invite_codes for select using (true);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Invite codes insertable by all' and tablename = 'invite_codes') then
    create policy "Invite codes insertable by all" on public.invite_codes for insert with check (true);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Invite codes updatable by all' and tablename = 'invite_codes') then
    create policy "Invite codes updatable by all" on public.invite_codes for update using (true);
  end if;
end $$;

-- profiles policies
do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'Profiles viewable by authenticated users' and tablename = 'profiles') then
    create policy "Profiles viewable by authenticated users" on public.profiles for select using (auth.role() = 'authenticated');
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Users can insert own profile' and tablename = 'profiles') then
    create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Users can update own profile' and tablename = 'profiles') then
    create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
  end if;
end $$;

-- posts policies
do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'Posts viewable by authenticated users' and tablename = 'posts') then
    create policy "Posts viewable by authenticated users" on public.posts for select using (auth.role() = 'authenticated');
  end if;
end $$;

-- =============================================================
-- 4. BACKFILL: Copy personal invite codes from profiles → invite_codes
-- =============================================================
-- This ensures personal codes are always findable in invite_codes
insert into public.invite_codes (code, created_by)
select p.invite_code, p.id
from public.profiles p
where p.invite_code is not null
  and p.invite_code != ''
on conflict (code) do nothing;

-- =============================================================
-- DONE! Your invite codes and avatar uploads should now work.
-- =============================================================
