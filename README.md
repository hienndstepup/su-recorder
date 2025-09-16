# SU Recorder - Nền tảng ghi âm chuyên nghiệp

SU Recorder là một ứng dụng web ghi âm và quản lý âm thanh được xây dựng với Next.js và Supabase. Ứng dụng cho phép người dùng đăng ký, đăng nhập và sử dụng tính năng ghi âm với giao diện thân thiện.

## ✨ Tính năng chính

- 🔐 **Xác thực người dùng** - Đăng ký, đăng nhập, đăng xuất với Supabase Auth
- 🎤 **Ghi âm chất lượng cao** - Ghi âm và xử lý âm thanh trực tiếp trên trình duyệt
- 🛡️ **Bảo vệ route** - Các trang quan trọng chỉ accessible khi đã đăng nhập
- 📱 **Responsive design** - Giao diện tối ưu cho mọi thiết bị
- 🎨 **UI/UX hiện đại** - Thiết kế đẹp mắt với Tailwind CSS

## 🚀 Bắt đầu

### Yêu cầu hệ thống

- Node.js 18+ 
- npm hoặc yarn
- Tài khoản Supabase

### Cài đặt

1. **Clone repository:**
```bash
git clone <repository-url>
cd su-recorder
```

2. **Cài đặt dependencies:**
```bash
npm install
# hoặc
yarn install
```

3. **Cấu hình Supabase:**
   - Tạo tài khoản tại [supabase.com](https://supabase.com)
   - Tạo project mới
   - Lấy Project URL và anon key
   - Tạo file `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. **Khởi động ứng dụng:**
```bash
npm run dev
# hoặc
yarn dev
```

5. **Truy cập ứng dụng:**
Mở [http://localhost:3000](http://localhost:3000) trong trình duyệt

## 📖 Hướng dẫn chi tiết

Xem file [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) để biết hướng dẫn cấu hình Supabase chi tiết.

## 🏗️ Cấu trúc dự án

```
src/
├── app/                    # Next.js App Router
│   ├── components/         # Components dùng chung
│   ├── login/             # Trang đăng nhập
│   ├── register/          # Trang đăng ký
│   ├── record/            # Trang ghi âm (protected)
│   └── layout.js          # Root layout với AuthProvider
├── contexts/              # React Contexts
│   └── AuthContext.js     # Quản lý authentication state
├── lib/                   # Utilities và configurations
│   └── supabase.js        # Supabase client configuration
└── components/            # Reusable components
    └── ProtectedRoute.js  # Component bảo vệ route
```

## 🛠️ Công nghệ sử dụng

- **Frontend:** Next.js 15, React 19, Tailwind CSS
- **Backend:** Supabase (Auth, Database)
- **Audio:** RecordRTC, Web Audio API
- **UI Components:** Custom components với Tailwind CSS

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
