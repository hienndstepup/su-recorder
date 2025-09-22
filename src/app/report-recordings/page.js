"use client";

import React, { useState, useEffect } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import Header from "@/components/Header";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

const ReportRecordingsPage = () => {
  const { user } = useAuth();
  const [recordingsData, setRecordingsData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [loadingProgress, setLoadingProgress] = useState({ current: 0, total: 0, message: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(50);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("recorded_at");
  const [sortOrder, setSortOrder] = useState("desc");

  // Fetch recordings data with pagination to get ALL records
  const fetchRecordingsData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      setLoadingProgress({ current: 0, total: 1, message: 'Đang đếm tổng số bản ghi...' });
      
      // First, get the total count
      const { count, error: countError } = await supabase
        .from('recordings')
        .select('*', { count: 'exact', head: true });
      
      if (countError) {
        throw countError;
      }
      
      const totalCount = count || 0;
      console.log('Total recordings in database:', totalCount);
      
      if (totalCount === 0) {
        setRecordingsData([]);
        setLoadingProgress({ 
          current: 1, 
          total: 1, 
          message: 'Không có dữ liệu nào' 
        });
        return;
      }
      
      // Calculate how many batches we need (1000 records per batch)
      const batchSize = 1000;
      const totalBatches = Math.ceil(totalCount / batchSize);
      let allData = [];
      
      setLoadingProgress({ 
        current: 0, 
        total: totalBatches, 
        message: `Đang tải ${totalCount} bản ghi trong ${totalBatches} batches...` 
      });
      
      // Fetch data in batches
      for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
        const startRange = batchIndex * batchSize;
        const endRange = Math.min(startRange + batchSize - 1, totalCount - 1);
        
        setLoadingProgress({ 
          current: batchIndex + 1, 
          total: totalBatches, 
          message: `Đang tải batch ${batchIndex + 1}/${totalBatches} (${startRange + 1}-${endRange + 1})...` 
        });
        
        const { data: batchData, error: batchError } = await supabase
          .from('recordings')
          .select(`
            *,
            questions:question_id (
              id,
              text,
              type,
              hint
            ),
            provinces:province_id (
              id,
              name,
              code
            ),
            profiles:user_id (
              full_name,
              affiliate_code,
              total_recordings,
              total_duration,
              is_pass
            )
          `)
          .order('recorded_at', { ascending: false })
          .range(startRange, endRange);
        
        if (batchError) {
          throw batchError;
        }
        
        // Transform the batch data
        const transformedBatch = (batchData || []).map(item => ({
          id: item.id,
          user_id: item.user_id,
          audio_url: item.audio_url,
          audio_duration: item.audio_duration,
          audio_script: item.audio_script,
          recorded_at: item.recorded_at,
          age: item.age,
          question_data: item.questions ? {
            id: item.questions.id,
            text: item.questions.text,
            type: item.questions.type,
            hint: item.questions.hint
          } : null,
          province_data: item.provinces ? {
            id: item.provinces.id,
            name: item.provinces.name,
            code: item.provinces.code
          } : null,
          user_data: item.profiles ? {
            full_name: item.profiles.full_name,
            affiliate_code: item.profiles.affiliate_code,
            total_recordings: item.profiles.total_recordings,
            total_duration: item.profiles.total_duration,
            is_pass: item.profiles.is_pass
          } : null,
          payment_amount: ((item.audio_duration || 0) / 60.0 / 20.0) * 100000
        }));
        
        allData = [...allData, ...transformedBatch];
        console.log(`Batch ${batchIndex + 1}/${totalBatches}: ${transformedBatch.length} records loaded`);
      }
      
      console.log('Total recordings loaded:', allData.length);
      setRecordingsData(allData);
      
      setLoadingProgress({ 
        current: totalBatches, 
        total: totalBatches, 
        message: `Hoàn thành! Đã tải ${allData.length} bản ghi` 
      });
      
    } catch (err) {
      console.error('Error fetching recordings data:', err);
      setError('Không thể tải dữ liệu. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecordingsData();
  }, []);

  // Filter and sort data
  const filteredData = recordingsData
    .filter((item) => {
      // Skip invalid items
      if (!item || !item.id) return false;
      
      if (!searchTerm) return true;
      const searchLower = searchTerm.toLowerCase();
      return (
        item.user_data?.full_name?.toLowerCase().includes(searchLower) ||
        item.question_data?.text?.toLowerCase().includes(searchLower) ||
        item.province_data?.name?.toLowerCase().includes(searchLower) ||
        item.user_data?.affiliate_code?.toLowerCase().includes(searchLower)
      );
    })
    .sort((a, b) => {
      let aValue, bValue;
      
      // Handle different sort fields based on JSONB structure
      switch (sortBy) {
        case 'user_full_name':
          aValue = a.user_data?.full_name || '';
          bValue = b.user_data?.full_name || '';
          break;
        case 'question_text':
          aValue = a.question_data?.text || '';
          bValue = b.question_data?.text || '';
          break;
        case 'province_name':
          aValue = a.province_data?.name || '';
          bValue = b.province_data?.name || '';
          break;
        case 'recorded_at':
          aValue = new Date(a.recorded_at);
          bValue = new Date(b.recorded_at);
          break;
        case 'audio_duration':
          aValue = a.audio_duration || 0;
          bValue = b.audio_duration || 0;
          break;
        case 'age':
          aValue = a.age || 0;
          bValue = b.age || 0;
          break;
        case 'payment_amount':
          aValue = a.payment_amount || 0;
          bValue = b.payment_amount || 0;
          break;
        default:
          aValue = a[sortBy] || '';
          bValue = b[sortBy] || '';
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  // Pagination
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = filteredData.slice(startIndex, endIndex);

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
    setCurrentPage(1);
  };

  const formatDuration = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col">
        <Header />
        
        <div className="flex-1 p-3 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
              <h1 className="text-2xl md:text-4xl font-bold text-[#2DA6A2] mb-2">
                Báo cáo thu âm
              </h1>
              <p className="text-base md:text-lg text-gray-600">
                Tổng quan toàn bộ dữ liệu thu âm trong hệ thống
              </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-[#2DA6A2]/10 rounded-lg">
                    <svg className="w-6 h-6 text-[#2DA6A2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Tổng số bài thu âm</p>
                    <p className="text-2xl font-bold text-[#2DA6A2]">{recordingsData.length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Tổng thời lượng</p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatDuration(recordingsData.reduce((sum, item) => sum + (item.audio_duration || 0), 0))}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Tổng thành tiền</p>
                    <p className="text-2xl font-bold text-yellow-600">
                      {formatCurrency(recordingsData.reduce((sum, item) => sum + (item.payment_amount || 0), 0))}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Số người tham gia</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {new Set(recordingsData.map(item => item.user_id)).size}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Search and Refresh */}
            <div className="bg-white rounded-lg shadow-md p-4 md:p-6 mb-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 md:space-x-4">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Tìm kiếm theo tên, câu hỏi, tỉnh..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="text-gray-700 w-full md:w-80 px-4 py-2 pl-10 text-base md:text-sm lg:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2DA6A2] focus:border-[#2DA6A2]"
                  />
                  <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                
                <button
                  onClick={fetchRecordingsData}
                  disabled={isLoading}
                  className="inline-flex items-center px-4 py-2 bg-[#2DA6A2] text-white rounded-lg hover:bg-[#2DA6A2]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Đang tải...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Làm mới
                    </>
                  )}
                </button>
              </div>
            </div>

            {isLoading ? (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-[#2DA6A2] border-t-transparent"></div>
                <p className="mt-2 text-gray-600">{loadingProgress.message || 'Đang tải dữ liệu...'}</p>
                {loadingProgress.total > 0 && (
                  <div className="mt-4">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-[#2DA6A2] h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${(loadingProgress.current / loadingProgress.total) * 100}%` }}
                      ></div>
                    </div>
                    <p className="mt-2 text-sm text-gray-500">
                      {loadingProgress.current} / {loadingProgress.total} batches
                    </p>
                  </div>
                )}
              </div>
            ) : error ? (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <div className="text-red-500 mb-4">
                  <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-red-600 mb-4">{error}</p>
                <button
                  onClick={fetchRecordingsData}
                  className="px-4 py-2 bg-[#2DA6A2] text-white rounded-lg hover:bg-[#2DA6A2]/90 transition-colors"
                >
                  Thử lại
                </button>
              </div>
            ) : (
              <>
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Danh sách thu âm ({filteredData.length} bài)
                    </h3>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th 
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                            onClick={() => handleSort('user_full_name')}
                          >
                            Người thu âm
                            {sortBy === 'user_full_name' && (
                              <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                            )}
                          </th>
                          <th 
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                            onClick={() => handleSort('question_text')}
                          >
                            Câu hỏi
                            {sortBy === 'question_text' && (
                              <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                            )}
                          </th>
                          <th 
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                            onClick={() => handleSort('province_name')}
                          >
                            Tỉnh
                            {sortBy === 'province_name' && (
                              <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                            )}
                          </th>
                          <th 
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                            onClick={() => handleSort('audio_duration')}
                          >
                            Thời lượng
                            {sortBy === 'audio_duration' && (
                              <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                            )}
                          </th>
                          <th 
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                            onClick={() => handleSort('age')}
                          >
                            Tuổi
                            {sortBy === 'age' && (
                              <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                            )}
                          </th>
                          <th 
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                            onClick={() => handleSort('payment_amount')}
                          >
                            Thành tiền
                            {sortBy === 'payment_amount' && (
                              <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                            )}
                          </th>
                          <th 
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                            onClick={() => handleSort('recorded_at')}
                          >
                            Ngày thu âm
                            {sortBy === 'recorded_at' && (
                              <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                            )}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {currentData.map((item) => (
                          <tr key={item.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {item.user_data?.full_name || 'Chưa cập nhật'}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {item.user_data?.affiliate_code}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-900 max-w-xs truncate">
                                {item.question_data?.text || 'Không có câu hỏi'}
                              </div>
                              {item.question_data?.type && (
                                <div className="text-xs text-gray-500 mt-1">
                                  Loại: {item.question_data.type}
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {item.province_data?.name || 'Chưa xác định'}
                              </div>
                              {item.province_data?.code && (
                                <div className="text-xs text-gray-500">
                                  {item.province_data.code}
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatDuration(item.audio_duration || 0)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {item.age || 'Chưa xác định'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                              {formatCurrency(item.payment_amount || 0)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatDate(item.recorded_at)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                      <div className="text-sm text-gray-700">
                        Hiển thị {startIndex + 1} đến {Math.min(endIndex, filteredData.length)} trong tổng số {filteredData.length} kết quả
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                          disabled={currentPage === 1}
                          className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Trước
                        </button>
                        <span className="text-sm text-gray-700">
                          Trang {currentPage} / {totalPages}
                        </span>
                        <button
                          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                          disabled={currentPage === totalPages}
                          className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Sau
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default ReportRecordingsPage;