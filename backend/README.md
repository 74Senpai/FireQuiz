# FireQuiz Backend Architecture

Tài liệu này cung cấp các hướng dẫn và quy định bắt buộc cho môi trường lập trình Backend của dự án FireQuiz. Mọi tính năng, luồng API, và tests sửa đổi hoặc thêm mới cần tuân thủ nghiêm ngặt quy tắc tại đây.

## 1. Cấu Trúc Thư Mục (Directory Structure)

Dự án áp dụng mô hình phân lớp **Controller - Service - Repository (N-Tier Architecture)** rõ ràng. Tuyệt đối không viết logic database vào Controller hay logic parse HTML của UI vào Repository.

```text
backend/
├── package.json           # Khai báo packages và scripts hệ thống (Môi trường `type: "module"`)
├── src/
│   ├── app.js             # Entry point (Khởi tạo Express, thiết lập Cors, Error Handling, Server Listen)
│   ├── routes/            # (Router) Định nghĩa các URI web API, nạp Middlewares phân quyền.
│   ├── controllers/       # (Controller) Nhận Request (req, res), điều hướng dữ liệu vào Service trả kết quả.
│   ├── services/          # (Service) Điểm hội tụ BUSINESS LOGIC (Xử lý nghiệp vụ, thuật toán, ghép data).
│   ├── repositories/      # (Repository) Nơi ĐỘC QUYỀN giao tiếp với Database thông qua viết SQL/ORM.
│   ├── middlewares/       # Middleware xử lý chung như `authMiddleware`, `fileUpload`, ...
│   ├── validators/        # Middleware Validate Data form đầu vào.
│   ├── utils/             # Các Helper chức năng chung định dạng ngày tháng, `asyncHandler`.
│   ├── errors/            # Định nghĩa các Custom Error classes (`AppError.js`).
│   └── db/                # Quản lý Connection Pool, khởi tạo Database DB.
└── tests/                 # Thư mục riêng lẻ để kiểm thử tự động (Jest).
```

### Quy ước:
- **Tên File**: Sử dụng quy tắc camelCase cho tất cả các file mã nguồn. Riêng Error classes (thư mục `errors`) dùng PascalCase (`AppError.js`).
- **Khởi tạo biến**: Tất cả các tệp đều sử dụng ES Modules (`import/export`). Không được phép dùng `require`.

---

## 2. Quy trình & Cách Tạo API Mới Yêu Cầu

Khi cần thêm API (Ví dụ: `GET /api/quiz/something`), bạn cần làm theo thứ tự luồng dưới đây:

### Bước 1: Viết Data Access Layer (Repository)
Nếu cần gọi Data, tạo hàm trong thư mục `/src/repositories/`. Thư mục này chỉ thực hiện truy vấn thô, KHÔNG ném Error (ngoại trừ DB crash).
```javascript
import pool from '../db/db.js';

export const getSomethingFromDb = async (quizId) => {
  const [rows] = await pool.execute('SELECT * FROM somethings WHERE id = ?', [quizId]);
  return rows[0];
};
```
_Lưu ý: Luôn dùng Prepared Statements `?` để ngăn chặn SQL Injection._

### Bước 2: Viết Business Logic (Service)
Nếu có kiểm tra quyền hạn chi tiết hoặc điều kiện rẽ nhánh (Ví dụ: quiz đó đã ẩn), xử lý tại đây:
```javascript
import * as someRepo from '../repositories/someRepository.js';
import AppError from '../errors/AppError.js';

export const getSomething = async (quizId, user) => {
  const data = await someRepo.getSomethingFromDb(quizId);
  if (!data) throw new AppError("Dữ liệu không tồn tại", 404);
  
  if (data.userId !== user.id) throw new AppError("Bạn không có quyền", 403);
  
  return data;
};
```

### Bước 3: Đón Request/Response (Controller)
Luôn dùng `asyncHandler` bọc ngoài controller để bắt triệt để Promise Rejections.
```javascript
import { asyncHandler } from '../utils/asyncHandler.js';
import * as someService from '../services/someService.js';

export const getQuizSomething = asyncHandler(async (req, res) => {
  const id = req.params.id;
  const user = req.user;
  
  const result = await someService.getSomething(id, user);
  
  return res.status(200).json({ data: result });
});
```

### Bước 4: Khai Báo Route (Routes)
Gán vào Express Router với Middleware bảo vệ nếu cần. (Nhất định phải gắn Route tĩnh TRƯỚC route `/:id`).
```javascript
import express from 'express';
import * as someController from '../controllers/someController.js';
import { protectedRoute } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/dynamic', someController.getBonusRoute); // Đặt trước
router.get('/:id/something', protectedRoute, someController.getQuizSomething); // Đặt sau

export default router;
```

---

## 3. Cách Viết Test Case (Kiểm Thử Autometed)

FireQuiz Backend sử dụng **Jest** và **Sinon (hoặc fakes tùy vùng)** cho Unit/Integration Tests. Hệ thống tests được chạy bằng cờ `--experimental-vm-modules` để tương thích ES Modules.

### Cấu trúc Testing
Tất cả Test nằm trong thư mục gốc `tests/`. File test mở rộng hậu tố bằng `.test.js`.

### Các Nguyên Tắc Viết Test Case:

1. **Unit Test Services:** Khi test chức năng Business Logic (layer service), MOCK toàn bộ Repositories và thư viện bên thứ 3 đi kèm. Tránh thực hiện kết nối sang Database Thật (`mysql2`) để đảm bảo test chạy cô lập và siêu tốc.
2. **Sử dụng `jest.spyOn()` hoặc `sinon`** để kiểm soát hàm của hệ thống.
3. Chữ ký mô tả `describe` / `it`: Tuân thủ chuẩn "Hành động -> Điều kiện -> Kỳ vọng kết quả".

**Ví dụ viết nhanh Unit test một Service:**
```javascript
import { jest } from '@jest/globals';
import * as someService from '../src/services/someService.js';
import * as someRepository from '../src/repositories/someRepository.js';

describe('SomeService - getSomething', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('Nên throw Error (404) nếu repository không tìm thấy dữ liệu', async () => {
    // Giả lập DB trả null
    jest.spyOn(someRepository, 'getSomethingFromDb').mockResolvedValue(null);
    
    // Validate throws
    await expect(someService.getSomething(1, { id: 2 }))
      .rejects.toThrow("Dữ liệu không tồn tại");
  });

  it('Nên trả về object kết quả nếu DB và quyền xác thực đầy đủ', async () => {
    const mockData = { id: 1, userId: 2, title: "Test" };
    jest.spyOn(someRepository, 'getSomethingFromDb').mockResolvedValue(mockData);
    
    const result = await someService.getSomething(1, { id: 2 });
    expect(result).toEqual(mockData);
  });
});
```

### Chạy và Vận Hành Test
- Để chạy test toàn hệ thống: `npm run test`
- Để chạy từng tệp cụ thể (ví dụ chỉ service): `npx jest tests/services/userServices.test.js --experimental-vm-modules`

---

## 4. Xử Lý Lỗi Tập Trung
Trong mô hình này, chúng ta sử dụng `AppError`. Khi code logic lỗi ở Repository hoặc Service:
- Tuyệt đối **không gọi `res.status().send()` hay `console.error()` tùy tiện**.
- Trả Exception để lọt về `app.js` xử lý:
```javascript
throw new AppError("Loi nghiep vu", 400); // Bad Request
```

Cảm ơn bạn đã tuân thủ tiêu chuẩn này. Việc giữ các layer trong kiến trúc rời rạc sẽ giúp cho dự án FireQuiz dễ dàng bảo trì và tích hợp testing dài hạn.
