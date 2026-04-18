# FireQuiz

## Mô tả

**FireQuiz** là dự án xây dựng ứng dụng web cho phép người dùng tạo và chia sẻ các bộ quiz với nhau đơn giản và dễ dàng.

## Lý do chọn đề tài

Trong thực tế, nhu cầu tổ chức kiểm tra và đánh giá kiến thức ở phạm vi nhỏ như nhóm học tập, lớp học quy mô hạn chế hoặc sử dụng cá nhân chỉ yêu cầu các chức năng cơ bản như tạo bộ câu hỏi, làm bài trắc nghiệm, và xem kết quả. Mặc dù trên thị trường đã tồn tại nhiều nền tảng hỗ trợ đầy đủ chức năng, nhưng các nền tảng này thường được thiết kế cho nhiều mục đích sử dụng khác nhau và đi kèm các cơ chế quản lý phức tạp hoặc các giới hạn trong phiên bản miễn phí, không phù hợp với nhu cầu đơn giản. Vì vậy việc xây dựng một hệ thống quiz ở mức cơ bản, chỉ bao gồm các chức năng thêm, sửa, xóa, bộ câu hỏi, làm bài trắc nghiệm, xem kết quả, xuất kết quả, ... là cần thiết nhằm đáp ứng nhu cầu sử dụng đơn giản và miễn phí.

## Mục tiêu của dự án

### Mục tiêu chung

Mục tiêu chung của dự án là xây dựng một ứng dụng web quiz ở mức cơ bản, phục vụ nhu cầu tạo và làm bài trắc nghiệm, đồng thời làm cơ sở để nhóm áp dụng và củng cố các kiến thức đã học về phân tích thiết kế hệ thống thông tin, quản lý dự án và lập trình web.

### Mục tiêu cụ thể

- Xây dựng một ứng dụng quiz với các chức năng cơ bản như đăng nhập, đăng ký, quên mật khẩu, tạo bộ câu hỏi, làm bộ câu hỏi, chấm điểm, lưu và xuất kết quả.
- Ứng dụng hướng tới giao diện web đơn giản, dễ sử dụng, hỗ trợ hiển thị trên nhiều kích thước màn hình (responsive) và có cấu trúc thuận lợi cho việc mở rộng trong tương lai
- Thông qua dự án, nhóm áp dụng các kiến thức đã học về phân tích thiết kế hệ thống thông tin, quản lý dự án bằng phương pháp agile áp dụng framework scrum, cũng như kiến thức lập trình web để xây dựng một ứng dụng web hoàn chỉnh.

## Đối tượng sử dụng

Bất kì ai có nhu cầu tạo và chia sẻ các bộ quiz hoặc làm quiz.

## Mục tiêu của đề tài

- Xây dựng một ứng dụng quiz với các chức năng cơ bản như đăng nhập, đăng ký, quên mật khẩu, tạo bộ câu hỏi, làm bộ câu hỏi, chấm điểm, lưu và xuất kết quả.
- Ứng dụng hướng tới giao diện web đơn giản, dễ sử dụng, hỗ trợ hiển thị trên nhiều kích thước màn hình (responsive) và có cấu trúc thuận lợi cho việc mở rộng trong tương lai
- Thông qua dự án, nhóm áp dụng các kiến thức đã học về phân tích thiết kế hệ thống thông tin, quản lý dự án bằng phương pháp agile áp dụng framework scrum, cũng như kiến thức lập trình web để xây dựng một ứng dụng web hoàn chỉnh.

## Phạm vi đề tài

### Trong phạm vi (In Scope)

- Quản lý người dùng: đăng ký, đăng nhập, quên mật khẩu
- Quản lý bộ câu hỏi: thêm, sửa, xóa, xuất bản bộ câu hỏi
- Tham gia làm bộ câu hỏi và chấm điểm tự động
- Lưu trữ và xuất kết quả làm bài của người dùng

### Ngoài phạm vi (Out of scope)

- Thanh toán, thu phí hoặc phân quyền nâng cao theo gói dịch vụ.
- Phân tích dữ liệu lớn, thống kê nâng cao hoặc trí tuệ nhân tạo.

## Công nghệ sử dụng

### Các framework sử dụng

#### Frontend
- ReactJS

#### Backend
- Express.js

### Ngôn ngữ sử dụng
- Javascript

### Hệ quản trị cơ sở dữ liệu sử dụng
- MySQL

## Thành viên & vai trò

| Vai trò          | Người phụ trách |
|------------------|-----------------|
| Product Owner    | Vũ Mạnh Huy     |
| Scrum Master     | Trần Đức Thông  |
| Development Team | Trần Đức Thông<br> Vũ Mạnh Huy<br> Nguyễn Huy Hoàng<br> Nguyễn Lương Tiên |

## Cấu trúc thư mục tổng quan

Dự án được chia thành hai phần riêng biệt `frontend` và `backend` nằm trong cùng một repository:

```text
FireQuiz/
├── backend/                  # Nền tảng Backend (Express.js)
│   ├── .env.example          # File cấu hình môi trường mẫu cho backend
│   ├── src/                  # Mã nguồn chính
│   │   ├── app.js            # Entry point của server
│   │   ├── controllers/      # Cầu nối nhận request và trả response
│   │   ├── routes/           # Định nghĩa các API endpoints
│   │   ├── services/         # Logic nghiệp vụ (business logic)
│   │   ├── middleware/       # Các middlewares (auth, upload...)
│   │   ├── repositories/     # Tương tác với cơ sở dữ liệu
│   │   └── db/               # Cấu hình kết nối DB
│   ├── scripts/              # Chứa các script hỗ trợ (vd: chạy migrateDB)
│   ├── tests/                # Unit/Integration tests
│   └── package.json          # Thông tin project và thư viện backend
├── frontend/                 # Nền tảng Frontend (ReactJS + Vite)
│   ├── .env.example          # File cấu hình môi trường mẫu cho frontend
│   ├── src/                  # Mã nguồn chính frontend
│   │   ├── App.tsx           # Component gốc của React app
│   │   ├── components/       # Các UI components tái sử dụng
│   │   ├── pages/            # Các trang giao diện riêng biệt
│   │   ├── layouts/          # Layout cấu trúc chung của app
│   │   ├── lib/              # Các utilities / hàm tiện ích hỗ trợ
│   │   └── main.tsx          # Entry point của React app
│   ├── public/               # Tài nguyên tĩnh không cần qua build
│   └── package.json          # Quản lý dự án frontend
├── docs/                     # Tài liệu hướng dẫn, phân tích và báo cáo
├── docker-compose.yaml       # File cấu hình Docker Compose (môi trường MySQL / Backend)
└── README.md                 # Tài liệu hướng dẫn tổng quan này
```

## Hướng dẫn cài đặt và khởi chạy

Dự án có thể chạy trực tiếp bằng Node.js trên máy local hoặc sử dụng cấu hình Docker Compose tích hợp sẵn. Dưới đây là cách khởi chạy cho cả 2 môi trường.

### 1. Clone dự án

Đầu tiên, tải mã nguồn về máy:

```bash
git clone https://github.com/74Senpai/FireQuiz.git
cd FireQuiz
```

### 2. Thiết lập Biến môi trường (.env)

Cả Frontend và Backend đều cần file cấu hình để hoạt động. Các file mẫu `.env.example` đã được chuẩn bị sẵn, hãy copy và thay đổi theo thông tin của bạn.

- **Frontend**: \`cd frontend\` rồi copy file `frontend/.env.example` thành file `frontend/.env`. Mở file `.env` vừa tạo và điền các API Key (Ví dụ: `GEMINI_API_KEY`).
- **Backend**: \`cd backend\` rồi copy file `backend/.env.example` thành file `backend/.env`. Mở lên và điều chỉnh thông tin kết nối Database, cấu hình Email, Supabase keys, JWT secret...

### 3. Cài đặt và Chạy Môi trường Local (Development)

Mở 2 cửa sổ terminal riêng biệt để chạy song song.

**Terminal 1 (Backend API):**
```bash
cd backend
npm install
npm run dev
# Server API sẽ chạy theo PORT cấu hình trong .env (mặc định HTTP: http://localhost:8080)
```

**Terminal 2 (Frontend React):**
```bash
cd frontend
npm install
npm run dev
# Giao diện web sẽ khởi chạy tại (mặc định HTTP: http://localhost:3000)
```

### 4. Sử dụng Docker Compose (Tùy chọn cho CSDL)

Dự án có đi kèm cấu hình `docker-compose.yaml` hỗ trợ thiết lập môi trường CSDL `mysql:8` và build sẵn container cho backend.

```bash
docker-compose up -d --build
```

Lệnh này sẽ khởi chạy:
- 1 Database container tên `firequiz_db` trên port `3307`.
- 1 Backend container dựa trên source code `backend/` map ra cổng `8080`.

*(Lưu ý: Container ở trên chỉ bao phủ phần Database & Backend. Bạn vẫn cần qua thư mục `frontend/` chạy `npm run dev` như bước 3 để truy cập giao diện gốc).*

---

### Tài liệu tham khảo:
- [ReactJS Documentation](https://reactjs.org/docs/getting-started.html) / [Vite](https://vitejs.dev/guide/)
- [Express.js Documentation](https://expressjs.com/en/starter/installing.html) / [Node.js](https://nodejs.org/en/docs/)
- [MySQL Documentation](https://dev.mysql.com/doc/)
