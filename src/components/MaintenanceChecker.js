'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useSettingsRealtime } from './SettingsRealtime';

/**
 * Component kiểm tra trạng thái bảo trì và điều hướng
 * - Hiển thị trang maintenance khi đang bảo trì
 * - Tự động chuyển về trang chủ khi kết thúc bảo trì
 * - Cho phép admin truy cập trang settings-demo ngay cả khi bảo trì
 */
export default function MaintenanceChecker({ children }) {
  const { isMaintenance, loading } = useSettingsRealtime();
  const router = useRouter();
  const pathname = usePathname();
  const [isInitialized, setIsInitialized] = useState(false);

  // Danh sách các route được phép truy cập khi bảo trì
  const allowedRoutesDuringMaintenance = [
    '/settings-demo', // Trang demo settings
    '/api', // API routes
  ];

  // Kiểm tra xem route hiện tại có được phép khi bảo trì không
  const isAllowedRoute = allowedRoutesDuringMaintenance.some(route => 
    pathname.startsWith(route)
  );

  useEffect(() => {
    // Chỉ chạy sau khi đã load xong settings
    if (!loading) {
      setIsInitialized(true);
    }
  }, [loading]);

  useEffect(() => {
    // Chỉ xử lý điều hướng sau khi đã khởi tạo
    if (!isInitialized) return;

    // Nếu đang bảo trì và không phải route được phép
    if (isMaintenance && !isAllowedRoute) {
      // Không làm gì, sẽ hiển thị trang maintenance
      return;
    }

    // Nếu không còn bảo trì và đang ở trang maintenance
    if (!isMaintenance && pathname === '/maintenance') {
      // Chuyển về trang chủ
      router.push('/');
    }
  }, [isMaintenance, isInitialized, pathname, isAllowedRoute, router]);

  // Hiển thị loading khi đang khởi tạo
  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2DA6A2] mx-auto mb-4"></div>
          <p className="text-gray-600">Đang kiểm tra trạng thái hệ thống...</p>
        </div>
      </div>
    );
  }

  // Nếu đang bảo trì và không phải route được phép, hiển thị trang maintenance
  if (isMaintenance && !isAllowedRoute) {
    return <MaintenancePage />;
  }

  // Hiển thị nội dung bình thường
  return children;
}

/**
 * Trang hiển thị khi hệ thống đang bảo trì
 */
function MaintenancePage() {
  const { settings } = useSettingsRealtime();
  
  // Lấy thông tin bảo trì từ settings
  const maintenanceMessage = settings.maintenance_message?.value || 
    'Hệ thống đang được bảo trì để cải thiện dịch vụ. Vui lòng quay lại sau.';
  
  const estimatedTime = settings.maintenance_estimated_time?.value || 
    'Chúng tôi sẽ hoàn tất trong thời gian sớm nhất có thể.';

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        {/* Icon */}
        <div className="mb-6">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Hệ thống đang bảo trì
        </h1>

        {/* Message */}
        <p className="text-gray-600 mb-6 leading-relaxed">
          {maintenanceMessage}
        </p>

        {/* Estimated Time */}
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-orange-800">
            <strong>Thời gian dự kiến:</strong> {estimatedTime}
          </p>
        </div>

        {/* Status Indicator */}
        <div className="flex items-center justify-center space-x-2 mb-6">
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
          <span className="text-sm text-gray-600">Đang bảo trì</span>
        </div>

        {/* Refresh Button */}
        <button
          onClick={() => window.location.reload()}
          className="w-full bg-[#2DA6A2] hover:bg-[#2DA6A2]/90 text-white font-medium py-3 px-4 rounded-lg transition-colors"
        >
          🔄 Kiểm tra lại
        </button>

        {/* Footer */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            Trang sẽ tự động chuyển về trang chủ khi hệ thống hoạt động trở lại
          </p>
        </div>
      </div>
    </div>
  );
}
