-- Fix function to get all recordings data with related information
-- Drop existing function first
DROP FUNCTION IF EXISTS get_all_recordings_data();

-- Create a version that supports pagination to get all records
CREATE OR REPLACE FUNCTION get_all_recordings_data(
  limit_count INTEGER DEFAULT NULL,
  offset_count INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  audio_url TEXT,
  audio_duration INTEGER,
  audio_script TEXT,
  recorded_at TIMESTAMPTZ,
  age INTEGER,
  question_data JSONB,
  province_data JSONB,
  user_data JSONB,
  payment_amount NUMERIC,
  total_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id,
    r.user_id,
    r.audio_url,
    r.audio_duration,
    r.audio_script,
    r.recorded_at,
    r.age,
    -- Question information as JSONB
    CASE 
      WHEN q.id IS NOT NULL THEN 
        jsonb_build_object(
          'id', q.id,
          'text', q.text,
          'type', q.type,
          'hint', q.hint
        )
      ELSE NULL
    END as question_data,
    -- Province information as JSONB
    CASE 
      WHEN p.id IS NOT NULL THEN 
        jsonb_build_object(
          'id', p.id,
          'name', p.name,
          'code', p.code
        )
      ELSE NULL
    END as province_data,
    -- User profile information as JSONB
    CASE 
      WHEN up.id IS NOT NULL THEN 
        jsonb_build_object(
          'full_name', up.full_name,
          'affiliate_code', up.affiliate_code,
          'total_recordings', up.total_recordings,
          'total_duration', up.total_duration,
          'is_pass', up.is_pass
        )
      ELSE NULL
    END as user_data,
    -- Calculate payment amount
    ((r.audio_duration::NUMERIC / 60.0) / 20.0) * 100000 as payment_amount,
    -- Total count for pagination
    COUNT(*) OVER() as total_count
  FROM 
    recordings r
    LEFT JOIN questions q ON r.question_id = q.id
    LEFT JOIN provinces p ON r.province_id = p.id
    LEFT JOIN profiles up ON r.user_id = up.id
  ORDER BY 
    r.recorded_at DESC
  LIMIT COALESCE(limit_count, 10000)
  OFFSET offset_count;
END;
$$;
