# Unit Tests (Backend Service Layer)

This document describes the unit tests under `backend/testapi` and how to run them.

---

## ✅ Mục đích của unit test này

Các unit test trong `backend/testapi/services.test.js` kiểm tra **logic nghiệp vụ (service layer)** mà không truy cập cơ sở dữ liệu thật hoặc gọi đến các thư viện bên ngoài (bcrypt/jwt). Thay vào đó, mọi dependency (repository, bcrypt, jsonwebtoken, crypto) đều được **mock** (giả lập) để:

- Giữ test chạy nhanh và ổn định.
- Giảm phụ thuộc vào cấu hình môi trường/ DB.
- Tập trung kiểm tra **hành vi** của service.

---

## 📁 Cấu trúc chính của file `services.test.js`

### 1) Mock các module (ESM)
File dùng `jest.unstable_mockModule(...)` để mock các module trong môi trường ESM (vì project dùng `"type": "module"`).

Modules được mock:
- `../src/repositories/userRepository.js`
- `../src/repositories/sessionRepository.js`
- `../src/repositories/quizRepository.js`
- `bcrypt`
- `jsonwebtoken`

### 2) `beforeEach()`
Trước mỗi test:
- Xoá toàn bộ mock cũ để tránh ảnh hưởng cross-test.
- Nhập lại các module đã mock (dynamic `import`) để Jest áp dụng mock đúng.
- Nhập các service cần test: `authService`, `userService`, `quizService`.

### 3) Các nhóm test chính

#### ✅ `authService.signUp`
Kiểm tra:
- Khi đăng ký hợp lệ: gọi repository đúng, hash password, tạo user.
- Khi username trùng: ném ra `AppError`.
- Khi email trùng: ném ra `AppError`.

#### ✅ `authService.logIn`
Kiểm tra:
- Đăng nhập thành công: kiểm tra bcrypt compare, tạo session, trả về accessToken.
- Sai username: ném ra `AppError`.
- Sai password: ném ra `AppError`.

#### ✅ `userService.getUserById`
Kiểm tra:
- Nếu có user: trả về dữ liệu đã map đúng.
- Nếu không tồn tại user: trả về `null`.

#### ✅ `quizService.getQuiz`
Kiểm tra:
- Quiz public -> truy xuất được.
- Quiz private + owner -> truy xuất được.
- Quiz private + không phải owner -> ném `AppError`.

#### ✅ `quizService.setStatus`
Kiểm tra:
- Owner có thể đổi trạng thái quiz.
- Người khác không thể đổi trạng thái (ném `AppError`).

---

## ▶️ Cách chạy unit test

Từ thư mục `backend`, chạy:

```bash
npm test
```

> Lệnh này sẽ chạy Jest theo cấu hình hiện tại và sẽ thực thi file `backend/testapi/services.test.js`.

---
