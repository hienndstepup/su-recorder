-- Tạo bảng questions đơn giản
-- Tất cả các trường đều optional để linh hoạt

CREATE TABLE IF NOT EXISTS questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  text TEXT, -- Nội dung câu hỏi (optional)
  type VARCHAR(50), -- Loại câu hỏi (optional)
  audio_url TEXT, -- URL file audio (optional) 
  hint TEXT, -- Gợi ý (optional)
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tạo index cơ bản
CREATE INDEX IF NOT EXISTS idx_questions_type ON questions(type);
CREATE INDEX IF NOT EXISTS idx_questions_active ON questions(is_active);

-- Tạo trigger
CREATE TRIGGER update_questions_updated_at 
    BEFORE UPDATE ON questions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Thêm comment
COMMENT ON TABLE questions IS 'Bảng lưu trữ câu hỏi - phiên bản đơn giản';
COMMENT ON COLUMN questions.text IS 'Nội dung câu hỏi (optional)';
COMMENT ON COLUMN questions.type IS 'Loại câu hỏi (optional)';
COMMENT ON COLUMN questions.audio_url IS 'URL file audio (optional)';
COMMENT ON COLUMN questions.hint IS 'Gợi ý cho câu hỏi (optional)';
COMMENT ON COLUMN questions.is_active IS 'Trạng thái hoạt động';
