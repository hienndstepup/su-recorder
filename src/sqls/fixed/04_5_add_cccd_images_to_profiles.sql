-- Add CCCD image columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS front_cccd TEXT,
ADD COLUMN IF NOT EXISTS back_cccd TEXT;

COMMENT ON COLUMN profiles.front_cccd IS 'URL ảnh mặt trước CCCD';
COMMENT ON COLUMN profiles.back_cccd IS 'URL ảnh mặt sau CCCD';
