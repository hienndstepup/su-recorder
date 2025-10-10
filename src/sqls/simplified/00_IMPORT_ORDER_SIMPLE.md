# Hướng dẫn Import SQL - Phiên bản Đơn giản

## 🎯 Mục tiêu
Tạo hệ thống database đơn giản với:
- **Admin**: Có thể xem tất cả profiles và recordings
- **CTV**: Chỉ xem được profiles và recordings của chính mình + những người mình giới thiệu
- **Affiliate System**: Mỗi user có 1 mã affiliate code duy nhất
- **Referral System**: CTV có thể tự đăng ký (không có referrer) hoặc được giới thiệu

## ✅ Thứ tự import bắt buộc

### 1. `01_create_provinces_table_simple.sql`
- Tạo bảng `provinces` với 63 tỉnh thành Việt Nam
- Tạo function `update_updated_at_column()`
- Không có dependencies

### 2. `02_create_regions_table_simple.sql`
- Tạo bảng `regions` với 3 miền (Bắc, Trung, Nam)
- Không liên kết với provinces (đơn giản hóa)
- Sử dụng function từ file 01

### 3. `03_create_questions_table_simple.sql`
- Tạo bảng `questions` với các trường optional
- Sử dụng function từ file 01
- Không có dependencies phức tạp

### 4. `04_create_profiles_table_simple.sql`
- Tạo bảng `profiles` với affiliate system
- Tạo function `generate_simple_affiliate_code()`
- Tạo function `handle_new_user_simple()`
- Tạo trigger auto-create profile
- Thiết lập RLS cơ bản

### 5. `05_create_recordings_table_simple.sql`
- Tạo bảng `recordings` liên kết với profiles, questions, provinces
- Tạo function `update_user_stats_simple()`
- Tạo trigger auto-update stats
- Thiết lập RLS cơ bản

### 6. `06_setup_rls_policies_simple.sql`
- Hoàn thiện RLS policies cho tất cả bảng
- Tạo helper functions: `is_admin()`, `can_view_profile()`, `get_my_referrals()`, `get_viewable_recordings()`
- Verification queries

### 7. `07_create_settings_table_simple.sql`
- Tạo bảng `settings` để quản lý cài đặt hệ thống
- Tạo functions: `get_setting()`, `update_setting()`, `is_maintenance_mode()`
- Thiết lập RLS policies (chỉ admin có thể truy cập)
- Thêm dữ liệu mẫu bao gồm `maintenance_mode`
- **Bật Realtime** với triggers và pg_notify
- Tạo functions: `broadcast_setting_change()`, `get_all_settings()`, `check_maintenance_status()`

## 🚀 Cách thực hiện

### Trong Supabase Dashboard:
1. Vào **SQL Editor**
2. Chạy từng file theo thứ tự từ 01 đến 07
3. Kiểm tra kết quả sau mỗi file

### Commands để copy:
```bash
# Nếu muốn reset database:
DROP TABLE IF EXISTS recordings CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS questions CASCADE;
DROP TABLE IF EXISTS regions CASCADE;
DROP TABLE IF EXISTS provinces CASCADE;

# Sau đó import theo thứ tự 01 -> 07
```

## ✅ Kiểm tra sau khi import

```sql
-- 1. Kiểm tra các bảng đã được tạo
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- 2. Kiểm tra RLS đã được bật
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- 3. Kiểm tra functions
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' 
ORDER BY routine_name;

-- 4. Kiểm tra dữ liệu
SELECT 'Provinces:' as info, COUNT(*) as count FROM provinces
UNION ALL
SELECT 'Regions:' as info, COUNT(*) as count FROM regions;
```

## 📋 Tính năng chính

### Admin có thể:
- Xem tất cả profiles
- Xem tất cả recordings  
- Tạo/sửa/xóa regions, provinces, questions
- Quản lý tất cả users

### CTV có thể:
- Xem profile của chính mình
- Xem profiles của những người mình giới thiệu
- Xem recordings của chính mình và của những người mình giới thiệu
- Tạo recordings cho chính mình

### Affiliate System:
- Mỗi user có 1 `affiliate_code` duy nhất (8 ký tự: CTV + 5 số)
- User có thể tự đăng ký (không có `referrer_id`)
- User có thể được giới thiệu (có `referrer_id`)
- Auto-update thống kê khi có recordings mới

## ⚠️ Lưu ý quan trọng

1. **Phải chạy đúng thứ tự** từ 01 đến 07
2. **Không skip** bất kỳ file nào
3. **Kiểm tra lỗi** sau mỗi file trước khi chạy file tiếp theo
4. **Backup database** trước khi chạy nếu đã có dữ liệu
5. **Test đăng ký user** sau khi import xong

## 🔗 Dependencies

```
01 (provinces) 
├── 02 (regions) - sử dụng update_updated_at_column()
├── 03 (questions) - sử dụng update_updated_at_column()
└── 04 (profiles) - reference provinces, sử dụng update_updated_at_column()
    └── 05 (recordings) - reference profiles, questions, provinces
        └── 06 (RLS policies) - sử dụng tất cả bảng
            └── 07 (settings) - sử dụng is_admin() từ RLS policies
```

## 🎉 Kết quả mong đợi

Sau khi import xong, bạn sẽ có:
- ✅ Database schema đơn giản, ít lỗi
- ✅ Affiliate system hoạt động
- ✅ RLS policies bảo mật đúng
- ✅ Auto-trigger tạo profile và update stats
- ✅ Helper functions để query dữ liệu
- ✅ 63 tỉnh thành và 3 miền sẵn sàng sử dụng
- ✅ Settings table để quản lý trạng thái bảo trì
- ✅ Realtime updates cho settings (tự động cập nhật UI)
