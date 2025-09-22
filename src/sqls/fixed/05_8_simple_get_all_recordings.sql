-- Simple function to get all recordings data without pagination limits
-- Drop existing functions first
DROP FUNCTION IF EXISTS get_all_recordings_data(INTEGER, INTEGER);
DROP FUNCTION IF EXISTS get_all_recordings_data();

-- Create a simple function that returns all data
CREATE OR REPLACE FUNCTION get_all_recordings_data()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSONB;
BEGIN
  -- Get all recordings data as a single JSONB array
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', r.id,
      'user_id', r.user_id,
      'audio_url', r.audio_url,
      'audio_duration', r.audio_duration,
      'audio_script', r.audio_script,
      'recorded_at', r.recorded_at,
      'age', r.age,
      'question_data', CASE 
        WHEN q.id IS NOT NULL THEN 
          jsonb_build_object(
            'id', q.id,
            'text', q.text,
            'type', q.type,
            'hint', q.hint
          )
        ELSE NULL
      END,
      'province_data', CASE 
        WHEN p.id IS NOT NULL THEN 
          jsonb_build_object(
            'id', p.id,
            'name', p.name,
            'code', p.code
          )
        ELSE NULL
      END,
      'user_data', CASE 
        WHEN up.id IS NOT NULL THEN 
          jsonb_build_object(
            'full_name', up.full_name,
            'affiliate_code', up.affiliate_code,
            'total_recordings', up.total_recordings,
            'total_duration', up.total_duration,
            'is_pass', up.is_pass
          )
        ELSE NULL
      END,
      'payment_amount', ((r.audio_duration::NUMERIC / 60.0) / 20.0) * 100000
    ) ORDER BY r.recorded_at DESC
  ) INTO result
  FROM 
    recordings r
    LEFT JOIN questions q ON r.question_id = q.id
    LEFT JOIN provinces p ON r.province_id = p.id
    LEFT JOIN profiles up ON r.user_id = up.id;
  
  RETURN COALESCE(result, '[]'::jsonb);
END;
$$;
