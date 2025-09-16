-- Tạo bảng recordings đơn giản
-- Chỉ lưu thông tin cần thiết, bỏ các ràng buộc phức tạp

CREATE TABLE IF NOT EXISTS recordings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL, -- CTV ghi âm
  question_id UUID REFERENCES questions(id) ON DELETE SET NULL, -- Câu hỏi (optional)
  province_id UUID REFERENCES provinces(id) ON DELETE SET NULL, -- Tỉnh thành (optional)
  
  -- Thông tin file audio
  audio_url TEXT, -- URL file audio (optional)
  audio_duration INTEGER, -- Thời lượng tính bằng giây (optional)
  audio_script TEXT, -- Văn bản từ ASR (optional)
  
  -- Thời gian
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tạo index cơ bản
CREATE INDEX IF NOT EXISTS idx_recordings_user_id ON recordings(user_id);
CREATE INDEX IF NOT EXISTS idx_recordings_question_id ON recordings(question_id);
CREATE INDEX IF NOT EXISTS idx_recordings_province_id ON recordings(province_id);
CREATE INDEX IF NOT EXISTS idx_recordings_recorded_at ON recordings(recorded_at);

-- Tạo composite index cho query phổ biến
CREATE INDEX IF NOT EXISTS idx_recordings_user_recorded ON recordings(user_id, recorded_at DESC);

-- Tạo trigger
CREATE TRIGGER update_recordings_updated_at 
    BEFORE UPDATE ON recordings 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Function cập nhật thống kê user đơn giản
CREATE OR REPLACE FUNCTION update_user_stats_simple()
RETURNS TRIGGER AS $$
BEGIN
  -- Cập nhật tổng số recordings
  UPDATE profiles 
  SET total_recordings = (
    SELECT COUNT(*) 
    FROM recordings 
    WHERE user_id = NEW.user_id
  )
  WHERE id = NEW.user_id;
  
  -- Cập nhật tổng thời lượng
  UPDATE profiles 
  SET total_duration = (
    SELECT COALESCE(SUM(audio_duration), 0)
    FROM recordings 
    WHERE user_id = NEW.user_id AND audio_duration IS NOT NULL
  )
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Tạo trigger cập nhật thống kê
CREATE TRIGGER update_user_stats_on_recording
  AFTER INSERT OR UPDATE ON recordings
  FOR EACH ROW 
  EXECUTE FUNCTION update_user_stats_simple();

-- Thiết lập RLS cơ bản
ALTER TABLE recordings ENABLE ROW LEVEL SECURITY;

-- Policy: User có thể xem và tạo recordings của mình
CREATE POLICY "Users can manage own recordings" ON recordings
  FOR ALL USING (auth.uid() = user_id);

-- Policy: Admin có thể xem tất cả recordings
CREATE POLICY "Admins can view all recordings" ON recordings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policy: CTV có thể xem recordings của những người mình giới thiệu
CREATE POLICY "CTVs can view referrals recordings" ON recordings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = recordings.user_id AND referrer_id = auth.uid()
    )
  );

-- Thêm comment
COMMENT ON TABLE recordings IS 'Bảng recordings đơn giản';
COMMENT ON COLUMN recordings.user_id IS 'ID của CTV thực hiện ghi âm';
COMMENT ON COLUMN recordings.question_id IS 'ID câu hỏi (optional)';
COMMENT ON COLUMN recordings.province_id IS 'ID tỉnh thành (optional)';
COMMENT ON COLUMN recordings.audio_url IS 'URL file audio (optional)';
COMMENT ON COLUMN recordings.audio_duration IS 'Thời lượng tính bằng giây (optional)';
COMMENT ON COLUMN recordings.audio_script IS 'Văn bản từ ASR (optional)';
COMMENT ON COLUMN recordings.recorded_at IS 'Thời gian ghi âm';

COMMENT ON FUNCTION update_user_stats_simple() IS 'Cập nhật thống kê user khi có recording mới';
