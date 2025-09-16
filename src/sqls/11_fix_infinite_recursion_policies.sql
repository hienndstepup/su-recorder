-- Sửa lỗi "infinite recursion detected in policy for relation 'profiles'"
-- Vấn đề: RLS policies tham chiếu đến chính bảng profiles tạo ra vòng lặp vô hạn

-- ==============================================
-- XÓA TẤT CẢ POLICIES CŨ CHO PROFILES
-- ==============================================

-- Xóa tất cả policies cũ để tạo lại
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Allow profile creation" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "CTVs can view their direct referrals" ON profiles;

-- ==============================================
-- TẠO FUNCTION HELPER KHÔNG RECURSIVE
-- ==============================================

-- Function kiểm tra role từ JWT token thay vì query profiles
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Lấy role từ JWT token metadata thay vì query profiles
  SELECT auth.jwt()->>'user_metadata'->>'role' INTO user_role;
  
  -- Nếu không có trong JWT, mặc định là 'ctv'
  RETURN COALESCE(user_role, 'ctv');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function kiểm tra admin từ JWT thay vì query profiles
CREATE OR REPLACE FUNCTION is_admin_from_jwt()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (auth.jwt()->>'user_metadata'->>'role' = 'admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================
-- TẠO RLS POLICIES MỚI KHÔNG RECURSIVE
-- ==============================================

-- Policy 1: User có thể xem profile của chính họ
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Policy 2: User có thể cập nhật profile của chính họ
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Policy 3: Cho phép tạo profile (đơn giản hóa)
CREATE POLICY "Allow profile creation" ON profiles
  FOR INSERT WITH CHECK (
    auth.uid() = id OR 
    auth.role() = 'service_role'
  );

-- Policy 4: Admin có thể xem tất cả profiles (sử dụng JWT thay vì query)
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (
    auth.role() = 'authenticated' AND 
    is_admin_from_jwt()
  );

-- Policy 5: Admin có thể cập nhật tất cả profiles (sử dụng JWT)
CREATE POLICY "Admins can update all profiles" ON profiles
  FOR UPDATE USING (
    auth.role() = 'authenticated' AND 
    is_admin_from_jwt()
  );

-- Policy 6: CTV có thể xem profiles của referrals (đơn giản hóa)
CREATE POLICY "CTVs can view their direct referrals" ON profiles
  FOR SELECT USING (
    auth.role() = 'authenticated' AND 
    referrer_id = auth.uid()
  );

-- ==============================================
-- CẬP NHẬT FUNCTION HANDLE_NEW_USER
-- ==============================================

-- Cập nhật function để set role trong JWT metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  referrer_code TEXT;
  referrer_profile_id UUID;
  new_affiliate_code TEXT;
  retry_count INTEGER := 0;
BEGIN
  -- Log để debug
  RAISE LOG 'Creating profile for user: %', NEW.id;
  
  -- Lấy mã giới thiệu từ metadata nếu có
  referrer_code := NEW.raw_user_meta_data->>'referrer_code';
  
  -- Tìm referrer_id nếu có mã giới thiệu
  IF referrer_code IS NOT NULL THEN
    BEGIN
      SELECT id INTO referrer_profile_id 
      FROM profiles 
      WHERE affiliate_code = referrer_code;
      RAISE LOG 'Referrer found: % -> %', referrer_code, referrer_profile_id;
    EXCEPTION WHEN OTHERS THEN
      RAISE LOG 'Error finding referrer: %', SQLERRM;
      referrer_profile_id := NULL;
    END;
  END IF;
  
  -- Tạo affiliate code với retry logic
  LOOP
    BEGIN
      new_affiliate_code := generate_affiliate_code();
      EXIT; -- Thoát nếu thành công
    EXCEPTION WHEN OTHERS THEN
      retry_count := retry_count + 1;
      IF retry_count >= 3 THEN
        -- Fallback cuối cùng: timestamp + user id
        new_affiliate_code := 'USER' || EXTRACT(EPOCH FROM NOW())::BIGINT::TEXT;
        EXIT;
      END IF;
    END;
  END LOOP;
  
  -- Insert profile với error handling
  BEGIN
    INSERT INTO public.profiles (
      id, 
      full_name, 
      avatar_url, 
      affiliate_code, 
      referrer_id,
      role
    )
    VALUES (
      NEW.id,
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'avatar_url',
      new_affiliate_code,
      referrer_profile_id,
      COALESCE(NEW.raw_user_meta_data->>'role', 'ctv') -- Default to ctv
    );
    
    RAISE LOG 'Successfully created profile for user: % with affiliate: %', NEW.id, new_affiliate_code;
    
  EXCEPTION 
    WHEN unique_violation THEN
      -- Thử lại với mã khác
      new_affiliate_code := 'USER' || EXTRACT(EPOCH FROM NOW())::BIGINT::TEXT || FLOOR(RANDOM() * 1000)::TEXT;
      INSERT INTO public.profiles (
        id, full_name, avatar_url, affiliate_code, referrer_id, role
      ) VALUES (
        NEW.id,
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'avatar_url',
        new_affiliate_code,
        referrer_profile_id,
        COALESCE(NEW.raw_user_meta_data->>'role', 'ctv')
      );
      RAISE LOG 'Created profile with retry affiliate code: %', new_affiliate_code;
      
    WHEN OTHERS THEN
      RAISE LOG 'Error creating profile: %', SQLERRM;
      -- Không raise exception để không block việc tạo user
      RAISE WARNING 'Failed to create user profile: %, User ID: %', SQLERRM, NEW.id;
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================
-- CẬP NHẬT CÁC FUNCTION HELPER CŨ
-- ==============================================

-- Cập nhật function is_admin để không query profiles
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  -- Kiểm tra từ JWT trước
  IF is_admin_from_jwt() THEN
    RETURN TRUE;
  END IF;
  
  -- Fallback: kiểm tra từ profiles (có thể gây recursive nếu gọi trong policy)
  -- Chỉ dùng khi không trong context của RLS policy
  BEGIN
    RETURN EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    );
  EXCEPTION WHEN OTHERS THEN
    RETURN FALSE;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================
-- VERIFICATION QUERIES
-- ==============================================

-- Kiểm tra policies đã được tạo
SELECT 
  policyname,
  cmd,
  permissive
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;

-- Kiểm tra functions đã được tạo
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines 
WHERE routine_name IN ('get_user_role', 'is_admin_from_jwt', 'is_admin')
ORDER BY routine_name;

-- Test function (chỉ chạy khi đã đăng nhập)
-- SELECT get_user_role() as user_role, is_admin_from_jwt() as is_admin;

-- ==============================================
-- COMMENTS
-- ==============================================

COMMENT ON FUNCTION get_user_role() IS 'Lấy role từ JWT token thay vì query profiles - tránh recursive';
COMMENT ON FUNCTION is_admin_from_jwt() IS 'Kiểm tra admin từ JWT token - tránh recursive';
COMMENT ON FUNCTION is_admin() IS 'Kiểm tra admin với fallback - cẩn thận với recursive';

/*
HƯỚNG DẪN SỬ DỤNG:

1. Chạy file này để sửa lỗi infinite recursion
2. Lỗi xảy ra do policies tham chiếu đến chính bảng profiles
3. Giải pháp: Sử dụng JWT metadata thay vì query profiles

THAY ĐỔI CHÍNH:
- Policies không còn query profiles để kiểm tra role
- Sử dụng JWT metadata để xác định role
- Đơn giản hóa logic để tránh vòng lặp

LƯU Ý:
- Cần đảm bảo role được set trong JWT khi tạo user
- Admin users cần có role='admin' trong user_metadata
- CTV users có role='ctv' hoặc mặc định

CÁCH TEST:
1. Chạy file này
2. Test tạo user mới
3. Test query profiles với các role khác nhau
4. Không còn lỗi infinite recursion
*/
