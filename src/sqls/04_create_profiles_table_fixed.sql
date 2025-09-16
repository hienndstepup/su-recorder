-- Tạo bảng profiles để lưu thông tin bổ sung của user
-- Liên kết với auth.users của Supabase
-- PHIÊN BẢN ĐÃ SỬA: Tránh lỗi khi tạo user mới

-- ==============================================
-- TẠO BẢNG PROFILES
-- ==============================================

CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT, -- Họ và tên (optional)
  avatar_url TEXT, -- URL avatar (optional)
  phone TEXT, -- Số điện thoại (optional)
  province_id UUID REFERENCES provinces(id) ON DELETE SET NULL, -- ID tỉnh thành (optional)
  role VARCHAR(20) DEFAULT 'ctv', -- Vai trò: 'admin', 'ctv' (optional, default: ctv)
  status VARCHAR(20) DEFAULT 'active', -- Trạng thái: 'active', 'inactive', 'suspended' (optional, default: active)
  affiliate_code VARCHAR(50) UNIQUE NOT NULL, -- Mã affiliate (bắt buộc, unique)
  referrer_id UUID REFERENCES profiles(id) ON DELETE SET NULL, -- ID người giới thiệu (optional)
  total_completed_recordings INTEGER DEFAULT 0, -- Tổng số bài ghi âm đã hoàn thành (optional, default: 0)
  total_completed_sessions INTEGER DEFAULT 0, -- Tổng số phiên ghi âm đã hoàn thành (optional, default: 0)
  total_seconds_recording INTEGER DEFAULT 0, -- Tổng thời gian ghi âm tính bằng giây (optional, default: 0)
  last_active TIMESTAMP WITH TIME ZONE, -- Lần hoạt động cuối (optional)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================
-- TẠO INDEXES
-- ==============================================

-- Tạo index cho các trường thường được query
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles(status);
CREATE INDEX IF NOT EXISTS idx_profiles_province_id ON profiles(province_id);
CREATE INDEX IF NOT EXISTS idx_profiles_affiliate_code ON profiles(affiliate_code);
CREATE INDEX IF NOT EXISTS idx_profiles_referrer_id ON profiles(referrer_id);
CREATE INDEX IF NOT EXISTS idx_profiles_last_active ON profiles(last_active);

-- ==============================================
-- THIẾT LẬP RLS NGAY SAU KHI TẠO BẢNG
-- ==============================================

-- Bật RLS cho bảng profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Tạo policy tạm thời cho phép tất cả operations (sẽ được thay thế sau)
CREATE POLICY "Temporary allow all for profiles setup" ON profiles
  FOR ALL USING (true) WITH CHECK (true);

-- ==============================================
-- TẠO TRIGGER CẬP NHẬT UPDATED_AT
-- ==============================================

-- Tạo trigger để tự động cập nhật updated_at
CREATE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON profiles 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ==============================================
-- FUNCTION TẠO AFFILIATE CODE
-- ==============================================

-- Tạo function để tạo affiliate code tự động với error handling tốt hơn
CREATE OR REPLACE FUNCTION generate_affiliate_code()
RETURNS TEXT AS $$
DECLARE
  new_code TEXT;
  counter INTEGER := 1;
  base_timestamp BIGINT;
BEGIN
  base_timestamp := EXTRACT(EPOCH FROM NOW())::BIGINT;
  
  LOOP
    -- Tạo mã affiliate với format: USER + timestamp cuối + số ngẫu nhiên
    new_code := 'USER' || RIGHT(base_timestamp::TEXT, 6) || LPAD(FLOOR(RANDOM() * 1000)::TEXT, 3, '0');
    
    -- Kiểm tra xem mã đã tồn tại chưa
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE affiliate_code = new_code) THEN
      RETURN new_code;
    END IF;
    
    counter := counter + 1;
    -- Tránh vòng lặp vô hạn với fallback
    IF counter > 50 THEN
      -- Fallback: sử dụng timestamp đầy đủ + random
      new_code := 'USER' || base_timestamp::TEXT || FLOOR(RANDOM() * 1000)::TEXT;
      IF NOT EXISTS (SELECT 1 FROM profiles WHERE affiliate_code = new_code) THEN
        RETURN new_code;
      ELSE
        -- Fallback cuối cùng: timestamp + counter
        new_code := 'USER' || base_timestamp::TEXT || counter::TEXT;
        RETURN new_code;
      END IF;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ==============================================
-- FUNCTION HANDLE NEW USER VỚI ERROR HANDLING
-- ==============================================

-- Tạo function để tự động tạo profile khi user đăng ký với error handling tốt
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
      referrer_id
    )
    VALUES (
      NEW.id,
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'avatar_url',
      new_affiliate_code,
      referrer_profile_id
    );
    
    RAISE LOG 'Successfully created profile for user: % with affiliate: %', NEW.id, new_affiliate_code;
    
  EXCEPTION 
    WHEN unique_violation THEN
      -- Thử lại với mã khác
      new_affiliate_code := 'USER' || EXTRACT(EPOCH FROM NOW())::BIGINT::TEXT || FLOOR(RANDOM() * 1000)::TEXT;
      INSERT INTO public.profiles (
        id, full_name, avatar_url, affiliate_code, referrer_id
      ) VALUES (
        NEW.id,
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'avatar_url',
        new_affiliate_code,
        referrer_profile_id
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
-- TẠO TRIGGER
-- ==============================================

-- Xóa trigger cũ nếu có
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Tạo trigger mới
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================
-- CẬP NHẬT RLS POLICIES ĐÚNG
-- ==============================================

-- Xóa policy tạm thời
DROP POLICY IF EXISTS "Temporary allow all for profiles setup" ON profiles;

-- Tạo policies đúng cho profiles
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

-- ==============================================
-- COMMENTS
-- ==============================================

-- Thêm comment cho bảng
COMMENT ON TABLE profiles IS 'Bảng lưu trữ thông tin bổ sung của user - đã sửa để tránh lỗi tạo user';
COMMENT ON COLUMN profiles.full_name IS 'Họ và tên đầy đủ (optional)';
COMMENT ON COLUMN profiles.avatar_url IS 'URL avatar (optional)';
COMMENT ON COLUMN profiles.phone IS 'Số điện thoại (optional)';
COMMENT ON COLUMN profiles.province_id IS 'ID tỉnh thành (optional)';
COMMENT ON COLUMN profiles.role IS 'Vai trò: admin, ctv (default: ctv)';
COMMENT ON COLUMN profiles.status IS 'Trạng thái: active, inactive, suspended (default: active)';
COMMENT ON COLUMN profiles.affiliate_code IS 'Mã affiliate duy nhất (bắt buộc)';
COMMENT ON COLUMN profiles.referrer_id IS 'ID người giới thiệu (optional)';
COMMENT ON COLUMN profiles.total_completed_recordings IS 'Tổng số bài ghi âm đã hoàn thành (default: 0)';
COMMENT ON COLUMN profiles.total_completed_sessions IS 'Tổng số phiên ghi âm đã hoàn thành (default: 0)';
COMMENT ON COLUMN profiles.total_seconds_recording IS 'Tổng thời gian ghi âm tính bằng giây (default: 0)';
COMMENT ON COLUMN profiles.last_active IS 'Lần hoạt động cuối (optional)';

COMMENT ON FUNCTION public.handle_new_user() IS 'Trigger function để tự động tạo profile khi user đăng ký - đã sửa error handling';
COMMENT ON FUNCTION generate_affiliate_code() IS 'Function tạo mã affiliate duy nhất - đã sửa để tránh lỗi';

-- ==============================================
-- VERIFICATION
-- ==============================================

-- Kiểm tra bảng đã được tạo
SELECT 'profiles table created' as status, 
       COUNT(*) as column_count 
FROM information_schema.columns 
WHERE table_name = 'profiles';

-- Kiểm tra RLS đã được bật
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'profiles';

-- Kiểm tra policies
SELECT policyname, cmd, permissive 
FROM pg_policies 
WHERE tablename = 'profiles';

-- Kiểm tra trigger
SELECT trigger_name, event_manipulation 
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

/*
HƯỚNG DẪN SỬ DỤNG:

1. THAY THẾ file 04_create_profiles_table.sql bằng file này
2. Hoặc DROP bảng profiles cũ và chạy file này:
   DROP TABLE IF EXISTS profiles CASCADE;
3. Chạy file này trong Supabase SQL Editor
4. Kiểm tra verification queries ở cuối
5. Test đăng ký user mới

NHỮNG GÌ ĐÃ ĐƯỢC SỬA:
- Thêm RLS policies ngay sau khi tạo bảng
- Cải thiện error handling trong functions
- Thêm retry logic cho affiliate code generation
- Tối ưu RLS policy cho INSERT operations
- Thêm verification queries

LƯU Ý:
- File này sẽ thay thế hoàn toàn file 04 cũ
- Không cần chạy file 09_fix_user_creation_rls_policy.sql nữa
- Tất cả logic affiliate system được giữ nguyên
*/
