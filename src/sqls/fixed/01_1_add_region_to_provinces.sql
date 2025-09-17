-- Add region column to provinces table
ALTER TABLE provinces ADD COLUMN IF NOT EXISTS region VARCHAR(10);

-- Update region for Northern provinces
UPDATE provinces SET region = 'NORTH' WHERE code IN (
  'HN', 'HP', 'HG', 'CB', 'BK', 'TQ', 'LC', 'DB', 'LC2', 'SL', 'YB', 'HB',
  'TN', 'LG', 'QN', 'BG', 'PH', 'VT', 'BN', 'HD', 'HY', 'TB', 'HN2', 'ND', 'NB'
);

-- Update region for Central provinces
UPDATE provinces SET region = 'CENTRAL' WHERE code IN (
  'DN', 'TH', 'NA', 'HT', 'QB', 'QT', 'TT', 'QN2', 'QN3', 'BD', 'PY', 'KH',
  'NT', 'BT', 'KT', 'GL', 'DL', 'DN2', 'LD'
);

-- Update region for Southern provinces
UPDATE provinces SET region = 'SOUTH' WHERE code IN (
  'HCM', 'CT', 'BD2', 'BT2', 'TN2', 'LA', 'TG', 'BT3', 'TV', 'VL', 'DT',
  'AG', 'KG', 'CM', 'BL', 'ST', 'HG2', 'DN3', 'BR'
);

-- Add index for faster filtering
CREATE INDEX IF NOT EXISTS idx_provinces_region ON provinces(region);

-- Add comment for new column
COMMENT ON COLUMN provinces.region IS 'Mã khu vực (NORTH, CENTRAL, SOUTH) - không ràng buộc với bảng regions';
