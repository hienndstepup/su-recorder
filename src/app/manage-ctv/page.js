"use client";

import { useState } from "react";
import Link from "next/link";
import ProtectedRoute from "@/components/ProtectedRoute";
import Header from "@/components/Header";

export default function ManageCTVPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [copiedLinkId, setCopiedLinkId] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newCTV, setNewCTV] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Mock data - sẽ được thay thế bằng data thực tế
  const ctvList = [
    {
      id: 1,
      name: "Nguyễn Văn A",
      email: "nguyenvana@email.com",
      region: "north",
      status: "active",
      totalRecordings: 156,
      completedRecordings: 142,
      joinDate: "2024-01-15",
      lastActive: "2024-12-20",
      affiliateLink: "https://su-recorder.com/ref/nguyenvana",
    },
    {
      id: 2,
      name: "Trần Thị B",
      email: "tranthib@email.com",
      region: "central",
      status: "active",
      totalRecordings: 128,
      completedRecordings: 120,
      joinDate: "2024-02-10",
      lastActive: "2024-12-19",
      affiliateLink: "https://su-recorder.com/ref/tranthib",
    },
    {
      id: 3,
      name: "Lê Văn C",
      email: "levanc@email.com",
      region: "south",
      status: "inactive",
      totalRecordings: 89,
      completedRecordings: 75,
      joinDate: "2024-03-05",
      lastActive: "2024-12-15",
      affiliateLink: "https://su-recorder.com/ref/levanc",
    },
    {
      id: 4,
      name: "Phạm Thị D",
      email: "phamthid@email.com",
      region: "north",
      status: "active",
      totalRecordings: 203,
      completedRecordings: 195,
      joinDate: "2024-01-20",
      lastActive: "2024-12-20",
      affiliateLink: "https://su-recorder.com/ref/phamthid",
    },
  ];

  const filteredCTV = ctvList.filter((ctv) => {
    const matchesSearch =
      ctv.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ctv.email.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

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
    setNewCTV(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ""
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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      // TODO: Call API to create new CTV
      console.log("Creating new CTV:", newCTV);
      
      // Reset form and close modal
      setNewCTV({
        name: "",
        email: "",
        password: "",
        confirmPassword: ""
      });
      setErrors({});
      setShowPassword(false);
      setShowConfirmPassword(false);
      setIsCreateModalOpen(false);
      
      // Show success message (you can add toast notification here)
      alert("Tạo CTV mới thành công!");
    }
  };

  const handleCloseModal = () => {
    setIsCreateModalOpen(false);
    setNewCTV({
      name: "",
      email: "",
      password: "",
      confirmPassword: ""
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
        <div className="flex-1 p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {/* Page Header */}
            <div className="mb-8">
              <h1 className="text-3xl md:text-4xl font-bold text-[#2DA6A2] mb-2">
                Quản lý CTV
              </h1>
              <p className="text-lg text-gray-600">
                Quản lý và theo dõi hoạt động của các cộng tác viên
              </p>
            </div>

            {/* Filters & Actions */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tìm kiếm CTV
                  </label>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Nhập tên hoặc email CTV..."
                    className="w-full px-4 py-2 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2DA6A2] focus:border-[#2DA6A2] text-gray-900"
                  />
                </div>
                <div className="flex-shrink-0">
                  <button 
                    onClick={() => setIsCreateModalOpen(true)}
                    className="bg-[#2DA6A2] hover:bg-[#2DA6A2]/90 text-white font-medium py-2 px-6 rounded-lg transition-colors flex items-center"
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
                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                      />
                    </svg>
                    Thêm CTV mới
                  </button>
                </div>
              </div>
            </div>

            {/* CTV List */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  Danh sách CTV ({filteredCTV.length})
                </h3>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        CTV
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Phiên Hoàn thành
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Số bài ghi âm
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Affiliate Link
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Hoạt động cuối
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Hành động
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredCTV.map((ctv) => (
                      <tr key={ctv.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-[#2DA6A2] rounded-full flex items-center justify-center">
                              <span className="text-white text-sm font-medium">
                                {ctv.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </span>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {ctv.name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {ctv.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {ctv.completedRecordings}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {ctv.totalRecordings}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center space-x-2">
                            <span className="truncate max-w-32 text-[#2DA6A2]" title={ctv.affiliateLink}>
                              {ctv.affiliateLink}
                            </span>
                            <div className="relative">
                              <button
                                onClick={() =>
                                  handleCopyLink(ctv.affiliateLink, ctv.id)
                                }
                                className="text-gray-400 hover:text-[#2DA6A2] transition-colors"
                                title="Copy link"
                              >
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                                  />
                                </svg>
                              </button>
                              {copiedLinkId === ctv.id && (
                                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                                  Đã sao chép
                                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-gray-800"></div>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(ctv.lastActive).toLocaleDateString("vi-VN")}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <Link 
                              href={`/profile/${ctv.id}`}
                              className="text-[#2DA6A2] hover:text-[#2DA6A2]/80 hover:bg-[#2DA6A2]/10 px-2 py-1 rounded transition-colors"
                            >
                              Xem
                            </Link>
                            <button className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2 py-1 rounded transition-colors">
                              Sửa
                            </button>
                            <button className="text-red-600 hover:text-red-800 hover:bg-red-50 px-2 py-1 rounded transition-colors">
                              Xóa
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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
              <h3 className="text-lg font-semibold text-gray-900">
                Thêm CTV mới
              </h3>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Họ và tên */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Họ và tên *
                </label>
                <input
                  type="text"
                  name="name"
                  value={newCTV.name}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 text-base border rounded-lg focus:ring-2 focus:ring-[#2DA6A2] focus:border-[#2DA6A2] text-gray-900 ${
                    errors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Nhập họ và tên"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={newCTV.email}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 text-base border rounded-lg focus:ring-2 focus:ring-[#2DA6A2] focus:border-[#2DA6A2] text-gray-900 ${
                    errors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Nhập email"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                )}
              </div>

              {/* Mật khẩu */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mật khẩu *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={newCTV.password}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 pr-12 text-base border rounded-lg focus:ring-2 focus:ring-[#2DA6A2] focus:border-[#2DA6A2] text-gray-900 ${
                      errors.password ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Nhập mật khẩu"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nhập lại mật khẩu *
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={newCTV.confirmPassword}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 pr-12 text-base border rounded-lg focus:ring-2 focus:ring-[#2DA6A2] focus:border-[#2DA6A2] text-gray-900 ${
                      errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Nhập lại mật khẩu"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-[#2DA6A2] text-white rounded-lg hover:bg-[#2DA6A2]/90 transition-colors"
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
