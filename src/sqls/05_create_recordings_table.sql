-- Tạo bảng recordings để lưu kết quả ghi âm của CTV
-- Liên kết với questions, profiles, regions và provinces

CREATE TABLE IF NOT EXISTS recordings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL, -- ID của CTV
  question_id UUID REFERENCES questions(id) ON DELETE SET NULL, -- ID của câu hỏi (optional)
  region_id UUID REFERENCES regions(id) ON DELETE SET NULL, -- ID khu vực (optional)
  province_id UUID REFERENCES provinces(id) ON DELETE SET NULL, -- ID tỉnh thành (optional)
  
  -- Thông tin file audio
  audio_url TEXT, -- URL đến file audio (optional)
  audio_duration INTEGER, -- Thời lượng audio tính bằng giây (optional)
  
  -- Kết quả ASR (Automatic Speech Recognition)
  audio_script TEXT, -- Văn bản được chuyển đổi từ audio (optional)
  
  -- Timestamps
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- Thời gian ghi âm
  processed_at TIMESTAMP WITH TIME ZONE, -- Thời gian xử lý ASR (optional)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tạo index cho các trường thường được query
CREATE INDEX IF NOT EXISTS idx_recordings_user_id ON recordings(user_id);
CREATE INDEX IF NOT EXISTS idx_recordings_question_id ON recordings(question_id);
CREATE INDEX IF NOT EXISTS idx_recordings_region_id ON recordings(region_id);
CREATE INDEX IF NOT EXISTS idx_recordings_province_id ON recordings(province_id);
CREATE INDEX IF NOT EXISTS idx_recordings_recorded_at ON recordings(recorded_at);
CREATE INDEX IF NOT EXISTS idx_recordings_created_at ON recordings(created_at);

-- Tạo composite index cho query phổ biến
CREATE INDEX IF NOT EXISTS idx_recordings_user_created ON recordings(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_recordings_region_province ON recordings(region_id, province_id);

-- Tạo trigger để tự động cập nhật updated_at
CREATE TRIGGER update_recordings_updated_at 
    BEFORE UPDATE ON recordings 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Tạo function để cập nhật thống kê user khi có recording mới
CREATE OR REPLACE FUNCTION update_user_recording_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Cập nhật total_completed_recordings
  UPDATE profiles 
  SET total_completed_recordings = (
    SELECT COUNT(*) 
    FROM recordings 
    WHERE user_id = NEW.user_id
  )
  WHERE id = NEW.user_id;
  
  -- Cập nhật total_seconds_recording
  UPDATE profiles 
  SET total_seconds_recording = (
    SELECT COALESCE(SUM(audio_duration), 0)
    FROM recordings 
    WHERE user_id = NEW.user_id AND audio_duration IS NOT NULL
  )
  WHERE id = NEW.user_id;
  
  -- Cập nhật last_active
  UPDATE profiles 
  SET last_active = NOW()
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Tạo trigger để cập nhật thống kê
CREATE TRIGGER update_user_stats_on_recording
  AFTER INSERT OR UPDATE ON recordings
  FOR EACH ROW 
  EXECUTE FUNCTION update_user_recording_stats();

-- Thêm comment cho bảng
COMMENT ON TABLE recordings IS 'Bảng lưu trữ kết quả ghi âm của CTV';
COMMENT ON COLUMN recordings.user_id IS 'ID của CTV thực hiện ghi âm';
COMMENT ON COLUMN recordings.question_id IS 'ID của câu hỏi (optional)';
COMMENT ON COLUMN recordings.region_id IS 'ID khu vực (optional)';
COMMENT ON COLUMN recordings.province_id IS 'ID tỉnh thành (optional)';
COMMENT ON COLUMN recordings.audio_url IS 'URL đến file audio (optional)';
COMMENT ON COLUMN recordings.audio_duration IS 'Thời lượng audio tính bằng giây (optional)';
COMMENT ON COLUMN recordings.audio_script IS 'Văn bản được chuyển đổi từ audio (optional)';
COMMENT ON COLUMN recordings.recorded_at IS 'Thời gian ghi âm';
COMMENT ON COLUMN recordings.processed_at IS 'Thời gian xử lý ASR (optional)';
