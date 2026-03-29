-- v1.21 Migration: Analytics, Engagement Scoring, and Feed Personalization

-- E1: API error logging table
CREATE TABLE IF NOT EXISTS public.api_errors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint text NOT NULL,
  error_message text,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status_code integer,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_api_errors_created_at ON public.api_errors(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_errors_endpoint ON public.api_errors(endpoint);

-- E7: Engagement score tracking on posts
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS cached_engagement_score float DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_posts_engagement_score ON public.posts(cached_engagement_score DESC);

-- E3: Separate content reports from bug reports
ALTER TABLE public.bug_reports ADD COLUMN IF NOT EXISTS report_type text DEFAULT 'bug' CHECK (report_type IN ('bug', 'content'));

UPDATE public.bug_reports
SET report_type = 'content'
WHERE title ILIKE 'Content Report:%' OR title ILIKE 'Report:%';

-- E8: Perfect Day badge
INSERT INTO public.badges (id, name, description, icon, unlocked_at)
VALUES ('perfect_day', 'Perfect Day', 'Completed daily challenge AND proved 5 reels in one day', '⭐', now())
ON CONFLICT (id) DO NOTHING;
