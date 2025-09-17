"use client";

import { useState, useEffect } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import Header from "@/components/Header";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

export default function ProfilePage() {
  const { user } = useAuth();
  // const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    region: "",
    bio: ""
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

        setProfile(data);
        setFormData({
          fullName: data.full_name || "",
          email: user.email || "",
          phone: data.phone || "",
          region: data.province_id || "",
          bio: data.bio || "",
          affiliate_code: data.affiliate_code,
          role: data.role,
          status: data.status,
          total_recordings: data.total_recordings,
          total_duration: data.total_duration
        });
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

  const regions = [
    { value: "north", label: "Miền Bắc" },
    { value: "central", label: "Miền Trung" },
    { value: "south", label: "Miền Nam" }
  ];

  // Removed handleChange

  // Removed edit functions

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
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8">
              {/* Profile Card */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-lg shadow-md p-4 md:p-6 text-center">
                  <div className="w-20 h-20 md:w-24 md:h-24 bg-[#2DA6A2] rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4">
                    <span className="text-white text-xl md:text-2xl font-bold">
                      {user?.user_metadata?.full_name?.charAt(0) || user?.email?.charAt(0) || "U"}
                    </span>
                  </div>
                  <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-1 md:mb-2">
                    {user?.user_metadata?.full_name || "Chưa cập nhật"}
                  </h3>
                  <p className="text-sm md:text-base text-gray-600 mb-3 md:mb-4">{user?.email}</p>
                  
                  <div className="space-y-1.5 md:space-y-2 text-xs md:text-sm text-gray-500">
                    <div className="flex justify-between">
                      <span>Vai trò:</span>
                      <span className="font-medium text-[#2DA6A2]">
                        {formData.role === 'admin' ? 'Admin' : 'CTV'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Mã giới thiệu:</span>
                      <span className="font-medium text-[#2DA6A2]">{formData.affiliate_code}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tham gia:</span>
                      <span>{new Date(user?.created_at).toLocaleDateString('vi-VN')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Trạng thái:</span>
                      <span className={formData.status === 'active' ? 'text-green-600' : 'text-red-600'}>
                        {formData.status === 'active' ? 'Hoạt động' : 'Không hoạt động'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="bg-white rounded-lg shadow-md p-4 md:p-6 mt-4 md:mt-6">
                  <h4 className="text-base md:text-lg font-semibold text-gray-900 mb-3 md:mb-4">Thống kê</h4>
                  <div className="space-y-2 md:space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm md:text-base text-gray-600">Bài ghi âm</span>
                      <span className="text-sm md:text-base font-semibold text-[#2DA6A2]">{formData.total_recordings || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm md:text-base text-gray-600">Tổng thời lượng</span>
                      <span className="text-sm md:text-base font-semibold text-[#2DA6A2]">
                        {((formData.total_duration || 0) / 60).toFixed(1)} phút
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm md:text-base text-gray-600">Thành tiền</span>
                      <span className="text-sm md:text-base font-semibold text-green-600">
                        {new Intl.NumberFormat("vi-VN", {
                          style: "currency",
                          currency: "VND",
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        }).format(((formData.total_duration || 0) / 60 / 20) * 100000)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Profile Form */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Thông tin chi tiết
                    </h3>
                  </div>

                  <form className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                         <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">
                            Họ và tên
                          </label>
                        <p className="text-sm md:text-base text-gray-900 py-1.5 md:py-2">{formData.fullName || "Chưa cập nhật"}</p>
                      </div>

                      <div>
                        <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">
                          Email
                        </label>
                        <p className="text-sm md:text-base text-gray-900 py-1.5 md:py-2">{formData.email}</p>
                        <p className="text-xs md:text-sm text-gray-500">Email không thể thay đổi</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">
                          Số điện thoại
                        </label>
                        <p className="text-sm md:text-base text-gray-900 py-1.5 md:py-2">{formData.phone || "Chưa cập nhật"}</p>
                      </div>

                      <div>
                        <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">
                          Khu vực
                        </label>
                        <p className="text-sm md:text-base text-gray-900 py-1.5 md:py-2">
                          {regions.find(r => r.value === formData.region)?.label || "Chưa cập nhật"}
                        </p>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Giới thiệu bản thân
                      </label>
                      <p className="text-gray-900 py-2">
                        {formData.bio || "Chưa cập nhật"}
                      </p>
                    </div>
                  </form>
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
