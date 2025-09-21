-- Drop existing update policies
DROP POLICY IF EXISTS "profiles_update_self" ON profiles;
DROP POLICY IF EXISTS "profiles_update_admin" ON profiles;
DROP POLICY IF EXISTS "profiles_update_referrals" ON profiles;

-- Create new update policies

-- Self can update their own profile (except role and status fields)
CREATE POLICY "profiles_update_self" ON profiles
  FOR UPDATE USING (
    auth.uid() = id
  ) WITH CHECK (
    auth.uid() = id
  );

-- Admin can update any profile
CREATE POLICY "profiles_update_admin" ON profiles
  FOR UPDATE USING (
    is_admin()
  ) WITH CHECK (
    is_admin()
  );

-- CTV can update their referrals' profiles
CREATE POLICY "profiles_update_referrals" ON profiles
  FOR UPDATE USING (
    -- User must be active CTV or admin
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND status = 'active'
      AND (role = 'ctv' OR role = 'admin')
    )
    -- Target must be a referral of the user
    AND referrer_id = auth.uid()
  ) WITH CHECK (
    -- User must be active CTV or admin
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND status = 'active'
      AND (role = 'ctv' OR role = 'admin')
    )
    -- Target must be a referral of the user
    AND referrer_id = auth.uid()
  );

COMMENT ON POLICY profiles_update_self ON profiles IS 'Allow users to update their own profile';
COMMENT ON POLICY profiles_update_admin ON profiles IS 'Allow admin to update any profile';
COMMENT ON POLICY profiles_update_referrals ON profiles IS 'Allow CTV to update their referrals profiles';