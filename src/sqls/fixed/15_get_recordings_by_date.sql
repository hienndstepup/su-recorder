-- Returns a SINGLE jsonb array (jsonb_agg) so PostgREST does not paginate

-- Ensure clean recreate
DROP FUNCTION IF EXISTS public.get_recordings_by_date(timestamptz, timestamptz, integer);
DROP FUNCTION IF EXISTS public.get_recordings_by_date(timestamptz, timestamptz, integer, integer);
DROP FUNCTION IF EXISTS public.get_recordings_by_date(timestamptz, timestamptz, integer, integer, integer);

CREATE OR REPLACE FUNCTION public.get_recordings_by_date(
  p_start timestamptz,
  p_end timestamptz,
  p_limit integer DEFAULT 10000,
  p_offset integer DEFAULT 0,
  p_age integer DEFAULT NULL
)
RETURNS jsonb AS $$
  WITH page AS (
    SELECT 
      r.id,
      r.session_id,
      r.user_id,
      r.audio_url,
      r.audio_duration,
      r.audio_script,
      r.recorded_at,
      r.age,
      q.id   AS q_id,
      q.text AS q_text,
      q.type AS q_type,
      q.hint AS q_hint,
      pv.id   AS pv_id,
      pv.name AS pv_name,
      pv.code AS pv_code,
      pr.full_name,
      pr.affiliate_code,
      pr.total_recordings,
      pr.total_duration,
      pr.is_pass
    FROM public.recordings r
    LEFT JOIN public.questions q ON q.id = r.question_id
    LEFT JOIN public.provinces pv ON pv.id = r.province_id
    LEFT JOIN public.profiles pr ON pr.id = r.user_id
    WHERE r.recorded_at >= p_start
      AND r.recorded_at <= p_end
      AND (p_age IS NULL OR r.age = p_age)
    ORDER BY r.recorded_at ASC, r.id ASC
    LIMIT p_limit OFFSET p_offset
  )
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', page.id,
        'session_id', page.session_id,
        'user_id', page.user_id,
        'audio_url', page.audio_url,
        'audio_duration', page.audio_duration,
        'audio_script', page.audio_script,
        'recorded_at', page.recorded_at,
        'age', page.age,
        'questions', CASE WHEN page.q_id IS NULL THEN NULL ELSE jsonb_build_object(
          'id', page.q_id,
          'text', page.q_text,
          'type', page.q_type,
          'hint', page.q_hint
        ) END,
        'provinces', CASE WHEN page.pv_id IS NULL THEN NULL ELSE jsonb_build_object(
          'id', page.pv_id,
          'name', page.pv_name,
          'code', page.pv_code
        ) END,
        'profiles', jsonb_build_object(
          'full_name', page.full_name,
          'affiliate_code', page.affiliate_code,
          'total_recordings', page.total_recordings,
          'total_duration', page.total_duration,
          'is_pass', page.is_pass
        )
      ) ORDER BY page.recorded_at ASC, page.id ASC
    ), '[]'::jsonb)
  FROM page;
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.get_recordings_by_date(timestamptz, timestamptz, integer, integer, integer) TO authenticated;

