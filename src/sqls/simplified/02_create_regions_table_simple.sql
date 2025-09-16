-- Tạo bảng regions đơn giản 
-- Bỏ các ràng buộc phức tạp, chỉ giữ 3 miền cơ bản

CREATE TABLE IF NOT EXISTS regions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code VARCHAR(10) UNIQUE NOT NULL, -- Mã khu vực
  name VARCHAR(50) NOT NULL, -- Tên khu vực
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tạo index cơ bản
CREATE INDEX IF NOT EXISTS idx_regions_code ON regions(code);
CREATE INDEX IF NOT EXISTS idx_regions_active ON regions(is_active);

-- Tạo trigger
CREATE TRIGGER update_regions_updated_at 
    BEFORE UPDATE ON regions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Chèn dữ liệu 3 khu vực chính
INSERT INTO regions (code, name, is_active) VALUES
('NORTH', 'Miền Bắc', true),
('CENTRAL', 'Miền Trung', true),
('SOUTH', 'Miền Nam', true);

-- Thêm comment
COMMENT ON TABLE regions IS 'Bảng lưu trữ khu vực địa lý - phiên bản đơn giản';
COMMENT ON COLUMN regions.code IS 'Mã khu vực (NORTH, CENTRAL, SOUTH)';
COMMENT ON COLUMN regions.name IS 'Tên khu vực';
COMMENT ON COLUMN regions.is_active IS 'Trạng thái hoạt động';
