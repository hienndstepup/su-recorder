"use client";

import { useState, useEffect } from "react";
import { supabase, supabaseAdmin } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";

const removeVietnameseTones = (str) => {
  str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
  str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
  str = str.replace(/ì|í|ị|ỉ|ĩ/g, "i");
  str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
  str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
  str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
  str = str.replace(/đ/g, "d");
  str = str.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, "A");
  str = str.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, "E");
  str = str.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, "I");
  str = str.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, "O");
  str = str.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, "U");
  str = str.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, "Y");
  str = str.replace(/Đ/g, "D");
  str = str.toLowerCase();
  str = str.replace(/\s+/g, "");
  return str;
};

const CreatePage = () => {
  const { user } = useAuth();
  const [currentUserProfile, setCurrentUserProfile] = useState(null);
  const [names, setNames] = useState("");
  const [emails, setEmails] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const [creationResults, setCreationResults] = useState({
    total: 0,
    success: 0,
    failed: 0,
  });
  const [failedUsers, setFailedUsers] = useState([]);

  // Lấy thông tin profile của user hiện tại (bao gồm affiliate_code)
  useEffect(() => {
    const fetchCurrentUserProfile = async () => {
      if (user) {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (data && !error) {
          setCurrentUserProfile(data);
        }
      }
    };

    fetchCurrentUserProfile();
  }, [user]);

  const handleBatchCreate = async () => {
    if (!emails.length) {
      alert("Vui lòng nhập danh sách tên trước khi tạo tài khoản");
      return;
    }

    // Kiểm tra xem đã có affiliate_code chưa
    if (!currentUserProfile?.affiliate_code) {
      alert("Không thể tạo tài khoản mới. Vui lòng thử lại sau.");
      return;
    }

    setIsCreating(true);
    setCreationResults({ total: emails.length, success: 0, failed: 0 });
    setFailedUsers([]);

    const nameList = names.split("\n").filter(name => name.trim());
    
    for (let i = 0; i < nameList.length; i++) {
      const name = nameList[i].trim();
      const email = emails[i];
      
      try {
        // Tạo user mới với Supabase Auth
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: email,
          password: "gioitienganh",
          email_confirm: true,
          user_metadata: {
            full_name: name,
            role: "ctv",
            referrer_code: currentUserProfile.affiliate_code,
          },
        });

        if (authError) throw authError;

        setCreationResults(prev => ({
          ...prev,
          success: prev.success + 1
        }));
      } catch (error) {
        console.error("Error creating user:", name, error);
        setCreationResults(prev => ({
          ...prev,
          failed: prev.failed + 1
        }));
        setFailedUsers(prev => [...prev, { email, name, error: error.message }]);
      }
    }

    setIsCreating(false);
  };

  const handleNamesChange = (e) => {
    const value = e.target.value;
    setNames(value);

    // Convert names to emails
    const emailList = value
      .split("\n")
      .filter((name) => name.trim())
      .map((name) => `${removeVietnameseTones(name.trim())}@gmail.com`);

    setEmails(emailList);
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl md:text-4xl font-bold text-[#2DA6A2] mb-6">
          Tạo danh sách email
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
          {/* Input Column */}
          <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Danh sách tên (mỗi dòng một tên)
            </label>
            <textarea
              value={names}
              onChange={handleNamesChange}
              className="w-full h-[500px] p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2DA6A2] focus:border-[#2DA6A2] text-sm font-mono text-gray-900 placeholder-gray-500"
              placeholder="Nhập danh sách tên..."
            />
          </div>

          {/* Output Column */}
          <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Danh sách email ({emails.length})
              </label>
              {emails.length > 0 && (
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(emails.join("\n"));
                  }}
                  className="text-sm text-[#2DA6A2] hover:text-[#2DA6A2]/80 font-medium flex items-center"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-4 h-4 mr-1"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184"
                    />
                  </svg>
                  Sao chép
                </button>
              )}
            </div>
            <div className="h-[500px] p-4 bg-gray-50 rounded-lg overflow-y-auto">
              <pre className="text-sm font-mono whitespace-pre-wrap text-gray-700">
                {emails.join("\n")}
              </pre>
            </div>
          </div>

          {/* Batch Creation Button and Results */}
          <div className="col-span-1 md:col-span-2 mt-6">
            <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <button
                  onClick={handleBatchCreate}
                  disabled={isCreating || !emails.length}
                  className={`flex items-center justify-center px-6 py-3 rounded-lg text-white font-medium transition-colors ${
                    isCreating || !emails.length
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-[#2DA6A2] hover:bg-[#2DA6A2]/90"
                  }`}
                >
                  {isCreating ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Đang tạo tài khoản...
                    </>
                  ) : (
                    "Tạo tài khoản hàng loạt"
                  )}
                </button>

                {(isCreating || creationResults.total > 0) && (
                  <div className="flex items-center gap-6 text-sm">
                    <div className="flex items-center">
                      <span className="text-gray-600 mr-2">Tổng số:</span>
                      <span className="font-medium">{creationResults.total}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-gray-600 mr-2">Thành công:</span>
                      <span className="font-medium text-green-600">
                        {creationResults.success}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-gray-600 mr-2">Thất bại:</span>
                      <span className="font-medium text-red-600">
                        {creationResults.failed}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Failed Users List */}
              {failedUsers.length > 0 && (
                <div className="mt-4 p-4 bg-red-50 rounded-lg">
                  <h3 className="text-sm font-medium text-red-800 mb-2">
                    Danh sách tài khoản tạo thất bại ({failedUsers.length}):
                  </h3>
                  <div className="space-y-2">
                    {failedUsers.map((user, index) => (
                      <div key={index} className="text-sm">
                        <p className="text-gray-900 font-medium">{user.name}</p>
                        <p className="text-gray-600">{user.email}</p>
                        <p className="text-red-600 text-xs">{user.error}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
    </ProtectedRoute>
  );
};

export default CreatePage;