-- Drop existing policies if any
DROP POLICY IF EXISTS "recordings_update_admin" ON recordings;
DROP POLICY IF EXISTS "recordings_update_referrals" ON recordings;

-- Admin can update any recording
CREATE POLICY "recordings_update_admin" ON recordings
  FOR UPDATE USING (
    is_admin()
  ) WITH CHECK (
    is_admin()
  );

-- CTV can update recordings of their referrals
CREATE POLICY "recordings_update_referrals" ON recordings
  FOR UPDATE USING (
    -- User must be active CTV or admin
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND status = 'active'
      AND (role = 'ctv' OR role = 'admin')
    )
    -- Recording must belong to a referral of the user
    AND EXISTS (
      SELECT 1 FROM profiles referral
      WHERE referral.id = recordings.user_id
      AND referral.referrer_id = auth.uid()
    )
  ) WITH CHECK (
    -- User must be active CTV or admin
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND status = 'active'
      AND (role = 'ctv' OR role = 'admin')
    )
    -- Recording must belong to a referral of the user
    AND EXISTS (
      SELECT 1 FROM profiles referral
      WHERE referral.id = recordings.user_id
      AND referral.referrer_id = auth.uid()
    )
  );

COMMENT ON POLICY recordings_update_admin ON recordings IS 'Allow admin to update any recording';
COMMENT ON POLICY recordings_update_referrals ON recordings IS 'Allow CTV to update recordings of their referrals';