-- Drop existing functions to avoid conflicts
DROP FUNCTION IF EXISTS public.get_recordings_report(VARCHAR, TIMESTAMPTZ, TIMESTAMPTZ);
DROP FUNCTION IF EXISTS public.get_recordings_report(VARCHAR);
DROP FUNCTION IF EXISTS public.get_recordings_report();
DROP FUNCTION IF EXISTS public.get_recordings_detailed_report(TIMESTAMPTZ, TIMESTAMPTZ, INTEGER);
DROP FUNCTION IF EXISTS public.get_recordings_detailed_report(TIMESTAMPTZ, TIMESTAMPTZ);
DROP FUNCTION IF EXISTS public.get_recordings_detailed_report();

-- Function to get recordings report by date/week/month with role-based access
-- Admin can see all recordings, CTV can only see recordings from their referrals
CREATE OR REPLACE FUNCTION public.get_recordings_report(
  report_type VARCHAR(10) DEFAULT 'day', -- 'day', 'week', 'month'
  start_date TIMESTAMPTZ DEFAULT NULL,
  end_date TIMESTAMPTZ DEFAULT NULL,
  user_filter UUID DEFAULT NULL -- Filter by specific user ID, NULL means all users
)
RETURNS TABLE (
  period CHARACTER VARYING,
  period_date DATE,
  total_recordings BIGINT,
  total_duration BIGINT,
  total_payment NUMERIC,
  avg_duration NUMERIC,
  unique_users BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_role VARCHAR(20);
  current_user_id UUID;
  date_trunc_format TEXT;
BEGIN
  -- Get current user's role and id
  SELECT p.role, p.id INTO current_user_role, current_user_id
  FROM public.profiles p
  WHERE p.id = auth.uid();

  -- Set default date range if not provided
  IF start_date IS NULL THEN
    CASE report_type
      WHEN 'day' THEN start_date := CURRENT_DATE;
      WHEN 'week' THEN start_date := DATE_TRUNC('week', CURRENT_DATE);
      WHEN 'month' THEN start_date := DATE_TRUNC('month', CURRENT_DATE);
    END CASE;
  END IF;

  IF end_date IS NULL THEN
    CASE report_type
      WHEN 'day' THEN end_date := start_date + INTERVAL '1 day';
      WHEN 'week' THEN end_date := start_date + INTERVAL '1 week';
      WHEN 'month' THEN end_date := start_date + INTERVAL '1 month';
    END CASE;
  END IF;

  -- Set date trunc format based on report type
  CASE report_type
    WHEN 'day' THEN date_trunc_format := 'day';
    WHEN 'week' THEN date_trunc_format := 'week';
    WHEN 'month' THEN date_trunc_format := 'month';
    ELSE date_trunc_format := 'day';
  END CASE;

  RETURN QUERY
  SELECT 
    report_type::CHARACTER VARYING as period,
    DATE_TRUNC(date_trunc_format, r.recorded_at)::DATE as period_date,
    COUNT(*) as total_recordings,
    COALESCE(SUM(r.audio_duration), 0)::BIGINT as total_duration,
    COALESCE(SUM(((r.audio_duration::NUMERIC / 60.0) / 20.0) * 100000), 0) as total_payment,
    COALESCE(AVG(r.audio_duration), 0) as avg_duration,
    COUNT(DISTINCT r.user_id) as unique_users
  FROM 
    public.recordings r
    LEFT JOIN public.profiles up ON r.user_id = up.id
  WHERE 
    r.recorded_at >= start_date 
    AND r.recorded_at < end_date
    AND (
      -- Admin can see all recordings
      current_user_role = 'admin'
      OR 
      -- CTV can only see recordings from their referrals
      (current_user_role = 'ctv' AND up.referrer_id = current_user_id)
    )
    AND (
      -- Filter by specific user if provided
      user_filter IS NULL OR r.user_id = user_filter
    )
  GROUP BY 
    DATE_TRUNC(date_trunc_format, r.recorded_at)
  ORDER BY 
    period_date DESC;
END;
$$;

-- Function to get detailed recordings data for reports
CREATE OR REPLACE FUNCTION public.get_recordings_detailed_report(
  start_date TIMESTAMPTZ DEFAULT NULL,
  end_date TIMESTAMPTZ DEFAULT NULL,
  limit_count INTEGER DEFAULT 1000,
  user_filter UUID DEFAULT NULL -- Filter by specific user ID, NULL means all users
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  user_full_name TEXT,
  user_affiliate_code VARCHAR(20),
  audio_duration BIGINT,
  audio_script TEXT,
  recorded_at TIMESTAMPTZ,
  age BIGINT,
  question_text TEXT,
  province_name VARCHAR(100),
  payment_amount NUMERIC,
  is_pass BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_role VARCHAR(20);
  current_user_id UUID;
BEGIN
  -- Get current user's role and id
  SELECT p.role, p.id INTO current_user_role, current_user_id
  FROM public.profiles p
  WHERE p.id = auth.uid();

  -- Set default date range if not provided
  IF start_date IS NULL THEN
    start_date := CURRENT_DATE;
  END IF;

  IF end_date IS NULL THEN
    end_date := start_date + INTERVAL '1 day';
  END IF;

  RETURN QUERY
  SELECT 
    r.id,
    r.user_id,
    up.full_name as user_full_name,
    up.affiliate_code as user_affiliate_code,
    r.audio_duration::BIGINT,
    r.audio_script,
    r.recorded_at,
    r.age::BIGINT,
    q.text as question_text,
    p.name as province_name,
    ((r.audio_duration::NUMERIC / 60.0) / 20.0) * 100000 as payment_amount,
    COALESCE(r.is_pass, false) as is_pass
  FROM 
    public.recordings r
    LEFT JOIN public.profiles up ON r.user_id = up.id
    LEFT JOIN public.questions q ON r.question_id = q.id
    LEFT JOIN public.provinces p ON r.province_id = p.id
  WHERE 
    r.recorded_at >= start_date 
    AND r.recorded_at < end_date
    AND (
      -- Admin can see all recordings
      current_user_role = 'admin'
      OR 
      -- CTV can only see recordings from their referrals
      (current_user_role = 'ctv' AND up.referrer_id = current_user_id)
    )
    AND (
      -- Filter by specific user if provided
      user_filter IS NULL OR r.user_id = user_filter
    )
  ORDER BY 
    r.recorded_at DESC
  LIMIT limit_count;
END;
$$;

-- Function to get list of users for filtering (based on current user's role)
CREATE OR REPLACE FUNCTION public.get_users_for_filter()
RETURNS TABLE (
  user_id UUID,
  user_name TEXT,
  affiliate_code VARCHAR(20),
  total_recordings BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_role VARCHAR(20);
  current_user_id UUID;
BEGIN
  -- Get current user's role and id
  SELECT p.role, p.id INTO current_user_role, current_user_id
  FROM public.profiles p
  WHERE p.id = auth.uid();

  RETURN QUERY
  SELECT 
    p.id as user_id,
    p.full_name as user_name,
    p.affiliate_code,
    COALESCE(p.total_recordings, 0)::BIGINT as total_recordings
  FROM 
    public.profiles p
  WHERE 
    p.role = 'ctv'
    AND (
      -- Admin can see all CTV users
      current_user_role = 'admin'
      OR 
      -- CTV can only see their referrals
      (current_user_role = 'ctv' AND p.referrer_id = current_user_id)
    )
    AND p.status = 'active'
  ORDER BY 
    p.full_name ASC;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_recordings_report(VARCHAR, TIMESTAMPTZ, TIMESTAMPTZ, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_recordings_detailed_report(TIMESTAMPTZ, TIMESTAMPTZ, INTEGER, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_users_for_filter() TO authenticated;
