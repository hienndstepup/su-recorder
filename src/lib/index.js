export const getDeviceId = () => {
  const isBrowser =
    typeof window !== "undefined" && typeof navigator !== "undefined";

  // Nếu đang chạy trên server, trả về giá trị mặc định ổn định để tránh lỗi
  if (!isBrowser) {
    return "device_ssr";
  }

  // Lấy device ID từ localStorage nếu có
  let deviceId = window.localStorage.getItem("device_id");

  // Nếu chưa có, tạo mới từ thông tin thiết bị và lưu vào localStorage
  if (!deviceId) {
    const userAgent = navigator.userAgent || "";
    const platform = navigator.platform || "";
    const language = navigator.language || "";
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "";

    // Tạo hash từ thông tin thiết bị
    const deviceInfo = `${platform}_${language}_${timezone}_${userAgent}`;
    deviceId =
      "device_" +
      btoa(deviceInfo)
        .replace(/[^a-zA-Z0-9]/g, "")
        .substr(0, 20);

    try {
      window.localStorage.setItem("device_id", deviceId);
    } catch (_) {
      // ignore
    }
  }

  return deviceId;
};

// Hàm chuyển đổi text thành dạng không dấu và chữ thường để tìm kiếm
export const normalizeText = (text) => {
  if (!text) return "";
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d");
};