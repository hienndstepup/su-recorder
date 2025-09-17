"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import ProtectedRoute from "@/components/ProtectedRoute";
import Header from "@/components/Header";
import { supabase, supabaseAdmin } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

export default function ManageCTVPage() {
  const { user } = useAuth();
  const [currentUserProfile, setCurrentUserProfile] = useState(null);

  // Lấy thông tin profile của user hiện tại (bao gồm affiliate_code)
  useEffect(() => {
    const fetchCurrentUserProfile = async () => {
      if (user) {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (data && !error) {
          setCurrentUserProfile(data);
        }
      }
    };

    fetchCurrentUserProfile();
  }, [user]);
  // const [searchTerm, setSearchTerm] = useState("");
  const [copiedLinkId, setCopiedLinkId] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newCTV, setNewCTV] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [ctvList, setCtvList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch danh sách CTV
  useEffect(() => {
    const fetchCTVList = async () => {
      try {
        setIsLoading(true);
        // Lấy danh sách profiles của CTV
        const { data: profilesData, error: profilesError } = await supabase
          .from("profiles")
          .select("*")
          .eq("role", "ctv")
          .order("created_at", { ascending: false });

        if (profilesError) throw profilesError;

        setCtvList(profilesData);
      } catch (error) {
        console.error("Error fetching CTV list:", error.message);
        alert("Không thể tải danh sách CTV. Vui lòng thử lại sau.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCTVList();
  }, []);

  // const filteredCTV = ctvList;

  const handleCopyLink = async (link, ctvId) => {
    try {
      await navigator.clipboard.writeText(link);
      setCopiedLinkId(ctvId);
      // Reset tooltip after 2 seconds
      setTimeout(() => {
        setCopiedLinkId(null);
      }, 2000);
    } catch (error) {
      console.error("Failed to copy link:", error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewCTV((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!newCTV.name.trim()) {
      newErrors.name = "Họ và tên không được để trống";
    }

    if (!newCTV.email.trim()) {
      newErrors.email = "Email không được để trống";
    } else if (!/\S+@\S+\.\S+/.test(newCTV.email)) {
      newErrors.email = "Email không hợp lệ";
    }

    if (!newCTV.password) {
      newErrors.password = "Mật khẩu không được để trống";
    } else if (newCTV.password.length < 6) {
      newErrors.password = "Mật khẩu phải có ít nhất 6 ký tự";
    }

    if (!newCTV.confirmPassword) {
      newErrors.confirmPassword = "Vui lòng nhập lại mật khẩu";
    } else if (newCTV.password !== newCTV.confirmPassword) {
      newErrors.confirmPassword = "Mật khẩu không khớp";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validateForm()) {
      try {
        // Kiểm tra xem đã có affiliate_code chưa
        if (!currentUserProfile?.affiliate_code) {
          throw new Error("Không thể tạo CTV mới. Vui lòng thử lại sau.");
        }

        // Tạo user mới với Supabase Auth (sử dụng service role)
        const { data: authData, error: authError } =
          await supabaseAdmin.auth.admin.createUser({
            email: newCTV.email,
            password: newCTV.password,
            email_confirm: true, // Tự động xác nhận email
            user_metadata: {
              full_name: newCTV.name,
              referrer_code: currentUserProfile.affiliate_code, // Sử dụng affiliate_code của người tạo
              role: "ctv", // Mặc định là ctv
            },
          });

        if (authError) throw authError;

        // Reset form và đóng modal
        setNewCTV({
          name: "",
          email: "",
          password: "",
          confirmPassword: "",
        });
        setErrors({});
        setShowPassword(false);
        setShowConfirmPassword(false);
        setIsCreateModalOpen(false);

        // Thông báo thành công
        alert("Tạo CTV mới thành công!");
      } catch (error) {
        console.error("Error creating CTV:", error.message);
        setErrors({ submit: error.message });
      }
    }
  };

  const handleCloseModal = () => {
    setIsCreateModalOpen(false);
    setNewCTV({
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    });
    setErrors({});
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col">
        <Header />

        {/* Main Content */}
            <div className="flex-1 p-3 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {/* Page Header */}
            <div className="mb-4">
              <h1 className="text-2xl md:text-4xl font-bold text-[#2DA6A2] mb-1 md:mb-2">
                Quản lý CTV
              </h1>
              <p className="text-base md:text-lg text-gray-600">
                Quản lý và theo dõi hoạt động của các cộng tác viên
              </p>
            </div>

            {/* Actions */}
            <div className="flex justify-end mb-4">
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="bg-[#2DA6A2] hover:bg-[#2DA6A2]/90 text-white font-medium py-1.5 px-4 md:py-2 md:px-6 rounded-lg transition-colors flex items-center text-sm md:text-base"
              >
                <svg
                  className="w-4 h-4 md:w-5 md:h-5 mr-1.5 md:mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                Thêm CTV mới
              </button>
            </div>

            {/* CTV List */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <h3 className="text-base md:text-lg font-semibold text-gray-900">
                    Danh sách CTV ({ctvList.length})
                  </h3>
                  <div className="flex flex-col md:flex-row items-start md:items-center space-y-2 md:space-y-0 md:space-x-6">
                    <div className="flex items-center">
                      <div className="text-xs md:text-sm font-medium text-gray-500 mr-2">
                        Tổng số bài ghi âm:
                      </div>
                      <div className="text-base md:text-lg font-semibold text-[#2DA6A2]">
                        {ctvList.reduce(
                          (sum, ctv) => sum + (ctv.total_recordings || 0),
                          0
                        )}
                      </div>
                    </div>
                    <div className="flex items-center">
                      <div className="text-xs md:text-sm font-medium text-gray-500 mr-2">
                        Tổng thời lượng:
                      </div>
                      <div className="text-base md:text-lg font-semibold text-[#2DA6A2]">
                        {(
                          ctvList.reduce(
                            (sum, ctv) => sum + (ctv.total_duration || 0),
                            0
                          ) / 60
                        ).toFixed(1)}{" "}
                        phút
                      </div>
                    </div>
                    <div className="flex items-center">
                      <div className="text-xs md:text-sm font-medium text-gray-500 mr-2">
                        Thành tiền:
                      </div>
                      <div className="text-base md:text-lg font-semibold text-green-600">
                        {new Intl.NumberFormat("vi-VN", {
                          style: "currency",
                          currency: "VND",
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        }).format(
                          (ctvList.reduce(
                            (sum, ctv) => sum + (ctv.total_duration || 0),
                            0
                          ) /
                            60 /
                            20) *
                            100000
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {isLoading ? (
                <div className="p-8 text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-[#2DA6A2] border-t-transparent"></div>
                  <p className="mt-2 text-gray-600">
                    Đang tải danh sách CTV...
                  </p>
                </div>
              ) : ctvList.length === 0 ? (
                <div className="p-8 text-center text-gray-600">
                  Chưa có CTV nào
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 md:px-6 py-2 md:py-3 text-left text-[10px] md:text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                          Họ và tên
                        </th>
                        <th className="px-4 md:px-6 py-2 md:py-3 text-left text-[10px] md:text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                          Mã giới thiệu
                        </th>
                        <th className="px-4 md:px-6 py-2 md:py-3 text-left text-[10px] md:text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                          Số bài ghi âm
                        </th>
                        <th className="px-4 md:px-6 py-2 md:py-3 text-left text-[10px] md:text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                          Thời lượng
                        </th>
                        <th className="px-4 md:px-6 py-2 md:py-3 text-left text-[10px] md:text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                          Thành tiền
                        </th>
                        <th className="px-4 md:px-6 py-2 md:py-3 text-left text-[10px] md:text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                          Trạng thái
                        </th>
                        <th className="px-4 md:px-6 py-2 md:py-3 text-left text-[10px] md:text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                          Ngày tạo
                        </th>
                        <th className="px-4 md:px-6 py-2 md:py-3 text-left text-[10px] md:text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                          Hành động
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {ctvList.map((ctv) => (
                        <tr key={ctv.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-8 h-8 md:w-10 md:h-10 bg-[#2DA6A2] rounded-full flex items-center justify-center">
                                <span className="text-white text-xs md:text-sm font-medium">
                                  {(ctv.full_name || "")
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")}
                                </span>
                              </div>
                              <div className="ml-4">
                                <div className="text-xs md:text-sm font-medium text-gray-900">
                                  {ctv.full_name || "Chưa cập nhật"}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 md:px-6 py-3 md:py-4 whitespace-nowrap text-xs md:text-sm text-gray-900">
                            {ctv.affiliate_code}
                          </td>
                          <td className="px-4 md:px-6 py-3 md:py-4 whitespace-nowrap text-xs md:text-sm text-gray-900">
                            {ctv.total_recordings}
                          </td>
                          <td className="px-4 md:px-6 py-3 md:py-4 whitespace-nowrap text-xs md:text-sm text-gray-900">
                            {(ctv.total_duration / 60).toFixed(1)} phút
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                            {new Intl.NumberFormat("vi-VN", {
                              style: "currency",
                              currency: "VND",
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 0,
                            }).format(((ctv.total_duration || 0) / 60 / 20) * 100000)}
                          </td>
                          <td className="px-4 md:px-6 py-3 md:py-4 whitespace-nowrap text-xs md:text-sm text-gray-900">
                            <span
                              className={`px-1.5 md:px-2 py-0.5 md:py-1 rounded-full text-[10px] md:text-xs font-medium ${
                                ctv.status === "active"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {ctv.status === "active"
                                ? "Hoạt động"
                                : "Không hoạt động"}
                            </span>
                          </td>
                          <td className="px-4 md:px-6 py-3 md:py-4 whitespace-nowrap text-xs md:text-sm text-gray-500">
                            {new Date(ctv.created_at).toLocaleDateString(
                              "vi-VN"
                            )}
                          </td>
                          <td className="px-4 md:px-6 py-3 md:py-4 whitespace-nowrap text-xs md:text-sm font-medium">
                            <Link
                              href={`/manage-ctv/${ctv.id}`}
                              className="text-[#2DA6A2] hover:text-[#2DA6A2]/80 hover:bg-[#2DA6A2]/10 px-1.5 md:px-2 py-0.5 md:py-1 rounded transition-colors text-xs md:text-sm"
                            >
                              Xem
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Create CTV Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-base md:text-lg font-semibold text-gray-900">
                Thêm CTV mới
              </h3>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg
                  className="w-5 h-5 md:w-6 md:h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Họ và tên */}
              <div>
                <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1.5 md:mb-2">
                  Họ và tên *
                </label>
                <input
                  type="text"
                  name="name"
                  value={newCTV.name}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 md:px-4 md:py-3 text-sm md:text-base border rounded-lg focus:ring-2 focus:ring-[#2DA6A2] focus:border-[#2DA6A2] text-gray-900 ${
                    errors.name ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Nhập họ và tên"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1.5 md:mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={newCTV.email}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 md:px-4 md:py-3 text-sm md:text-base border rounded-lg focus:ring-2 focus:ring-[#2DA6A2] focus:border-[#2DA6A2] text-gray-900 ${
                    errors.email ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Nhập email"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                )}
              </div>

              {/* Mật khẩu */}
              <div>
                <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1.5 md:mb-2">
                  Mật khẩu *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={newCTV.password}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 md:px-4 md:py-3 pr-10 md:pr-12 text-sm md:text-base border rounded-lg focus:ring-2 focus:ring-[#2DA6A2] focus:border-[#2DA6A2] text-gray-900 ${
                      errors.password ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="Nhập mật khẩu"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                )}
              </div>

              {/* Nhập lại mật khẩu */}
              <div>
                <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1.5 md:mb-2">
                  Nhập lại mật khẩu *
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={newCTV.confirmPassword}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 md:px-4 md:py-3 pr-10 md:pr-12 text-sm md:text-base border rounded-lg focus:ring-2 focus:ring-[#2DA6A2] focus:border-[#2DA6A2] text-gray-900 ${
                      errors.confirmPassword
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                    placeholder="Nhập lại mật khẩu"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? (
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.confirmPassword}
                  </p>
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-3 py-1.5 md:px-4 md:py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm md:text-base"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 px-3 py-1.5 md:px-4 md:py-2 bg-[#2DA6A2] text-white rounded-lg hover:bg-[#2DA6A2]/90 transition-colors text-sm md:text-base"
                >
                  Tạo CTV
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
}
