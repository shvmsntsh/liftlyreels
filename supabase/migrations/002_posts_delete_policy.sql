drop policy if exists "Users can delete own posts" on public.posts;

create policy "Users can delete own posts"
  on public.posts for delete using (auth.uid() = author_id and is_user_created = true);
