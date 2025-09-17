"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import Header from "@/components/Header";
import { supabase } from "@/lib/supabase";

export default function CTVProfilePage() {
  const params = useParams();
  const router = useRouter();
  const [ctv, setCtv] = useState(null);
  const [recordings, setRecordings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingRecordings, setLoadingRecordings] = useState(true);

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

    const fetchCTVData = async () => {
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

    fetchCTVData();
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
                className="flex items-center text-[#2DA6A2] hover:text-[#2DA6A2]/80 transition-colors"
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
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                Quay lại
              </button>
            </div>

            {/* Page Header */}
            <div className="mb-8">
              <h1 className="text-3xl md:text-4xl font-bold text-[#2DA6A2] mb-2">
                Thông tin CTV
              </h1>
              <p className="text-lg text-gray-600">
                Chi tiết thông tin và hoạt động của cộng tác viên
              </p>
            </div>

            {/* Profile Summary Card */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div className="flex items-center space-x-4 mb-4 md:mb-0">
                  <div className="w-16 h-16 bg-[#2DA6A2] rounded-full flex items-center justify-center">
                    <span className="text-white text-xl font-bold">
                      {ctv.full_name
                        ?.split(" ")
                        .map((n) => n[0])
                        .join("") || "?"}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      {ctv.full_name}
                    </h3>
                    <p className="text-gray-600">{ctv.affiliate_code}</p>
                  </div>
                </div>

                <div className="flex space-x-8">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-[#2DA6A2]">
                      {ctv.total_recordings || 0}
                    </div>
                    <div className="text-sm text-gray-600">Tổng bài ghi âm</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {ctv.total_duration || 0}
                    </div>
                    <div className="text-sm text-gray-600">
                      Tổng thời lượng (giây)
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Audio Records Table */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Danh sách bài ghi âm
                  </h3>
                  <p className="mt-1 text-sm text-yellow-600">
                    * Lưu ý: Số giây hiển thị trên cột AUDIO được làm tròn
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Câu hỏi
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Câu trả lời
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Audio
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tỉnh/thành phố
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {loadingRecordings ? (
                      <tr>
                        <td
                          colSpan="4"
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
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {record.questions?.text}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">
                            <div
                              className="truncate"
                              title={record.audio_script}
                            >
                              {record.audio_script}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="space-y-3">
                              {/* Audio Player */}
                              <div className="flex justify-center">
                                <audio
                                  controls
                                  className="w-full max-w-xs min-w-[150px] h-[40px]"
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
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {record.provinces?.name}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan="4"
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
