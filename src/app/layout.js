import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import TrackingDatadog from "./components/TrackingDatadog";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "SU Recorder - Nền tảng ghi âm chuyên nghiệp",
  description: "Nền tảng ghi âm và quản lý âm thanh chuyên nghiệp. Tạo, chỉnh sửa và chia sẻ các bản ghi âm của bạn một cách dễ dàng.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <TrackingDatadog />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
