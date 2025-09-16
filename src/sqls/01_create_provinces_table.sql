-- Tạo bảng provinces với 34 tỉnh thành mới sau sáp nhập
-- Dựa trên danh sách tỉnh thành Việt Nam hiện tại

CREATE TABLE IF NOT EXISTS provinces (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code VARCHAR(10) UNIQUE NOT NULL, -- Mã tỉnh thành (ví dụ: HN, HCM, DN)
  name VARCHAR(100) NOT NULL, -- Tên tỉnh thành
  region_id UUID, -- ID khu vực (sẽ tạo bảng regions sau)
  is_active BOOLEAN DEFAULT true, -- Trạng thái hoạt động
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tạo index cho các trường thường được query
CREATE INDEX IF NOT EXISTS idx_provinces_code ON provinces(code);
CREATE INDEX IF NOT EXISTS idx_provinces_region_id ON provinces(region_id);
CREATE INDEX IF NOT EXISTS idx_provinces_active ON provinces(is_active);
CREATE INDEX IF NOT EXISTS idx_provinces_name ON provinces(name);

-- Tạo trigger để tự động cập nhật updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_provinces_updated_at 
    BEFORE UPDATE ON provinces 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Chèn dữ liệu 34 tỉnh thành mới sau sáp nhập
INSERT INTO provinces (code, name, region_id, is_active) VALUES
-- Miền Bắc (sẽ cập nhật region_id sau khi tạo bảng regions)
('HN', 'Hà Nội', NULL, true),
('HP', 'Hải Phòng', NULL, true),
('QN', 'Quảng Ninh', NULL, true),
('TB', 'Thái Bình', NULL, true),
('ND', 'Nam Định', NULL, true),
('NB', 'Ninh Bình', NULL, true),
('HD', 'Hải Dương', NULL, true),
('HY', 'Hưng Yên', NULL, true),
('BN', 'Bắc Ninh', NULL, true),
('BG', 'Bắc Giang', NULL, true),
('LC', 'Lào Cai', NULL, true),
('YB', 'Yên Bái', NULL, true),
('TB2', 'Tuyên Quang', NULL, true),
('TH', 'Thái Nguyên', NULL, true),
('CB', 'Cao Bằng', NULL, true),
('BK', 'Bắc Kạn', NULL, true),
('LG', 'Lạng Sơn', NULL, true),
('QB', 'Quảng Bình', NULL, true),
('HGI', 'Hà Giang', NULL, true),
('DB', 'Điện Biên', NULL, true),
('LB', 'Lai Châu', NULL, true),
('SL', 'Sơn La', NULL, true),
('HB', 'Hòa Bình', NULL, true),

-- Miền Trung
('TH2', 'Thanh Hóa', NULL, true),
('NA', 'Nghệ An', NULL, true),
('HT', 'Hà Tĩnh', NULL, true),
('QB2', 'Quảng Bình', NULL, true),
('QT', 'Quảng Trị', NULL, true),
('TT', 'Thừa Thiên Huế', NULL, true),
('DN', 'Đà Nẵng', NULL, true),
('QN2', 'Quảng Nam', NULL, true),
('QN3', 'Quảng Ngãi', NULL, true),
('BD', 'Bình Định', NULL, true),
('PY', 'Phú Yên', NULL, true),
('KH', 'Khánh Hòa', NULL, true),
('NT', 'Ninh Thuận', NULL, true),
('BT', 'Bình Thuận', NULL, true),
('KT', 'Kon Tum', NULL, true),
('GL', 'Gia Lai', NULL, true),
('DL', 'Đắk Lắk', NULL, true),
('DN2', 'Đắk Nông', NULL, true),
('LD', 'Lâm Đồng', NULL, true),

-- Miền Nam
('HCM', 'Thành phố Hồ Chí Minh', NULL, true),
('BD2', 'Bình Dương', NULL, true),
('DN3', 'Đồng Nai', NULL, true),
('BR', 'Bà Rịa - Vũng Tàu', NULL, true),
('TG', 'Tiền Giang', NULL, true),
('BL', 'Bến Tre', NULL, true),
('TV', 'Trà Vinh', NULL, true),
('VL', 'Vĩnh Long', NULL, true),
('AG', 'An Giang', NULL, true),
('KG', 'Kiên Giang', NULL, true),
('CM', 'Cà Mau', NULL, true),
('BT2', 'Bạc Liêu', NULL, true),
('ST', 'Sóc Trăng', NULL, true),
('HG', 'Hậu Giang', NULL, true),
('CT', 'Cần Thơ', NULL, true),
('DT', 'Đồng Tháp', NULL, true),
('LA', 'Long An', NULL, true),
('TN', 'Tây Ninh', NULL, true),
('BP', 'Bình Phước', NULL, true);

-- Thêm comment cho bảng
COMMENT ON TABLE provinces IS 'Bảng lưu trữ 34 tỉnh thành mới sau sáp nhập';
COMMENT ON COLUMN provinces.code IS 'Mã tỉnh thành (ví dụ: HN, HCM, DN)';
COMMENT ON COLUMN provinces.name IS 'Tên tỉnh thành';
COMMENT ON COLUMN provinces.region_id IS 'ID khu vực (sẽ cập nhật sau khi tạo bảng regions)';
COMMENT ON COLUMN provinces.is_active IS 'Trạng thái hoạt động của tỉnh thành';
