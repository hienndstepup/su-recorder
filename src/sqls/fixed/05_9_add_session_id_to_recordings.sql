-- Add session_id column to recordings table
ALTER TABLE recordings 
ADD COLUMN IF NOT EXISTS session_id UUID REFERENCES sessions(id) ON DELETE SET NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_recordings_session_id ON recordings(session_id);

-- Add comment
COMMENT ON COLUMN recordings.session_id IS 'ID của session khi tạo recording này';

-- Update RLS policies to include session_id
-- Note: Existing policies should still work as session_id is optional
