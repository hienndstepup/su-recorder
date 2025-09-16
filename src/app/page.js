"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Header from "@/components/Header";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    age: "",
    region: "",
  });
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [errors, setErrors] = useState({});
  const dropdownRef = useRef(null);

  const regions = [
    { value: "north", label: "Miền Bắc" },
    { value: "central", label: "Miền Trung" },
    { value: "south", label: "Miền Nam" },
  ];

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
    } else if (formData.age < 3 || formData.age > 18) {
      newErrors.age = "Độ tuổi phải từ 3 đến 18";
    }

    if (!formData.region) {
      newErrors.region = "Vui lòng chọn khu vực";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (validateForm()) {
      // Redirect đến trang record
      router.push("/record");
    }
  };
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col">
        <Header />

        {/* Main Content - Centered */}
        <div className="flex-1 flex flex-col items-center justify-center p-4 transform -translate-y-20">
          {/* Title */}
          <div className="text-center mb-8 w-full max-w-4xl">
            <h1 className="text-3xl md:text-4xl font-bold text-[#2DA6A2] mb-4">
              Ứng Dụng Học Tiếng Việt và Tiếng Anh
            </h1>
            <p className="text-lg text-gray-600">
              Luyện đọc và trả lời câu hỏi thú vị cho các bạn nhỏ!
            </p>
          </div>

          {/* Form Card */}
          <div className="w-full max-w-md">
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Age Input */}
                <div>
                  <label className="flex items-center text-sm font-medium text-gray-700 mb-3">
                    <svg
                      className="w-5 h-5 mr-2 text-[#2DA6A2]"
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
                    min="3"
                    max="18"
                    required
                    className={`w-full px-4 py-3 text-base text-gray-900 border rounded-lg focus:ring-2 focus:ring-[#2DA6A2] focus:border-[#2DA6A2] transition-colors ${
                      errors.age ? "border-red-300" : "border-[#2DA6A2]"
                    }`}
                    placeholder="Nhập tuổi (3-18)"
                  />
                  {errors.age && (
                    <p className="mt-1 text-sm text-red-600">{errors.age}</p>
                  )}
                </div>

                {/* Region Dropdown */}
                <div>
                  <label className="flex items-center text-sm font-medium text-gray-700 mb-3">
                    <svg
                      className="w-5 h-5 mr-2 text-[#2DA6A2]"
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
                      className={`w-full px-4 py-3 pr-4 text-base text-gray-900 border rounded-lg focus:ring-2 focus:ring-[#2DA6A2] focus:border-[#2DA6A2] transition-colors bg-white text-left flex items-center justify-between ${
                        errors.region ? "border-red-300" : "border-[#2DA6A2]"
                      }`}
                    >
                      <span
                        className={
                          formData.region ? "text-gray-900" : "text-gray-500"
                        }
                      >
                        {getSelectedRegionLabel()}
                      </span>
                      <svg
                        className={`w-4 h-4 text-[#2DA6A2] transition-transform ${
                          isDropdownOpen ? "rotate-180" : ""
                        }`}
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

                {/* Submit Button */}
                <button
                  type="submit"
                  className="w-full bg-[#2DA6A2] hover:bg-[#2DA6A2]/90 text-white font-medium py-4 px-6 rounded-lg transition-colors text-lg"
                >
                  Bắt Đầu Ngay
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
