-- Regions
CREATE TABLE IF NOT EXISTS regions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code VARCHAR(10) UNIQUE NOT NULL,
  name VARCHAR(50) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_regions_code ON regions(code);
CREATE INDEX IF NOT EXISTS idx_regions_active ON regions(is_active);

CREATE TRIGGER update_regions_updated_at 
  BEFORE UPDATE ON regions 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

INSERT INTO regions (code, name, is_active) VALUES
('NORTH', 'Miền Bắc', true),
('CENTRAL', 'Miền Trung', true),
('SOUTH', 'Miền Nam', true);

COMMENT ON TABLE regions IS 'Bảng lưu trữ khu vực địa lý - FIXED';
