-- Tạo bảng profiles để lưu thông tin bổ sung của user
-- Liên kết với auth.users của Supabase

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

-- Tạo index cho các trường thường được query
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles(status);
CREATE INDEX IF NOT EXISTS idx_profiles_province_id ON profiles(province_id);
CREATE INDEX IF NOT EXISTS idx_profiles_affiliate_code ON profiles(affiliate_code);
CREATE INDEX IF NOT EXISTS idx_profiles_referrer_id ON profiles(referrer_id);
CREATE INDEX IF NOT EXISTS idx_profiles_last_active ON profiles(last_active);

-- Tạo trigger để tự động cập nhật updated_at
CREATE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON profiles 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Tạo function để tạo affiliate code tự động
CREATE OR REPLACE FUNCTION generate_affiliate_code()
RETURNS TEXT AS $$
DECLARE
  new_code TEXT;
  counter INTEGER := 1;
BEGIN
  LOOP
    -- Tạo mã affiliate với format: USER + 6 số ngẫu nhiên
    new_code := 'USER' || LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
    
    -- Kiểm tra xem mã đã tồn tại chưa
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE affiliate_code = new_code) THEN
      RETURN new_code;
    END IF;
    
    counter := counter + 1;
    -- Tránh vòng lặp vô hạn
    IF counter > 100 THEN
      RAISE EXCEPTION 'Không thể tạo mã affiliate duy nhất';
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Tạo function để tự động tạo profile khi user đăng ký
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  referrer_code TEXT;
  referrer_profile_id UUID;
BEGIN
  -- Lấy mã giới thiệu từ metadata nếu có
  referrer_code := NEW.raw_user_meta_data->>'referrer_code';
  
  -- Tìm referrer_id nếu có mã giới thiệu
  IF referrer_code IS NOT NULL THEN
    SELECT id INTO referrer_profile_id 
    FROM profiles 
    WHERE affiliate_code = referrer_code;
  END IF;
  
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
    generate_affiliate_code(),
    referrer_profile_id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Tạo trigger để tự động tạo profile
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function và trigger để cập nhật thống kê sẽ được tạo trong file 05_create_recordings_table.sql
-- vì chúng cần tham chiếu đến bảng recordings

-- Thêm comment cho bảng
COMMENT ON TABLE profiles IS 'Bảng lưu trữ thông tin bổ sung của user';
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
