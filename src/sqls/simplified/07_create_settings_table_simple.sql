-- =============================================
-- Tạo bảng settings để quản lý trạng thái hệ thống
-- =============================================

-- Tạo bảng settings
CREATE TABLE IF NOT EXISTS settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key VARCHAR(100) NOT NULL UNIQUE,
    value TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tạo trigger để tự động cập nhật updated_at
CREATE TRIGGER update_settings_updated_at
    BEFORE UPDATE ON settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Tạo index cho key để tìm kiếm nhanh
CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(key);

-- Thêm dữ liệu mẫu
INSERT INTO settings (key, value, description) VALUES 
    ('maintenance_mode', 'false', 'Trạng thái bảo trì hệ thống (true/false)'),
    ('maintenance_message', 'Hệ thống đang được bảo trì để cải thiện dịch vụ. Vui lòng quay lại sau.', 'Thông báo bảo trì hiển thị cho người dùng'),
    ('maintenance_estimated_time', 'Chúng tôi sẽ hoàn tất trong thời gian sớm nhất có thể.', 'Thời gian dự kiến hoàn thành bảo trì'),
    ('site_title', 'SU Recorder', 'Tiêu đề trang web'),
    ('site_description', 'Hệ thống ghi âm và quản lý', 'Mô tả trang web')
ON CONFLICT (key) DO NOTHING;

-- Thiết lập RLS (Row Level Security)
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Policy: Chỉ admin có thể xem và chỉnh sửa settings
CREATE POLICY "Admin can view settings" ON settings
    FOR SELECT USING (is_admin());

CREATE POLICY "Admin can update settings" ON settings
    FOR UPDATE USING (is_admin());

CREATE POLICY "Admin can insert settings" ON settings
    FOR INSERT WITH CHECK (is_admin());

-- Tạo function để lấy giá trị setting
CREATE OR REPLACE FUNCTION get_setting(setting_key TEXT)
RETURNS TEXT AS $$
DECLARE
    setting_value TEXT;
BEGIN
    SELECT value INTO setting_value 
    FROM settings 
    WHERE key = setting_key;
    
    RETURN COALESCE(setting_value, '');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Tạo function để cập nhật giá trị setting
CREATE OR REPLACE FUNCTION update_setting(setting_key TEXT, setting_value TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    -- Kiểm tra quyền admin
    IF NOT is_admin() THEN
        RETURN FALSE;
    END IF;
    
    -- Cập nhật hoặc tạo mới setting
    INSERT INTO settings (key, value) 
    VALUES (setting_key, setting_value)
    ON CONFLICT (key) 
    DO UPDATE SET 
        value = EXCLUDED.value,
        updated_at = NOW();
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Tạo function để kiểm tra trạng thái bảo trì
CREATE OR REPLACE FUNCTION is_maintenance_mode()
RETURNS BOOLEAN AS $$
DECLARE
    maintenance_value TEXT;
BEGIN
    SELECT value INTO maintenance_value 
    FROM settings 
    WHERE key = 'maintenance_mode';
    
    RETURN COALESCE(maintenance_value, 'false') = 'true';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comment cho bảng và các function
COMMENT ON TABLE settings IS 'Bảng lưu trữ các cài đặt hệ thống';
COMMENT ON COLUMN settings.key IS 'Khóa cài đặt (duy nhất)';
COMMENT ON COLUMN settings.value IS 'Giá trị cài đặt';
COMMENT ON COLUMN settings.description IS 'Mô tả cài đặt';

COMMENT ON FUNCTION get_setting(TEXT) IS 'Lấy giá trị của một setting theo key';
COMMENT ON FUNCTION update_setting(TEXT, TEXT) IS 'Cập nhật giá trị của một setting (chỉ admin)';
COMMENT ON FUNCTION is_maintenance_mode() IS 'Kiểm tra trạng thái bảo trì hệ thống';

-- =============================================
-- Thiết lập Realtime cho bảng settings
-- =============================================

-- Bật Realtime cho bảng settings
ALTER PUBLICATION supabase_realtime ADD TABLE settings;

-- Tạo function để broadcast thay đổi settings
CREATE OR REPLACE FUNCTION broadcast_setting_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Broadcast thay đổi đến tất cả clients
    PERFORM pg_notify(
        'settings_changed',
        json_build_object(
            'key', NEW.key,
            'value', NEW.value,
            'old_value', OLD.value,
            'timestamp', NOW()
        )::text
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Tạo trigger để broadcast khi có thay đổi
CREATE TRIGGER settings_change_broadcast
    AFTER UPDATE ON settings
    FOR EACH ROW
    EXECUTE FUNCTION broadcast_setting_change();

-- Tạo function để lấy tất cả settings (cho realtime subscription)
CREATE OR REPLACE FUNCTION get_all_settings()
RETURNS TABLE(key TEXT, value TEXT, description TEXT) AS $$
BEGIN
    RETURN QUERY
    SELECT s.key, s.value, s.description
    FROM settings s
    ORDER BY s.key;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Tạo function để kiểm tra và broadcast maintenance mode
CREATE OR REPLACE FUNCTION check_maintenance_status()
RETURNS TABLE(is_maintenance BOOLEAN, message TEXT) AS $$
DECLARE
    maintenance_value TEXT;
    is_maintenance BOOLEAN;
BEGIN
    SELECT value INTO maintenance_value 
    FROM settings 
    WHERE key = 'maintenance_mode';
    
    is_maintenance := COALESCE(maintenance_value, 'false') = 'true';
    
    RETURN QUERY
    SELECT 
        is_maintenance,
        CASE 
            WHEN is_maintenance THEN 'Hệ thống đang bảo trì'
            ELSE 'Hệ thống hoạt động bình thường'
        END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comment cho các function mới
COMMENT ON FUNCTION broadcast_setting_change() IS 'Broadcast thay đổi settings đến tất cả clients qua pg_notify';
COMMENT ON FUNCTION get_all_settings() IS 'Lấy tất cả settings để subscribe realtime';
COMMENT ON FUNCTION check_maintenance_status() IS 'Kiểm tra trạng thái bảo trì và trả về message';

-- Kiểm tra kết quả
DO $$
BEGIN
    RAISE NOTICE '✅ Bảng settings đã được tạo thành công!';
    RAISE NOTICE '📋 Các function đã được tạo: get_setting(), update_setting(), is_maintenance_mode()';
    RAISE NOTICE '🔒 RLS policies đã được thiết lập (chỉ admin có thể truy cập)';
    RAISE NOTICE '📊 Dữ liệu mẫu đã được thêm vào';
    RAISE NOTICE '🔄 Realtime đã được bật cho bảng settings';
    RAISE NOTICE '📡 Trigger broadcast_setting_change() đã được tạo';
    RAISE NOTICE '📡 Function get_all_settings() đã được tạo cho subscription';
    RAISE NOTICE '📡 Function check_maintenance_status() đã được tạo';
END $$;
