import axios from "@/api/axios";

/**
 * Upload file lên server và nhận về public URL
 * @param {File} file - Đối tượng file từ input
 * @returns {Promise<{url: string}>}
 */
export const uploadFile = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  const res = await axios.post("/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  // Backend trả về { success: true, message: "...", data: { url: "..." } }
  return res.data.data || res.data;
};

/**
 * Gửi yêu cầu xóa file từ hệ thống (xóa thật trên Supabase nếu usage count = 0)
 * @param {string} url - URL của file cần xóa
 */
export const deleteFile = async (url) => {
  const res = await axios.delete("/upload", {
    data: { url }
  });
  return res.data;
};

export const uploadAvatar = uploadFile;

