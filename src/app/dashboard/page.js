"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import Header from "@/components/Header";

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col">
        <Header />
        
        {/* Main Content */}
        <div className="flex-1 p-4 md:p-6 lg:p-8 flex items-center justify-center">
          <div className="text-center">
            <div className="mb-6">
              <svg
                className="w-24 h-24 mx-auto text-[#2DA6A2]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Coming Soon
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              Chúng tôi đang phát triển trang Dashboard. <br />
              Vui lòng quay lại sau!
            </p>
            <div className="inline-flex items-center text-[#2DA6A2]">
              <svg
                className="w-5 h-5 mr-2 animate-spin"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Đang phát triển...
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
