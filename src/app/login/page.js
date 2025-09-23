'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [savedAccounts, setSavedAccounts] = useState([]);
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);
  const dropdownRef = useRef(null);
  
  const { signIn } = useAuth();
  const router = useRouter();

  // Load saved accounts from localStorage
  useEffect(() => {
    const loadSavedAccounts = () => {
      try {
        const savedAccountsData = localStorage.getItem('savedAccounts');
        if (savedAccountsData) {
          setSavedAccounts(JSON.parse(savedAccountsData));
        }
      } catch (error) {
        console.error('Error loading saved accounts:', error);
      }
    };

    loadSavedAccounts();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowAccountDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Save account to localStorage
  const saveAccount = (email, password) => {
    try {
      const newAccount = { email, password, timestamp: Date.now() };
      const updatedAccounts = [newAccount, ...savedAccounts.filter(acc => acc.email !== email)].slice(0, 5); // Keep only 5 most recent
      setSavedAccounts(updatedAccounts);
      localStorage.setItem('savedAccounts', JSON.stringify(updatedAccounts));
    } catch (error) {
      console.error('Error saving account:', error);
    }
  };

  // Remove account from localStorage
  const removeAccount = (email) => {
    try {
      const updatedAccounts = savedAccounts.filter(acc => acc.email !== email);
      setSavedAccounts(updatedAccounts);
      localStorage.setItem('savedAccounts', JSON.stringify(updatedAccounts));
    } catch (error) {
      console.error('Error removing account:', error);
    }
  };

  // Load account credentials
  const loadAccount = (email, password) => {
    setFormData({ email, password });
    setShowAccountDropdown(false);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const { data, error } = await signIn(formData.email, formData.password);
      
      if (error) {
        setError(error.message);
      } else {
        // Đăng nhập thành công
        console.log('Đăng nhập thành công:', data);
        
        // Save account if "Remember me" is checked
        if (rememberMe) {
          saveAccount(formData.email, formData.password);
        }
        
        // Chuyển về trang chủ
        router.push('/');
      }
    } catch (err) {
      setError('Có lỗi xảy ra khi đăng nhập. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#2DA6A2] rounded-full mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Đăng nhập</h1>
          <p className="text-gray-600">Chào mừng bạn quay trở lại!</p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div className="relative" ref={dropdownRef}>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  onFocus={() => setShowAccountDropdown(savedAccounts.length > 0)}
                  required
                  className="w-full px-4 py-3 text-base text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2DA6A2] focus:border-[#2DA6A2] transition-colors"
                  placeholder="Nhập email của bạn"
                />
                {savedAccounts.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowAccountDropdown(!showAccountDropdown)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                )}
              </div>
              
              {/* Saved Accounts Dropdown */}
              {showAccountDropdown && savedAccounts.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {savedAccounts.map((account, index) => (
                    <div key={index} className="flex items-center justify-between p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0">
                      <button
                        type="button"
                        onClick={() => loadAccount(account.email, account.password)}
                        className="flex-1 text-left text-sm text-gray-700 hover:text-[#2DA6A2]"
                      >
                        <div className="font-medium">{account.email}</div>
                        <div className="text-xs text-gray-500">
                          {new Date(account.timestamp).toLocaleDateString('vi-VN')}
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeAccount(account.email);
                        }}
                        className="ml-2 p-1 text-gray-400 hover:text-red-500"
                        title="Xóa tài khoản đã lưu"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Mật khẩu
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 text-base text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2DA6A2] focus:border-[#2DA6A2] transition-colors"
                placeholder="Nhập mật khẩu"
              />
            </div>

            {/* Remember me & Forgot password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 text-[#2DA6A2] focus:ring-[#2DA6A2] border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                  Ghi nhớ đăng nhập
                </label>
              </div>
              <Link href="/forgot-password" className="text-sm text-[#2DA6A2] hover:text-[#2DA6A2]/80 transition-colors">
                Quên mật khẩu?
              </Link>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#2DA6A2] hover:bg-[#2DA6A2]/90 disabled:bg-[#2DA6A2]/50 text-white font-medium py-3 px-4 rounded-lg transition-colors focus:ring-2 focus:ring-[#2DA6A2] focus:ring-offset-2 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>
          </form>


          {/* Sign up link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Chưa có tài khoản?{' '}
              <Link href="/register" className="font-medium text-[#2DA6A2] hover:text-[#2DA6A2]/80 transition-colors">
                Đăng ký ngay
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
