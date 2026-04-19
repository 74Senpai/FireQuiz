# FireQuiz Frontend Architecture & Guidelines

Tài liệu này quy định các nguyên tắc thiết kế kiến trúc và cấu trúc thư mục bắt buộc đối với tất cả các thành phần thuộc Frontend của dự án **FireQuiz**. Việc tuân thủ chặt chẽ tài liệu này là bắt buộc để đảm bảo mã nguồn dễ bảo trì, dễ mở rộng và đồng nhất.

---

## 1. Cấu trúc và Quy định Gọi API (Services)

**Quy định cốt lõi:**
- **Tuyệt đối KHÔNG** được thực hiện bất kỳ lệnh gọi API (`axios.get`, `axios.post`, `fetch`,...) nào trực tiếp tại các `components` hoặc `pages`.
- Tất cả các lệnh gọi API tới Server (Backend) **BẮT BUỘC** phải được đóng gói thành các hàm và gom nhóm trong thư mục `src/services/`.

**Ví dụ đúng:**
```javascript
// src/services/quizServices.js
import axiosInstance from '../api/axios';

export const getQuizDetails = async (id) => {
  const response = await axiosInstance.get(`/api/quiz/${id}`);
  return response.data;
};
```
Tại component, chỉ được phép gọi hàm `getQuizDetails`.

---

## 2. Cấu hình Axios và Base URL (API Layer)

**Quy định cốt lõi:**
- Base URL và các cấu hình liên quan đến Request/Response interceptors (ví dụ: tự động chèn token vào headers, xử lý lỗi 401, 403) **BẮT BUỘC** phải được định nghĩa tại `src/api/axios.js` (hoặc `src/api/axiosClient.js`).
- Không set up Base URL rải rác hoặc hardcode URL backend ở các file service khác.

**Ví dụ cấu hình chuẩn:**
```javascript
// src/api/axios.js
import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080',
  withCredentials: true, // Cho phép lưu cookie nếu backend hỗ trợ
});

// Interceptor chèn Token
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default axiosInstance;
```

---

## 3. Quản lý Authentication và Token (Store Layer)

**Quy định cốt lõi:**
- Toàn bộ logic quản lý **Token**, **Quyền truy cập (Auth/Authorization)**, và **Thông tin người dùng (User Profile)** phải được thiết kế tập trung tại Store, cụ thể là thư mục `src/stores/` (sử dụng `Zustand` hoặc `Redux`).
- **KHÔNG** thao tác trực tiếp `localStorage.setItem('accessToken', ...)` hoặc xử lý logic login/logout rời rạc trên giao diện UI/components. Giao diện UI chỉ chịu trách nhiệm trigger action từ Store.

**Ví dụ đúng (Store điều phối Auth):**
```javascript
// src/stores/authStore.js
import { create } from 'zustand';
import * as authService from '../services/authService';

export const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  
  login: async (credentials) => {
    const data = await authService.login(credentials);
    localStorage.setItem('accessToken', data.token); // Lưu token tại store
    set({ user: data.user, isAuthenticated: true });
  },

  logout: async () => {
    await authService.logout();
    localStorage.removeItem('accessToken');
    set({ user: null, isAuthenticated: false });
  }
}));
```

---

## 4. Tóm tắt Cấu Trúc Thư Mục (Folder Structure)

```text
src/
 ├── api/             # Cấu hình giao tiếp mạng (Axios instance, interceptors).
 ├── services/        # Nơi ĐỘC QUYỀN thực hiện các API requests. Các hàm trả về Promise.
 ├── stores/          # Quản lý Global State (Zustand/Redux), chứa logic xử lý nghiệp vụ (Auth, Data).
 ├── components/      # Các UI component xài chung (Buttons, Modals, ...). Chứa logic giao diện.
 ├── pages/           # Gom nhóm component thành một trang hiển thị (Home, Login, QuizDetails).
 ├── layouts/         # Layout cấu trúc chung của app (Header, Footer, Navbar, Sidebar...).
 ├── routes/          # Khai báo tuyến đường (AppRouter, ProtectedRoute).
 ├── lib/             # Các thư viện tiện ích dùng chung, cấu hình Tailwind/UI...
 └── index.css        # Style toàn cục của ứng dụng.
```

### 🎯 Check-list trước khi commit code
1. Có đoạn fetch/axios nào nằm trong `pages/` hoặc `components/` không? -> **Nếu có, chuyển sang `services/`.**
2. Có đang tự động gán Token thủ công trong Component không? -> **Nếu có, chuyển logic về `stores/` hoặc `api/axios.js`.**
3. Logic gọi API trên frontend có khai báo endpoint hardcode (`http://...`) thay vì xài biến môi trường/axios instance không? -> **Chỉnh sửa lại theo cấu trúc.`**
