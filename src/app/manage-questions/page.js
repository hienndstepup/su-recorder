"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import Header from "@/components/Header";
import { supabase } from "@/lib/supabase";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

export default function ManageQuestionsPage() {
  const { user } = useAuth();
  const [questions, setQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1); // Reset to first page when search term changes
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchQuestions = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.rpc('search_questions', {
        search_keyword: debouncedSearchTerm || null,
        question_type: selectedType === 'all' ? null : selectedType,
        page_number: currentPage,
        items_per_page: itemsPerPage
      });

      if (error) throw error;
      
      if (data && data.length > 0) {
        setQuestions(data);
        setTotalQuestions(data[0].total_count);
      } else {
        setQuestions([]);
        setTotalQuestions(0);
      }
    } catch (error) {
      console.error("Error fetching questions:", error);
      alert("Không thể tải danh sách câu hỏi. Vui lòng thử lại sau.");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch questions when filters or page changes
  useEffect(() => {
    fetchQuestions();
  }, [debouncedSearchTerm, selectedType, currentPage, itemsPerPage]);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col">
        <Header />

        {/* Main Content */}
        <div className="flex-1 p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {/* Page Header */}
            <div className="mb-8">
              <h1 className="text-2xl md:text-4xl font-bold text-[#2DA6A2] mb-1 md:mb-2">
                Quản lý câu hỏi
              </h1>
              <p className="text-base md:text-lg text-gray-600">
                Quản lý và cập nhật danh sách câu hỏi
              </p>
            </div>

            {/* Filters */}
            <div className="mb-6 flex flex-col md:flex-row md:items-end space-y-3 md:space-y-0 md:space-x-4">
              {/* Search Input */}
              <div className="flex flex-col space-y-1">
                <label className="text-xs text-gray-600 font-medium">
                  Tìm kiếm
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Tìm kiếm theo câu hỏi hoặc gợi ý..."
                    className="text-gray-700 pl-10 pr-4 h-9 md:h-11 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2DA6A2] focus:border-[#2DA6A2] text-sm md:text-base w-full md:w-80"
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

              {/* Type Select */}
              <div className="flex flex-col space-y-1">
                <label className="text-xs text-gray-600 font-medium">
                  Loại câu hỏi
                </label>
                <select
                  value={selectedType}
                  onChange={(e) => {
                    setSelectedType(e.target.value);
                    setCurrentPage(1); // Reset to first page when changing type
                  }}
                  className="text-gray-700 px-3 md:px-4 h-9 md:h-11 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2DA6A2] focus:border-[#2DA6A2] text-sm md:text-base bg-white w-full md:w-auto md:min-w-[180px]"
                >
                  <option value="all">Tất cả</option>
                  <option value="VI_TRA_LOI">VI_TRA_LOI</option>
                  <option value="EN_TRA_LOI">EN_TRA_LOI</option>
                  <option value="EN_NHAI_THEO">EN_NHAI_THEO</option>
                </select>
              </div>

              {/* Items Per Page Select */}
              <div className="flex flex-col space-y-1">
                <label className="text-xs text-gray-600 font-medium">
                  Số dòng hiển thị
                </label>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1); // Reset to first page when changing items per page
                  }}
                  className="text-gray-700 px-3 md:px-4 h-9 md:h-11 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2DA6A2] focus:border-[#2DA6A2] text-sm md:text-base bg-white w-full md:w-auto md:min-w-[120px]"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>

            {/* Questions Table */}
            {isLoading ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                <div className="flex items-center justify-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-[#2DA6A2] border-t-transparent"></div>
                  <p className="ml-2 text-gray-600">Đang tải danh sách câu hỏi...</p>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        ID
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Câu hỏi
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Loại
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Gợi ý
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {questions.map((question) => (
                      <tr key={question.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center space-x-1">
                            <span>{question.id.slice(0, 8)}...</span>
                            <button
                              onClick={async () => {
                                try {
                                  await navigator.clipboard.writeText(question.id);
                                  setCopiedId(question.id);
                                  setTimeout(() => setCopiedId(null), 2000);
                                } catch (error) {
                                  console.error("Failed to copy:", error);
                                }
                              }}
                              className="p-1 hover:bg-gray-100 rounded-full relative group cursor-pointer"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-gray-500">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 7.5V6.108c0-1.135.845-2.098 1.976-2.192.373-.03.748-.057 1.123-.08M15.75 18H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08M15.75 18.75v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5A3.375 3.375 0 006.375 7.5H5.25m11.9-3.664A2.251 2.251 0 0015 2.25h-1.5a2.251 2.251 0 00-2.15 1.586m5.8 0c.065.21.1.433.1.664v.75h-6V4.5c0-.231.035-.454.1-.664M6.75 7.5H4.875c-.621 0-1.125.504-1.125 1.125v12c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V16.5a9 9 0 00-9-9z" />
                              </svg>
                              {copiedId === question.id && (
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap">
                                  Đã sao chép
                                </div>
                              )}
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {question.text}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {question.type}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {question.hint}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {!isLoading && totalQuestions > 0 && (
                <div className="px-6 py-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                      Hiển thị {((currentPage - 1) * itemsPerPage) + 1} đến {Math.min(currentPage * itemsPerPage, totalQuestions)} trong tổng số {totalQuestions} câu hỏi
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Trước
                      </button>
                      <button
                        onClick={() => setCurrentPage(prev => prev + 1)}
                        disabled={currentPage * itemsPerPage >= totalQuestions}
                        className="px-3 py-1 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Sau
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
