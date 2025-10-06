"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Lấy session hiện tại
    const getSession = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error("Error getting session:", error);
          // Nếu lỗi session, clear user state
          setUser(null);
        } else {
          setUser(session?.user ?? null);
        }
      } catch (error) {
        console.error("Error in getSession:", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    getSession();

    // Lắng nghe thay đổi auth state
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state change:", event, session?.user?.email);

      try {
        setUser(session?.user ?? null);
        setLoading(false);

        // Redirect sau khi đăng xuất
        if (event === "SIGNED_OUT") {
          router.push("/login");
        }

        // Xử lý lỗi token refresh
        if (event === "TOKEN_REFRESHED") {
          console.log("Token refreshed successfully");
        }
      } catch (error) {
        console.error("Error in auth state change:", error);
        setUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  // Đăng nhập với email và password
  const signIn = async (email, password) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  // Đăng ký với email và password
  const signUp = async (email, password, metadata = {}) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
        },
      });

      if (error) {
        throw error;
      }

      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  // Đăng xuất
  const signOut = async () => {
    try {
      setLoading(true);

      // Clear Datadog user context and stop session khi đăng xuất
      if (typeof window !== 'undefined' && window.datadogUtils) {
        window.datadogUtils.clearUserAndStopSession();
      }

      // Thử signOut với scope local trước
      const { error } = await supabase.auth.signOut({ scope: "local" });

      if (error) {
        console.error("Sign out error:", error);

        // Nếu lỗi session_not_found, vẫn tiếp tục logout local
        if (
          error.message?.includes("session_not_found") ||
          error.code === "session_not_found"
        ) {
          console.log("Session not found, clearing local state...");
          // Clear local state manually
          setUser(null);
          setLoading(false);
          // Redirect to login page
          window.location.href = "/login";
          return;
        }

        throw error;
      }

      // Nếu signOut thành công, onAuthStateChange sẽ xử lý redirect
    } catch (error) {
      console.error("Sign out error:", error);

      // Trong trường hợp lỗi, vẫn clear local state và redirect
      setUser(null);
      setLoading(false);
      window.location.href = "/login";
    } finally {
      setLoading(false);
    }
  };

  // Reset password
  const resetPassword = async (email) => {
    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        throw error;
      }

      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  };

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
