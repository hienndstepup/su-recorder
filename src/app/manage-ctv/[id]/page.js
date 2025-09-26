"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import Header from "@/components/Header";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { calculatePaymentAmount } from "@/lib/index";

export default function ManageCTVDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [ctv, setCtv] = useState(null);
  const [recordings, setRecordings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingRecordings, setLoadingRecordings] = useState(true);
  const [currentUserProfile, setCurrentUserProfile] = useState(null);
  const [deletingRecord, setDeletingRecord] = useState(null);

  // Fetch current user profile để kiểm tra role và referrals
  useEffect(() => {
    const fetchCurrentUserProfile = async () => {
      if (!user) return;
      
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (data && !error) {
        setCurrentUserProfile(data);
      }
    };

    fetchCurrentUserProfile();
  }, [user]);

  // Kiểm tra quyền update is_pass
  const canUpdateIsPass = (recordUserId) => {
    if (!currentUserProfile) return false;
    
    // Admin có thể update tất cả
    if (currentUserProfile.role === 'admin' && currentUserProfile.status === 'active') {
      return true;
    }
    
    // CTV chỉ có thể update của referrals
    if (currentUserProfile.role === 'ctv' && currentUserProfile.status === 'active') {
      // Kiểm tra xem record có phải của referral không
      return ctv?.referrer_id === currentUserProfile.id;
    }

    return false;
  };

  // Kiểm tra quyền xóa recording
  const canDeleteRecord = (recordUserId) => {
    return canUpdateIsPass(recordUserId); // Cùng logic với update
  };

  // Xóa recording
  const handleDeleteRecord = async (recordId) => {
    if (!confirm('Bạn có chắc chắn muốn xóa bản ghi này?')) {
      return;
    }

    setDeletingRecord(recordId);
    try {
      // Sử dụng SQL function để xóa với permission checks
      const { data, error } = await supabase
        .rpc('delete_recording', {
          recording_id: recordId
        });

      if (error) throw error;

      if (data) {
        // Cập nhật danh sách recordings
        setRecordings(prev => prev.filter(record => record.id !== recordId));
        
        // Cập nhật lại profile data để sync thống kê (không loading)
        await fetchCTVProfileOnly();
      } else {
        throw new Error('Xóa bản ghi thất bại');
      }
    } catch (error) {
      console.error('Error deleting record:', error);
      
      // Hiển thị thông báo lỗi chi tiết hơn
      let errorMessage = 'Có lỗi xảy ra khi xóa bản ghi.';
      
      if (error.message.includes('Permission denied')) {
        errorMessage = 'Không có quyền xóa bản ghi này.';
      } else if (error.message.includes('Recording not found')) {
        errorMessage = 'Bản ghi không tồn tại.';
      } else if (error.message.includes('User not found')) {
        errorMessage = 'Người dùng không hợp lệ.';
      }
      
      alert(errorMessage + ' Vui lòng thử lại.');
    } finally {
      setDeletingRecord(null);
    }
  };

  // Fetch CTV profile data only (without loading)
  const fetchCTVProfileOnly = async (ctvId = params.id) => {
    try {
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", ctvId)
        .single();

      if (profileError) throw profileError;
      setCtv(profileData);
    } catch (error) {
      console.error("Error fetching CTV profile:", error);
    }
  };

  // Fetch CTV profile data with recordings (initial load)
  const fetchCTVData = async (ctvId = params.id) => {
    try {
      setLoading(true);
      // Fetch profile data
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", ctvId)
        .single();

      if (profileError) throw profileError;
      setCtv(profileData);

      // Fetch recordings
      await fetchRecordings(ctvId);
    } catch (error) {
      console.error("Error fetching CTV data:", error);
      alert("Không thể tải thông tin CTV. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch recordings của CTV
  const fetchRecordings = async (ctvId) => {
    try {
      setLoadingRecordings(true);
      const { data, error } = await supabase
        .from("recordings")
          .select(
            `
            id,
            audio_url,
            audio_duration,
            audio_script,
            recorded_at,
            age,
            is_pass,
            questions (
              id,
              text,
              type,
              hint
            ),
            provinces (
              id,
              name,
              code
            )
          `
        )
        .eq("user_id", ctvId)
        .order("recorded_at", { ascending: false });

      if (error) throw error;
      setRecordings(data || []);
    } catch (error) {
      console.error("Error fetching recordings:", error);
      alert("Không thể tải danh sách bài ghi âm. Vui lòng thử lại sau.");
    } finally {
      setLoadingRecordings(false);
    }
  };

  useEffect(() => {
    const ctvId = params.id;
    if (!ctvId) return;

    fetchCTVData(ctvId);
  }, [params.id]);

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col">
          <Header />
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-[#2DA6A2] rounded-full mb-4 animate-pulse">
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
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <p className="text-gray-600">Đang tải thông tin CTV...</p>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!ctv) {
    return null;
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col">
        <Header />

        {/* Main Content */}
        <div className="flex-1 p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {/* Back Button */}
            <div className="mb-6">
              <button
                onClick={() => router.back()}
                className="flex items-center text-[#2DA6A2] hover:text-[#2DA6A2]/80 transition-colors text-sm md:text-base"
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
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                Quay lại
              </button>
            </div>

            {/* Page Header */}
            <div className="mb-8">
              <h1 className="text-2xl md:text-4xl font-bold text-[#2DA6A2] mb-1 md:mb-2">
                Thông tin CTV
              </h1>
              <p className="text-base md:text-lg text-gray-600">
                Chi tiết thông tin và hoạt động của cộng tác viên
              </p>
            </div>

            {/* Profile Summary Card */}
            <div className="bg-white rounded-lg shadow-md p-4 md:p-6 mb-6 md:mb-8">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div className="flex items-center space-x-4 mb-4 md:mb-0">
                  <div className="w-12 h-12 md:w-16 md:h-16 bg-[#2DA6A2] rounded-full flex items-center justify-center">
                    <span className="text-white text-lg md:text-xl font-bold">
                      {ctv.full_name
                        ?.split(" ")
                        .map((n) => n[0])
                        .join("") || "?"}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg md:text-xl font-semibold text-gray-900">
                      {ctv.full_name}
                    </h3>
                    <p className="text-sm md:text-base text-gray-600">{ctv.affiliate_code}</p>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row md:space-x-8 space-y-4 md:space-y-0">
                  <div className="flex justify-between md:block text-center">
                    <div className="text-xs md:text-sm text-gray-600">Tổng bài ghi âm</div>
                    <div className="text-xl md:text-2xl font-bold text-[#2DA6A2]">
                      {ctv.total_recordings || 0}
                    </div>
                  </div>
                  <div className="flex justify-between md:block text-center">
                    <div className="text-xs md:text-sm text-gray-600">Tổng thời lượng</div>
                    <div className="text-xl md:text-2xl font-bold text-[#2DA6A2]">
                      {((ctv.total_duration || 0) / 60).toFixed(1)} phút
                    </div>
                  </div>
                  <div className="flex justify-between md:block text-center">
                    <div className="text-xs md:text-sm text-gray-600">Thành tiền</div>
                    <div className="text-xl md:text-2xl font-bold text-green-600">
                      {new Intl.NumberFormat("vi-VN", {
                        style: "currency",
                        currency: "VND",
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      }).format(calculatePaymentAmount(ctv.total_duration || 0))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Audio Records Table */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <div>
                  <h3 className="text-base md:text-lg font-semibold text-gray-900">
                    Danh sách bài ghi âm
                  </h3>
                  <p className="mt-1 text-xs md:text-sm text-yellow-600">
                    * Lưu ý: Số giây hiển thị trên cột AUDIO đã được làm tròn
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 md:px-6 py-2 md:py-3 text-left text-[10px] md:text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        Câu hỏi
                      </th>
                      <th className="px-4 md:px-6 py-2 md:py-3 text-left text-[10px] md:text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        Câu trả lời
                      </th>
                      <th className="px-4 md:px-6 py-2 md:py-3 text-left text-[10px] md:text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        Audio
                      </th>
                      <th className="px-4 md:px-6 py-2 md:py-3 text-left text-[10px] md:text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        Hành động
                      </th>
                      <th className="px-4 md:px-6 py-2 md:py-3 text-left text-[10px] md:text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        Duyệt
                      </th>
                      <th className="px-4 md:px-6 py-2 md:py-3 text-left text-[10px] md:text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        Age
                      </th>
                      <th className="px-4 md:px-6 py-2 md:py-3 text-left text-[10px] md:text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        Tỉnh/thành phố
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {loadingRecordings ? (
                      <tr>
                        <td
                          colSpan="7"
                          className="px-6 py-4 text-center text-gray-500"
                        >
                          <div className="flex items-center justify-center space-x-2">
                            <div className="w-4 h-4 border-2 border-[#2DA6A2] border-t-transparent rounded-full animate-spin"></div>
                            <span>Đang tải danh sách bài ghi âm...</span>
                          </div>
                        </td>
                      </tr>
                    ) : recordings.length > 0 ? (
                      recordings.map((record) => (
                        <tr key={record.id} className="hover:bg-gray-50">
                          <td className="px-4 md:px-6 py-3 md:py-4 whitespace-nowrap text-xs md:text-sm text-gray-900">
                            {record.questions?.text}
                          </td>
                          <td className="px-4 md:px-6 py-3 md:py-4 text-xs md:text-sm text-gray-900 max-w-xs">
                            <div
                              className="truncate"
                              title={record.audio_script}
                            >
                              {record.audio_script}
                            </div>
                          </td>
                          <td className="px-4 md:px-6 py-3 md:py-4">
                            <div className="space-y-3">
                              {/* Audio Player */}
                              <div className="flex justify-center">
                                <audio
                                  controls
                                  className="w-full max-w-xs min-w-[220px] h-[40px]"
                                >
                                  <source
                                    src={record.audio_url}
                                    type="audio/wav"
                                  />
                                  <source
                                    src={record.audio_url}
                                    type="audio/mpeg"
                                  />
                                  Trình duyệt của bạn không hỗ trợ thẻ audio.
                                </audio>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 md:px-6 py-3 md:py-4 whitespace-nowrap text-xs md:text-sm text-gray-900">
                            {canDeleteRecord(record.user_id) ? (
                              <button
                                onClick={() => handleDeleteRecord(record.id)}
                                disabled={deletingRecord === record.id}
                                className="inline-flex items-center px-2 py-1 border border-red-300 rounded-md text-red-700 bg-red-50 hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                              >
                                {deletingRecord === record.id ? (
                                  <>
                                    <div className="w-3 h-3 border border-red-300 border-t-transparent rounded-full animate-spin mr-1"></div>
                                    Đang xóa...
                                  </>
                                ) : (
                                  <>
                                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                    Xóa
                                  </>
                                )}
                              </button>
                            ) : (
                              <span className="text-gray-400 text-xs">Không có quyền</span>
                            )}
                          </td>
                          <td className="px-4 md:px-6 py-3 md:py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              {canUpdateIsPass(record.user_id) ? (
                                <button
                                  onClick={async () => {
                                  try {
                                    const { error } = await supabase
                                      .rpc('update_recording_is_pass', {
                                        recording_id: record.id,
                                        new_is_pass: !record.is_pass
                                      });

                                    if (error) throw error;

                                    // Update local state
                                    setRecordings(prev =>
                                      prev.map(item =>
                                        item.id === record.id
                                          ? { ...item, is_pass: !item.is_pass }
                                          : item
                                      )
                                    );
                                  } catch (error) {
                                    console.error("Error updating pass status:", error);
                                    alert("Có lỗi xảy ra khi cập nhật trạng thái. Vui lòng thử lại.");
                                  }
                                }}
                                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#2DA6A2] focus:ring-offset-2 ${
                                  record.is_pass ? "bg-[#2DA6A2]" : "bg-gray-200"
                                }`}
                                role="switch"
                                aria-checked={record.is_pass}
                              >
                                <span
                                  aria-hidden="true"
                                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                    record.is_pass ? "translate-x-5" : "translate-x-0"
                                  }`}
                                />
                              </button>
                              ) : (
                                <div className={`inline-flex items-center px-2 py-1 rounded text-xs ${
                                  record.is_pass 
                                    ? "bg-green-100 text-green-800" 
                                    : "bg-gray-100 text-gray-800"
                                }`}>
                                  {record.is_pass ? "Đã duyệt" : "Chưa duyệt"}
                                </div>
                              )}
                              </div>
                          </td>
                          <td className="px-4 md:px-6 py-3 md:py-4 whitespace-nowrap text-xs md:text-sm text-gray-500">
                            {record.age || "-"}
                          </td>
                          <td className="px-4 md:px-6 py-3 md:py-4 whitespace-nowrap text-xs md:text-sm text-gray-500">
                            {record.provinces?.name}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan="7"
                          className="px-6 py-4 text-center text-gray-500"
                        >
                          Chưa có bài ghi âm nào
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
