"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Header from "@/components/Header";
import { supabase } from "@/lib/supabase";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUserOnline } from "@/app/components/CheckUserOnline";

// Hàm kiểm tra quyền admin
const checkIsAdmin = (currentUserProfile, user) => {
  return (
    (currentUserProfile?.role === 'admin')
  );
};

export default function Home() {
  const router = useRouter();
  const { user } = useAuth();
  const { onlineUsers, isLoading: isLoadingOnlineUsers } = useUserOnline();
  const [currentUserProfile, setCurrentUserProfile] = useState(null);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [formData, setFormData] = useState({
    age: "",
    region: "",
    province: "", // Thêm trường province
  });
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [errors, setErrors] = useState({});
  const dropdownRef = useRef(null);

  const [regions, setRegions] = useState([]);
  const [provinces, setProvinces] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isLoadingFromStorage, setIsLoadingFromStorage] = useState(false);

  // Fetch current user's profile and store in state
  useEffect(() => {
    const fetchCurrentUserProfile = async () => {
      try {
        if (!user?.id) return;
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        if (error) throw error;
        setCurrentUserProfile(data);
        // Auto open guide modal if user hasn't passed
        if (data && data.is_pass === false) {
          setShowGuideModal(true);
        }
      } catch (err) {
        console.error("Error fetching current user profile:", err?.message || err);
      }
    };

    fetchCurrentUserProfile();
  }, [user]);

  // Load recorderInfo from localStorage after regions are loaded
  useEffect(() => {
    const loadRecorderInfo = () => {
      try {
        const savedRecorderInfo = localStorage.getItem("recorderInfo");
        if (savedRecorderInfo) {
          const recorderInfo = JSON.parse(savedRecorderInfo);
          setIsLoadingFromStorage(true);
          setFormData({
            age: recorderInfo.age || "",
            region: recorderInfo.region || "",
            province: recorderInfo.province || "",
          });
        }
      } catch (error) {
        console.error("Error loading recorderInfo from localStorage:", error);
      }
    };

    // Only load recorderInfo after regions are available
    if (regions.length > 0) {
      loadRecorderInfo();
    }
  }, [regions]);

  // Fetch regions
  useEffect(() => {
    const fetchRegions = async () => {
      try {
        setIsLoadingData(true);
        const { data: regionsData, error: regionsError } = await supabase
          .from("regions")
          .select("*")
          .eq("is_active", true)
          .order("name");

        if (regionsError) throw regionsError;

        setRegions(
          regionsData.map((region) => ({
            value: region.code,
            label: region.name,
          }))
        );
      } catch (error) {
        console.error("Error fetching regions:", error.message);
        alert("Không thể tải dữ liệu khu vực. Vui lòng thử lại sau.");
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchRegions();
  }, []);

  // Fetch provinces when region changes
  useEffect(() => {
    const fetchProvinces = async () => {
      try {
        setIsLoadingData(true);
        let query = supabase
          .from("provinces")
          .select("*")
          .eq("is_active", true);

        // Filter by region if selected
        if (formData.region) {
          query = query.eq("region", formData.region);
        }

        const { data: provincesData, error: provincesError } =
          await query.order("name");

        if (provincesError) throw provincesError;

        setProvinces(
          provincesData.map((province) => ({
            value: province.id,
            code: province.code,
            label: province.name,
          }))
        );

        // Reset province selection when region changes (but not when loading from localStorage)
        if (formData.province && !isLoadingFromStorage) {
          setFormData((prev) => ({
            ...prev,
            province: "",
          }));
        }
        
        // Reset the loading flag after provinces are loaded
        if (isLoadingFromStorage) {
          setIsLoadingFromStorage(false);
        }
      } catch (error) {
        console.error("Error fetching provinces:", error.message);
        alert("Không thể tải dữ liệu tỉnh thành. Vui lòng thử lại sau.");
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchProvinces();
  }, [formData.region]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

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

  const handleRegionSelect = (region) => {
    setFormData({
      ...formData,
      region: region.value,
    });
    setIsDropdownOpen(false);
    // Clear error when user selects region
    if (errors.region) {
      setErrors({
        ...errors,
        region: "",
      });
    }
  };

  const getSelectedRegionLabel = () => {
    const selected = regions.find((region) => region.value === formData.region);
    return selected ? selected.label : "Chọn khu vực";
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.age) {
      newErrors.age = "Vui lòng nhập độ tuổi";
    } else if (formData.age < 6 || formData.age > 12) {
      newErrors.age = "Độ tuổi phải từ 6 đến 12";
    }

    if (!formData.region) {
      newErrors.region = "Vui lòng chọn khu vực";
    }

    if (!formData.province) {
      newErrors.province = "Vui lòng chọn tỉnh/thành phố";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (validateForm()) {
      try {
        // Lưu thông tin người thu âm vào localStorage
        const recorderInfo = {
          age: formData.age,
          region: formData.region,
          province: formData.province,
          // Thêm thông tin về tỉnh/thành phố và khu vực để hiển thị
          provinceName:
            provinces.find((p) => p.value === formData.province)?.label || "",
          regionName:
            regions.find((r) => r.value === formData.region)?.label || "",
        };

        localStorage.setItem("recorderInfo", JSON.stringify(recorderInfo));

        // Redirect đến trang record
        router.push("/record");
      } catch (error) {
        console.error("Error saving recorder info:", error);
        alert("Có lỗi xảy ra khi lưu thông tin. Vui lòng thử lại.");
      }
    }
  };
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col">
        <Header />

        {/* Main Content - Centered */}
        <div className="flex-1 flex flex-col items-center justify-center p-3 md:p-4 transform -translate-y-16 md:-translate-y-20">
          {/* Title */}
          <div className="text-center mb-6 md:mb-8 w-full max-w-4xl">
            <h1 className="text-2xl md:text-4xl font-bold text-[#2DA6A2] mb-2 md:mb-4">
              Ứng Dụng Học Tiếng Việt và Tiếng Anh
            </h1>
            <p className="text-base md:text-lg text-gray-600">
              Luyện đọc và trả lời câu hỏi thú vị cho các bạn nhỏ!
            </p>
            {currentUserProfile && (
              <div className="mt-3 md:mt-4 space-y-2">
                <div>
                  <span className="text-sm md:text-base text-gray-700">
                    Trạng thái PASS test đầu vào:
                  </span>{" "}
                  <span
                    className={`text-sm md:text-base font-semibold ${
                      currentUserProfile.is_pass ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {currentUserProfile.is_pass ? "Đã PASS" : "Chưa PASS"}
                  </span>
                </div>
                
                {/* Hiển thị số lượng user online chỉ cho admin */}
                {checkIsAdmin(currentUserProfile, user) && (
                  <div className="flex items-center justify-center">
                    <div className="bg-[#2DA6A2]/10 border border-[#2DA6A2]/20 rounded-lg px-3 py-2">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-sm md:text-base text-[#2DA6A2] font-medium">
                          {isLoadingOnlineUsers ? (
                            <span className="flex items-center">
                              <div className="w-3 h-3 border border-[#2DA6A2] border-t-transparent rounded-full animate-spin mr-2"></div>
                              Đang tải...
                            </span>
                          ) : (
                            `${onlineUsers} người đang online`
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Form Card */}
          <div className="w-full max-w-md">
            <div className="bg-white rounded-2xl shadow-xl p-4 md:p-8">
              <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
                {/* Age Input */}
                <div>
                  <label className="flex items-center text-xs md:text-sm font-medium text-gray-700 mb-2 md:mb-3">
                    <svg
                      className="w-4 h-4 md:w-5 md:h-5 mr-2 text-[#2DA6A2]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    Độ tuổi của con
                  </label>
                  <input
                    type="number"
                    name="age"
                    value={formData.age}
                    onChange={handleChange}
                    min="6"
                    max="12"
                    required
                    className={`w-full px-3 py-2 md:px-4 md:py-3 text-base text-gray-900 border rounded-lg focus:ring-2 focus:ring-[#2DA6A2] focus:border-[#2DA6A2] transition-colors ${
                      errors.age ? "border-red-300" : "border-[#2DA6A2]"
                    }`}
                    placeholder="Nhập tuổi (6-12)"
                  />
                  {errors.age && (
                    <p className="mt-1 text-sm text-red-600">{errors.age}</p>
                  )}
                </div>

                {/* Region Dropdown */}
                <div>
                  <label className="flex items-center text-xs md:text-sm font-medium text-gray-700 mb-2 md:mb-3">
                    <svg
                      className="w-4 h-4 md:w-5 md:h-5 mr-2 text-[#2DA6A2]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    Khu vực
                  </label>
                  <div className="relative" ref={dropdownRef}>
                    {/* Custom Dropdown Button */}
                    <button
                      type="button"
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      disabled={isLoadingData}
                      className={`w-full px-4 py-3 pr-4 text-base text-gray-900 border rounded-lg focus:ring-2 focus:ring-[#2DA6A2] focus:border-[#2DA6A2] transition-colors bg-white text-left flex items-center justify-between ${
                        errors.region ? "border-red-300" : "border-[#2DA6A2]"
                      } ${
                        isLoadingData ? "cursor-not-allowed bg-gray-50" : ""
                      }`}
                    >
                      {isLoadingData ? (
                        <div className="flex items-center text-gray-500">
                          <div className="w-4 h-4 border-2 border-[#2DA6A2] border-t-transparent rounded-full animate-spin mr-2"></div>
                          <span>Đang tải...</span>
                        </div>
                      ) : (
                        <span
                          className={
                            formData.region ? "text-gray-900" : "text-gray-500"
                          }
                        >
                          {getSelectedRegionLabel()}
                        </span>
                      )}
                      <svg
                        className={`w-4 h-4 text-[#2DA6A2] transition-transform ${
                          isDropdownOpen ? "rotate-180" : ""
                        } ${isLoadingData ? "opacity-50" : ""}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>

                    {/* Dropdown Options */}
                    {isDropdownOpen && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-[#2DA6A2] rounded-lg shadow-lg">
                        {regions.map((region) => (
                          <button
                            key={region.value}
                            type="button"
                            onClick={() => handleRegionSelect(region)}
                            className={`w-full px-4 py-3 text-left text-base transition-colors first:rounded-t-lg last:rounded-b-lg hover:bg-[#2DA6A2]/10 ${
                              formData.region === region.value
                                ? "bg-[#2DA6A2]/20 text-[#2DA6A2] font-medium"
                                : "text-gray-900 hover:text-[#2DA6A2]"
                            }`}
                          >
                            <div className="flex items-center">
                              <div
                                className={`w-2 h-2 rounded-full mr-3 ${
                                  formData.region === region.value
                                    ? "bg-[#2DA6A2]"
                                    : "bg-gray-300"
                                }`}
                              ></div>
                              {region.label}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {errors.region && (
                    <p className="mt-1 text-sm text-red-600">{errors.region}</p>
                  )}
                </div>

                {/* Province Dropdown */}
                <div>
                  <label className="flex items-center text-xs md:text-sm font-medium text-gray-700 mb-2 md:mb-3">
                    <svg
                      className="w-4 h-4 md:w-5 md:h-5 mr-2 text-[#2DA6A2]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"
                      />
                    </svg>
                    Tỉnh/Thành phố
                  </label>
                  <div className="relative">
                    <div className="relative">
                      <select
                        placeholder="Chọn tỉnh/thành phố"
                        name="province"
                        value={formData.province}
                        onChange={handleChange}
                        required
                        disabled={isLoadingData || !formData.region}
                        className={`w-full px-3 py-2 md:px-4 md:py-3 text-base text-gray-900 border rounded-lg focus:ring-2 focus:ring-[#2DA6A2] focus:border-[#2DA6A2] transition-colors appearance-none bg-white ${
                          errors.province
                            ? "border-red-300"
                            : "border-[#2DA6A2]"
                        } ${
                          isLoadingData || !formData.region
                            ? "bg-gray-50 cursor-not-allowed"
                            : ""
                        }`}
                      >
                        <option value="" className="text-gray-500">
                          {isLoadingData
                            ? "Đang tải..."
                            : !formData.region
                            ? "Vui lòng chọn khu vực trước"
                            : "Chọn tỉnh/thành phố"}
                        </option>
                        {!isLoadingData &&
                          provinces.map((province) => (
                            <option key={province.value} value={province.value}>
                              {province.label}
                            </option>
                          ))}
                      </select>
                      {isLoadingData && (
                        <div className="absolute right-10 top-1/2 transform -translate-y-1/2">
                          <div className="w-4 h-4 border-2 border-[#2DA6A2] border-t-transparent rounded-full animate-spin"></div>
                        </div>
                      )}
                    </div>
                    <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                      <svg
                        className="w-4 h-4 text-[#2DA6A2]"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </div>
                  </div>
                  {errors.province && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.province}
                    </p>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  className="w-full bg-[#2DA6A2] hover:bg-[#2DA6A2]/90 text-white font-medium py-3 px-4 md:py-4 md:px-6 rounded-lg transition-colors text-base md:text-lg"
                >
                  Bắt Đầu Ngay
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
      {/* Guide Modal for users not passed */}
      {showGuideModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[9999]">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 relative">
            <button
              onClick={() => setShowGuideModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              aria-label="Đóng"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-3">Hướng dẫn thu âm</h3>
            <p className="text-sm md:text-base text-gray-600 mb-5">Để đảm bảo chất lượng thu âm, Phụ huynh vui lòng đọc kỹ NGUYÊN TẮC THU ÂM trước khi thực hiện.</p>
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => {
                  window.open('/huong-dan-thu-am.pdf', '_blank');
                }}
                className="flex-1 whitespace-nowrap px-4 py-2 bg-[#2DA6A2] text-white rounded-lg hover:bg-[#2DA6A2]/90 transition-colors text-sm md:text-base"
              >
                Hướng dẫn thu âm
              </button>
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm md:text-base whitespace-nowrap"
              >
                Bỏ qua
              </button>
            </div>
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
}
