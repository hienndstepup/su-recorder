"use client";

import { useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import Header from "@/components/Header";
import { useAuth } from "@/contexts/AuthContext";

export default function ProfilePage() {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    fullName: user?.user_metadata?.full_name || "",
    email: user?.email || "",
    phone: user?.user_metadata?.phone || "",
    region: user?.user_metadata?.region || "",
    bio: user?.user_metadata?.bio || ""
  });

  const regions = [
    { value: "north", label: "Miền Bắc" },
    { value: "central", label: "Miền Trung" },
    { value: "south", label: "Miền Nam" }
  ];

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSave = () => {
    // TODO: Implement save profile functionality
    console.log("Saving profile:", formData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormData({
      fullName: user?.user_metadata?.full_name || "",
      email: user?.email || "",
      phone: user?.user_metadata?.phone || "",
      region: user?.user_metadata?.region || "",
      bio: user?.user_metadata?.bio || ""
    });
    setIsEditing(false);
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col">
        <Header />
        
        {/* Main Content */}
        <div className="flex-1 p-4 md:p-6 lg:p-8">
          <div className="max-w-4xl mx-auto">
            {/* Page Header */}
            <div className="mb-8">
              <h1 className="text-3xl md:text-4xl font-bold text-[#2DA6A2] mb-2">
                Thông tin cá nhân
              </h1>
              <p className="text-lg text-gray-600">
                Quản lý thông tin tài khoản và cài đặt cá nhân
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Profile Card */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-lg shadow-md p-6 text-center">
                  <div className="w-24 h-24 bg-[#2DA6A2] rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-white text-2xl font-bold">
                      {user?.user_metadata?.full_name?.charAt(0) || user?.email?.charAt(0) || "U"}
                    </span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {user?.user_metadata?.full_name || "Chưa cập nhật"}
                  </h3>
                  <p className="text-gray-600 mb-4">{user?.email}</p>
                  
                  <div className="space-y-2 text-sm text-gray-500">
                    <div className="flex justify-between">
                      <span>Tham gia:</span>
                      <span>{new Date(user?.created_at).toLocaleDateString('vi-VN')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Trạng thái:</span>
                      <span className="text-green-600">Hoạt động</span>
                    </div>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="bg-white rounded-lg shadow-md p-6 mt-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Thống kê</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Bài ghi âm</span>
                      <span className="font-semibold text-[#2DA6A2]">0</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Hoàn thành</span>
                      <span className="font-semibold text-green-600">0</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Đánh giá TB</span>
                      <span className="font-semibold text-yellow-600">-</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Profile Form */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Thông tin chi tiết
                    </h3>
                    {!isEditing ? (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="bg-[#2DA6A2] hover:bg-[#2DA6A2]/90 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                      >
                        Chỉnh sửa
                      </button>
                    ) : (
                      <div className="flex space-x-2">
                        <button
                          onClick={handleCancel}
                          className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                        >
                          Hủy
                        </button>
                        <button
                          onClick={handleSave}
                          className="bg-[#2DA6A2] hover:bg-[#2DA6A2]/90 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                        >
                          Lưu
                        </button>
                      </div>
                    )}
                  </div>

                  <form className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Họ và tên
                        </label>
                        {isEditing ? (
                          <input
                            type="text"
                            name="fullName"
                            value={formData.fullName}
                            onChange={handleChange}
                            className="w-full px-4 py-2 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2DA6A2] focus:border-[#2DA6A2]"
                          />
                        ) : (
                          <p className="text-gray-900 py-2">{formData.fullName || "Chưa cập nhật"}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email
                        </label>
                        <p className="text-gray-900 py-2">{formData.email}</p>
                        <p className="text-xs text-gray-500">Email không thể thay đổi</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Số điện thoại
                        </label>
                        {isEditing ? (
                          <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            className="w-full px-4 py-2 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2DA6A2] focus:border-[#2DA6A2]"
                          />
                        ) : (
                          <p className="text-gray-900 py-2">{formData.phone || "Chưa cập nhật"}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Khu vực
                        </label>
                        {isEditing ? (
                          <select
                            name="region"
                            value={formData.region}
                            onChange={handleChange}
                            className="w-full px-4 py-2 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2DA6A2] focus:border-[#2DA6A2]"
                          >
                            <option value="">Chọn khu vực</option>
                            {regions.map(region => (
                              <option key={region.value} value={region.value}>
                                {region.label}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <p className="text-gray-900 py-2">
                            {regions.find(r => r.value === formData.region)?.label || "Chưa cập nhật"}
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Giới thiệu bản thân
                      </label>
                      {isEditing ? (
                        <textarea
                          name="bio"
                          value={formData.bio}
                          onChange={handleChange}
                          rows={4}
                          className="w-full px-4 py-2 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2DA6A2] focus:border-[#2DA6A2]"
                          placeholder="Viết vài dòng về bản thân..."
                        />
                      ) : (
                        <p className="text-gray-900 py-2">
                          {formData.bio || "Chưa cập nhật"}
                        </p>
                      )}
                    </div>
                  </form>
                </div>

                {/* Security Settings */}
                <div className="bg-white rounded-lg shadow-md p-6 mt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Bảo mật
                  </h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Đổi mật khẩu</h4>
                        <p className="text-sm text-gray-500">Cập nhật mật khẩu để bảo mật tài khoản</p>
                      </div>
                      <button className="text-[#2DA6A2] hover:text-[#2DA6A2]/80 text-sm font-medium">
                        Đổi mật khẩu
                      </button>
                    </div>
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Xác thực 2 bước</h4>
                        <p className="text-sm text-gray-500">Thêm lớp bảo mật cho tài khoản</p>
                      </div>
                      <button className="text-[#2DA6A2] hover:text-[#2DA6A2]/80 text-sm font-medium">
                        Bật
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
