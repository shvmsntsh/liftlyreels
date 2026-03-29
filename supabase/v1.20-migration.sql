-- v1.20 Migration — Run in Supabase SQL Editor
-- Adds: blocked user support, suggested_action for collected content,
--        content_collection_log table, and performance indexes.

-- ── Blocked user support ─────────────────────────────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_blocked boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS blocked_at timestamptz,
  ADD COLUMN IF NOT EXISTS blocked_by uuid;

-- ── Suggested action for collected content ───────────────────────────────
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS suggested_action text;

-- ── Indexes for collected content queries + cleanup ──────────────────────
CREATE INDEX IF NOT EXISTS posts_source_idx ON public.posts(source);
CREATE INDEX IF NOT EXISTS posts_autocollected_idx ON public.posts(created_at)
  WHERE author_id IS NULL AND is_user_created = false;

-- ── Content collection run log (for admin dashboard) ─────────────────────
CREATE TABLE IF NOT EXISTS public.content_collection_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_at timestamptz NOT NULL DEFAULT now(),
  items_collected integer DEFAULT 0,
  items_deleted integer DEFAULT 0,
  sources_summary jsonb DEFAULT '{}'::jsonb,
  errors text[],
  triggered_by text DEFAULT 'cron' CHECK (triggered_by IN ('cron', 'admin'))
);

ALTER TABLE public.content_collection_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Collection log readable by authenticated"
  ON public.content_collection_log
  FOR SELECT
  USING (auth.role() = 'authenticated');
