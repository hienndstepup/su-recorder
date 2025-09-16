# Hướng dẫn cấu hình Supabase cho SU Recorder

## Bước 1: Tạo tài khoản Supabase

1. Truy cập [https://supabase.com/](https://supabase.com/)
2. Đăng ký tài khoản hoặc đăng nhập
3. Tạo một project mới

## Bước 2: Lấy thông tin cấu hình

1. Trong dashboard Supabase, vào **Settings** > **API**
2. Copy các thông tin sau:
   - **Project URL** (ví dụ: `https://your-project-id.supabase.co`)
   - **anon public** key

## Bước 3: Cấu hình biến môi trường

1. Tạo file `.env.local` trong thư mục gốc của dự án
2. Thêm các biến sau:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Ví dụ:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTY0NjA3ODQwMCwiZXhwIjoxOTYxNjU0NDAwfQ.example
```

## Bước 4: Cấu hình Authentication

1. Trong Supabase dashboard, vào **Authentication** > **Settings**
2. Cấu hình các tùy chọn sau:

### Site URL
- Thêm URL của ứng dụng (ví dụ: `http://localhost:3000` cho development)

### Redirect URLs
- Thêm các URL redirect:
  - `http://localhost:3000/auth/callback` (cho development)
  - `https://yourdomain.com/auth/callback` (cho production)

### Email Settings
- Cấu hình email templates nếu cần
- Bật email confirmation nếu muốn yêu cầu xác thực email

## Bước 5: Cấu hình Database (Tùy chọn)

Nếu bạn muốn lưu thêm thông tin user, có thể tạo bảng profiles:

```sql
-- Tạo bảng profiles để lưu thông tin bổ sung của user
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tạo RLS policy
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy cho phép user xem và cập nhật profile của chính họ
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);
```

## Bước 6: Test ứng dụng

1. Khởi động ứng dụng: `npm run dev`
2. Truy cập `http://localhost:3000`
3. Thử đăng ký tài khoản mới
4. Thử đăng nhập
5. Kiểm tra trang `/record` có yêu cầu đăng nhập không

## Tính năng đã được tích hợp

✅ **Đăng ký tài khoản** - Người dùng có thể tạo tài khoản mới
✅ **Đăng nhập** - Xác thực người dùng với email/password
✅ **Đăng xuất** - Thoát khỏi phiên đăng nhập
✅ **Bảo vệ route** - Trang `/record` chỉ accessible khi đã đăng nhập
✅ **Quản lý session** - Tự động duy trì phiên đăng nhập
✅ **Redirect tự động** - Chuyển hướng sau khi đăng nhập/đăng xuất
✅ **Hiển thị thông tin user** - Hiển thị tên/email người dùng đã đăng nhập

## Lưu ý quan trọng

- **Không commit file `.env.local`** vào git
- **Sử dụng HTTPS** trong production
- **Cấu hình CORS** nếu cần thiết
- **Backup database** định kỳ
- **Monitor usage** để tránh vượt quá giới hạn free tier

## Troubleshooting

### Lỗi "Missing Supabase environment variables"
- Kiểm tra file `.env.local` có tồn tại không
- Kiểm tra tên biến có đúng không
- Restart server sau khi thêm biến môi trường

### Lỗi CORS
- Thêm domain vào **Authentication** > **Settings** > **Site URL**
- Thêm domain vào **Authentication** > **Settings** > **Redirect URLs**

### Email không được gửi
- Kiểm tra cấu hình email trong **Authentication** > **Settings**
- Sử dụng email service provider như SendGrid, Resend nếu cần
