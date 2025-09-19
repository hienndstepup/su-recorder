-- Add payment info columns to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS id_number TEXT,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS bank_account_name TEXT,
ADD COLUMN IF NOT EXISTS bank_name TEXT,
ADD COLUMN IF NOT EXISTS bank_account_number TEXT;

-- Update trigger to handle new columns
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

  INSERT INTO public.profiles (
    id, 
    full_name, 
    avatar_url, 
    affiliate_code, 
    referrer_id, 
    role,
    -- Add new columns with NULL default values
    id_number,
    address,
    bank_account_name,
    bank_name,
    bank_account_number
  )
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url',
    new_affiliate_code,
    referrer_profile_id,
    'ctv', -- force safe default
    NULL, -- id_number
    NULL, -- address
    NULL, -- bank_account_name
    NULL, -- bank_name
    NULL  -- bank_account_number
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Failed to create profile: %, User ID: %', SQLERRM, NEW.id;
  RETURN NEW;
END;
$$;

COMMENT ON COLUMN profiles.id_number IS 'Số CCCD của người dùng';
COMMENT ON COLUMN profiles.address IS 'Địa chỉ của người dùng';
COMMENT ON COLUMN profiles.bank_account_name IS 'Tên chủ tài khoản ngân hàng';
COMMENT ON COLUMN profiles.bank_name IS 'Tên ngân hàng';
COMMENT ON COLUMN profiles.bank_account_number IS 'Số tài khoản ngân hàng';
