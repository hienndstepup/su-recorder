"use client";

import { useState, useEffect, useRef } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import Header from "@/components/Header";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

export default function DashboardPage() {
  const { user } = useAuth();
  const [reportType, setReportType] = useState("day");
  const [reportData, setReportData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    start: new Date().toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [selectedUser, setSelectedUser] = useState(null); // null means all users
  const [usersList, setUsersList] = useState([]);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const userFilterRef = useRef(null);

  // Fetch users list for filter
  const fetchUsersList = async () => {
    if (!user) return;
    
    try {
      const { data: usersData, error: usersError } = await supabase
        .rpc('get_users_for_filter');

      if (usersError) throw usersError;
      setUsersList(usersData || []);
    } catch (error) {
      console.error('Error fetching users list:', error);
    }
  };

  // Filter users based on search term
  const filteredUsers = usersList.filter(user => 
    user.user_name?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
    user.affiliate_code?.toLowerCase().includes(userSearchTerm.toLowerCase())
  );

  // Handle user selection
  const handleUserSelect = (userId) => {
    setSelectedUser(userId);
    setShowUserDropdown(false);
    setUserSearchTerm(''); // Clear search when selecting
  };

  // Handle input click
  const handleInputClick = () => {
    setShowUserDropdown(true);
  };

  // Handle input change
  const handleInputChange = (e) => {
    setUserSearchTerm(e.target.value);
    setShowUserDropdown(true); // Show dropdown when typing
  };

  // Fetch report data
  const fetchReportData = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const startDate = new Date(dateRange.start).toISOString();
      const endDate = new Date(dateRange.end + 'T23:59:59').toISOString();

      // Get summary report
      const { data: reportData, error: reportError } = await supabase
        .rpc('get_recordings_report', {
          report_type: reportType,
          start_date: startDate,
          end_date: endDate,
          user_filter: selectedUser
        });

      if (reportError) throw reportError;
      setReportData(reportData || []);

    } catch (error) {
      console.error('Error fetching report data:', error);
      alert('Không thể tải dữ liệu báo cáo. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchUsersList();
    }
  }, [user]);

  useEffect(() => {
    fetchReportData();
  }, [user, reportType, dateRange, selectedUser]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userFilterRef.current && !userFilterRef.current.contains(event.target)) {
        setShowUserDropdown(false);
      }
    };

    if (showUserDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserDropdown]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours}h ${minutes}m ${secs}s`;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('vi-VN');
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col">
        <Header />
        
        {/* Main Content */}
        <div className="flex-1 p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                Báo cáo Recordings
              </h1>
              <p className="text-gray-600">
                Báo cáo chi tiết về số lượng bản thu, thời lượng và thành tiền
              </p>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow-md p-4 md:p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* User Filter */}
                <div ref={userFilterRef}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lọc theo user
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Tìm kiếm user..."
                      value={userSearchTerm}
                      onChange={handleInputChange}
                      onClick={handleInputClick}
                      className="text-black w-full px-3 py-2 pr-8 text-base md:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2DA6A2] focus:border-[#2DA6A2]"
                    />
                    <svg
                      className="absolute right-2 top-2.5 h-4 w-4 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>
                  
                  {/* Selected User Display */}
                  {selectedUser && !showUserDropdown && (
                    <div className="mt-2 flex items-center justify-between bg-[#2DA6A2]/10 px-3 py-2 rounded-lg">
                      <span className="text-sm text-[#2DA6A2]">
                        {usersList.find(u => u.user_id === selectedUser)?.user_name} 
                        ({usersList.find(u => u.user_id === selectedUser)?.affiliate_code})
                      </span>
                      <button
                        onClick={() => setSelectedUser(null)}
                        className="text-[#2DA6A2] hover:text-[#2DA6A2]/70"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  )}
                  
                  {/* Search Results */}
                  {showUserDropdown && (
                    <div className="mt-2 max-h-48 overflow-y-auto border border-gray-300 rounded-lg bg-white shadow-lg">
                      <div
                        className={`px-3 py-2 cursor-pointer hover:bg-gray-50 border-b border-gray-100 ${
                          !selectedUser ? 'bg-[#2DA6A2]/10 text-[#2DA6A2]' : ''
                        }`}
                        onClick={() => handleUserSelect(null)}
                      >
                        <span className="text-black text-sm font-medium">Tất cả user</span>
                      </div>
                      {filteredUsers.map((user) => (
                        <div
                          key={user.user_id}
                          className={`px-3 py-2 cursor-pointer hover:bg-gray-50 ${
                            selectedUser === user.user_id ? 'bg-[#2DA6A2]/10' : ''
                          }`}
                          onClick={() => handleUserSelect(user.user_id)}
                        >
                          <div className={`text-sm font-medium ${
                            selectedUser === user.user_id ? 'text-[#2DA6A2]' : 'text-gray-900'
                          }`}>{user.user_name}</div>
                          <div className="text-xs text-gray-500">{user.affiliate_code}</div>
                        </div>
                      ))}
                      {filteredUsers.length === 0 && userSearchTerm && (
                        <div className="px-3 py-2 text-sm text-gray-500">
                          Không tìm thấy user nào
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Report Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Loại báo cáo
                  </label>
                  <select
                    value={reportType}
                    onChange={(e) => setReportType(e.target.value)}
                    className="text-black w-full px-3 py-2 text-base md:text-sm lg:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2DA6A2] focus:border-[#2DA6A2]"
                  >
                    <option value="day">Theo ngày</option>
                    <option value="week">Theo tuần</option>
                    <option value="month">Theo tháng</option>
                  </select>
                </div>

                {/* Start Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Từ ngày
                  </label>
                  <input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                    className="text-black w-full px-3 py-2 text-base md:text-sm lg:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2DA6A2] focus:border-[#2DA6A2]"
                  />
                </div>

                {/* End Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Đến ngày
                  </label>
                  <input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                    className="text-black w-full px-3 py-2 text-base md:text-sm lg:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2DA6A2] focus:border-[#2DA6A2]"
                  />
                </div>


              </div>
            </div>

            {/* Loading */}
            {isLoading && (
              <div className="flex justify-center items-center py-8">
                <svg className="animate-spin h-8 w-8 text-[#2DA6A2]" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="ml-2 text-gray-600">Đang tải dữ liệu...</span>
              </div>
            )}

            {/* Summary Cards */}
            {!isLoading && reportData.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6">
                <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Tổng bản thu</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {reportData.reduce((sum, item) => sum + parseInt(item.total_recordings), 0)}
                      </p>
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
                      <p className="text-2xl font-bold text-gray-900">
                        {formatDuration(reportData.reduce((sum, item) => sum + parseInt(item.total_duration), 0))}
                      </p>
                      <p className="text-xs text-gray-500">
                        ({reportData.reduce((sum, item) => sum + parseInt(item.total_duration), 0)} giây)
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
                      <p className="text-2xl font-bold text-gray-900">
                        {formatCurrency(reportData.reduce((sum, item) => sum + parseFloat(item.total_payment), 0))}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Số người dùng</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {Math.max(...reportData.map(item => parseInt(item.unique_users)))}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Report Table */}
            {!isLoading && reportData.length > 0 && (
              <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
                <div className="px-4 md:px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Báo cáo theo {reportType === 'day' ? 'ngày' : reportType === 'week' ? 'tuần' : 'tháng'}
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Thời gian
                        </th>
                        <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Số bản thu
                        </th>
                        <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Thời lượng
                        </th>
                        <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Thành tiền
                        </th>
                        <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Trung bình
                        </th>
                        <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Số người dùng
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {reportData.map((item, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(item.period_date)}
                          </td>
                          <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.total_recordings}
                          </td>
                          <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div>
                              {formatDuration(parseInt(item.total_duration))}
                              <div className="text-xs text-gray-500">
                                ({parseInt(item.total_duration)} giây)
                              </div>
                            </div>
                          </td>
                          <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(parseFloat(item.total_payment))}
                          </td>
                          <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div>
                              {formatDuration(Math.round(parseFloat(item.avg_duration)))}
                              <div className="text-xs text-gray-500">
                                ({Math.round(parseFloat(item.avg_duration))} giây)
                              </div>
                            </div>
                          </td>
                          <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.unique_users}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}


            {/* No Data */}
            {!isLoading && reportData.length === 0 && (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Không có dữ liệu</h3>
                <p className="text-gray-600">Không tìm thấy bản thu nào trong khoảng thời gian đã chọn.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
