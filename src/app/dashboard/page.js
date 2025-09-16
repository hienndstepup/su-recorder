"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import Header from "@/components/Header";

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col">
        <Header />
        
        {/* Main Content */}
        <div className="flex-1 p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {/* Page Header */}
            <div className="mb-8">
              <h1 className="text-3xl md:text-4xl font-bold text-[#2DA6A2] mb-2">
                Dashboard
              </h1>
              <p className="text-lg text-gray-600">
                Tổng quan về hoạt động và thống kê của hệ thống
              </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-[#2DA6A2]">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-[#2DA6A2] rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Tổng CTV</p>
                    <p className="text-2xl font-semibold text-gray-900">24</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Bài ghi âm</p>
                    <p className="text-2xl font-semibold text-gray-900">1,234</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Hoạt động gần đây</h3>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-[#2DA6A2] rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">CTV Nguyễn Văn A đã hoàn thành bài ghi âm</p>
                      <p className="text-xs text-gray-500">2 phút trước</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">CTV Trần Thị B bắt đầu bài mới</p>
                      <p className="text-xs text-gray-500">15 phút trước</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">CTV Lê Văn C đã tải lên 5 bài ghi âm</p>
                      <p className="text-xs text-gray-500">1 giờ trước</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Top CTV</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-[#2DA6A2] rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-medium">1</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Nguyễn Văn A</p>
                        <p className="text-xs text-gray-500">Miền Bắc</p>
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-[#2DA6A2]">156 bài</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-medium">2</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Trần Thị B</p>
                        <p className="text-xs text-gray-500">Miền Trung</p>
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-blue-500">142 bài</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-medium">3</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Lê Văn C</p>
                        <p className="text-xs text-gray-500">Miền Nam</p>
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-green-500">128 bài</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
