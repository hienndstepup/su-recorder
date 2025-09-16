-- Script để xóa các policies trùng lặp trước khi chạy file RLS mới
-- Chạy script này trước khi chạy 06_setup_rls_policies_fixed.sql

-- ==============================================
-- KIỂM TRA CÁC POLICIES HIỆN TẠI
-- ==============================================

-- Xem tất cả policies hiện tại cho bảng profiles
SELECT 
  policyname,
  cmd,
  permissive,
  with_check
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;

-- ==============================================
-- XÓA CÁC POLICIES CŨ CHO PROFILES
-- ==============================================

-- Xóa tất cả policies cũ cho profiles để tạo lại
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Allow profile creation" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "CTVs can view their direct referrals" ON profiles;
DROP POLICY IF EXISTS "Temporary allow all for profiles setup" ON profiles;

-- ==============================================
-- XÓA CÁC POLICIES CŨ CHO CÁC BẢNG KHÁC (NẾU CÓ)
-- ==============================================

-- Regions
DROP POLICY IF EXISTS "Regions are viewable by authenticated users" ON regions;
DROP POLICY IF EXISTS "Only admins can insert regions" ON regions;
DROP POLICY IF EXISTS "Only admins can update regions" ON regions;
DROP POLICY IF EXISTS "Only admins can delete regions" ON regions;

-- Provinces  
DROP POLICY IF EXISTS "Provinces are viewable by authenticated users" ON provinces;
DROP POLICY IF EXISTS "Only admins can insert provinces" ON provinces;
DROP POLICY IF EXISTS "Only admins can update provinces" ON provinces;
DROP POLICY IF EXISTS "Only admins can delete provinces" ON provinces;

-- Questions
DROP POLICY IF EXISTS "Questions are viewable by authenticated users" ON questions;
DROP POLICY IF EXISTS "Only admins can insert questions" ON questions;
DROP POLICY IF EXISTS "Only admins can update questions" ON questions;
DROP POLICY IF EXISTS "Only admins can delete questions" ON questions;

-- Recordings
DROP POLICY IF EXISTS "Users can view own recordings" ON recordings;
DROP POLICY IF EXISTS "Users can insert own recordings" ON recordings;
DROP POLICY IF EXISTS "Users can update own recordings" ON recordings;
DROP POLICY IF EXISTS "Admins can view all recordings" ON recordings;
DROP POLICY IF EXISTS "Admins can update all recordings" ON recordings;
DROP POLICY IF EXISTS "Admins can delete recordings" ON recordings;
DROP POLICY IF EXISTS "CTVs can view their direct referrals recordings" ON recordings;

-- ==============================================
-- XÓA CÁC FUNCTIONS CŨ (NẾU CÓ)
-- ==============================================

DROP FUNCTION IF EXISTS is_admin();
DROP FUNCTION IF EXISTS current_user_id();
DROP FUNCTION IF EXISTS can_view_profile(UUID);
DROP FUNCTION IF EXISTS get_direct_referrals(UUID);

-- ==============================================
-- VERIFICATION - KIỂM TRA SAU KHI XÓA
-- ==============================================

-- Kiểm tra không còn policies nào
SELECT 
  'Profiles policies remaining:' as info,
  COUNT(*) as count
FROM pg_policies 
WHERE tablename = 'profiles';

-- Kiểm tra RLS vẫn được bật
SELECT 
  'RLS status:' as info,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename IN ('profiles', 'recordings', 'questions', 'regions', 'provinces')
  AND schemaname = 'public';

-- Kiểm tra functions đã được xóa
SELECT 
  'Helper functions remaining:' as info,
  COUNT(*) as count
FROM information_schema.routines 
WHERE routine_name IN ('is_admin', 'current_user_id', 'can_view_profile', 'get_direct_referrals');

/*
HƯỚNG DẪN SỬ DỤNG:

1. Chạy script này TRƯỚC khi chạy 06_setup_rls_policies_fixed.sql
2. Script này sẽ:
   - Xóa tất cả policies cũ
   - Xóa helper functions cũ  
   - Giữ nguyên RLS được bật
   - Verification queries

3. Sau khi chạy script này, chạy 06_setup_rls_policies_fixed.sql

THỨ TỰ CHẠY:
1. cleanup_duplicate_policies.sql (file này)
2. 06_setup_rls_policies_fixed.sql

LƯU Ý:
- Script này an toàn, chỉ xóa policies và functions
- Không ảnh hưởng đến dữ liệu
- RLS vẫn được bật cho các bảng
*/
