# SU Recorder Database Schema

Hướng dẫn thiết lập và sử dụng cơ sở dữ liệu cho ứng dụng SU Recorder.

## 📋 Tổng quan

SU Recorder là một ứng dụng ghi âm cho phép cộng tác viên (CTV) ghi âm câu trả lời cho các câu hỏi. Hệ thống sử dụng Supabase làm backend với PostgreSQL.

## 🗂️ Cấu trúc Database

### Bảng chính

1. **regions** - Lưu trữ các khu vực địa lý (3 miền)
2. **provinces** - Lưu trữ 34 tỉnh thành mới sau sáp nhập
3. **questions** - Lưu trữ các câu hỏi
4. **profiles** - Thông tin bổ sung của user
5. **recordings** - Kết quả ghi âm của CTV

## 📁 Các file SQL

### 1. `01_create_provinces_table.sql`
- Tạo bảng `provinces` với 34 tỉnh thành mới sau sáp nhập
- Các trường chính:
  - `code` (VARCHAR(10)) - Mã tỉnh thành
  - `name` (VARCHAR(100)) - Tên tỉnh thành
  - `region_id` (UUID, optional) - ID khu vực
  - `is_active` (BOOLEAN) - Trạng thái hoạt động
- Tạo indexes và triggers

### 2. `02_create_regions_table.sql`
- Tạo bảng `regions` cho 3 khu vực chính
- Các trường chính:
  - `code` (VARCHAR(10)) - Mã khu vực (NORTH, CENTRAL, SOUTH)
  - `name` (VARCHAR(50)) - Tên khu vực
  - `description` (TEXT, optional) - Mô tả khu vực
- Cập nhật region_id cho provinces

### 3. `03_create_questions_table.sql`
- Tạo bảng `questions` với các trường:
  - `text` (TEXT, optional) - Nội dung câu hỏi
  - `type` (VARCHAR(50), optional) - Loại câu hỏi
  - `audio` (TEXT, optional) - URL file audio
  - `hint` (TEXT, optional) - Gợi ý
- Tạo indexes và triggers

### 4. `04_create_profiles_table.sql`
- Tạo bảng `profiles` liên kết với `auth.users`
- Các trường chính:
  - `full_name`, `avatar_url`, `phone` (optional)
  - `province_id` (UUID, optional) - ID tỉnh thành
  - `role`, `status`
  - `affiliate_code` (VARCHAR(50), NOT NULL) - Mã affiliate bắt buộc
  - `referrer_id` (UUID, optional) - ID người giới thiệu
  - `total_completed_recordings`, `total_completed_sessions`, `total_seconds_recording`
- Tự động tạo profile và affiliate_code khi user đăng ký
- Hỗ trợ hệ thống affiliate với mã giới thiệu

### 5. `05_create_recordings_table.sql`
- Tạo bảng `recordings` lưu kết quả ghi âm
- Các trường chính:
  - `user_id`, `question_id`
  - `region_id`, `province_id` (optional)
  - `audio_url`, `audio_duration` (optional)
  - `audio_script` (optional)
- Tự động cập nhật thống kê user

### 6. `06_setup_rls_policies.sql`
- Thiết lập Row Level Security (RLS)
- Policies cho từng bảng:
  - User chỉ xem/sửa dữ liệu của mình
  - Admin có quyền truy cập tất cả
- Helper functions: `is_admin()`, `current_user_id()`

### 7. `07_create_additional_indexes.sql`
- Tạo indexes bổ sung cho hiệu suất
- Full-text search indexes
- Composite indexes cho queries phức tạp
- Partial indexes cho filters thường dùng

### 8. `08_insert_sample_data.sql`
- Chèn 30 câu hỏi mẫu đa dạng
- Dữ liệu test cho development
- Không nên chạy trong production

## 🚀 Cách thiết lập

### Bước 1: Tạo Supabase Project
1. Truy cập [supabase.com](https://supabase.com)
2. Tạo project mới
3. Lấy URL và API key

### Bước 2: Cấu hình Environment
Tạo file `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Bước 3: Chạy SQL Scripts
Trong Supabase Dashboard > SQL Editor, chạy theo thứ tự:

1. `01_create_provinces_table.sql`
2. `02_create_regions_table.sql`
3. `03_create_questions_table.sql`
4. `04_create_profiles_table.sql`
5. `05_create_recordings_table.sql`
6. `06_setup_rls_policies.sql`
7. `07_create_additional_indexes.sql`
8. `08_insert_sample_data.sql` (chỉ cho development)

## 🔐 Bảo mật

### Row Level Security (RLS)
- Tất cả bảng đều có RLS enabled
- User chỉ truy cập được dữ liệu của mình
- Admin có quyền truy cập tất cả

### Policies
- **Regions**: Tất cả user xem được, chỉ admin sửa/xóa
- **Provinces**: Tất cả user xem được, chỉ admin sửa/xóa
- **Questions**: Tất cả user xem được, chỉ admin sửa/xóa
- **Profiles**: 
  - User xem/sửa profile của mình
  - Admin xem tất cả profiles
  - CTV xem được profiles của CTV trực tiếp (do họ giới thiệu)
- **Recordings**: 
  - User xem/sửa recordings của mình
  - Admin xem tất cả recordings
  - CTV xem được recordings của CTV trực tiếp (do họ giới thiệu)

## 📊 Queries mẫu

### Lấy câu hỏi cho user
```sql
SELECT * FROM questions 
WHERE is_active = true 
ORDER BY created_at DESC;
```

### Lấy recordings của user
```sql
SELECT r.*, q.text as question_text, pr.name as province_name, reg.name as region_name
FROM recordings r
LEFT JOIN questions q ON r.question_id = q.id
LEFT JOIN provinces pr ON r.province_id = pr.id
LEFT JOIN regions reg ON r.region_id = reg.id
WHERE r.user_id = auth.uid()
ORDER BY r.created_at DESC;
```

### Thống kê user
```sql
SELECT 
  p.full_name,
  p.total_completed_recordings,
  p.total_completed_sessions,
  p.total_seconds_recording,
  pr.name as province_name,
  reg.name as region_name
FROM profiles p
LEFT JOIN provinces pr ON p.province_id = pr.id
LEFT JOIN regions reg ON pr.region_id = reg.id
WHERE p.id = auth.uid();
```

### Dashboard admin
```sql
SELECT 
  p.full_name,
  pr.name as province_name,
  reg.name as region_name,
  p.total_completed_recordings,
  p.total_completed_sessions,
  p.total_seconds_recording,
  p.last_active
FROM profiles p
LEFT JOIN provinces pr ON p.province_id = pr.id
LEFT JOIN regions reg ON pr.region_id = reg.id
WHERE p.role = 'ctv'
ORDER BY p.total_completed_recordings DESC;
```

### Thống kê theo khu vực
```sql
SELECT 
  reg.name as region_name,
  COUNT(DISTINCT p.id) as total_ctv,
  COUNT(r.id) as total_recordings,
  AVG(r.audio_duration) as avg_duration
FROM regions reg
LEFT JOIN provinces pr ON reg.id = pr.region_id
LEFT JOIN profiles p ON pr.id = p.province_id
LEFT JOIN recordings r ON p.id = r.user_id
GROUP BY reg.id, reg.name
ORDER BY total_recordings DESC;
```

### Hệ thống Affiliate
```sql
-- Lấy danh sách CTV trực tiếp của user
SELECT * FROM get_direct_referrals('user_id_here');

-- Kiểm tra quyền xem profile
SELECT can_view_profile('target_user_id_here');

-- Lấy thông tin affiliate của user
SELECT 
  p.full_name,
  p.affiliate_code,
  p.role,
  r.full_name as referrer_name,
  r.affiliate_code as referrer_code
FROM profiles p
LEFT JOIN profiles r ON p.referrer_id = r.id
WHERE p.id = 'user_id_here';

-- Thống kê affiliate của user
SELECT 
  p.full_name,
  p.affiliate_code,
  COUNT(dr.id) as direct_referrals_count,
  SUM(dr.total_completed_recordings) as total_referral_recordings
FROM profiles p
LEFT JOIN profiles dr ON dr.referrer_id = p.id
WHERE p.id = 'user_id_here'
GROUP BY p.id, p.full_name, p.affiliate_code;
```

## 🔧 Functions hữu ích

### `is_admin()`
Kiểm tra user hiện tại có phải admin không.

### `current_user_id()`
Lấy ID của user hiện tại.

### `update_user_recording_stats()`
Tự động cập nhật thống kê user khi có recording mới.

### `generate_affiliate_code()`
Tạo mã affiliate tự động với format USER + 6 số ngẫu nhiên.

### `can_view_profile(target_user_id UUID)`
Kiểm tra user hiện tại có thể xem profile của user khác không.

### `get_direct_referrals(user_id UUID)`
Lấy danh sách CTV trực tiếp của user (do họ giới thiệu).

## 📈 Performance

### Indexes được tối ưu cho:
- Full-text search trên text content
- Queries theo user_id và province_id
- Dashboard analytics
- Region/province queries

### Monitoring
- Sử dụng Supabase Dashboard để monitor performance
- Kiểm tra slow queries
- Optimize indexes khi cần

## 🐛 Troubleshooting

### Lỗi RLS
- Kiểm tra user đã đăng nhập chưa
- Kiểm tra policies có đúng không
- Test với admin user

### Lỗi Foreign Key
- Đảm bảo chạy scripts theo đúng thứ tự
- Kiểm tra data integrity

### Performance Issues
- Kiểm tra indexes
- Analyze query plans
- Optimize queries

## 📝 Notes

- Tất cả trường trong bảng `questions` đều optional như yêu cầu
- Hệ thống tự động cập nhật thống kê khi có dữ liệu mới
- RLS đảm bảo bảo mật dữ liệu
- Indexes được tối ưu cho các use cases phổ biến
- Không còn bảng `sessions` - đã được loại bỏ theo yêu cầu
- Bảng `recordings` đã được đơn giản hóa, bỏ các trường không cần thiết
- Thêm bảng `regions` và `provinces` để quản lý địa lý
- **Hệ thống Affiliate**: Tất cả user đều có `affiliate_code` bắt buộc
- **Quyền truy cập**: Admin xem tất cả, CTV chỉ xem được CTV trực tiếp
- **Mã giới thiệu**: User có thể đăng ký với mã giới thiệu của người khác

## 🔄 Updates

Khi cần cập nhật schema:
1. Tạo migration script mới
2. Test trên development environment
3. Backup production data
4. Apply migration
5. Verify data integrity
