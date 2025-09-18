"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import GlobalMic from "../components/GlobalMic";
import { appApi } from "@/api/app";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { getDeviceId } from "@/lib";

const RecordPage = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [userStats, setUserStats] = useState({
    total_recordings: 0,
    total_duration: 0,
  });

  // Fetch user stats
  const fetchUserStats = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("total_recordings, total_duration")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      setUserStats(data);
    } catch (error) {
      console.error("Error fetching user stats:", error);
    }
  };

  // Fetch initial stats when component mounts
  useEffect(() => {
    fetchUserStats();
  }, [user]);

  // State để lưu danh sách câu hỏi và câu hỏi hiện tại
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(true);

  // Kiểm tra recorderInfo khi component mount
  useEffect(() => {
    const recorderInfo = JSON.parse(
      localStorage.getItem("recorderInfo") || "{}"
    );

    // Kiểm tra các trường bắt buộc
    if (!recorderInfo.age || !recorderInfo.province || !recorderInfo.region) {
      alert("Vui lòng cung cấp đầy đủ thông tin trước khi ghi âm.");
      router.push("/");
      return;
    }
  }, [router]);

  // Fetch random questions khi component mount
  useEffect(() => {
    const fetchRandomQuestions = async () => {
      try {
        const { data, error } = await supabase.rpc("select_random_questions", {
          row_count: 30,
        });

        if (error) throw error;
        setQuestions(data || []);
      } catch (error) {
        console.error("Error fetching questions:", error.message);
        alert("Không thể tải câu hỏi. Vui lòng thử lại sau.");
      } finally {
        setIsLoadingQuestions(false);
      }
    };

    fetchRandomQuestions();
  }, []);

  // State để lưu kết quả ASR
  const [asrResult, setAsrResult] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioDuration, setAudioDuration] = useState(0);
  const [retryCount, setRetryCount] = useState(0);
  const audioRef = useRef(null);
  const maxRetries = 25; // 5 seconds (25 * 200ms)
  const questionAudioRef = useRef(null);
  const [hasPlayedAudio, setHasPlayedAudio] = useState(false);

  // Effect để tự động phát audio của câu hỏi khi chuyển câu
  useEffect(() => {
    // Reset hasPlayedAudio khi chuyển câu
    setHasPlayedAudio(false);

    // Tự động phát audio nếu có và chưa phát lần nào
    if (questions[currentQuestionIndex]?.audio_url && !hasPlayedAudio) {
      const audio = new Audio(`${questions[currentQuestionIndex].audio_url}?t=${Date.now()}`);
      audio.play()
        .then(() => {
          setHasPlayedAudio(true);
        })
        .catch(error => {
          console.error("Error playing question audio:", error);
        });
    }
  }, [currentQuestionIndex, questions]);

  // Effect để kiểm tra và retry khi asrResult thay đổi
  useEffect(() => {
    if (asrResult?.audio_url && retryCount > 0) {
      const checkAudio = async () => {
        try {
          const response = await fetch(asrResult.audio_url, { method: 'HEAD' });
          if (response.ok) {
            // Audio đã sẵn sàng, phát
            if (audioRef.current) {
              audioRef.current.play().catch((error) => {
                console.error("Error auto-playing audio:", error);
              });
            }
          } else {
            // Audio chưa sẵn sàng, retry sau 100ms
            if (retryCount < maxRetries) {
              setTimeout(() => {
                setRetryCount(prev => prev + 1);
                setAsrResult(prev => ({ ...prev, audio_url: `${prev.audio_url.split('?')[0]}?t=${Date.now()}` }));
              }, 200);
            }
          }
        } catch (error) {
          // Lỗi khi kiểm tra audio, retry
          if (retryCount < maxRetries) {
            setTimeout(() => {
              setRetryCount(prev => prev + 1);
              setAsrResult(prev => ({ ...prev, audio_url: `${prev.audio_url.split('?')[0]}?t=${Date.now()}` }));
            }, 200);
          }
        }
      };

      checkAudio();
    }
  }, [asrResult, retryCount]);

  const handleMicStart = () => {
    console.log("Bắt đầu ghi âm");
    // Reset kết quả khi bắt đầu ghi âm mới
    setAsrResult(null);
  };

  const handleAfterRecord = async (blob) => {
    setIsProcessing(true);
    try {
      // Tạo form data và gửi lên ASR service
      const formData = new FormData();

      // Tạo tên file dựa trên user ID và timestamp
      const timestamp = Math.floor(Date.now());
      const fileName = `${user.id}-${timestamp}.wav`;

      console.log("fileName", fileName);

      let file = new File([blob], fileName, { type: "audio/wav" });
      formData.append("audio_file", file);
      formData.append("device_id", getDeviceId());

      const res = await appApi.checkAsrEnVn(formData);

      // await new Promise((resolve) => setTimeout(resolve, 1000));

      const result = {
        audio_script: res?.data?.data?.text,
        audio_url: res?.data?.data?.audio,
      };

      // Reset audio duration khi có recording mới
      setAudioDuration(0);

      console.log("handleAfterRecord", result);
      
      // Reset retry count
      setRetryCount(0);
      setAsrResult(result);

      // Kiểm tra audio và retry nếu cần
      const checkAudio = async () => {
        try {
          const response = await fetch(result.audio_url, { method: 'HEAD' });
          if (response.ok) {
            // Audio đã sẵn sàng, phát
            if (audioRef.current) {
              audioRef.current.play().catch((error) => {
                console.error("Error auto-playing audio:", error);
              });
            }
          } else {
            // Audio chưa sẵn sàng, retry sau 100ms
            if (retryCount < maxRetries) {
              setTimeout(() => {
                setRetryCount(prev => prev + 1);
                setAsrResult({ ...result, audio_url: `${result.audio_url}?t=${Date.now()}` });
              }, 200);
            } else {
              console.error("Failed to load audio after maximum retries");
              alert("Không thể tải audio sau nhiều lần thử. Vui lòng thử lại.");
            }
          }
        } catch (error) {
          // Lỗi khi kiểm tra audio, retry
          if (retryCount < maxRetries) {
            setTimeout(() => {
              setRetryCount(prev => prev + 1);
              setAsrResult({ ...result, audio_url: `${result.audio_url}?t=${Date.now()}` });
            }, 200);
          } else {
            console.error("Failed to load audio after maximum retries");
            alert("Không thể tải audio sau nhiều lần thử. Vui lòng thử lại.");
          }
        }
      };

      // Bắt đầu kiểm tra audio
      checkAudio();
    } catch (error) {
      console.error("Error processing audio:", error);
      alert("Có lỗi xảy ra khi xử lý âm thanh. Vui lòng thử lại.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* User Info & Home Button */}
        <div className="mb-6 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            {user
              ? `Xin chào, ${user?.user_metadata?.full_name || user?.email}`
              : "Trang ghi âm"}
          </div>
          <Link
            href="/"
            className="text-sm text-[#2DA6A2] hover:text-[#2DA6A2]/80 transition-colors"
          >
            Về Trang chủ
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="flex flex-col md:grid md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-md p-3 md:p-4">
            <div className="flex justify-between items-center md:block">
              <div className="text-gray-500 text-xs md:text-sm md:mb-1">
                Đã ghi
              </div>
              <div className="text-lg md:text-2xl font-bold text-[#2DA6A2]">
                {userStats.total_recordings || 0}
                <span className="text-xs md:text-sm font-normal text-gray-500 ml-1">
                  bài
                </span>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-3 md:p-4">
            <div className="flex justify-between items-center md:block">
              <div className="text-gray-500 text-xs md:text-sm md:mb-1">
                Thời lượng
              </div>
              <div className="text-lg md:text-2xl font-bold text-[#2DA6A2]">
                {((userStats.total_duration || 0) / 60).toFixed(1)}
                <span className="text-xs md:text-sm font-normal text-gray-500 ml-1">
                  phút
                </span>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-3 md:p-4">
            <div className="flex justify-between items-center md:block">
              <div className="text-gray-500 text-xs md:text-sm md:mb-1">
                Thành tiền
              </div>
              <div className="text-lg md:text-2xl font-bold text-green-600">
                {new Intl.NumberFormat("vi-VN", {
                  style: "currency",
                  currency: "VND",
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                }).format(((userStats.total_duration || 0) / 60 / 20) * 100000)}
              </div>
            </div>
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
          {/* Question Header */}
          <div className="text-center mb-6">
            <h2 className="text-2xl md:text-4xl font-bold text-[#2DA6A2] mb-4">
              Câu hỏi {currentQuestionIndex + 1}/{questions.length || 30}
            </h2>
          </div>

          {isLoadingQuestions ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center space-x-2 text-[#2DA6A2]">
                <div className="w-6 h-6 border-2 border-[#2DA6A2] border-t-transparent rounded-full animate-spin"></div>
                <span>Đang tải câu hỏi...</span>
              </div>
            </div>
          ) : questions.length > 0 ? (
            <>
              {/* Prompt Box */}
              <div className="bg-gray-100 rounded-xl p-4 mb-6">
                <p className="text-purple-600 font-medium text-center text-lg md:text-xl">
                  {questions[currentQuestionIndex]?.type === "EN_TRA_LOI"
                    ? "Con hãy đọc theo:"
                    : questions[currentQuestionIndex]?.type === "VI_TRA_LOI"
                    ? "Con hãy trả lời câu hỏi:"
                    : "Con hãy đọc theo:"}
                </p>
              </div>

              {/* Question */}
              <div className="mb-8">
                <p className="text-gray-800 text-lg md:text-2xl leading-relaxed text-center font-bold">
                  {questions[currentQuestionIndex]?.text}
                </p>

                {/* Question Audio Player */}
                {questions[currentQuestionIndex]?.audio_url && (
                  <div className="mt-4 flex justify-center">
                    <button
                      onClick={() => {
                        const audio = new Audio(`${questions[currentQuestionIndex].audio_url}?t=${Date.now()}`);
                        audio.play()
                          .then(() => {
                            setHasPlayedAudio(true);
                          })
                          .catch(error => {
                            console.error("Error playing question audio:", error);
                          });
                      }}
                      className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                      title="Phát âm thanh"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-8 h-8 text-[#2DA6A2]"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z"
                        />
                      </svg>
                    </button>
                  </div>
                )}
              </div>

              {/* Question Type & Hint */}
              <div className="mb-6">
                <div className="flex items-center justify-center space-x-2 text-sm text-gray-500 mb-2">
                  <span className="px-2 py-1 bg-gray-100 rounded">
                    Loại: {questions[currentQuestionIndex]?.type}
                  </span>
                  {questions[currentQuestionIndex]?.hint && (
                    <span className="px-2 py-1 bg-yellow-50 text-yellow-700 rounded">
                      Gợi ý: {questions[currentQuestionIndex]?.hint}
                    </span>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-red-600">
              Không thể tải câu hỏi. Vui lòng tải lại trang.
            </div>
          )}

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
                <audio
                  ref={audioRef}
                  controls
                  className="w-full max-w-md"
                  src={`${asrResult.audio_url}?t=${Date.now()}`}
                  onLoadedMetadata={(e) => {
                    // Làm tròn xuống để lấy số giây chính xác vì audio_duration là INTEGER
                    const duration = Math.floor(e.target.duration);
                    setAudioDuration(duration);
                    console.log(
                      "Raw duration:",
                      e.target.duration,
                      "Rounded duration:",
                      duration
                    );
                  }}
                >
                  <source src={`${asrResult.audio_url}?t=${Date.now()}`} type="audio/wav" />
                  <source src={`${asrResult.audio_url}?t=${Date.now()}`} type="audio/mpeg" />
                  <source src={`${asrResult.audio_url}?t=${Date.now()}`} type="audio/mp3" />
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
                onClick={async () => {
                  try {
                    if (!asrResult?.audio_url) {
                      alert("Vui lòng thu âm câu trả lời trước khi tiếp tục.");
                      return;
                    }

                    // Lấy province_id từ localStorage
                    const recorderInfo = JSON.parse(
                      localStorage.getItem("recorderInfo") || "{}"
                    );
                    const provinceId = recorderInfo.province;

                    if (!provinceId) {
                      alert(
                        "Không tìm thấy thông tin tỉnh/thành phố. Vui lòng quay lại trang chủ."
                      );
                      return;
                    }

                    // Lưu recording vào database
                    const { error: recordingError } = await supabase
                      .from("recordings")
                      .insert({
                        user_id: user.id,
                        question_id: questions[currentQuestionIndex].id,
                        province_id: provinceId,
                        audio_url: asrResult.audio_url,
                        audio_duration: audioDuration,
                        audio_script: asrResult.audio_script,
                        age: recorderInfo.age,
                        recorded_at: new Date().toISOString(),
                      });

                    if (recordingError) throw recordingError;

                    // Cập nhật lại thống kê
                    await fetchUserStats();

                    // Nếu là câu cuối cùng
                    if (currentQuestionIndex === questions.length - 1) {
                      alert("Chúc mừng bạn đã hoàn thành bài thu âm!");
                      router.push("/");
                      return;
                    }

                    // Chuyển sang câu tiếp theo
                    setCurrentQuestionIndex(currentQuestionIndex + 1);
                    setAsrResult(null); // Reset kết quả ASR khi chuyển câu
                  } catch (error) {
                    console.error("Error saving recording:", error);
                    alert(
                      "Có lỗi xảy ra khi lưu bài thu âm. Vui lòng thử lại."
                    );
                  }
                }}
                className="bg-[#2DA6A2] cursor-pointer hover:bg-[#2DA6A2]/90 text-white font-medium py-3 px-8 rounded-lg transition-colors text-lg"
              >
                {currentQuestionIndex === questions.length - 1
                  ? "Hoàn thành"
                  : "Lưu và tiếp tục"}
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
