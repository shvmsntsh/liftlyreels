-- =============================================================
-- Liftly: Complete invite system fix (v3)
-- Run this in Supabase SQL Editor
-- =============================================================

-- 1. Fix FK constraints: invite_codes should reference auth.users, not profiles
--    This fixes the chicken-and-egg problem during signup
ALTER TABLE public.invite_codes DROP CONSTRAINT IF EXISTS invite_codes_created_by_fkey;
ALTER TABLE public.invite_codes DROP CONSTRAINT IF EXISTS invite_codes_used_by_fkey;

ALTER TABLE public.invite_codes
  ADD CONSTRAINT invite_codes_created_by_fkey
    FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.invite_codes
  ADD CONSTRAINT invite_codes_used_by_fkey
    FOREIGN KEY (used_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- 2. Backfill: ensure all personal codes from profiles are in invite_codes
INSERT INTO public.invite_codes (code, created_by)
SELECT p.invite_code, p.id
FROM public.profiles p
WHERE p.invite_code IS NOT NULL AND p.invite_code != ''
ON CONFLICT (code) DO NOTHING;

-- 3. Ensure bootstrap codes exist in invite_codes
INSERT INTO public.invite_codes (code) VALUES
  ('SPARK-RISE-001'), ('SPARK-RISE-002'), ('SPARK-RISE-003'),
  ('LIFT-UP-2025'), ('GLOW-UP-REELS'), ('MINDSET-FIRST'),
  ('BETTER-DAILY-1'), ('GRIND-SMART-01'), ('INNER-FIRE-001'), ('POSITIVITY-KEY')
ON CONFLICT (code) DO NOTHING;

-- 4. check_invite_code RPC (fixed variable bug)
CREATE OR REPLACE FUNCTION public.check_invite_code(code_input text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code text := upper(trim(code_input));
  v_used_by uuid;
  v_created_by uuid;
  v_profile_id uuid;
BEGIN
  -- Check invite_codes table
  SELECT ic.used_by, ic.created_by
  INTO v_used_by, v_created_by
  FROM invite_codes ic
  WHERE ic.code = v_code;

  IF found THEN
    IF v_used_by IS NOT NULL THEN
      RETURN json_build_object('valid', false, 'used', true);
    END IF;
    RETURN json_build_object('valid', true, 'code', v_code, 'created_by', v_created_by);
  END IF;

  -- Check profiles for personal codes
  SELECT p.id INTO v_profile_id
  FROM profiles p
  WHERE p.invite_code = v_code;

  IF found THEN
    INSERT INTO invite_codes (code, created_by)
    VALUES (v_code, v_profile_id)
    ON CONFLICT (code) DO NOTHING;
    RETURN json_build_object('valid', true, 'code', v_code, 'created_by', v_profile_id);
  END IF;

  RETURN json_build_object('valid', false);
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_invite_code(text) TO anon, authenticated;

-- 5. complete_signup RPC — does everything atomically, bypasses RLS
CREATE OR REPLACE FUNCTION public.complete_signup(
  p_user_id uuid,
  p_username text,
  p_display_name text,
  p_invite_code text
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code text := upper(trim(p_invite_code));
  v_clean_username text := lower(trim(p_username));
  v_display text := coalesce(nullif(trim(p_display_name), ''), p_username);
  v_creator uuid;
  v_used_by uuid;
  v_user_code text;
  v_new_codes text[] := array[]::text[];
  v_words text[] := array['SPARK','RISE','LIFT','GLOW','FIRE','GROW','BOLD','MIND','SOUL','PEAK','FLOW','VIBE','FUEL','CORE'];
  v_i int;
BEGIN
  -- Check if profile already exists
  IF EXISTS (SELECT 1 FROM profiles WHERE id = p_user_id) THEN
    RETURN json_build_object('success', true, 'already_exists', true);
  END IF;

  -- Validate invite code: check invite_codes table
  SELECT ic.used_by, ic.created_by INTO v_used_by, v_creator
  FROM invite_codes ic WHERE ic.code = v_code;

  IF found THEN
    IF v_used_by IS NOT NULL THEN
      RETURN json_build_object('success', false, 'error', 'Invite code already used');
    END IF;
  ELSE
    -- Not in invite_codes — check profiles for personal codes
    SELECT p.id INTO v_creator FROM profiles p WHERE p.invite_code = v_code;
    IF NOT found THEN
      RETURN json_build_object('success', false, 'error', 'Invalid invite code');
    END IF;
  END IF;

  -- Check username uniqueness
  IF EXISTS (SELECT 1 FROM profiles WHERE username = v_clean_username) THEN
    RETURN json_build_object('success', false, 'error', 'Username already taken');
  END IF;

  -- Generate personal code for new user
  v_user_code := v_words[1 + floor(random() * 14)::int]
    || '-' || v_words[1 + floor(random() * 14)::int]
    || '-' || lpad((100 + floor(random() * 900))::text, 3, '0');

  -- Generate 3 extra invite codes
  FOR v_i IN 1..3 LOOP
    v_new_codes := v_new_codes || (
      v_words[1 + floor(random() * 14)::int]
      || '-' || v_words[1 + floor(random() * 14)::int]
      || '-' || lpad((100 + floor(random() * 900))::text, 3, '0')
    );
  END LOOP;

  -- Create profile
  INSERT INTO profiles (id, username, display_name, invite_code, invited_by, streak_current, streak_last_active)
  VALUES (p_user_id, v_clean_username, v_display, v_user_code, v_creator, 1, current_date);

  -- Mark invite code as used
  UPDATE invite_codes SET used_by = p_user_id, used_at = now() WHERE code = v_code;

  -- Insert new invite codes for the user
  INSERT INTO invite_codes (code, created_by) VALUES (v_user_code, p_user_id)
  ON CONFLICT (code) DO NOTHING;
  FOR v_i IN 1..3 LOOP
    INSERT INTO invite_codes (code, created_by) VALUES (v_new_codes[v_i], p_user_id)
    ON CONFLICT (code) DO NOTHING;
  END LOOP;

  RETURN json_build_object(
    'success', true,
    'user_code', v_user_code,
    'new_codes', to_json(v_new_codes)
  );

EXCEPTION WHEN unique_violation THEN
  RETURN json_build_object('success', true, 'already_exists', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.complete_signup(uuid, text, text, text) TO authenticated;

-- 6. Clean up test data
-- Remove test invite codes first (FK constraints)
UPDATE public.invite_codes SET used_by = NULL
WHERE used_by IN (SELECT id FROM auth.users WHERE email IN ('shivam2@yopmail.com', 'shivam3@yopmail.com'));

DELETE FROM public.invite_codes
WHERE created_by IN (SELECT id FROM auth.users WHERE email IN ('shivam2@yopmail.com', 'shivam3@yopmail.com'));

-- Remove test profiles (will cascade from auth.users delete)
-- Remove test auth users
DELETE FROM auth.users WHERE email IN ('shivam2@yopmail.com', 'shivam3@yopmail.com');

-- Also reset any used_by on codes that were used by test users (now deleted)
UPDATE public.invite_codes SET used_by = NULL, used_at = NULL WHERE used_by IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM auth.users WHERE id = used_by);

-- =============================================================
-- DONE! Now deploy the updated code and test.
-- =============================================================
