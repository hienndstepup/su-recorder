-- Tạo bảng profiles đơn giản với affiliate system
-- Tập trung vào logic admin/ctv và affiliate code

CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT, -- Họ và tên (optional)
  avatar_url TEXT, -- URL avatar (optional)
  phone TEXT, -- Số điện thoại (optional)
  province_id UUID REFERENCES provinces(id) ON DELETE SET NULL, -- Tỉnh thành (optional)
  
  -- Hệ thống vai trò và affiliate đơn giản
  role VARCHAR(20) DEFAULT 'ctv' CHECK (role IN ('admin', 'ctv')), -- Chỉ 2 vai trò
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')), -- Đơn giản hóa status
  affiliate_code VARCHAR(20) UNIQUE NOT NULL, -- Mã affiliate ngắn gọn
  referrer_id UUID REFERENCES profiles(id) ON DELETE SET NULL, -- Người giới thiệu (optional)
  
  -- Thống kê cơ bản
  total_recordings INTEGER DEFAULT 0, -- Tổng số bài ghi âm
  total_duration INTEGER DEFAULT 0, -- Tổng thời lượng (giây)
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tạo index cơ bản
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles(status);
CREATE INDEX IF NOT EXISTS idx_profiles_affiliate_code ON profiles(affiliate_code);
CREATE INDEX IF NOT EXISTS idx_profiles_referrer_id ON profiles(referrer_id);

-- Tạo trigger
CREATE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON profiles 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Function tạo affiliate code đơn giản
CREATE OR REPLACE FUNCTION generate_simple_affiliate_code()
RETURNS TEXT AS $$
DECLARE
  new_code TEXT;
  counter INTEGER := 1;
BEGIN
  LOOP
    -- Tạo mã 8 ký tự: CTV + 5 số ngẫu nhiên
    new_code := 'CTV' || LPAD(FLOOR(RANDOM() * 99999)::TEXT, 5, '0');
    
    -- Kiểm tra xem mã đã tồn tại chưa
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE affiliate_code = new_code) THEN
      RETURN new_code;
    END IF;
    
    counter := counter + 1;
    -- Tránh vòng lặp vô hạn
    IF counter > 100 THEN
      -- Fallback với timestamp
      new_code := 'CTV' || RIGHT(EXTRACT(EPOCH FROM NOW())::TEXT, 5);
      RETURN new_code;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function handle new user đơn giản
CREATE OR REPLACE FUNCTION handle_new_user_simple()
RETURNS TRIGGER AS $$
DECLARE
  referrer_code TEXT;
  referrer_profile_id UUID;
  new_affiliate_code TEXT;
BEGIN
  -- Lấy mã giới thiệu từ metadata
  referrer_code := NEW.raw_user_meta_data->>'referrer_code';
  
  -- Tìm referrer nếu có
  IF referrer_code IS NOT NULL THEN
    SELECT id INTO referrer_profile_id 
    FROM profiles 
    WHERE affiliate_code = referrer_code AND status = 'active';
  END IF;
  
  -- Tạo affiliate code
  new_affiliate_code := generate_simple_affiliate_code();
  
  -- Tạo profile
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
    COALESCE(NEW.raw_user_meta_data->>'role', 'ctv') -- Default là ctv
  );
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log lỗi nhưng không block việc tạo user
  RAISE WARNING 'Failed to create profile: %, User ID: %', SQLERRM, NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Tạo trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user_simple();

-- Thiết lập RLS cơ bản
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy: User có thể xem và sửa profile của mình
CREATE POLICY "Users can manage own profile" ON profiles
  FOR ALL USING (auth.uid() = id);

-- Policy: Admin có thể xem tất cả profiles
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policy: CTV có thể xem profiles của những người mình giới thiệu
CREATE POLICY "CTVs can view their referrals" ON profiles
  FOR SELECT USING (
    referrer_id = auth.uid()
  );

-- Policy: Cho phép tạo profile (cho trigger)
CREATE POLICY "Allow profile creation" ON profiles
  FOR INSERT WITH CHECK (true);

-- Thêm comment
COMMENT ON TABLE profiles IS 'Bảng profiles đơn giản với hệ thống affiliate';
COMMENT ON COLUMN profiles.role IS 'Vai trò: admin hoặc ctv';
COMMENT ON COLUMN profiles.status IS 'Trạng thái: active hoặc inactive';
COMMENT ON COLUMN profiles.affiliate_code IS 'Mã affiliate duy nhất (8 ký tự)';
COMMENT ON COLUMN profiles.referrer_id IS 'ID người giới thiệu (optional)';
COMMENT ON COLUMN profiles.total_recordings IS 'Tổng số bài ghi âm';
COMMENT ON COLUMN profiles.total_duration IS 'Tổng thời lượng ghi âm (giây)';

COMMENT ON FUNCTION generate_simple_affiliate_code() IS 'Tạo mã affiliate đơn giản 8 ký tự';
COMMENT ON FUNCTION handle_new_user_simple() IS 'Tự động tạo profile khi user đăng ký';
