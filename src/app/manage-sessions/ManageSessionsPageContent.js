"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useSearchParams, useRouter } from "next/navigation";

// Copyable Session ID Component
const CopyableSessionId = ({ sessionId, copiedId, onCopy }) => {
  const isCopied = copiedId === sessionId;
  
  return (
    <div className="relative group">
      <span className="text-sm font-mono text-gray-900 cursor-pointer hover:text-[#2DA6A2] transition-colors">
        {sessionId.slice(0, 8)}...
      </span>
      
      {/* Copy Icon */}
      <button
        onClick={() => onCopy(sessionId)}
        className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 hover:bg-gray-100 rounded"
        title="Sao chép Session ID"
      >
        <svg className="w-4 h-4 text-gray-500 hover:text-[#2DA6A2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      </button>
      
      {/* Tooltip */}
      {isCopied && (
        <div className="absolute top-full left-0 mt-1 px-2 py-1 bg-green-600 text-white text-xs rounded shadow-lg z-10 whitespace-nowrap">
          Đã sao chép!
        </div>
      )}
    </div>
  );
};

const ManageSessionsPageContent = () => {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(50);
  const [searchTerm, setSearchTerm] = useState("");
  const [copiedId, setCopiedId] = useState(null);

  // Get URL params
  useEffect(() => {
    const page = parseInt(searchParams.get("page")) || 1;
    const search = searchParams.get("search") || "";
    setCurrentPage(page);
    setSearchTerm(search);
  }, [searchParams]);

  // Fetch sessions data
  const fetchSessions = async (page = currentPage, search = searchTerm) => {
    if (!user) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Get sessions data
      const { data: sessionsData, error: sessionsError } = await supabase
        .rpc('get_sessions_data', {
          page_number: page,
          page_limit: itemsPerPage
        });

      if (sessionsError) throw sessionsError;

      // Get total count
      const { data: countData, error: countError } = await supabase
        .rpc('get_sessions_count');

      if (countError) throw countError;

      setSessions(sessionsData || []);
      setTotalCount(countData || 0);
    } catch (err) {
      console.error("Error fetching sessions:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch data when component mounts or params change
  useEffect(() => {
    fetchSessions(currentPage, searchTerm);
  }, [user, currentPage, searchTerm]);

  // Handle search
  const handleSearch = (value) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set("search", value);
      params.set("page", "1");
    } else {
      params.delete("search");
      params.delete("page");
    }
    router.push(`/manage-sessions?${params.toString()}`);
  };

  // Handle page change
  const handlePageChange = (page) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", page.toString());
    router.push(`/manage-sessions?${params.toString()}`);
  };

  // Handle refresh
  const handleRefresh = () => {
    fetchSessions(currentPage, searchTerm);
  };

  // Handle copy Session ID
  const copyToClipboard = async (sessionId) => {
    try {
      await navigator.clipboard.writeText(sessionId);
      setCopiedId(sessionId);
      setTimeout(() => {
        setCopiedId(null);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  // Filter sessions based on search term
  const filteredSessions = sessions.filter(session => {
    if (!searchTerm) return true;
    const userProfile = session.user_profile;
    if (!userProfile) return false;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      userProfile.full_name?.toLowerCase().includes(searchLower) ||
      userProfile.affiliate_code?.toLowerCase().includes(searchLower) ||
      session.id.toLowerCase().includes(searchLower)
    );
  });

  // Calculate pagination
  const totalPages = Math.ceil(totalCount / itemsPerPage);
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalCount);

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <h3 className="text-lg font-medium text-red-800 mb-2">Lỗi tải dữ liệu</h3>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={handleRefresh}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Thử lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            Quản lý phiên ghi âm
          </h1>
          <p className="text-gray-600">
            Quản lý và theo dõi các phiên ghi âm của người dùng
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-[#2DA6A2]">
            <h3 className="text-lg font-semibold text-[#2DA6A2] mb-2">Tổng phiên</h3>
            <p className="text-3xl font-bold text-gray-900">{totalCount.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
            <h3 className="text-lg font-semibold text-blue-500 mb-2">Trang hiện tại</h3>
            <p className="text-3xl font-bold text-gray-900">{currentPage}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
            <h3 className="text-lg font-semibold text-green-500 mb-2">Hiển thị</h3>
            <p className="text-3xl font-bold text-gray-900">{filteredSessions.length}</p>
          </div>
        </div>

        {/* Search and Actions */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex-1 max-w-md">
              <input
                type="text"
                placeholder="Tìm kiếm theo tên, mã affiliate, session ID..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="text-gray-900 w-full px-4 py-2 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2DA6A2] focus:border-[#2DA6A2]"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleRefresh}
                disabled={isLoading}
                className="bg-[#2DA6A2] hover:bg-[#2DA6A2]/90 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
              >
                {isLoading ? "Đang tải..." : "Làm mới"}
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#2DA6A2]"></div>
              <p className="mt-2 text-gray-600">Đang tải dữ liệu...</p>
            </div>
          ) : filteredSessions.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p>Không tìm thấy phiên ghi âm nào</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      Session ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      Tên người dùng
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      Mã affiliate
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      Vai trò
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      Trạng thái
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      Tổng bài thu âm
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      Thời lượng (phút)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      Ngày tạo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      Cập nhật cuối
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredSessions.map((session) => {
                    const userProfile = session.user_profile || {};
                    return (
                      <tr key={session.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <CopyableSessionId 
                            sessionId={session.id}
                            copiedId={copiedId}
                            onCopy={copyToClipboard}
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {userProfile.full_name || "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {userProfile.affiliate_code || "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            userProfile.role === 'admin' 
                              ? 'bg-red-100 text-red-800'
                              : userProfile.role === 'ctv'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {userProfile.role === 'admin' ? 'Admin' : 
                             userProfile.role === 'ctv' ? 'CTV' : 'User'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            userProfile.status === 'active' 
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {userProfile.status === 'active' ? 'Hoạt động' : 'Không hoạt động'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {userProfile.total_recordings?.toLocaleString() || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {userProfile.total_duration ? Math.round(userProfile.total_duration / 60) : 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(session.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(session.updated_at)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Hiển thị {startItem} đến {endItem} trong tổng số {totalCount} kết quả
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Trước
              </button>
              <span className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageSessionsPageContent;
