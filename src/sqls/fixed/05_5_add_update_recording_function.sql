-- Function to update recording is_pass status
CREATE OR REPLACE FUNCTION update_recording_is_pass(
  recording_id UUID,
  new_is_pass BOOLEAN
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user has permission to update this recording
  IF EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND status = 'active'
    AND (
      -- User is admin
      role = 'admin'
      OR
      -- User is CTV and recording belongs to their referral
      (role = 'ctv' AND EXISTS (
        SELECT 1 FROM profiles referral
        WHERE referral.id = (SELECT user_id FROM recordings WHERE id = recording_id)
        AND referral.referrer_id = auth.uid()
      ))
    )
  ) THEN
    -- Update the recording
    UPDATE recordings 
    SET is_pass = new_is_pass
    WHERE id = recording_id;
  ELSE
    RAISE EXCEPTION 'Permission denied';
  END IF;
END;
$$;
