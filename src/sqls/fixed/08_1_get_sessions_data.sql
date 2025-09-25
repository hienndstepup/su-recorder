-- Function to get sessions data with pagination and user profile info
CREATE OR REPLACE FUNCTION get_sessions_data(
  page_number INTEGER DEFAULT 1,
  page_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  user_profile JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  offset_value INTEGER;
BEGIN
  -- Calculate offset for pagination
  offset_value := (page_number - 1) * page_limit;
  
  -- Check if user is admin or CTV
  IF EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'ctv')
  ) THEN
    -- Admin and CTV can view all sessions
    RETURN QUERY
    SELECT 
      s.id,
      s.user_id,
      s.created_at,
      s.updated_at,
      jsonb_build_object(
        'id', p.id,
        'full_name', p.full_name,
        'affiliate_code', p.affiliate_code,
        'role', p.role,
        'status', p.status,
        'total_recordings', p.total_recordings,
        'total_duration', p.total_duration,
        'is_pass', p.is_pass,
        'created_at', p.created_at
      ) as user_profile
    FROM sessions s
    LEFT JOIN profiles p ON s.user_id = p.id
    ORDER BY s.created_at DESC
    LIMIT page_limit
    OFFSET offset_value;
  ELSE
    -- Regular users can only view their own sessions
    RETURN QUERY
    SELECT 
      s.id,
      s.user_id,
      s.created_at,
      s.updated_at,
      jsonb_build_object(
        'id', p.id,
        'full_name', p.full_name,
        'affiliate_code', p.affiliate_code,
        'role', p.role,
        'status', p.status,
        'total_recordings', p.total_recordings,
        'total_duration', p.total_duration,
        'is_pass', p.is_pass,
        'created_at', p.created_at
      ) as user_profile
    FROM sessions s
    LEFT JOIN profiles p ON s.user_id = p.id
    WHERE s.user_id = auth.uid()
    ORDER BY s.created_at DESC
    LIMIT page_limit
    OFFSET offset_value;
  END IF;
END;
$$;

-- Function to get total count of sessions
CREATE OR REPLACE FUNCTION get_sessions_count()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_count INTEGER;
BEGIN
  -- Check if user is admin or CTV
  IF EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'ctv')
  ) THEN
    -- Admin and CTV can see all sessions count
    SELECT COUNT(*) INTO total_count FROM sessions;
  ELSE
    -- Regular users can only see their own sessions count
    SELECT COUNT(*) INTO total_count FROM sessions WHERE user_id = auth.uid();
  END IF;
  
  RETURN total_count;
END;
$$;

COMMENT ON FUNCTION get_sessions_data(INTEGER, INTEGER) IS 'Lấy danh sách sessions với pagination và thông tin user profile';
COMMENT ON FUNCTION get_sessions_count() IS 'Lấy tổng số sessions theo quyền user';
