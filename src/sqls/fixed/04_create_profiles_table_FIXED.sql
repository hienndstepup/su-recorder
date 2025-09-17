-- PROFILES with affiliate & safer bootstrap

CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  province_id UUID REFERENCES provinces(id) ON DELETE SET NULL,
  role VARCHAR(20) DEFAULT 'ctv' CHECK (role IN ('admin','ctv')),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active','inactive')),
  affiliate_code VARCHAR(20) UNIQUE NOT NULL,
  referrer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  total_recordings INTEGER DEFAULT 0,
  total_duration INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles(status);
CREATE INDEX IF NOT EXISTS idx_profiles_affiliate_code ON profiles(affiliate_code);
CREATE INDEX IF NOT EXISTS idx_profiles_referrer_id ON profiles(referrer_id);

CREATE TRIGGER update_profiles_updated_at 
  BEFORE UPDATE ON profiles 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- SECURITY NOTE:
-- Do NOT trust user-provided role from raw_user_meta_data.
-- Always default to 'ctv'. Promote to 'admin' only via service role later.

-- Generate unique affiliate code (runs under definer to bypass RLS during checks)
CREATE OR REPLACE FUNCTION generate_simple_affiliate_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_code TEXT;
  counter INTEGER := 1;
BEGIN
  LOOP
    new_code := 'CTV' || LPAD(FLOOR(RANDOM() * 99999)::TEXT, 5, '0');
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE affiliate_code = new_code) THEN
      RETURN new_code;
    END IF;
    counter := counter + 1;
    IF counter > 100 THEN
      new_code := 'CTV' || RIGHT(EXTRACT(EPOCH FROM NOW())::TEXT, 5);
      RETURN new_code;
    END IF;
  END LOOP;
END;
$$;

-- Helper: check admin (definer to bypass RLS)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin' AND status = 'active'
  );
END;
$$;

-- Auto-create profile on auth.users insert
CREATE OR REPLACE FUNCTION handle_new_user_simple()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  referrer_code TEXT;
  referrer_profile_id UUID;
  new_affiliate_code TEXT;
BEGIN
  referrer_code := NEW.raw_user_meta_data->>'referrer_code';

  IF referrer_code IS NOT NULL THEN
    SELECT id INTO referrer_profile_id
    FROM public.profiles
    WHERE affiliate_code = referrer_code AND status = 'active';
  END IF;

  new_affiliate_code := generate_simple_affiliate_code();

  INSERT INTO public.profiles (id, full_name, avatar_url, affiliate_code, referrer_id, role)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url',
    new_affiliate_code,
    referrer_profile_id,
    'ctv' -- force safe default
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Failed to create profile: %, User ID: %', SQLERRM, NEW.id;
  RETURN NEW;
END;
$$;

-- Trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user_simple();

-- RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Recreate policies (idempotent)
DROP POLICY IF EXISTS "profiles_select_self" ON profiles;
DROP POLICY IF EXISTS "profiles_select_admin_all" ON profiles;
DROP POLICY IF EXISTS "profiles_select_referrals" ON profiles;
DROP POLICY IF EXISTS "profiles_update_self" ON profiles;
DROP POLICY IF EXISTS "profiles_delete_admin" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_admin" ON profiles;

-- Self can view
CREATE POLICY "profiles_select_self" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Admin can view all
CREATE POLICY "profiles_select_admin_all" ON profiles
  FOR SELECT USING (is_admin());

-- CTV can view their referrals (children)
CREATE POLICY "profiles_select_referrals" ON profiles
  FOR SELECT USING (referrer_id = auth.uid());

-- Self can update their own profile
CREATE POLICY "profiles_update_self" ON profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Only admin can delete any profile
CREATE POLICY "profiles_delete_admin" ON profiles
  FOR DELETE USING (is_admin());

-- Optional: allow admin to insert manually (normal inserts are done by trigger)
CREATE POLICY "profiles_insert_admin" ON profiles
  FOR INSERT WITH CHECK (is_admin());

COMMENT ON TABLE profiles IS 'Bảng profiles với affiliate + trigger tạo tự động (FIXED)';
COMMENT ON FUNCTION is_admin() IS 'Kiểm tra user có phải admin (SECURITY DEFINER, search_path=public)';
