-- Add is_pass column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_pass BOOLEAN DEFAULT false;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_profiles_is_pass ON profiles(is_pass);

COMMENT ON COLUMN profiles.is_pass IS 'Trạng thái đã pass hay chưa của CTV';
