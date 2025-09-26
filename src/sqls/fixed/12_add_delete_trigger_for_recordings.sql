-- Add trigger to update profile statistics when recordings are deleted
-- This ensures that total_recordings and total_duration are properly maintained

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS update_user_stats_on_recording_delete ON recordings;

-- Create function to update stats on DELETE
CREATE OR REPLACE FUNCTION update_user_stats_on_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Decrease total_recordings and total_duration when recording is deleted
  UPDATE profiles
  SET 
    total_recordings = GREATEST(0, total_recordings - 1),
    total_duration = GREATEST(0, total_duration - COALESCE(OLD.audio_duration, 0))
  WHERE id = OLD.user_id;

  RETURN OLD;
END;
$$;

-- Create trigger for DELETE
CREATE TRIGGER update_user_stats_on_recording_delete
  AFTER DELETE ON recordings
  FOR EACH ROW 
  EXECUTE FUNCTION update_user_stats_on_delete();

-- Grant execute permission
GRANT EXECUTE ON FUNCTION update_user_stats_on_delete() TO authenticated;
