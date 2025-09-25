-- Add signature column to profiles table
-- This column will store the signature as a base64 data URL

ALTER TABLE profiles 
ADD COLUMN signature TEXT;

-- Add comment to the column
COMMENT ON COLUMN profiles.signature IS 'Base64 encoded signature image data URL';
