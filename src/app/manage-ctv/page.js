"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import Header from "@/components/Header";
import { supabase, supabaseAdmin } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { normalizeText, calculatePaymentAmount } from "@/lib";

// Loading component
function LoadingState() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col">
      <Header />
      <div className="flex-1 p-3 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-4 animate-pulse">
            <div className="h-8 md:h-10 bg-gray-200 rounded w-1/3 mb-2"></div>
            <div className="h-5 md:h-6 bg-gray-200 rounded w-1/2"></div>
          </div>
          <div className="flex flex-col md:flex-row md:justify-between md:items-start space-y-4 md:space-y-0 mb-4">
            <div className="flex flex-col space-y-4 md:space-y-0 md:flex-row md:items-end md:space-x-4">
              <div className="h-11 bg-gray-200 rounded w-full md:w-60"></div>
              <div className="h-11 bg-gray-200 rounded w-full md:w-32"></div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 animate-pulse">
            <div className="space-y-4">
              <div className="h-6 bg-gray-200 rounded w-1/4"></div>
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-gray-100 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Hàm kiểm tra quyền admin
const checkIsAdmin = (currentUserProfile, user) => {
  return (
    (currentUserProfile?.role === 'admin') || 
    (user?.email === 'tragiangnt.tele@stepup.com.vn') || 
    (user?.email === 'moht.hr@stepup.edu.vn')
  );
};

// Main component
function ManageCTVPageContent() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [currentUserProfile, setCurrentUserProfile] = useState(null);

  // Lấy giá trị từ URL params hoặc dùng giá trị mặc định
  const [searchTerm, setSearchTerm] = useState(
    searchParams.get("search") || ""
  );
  const [sortBy, setSortBy] = useState(searchParams.get("sort") || "all"); // "all", "most", "least"
  const [passFilter, setPassFilter] = useState(searchParams.get("pass") || "all"); // "all", "passed", "not_passed"

  // Hàm cập nhật URL params
  const updateUrlParams = (params) => {
    const newSearchParams = new URLSearchParams(searchParams);

    // Cập nhật hoặc xóa params
    Object.entries(params).forEach(([key, value]) => {
      if (value) {
        newSearchParams.set(key, value);
      } else {
        newSearchParams.delete(key);
      }
    });

    // Cập nhật URL
    router.push(`?${newSearchParams.toString()}`, { scroll: false });
  };

  // Hàm xóa tất cả bộ lọc
  const clearAllFilters = () => {
    setSearchTerm("");
    setSortBy("all");
    setPassFilter("all");
    router.push(pathname, { scroll: false }); // Xóa tất cả params trên URL
  };

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
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedCTV, setSelectedCTV] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedUserDetail, setSelectedUserDetail] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [uploadingFront, setUploadingFront] = useState(false);
  const [uploadingBack, setUploadingBack] = useState(false);
  const [lightboxImage, setLightboxImage] = useState(null);

  // Gán CTV UI state (for User Detail Modal)
  const [isAssigningCTV, setIsAssigningCTV] = useState(false);
  const [assignCTVValue, setAssignCTVValue] = useState("");

  // Copy affiliate_code tooltip state
  const [copiedAffiliate, setCopiedAffiliate] = useState(false);

  // Reset password modal state
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);
  const [selectedUserForReset, setSelectedUserForReset] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [resetPasswordErrors, setResetPasswordErrors] = useState({});
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

  const handleCopyAffiliate = async () => {
    try {
      if (!selectedUserDetail?.affiliate_code) return;
      await navigator.clipboard.writeText(selectedUserDetail.affiliate_code);
      setCopiedAffiliate(true);
      setTimeout(() => setCopiedAffiliate(false), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  const [ctvList, setCtvList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch danh sách CTV
  useEffect(() => {
    const fetchCTVList = async () => {
      try {
        if (!user) return; // Không fetch nếu chưa có user

        setIsLoading(true);

        // Lấy danh sách profiles của CTV
        const { data: profilesData, error: profilesError } = await supabase
          .from("profiles")
          .select("*")
          .eq("role", "ctv")
          .neq("id", user.id) // Loại trừ profile của người dùng hiện tại
          .order("created_at", { ascending: false });

        if (profilesError) throw profilesError;

        // Lấy email từ auth.users cho CTV cấp dưới
        const { data: authUsersData, error: authUsersError } =
          await supabase.rpc("get_auth_users_emails", { current_user_id: user.id });

        if (authUsersError) {
          console.error("Error fetching auth users emails:", authUsersError);
          // Fallback: set profiles data without emails
          setCtvList(profilesData);
          return;
        }

        // Map email với profilesData
        const profilesWithEmails = profilesData.map((profile) => {
          const authUser = authUsersData.find(
            (authUser) => authUser.id === profile.id
          );
          console.log(`Profile ${profile.id}:`, profile.full_name, '-> Auth user:', authUser);
          return {
            ...profile,
            email: authUser ? authUser.email : null,
          };
        });

        setCtvList(profilesWithEmails);
      } catch (error) {
        console.error("Error fetching CTV list:", error.message);
        alert("Không thể tải danh sách CTV. Vui lòng thử lại sau.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCTVList();
  }, [user]); // Thêm user vào dependency array

  // Filter and sort CTV list
  const filteredCTV = ctvList
    .filter((ctv) => {
      if (!searchTerm) return true;
      const normalizedSearch = normalizeText(searchTerm);
      const normalizedName = normalizeText(ctv.full_name || "");
      const emailLower = (ctv.email || "").toLowerCase();
      return (
        normalizedName.includes(normalizedSearch) ||
        emailLower.includes(normalizedSearch.toLowerCase())
      );
    })
    .filter((ctv) => {
      if (passFilter === "passed") return !!ctv.is_pass;
      if (passFilter === "not_passed") return !ctv.is_pass;
      return true; // all
    })
    .sort((a, b) => {
      if (sortBy === "most") {
        return (b.total_recordings || 0) - (a.total_recordings || 0);
      } else if (sortBy === "least") {
        return (a.total_recordings || 0) - (b.total_recordings || 0);
      }
      return 0; // "all" - giữ nguyên thứ tự
    });

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

  // Validation cho reset password
  const validateResetPassword = () => {
    const newErrors = {};

    if (!newPassword) {
      newErrors.newPassword = "Mật khẩu mới không được để trống";
    } else if (newPassword.length < 6) {
      newErrors.newPassword = "Mật khẩu phải có ít nhất 6 ký tự";
    }

    if (!confirmNewPassword) {
      newErrors.confirmNewPassword = "Vui lòng nhập lại mật khẩu mới";
    } else if (newPassword !== confirmNewPassword) {
      newErrors.confirmNewPassword = "Mật khẩu không khớp";
    }

    setResetPasswordErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Xử lý reset password
  const handleResetPassword = async () => {
    if (validateResetPassword()) {
      try {
        // Gọi Supabase Admin API để update mật khẩu
        const { error } = await supabaseAdmin.auth.admin.updateUserById(
          selectedUserForReset.id,
          { password: newPassword }
        );

        if (error) throw error;

        // Reset form và đóng modal
        setIsResetPasswordModalOpen(false);
        setSelectedUserForReset(null);
        setNewPassword("");
        setConfirmNewPassword("");
        setResetPasswordErrors({});
        setShowNewPassword(false);
        setShowConfirmNewPassword(false);

        // Thông báo thành công
        alert(`Reset mật khẩu thành công cho ${selectedUserForReset.full_name || selectedUserForReset.email}!`);
      } catch (error) {
        console.error("Error resetting password:", error.message);
        setResetPasswordErrors({ submit: error.message });
      }
    }
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
              <Link
                href={`/manage-ctv/${user?.id}`}
                className="inline-flex items-center text-[#2DA6A2] hover:text-[#2DA6A2]/80 text-sm md:text-base font-medium mt-2"
              >
                <span>Xem bài ghi âm của tôi</span>
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

            {/* Actions */}
            <div className="flex flex-col md:flex-row md:justify-between md:items-start space-y-4 md:space-y-0 mb-4">
              {/* Search and Sort */}
              <div className="flex flex-col space-y-4 md:space-y-0 md:flex-row md:items-end md:space-x-4">
                {/* Search Input */}
                <div className="flex flex-col space-y-1">
                  <label className="text-xs text-gray-600 font-medium">
                    Tìm kiếm
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => {
                        const value = e.target.value;
                        setSearchTerm(value);
                        updateUrlParams({ search: value || null });
                      }}
                      placeholder="Tìm theo tên hoặc email..."
                      className="text-gray-700 pl-10 pr-4 h-9 md:h-11 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2DA6A2] focus:border-[#2DA6A2] text-sm md:text-base w-full md:w-60"
                    />
                    <svg
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 md:h-5 md:w-5 text-gray-400"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>
                </div>

                {/* Sort Select */}
                <div className="flex flex-col space-y-1">
                  <label className="text-xs text-gray-600 font-medium">
                    Số bài ghi âm
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => {
                      const value = e.target.value;
                      setSortBy(value);
                      updateUrlParams({ sort: value === "all" ? null : value });
                    }}
                    className="text-gray-700 px-3 md:px-4 h-9 md:h-11 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2DA6A2] focus:border-[#2DA6A2] text-sm md:text-base bg-white w-full md:w-auto md:min-w-[120px]"
                  >
                    <option value="all">Tất cả</option>
                    <option value="most">Nhiều nhất</option>
                    <option value="least">Ít nhất</option>
                  </select>
                </div>

                {/* PASS Filter */}
                <div className="flex flex-col space-y-1">
                  <label className="text-xs text-gray-600 font-medium">
                    PASS
                  </label>
                  <select
                    value={passFilter}
                    onChange={(e) => {
                      const value = e.target.value;
                      setPassFilter(value);
                      updateUrlParams({ pass: value === "all" ? null : value });
                    }}
                    className="text-gray-700 px-3 md:px-4 h-9 md:h-11 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2DA6A2] focus:border-[#2DA6A2] text-sm md:text-base bg-white w-full md:w-auto md:min-w-[140px]"
                  >
                    <option value="all">Tất cả</option>
                    <option value="passed">Đã pass</option>
                    <option value="not_passed">Chưa pass</option>
                  </select>
                </div>

                {/* Clear Filters Button - Only show if there are active filters */}
                {(searchTerm || sortBy !== "all" || passFilter !== "all") && (
                  <button
                    onClick={clearAllFilters}
                    className="inline-flex items-center px-3 py-1.5 md:px-4 md:py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm md:text-base rounded-lg transition-colors mt-4 md:mt-0"
                  >
                    <svg
                      className="w-4 h-4 mr-1.5"
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
                    Xóa bộ lọc
                  </button>
                )}
              </div>

              {checkIsAdmin(currentUserProfile, user) && (
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="bg-[#2DA6A2] hover:bg-[#2DA6A2]/90 text-white font-medium py-1.5 px-4 md:py-2 md:px-6 rounded-lg transition-colors flex items-center text-sm md:text-base w-full md:w-auto justify-center md:justify-start"
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
              )}
            </div>

            {/* CTV List */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <h3 className="text-base md:text-lg font-semibold text-gray-900">
                    Danh sách CTV ({filteredCTV.length}/{ctvList.length})
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
                          calculatePaymentAmount(
                            ctvList.reduce(
                              (sum, ctv) => sum + (ctv.total_duration || 0),
                              0
                            )
                          )
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
                          STT
                        </th>
                        <th className="px-4 md:px-6 py-2 md:py-3 text-left text-[10px] md:text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                          Họ và tên
                        </th>
                        <th className="px-4 md:px-6 py-2 md:py-3 text-left text-[10px] md:text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                          PASS
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
                          Ngày tạo
                        </th>
                        <th className="px-4 md:px-6 py-2 md:py-3 text-left text-[10px] md:text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                          Hành động
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredCTV.map((ctv, index) => (
                        <tr key={ctv.id} className="hover:bg-gray-50">
                          <td className="px-4 md:px-6 py-4 whitespace-nowrap text-[10px] md:text-sm text-gray-900 text-center">
                            {index + 1}
                          </td>
                          <td
                            className="px-6 py-4 whitespace-nowrap cursor-pointer hover:bg-gray-50 group"
                            onClick={() => {
                              setSelectedUserDetail(ctv);
                              setIsDetailModalOpen(true);
                            }}
                          >
                            <div className="flex items-center">
                              <div
                                className={`w-8 h-8 overflow-hidden md:w-10 md:h-10 bg-[#2DA6A2] rounded-full flex items-center justify-center border-2 ${
                                  ctv.phone &&
                                  ctv.id_number &&
                                  ctv.address &&
                                  ctv.bank_account_name &&
                                  ctv.bank_name &&
                                  ctv.bank_account_number
                                    ? "border-[#2DA6A2]"
                                    : !ctv.phone &&
                                      !ctv.id_number &&
                                      !ctv.address &&
                                      !ctv.bank_account_name &&
                                      !ctv.bank_name &&
                                      !ctv.bank_account_number
                                    ? "border-red-500"
                                    : "border-orange-400"
                                }`}
                              >
                                <span className="text-white text-xs md:text-sm font-medium">
                                  {(ctv.full_name || "")
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")}
                                </span>
                              </div>
                              <div className="ml-4">
                                <div className="text-xs md:text-sm font-medium text-gray-900 group-hover:text-[#2DA6A2] transition-colors text-left">
                                  {ctv.full_name || "Chưa cập nhật"}
                                </div>
                                <div className="text-[10px] md:text-xs text-gray-500 mt-0.5">
                                  {ctv.email || "Chưa có email"}
                                </div>
                                <div className="text-[10px] md:text-xs mt-0.5">
                                  {ctv.phone &&
                                  ctv.id_number &&
                                  ctv.address &&
                                  ctv.bank_account_name &&
                                  ctv.bank_name &&
                                  ctv.bank_account_number ? (
                                    <span className="text-[#2DA6A2]">
                                      Đầy đủ thông tin
                                    </span>
                                  ) : !ctv.phone &&
                                    !ctv.id_number &&
                                    !ctv.address &&
                                    !ctv.bank_account_name &&
                                    !ctv.bank_name &&
                                    !ctv.bank_account_number ? (
                                    <span className="text-red-500">
                                      Chưa điền thông tin
                                    </span>
                                  ) : (
                                    <span className="text-orange-400">
                                      Thiếu thông tin
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 md:px-6 py-3 md:py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <button
                                onClick={async () => {
                                  try {
                                    console.log(
                                      "Updating is_pass for user:",
                                      ctv.id,
                                      "to:",
                                      !ctv.is_pass
                                    );
                                    const { error } = await supabase.rpc(
                                      "update_profile_info",
                                      {
                                        profile_id: ctv.id,
                                        new_is_pass: !ctv.is_pass,
                                      }
                                    );

                                    console.log("Update response:", { error });
                                    if (error) throw error;

                                    // Update local state
                                    setCtvList((prev) =>
                                      prev.map((item) =>
                                        item.id === ctv.id
                                          ? { ...item, is_pass: !item.is_pass }
                                          : item
                                      )
                                    );
                                  } catch (error) {
                                    console.error(
                                      "Error updating pass status:",
                                      error
                                    );
                                    alert(
                                      "Có lỗi xảy ra khi cập nhật trạng thái. Vui lòng thử lại."
                                    );
                                  }
                                }}
                                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#2DA6A2] focus:ring-offset-2 ${
                                  ctv.is_pass ? "bg-[#2DA6A2]" : "bg-gray-200"
                                }`}
                                role="switch"
                                aria-checked={ctv.is_pass}
                              >
                                <span
                                  aria-hidden="true"
                                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                    ctv.is_pass
                                      ? "translate-x-5"
                                      : "translate-x-0"
                                  }`}
                                />
                              </button>
                            </div>
                          </td>
                          <td className="px-4 md:px-6 py-3 md:py-4 whitespace-nowrap">
                            <div className="flex flex-col items-start space-y-1">
                              <span className="text-xs md:text-sm text-gray-900 font-medium">
                                {ctv.total_recordings}
                              </span>
                              <Link
                                href={`/manage-ctv/${ctv.id}`}
                                className="text-[#2DA6A2] bg-[#2DA6A2]/5 hover:bg-[#2DA6A2]/10 px-1.5 md:px-2 py-0.5 md:py-1 rounded transition-colors text-xs md:text-sm"
                              >
                                Xem
                              </Link>
                            </div>
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
                            }).format(
                              calculatePaymentAmount(ctv.total_duration || 0)
                            )}
                          </td>
                          <td className="px-4 md:px-6 py-3 md:py-4 whitespace-nowrap text-xs md:text-sm text-gray-900">
                            {new Date(ctv.created_at).toLocaleDateString(
                              "vi-VN"
                            )}
                          </td>
                          <td className="px-4 md:px-6 py-3 md:py-4 whitespace-nowrap text-xs md:text-sm font-medium">
                            <div className="flex flex-col md:flex-row space-y-1 md:space-y-0 md:space-x-2">
                              {checkIsAdmin(currentUserProfile, user) && (
                                <button
                                  onClick={() => {
                                    setSelectedUserForReset(ctv);
                                    setIsResetPasswordModalOpen(true);
                                    setNewPassword("");
                                    setConfirmNewPassword("");
                                    setResetPasswordErrors({});
                                  }}
                                  className="cursor-pointer text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-1.5 md:px-2 py-0.5 md:py-1 rounded transition-colors text-xs md:text-sm"
                                >
                                  Reset MK
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  setSelectedCTV(ctv);
                                  setIsDeleteModalOpen(true);
                                }}
                                className="cursor-pointer text-red-600 hover:text-red-700 hover:bg-red-50 px-1.5 md:px-2 py-0.5 md:py-1 rounded transition-colors text-xs md:text-sm"
                              >
                                Xóa
                              </button>
                            </div>
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[9999]">
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

      {/* User Detail Modal */}
      {isDetailModalOpen && selectedUserDetail && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-[9999]">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 relative max-h-[90vh] overflow-y-auto">
            {/* Close button */}
            <button
              onClick={() => {
                setIsDetailModalOpen(false);
                setSelectedUserDetail(null);
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            {/* Header with Avatar */}
            <div className="flex items-center mb-6">
              <div
                className={`w-12 h-12 md:w-14 md:h-14 bg-[#2DA6A2] rounded-full flex items-center justify-center border-2 ${
                  selectedUserDetail.phone &&
                  selectedUserDetail.id_number &&
                  selectedUserDetail.address &&
                  selectedUserDetail.bank_account_name &&
                  selectedUserDetail.bank_name &&
                  selectedUserDetail.bank_account_number
                    ? "border-[#2DA6A2]"
                    : !selectedUserDetail.phone &&
                      !selectedUserDetail.id_number &&
                      !selectedUserDetail.address &&
                      !selectedUserDetail.bank_account_name &&
                      !selectedUserDetail.bank_name &&
                      !selectedUserDetail.bank_account_number
                    ? "border-red-500"
                    : "border-orange-400"
                }`}
              >
                <span className="text-white text-lg font-medium">
                  {(selectedUserDetail.full_name || "")
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </span>
              </div>
              <div className="ml-4">
                <h3 className="text-xl font-semibold text-gray-900">
                  {selectedUserDetail.full_name || "Chưa cập nhật"}
                </h3>
                <div className="flex items-center space-x-2 mt-0.5">
                  <p className="text-sm text-[#2DA6A2] font-medium">
                    {selectedUserDetail.affiliate_code}
                  </p>
                  <button
                    type="button"
                    onClick={handleCopyAffiliate}
                    className="relative inline-flex items-center p-1.5 rounded hover:bg-gray-100 text-gray-600"
                    title="Sao chép"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M4 4a2 2 0 012-2h5a1 1 0 110 2H6v9a2 2 0 01-2 2H3a1 1 0 110-2h1V4z" />
                      <path d="M8 8a2 2 0 012-2h5a2 2 0 012 2v8a2 2 0 01-2 2h-5a2 2 0 01-2-2V8z" />
                    </svg>
                    {copiedAffiliate && (
                      <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                        Đã sao chép
                      </span>
                    )}
                  </button>
                </div>

                {/* Gán CTV action */}
                <div className="mt-2">
                  {!isAssigningCTV ? (
                    <button
                      type="button"
                      onClick={() => setIsAssigningCTV(true)}
                      className="inline-flex items-center px-3 py-1.5 text-xs md:text-sm rounded-md border border-[#2DA6A2] text-[#2DA6A2] hover:bg-[#2DA6A2] hover:text-white transition-colors"
                    >
                      Gán ctv
                    </button>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={assignCTVValue}
                        onChange={(e) => setAssignCTVValue(e.target.value)}
                        placeholder="Nhập mã CTV"
                        className="px-3 py-1.5 text-xs md:text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-[#2DA6A2] focus:border-[#2DA6A2] text-gray-900"
                      />
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            if (!assignCTVValue.trim()) return;
                            // child is selected user detail
                            const childId = selectedUserDetail?.id;
                            if (!childId) return;
                            const { data, error } = await supabase.rpc(
                              'assign_ctv_by_affiliate_code',
                              {
                                child_profile_id: childId,
                                target_affiliate_code: assignCTVValue.trim(),
                              }
                            );
                            if (error) throw error;

                            // Update UI: update selectedUserDetail.referrer_id
                            if (data && data.length > 0) {
                              setSelectedUserDetail(prev => ({
                                ...prev,
                                referrer_id: data[0].new_referrer_id,
                              }));
                            }

                            // Reset assign UI
                            setIsAssigningCTV(false);
                            setAssignCTVValue('');
                          } catch (err) {
                            console.error('Assign CTV failed:', err);
                            alert('Không thể gán CTV. Vui lòng kiểm tra mã CTV và thử lại.');
                          }
                        }}
                        className="px-3 py-1.5 text-xs md:text-sm bg-[#2DA6A2] text-white rounded-md hover:bg-[#2DA6A2]/90"
                      >
                        Gán
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsAssigningCTV(false);
                          setAssignCTVValue("");
                        }}
                        className="px-3 py-1.5 text-xs md:text-sm border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                      >
                        Hủy
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Signature Section */}
            <div className="mb-6">
              {selectedUserDetail.signature ? (
                <button
                  onClick={() => setLightboxImage(selectedUserDetail.signature)}
                  className="w-full flex items-center justify-between p-3 bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg transition-colors group"
                >
                  <div className="flex items-center">
                    <svg
                      className="w-5 h-5 text-green-600 mr-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                      />
                    </svg>
                    <span className="text-sm font-medium text-green-700">
                      Chữ ký
                    </span>
                  </div>
                  <div className="flex items-center text-green-600">
                    <span className="text-xs mr-2">Đã ký</span>
                    <svg
                      className="w-4 h-4 group-hover:translate-x-1 transition-transform"
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
                  </div>
                </button>
              ) : (
                <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="flex items-center">
                    <svg
                      className="w-5 h-5 text-gray-400 mr-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                      />
                    </svg>
                    <span className="text-sm font-medium text-gray-500">
                      Chữ ký
                    </span>
                  </div>
                  <span className="text-xs text-gray-400">Chưa ký</span>
                </div>
              )}
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Info Section */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-gray-900 border-b pb-2">
                  Thông tin cơ bản
                </h4>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-500">Họ và tên</p>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editData.full_name}
                        onChange={(e) =>
                          setEditData((prev) => ({
                            ...prev,
                            full_name: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2DA6A2] focus:border-[#2DA6A2] text-gray-900"
                        placeholder="Nhập họ và tên"
                      />
                    ) : (
                      <p
                        className={`text-sm ${
                          selectedUserDetail.full_name
                            ? "text-gray-900"
                            : "text-red-500"
                        }`}
                      >
                        {selectedUserDetail.full_name || "Chưa cập nhật"}
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Vai trò</p>
                    <p className="text-sm text-gray-900">
                      {selectedUserDetail.role === "ctv"
                        ? "Cộng tác viên"
                        : "Admin"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Trạng thái</p>
                    <p
                      className={`text-sm ${
                        selectedUserDetail.status === "active"
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {selectedUserDetail.status === "active"
                        ? "Hoạt động"
                        : "Không hoạt động"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Số điện thoại</p>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editData.phone}
                        onChange={(e) =>
                          setEditData((prev) => ({
                            ...prev,
                            phone: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2DA6A2] focus:border-[#2DA6A2] text-gray-900"
                        placeholder="Nhập số điện thoại"
                      />
                    ) : (
                      <p
                        className={`text-sm ${
                          selectedUserDetail.phone
                            ? "text-gray-900"
                            : "text-red-500"
                        }`}
                      >
                        {selectedUserDetail.phone || "Chưa cập nhật"}
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Số CCCD</p>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editData.id_number}
                        onChange={(e) =>
                          setEditData((prev) => ({
                            ...prev,
                            id_number: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2DA6A2] focus:border-[#2DA6A2] text-gray-900"
                        placeholder="Nhập số CCCD"
                      />
                    ) : (
                      <p
                        className={`text-sm ${
                          selectedUserDetail.id_number
                            ? "text-gray-900"
                            : "text-red-500"
                        }`}
                      >
                        {selectedUserDetail.id_number || "Chưa cập nhật"}
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Địa chỉ</p>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editData.address}
                        onChange={(e) =>
                          setEditData((prev) => ({
                            ...prev,
                            address: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2DA6A2] focus:border-[#2DA6A2] text-gray-900"
                        placeholder="Nhập địa chỉ"
                      />
                    ) : (
                      <p
                        className={`text-sm ${
                          selectedUserDetail.address
                            ? "text-gray-900"
                            : "text-red-500"
                        }`}
                      >
                        {selectedUserDetail.address || "Chưa cập nhật"}
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Ảnh mặt trước CCCD</p>
                    {isEditing ? (
                      <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-[#2DA6A2] transition-colors">
                        <div className="space-y-1 text-center">
                          {editData.front_cccd ? (
                            <div className="relative">
                              <img
                                src={editData.front_cccd}
                                alt="Mặt trước CCCD"
                                className="max-h-32 mx-auto cursor-pointer hover:opacity-80 transition-opacity"
                                onClick={() =>
                                  setLightboxImage(editData.front_cccd)
                                }
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  setEditData((prev) => ({
                                    ...prev,
                                    front_cccd: "",
                                  }))
                                }
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-4 w-4"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              </button>
                            </div>
                          ) : (
                            <>
                              <svg
                                className="mx-auto h-12 w-12 text-gray-400"
                                stroke="currentColor"
                                fill="none"
                                viewBox="0 0 48 48"
                              >
                                <path
                                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                              <div className="flex text-sm text-gray-600">
                                <label className="relative cursor-pointer rounded-md font-medium text-[#2DA6A2] hover:text-[#2DA6A2]/90 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-[#2DA6A2]">
                                  <span>Tải ảnh lên</span>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={async (e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        setUploadingFront(true);
                                        try {
                                          const formData = new FormData();
                                          formData.append("files", file);
                                          formData.append(
                                            "fileTypes",
                                            file.type
                                          );
                                          formData.append(
                                            "objectKey",
                                            "web_mvp/sub_recordings/thumb"
                                          );

                                          const response = await fetch(
                                            "https://mvp-api.hacknao.edu.vn/api/v1/upload",
                                            {
                                              method: "POST",
                                              body: formData,
                                              headers: {
                                                accept:
                                                  "application/json, text/plain, */*",
                                                "accept-language":
                                                  "en-US,en;q=0.9,vi;q=0.8",
                                                authorization:
                                                  "Bearer undefined",
                                                origin:
                                                  "https://mvp.hacknao.edu.vn",
                                                priority: "u=1, i",
                                                referer:
                                                  "https://mvp.hacknao.edu.vn/",
                                                "sec-ch-ua":
                                                  '"Chromium";v="140", "Not=A?Brand";v="24", "Google Chrome";v="140"',
                                                "sec-ch-ua-mobile": "?0",
                                                "sec-ch-ua-platform": '"macOS"',
                                                "sec-fetch-dest": "empty",
                                                "sec-fetch-mode": "cors",
                                                "sec-fetch-site": "same-site",
                                                "user-agent":
                                                  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36",
                                              },
                                            }
                                          );

                                          if (!response.ok) {
                                            throw new Error("Upload failed");
                                          }

                                          const { urls } =
                                            await response.json();
                                          if (urls && urls.length > 0) {
                                            setEditData((prev) => ({
                                              ...prev,
                                              front_cccd: urls[0],
                                            }));
                                          } else {
                                            throw new Error(
                                              "No URL returned from server"
                                            );
                                          }
                                        } catch (error) {
                                          console.error(
                                            "Error uploading image:",
                                            error
                                          );
                                          alert(
                                            "Lỗi khi tải ảnh lên. Vui lòng thử lại."
                                          );
                                        } finally {
                                          setUploadingFront(false);
                                        }
                                      }
                                    }}
                                    className="sr-only"
                                  />
                                </label>
                              </div>
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
                    ) : (
                      <div>
                        {selectedUserDetail.front_cccd ? (
                          <img
                            src={selectedUserDetail.front_cccd}
                            alt="Mặt trước CCCD"
                            className="max-h-32 rounded-lg border border-gray-200 cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() =>
                              setLightboxImage(selectedUserDetail.front_cccd)
                            }
                          />
                        ) : (
                          <p className="text-sm text-red-500 py-1.5 md:py-2">
                            Chưa cập nhật
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Ảnh mặt sau CCCD</p>
                    {isEditing ? (
                      <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-[#2DA6A2] transition-colors">
                        <div className="space-y-1 text-center">
                          {editData.back_cccd ? (
                            <div className="relative">
                              <img
                                src={editData.back_cccd}
                                alt="Mặt sau CCCD"
                                className="max-h-32 mx-auto cursor-pointer hover:opacity-80 transition-opacity"
                                onClick={() =>
                                  setLightboxImage(editData.back_cccd)
                                }
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  setEditData((prev) => ({
                                    ...prev,
                                    back_cccd: "",
                                  }))
                                }
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-4 w-4"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              </button>
                            </div>
                          ) : (
                            <>
                              <svg
                                className="mx-auto h-12 w-12 text-gray-400"
                                stroke="currentColor"
                                fill="none"
                                viewBox="0 0 48 48"
                              >
                                <path
                                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                              <div className="flex text-sm text-gray-600">
                                <label className="relative cursor-pointer rounded-md font-medium text-[#2DA6A2] hover:text-[#2DA6A2]/90 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-[#2DA6A2]">
                                  <span>Tải ảnh lên</span>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={async (e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        setUploadingBack(true);
                                        try {
                                          const formData = new FormData();
                                          formData.append("files", file);
                                          formData.append(
                                            "fileTypes",
                                            file.type
                                          );
                                          formData.append(
                                            "objectKey",
                                            "web_mvp/sub_recordings/thumb"
                                          );

                                          const response = await fetch(
                                            "https://mvp-api.hacknao.edu.vn/api/v1/upload",
                                            {
                                              method: "POST",
                                              body: formData,
                                              headers: {
                                                accept:
                                                  "application/json, text/plain, */*",
                                                "accept-language":
                                                  "en-US,en;q=0.9,vi;q=0.8",
                                                authorization:
                                                  "Bearer undefined",
                                                origin:
                                                  "https://mvp.hacknao.edu.vn",
                                                priority: "u=1, i",
                                                referer:
                                                  "https://mvp.hacknao.edu.vn/",
                                                "sec-ch-ua":
                                                  '"Chromium";v="140", "Not=A?Brand";v="24", "Google Chrome";v="140"',
                                                "sec-ch-ua-mobile": "?0",
                                                "sec-ch-ua-platform": '"macOS"',
                                                "sec-fetch-dest": "empty",
                                                "sec-fetch-mode": "cors",
                                                "sec-fetch-site": "same-site",
                                                "user-agent":
                                                  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36",
                                              },
                                            }
                                          );

                                          if (!response.ok) {
                                            throw new Error("Upload failed");
                                          }

                                          const { urls } =
                                            await response.json();
                                          if (urls && urls.length > 0) {
                                            setEditData((prev) => ({
                                              ...prev,
                                              back_cccd: urls[0],
                                            }));
                                          } else {
                                            throw new Error(
                                              "No URL returned from server"
                                            );
                                          }
                                        } catch (error) {
                                          console.error(
                                            "Error uploading image:",
                                            error
                                          );
                                          alert(
                                            "Lỗi khi tải ảnh lên. Vui lòng thử lại."
                                          );
                                        } finally {
                                          setUploadingBack(false);
                                        }
                                      }
                                    }}
                                    className="sr-only"
                                  />
                                </label>
                              </div>
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
                    ) : (
                      <div>
                        {selectedUserDetail.back_cccd ? (
                          <img
                            src={selectedUserDetail.back_cccd}
                            alt="Mặt sau CCCD"
                            className="max-h-32 rounded-lg border border-gray-200 cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() =>
                              setLightboxImage(selectedUserDetail.back_cccd)
                            }
                          />
                        ) : (
                          <p className="text-sm text-red-500 py-1.5 md:py-2">
                            Chưa cập nhật
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Bank Info Section */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-gray-900 border-b pb-2">
                  Thông tin ngân hàng
                </h4>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-500">Tên chủ tài khoản</p>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editData.bank_account_name}
                        onChange={(e) =>
                          setEditData((prev) => ({
                            ...prev,
                            bank_account_name: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2DA6A2] focus:border-[#2DA6A2] text-gray-900"
                        placeholder="Nhập tên chủ tài khoản"
                      />
                    ) : (
                      <p
                        className={`text-sm ${
                          selectedUserDetail.bank_account_name
                            ? "text-gray-900"
                            : "text-red-500"
                        }`}
                      >
                        {selectedUserDetail.bank_account_name ||
                          "Chưa cập nhật"}
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Tên ngân hàng</p>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editData.bank_name}
                        onChange={(e) =>
                          setEditData((prev) => ({
                            ...prev,
                            bank_name: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2DA6A2] focus:border-[#2DA6A2] text-gray-900"
                        placeholder="Nhập tên ngân hàng"
                      />
                    ) : (
                      <p
                        className={`text-sm ${
                          selectedUserDetail.bank_name
                            ? "text-gray-900"
                            : "text-red-500"
                        }`}
                      >
                        {selectedUserDetail.bank_name || "Chưa cập nhật"}
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Số tài khoản</p>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editData.bank_account_number}
                        onChange={(e) =>
                          setEditData((prev) => ({
                            ...prev,
                            bank_account_number: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2DA6A2] focus:border-[#2DA6A2] text-gray-900"
                        placeholder="Nhập số tài khoản"
                      />
                    ) : (
                      <p
                        className={`text-sm ${
                          selectedUserDetail.bank_account_number
                            ? "text-gray-900"
                            : "text-red-500"
                        }`}
                      >
                        {selectedUserDetail.bank_account_number ||
                          "Chưa cập nhật"}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Stats Section */}
              <div className="space-y-4 md:col-span-2">
                <h4 className="text-sm font-medium text-gray-900 border-b pb-2">
                  Thống kê
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-xs text-gray-500 mb-1">Số bài ghi âm</p>
                    <p className="text-lg font-semibold text-[#2DA6A2]">
                      {selectedUserDetail.total_recordings}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-xs text-gray-500 mb-1">
                      Tổng thời lượng
                    </p>
                    <p className="text-lg font-semibold text-[#2DA6A2]">
                      {(selectedUserDetail.total_duration / 60).toFixed(1)} phút
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-xs text-gray-500 mb-1">Thành tiền</p>
                    <p className="text-lg font-semibold text-green-600">
                      {new Intl.NumberFormat("vi-VN", {
                        style: "currency",
                        currency: "VND",
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      }).format(
                        calculatePaymentAmount(selectedUserDetail.total_duration || 0)
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Time Info */}
              <div className="md:col-span-2 pt-4 border-t">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Ngày tạo</p>
                    <p className="text-sm text-gray-900">
                      {new Date(
                        selectedUserDetail.created_at
                      ).toLocaleDateString("vi-VN")}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Cập nhật lần cuối</p>
                    <p className="text-sm text-gray-900">
                      {new Date(
                        selectedUserDetail.updated_at
                      ).toLocaleDateString("vi-VN")}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="md:col-span-2 pt-6 flex justify-end space-x-3">
                {isEditing ? (
                  <>
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setEditData({});
                      }}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                    >
                      Hủy
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          const { error } = await supabase.rpc(
                            "update_profile_info",
                            {
                              profile_id: selectedUserDetail.id,
                              new_full_name: editData.full_name,
                              new_phone: editData.phone,
                              new_id_number: editData.id_number,
                              new_address: editData.address,
                              new_bank_account_name: editData.bank_account_name,
                              new_bank_name: editData.bank_name,
                              new_bank_account_number:
                                editData.bank_account_number,
                              new_front_cccd: editData.front_cccd,
                              new_back_cccd: editData.back_cccd,
                            }
                          );

                          if (error) throw error;

                          // Update local state
                          setSelectedUserDetail((prev) => ({
                            ...prev,
                            ...editData,
                          }));
                          setCtvList((prev) =>
                            prev.map((ctv) =>
                              ctv.id === selectedUserDetail.id
                                ? { ...ctv, ...editData }
                                : ctv
                            )
                          );
                          setIsEditing(false);
                          alert("Cập nhật thông tin thành công!");
                        } catch (error) {
                          console.error("Error updating profile:", error);
                          alert(
                            "Có lỗi xảy ra khi cập nhật thông tin. Vui lòng thử lại."
                          );
                        }
                      }}
                      className="px-4 py-2 bg-[#2DA6A2] text-white rounded-lg hover:bg-[#2DA6A2]/90 transition-colors text-sm"
                    >
                      Lưu thay đổi
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => {
                      setEditData({
                        full_name: selectedUserDetail.full_name || "",
                        phone: selectedUserDetail.phone || "",
                        id_number: selectedUserDetail.id_number || "",
                        address: selectedUserDetail.address || "",
                        bank_account_name:
                          selectedUserDetail.bank_account_name || "",
                        bank_name: selectedUserDetail.bank_name || "",
                        bank_account_number:
                          selectedUserDetail.bank_account_number || "",
                        front_cccd: selectedUserDetail.front_cccd || "",
                        back_cccd: selectedUserDetail.back_cccd || "",
                      });
                      setIsEditing(true);
                    }}
                    className="inline-flex items-center text-[#2DA6A2] hover:text-white bg-[#2DA6A2]/5 hover:bg-[#2DA6A2] px-4 py-2 rounded-lg transition-colors text-sm"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-4 h-4 mr-2"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
                      />
                    </svg>
                    Chỉnh sửa
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && selectedCTV && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-[9999]">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 relative">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Xác nhận xóa CTV
            </h3>
            <p className="text-gray-600 mb-6">
              Bạn có chắc chắn muốn xóa CTV{" "}
              <span className="font-medium text-gray-900">
                {selectedCTV.full_name}
              </span>
              ? Hành động này không thể hoàn tác.
            </p>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setSelectedCTV(null);
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
              >
                Hủy
              </button>
              <button
                onClick={async () => {
                  try {
                    setIsDeleting(true);
                    const { error } = await supabaseAdmin.auth.admin.deleteUser(
                      selectedCTV.id
                    );
                    if (error) throw error;

                    // Update local state
                    setCtvList((prev) =>
                      prev.filter((ctv) => ctv.id !== selectedCTV.id)
                    );

                    // Close modal
                    setIsDeleteModalOpen(false);
                    setSelectedCTV(null);
                    alert("Xóa CTV thành công!");
                  } catch (error) {
                    console.error("Error deleting CTV:", error);
                    alert("Có lỗi xảy ra khi xóa CTV. Vui lòng thử lại.");
                  } finally {
                    setIsDeleting(false);
                  }
                }}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm disabled:bg-red-300 disabled:cursor-not-allowed flex items-center"
              >
                {isDeleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Đang xử lý...
                  </>
                ) : (
                  "Xóa"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {isResetPasswordModalOpen && selectedUserForReset && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[9999]">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-base md:text-lg font-semibold text-gray-900">
                Reset mật khẩu
              </h3>
              <button
                onClick={() => {
                  setIsResetPasswordModalOpen(false);
                  setSelectedUserForReset(null);
                  setNewPassword("");
                  setConfirmNewPassword("");
                  setResetPasswordErrors({});
                }}
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
            <div className="p-6 space-y-4">
              {/* User Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Người dùng:</p>
                <p className="text-base font-medium text-gray-900">
                  {selectedUserForReset.full_name || "Chưa cập nhật"}
                </p>
                <p className="text-sm text-gray-500">
                  {selectedUserForReset.email || "Chưa có email"}
                </p>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1.5 md:mb-2">
                  Mật khẩu mới *
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      if (resetPasswordErrors.newPassword) {
                        setResetPasswordErrors(prev => ({
                          ...prev,
                          newPassword: ""
                        }));
                      }
                    }}
                    className={`w-full px-3 py-2 md:px-4 md:py-3 pr-10 md:pr-12 text-sm md:text-base border rounded-lg focus:ring-2 focus:ring-[#2DA6A2] focus:border-[#2DA6A2] text-gray-900 ${
                      resetPasswordErrors.newPassword ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="Nhập mật khẩu mới"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                  >
                    {showNewPassword ? (
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
                {resetPasswordErrors.newPassword && (
                  <p className="mt-1 text-sm text-red-600">{resetPasswordErrors.newPassword}</p>
                )}
              </div>

              {/* Confirm New Password */}
              <div>
                <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1.5 md:mb-2">
                  Nhập lại mật khẩu mới *
                </label>
                <div className="relative">
                  <input
                    type={showConfirmNewPassword ? "text" : "password"}
                    value={confirmNewPassword}
                    onChange={(e) => {
                      setConfirmNewPassword(e.target.value);
                      if (resetPasswordErrors.confirmNewPassword) {
                        setResetPasswordErrors(prev => ({
                          ...prev,
                          confirmNewPassword: ""
                        }));
                      }
                    }}
                    className={`w-full px-3 py-2 md:px-4 md:py-3 pr-10 md:pr-12 text-sm md:text-base border rounded-lg focus:ring-2 focus:ring-[#2DA6A2] focus:border-[#2DA6A2] text-gray-900 ${
                      resetPasswordErrors.confirmNewPassword ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="Nhập lại mật khẩu mới"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmNewPassword ? (
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
                {resetPasswordErrors.confirmNewPassword && (
                  <p className="mt-1 text-sm text-red-600">{resetPasswordErrors.confirmNewPassword}</p>
                )}
              </div>

              {/* Error Message */}
              {resetPasswordErrors.submit && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-600">{resetPasswordErrors.submit}</p>
                </div>
              )}

              {/* Modal Footer */}
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsResetPasswordModalOpen(false);
                    setSelectedUserForReset(null);
                    setNewPassword("");
                    setConfirmNewPassword("");
                    setResetPasswordErrors({});
                  }}
                  className="flex-1 px-3 py-1.5 md:px-4 md:py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm md:text-base"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleResetPassword}
                  className="flex-1 px-3 py-1.5 md:px-4 md:py-2 bg-[#2DA6A2] text-white rounded-lg hover:bg-[#2DA6A2]/90 transition-colors text-sm md:text-base"
                >
                  Reset mật khẩu
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Modal */}
      {lightboxImage && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-[99999]"
          onClick={() => setLightboxImage(null)}
        >
          <div className="relative w-[90vw] h-[90vh] max-w-4xl">
            <img
              src={lightboxImage}
              alt="Ảnh CCCD"
              className="w-full h-full object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
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
        </div>
      )}
    </ProtectedRoute>
  );
}

// Export default component with Suspense
export default function ManageCTVPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <ManageCTVPageContent />
    </Suspense>
  );
}
