"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    referrerCode: "", // Thêm mã giới thiệu
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const { signUp } = useAuth();
  const router = useRouter();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    // Clear error when user starts typing
    if (errors[e.target.name]) {
      setErrors({
        ...errors,
        [e.target.name]: "",
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = "Vui lòng nhập họ tên";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Vui lòng nhập email";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email không hợp lệ";
    }

    if (!formData.password) {
      newErrors.password = "Vui lòng nhập mật khẩu";
    } else if (formData.password.length < 6) {
      newErrors.password = "Mật khẩu phải có ít nhất 6 ký tự";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Vui lòng xác nhận mật khẩu";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Mật khẩu xác nhận không khớp";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (validateForm()) {
      setIsLoading(true);

      try {
        const { data, error } = await signUp(
          formData.email,
          formData.password,
          { 
            full_name: formData.fullName,
            referrer_code: formData.referrerCode || null // Thêm mã giới thiệu vào metadata
          }
        );

        if (error) {
          setErrors({ submit: error.message });
        } else {
          setIsSuccess(true);
        }
      } catch (err) {
        setErrors({ submit: "Có lỗi xảy ra khi đăng ký. Vui lòng thử lại." });
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#2DA6A2] rounded-full mb-4">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Đăng ký</h1>
          <p className="text-gray-600">Tạo tài khoản mới để bắt đầu</p>
        </div>

        {/* Form or Success Message */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {isSuccess ? (
            /* Success Message */
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-6">
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Đăng ký thành công!
              </h2>
              <p className="text-gray-600 mb-4">
                Vui lòng kiểm tra email để xác thực tài khoản của bạn.
              </p>

              {/* Email Link */}
              <div className="mb-8">
                <a
                  href={`mailto:${formData.email}`}
                  className="inline-flex items-center text-[#2DA6A2] hover:text-[#2DA6A2]/80 transition-colors text-sm font-medium"
                >
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  Mở email ({formData.email})
                </a>
              </div>

              <Link
                href="/login"
                className="inline-flex items-center bg-[#2DA6A2] hover:bg-[#2DA6A2]/90 text-white font-medium py-3 px-6 rounded-lg transition-colors"
              >
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                  />
                </svg>
                Đi đến trang đăng nhập
              </Link>
            </div>
          ) : (
            /* Registration Form */
            <>
              {errors.submit && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{errors.submit}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Full Name */}
                <div>
                  <label
                    htmlFor="fullName"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Họ và tên
                  </label>
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    required
                    className={`w-full px-4 py-3 text-base text-gray-900 border rounded-lg focus:ring-2 focus:ring-[#2DA6A2] focus:border-[#2DA6A2] transition-colors ${
                      errors.fullName ? "border-red-300" : "border-gray-300"
                    }`}
                    placeholder="Nhập họ và tên của bạn"
                  />
                  {errors.fullName && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.fullName}
                    </p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className={`w-full px-4 py-3 text-base text-gray-900 border rounded-lg focus:ring-2 focus:ring-[#2DA6A2] focus:border-[#2DA6A2] transition-colors ${
                      errors.email ? "border-red-300" : "border-gray-300"
                    }`}
                    placeholder="Nhập email của bạn"
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Mật khẩu
                  </label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className={`w-full px-4 py-3 text-base text-gray-900 border rounded-lg focus:ring-2 focus:ring-[#2DA6A2] focus:border-[#2DA6A2] transition-colors ${
                      errors.password ? "border-red-300" : "border-gray-300"
                    }`}
                    placeholder="Nhập mật khẩu (ít nhất 6 ký tự)"
                  />
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.password}
                    </p>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Xác nhận mật khẩu
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    className={`w-full px-4 py-3 text-base text-gray-900 border rounded-lg focus:ring-2 focus:ring-[#2DA6A2] focus:border-[#2DA6A2] transition-colors ${
                      errors.confirmPassword
                        ? "border-red-300"
                        : "border-gray-300"
                    }`}
                    placeholder="Nhập lại mật khẩu"
                  />
                  {errors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>

                {/* Referrer Code */}
                <div>
                  <label
                    htmlFor="referrerCode"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Mã giới thiệu (không bắt buộc)
                  </label>
                  <input
                    type="text"
                    id="referrerCode"
                    name="referrerCode"
                    value={formData.referrerCode}
                    onChange={handleChange}
                    className="w-full px-4 py-3 text-base text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2DA6A2] focus:border-[#2DA6A2] transition-colors"
                    placeholder="Nhập mã giới thiệu nếu có"
                  />
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-[#2DA6A2] hover:bg-[#2DA6A2]/90 disabled:bg-[#2DA6A2]/50 text-white font-medium py-3 px-4 rounded-lg transition-colors focus:ring-2 focus:ring-[#2DA6A2] focus:ring-offset-2 disabled:cursor-not-allowed"
                >
                  {isLoading ? "Đang đăng ký..." : "Đăng ký"}
                </button>
              </form>

              {/* Sign in link */}
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  Đã có tài khoản?{" "}
                  <Link
                    href="/login"
                    className="font-medium text-[#2DA6A2] hover:text-[#2DA6A2]/80 transition-colors"
                  >
                    Đăng nhập ngay
                  </Link>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
