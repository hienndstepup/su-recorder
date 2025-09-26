-- Function to delete a recording with proper permission checks
-- This function ensures that only authorized users can delete recordings
-- and automatically updates profile statistics

-- Drop existing function if exists
DROP FUNCTION IF EXISTS public.delete_recording(UUID);
DROP FUNCTION IF EXISTS public.delete_recording(recording_id UUID);

-- Create function to delete recording
CREATE OR REPLACE FUNCTION public.delete_recording(recording_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_role VARCHAR(20);
  current_user_id UUID;
  recording_user_id UUID;
  recording_referrer_id UUID;
  deleted_count INTEGER;
BEGIN
  -- Get current user's role and id
  SELECT p.role, p.id INTO current_user_role, current_user_id
  FROM public.profiles p
  WHERE p.id = auth.uid();

  -- Check if user exists and is active
  IF current_user_id IS NULL OR current_user_role IS NULL THEN
    RAISE EXCEPTION 'User not found or inactive';
  END IF;

  -- Get recording owner info
  SELECT r.user_id, p.referrer_id 
  INTO recording_user_id, recording_referrer_id
  FROM public.recordings r
  LEFT JOIN public.profiles p ON r.user_id = p.id
  WHERE r.id = recording_id;

  -- Check if recording exists
  IF recording_user_id IS NULL THEN
    RAISE EXCEPTION 'Recording not found';
  END IF;

  -- Check permissions
  IF current_user_role = 'admin' THEN
    -- Admin can delete any recording
    NULL; -- Allow deletion
  ELSIF current_user_role = 'ctv' THEN
    -- CTV can only delete recordings from their referrals
    IF recording_referrer_id != current_user_id THEN
      RAISE EXCEPTION 'Permission denied: Can only delete recordings from your referrals';
    END IF;
  ELSE
    -- Other roles cannot delete
    RAISE EXCEPTION 'Permission denied: Insufficient privileges';
  END IF;

  -- Delete the recording (trigger will automatically update profile stats)
  DELETE FROM public.recordings 
  WHERE id = recording_id;

  -- Check if deletion was successful
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  IF deleted_count = 0 THEN
    RAISE EXCEPTION 'Failed to delete recording';
  END IF;

  RETURN TRUE;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.delete_recording(UUID) TO authenticated;