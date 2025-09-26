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

// Hàm tính thành tiền dựa trên thời lượng audio (giây)
// Công thức: 120,000 VND cho mỗi 20 phút (1200 giây)
export const calculatePaymentAmount = (durationInSeconds) => {
  if (!durationInSeconds || durationInSeconds <= 0) return 0;
  
  // Chuyển đổi giây thành phút, chia cho 20 phút, nhân với 120,000 VND
  const paymentAmount = (durationInSeconds / 60 / 20) * 120000;
  
  // Làm tròn xuống số nguyên
  return Math.floor(paymentAmount);
};

// Hàm format tiền tệ VND
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};