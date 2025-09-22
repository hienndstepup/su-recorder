-- Export all recordings data with related information
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
  up.total_recordings,
  up.total_duration,
  up.is_pass,
  -- Calculate payment amount
  ((r.audio_duration / 60.0) / 20.0) * 100000 as payment_amount
FROM 
  recordings r
  LEFT JOIN questions q ON r.question_id = q.id
  LEFT JOIN provinces p ON r.province_id = p.id
  LEFT JOIN profiles up ON r.user_id = up.id
ORDER BY 
  r.recorded_at DESC;