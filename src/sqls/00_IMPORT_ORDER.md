# Thứ tự Import SQL Files

## ✅ Thứ tự import đúng để tránh lỗi dependency:

### 1. `01_create_provinces_table.sql`
- Tạo bảng `provinces` với 34 tỉnh thành
- Tạo function `update_updated_at_column()`
- Tạo trigger cho provinces

### 2. `02_create_regions_table.sql`
- Tạo bảng `regions` với 3 khu vực
- Cập nhật `region_id` cho provinces
- Tạo foreign key constraint

### 3. `03_create_questions_table.sql`
- Tạo bảng `questions` với các câu hỏi
- Sử dụng function `update_updated_at_column()` đã tạo
- Tạo trigger cho questions

### 4. `04_create_profiles_table.sql`
- Tạo bảng `profiles` liên kết với `auth.users`
- Tạo function `generate_affiliate_code()`
- Tạo function `handle_new_user()`
- Tạo trigger tự động tạo profile khi user đăng ký
- **KHÔNG** tạo function `update_user_recording_stats()` (sẽ tạo ở file 05)

### 5. `05_create_recordings_table.sql`
- Tạo bảng `recordings` liên kết với profiles, questions, regions, provinces
- Tạo function `update_user_recording_stats()`
- Tạo trigger cập nhật thống kê user
- Sử dụng function `update_updated_at_column()` đã tạo

### 6. `06_setup_rls_policies.sql`
- Thiết lập Row Level Security cho tất cả bảng
- Tạo function `is_admin()`
- Tạo function `current_user_id()`
- Tạo function `can_view_profile()`
- Tạo function `get_direct_referrals()`
- Tạo các policies cho từng bảng

### 7. `07_create_additional_indexes.sql`
- Tạo các indexes bổ sung cho hiệu suất
- Full-text search indexes
- Composite indexes
- Partial indexes

### 8. `08_insert_sample_data.sql`
- Chèn dữ liệu mẫu cho regions, provinces, questions
- Dữ liệu test cho development

## ⚠️ Lưu ý quan trọng:

1. **KHÔNG** chạy file `08_insert_sample_data.sql` trong production
2. **KHÔNG** chạy các file SQL theo thứ tự ngẫu nhiên
3. **PHẢI** chạy theo đúng thứ tự từ 01 đến 08
4. Nếu gặp lỗi, kiểm tra xem đã chạy đủ các file trước đó chưa

## 🔧 Cách chạy:

```sql
-- Trong Supabase Dashboard > SQL Editor, chạy từng file theo thứ tự:

-- 1. Chạy file 01_create_provinces_table.sql
-- 2. Chạy file 02_create_regions_table.sql  
-- 3. Chạy file 03_create_questions_table.sql
-- 4. Chạy file 04_create_profiles_table.sql
-- 5. Chạy file 05_create_recordings_table.sql
-- 6. Chạy file 06_setup_rls_policies.sql
-- 7. Chạy file 07_create_additional_indexes.sql
-- 8. Chạy file 08_insert_sample_data.sql (chỉ cho development)
```

## ✅ Kiểm tra sau khi import:

```sql
-- Kiểm tra các bảng đã được tạo
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Kiểm tra các function đã được tạo
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' 
ORDER BY routine_name;

-- Kiểm tra dữ liệu mẫu
SELECT 'Regions:' as info, COUNT(*) as count FROM regions
UNION ALL
SELECT 'Provinces:' as info, COUNT(*) as count FROM provinces
UNION ALL
SELECT 'Questions:' as info, COUNT(*) as count FROM questions;
```
