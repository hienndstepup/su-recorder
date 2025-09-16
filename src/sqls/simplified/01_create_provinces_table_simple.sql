-- Tạo bảng provinces đơn giản 
-- Chỉ lưu thông tin cơ bản, bỏ các ràng buộc phức tạp

CREATE TABLE IF NOT EXISTS provinces (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code VARCHAR(10) UNIQUE NOT NULL, -- Mã tỉnh thành (ví dụ: HN, HCM, DN)
  name VARCHAR(100) NOT NULL, -- Tên tỉnh thành
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tạo index cơ bản
CREATE INDEX IF NOT EXISTS idx_provinces_code ON provinces(code);
CREATE INDEX IF NOT EXISTS idx_provinces_active ON provinces(is_active);

-- Tạo function update timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Tạo trigger
CREATE TRIGGER update_provinces_updated_at 
    BEFORE UPDATE ON provinces 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Chèn dữ liệu 63 tỉnh thành Việt Nam (đầy đủ)
INSERT INTO provinces (code, name, is_active) VALUES
-- Hà Nội và các thành phố trực thuộc TW
('HN', 'Hà Nội', true),
('HCM', 'Thành phố Hồ Chí Minh', true),
('DN', 'Đà Nẵng', true),
('HP', 'Hải Phòng', true),
('CT', 'Cần Thơ', true),

-- Miền Bắc
('HG', 'Hà Giang', true),
('CB', 'Cao Bằng', true),
('BK', 'Bắc Kạn', true),
('TQ', 'Tuyên Quang', true),
('LC', 'Lào Cai', true),
('DB', 'Điện Biên', true),
('LC2', 'Lai Châu', true),
('SL', 'Sơn La', true),
('YB', 'Yên Bái', true),
('HB', 'Hòa Bình', true),
('TN', 'Thái Nguyên', true),
('LG', 'Lạng Sơn', true),
('QN', 'Quảng Ninh', true),
('BG', 'Bắc Giang', true),
('PH', 'Phú Thọ', true),
('VT', 'Vĩnh Phúc', true),
('BN', 'Bắc Ninh', true),
('HD', 'Hải Dương', true),
('HY', 'Hưng Yên', true),
('TB', 'Thái Bình', true),
('HN2', 'Hà Nam', true),
('ND', 'Nam Định', true),
('NB', 'Ninh Bình', true),

-- Miền Trung
('TH', 'Thanh Hóa', true),
('NA', 'Nghệ An', true),
('HT', 'Hà Tĩnh', true),
('QB', 'Quảng Bình', true),
('QT', 'Quảng Trị', true),
('TT', 'Thừa Thiên Huế', true),
('QN2', 'Quảng Nam', true),
('QN3', 'Quảng Ngãi', true),
('BD', 'Bình Định', true),
('PY', 'Phú Yên', true),
('KH', 'Khánh Hòa', true),
('NT', 'Ninh Thuận', true),
('BT', 'Bình Thuận', true),
('KT', 'Kon Tum', true),
('GL', 'Gia Lai', true),
('DL', 'Đắk Lắk', true),
('DN2', 'Đắk Nông', true),
('LD', 'Lâm Đồng', true),

-- Miền Nam
('BD2', 'Bình Dương', true),
('BT2', 'Bình Phước', true),
('TN2', 'Tây Ninh', true),
('LA', 'Long An', true),
('TG', 'Tiền Giang', true),
('BT3', 'Bến Tre', true),
('TV', 'Trà Vinh', true),
('VL', 'Vĩnh Long', true),
('DT', 'Đồng Tháp', true),
('AG', 'An Giang', true),
('KG', 'Kiên Giang', true),
('CM', 'Cà Mau', true),
('BL', 'Bạc Liêu', true),
('ST', 'Sóc Trăng', true),
('HG2', 'Hậu Giang', true),
('DN3', 'Đồng Nai', true),
('BR', 'Bà Rịa - Vũng Tàu', true);

-- Thêm comment
COMMENT ON TABLE provinces IS 'Bảng lưu trữ tỉnh thành Việt Nam - phiên bản đơn giản';
COMMENT ON COLUMN provinces.code IS 'Mã tỉnh thành';
COMMENT ON COLUMN provinces.name IS 'Tên tỉnh thành';
COMMENT ON COLUMN provinces.is_active IS 'Trạng thái hoạt động';
