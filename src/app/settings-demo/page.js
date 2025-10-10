'use client';

import { useState } from 'react';
import { SettingsManager, MaintenanceBanner, useSettingsRealtime } from '@/components/SettingsRealtime';

export default function SettingsDemoPage() {
  const { settings, isMaintenance, loading } = useSettingsRealtime();
  const [showRawData, setShowRawData] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Maintenance Banner */}
      <MaintenanceBanner />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-[#2DA6A2] mb-2">
              Settings Realtime Demo
            </h1>
            <p className="text-gray-600">
              Demo tính năng realtime cho bảng settings. Thay đổi sẽ được cập nhật ngay lập tức.
            </p>
          </div>

          {/* Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Trạng thái hệ thống
              </h3>
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${isMaintenance ? 'bg-red-500' : 'bg-green-500'}`}></div>
                <span className="text-sm font-medium text-gray-900">
                  {isMaintenance ? 'Đang bảo trì' : 'Hoạt động bình thường'}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Cập nhật realtime từ database
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Số lượng settings
              </h3>
              <div className="text-2xl font-bold text-[#2DA6A2]">
                {loading ? '...' : Object.keys(settings).length}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Tổng số cài đặt hiện có
              </p>
            </div>
          </div>

          {/* Settings Manager */}
          <div className="mb-8">
            <SettingsManager />
          </div>

          {/* Raw Data Viewer */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Raw Data Viewer
              </h3>
              <button
                onClick={() => setShowRawData(!showRawData)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                {showRawData ? 'Ẩn' : 'Hiện'} Raw Data
              </button>
            </div>
            
            {showRawData && (
              <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-auto">
                <pre>{JSON.stringify(settings, null, 2)}</pre>
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">
              Hướng dẫn sử dụng
            </h3>
            <div className="space-y-2 text-sm text-blue-800">
              <p>1. <strong>Mở nhiều tab</strong> cùng trang này để test realtime</p>
              <p>2. <strong>Chỉnh sửa settings</strong> trong một tab</p>
              <p>3. <strong>Quan sát</strong> các tab khác tự động cập nhật</p>
              <p>4. <strong>Test maintenance mode</strong> bằng cách đổi maintenance_mode từ 'false' thành 'true'</p>
              <p>5. <strong>Kiểm tra banner</strong> maintenance xuất hiện ngay lập tức</p>
            </div>
          </div>

          {/* Technical Info */}
          <div className="mt-6 bg-gray-100 border border-gray-200 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-2">Thông tin kỹ thuật:</h4>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• Sử dụng Supabase Realtime với PostgreSQL triggers</li>
              <li>• Broadcast qua pg_notify với channel 'settings_changed'</li>
              <li>• React hook useSettingsRealtime để subscribe changes</li>
              <li>• Tự động cập nhật UI khi có thay đổi từ database</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
