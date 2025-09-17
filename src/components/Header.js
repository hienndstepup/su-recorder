"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function Header() {
  const { user, signOut } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  // Function to check if a navigation item is active
  const isActive = (path) => {
    if (path === "/" && pathname === "/") return true;
    if (path !== "/" && pathname.startsWith(path)) return true;
    return false;
  };

  // Function to get navigation item classes
  const getNavClasses = (path) => {
    const baseClasses = "px-4 py-2.5 rounded-md text-base font-semibold transition-colors";
    if (isActive(path)) {
      return `${baseClasses} bg-[#2DA6A2] text-white`;
    }
    return `${baseClasses} text-gray-700 hover:text-[#2DA6A2]`;
  };

  // Function to get mobile navigation item classes
  const getMobileNavClasses = (path) => {
    const baseClasses = "block px-3 py-2 rounded-md text-sm md:text-base font-semibold transition-colors";
    if (isActive(path)) {
      return `${baseClasses} bg-[#2DA6A2] text-white`;
    }
    return `${baseClasses} text-gray-700 hover:text-[#2DA6A2]`;
  };

  return (
    <nav className="bg-white shadow-sm relative z-1000">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative flex justify-between items-center h-16 md:h-20">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <div className="w-8 h-8 md:w-10 md:h-10 bg-[#2DA6A2] rounded-lg flex items-center justify-center">
                  <svg
                    className="w-5 h-5 md:w-6 md:h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                    />
                  </svg>
                </div>
                <span className="ml-2 text-xl md:text-2xl font-bold text-gray-900">
                  SU Recorder
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              href="/"
              className={getNavClasses("/")}
            >
              Trang chủ
            </Link>
            <Link
              href="/dashboard"
              className={getNavClasses("/dashboard")}
            >
              Dashboard
            </Link>
            <Link
              href="/manage-ctv"
              className={getNavClasses("/manage-ctv")}
            >
              Quản lý CTV
            </Link>
            <Link
              href="/profile"
              className={getNavClasses("/profile")}
            >
              Cá nhân
            </Link>
          </div>

          {/* User Info & Actions */}
          <div className="flex items-center space-x-4">
            <div className="hidden sm:flex items-center space-x-4">
              <div className="w-10 h-10 bg-[#2DA6A2] rounded-full flex items-center justify-center" title={user?.user_metadata?.full_name || user?.email}>
                <span className="text-white text-base font-medium">
                  {(user?.user_metadata?.full_name || user?.email || "")
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2)}
                </span>
              </div>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  signOut();
                }}
                className="text-red-600 hover:text-red-800 hover:bg-red-50 px-4 py-2.5 rounded-md text-base font-semibold transition-colors"
              >
                Đăng xuất
              </button>
            </div>
            
            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden absolute right-4 top-1/2 -translate-y-1/2 inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-[#2DA6A2] hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#2DA6A2]"
            >
              <svg
                className={`${isMobileMenuOpen ? 'hidden' : 'block'} h-6 w-6`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              <svg
                className={`${isMobileMenuOpen ? 'block' : 'hidden'} h-6 w-6`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

            {/* Mobile Navigation Menu */}
            {isMobileMenuOpen && (
              <div className="md:hidden">
                <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-gray-50 border-t">
                  <Link
                    href="/"
                    className={getMobileNavClasses("/")}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Trang chủ
                  </Link>
                  <Link
                    href="/dashboard"
                    className={getMobileNavClasses("/dashboard")}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/manage-ctv"
                    className={getMobileNavClasses("/manage-ctv")}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Quản lý CTV
                  </Link>
                  <Link
                    href="/profile"
                    className={getMobileNavClasses("/profile")}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Cá nhân
                  </Link>
                  <div className="border-t border-gray-200 pt-2 mt-2">
                    <div className="px-3 py-2 text-xs md:text-sm text-gray-500">
                      Xin chào, {user?.user_metadata?.full_name || user?.email}
                    </div>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        signOut();
                        setIsMobileMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 transition-colors"
                    >
                      Đăng xuất
                    </button>
                  </div>
                </div>
              </div>
            )}
      </div>
    </nav>
  );
}
