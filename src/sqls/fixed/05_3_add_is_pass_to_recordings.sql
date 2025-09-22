-- Add is_pass column to recordings table
ALTER TABLE recordings 
ADD COLUMN IF NOT EXISTS is_pass BOOLEAN DEFAULT false;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_recordings_is_pass ON recordings(is_pass);

COMMENT ON COLUMN recordings.is_pass IS 'Trạng thái duyệt của bài ghi âm';
