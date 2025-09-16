"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import GlobalMic from "../components/GlobalMic";
import { appApi } from "@/api/app";
import { useAuth } from "@/contexts/AuthContext";

const RecordPage = () => {
  const { user } = useAuth();

  // Mock data - sẽ được thay thế bằng data thực tế
  const currentQuestion = 1;
  const totalQuestions = 30;
  const question =
    "Cậu có biết tại sao máy tính lại có thể tính toán nhanh như vậy không?";

  // State để lưu kết quả ASR
  const [asrResult, setAsrResult] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const audioRef = useRef(null);

  const handleMicStart = () => {
    console.log("Bắt đầu ghi âm");
    // Reset kết quả khi bắt đầu ghi âm mới
    setAsrResult(null);
  };

  const handleAfterRecord = (blob) => {
    setIsProcessing(true);
    const formData = new FormData();
    let file = new File([blob], "audio.wav", { type: "audio/wav" });
    formData.append("audio-file", file);
    appApi
      .checkAsr(formData)
      .then((res) => {
        const result = res?.data?.data;
        console.log("handleAfterRecord", result);
        setAsrResult(result);

        // Tự động phát audio sau khi có kết quả
        setTimeout(() => {
          if (audioRef.current) {
            audioRef.current.play().catch((error) => {
              console.error("Error auto-playing audio:", error);
            });
          }
        }, 500); // Delay 500ms để đảm bảo audio element đã render
      })
      .catch((error) => {
        console.error("Error processing audio:", error);
      })
      .finally(() => {
        setIsProcessing(false);
      });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* User Info & Home Button */}
        <div className="mb-4 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            {user ? `Xin chào, ${user?.user_metadata?.full_name || user?.email}` : "Trang ghi âm"}
          </div>
          <Link
            href="/"
            className="text-sm text-[#2DA6A2] hover:text-[#2DA6A2]/80 transition-colors"
          >
            Về Trang chủ
          </Link>
        </div>

          {/* Main Card */}
          <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
            {/* Question Header */}
            <div className="text-center mb-6">
              <h2 className="text-2xl md:text-4xl font-bold text-[#2DA6A2] mb-4">
                Câu hỏi {currentQuestion}/{totalQuestions}
              </h2>
            </div>

            {/* Prompt Box */}
            <div className="bg-gray-100 rounded-xl p-4 mb-6">
              <p className="text-purple-600 font-medium text-center text-lg md:text-xl">
                Con hãy trả lời câu hỏi:
              </p>
            </div>

            {/* Question */}
            <div className="mb-8">
              <p className="text-gray-800 text-lg md:text-2xl leading-relaxed text-center font-bold">
                {question}
              </p>
            </div>

            {/* ASR Result - Above Mic */}
            {isProcessing && (
              <div className="mb-6 text-center">
                <div className="inline-flex items-center space-x-2 text-[#2DA6A2]">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#2DA6A2]"></div>
                  <span className="text-sm">Đang xử lý âm thanh...</span>
                </div>
              </div>
            )}

            {asrResult && (
              <div className="mb-6">
                {/* Audio Script */}
                <div className="bg-gray-50 rounded-xl p-4 mb-4">
                  <p className="text-gray-700 text-center font-medium text-lg">
                    {asrResult.audio_script}
                  </p>
                </div>

                {/* Audio Player */}
                <div className="flex justify-center">
                  <audio ref={audioRef} controls className="w-full max-w-md">
                    <source src={asrResult.audio_url} type="audio/wav" />
                    <source src={asrResult.audio_url} type="audio/mpeg" />
                    Trình duyệt của bạn không hỗ trợ thẻ audio.
                  </audio>
                </div>
              </div>
            )}

            {/* Microphone Button */}
            <div className="flex justify-center">
              <GlobalMic
                width={110}
                height={74}
                onStart={handleMicStart}
                onComplete={handleAfterRecord}
                className="shadow-lg hover:shadow-xl transition-shadow"
              />
            </div>

            {/* Next Question Button */}
            {asrResult && (
              <div className="mt-8 flex justify-end">
                <button
                  onClick={() => {
                    // Logic chuyển câu tiếp theo sẽ được thêm sau
                    console.log("Chuyển câu tiếp theo");
                  }}
                  className="bg-[#2DA6A2] cursor-pointer hover:bg-[#2DA6A2]/90 text-white font-medium py-3 px-8 rounded-lg transition-colors text-lg"
                >
                  Câu tiếp theo
                </button>
              </div>
            )}
          </div>

        {/* Additional Info */}
        <div className="text-center mt-6">
          <p className="text-yellow-700 text-md">
            Nhấn vào micro để bắt đầu ghi âm câu trả lời
          </p>
        </div>
      </div>
    </div>
  );
};

export default RecordPage;
