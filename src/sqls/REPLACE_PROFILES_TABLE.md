# Hướng dẫn thay thế bảng profiles để sửa lỗi tạo user

## 🔍 Vấn đề đã phát hiện:

1. **RLS Policy chưa được thiết lập đúng** khi tạo bảng profiles
2. **Trigger handle_new_user()** không có error handling tốt
3. **Function generate_affiliate_code()** có thể gây lỗi vòng lặp vô hạn
4. **Thiếu policies cho INSERT operations** ngay từ đầu

## ✅ Giải pháp:

File `04_create_profiles_table_fixed.sql` đã sửa tất cả các vấn đề trên:

- ✅ Thiết lập RLS policies ngay sau khi tạo bảng
- ✅ Cải thiện error handling trong functions  
- ✅ Thêm retry logic cho affiliate code generation
- ✅ Tối ưu RLS policy cho INSERT operations
- ✅ Thêm verification queries để kiểm tra

## 🔧 Cách thay thế:

### Phương án 1: Xóa và tạo lại (KHUYẾN NGHỊ)

```sql
-- 1. Xóa bảng profiles cũ (trong Supabase SQL Editor)
DROP TABLE IF EXISTS profiles CASCADE;

-- 2. Chạy toàn bộ file 04_create_profiles_table_fixed.sql
-- (Copy paste toàn bộ nội dung file vào SQL Editor và chạy)
```

### Phương án 2: Chỉ sửa functions và policies

```sql
-- 1. Chạy file 09_fix_user_creation_rls_policy.sql
-- (File này đã được tạo trước đó)

-- 2. Hoặc chạy từng phần trong file 04_create_profiles_table_fixed.sql
-- (Chỉ phần functions và policies)
```

## 📋 Sau khi thay thế:

1. **Kiểm tra verification queries** ở cuối file
2. **Test đăng ký user mới** từ frontend
3. **Kiểm tra logs** trong Supabase Dashboard > Logs
4. **Xác nhận** profile được tạo tự động

## 🎯 Kết quả mong đợi:

- ✅ Đăng ký user mới không còn lỗi
- ✅ Profile được tạo tự động với affiliate_code
- ✅ Referrer system hoạt động đúng
- ✅ RLS policies bảo mật dữ liệu

## 📁 Files liên quan:

- `04_create_profiles_table.sql` ← File gốc (có lỗi)
- `04_create_profiles_table_fixed.sql` ← File đã sửa (dùng file này)
- `09_fix_user_creation_rls_policy.sql` ← Backup solution
