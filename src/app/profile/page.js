"use client";

import { useState, useEffect } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import Header from "@/components/Header";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function ProfilePage() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  
  const checkRequiredFields = (data) => {
    return !!(
      data.full_name &&
      data.phone &&
      data.id_number &&
      data.address &&
      data.bank_account_name &&
      data.bank_name &&
      data.bank_account_number
    );
  };

  const [profileData, setProfileData] = useState({
    id: "",
    full_name: "",
    avatar_url: null,
    phone: null,
    province_id: null,
    role: "",
    status: "",
    affiliate_code: "",
    referrer_id: "",
    total_recordings: 0,
    total_duration: 0,
    created_at: "",
    updated_at: "",
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (error) throw error;

        setProfileData(data);
      } catch (error) {
        console.error("Error fetching profile:", error.message);
        alert("Không thể tải thông tin profile. Vui lòng thử lại sau.");
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchProfile();
    }
  }, [user]);

  const handleEdit = () => {
    setEditData({
      full_name: profileData.full_name || "",
      phone: profileData.phone || "",
      id_number: profileData.id_number || "",
      address: profileData.address || "",
      bank_account_name: profileData.bank_account_name || "",
      bank_name: profileData.bank_name || "",
      bank_account_number: profileData.bank_account_number || "",
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: editData.full_name,
          phone: editData.phone,
          id_number: editData.id_number,
          address: editData.address,
          bank_account_name: editData.bank_account_name,
          bank_name: editData.bank_name,
          bank_account_number: editData.bank_account_number,
        })
        .eq("id", user.id);

      if (error) throw error;

      // Cập nhật lại profileData
      setProfileData(prev => ({
        ...prev,
        ...editData
      }));
      setIsEditing(false);
      alert("Cập nhật thông tin thành công!");
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Có lỗi xảy ra khi cập nhật thông tin. Vui lòng thử lại.");
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditData({});
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col">
        <Header />

        {/* Main Content */}
        <div className="flex-1 p-3 md:p-6 lg:p-8">
          {isLoading ? (
            <div className="max-w-4xl mx-auto flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-[#2DA6A2] border-t-transparent"></div>
                <p className="mt-2 text-gray-600">Đang tải thông tin...</p>
              </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto">
              {/* Page Header */}
              <div className="mb-8">
                <h1 className="text-2xl md:text-4xl font-bold text-[#2DA6A2] mb-1 md:mb-2">
                  Thông tin cá nhân
                </h1>
                <p className="text-base md:text-lg text-gray-600">
                  Quản lý thông tin tài khoản
                </p>
                {!checkRequiredFields(profileData) && (
                  <p className="mt-2 text-orange-500 text-sm md:text-base font-medium flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 mr-2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                    </svg>
                    Bạn cần cập nhật đầy đủ thông tin cá nhân để đủ điều kiện thanh toán
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8">
                {/* Profile Card */}
                <div className="lg:col-span-1">
                  <div className="bg-white rounded-lg shadow-md p-4 md:p-6 text-center">
                    <div className="w-20 h-20 md:w-24 md:h-24 bg-[#2DA6A2] rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4">
                      <span className="text-white text-xl md:text-2xl font-bold">
                        {user?.user_metadata?.full_name?.charAt(0) ||
                          user?.email?.charAt(0) ||
                          "U"}
                      </span>
                    </div>
                    <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-1 md:mb-2">
                      {user?.user_metadata?.full_name || "Chưa cập nhật"}
                    </h3>
                    <p className="text-sm md:text-base text-gray-600 mb-3 md:mb-4">
                      {user?.email}
                    </p>

                    <div className="space-y-1.5 md:space-y-2 text-xs md:text-sm text-gray-500">
                      <div className="flex justify-between">
                        <span>Vai trò:</span>
                        <span className="font-medium text-[#2DA6A2]">
                          {profileData.role === "admin" ? "Admin" : "CTV"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Mã giới thiệu:</span>
                        <span className="font-medium text-[#2DA6A2]">
                          {profileData.affiliate_code}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tham gia:</span>
                        <span>
                          {new Date(user?.created_at).toLocaleDateString(
                            "vi-VN"
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Trạng thái:</span>
                        <span
                          className={
                            profileData.status === "active"
                              ? "text-green-600"
                              : "text-red-600"
                          }
                        >
                          {profileData.status === "active"
                            ? "Hoạt động"
                            : "Không hoạt động"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div className="bg-white rounded-lg shadow-md p-4 md:p-6 mt-4 md:mt-6">
                    <div className="flex items-center justify-between mb-3 md:mb-4">
                      <h4 className="text-base md:text-lg font-semibold text-gray-900">
                        Thống kê
                      </h4>
                      <Link
                        href={`/manage-ctv/${user?.id}`}
                        className="inline-flex items-center text-[#2DA6A2] hover:text-[#2DA6A2]/80 text-xs md:text-sm font-medium"
                      >
                        <span>Xem bài ghi âm</span>
                        <svg
                          className="w-4 h-4 ml-1"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </Link>
                    </div>
                    <div className="space-y-2 md:space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm md:text-base text-gray-600">
                          Bài ghi âm
                        </span>
                        <span className="text-sm md:text-base font-semibold text-[#2DA6A2]">
                          {profileData.total_recordings || 0}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm md:text-base text-gray-600">
                          Tổng thời lượng
                        </span>
                        <span className="text-sm md:text-base font-semibold text-[#2DA6A2]">
                          {((profileData.total_duration || 0) / 60).toFixed(1)}{" "}
                          phút
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm md:text-base text-gray-600">
                          Thành tiền
                        </span>
                        <span className="text-sm md:text-base font-semibold text-green-600">
                          {new Intl.NumberFormat("vi-VN", {
                            style: "currency",
                            currency: "VND",
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0,
                          }).format(
                            ((profileData.total_duration || 0) / 60 / 20) *
                              100000
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Profile Form */}
                <div className="lg:col-span-2">
                  <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
                    <div className="mb-6 flex justify-between items-center">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Thông tin chi tiết
                      </h3>
                      <button
                        onClick={handleEdit}
                        className="inline-flex items-center text-[#2DA6A2] hover:text-[#2DA6A2]/80 transition-colors"
                        title="Chỉnh sửa thông tin"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                          className="w-5 h-5"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
                          />
                        </svg>
                        <span className="ml-1 text-sm font-medium">Cập nhật</span>
                      </button>
                    </div>

                    <div className="space-y-6">
                      {isEditing ? (
                        // Form chỉnh sửa
                        <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-6">
                          {/* Thông tin cá nhân */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">
                                Tên đầy đủ
                              </label>
                              <input
                                type="text"
                                name="full_name"
                                value={editData.full_name}
                                onChange={handleChange}
                                placeholder="Nhập họ và tên đầy đủ"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2DA6A2] focus:border-[#2DA6A2] text-base md:text-sm text-gray-900"
                              />
                            </div>

                            <div>
                              <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">
                                Số CCCD
                              </label>
                              <input
                                type="text"
                                name="id_number"
                                value={editData.id_number}
                                onChange={handleChange}
                                placeholder="Nhập số CCCD"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2DA6A2] focus:border-[#2DA6A2] text-base md:text-sm text-gray-900"
                              />
                            </div>
                          </div>

                          {/* Thông tin liên hệ */}
                          <div className="grid grid-cols-1 gap-6">
                            <div>
                              <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">
                                Địa chỉ
                              </label>
                              <input
                                type="text"
                                name="address"
                                value={editData.address}
                                onChange={handleChange}
                                placeholder="Nhập địa chỉ"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2DA6A2] focus:border-[#2DA6A2] text-base md:text-sm text-gray-900"
                              />
                            </div>

                            <div>
                              <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">
                                Số điện thoại
                              </label>
                              <input
                                type="tel"
                                name="phone"
                                value={editData.phone}
                                onChange={handleChange}
                                placeholder="Nhập số điện thoại"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2DA6A2] focus:border-[#2DA6A2] text-base md:text-sm text-gray-900"
                              />
                            </div>
                          </div>

                          {/* Thông tin ngân hàng */}
                          <div className="border-t pt-6">
                            <h4 className="text-base font-medium text-gray-900 mb-4">
                              Thông tin tài khoản ngân hàng
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div>
                                <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">
                                  Tên chủ tài khoản
                                </label>
                                <input
                                  type="text"
                                  name="bank_account_name"
                                  value={editData.bank_account_name}
                                  onChange={handleChange}
                                  placeholder="Nhập tên chủ tài khoản"
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2DA6A2] focus:border-[#2DA6A2] text-base md:text-sm text-gray-900"
                                />
                              </div>

                              <div>
                                <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">
                                  Tên ngân hàng
                                </label>
                                <input
                                  type="text"
                                  name="bank_name"
                                  value={editData.bank_name}
                                  onChange={handleChange}
                                  placeholder="Nhập tên ngân hàng"
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2DA6A2] focus:border-[#2DA6A2] text-base md:text-sm text-gray-900"
                                />
                              </div>

                              <div>
                                <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">
                                  Số tài khoản
                                </label>
                                <input
                                  type="text"
                                  name="bank_account_number"
                                  value={editData.bank_account_number}
                                  onChange={handleChange}
                                  placeholder="Nhập số tài khoản"
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2DA6A2] focus:border-[#2DA6A2] text-base md:text-sm text-gray-900"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Buttons */}
                          <div className="flex justify-end space-x-4 pt-4">
                            <button
                              type="button"
                              onClick={handleCancel}
                              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                            >
                              Hủy
                            </button>
                            <button
                              type="submit"
                              className="px-4 py-2 bg-[#2DA6A2] text-white rounded-lg hover:bg-[#2DA6A2]/90 transition-colors text-sm"
                            >
                              Lưu thay đổi
                            </button>
                          </div>
                        </form>
                      ) : (
                        // Hiển thị thông tin
                        <>
                          {/* Thông tin cá nhân */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">
                                Tên đầy đủ
                              </label>
                              <p className="text-sm md:text-base text-gray-900 py-1.5 md:py-2">
                                {profileData.full_name || (
                                  <span className="text-red-500">Chưa cập nhật</span>
                                )}
                              </p>
                            </div>

                            <div>
                              <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">
                                Số CCCD
                              </label>
                              <p className="text-sm md:text-base text-gray-900 py-1.5 md:py-2">
                                {profileData.id_number || (
                                  <span className="text-red-500">Chưa cập nhật</span>
                                )}
                              </p>
                            </div>
                          </div>

                          {/* Thông tin liên hệ */}
                          <div className="grid grid-cols-1 gap-6">
                            <div>
                              <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">
                                Địa chỉ
                              </label>
                              <p className="text-sm md:text-base text-gray-900 py-1.5 md:py-2">
                                {profileData.address || (
                                  <span className="text-red-500">Chưa cập nhật</span>
                                )}
                              </p>
                            </div>

                            <div>
                              <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">
                                Số điện thoại
                              </label>
                              <p className="text-sm md:text-base text-gray-900 py-1.5 md:py-2">
                                {profileData.phone || (
                                  <span className="text-red-500">Chưa cập nhật</span>
                                )}
                              </p>
                            </div>
                          </div>

                          {/* Thông tin ngân hàng */}
                          <div className="border-t pt-6">
                            <h4 className="text-base font-medium text-gray-900 mb-4">
                              Thông tin tài khoản ngân hàng
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div>
                                <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">
                                  Tên chủ tài khoản
                                </label>
                                <p className="text-sm md:text-base text-gray-900 py-1.5 md:py-2">
                                  {profileData.bank_account_name || (
                                    <span className="text-red-500">Chưa cập nhật</span>
                                  )}
                                </p>
                              </div>

                              <div>
                                <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">
                                  Tên ngân hàng
                                </label>
                                <p className="text-sm md:text-base text-gray-900 py-1.5 md:py-2">
                                  {profileData.bank_name || (
                                    <span className="text-red-500">Chưa cập nhật</span>
                                  )}
                                </p>
                              </div>

                              <div>
                                <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">
                                  Số tài khoản
                                </label>
                                <p className="text-sm md:text-base text-gray-900 py-1.5 md:py-2">
                                  {profileData.bank_account_number || (
                                    <span className="text-red-500">Chưa cập nhật</span>
                                  )}
                                </p>
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
