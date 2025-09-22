-- Function to update profile information
CREATE OR REPLACE FUNCTION update_profile_info(
  profile_id UUID,
  new_full_name TEXT DEFAULT NULL,
  new_phone TEXT DEFAULT NULL,
  new_id_number TEXT DEFAULT NULL,
  new_address TEXT DEFAULT NULL,
  new_bank_account_name TEXT DEFAULT NULL,
  new_bank_name TEXT DEFAULT NULL,
  new_bank_account_number TEXT DEFAULT NULL,
  new_front_cccd TEXT DEFAULT NULL,
  new_back_cccd TEXT DEFAULT NULL,
  new_is_pass BOOLEAN DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user has permission to update this profile
  IF EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND status = 'active'
    AND (
      -- User can update their own profile
      id = profile_id
      OR
      -- Admin can update any profile
      role = 'admin'
      OR
      -- CTV can update their referrals' profiles
      (role = 'ctv' AND EXISTS (
        SELECT 1 FROM profiles referral
        WHERE referral.id = profile_id
        AND referral.referrer_id = auth.uid()
      ))
    )
  ) THEN
    -- Update the profile
    UPDATE profiles 
    SET 
      full_name = COALESCE(new_full_name, full_name),
      phone = COALESCE(new_phone, phone),
      id_number = COALESCE(new_id_number, id_number),
      address = COALESCE(new_address, address),
      bank_account_name = COALESCE(new_bank_account_name, bank_account_name),
      bank_name = COALESCE(new_bank_name, bank_name),
      bank_account_number = COALESCE(new_bank_account_number, bank_account_number),
      front_cccd = COALESCE(new_front_cccd, front_cccd),
      back_cccd = COALESCE(new_back_cccd, back_cccd),
      is_pass = COALESCE(new_is_pass, is_pass),
      updated_at = NOW()
    WHERE id = profile_id;
  ELSE
    RAISE EXCEPTION 'Permission denied';
  END IF;
END;
$$;
