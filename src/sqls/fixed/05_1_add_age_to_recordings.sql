-- Add age column to recordings table
ALTER TABLE recordings ADD COLUMN IF NOT EXISTS age INTEGER;

-- Add comment for the new column
COMMENT ON COLUMN recordings.age IS 'Tuổi của người ghi âm (không bắt buộc)';
