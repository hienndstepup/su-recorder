# Khắc phục lỗi "policy already exists" khi chạy RLS policies

## 🐛 Vấn đề:

Khi chạy file `06_setup_rls_policies.sql`, bạn gặp lỗi:
```
ERROR: 42710: policy "Users can view own profile" for table "profiles" already exists
```

**Nguyên nhân**: File `04_create_profiles_table_fixed.sql` đã tạo các RLS policies, nhưng file `06_setup_rls_policies.sql` cố gắng tạo lại chúng.

## ✅ Giải pháp:

### Phương án 1: Sử dụng files đã sửa (KHUYẾN NGHỊ)

1. **Cleanup policies cũ:**
   ```sql
   -- Chạy file cleanup_duplicate_policies.sql trong Supabase SQL Editor
   ```

2. **Chạy RLS policies mới:**
   ```sql
   -- Chạy file 06_setup_rls_policies_fixed.sql
   ```

### Phương án 2: Sửa thủ công

1. **Thêm `DROP POLICY IF EXISTS` vào đầu mỗi policy trong file gốc:**
   ```sql
   DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
   CREATE POLICY "Users can view own profile" ON profiles
     FOR SELECT USING (auth.uid() = id);
   ```

## 📋 Thứ tự thực hiện (Phương án 1):

### Bước 1: Cleanup
```sql
-- Chạy trong Supabase SQL Editor:
-- Copy paste toàn bộ nội dung file cleanup_duplicate_policies.sql
```

### Bước 2: Setup RLS mới  
```sql
-- Chạy trong Supabase SQL Editor:
-- Copy paste toàn bộ nội dung file 06_setup_rls_policies_fixed.sql
```

### Bước 3: Verification
```sql
-- Kiểm tra tất cả policies đã được tạo:
SELECT tablename, COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;
```

## 📁 Files đã tạo:

1. **`cleanup_duplicate_policies.sql`** ← Xóa policies cũ
2. **`06_setup_rls_policies_fixed.sql`** ← RLS policies mới (thay thế file gốc)
3. **`FIX_RLS_POLICIES_CONFLICT.md`** ← Hướng dẫn này

## 🎯 Kết quả mong đợi:

- ✅ Không còn lỗi "policy already exists"
- ✅ Tất cả bảng có RLS policies đúng
- ✅ Helper functions hoạt động
- ✅ Affiliate system và access control hoạt động đúng

## ⚠️ Lưu ý quan trọng:

- **KHÔNG chạy file `06_setup_rls_policies.sql` gốc nữa**
- **Dùng file `06_setup_rls_policies_fixed.sql` thay thế**
- **Chạy cleanup trước, setup sau**
- **Kiểm tra verification queries**

## 🔄 Thứ tự files mới:

1. `01_create_provinces_table.sql`
2. `02_create_regions_table.sql`  
3. `03_create_questions_table.sql`
4. `04_create_profiles_table_fixed.sql` ← File đã sửa
5. `05_create_recordings_table.sql`
6. `cleanup_duplicate_policies.sql` ← Chạy nếu có conflict
7. `06_setup_rls_policies_fixed.sql` ← File đã sửa (thay thế file gốc)
8. `07_create_additional_indexes.sql`
9. `08_insert_sample_data.sql`
