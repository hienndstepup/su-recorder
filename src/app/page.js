import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <div className="w-8 h-8 bg-[#2DA6A2] rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                </div>
                <span className="ml-2 text-xl font-bold text-gray-900">SU Recorder</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/login"
                className="text-gray-700 hover:text-[#2DA6A2] px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Đăng nhập
              </Link>
              <Link
                href="/register"
                className="bg-[#2DA6A2] hover:bg-[#2DA6A2]/90 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Đăng ký
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Chào mừng đến với{' '}
            <span className="text-[#2DA6A2]">SU Recorder</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Nền tảng ghi âm và quản lý âm thanh chuyên nghiệp. 
            Tạo, chỉnh sửa và chia sẻ các bản ghi âm của bạn một cách dễ dàng.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="bg-[#2DA6A2] hover:bg-[#2DA6A2]/90 text-white font-medium py-3 px-8 rounded-lg transition-colors text-lg"
            >
              Bắt đầu ngay
            </Link>
            <Link
              href="/login"
              className="border border-[#2DA6A2] text-[#2DA6A2] hover:bg-[#2DA6A2] hover:text-white font-medium py-3 px-8 rounded-lg transition-colors text-lg"
            >
              Đăng nhập
            </Link>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Tính năng nổi bật
            </h2>
            <p className="text-xl text-gray-600">
              Tất cả những gì bạn cần để tạo ra những bản ghi âm chất lượng cao
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-[#2DA6A2] rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Ghi âm chất lượng cao</h3>
              <p className="text-gray-600">Ghi âm với chất lượng studio, hỗ trợ nhiều định dạng âm thanh</p>
            </div>
            
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-[#2DA6A2] rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Chỉnh sửa dễ dàng</h3>
              <p className="text-gray-600">Công cụ chỉnh sửa trực quan, cắt ghép âm thanh một cách chuyên nghiệp</p>
            </div>
            
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-[#2DA6A2] rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Chia sẻ nhanh chóng</h3>
              <p className="text-gray-600">Chia sẻ bản ghi âm với bạn bè và cộng đồng một cách dễ dàng</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="w-8 h-8 bg-[#2DA6A2] rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </div>
              <span className="ml-2 text-xl font-bold">SU Recorder</span>
            </div>
            <p className="text-gray-400 mb-4">
              Nền tảng ghi âm và quản lý âm thanh chuyên nghiệp
            </p>
            <div className="flex justify-center space-x-6">
              <Link href="/login" className="text-gray-400 hover:text-white transition-colors">
                Đăng nhập
              </Link>
              <Link href="/register" className="text-gray-400 hover:text-white transition-colors">
                Đăng ký
              </Link>
            </div>
            <p className="text-gray-500 text-sm mt-6">
              © 2024 SU Recorder. Tất cả quyền được bảo lưu.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
