"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import Header from "@/components/Header";

export default function CTVProfilePage() {
  const params = useParams();
  const router = useRouter();
  const [ctv, setCtv] = useState(null);
  const [loading, setLoading] = useState(true);

  // Mock data cho audio records
  const audioRecords = [
    {
      question: "Bạn có thể giới thiệu về bản thân không?",
      answer: "Tôi là Nguyễn Văn A, 25 tuổi, hiện đang làm việc tại công ty ABC với vị trí nhân viên kinh doanh. Tôi có kinh nghiệm 3 năm trong lĩnh vực bán hàng và marketing.",
      audioUrl: "https://asr-audio-off-m1.hacknao.edu.vn/data/20250916/wav/20250916051005-299e013b.wav",
      region: "north"
    },
    {
      question: "Điểm mạnh của bạn là gì?",
      answer: "Điểm mạnh của tôi là khả năng giao tiếp tốt, làm việc nhóm hiệu quả và có tinh thần trách nhiệm cao. Tôi cũng có khả năng thích ứng nhanh với môi trường làm việc mới.",
      audioUrl: "https://asr-audio-off-m1.hacknao.edu.vn/data/20250916/wav/20250916051005-299e013b.wav",
      region: "north"
    },
    {
      question: "Bạn có kinh nghiệm gì trong lĩnh vực này?",
      answer: "Tôi đã có 3 năm kinh nghiệm trong lĩnh vực bán hàng, đặc biệt là bán hàng online và digital marketing. Tôi đã từng quản lý team 5 người và đạt được nhiều thành tích xuất sắc.",
      audioUrl: "https://asr-audio-off-m1.hacknao.edu.vn/data/20250916/wav/20250916051005-299e013b.wav",
      region: "north"
    },
    {
      question: "Mục tiêu nghề nghiệp của bạn là gì?",
      answer: "Mục tiêu ngắn hạn của tôi là trở thành trưởng nhóm kinh doanh trong 2 năm tới. Về dài hạn, tôi muốn phát triển thành giám đốc kinh doanh và đóng góp vào sự phát triển của công ty.",
      audioUrl: "https://asr-audio-off-m1.hacknao.edu.vn/data/20250916/wav/20250916051005-299e013b.wav",
      region: "north"
    },
    {
      question: "Bạn xử lý áp lực công việc như thế nào?",
      answer: "Khi gặp áp lực, tôi thường chia nhỏ công việc thành các bước cụ thể và ưu tiên theo mức độ quan trọng. Tôi cũng thường xuyên trao đổi với đồng nghiệp và cấp trên để tìm giải pháp tốt nhất.",
      audioUrl: "https://asr-audio-off-m1.hacknao.edu.vn/data/20250916/wav/20250916051005-299e013b.wav",
      region: "north"
    }
  ];

  // Mock data - sẽ được thay thế bằng API call
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
      phone: "0123456789",
      bio: "CTV chuyên nghiệp với nhiều năm kinh nghiệm trong lĩnh vực ghi âm và xử lý âm thanh."
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
      phone: "0987654321",
      bio: "CTV năng động, có khả năng làm việc độc lập và đạt hiệu quả cao."
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
      phone: "0369258147",
      bio: "CTV có kinh nghiệm trong việc ghi âm và chỉnh sửa âm thanh chất lượng cao."
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
      phone: "0741852963",
      bio: "CTV xuất sắc với thành tích vượt trội và khả năng làm việc nhóm tốt."
    }
  ];

  const regions = [
    { value: "north", label: "Miền Bắc" },
    { value: "central", label: "Miền Trung" },
    { value: "south", label: "Miền Nam" }
  ];

  const getRegionLabel = (region) => {
    const regionObj = regions.find(r => r.value === region);
    return regionObj ? regionObj.label : region;
  };


  useEffect(() => {
    const ctvId = parseInt(params.id);
    const foundCtv = ctvList.find(c => c.id === ctvId);
    
    if (foundCtv) {
      setCtv(foundCtv);
    } else {
      // Redirect to manage-ctv if CTV not found
      router.push('/manage-ctv');
    }
    
    setLoading(false);
  }, [params.id, router]);

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col">
          <Header />
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-[#2DA6A2] rounded-full mb-4 animate-pulse">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
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
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
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
                      {ctv.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      {ctv.name}
                    </h3>
                    <p className="text-gray-600">{ctv.email}</p>
                  </div>
                </div>
                
                <div className="flex space-x-8">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-[#2DA6A2]">{ctv.totalRecordings}</div>
                    <div className="text-sm text-gray-600">Tổng bài ghi âm</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{ctv.completedRecordings}</div>
                    <div className="text-sm text-gray-600">Phiên hoàn thành</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Audio Records Table */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  Danh sách bài ghi âm
                </h3>
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
                        Khu vực
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {audioRecords.map((record, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {record.question}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">
                          <div className="truncate" title={record.answer}>
                            {record.answer}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-3">
                            {/* Audio Player */}
                            <div className="flex justify-center">
                              <audio controls className="w-full max-w-xs min-w-[200px]">
                                <source src={record.audioUrl} type="audio/wav" />
                                <source src={record.audioUrl} type="audio/mpeg" />
                                Trình duyệt của bạn không hỗ trợ thẻ audio.
                              </audio>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {getRegionLabel(record.region)}
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
    </ProtectedRoute>
  );
}