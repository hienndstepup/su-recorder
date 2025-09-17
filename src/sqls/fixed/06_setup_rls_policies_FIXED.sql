-- GLOBAL RLS policies for reference tables + helper functions

-- Enable RLS on reference tables
ALTER TABLE regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE provinces ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

-- Drop & recreate idempotent policies
-- Regions
DROP POLICY IF EXISTS "Everyone can view active regions" ON regions;
DROP POLICY IF EXISTS "Only admins can modify regions" ON regions;

CREATE POLICY "Everyone can view active regions" ON regions
  FOR SELECT USING (is_active = true);

CREATE POLICY "Only admins can modify regions" ON regions
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- Provinces
DROP POLICY IF EXISTS "Everyone can view active provinces" ON provinces;
DROP POLICY IF EXISTS "Only admins can modify provinces" ON provinces;

CREATE POLICY "Everyone can view active provinces" ON provinces
  FOR SELECT USING (is_active = true);

CREATE POLICY "Only admins can modify provinces" ON provinces
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- Questions
DROP POLICY IF EXISTS "Everyone can view active questions" ON questions;
DROP POLICY IF EXISTS "Only admins can modify questions" ON questions;

CREATE POLICY "Everyone can view active questions" ON questions
  FOR SELECT USING (is_active = true);

CREATE POLICY "Only admins can modify questions" ON questions
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- Helper functions (keep here for convenience; is_admin already defined earlier)
CREATE OR REPLACE FUNCTION can_view_profile(target_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF is_admin() THEN
    RETURN TRUE;
  END IF;

  IF auth.uid() = target_user_id THEN
    RETURN TRUE;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = target_user_id AND referrer_id = auth.uid()
  ) THEN
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$;

CREATE OR REPLACE FUNCTION get_my_referrals()
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  affiliate_code VARCHAR(20),
  total_recordings INTEGER,
  total_duration INTEGER,
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF is_admin() THEN
    RETURN QUERY
    SELECT p.id, p.full_name, p.affiliate_code, p.total_recordings, p.total_duration, p.created_at
    FROM public.profiles p
    WHERE p.status = 'active'
    ORDER BY p.created_at DESC;
  ELSE
    RETURN QUERY
    SELECT p.id, p.full_name, p.affiliate_code, p.total_recordings, p.total_duration, p.created_at
    FROM public.profiles p
    WHERE p.referrer_id = auth.uid() AND p.status = 'active'
    ORDER BY p.created_at DESC;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION get_viewable_recordings()
RETURNS TABLE (
  id UUID,
  user_id UUID,
  user_name TEXT,
  question_id UUID,
  province_id UUID,
  audio_url TEXT,
  audio_duration INTEGER,
  recorded_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF is_admin() THEN
    RETURN QUERY
    SELECT r.id, r.user_id, p.full_name as user_name, r.question_id, r.province_id,
           r.audio_url, r.audio_duration, r.recorded_at
    FROM public.recordings r
    LEFT JOIN public.profiles p ON r.user_id = p.id
    ORDER BY r.recorded_at DESC;
  ELSE
    RETURN QUERY
    SELECT r.id, r.user_id, p.full_name as user_name, r.question_id, r.province_id,
           r.audio_url, r.audio_duration, r.recorded_at
    FROM public.recordings r
    LEFT JOIN public.profiles p ON r.user_id = p.id
    WHERE r.user_id = auth.uid()
       OR EXISTS (SELECT 1 FROM public.profiles WHERE id = r.user_id AND referrer_id = auth.uid())
    ORDER BY r.recorded_at DESC;
  END IF;
END;
$$;

COMMENT ON FUNCTION can_view_profile(UUID) IS 'Kiểm tra quyền xem profile (admin/self/referrals)';
COMMENT ON FUNCTION get_my_referrals() IS 'Danh sách CTV do user giới thiệu';
COMMENT ON FUNCTION get_viewable_recordings() IS 'Danh sách recordings user được xem';
