-- Tạo bảng questions để lưu trữ các câu hỏi
-- Tất cả các trường đều optional (có thể NULL)

CREATE TABLE IF NOT EXISTS questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  text TEXT, -- Nội dung câu hỏi (có thể NULL)
  type VARCHAR(50), -- Loại câu hỏi (có thể NULL) - ví dụ: 'multiple_choice', 'open_ended', 'yes_no'
  audio TEXT, -- URL hoặc path đến file audio (có thể NULL)
  hint TEXT, -- Gợi ý cho câu hỏi (có thể NULL)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true -- Để enable/disable câu hỏi
);

-- Tạo index cho các trường thường được query
CREATE INDEX IF NOT EXISTS idx_questions_type ON questions(type);
CREATE INDEX IF NOT EXISTS idx_questions_active ON questions(is_active);
CREATE INDEX IF NOT EXISTS idx_questions_created_at ON questions(created_at);

-- Tạo trigger để tự động cập nhật updated_at
-- Function update_updated_at_column() đã được tạo trong file 01_create_provinces_table.sql

CREATE TRIGGER update_questions_updated_at 
    BEFORE UPDATE ON questions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Thêm comment cho bảng
COMMENT ON TABLE questions IS 'Bảng lưu trữ các câu hỏi cho hệ thống ghi âm';
COMMENT ON COLUMN questions.text IS 'Nội dung câu hỏi (optional)';
COMMENT ON COLUMN questions.type IS 'Loại câu hỏi (optional) - multiple_choice, open_ended, yes_no, etc.';
COMMENT ON COLUMN questions.audio IS 'URL hoặc path đến file audio (optional)';
COMMENT ON COLUMN questions.hint IS 'Gợi ý cho câu hỏi (optional)';
COMMENT ON COLUMN questions.is_active IS 'Trạng thái hoạt động của câu hỏi';
