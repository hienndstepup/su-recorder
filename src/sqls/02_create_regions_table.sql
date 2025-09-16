-- Tạo bảng regions cho các khu vực
-- Phân chia 3 miền chính của Việt Nam

CREATE TABLE IF NOT EXISTS regions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code VARCHAR(10) UNIQUE NOT NULL, -- Mã khu vực (north, central, south)
  name VARCHAR(50) NOT NULL, -- Tên khu vực
  description TEXT, -- Mô tả khu vực (optional)
  is_active BOOLEAN DEFAULT true, -- Trạng thái hoạt động
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tạo index cho các trường thường được query
CREATE INDEX IF NOT EXISTS idx_regions_code ON regions(code);
CREATE INDEX IF NOT EXISTS idx_regions_active ON regions(is_active);
CREATE INDEX IF NOT EXISTS idx_regions_name ON regions(name);

-- Tạo trigger để tự động cập nhật updated_at
CREATE TRIGGER update_regions_updated_at 
    BEFORE UPDATE ON regions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Chèn dữ liệu 3 khu vực chính
INSERT INTO regions (code, name, description, is_active) VALUES
('NORTH', 'Miền Bắc', 'Bao gồm các tỉnh từ Hà Nội đến biên giới phía Bắc', true),
('CENTRAL', 'Miền Trung', 'Bao gồm các tỉnh từ Thanh Hóa đến Bình Thuận', true),
('SOUTH', 'Miền Nam', 'Bao gồm các tỉnh từ TP.HCM đến Cà Mau', true);

-- Cập nhật region_id cho bảng provinces
UPDATE provinces SET region_id = (SELECT id FROM regions WHERE code = 'NORTH') 
WHERE code IN ('HN', 'HP', 'QN', 'TB', 'ND', 'NB', 'HD', 'HY', 'BN', 'BG', 'LC', 'YB', 'TB2', 'TH', 'CB', 'BK', 'LG', 'QB', 'HGI', 'DB', 'LB', 'SL', 'HB');

UPDATE provinces SET region_id = (SELECT id FROM regions WHERE code = 'CENTRAL') 
WHERE code IN ('TH2', 'NA', 'HT', 'QB2', 'QT', 'TT', 'DN', 'QN2', 'QN3', 'BD', 'PY', 'KH', 'NT', 'BT', 'KT', 'GL', 'DL', 'DN2', 'LD');

UPDATE provinces SET region_id = (SELECT id FROM regions WHERE code = 'SOUTH') 
WHERE code IN ('HCM', 'BD2', 'DN3', 'BR', 'TG', 'BL', 'TV', 'VL', 'AG', 'KG', 'CM', 'BT2', 'ST', 'HG', 'CT', 'DT', 'LA', 'TN', 'BP');

-- Thêm foreign key constraint cho provinces.region_id
ALTER TABLE provinces ADD CONSTRAINT fk_provinces_region_id 
FOREIGN KEY (region_id) REFERENCES regions(id) ON DELETE SET NULL;

-- Thêm comment cho bảng
COMMENT ON TABLE regions IS 'Bảng lưu trữ các khu vực địa lý của Việt Nam';
COMMENT ON COLUMN regions.code IS 'Mã khu vực (NORTH, CENTRAL, SOUTH)';
COMMENT ON COLUMN regions.name IS 'Tên khu vực';
COMMENT ON COLUMN regions.description IS 'Mô tả khu vực (optional)';
COMMENT ON COLUMN regions.is_active IS 'Trạng thái hoạt động của khu vực';
