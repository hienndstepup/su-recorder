"use client";

import { useState, useEffect } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import Header from "@/components/Header";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import SignaturePadComponent from "@/components/SignaturePad";
import { calculatePaymentAmount } from "@/lib/index";

export default function ProfilePage() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [showPasswords, setShowPasswords] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingFront, setUploadingFront] = useState(false);
  const [uploadingBack, setUploadingBack] = useState(false);
  const [lightboxImage, setLightboxImage] = useState(null);
  const [signature, setSignature] = useState(null);
  const [isSavingSignature, setIsSavingSignature] = useState(false);
  const [signatureSaved, setSignatureSaved] = useState(false);
  
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
        
        // Load signature if exists
        if (data.signature) {
          setSignature(data.signature);
          setSignatureSaved(true); // Mark as saved since it's from DB
        }
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
      front_cccd: profileData.front_cccd || "",
      back_cccd: profileData.back_cccd || "",
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      const { error } = await supabase
        .rpc('update_profile_info', {
          profile_id: user.id,
          new_full_name: editData.full_name,
          new_phone: editData.phone,
          new_id_number: editData.id_number,
          new_address: editData.address,
          new_bank_account_name: editData.bank_account_name,
          new_bank_name: editData.bank_name,
          new_bank_account_number: editData.bank_account_number,
          new_front_cccd: editData.front_cccd,
          new_back_cccd: editData.back_cccd,
        });

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

  const handleSignatureChange = (signatureData) => {
    setSignature(signatureData);
  };

  const saveSignature = async () => {
    if (!signature) {
      alert('Vui lòng ký vào ô chữ ký trước khi lưu!');
      return;
    }

    try {
      setIsSavingSignature(true);
      
      const { error } = await supabase
        .from('profiles')
        .update({ signature: signature })
        .eq('id', user.id);

      if (error) throw error;

      setSignatureSaved(true); // Mark as saved after successful save
      alert('Chữ ký đã được lưu thành công!');
    } catch (error) {
      console.error('Error saving signature:', error);
      alert('Không thể lưu chữ ký. Vui lòng thử lại.');
    } finally {
      setIsSavingSignature(false);
    }
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
                
                {/* Terms Link */}
                <div className="mt-3">
                  <a
                    href="/CAM_KET_SU_DUNG_DU_LIEU.pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-[#2DA6A2] hover:text-[#2DA6A2]/80 font-medium text-sm md:text-base transition-colors"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Điều khoản
                  </a>
                </div>

                {/* Signature Section */}
                <div className="mt-6 p-4 bg-white rounded-lg shadow-md">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-[#2DA6A2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                    Chữ ký
                  </h3>
                  
                  <div className="mb-4">
                    <SignaturePadComponent
                      onSignatureChange={handleSignatureChange}
                      initialSignature={signature}
                      width={600}
                      height={200}
                      className="w-full"
                      readonly={signatureSaved}
                    />
                  </div>
                  
                  {/* Only show save button if signature not saved */}
                  {!signatureSaved && (
                    <div className="flex justify-end space-x-3">
                      <button
                        onClick={saveSignature}
                        disabled={!signature || isSavingSignature}
                        className="px-4 py-2 bg-[#2DA6A2] text-white rounded-lg hover:bg-[#2DA6A2]/90 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center"
                      >
                        {isSavingSignature ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Đang lưu...
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                            </svg>
                            Lưu chữ ký
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>

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

                    <button
                      onClick={() => setIsChangePasswordOpen(true)}
                      className="w-full py-2 text-[#2DA6A2] hover:text-[#2DA6A2]/80 font-medium text-sm border border-[#2DA6A2] rounded-lg transition-colors mb-3"
                    >
                      Đổi mật khẩu
                    </button>

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
                            calculatePaymentAmount(profileData.total_duration || 0)
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

                            {/* CCCD Images */}
                            <div>
                              <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">
                                Ảnh mặt trước CCCD
                              </label>
                              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-[#2DA6A2] transition-colors">
                                <div className="space-y-1 text-center">
                                  {editData.front_cccd ? (
                                    <div className="relative">
                                      <img
                                        src={editData.front_cccd}
                                        alt="Mặt trước CCCD"
                                        className="max-h-32 mx-auto cursor-pointer hover:opacity-80 transition-opacity"
                                        onClick={() => setLightboxImage(editData.front_cccd)}
                                      />
                                      <button
                                        type="button"
                                        onClick={() => setEditData(prev => ({ ...prev, front_cccd: "" }))}
                                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                                      >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                        </svg>
                                      </button>
                                    </div>
                                  ) : (
                                    <>
                                      <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                      </svg>
                                      <div className="flex text-sm text-gray-600">
                                        <label className="relative cursor-pointer rounded-md font-medium text-[#2DA6A2] hover:text-[#2DA6A2]/90 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-[#2DA6A2]">
                                          <span>Tải ảnh lên</span>
                                          <input
                                            type="file"
                                            className="sr-only"
                                            accept="image/*"
                                            onChange={async (e) => {
                                              const file = e.target.files?.[0];
                                              if (file) {
                                                setUploadingFront(true);
                                                try {
                                                  const formData = new FormData();
                                                  formData.append('files', file);
                                                  formData.append('fileTypes', file.type);
                                                  formData.append('objectKey', 'web_mvp/sub_recordings/thumb');

                                                  const response = await fetch('https://mvp-api.hacknao.edu.vn/api/v1/upload', {
                                                    method: 'POST',
                                                    body: formData,
                                                    headers: {
                                                      'accept': 'application/json, text/plain, */*',
                                                      'accept-language': 'en-US,en;q=0.9,vi;q=0.8',
                                                      'authorization': 'Bearer undefined',
                                                      'origin': 'https://mvp.hacknao.edu.vn',
                                                      'priority': 'u=1, i',
                                                      'referer': 'https://mvp.hacknao.edu.vn/',
                                                      'sec-ch-ua': '"Chromium";v="140", "Not=A?Brand";v="24", "Google Chrome";v="140"',
                                                      'sec-ch-ua-mobile': '?0',
                                                      'sec-ch-ua-platform': '"macOS"',
                                                      'sec-fetch-dest': 'empty',
                                                      'sec-fetch-mode': 'cors',
                                                      'sec-fetch-site': 'same-site',
                                                      'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36'
                                                    },
                                                  });

                                                  if (!response.ok) {
                                                    throw new Error('Upload failed');
                                                  }

                                                  const { urls } = await response.json();
                                                  if (urls && urls.length > 0) {
                                                    setEditData(prev => ({
                                                      ...prev,
                                                      front_cccd: urls[0]
                                                    }));
                                                  } else {
                                                    throw new Error('No URL returned from server');
                                                  }
                                                } catch (error) {
                                                  console.error('Error uploading image:', error);
                                                  alert('Lỗi khi tải ảnh lên. Vui lòng thử lại.');
                                                } finally {
                                                  setUploadingFront(false);
                                                }
                                              }
                                            }}
                                          />
                                        </label>
                                      </div>
                                      <p className="text-xs text-gray-500">PNG, JPG, GIF tối đa 10MB</p>
                                      {uploadingFront && (
                                        <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
                                          <div className="w-4 h-4 border-2 border-[#2DA6A2] border-t-transparent rounded-full animate-spin"></div>
                                          <span>Đang tải lên...</span>
                                        </div>
                                      )}
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div>
                              <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">
                                Ảnh mặt sau CCCD
                              </label>
                              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-[#2DA6A2] transition-colors">
                                <div className="space-y-1 text-center">
                                  {editData.back_cccd ? (
                                    <div className="relative">
                                      <img
                                        src={editData.back_cccd}
                                        alt="Mặt sau CCCD"
                                        className="max-h-32 mx-auto cursor-pointer hover:opacity-80 transition-opacity"
                                        onClick={() => setLightboxImage(editData.back_cccd)}
                                      />
                                      <button
                                        type="button"
                                        onClick={() => setEditData(prev => ({ ...prev, back_cccd: "" }))}
                                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                                      >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                        </svg>
                                      </button>
                                    </div>
                                  ) : (
                                    <>
                                      <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                      </svg>
                                      <div className="flex text-sm text-gray-600">
                                        <label className="relative cursor-pointer rounded-md font-medium text-[#2DA6A2] hover:text-[#2DA6A2]/90 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-[#2DA6A2]">
                                          <span>Tải ảnh lên</span>
                                          <input
                                            type="file"
                                            className="sr-only"
                                            accept="image/*"
                                            onChange={async (e) => {
                                              const file = e.target.files?.[0];
                                              if (file) {
                                                setUploadingBack(true);
                                                try {
                                                  const formData = new FormData();
                                                  formData.append('files', file);
                                                  formData.append('fileTypes', file.type);
                                                  formData.append('objectKey', 'web_mvp/sub_recordings/thumb');

                                                  const response = await fetch('https://mvp-api.hacknao.edu.vn/api/v1/upload', {
                                                    method: 'POST',
                                                    body: formData,
                                                    headers: {
                                                      'accept': 'application/json, text/plain, */*',
                                                      'accept-language': 'en-US,en;q=0.9,vi;q=0.8',
                                                      'authorization': 'Bearer undefined',
                                                      'origin': 'https://mvp.hacknao.edu.vn',
                                                      'priority': 'u=1, i',
                                                      'referer': 'https://mvp.hacknao.edu.vn/',
                                                      'sec-ch-ua': '"Chromium";v="140", "Not=A?Brand";v="24", "Google Chrome";v="140"',
                                                      'sec-ch-ua-mobile': '?0',
                                                      'sec-ch-ua-platform': '"macOS"',
                                                      'sec-fetch-dest': 'empty',
                                                      'sec-fetch-mode': 'cors',
                                                      'sec-fetch-site': 'same-site',
                                                      'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36'
                                                    },
                                                  });

                                                  if (!response.ok) {
                                                    throw new Error('Upload failed');
                                                  }

                                                  const { urls } = await response.json();
                                                  if (urls && urls.length > 0) {
                                                    setEditData(prev => ({
                                                      ...prev,
                                                      back_cccd: urls[0]
                                                    }));
                                                  } else {
                                                    throw new Error('No URL returned from server');
                                                  }
                                                } catch (error) {
                                                  console.error('Error uploading image:', error);
                                                  alert('Lỗi khi tải ảnh lên. Vui lòng thử lại.');
                                                } finally {
                                                  setUploadingBack(false);
                                                }
                                              }
                                            }}
                                          />
                                        </label>
                                      </div>
                                      <p className="text-xs text-gray-500">PNG, JPG, GIF tối đa 10MB</p>
                                      {uploadingBack && (
                                        <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
                                          <div className="w-4 h-4 border-2 border-[#2DA6A2] border-t-transparent rounded-full animate-spin"></div>
                                          <span>Đang tải lên...</span>
                                        </div>
                                      )}
                                    </>
                                  )}
                                </div>
                              </div>
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

                            {/* CCCD Images */}
                            <div>
                              <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">
                                Ảnh mặt trước CCCD
                              </label>
                              {profileData.front_cccd ? (
                                <img
                                  src={profileData.front_cccd}
                                  alt="Mặt trước CCCD"
                                  className="max-h-32 rounded-lg border border-gray-200 cursor-pointer hover:opacity-80 transition-opacity"
                                  onClick={() => setLightboxImage(profileData.front_cccd)}
                                />
                              ) : (
                                <p className="text-sm text-red-500 py-1.5 md:py-2">
                                  Chưa cập nhật
                                </p>
                              )}
                            </div>

                            <div>
                              <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">
                                Ảnh mặt sau CCCD
                              </label>
                              {profileData.back_cccd ? (
                                <img
                                  src={profileData.back_cccd}
                                  alt="Mặt sau CCCD"
                                  className="max-h-32 rounded-lg border border-gray-200 cursor-pointer hover:opacity-80 transition-opacity"
                                  onClick={() => setLightboxImage(profileData.back_cccd)}
                                />
                              ) : (
                                <p className="text-sm text-red-500 py-1.5 md:py-2">
                                  Chưa cập nhật
                                </p>
                              )}
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

      {/* Change Password Modal */}
      {isChangePasswordOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 relative">
            {/* Close button */}
            <button
              onClick={() => setIsChangePasswordOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h3 className="text-xl font-semibold text-gray-900 mb-6">Đổi mật khẩu</h3>

            <form onSubmit={async (e) => {
              e.preventDefault();
              // Validate form
              const errors = {};
              if (!passwordData.currentPassword) {
                errors.currentPassword = "Vui lòng nhập mật khẩu hiện tại";
              }
              if (!passwordData.newPassword) {
                errors.newPassword = "Vui lòng nhập mật khẩu mới";
              }
              if (!passwordData.confirmPassword) {
                errors.confirmPassword = "Vui lòng xác nhận mật khẩu mới";
              } else if (passwordData.newPassword !== passwordData.confirmPassword) {
                errors.confirmPassword = "Mật khẩu xác nhận không khớp";
              }

              if (Object.keys(errors).length > 0) {
                setPasswordErrors(errors);
                return;
              }

              setIsSubmitting(true);
              try {
                const { error: updateError } = await supabase.auth.updateUser({
                  password: passwordData.newPassword
                });

                if (updateError) throw updateError;

                // Reset form and close modal
                setIsChangePasswordOpen(false);
                setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                setPasswordErrors({});
                setShowPasswords({ currentPassword: false, newPassword: false, confirmPassword: false });
                alert("Đổi mật khẩu thành công!");
              } catch (error) {
                console.error("Error updating password:", error);
                alert("Có lỗi xảy ra khi đổi mật khẩu. Vui lòng thử lại.");
              } finally {
                setIsSubmitting(false);
              }
            }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mật khẩu hiện tại <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.currentPassword ? "text" : "password"}
                    value={passwordData.currentPassword}
                    onChange={(e) => {
                      setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }));
                      if (passwordErrors.currentPassword) {
                        setPasswordErrors(prev => ({ ...prev, currentPassword: '' }));
                      }
                    }}
                    className={`w-full px-3 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-[#2DA6A2] focus:border-[#2DA6A2] text-base text-gray-900 ${
                      passwordErrors.currentPassword ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Nhập mật khẩu hiện tại"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(prev => ({ ...prev, currentPassword: !prev.currentPassword }))}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                  >
                    {showPasswords.currentPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    )}
                  </button>
                </div>
                {passwordErrors.currentPassword && (
                  <p className="mt-1 text-sm text-red-600">{passwordErrors.currentPassword}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mật khẩu mới <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.newPassword ? "text" : "password"}
                    value={passwordData.newPassword}
                    onChange={(e) => {
                      setPasswordData(prev => ({ ...prev, newPassword: e.target.value }));
                      if (passwordErrors.newPassword) {
                        setPasswordErrors(prev => ({ ...prev, newPassword: '' }));
                      }
                    }}
                    className={`w-full px-3 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-[#2DA6A2] focus:border-[#2DA6A2] text-base text-gray-900 ${
                      passwordErrors.newPassword ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Nhập mật khẩu mới"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(prev => ({ ...prev, newPassword: !prev.newPassword }))}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                  >
                    {showPasswords.newPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    )}
                  </button>
                </div>
                {passwordErrors.newPassword && (
                  <p className="mt-1 text-sm text-red-600">{passwordErrors.newPassword}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Xác nhận mật khẩu mới <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.confirmPassword ? "text" : "password"}
                    value={passwordData.confirmPassword}
                    onChange={(e) => {
                      setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }));
                      if (passwordErrors.confirmPassword) {
                        setPasswordErrors(prev => ({ ...prev, confirmPassword: '' }));
                      }
                    }}
                    className={`w-full px-3 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-[#2DA6A2] focus:border-[#2DA6A2] text-base text-gray-900 ${
                      passwordErrors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Nhập lại mật khẩu mới"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(prev => ({ ...prev, confirmPassword: !prev.confirmPassword }))}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                  >
                    {showPasswords.confirmPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    )}
                  </button>
                </div>
                {passwordErrors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">{passwordErrors.confirmPassword}</p>
                )}
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsChangePasswordOpen(false);
                    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                    setPasswordErrors({});
                    setShowPasswords({ currentPassword: false, newPassword: false, confirmPassword: false });
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-[#2DA6A2] text-white rounded-lg hover:bg-[#2DA6A2]/90 transition-colors text-sm disabled:bg-[#2DA6A2]/50 disabled:cursor-not-allowed flex items-center justify-center min-w-[100px]"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Đang xử lý...
                    </>
                  ) : (
                    "Đổi mật khẩu"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lightbox Modal */}
      {lightboxImage && (
        <div 
          className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-[60]"
          onClick={() => setLightboxImage(null)}
        >
          <div className="relative max-w-4xl max-h-full">
            <img
              src={lightboxImage}
              alt="Ảnh CCCD"
              className="max-w-full max-h-full object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
}
