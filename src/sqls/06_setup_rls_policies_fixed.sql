-- Thiết lập Row Level Security (RLS) policies cho tất cả bảng
-- Đảm bảo bảo mật dữ liệu và quyền truy cập phù hợp
-- PHIÊN BẢN ĐÃ SỬA: Tránh conflict với policies đã tạo trong file 04

-- ==============================================
-- REGIONS TABLE RLS POLICIES
-- ==============================================

-- Bật RLS cho bảng regions
ALTER TABLE regions ENABLE ROW LEVEL SECURITY;

-- Policy: Tất cả user đã đăng nhập có thể xem regions
CREATE POLICY "Regions are viewable by authenticated users" ON regions
  FOR SELECT USING (auth.role() = 'authenticated' AND is_active = true);

-- Policy: Chỉ admin có thể thêm/sửa/xóa regions
CREATE POLICY "Only admins can insert regions" ON regions
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Only admins can update regions" ON regions
  FOR UPDATE USING (
    auth.role() = 'authenticated' AND 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Only admins can delete regions" ON regions
  FOR DELETE USING (
    auth.role() = 'authenticated' AND 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ==============================================
-- PROVINCES TABLE RLS POLICIES
-- ==============================================

-- Bật RLS cho bảng provinces
ALTER TABLE provinces ENABLE ROW LEVEL SECURITY;

-- Policy: Tất cả user đã đăng nhập có thể xem provinces
CREATE POLICY "Provinces are viewable by authenticated users" ON provinces
  FOR SELECT USING (auth.role() = 'authenticated' AND is_active = true);

-- Policy: Chỉ admin có thể thêm/sửa/xóa provinces
CREATE POLICY "Only admins can insert provinces" ON provinces
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Only admins can update provinces" ON provinces
  FOR UPDATE USING (
    auth.role() = 'authenticated' AND 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Only admins can delete provinces" ON provinces
  FOR DELETE USING (
    auth.role() = 'authenticated' AND 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ==============================================
-- QUESTIONS TABLE RLS POLICIES
-- ==============================================

-- Bật RLS cho bảng questions
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

-- Policy: Tất cả user đã đăng nhập có thể xem câu hỏi active
CREATE POLICY "Questions are viewable by authenticated users" ON questions
  FOR SELECT USING (
    auth.role() = 'authenticated' AND is_active = true
  );

-- Policy: Chỉ admin có thể thêm/sửa/xóa câu hỏi
CREATE POLICY "Only admins can insert questions" ON questions
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Only admins can update questions" ON questions
  FOR UPDATE USING (
    auth.role() = 'authenticated' AND 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Only admins can delete questions" ON questions
  FOR DELETE USING (
    auth.role() = 'authenticated' AND 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ==============================================
-- PROFILES TABLE RLS POLICIES
-- ==============================================

-- LƯU Ý: Bảng profiles đã có RLS policies được tạo trong file 04_create_profiles_table_fixed.sql
-- Chỉ thêm các policies bổ sung nếu cần

-- Kiểm tra xem RLS đã được bật chưa (đã bật trong file 04)
-- ALTER TABLE profiles ENABLE ROW LEVEL SECURITY; -- Đã được bật

-- Xóa các policies cũ nếu có để tạo lại với logic đầy đủ
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Allow profile creation" ON profiles;

-- Tạo lại các policies với logic đầy đủ
-- Policy: User có thể xem profile của chính họ
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Policy: User có thể cập nhật profile của chính họ
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Policy: Cho phép tạo profile (cho trigger và user tự tạo)
CREATE POLICY "Allow profile creation" ON profiles
  FOR INSERT WITH CHECK (
    -- User có thể tạo profile của chính họ
    auth.uid() = id OR
    -- Hoặc system có thể tạo (cho trigger)
    auth.role() = 'service_role' OR
    -- Hoặc trong context của authenticated user
    (auth.uid() IS NOT NULL AND auth.role() = 'authenticated')
  );

-- Policy: Admin có thể xem tất cả profiles
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (
    auth.role() = 'authenticated' AND 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policy: Admin có thể cập nhật tất cả profiles
CREATE POLICY "Admins can update all profiles" ON profiles
  FOR UPDATE USING (
    auth.role() = 'authenticated' AND 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policy: CTV có thể xem profiles của CTV trực tiếp (do họ giới thiệu)
CREATE POLICY "CTVs can view their direct referrals" ON profiles
  FOR SELECT USING (
    auth.role() = 'authenticated' AND 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'ctv'
    ) AND
    referrer_id = auth.uid()
  );

-- ==============================================
-- RECORDINGS TABLE RLS POLICIES
-- ==============================================

-- Bật RLS cho bảng recordings
ALTER TABLE recordings ENABLE ROW LEVEL SECURITY;

-- Policy: User có thể xem recordings của chính họ
CREATE POLICY "Users can view own recordings" ON recordings
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: User có thể tạo recordings cho chính họ
CREATE POLICY "Users can insert own recordings" ON recordings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: User có thể cập nhật recordings của chính họ
CREATE POLICY "Users can update own recordings" ON recordings
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Admin có thể xem tất cả recordings
CREATE POLICY "Admins can view all recordings" ON recordings
  FOR SELECT USING (
    auth.role() = 'authenticated' AND 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policy: Admin có thể cập nhật tất cả recordings
CREATE POLICY "Admins can update all recordings" ON recordings
  FOR UPDATE USING (
    auth.role() = 'authenticated' AND 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policy: Admin có thể xóa recordings
CREATE POLICY "Admins can delete recordings" ON recordings
  FOR DELETE USING (
    auth.role() = 'authenticated' AND 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policy: CTV có thể xem recordings của CTV trực tiếp (do họ giới thiệu)
CREATE POLICY "CTVs can view their direct referrals recordings" ON recordings
  FOR SELECT USING (
    auth.role() = 'authenticated' AND 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'ctv'
    ) AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = recordings.user_id AND referrer_id = auth.uid()
    )
  );


-- ==============================================
-- HELPER FUNCTIONS FOR RLS
-- ==============================================

-- Function để kiểm tra user có phải admin không
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function để lấy user_id hiện tại
CREATE OR REPLACE FUNCTION current_user_id()
RETURNS UUID AS $$
BEGIN
  RETURN auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function để kiểm tra user có thể xem profile khác không
CREATE OR REPLACE FUNCTION can_view_profile(target_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Admin có thể xem tất cả
  IF is_admin() THEN
    RETURN TRUE;
  END IF;
  
  -- User có thể xem profile của chính họ
  IF auth.uid() = target_user_id THEN
    RETURN TRUE;
  END IF;
  
  -- CTV có thể xem profile của CTV trực tiếp (do họ giới thiệu)
  IF EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = target_user_id AND referrer_id = auth.uid()
  ) THEN
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function để lấy danh sách CTV trực tiếp của user
CREATE OR REPLACE FUNCTION get_direct_referrals(user_id UUID)
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  affiliate_code VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE,
  total_completed_recordings INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.full_name,
    p.affiliate_code,
    p.created_at,
    p.total_completed_recordings
  FROM profiles p
  WHERE p.referrer_id = user_id
  ORDER BY p.created_at DESC;
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

-- Kiểm tra số lượng policies cho mỗi bảng
SELECT 
  schemaname,
  tablename,
  COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY schemaname, tablename
ORDER BY tablename;

-- Kiểm tra functions helper đã được tạo
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines 
WHERE routine_name IN ('is_admin', 'current_user_id', 'can_view_profile', 'get_direct_referrals')
ORDER BY routine_name;

-- Thêm comment
COMMENT ON FUNCTION is_admin() IS 'Kiểm tra user hiện tại có phải admin không';
COMMENT ON FUNCTION current_user_id() IS 'Lấy ID của user hiện tại';
COMMENT ON FUNCTION can_view_profile(UUID) IS 'Kiểm tra user có thể xem profile khác không';
COMMENT ON FUNCTION get_direct_referrals(UUID) IS 'Lấy danh sách CTV trực tiếp của user';

/*
HƯỚNG DẪN SỬ DỤNG:

1. File này thay thế file 06_setup_rls_policies.sql
2. Chạy AFTER file 04_create_profiles_table_fixed.sql
3. File này sẽ:
   - Xóa và tạo lại policies cho profiles để tránh conflict
   - Thiết lập RLS cho các bảng còn lại
   - Tạo helper functions
   - Verification queries

THAY ĐỔI CHÍNH:
- Thêm DROP POLICY IF EXISTS để tránh lỗi "already exists"
- Kiểm tra RLS đã được bật cho profiles
- Tạo lại policies với logic đầy đủ
- Thêm verification queries

LƯU Ý:
- Chạy file này sau khi đã chạy 04_create_profiles_table_fixed.sql
- Không cần chạy file 06_setup_rls_policies.sql gốc nữa
- Tất cả logic RLS và affiliate system được giữ nguyên
*/
