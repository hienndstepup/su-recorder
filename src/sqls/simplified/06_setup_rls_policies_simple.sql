-- Thiết lập RLS policies đơn giản
-- Chỉ tập trung vào logic admin/ctv cơ bản

-- ==============================================
-- REGIONS TABLE RLS
-- ==============================================

ALTER TABLE regions ENABLE ROW LEVEL SECURITY;

-- Tất cả user có thể xem regions active
CREATE POLICY "Everyone can view active regions" ON regions
  FOR SELECT USING (is_active = true);

-- Chỉ admin có thể thêm/sửa/xóa regions
CREATE POLICY "Only admins can modify regions" ON regions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ==============================================
-- PROVINCES TABLE RLS  
-- ==============================================

ALTER TABLE provinces ENABLE ROW LEVEL SECURITY;

-- Tất cả user có thể xem provinces active
CREATE POLICY "Everyone can view active provinces" ON provinces
  FOR SELECT USING (is_active = true);

-- Chỉ admin có thể thêm/sửa/xóa provinces
CREATE POLICY "Only admins can modify provinces" ON provinces
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ==============================================
-- QUESTIONS TABLE RLS
-- ==============================================

ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

-- Tất cả user có thể xem questions active
CREATE POLICY "Everyone can view active questions" ON questions
  FOR SELECT USING (is_active = true);

-- Chỉ admin có thể thêm/sửa/xóa questions
CREATE POLICY "Only admins can modify questions" ON questions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ==============================================
-- HELPER FUNCTIONS ĐƠN GIẢN
-- ==============================================

-- Function kiểm tra user có phải admin không
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin' AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function kiểm tra user có thể xem profile target không
CREATE OR REPLACE FUNCTION can_view_profile(target_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Admin có thể xem tất cả
  IF is_admin() THEN
    RETURN TRUE;
  END IF;
  
  -- User có thể xem profile của chính mình
  IF auth.uid() = target_user_id THEN
    RETURN TRUE;
  END IF;
  
  -- CTV có thể xem profile của người mình giới thiệu
  IF EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = target_user_id AND referrer_id = auth.uid()
  ) THEN
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function lấy danh sách CTV do user giới thiệu
CREATE OR REPLACE FUNCTION get_my_referrals()
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  affiliate_code VARCHAR(20),
  total_recordings INTEGER,
  total_duration INTEGER,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  -- Nếu là admin, trả về tất cả
  IF is_admin() THEN
    RETURN QUERY
    SELECT 
      p.id,
      p.full_name,
      p.affiliate_code,
      p.total_recordings,
      p.total_duration,
      p.created_at
    FROM profiles p
    WHERE p.status = 'active'
    ORDER BY p.created_at DESC;
  ELSE
    -- CTV chỉ xem được những người mình giới thiệu
    RETURN QUERY
    SELECT 
      p.id,
      p.full_name,
      p.affiliate_code,
      p.total_recordings,
      p.total_duration,
      p.created_at
    FROM profiles p
    WHERE p.referrer_id = auth.uid() AND p.status = 'active'
    ORDER BY p.created_at DESC;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function lấy danh sách recordings có thể xem
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
) AS $$
BEGIN
  -- Nếu là admin, trả về tất cả recordings
  IF is_admin() THEN
    RETURN QUERY
    SELECT 
      r.id,
      r.user_id,
      p.full_name as user_name,
      r.question_id,
      r.province_id,
      r.audio_url,
      r.audio_duration,
      r.recorded_at
    FROM recordings r
    LEFT JOIN profiles p ON r.user_id = p.id
    ORDER BY r.recorded_at DESC;
  ELSE
    -- CTV chỉ xem được recordings của mình và của người mình giới thiệu
    RETURN QUERY
    SELECT 
      r.id,
      r.user_id,
      p.full_name as user_name,
      r.question_id,
      r.province_id,
      r.audio_url,
      r.audio_duration,
      r.recorded_at
    FROM recordings r
    LEFT JOIN profiles p ON r.user_id = p.id
    WHERE r.user_id = auth.uid() 
       OR EXISTS (
         SELECT 1 FROM profiles 
         WHERE id = r.user_id AND referrer_id = auth.uid()
       )
    ORDER BY r.recorded_at DESC;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================
-- VERIFICATION QUERIES
-- ==============================================

-- Kiểm tra tất cả bảng đã bật RLS
SELECT 
  schemaname, 
  tablename, 
  rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('profiles', 'recordings', 'questions', 'regions', 'provinces')
ORDER BY tablename;

-- Kiểm tra functions helper đã được tạo
SELECT 
  routine_name
FROM information_schema.routines 
WHERE routine_name IN ('is_admin', 'can_view_profile', 'get_my_referrals', 'get_viewable_recordings')
ORDER BY routine_name;

-- Thêm comment
COMMENT ON FUNCTION is_admin() IS 'Kiểm tra user có phải admin không';
COMMENT ON FUNCTION can_view_profile(UUID) IS 'Kiểm tra quyền xem profile';
COMMENT ON FUNCTION get_my_referrals() IS 'Lấy danh sách CTV do user giới thiệu';
COMMENT ON FUNCTION get_viewable_recordings() IS 'Lấy danh sách recordings có thể xem';
