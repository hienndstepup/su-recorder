-- Function to get all recordings data with related information
CREATE OR REPLACE FUNCTION get_all_recordings_data()
RETURNS TABLE (
  id UUID,
  user_id UUID,
  audio_url TEXT,
  audio_duration INTEGER,
  audio_script TEXT,
  recorded_at TIMESTAMPTZ,
  age INTEGER,
  question_id UUID,
  question_text TEXT,
  question_type VARCHAR(20),
  question_hint TEXT,
  province_id INTEGER,
  province_name TEXT,
  province_code VARCHAR(10),
  user_full_name TEXT,
  user_affiliate_code VARCHAR(20),
  user_total_recordings INTEGER,
  user_total_duration INTEGER,
  user_is_pass BOOLEAN,
  payment_amount NUMERIC
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
    -- Question information
    q.id as question_id,
    q.text as question_text,
    q.type as question_type,
    q.hint as question_hint,
    -- Province information
    p.id as province_id,
    p.name as province_name,
    p.code as province_code,
    -- User profile information
    up.full_name as user_full_name,
    up.affiliate_code as user_affiliate_code,
    up.total_recordings as user_total_recordings,
    up.total_duration as user_total_duration,
    up.is_pass as user_is_pass,
    -- Calculate payment amount
    ((r.audio_duration::NUMERIC / 60.0) / 20.0) * 100000 as payment_amount
  FROM 
    recordings r
    LEFT JOIN questions q ON r.question_id = q.id
    LEFT JOIN provinces p ON r.province_id = p.id
    LEFT JOIN profiles up ON r.user_id = up.id
  ORDER BY 
    r.recorded_at DESC;
END;
$$;
