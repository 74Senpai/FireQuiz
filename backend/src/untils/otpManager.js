const otpStore = new Map();
const OTP_TTL = 5 * 60 * 1000; // 5 phút

export const generateOTP = (email) => {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  // 1. Kiểm tra nếu email đã có OTP đang chờ, thì hủy timeout cũ đi
  if (otpStore.has(email)) {
    const oldData = otpStore.get(email);
    clearTimeout(oldData.timeoutId); // Quan trọng: Xóa lệnh xóa cũ
  }

  // 2. Thiết lập lệnh xóa mới
  const timeoutId = setTimeout(() => {
    otpStore.delete(email);
  }, OTP_TTL);

  // 3. Lưu OTP và cả timeoutId vào Map
  otpStore.set(email, {
    code: otp,
    expire: Date.now() + OTP_TTL,
    timeoutId: timeoutId, // Lưu id để sau này có thể hủy
  });

  return otp;
};

export const verifyOTP = (email, inputOTP) => {
  const data = otpStore.get(email);

  if (!data) return false;

  // Kiểm tra hết hạn (dựa trên timestamp)
  if (Date.now() > data.expire) {
    otpStore.delete(email);
    return false;
  }

  // Kiểm tra khớp mã
  if (data.code !== inputOTP) {
    return false;
  }

  // Nếu khớp, xóa OTP ngay và hủy luôn cả lệnh timeout đang chờ
  clearTimeout(data.timeoutId);
  otpStore.delete(email);

  return true;
};
