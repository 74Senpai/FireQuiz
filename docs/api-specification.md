# Đặc tả API FireQuiz

Tài liệu này cung cấp hướng dẫn chi tiết về các API REST của hệ thống FireQuiz.

## Thông tin chung
- **Base URL**: `http://localhost:8080/api` (Local)
- **Xác thực**: Sử dụng cơ chế dual-token (Access Token trong Header `Authorization` và Refresh Token trong Cookie).

---

## Danh sách API

| Module | Method | API | Request (Body/Params) | Response (Bản tin thành công) | Status Code |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Auth** | POST | `/auth/register` | `email`, `password`, `fullName`, `otp` | `{ message: "Đăng ký thành công" }` | 201 |
| **Auth** | POST | `/auth/send-signup-otp` | `email` | `{ message: "OTP đã gửi" }` | 200 |
| **Auth** | POST | `/auth/login` | `email`, `password` | `{ accessToken, message }` | 200 |
| **Auth** | POST | `/auth/logout` | None (Refresh Token từ Cookie) | None | 204 |
| **Auth** | POST | `/auth/refresh` | None (Refresh Token từ Cookie) | `{ accessToken, message }` | 200 |
| **Auth** | POST | `/auth/forgot-password` | `email` | `{ message: "OTP đã gửi" }` | 200 |
| **Auth** | POST | `/auth/verify-otp` | `email`, `otp` | `{ resetToken }` | 200 |
| **Auth** | POST | `/auth/reset-password` | `resetToken`, `newPassword` | `{ message: "Đổi mật khẩu thành công" }` | 200 |
| **Auth** | PUT | `/auth/change-password` | `oldPassword`, `newPassword` | `{ message: "Đổi mật khẩu thành công" }` | 200 |
| **User** | GET | `/user/me` | None | `{ id, email, fullName, avatarUrl }` | 200 |
| **User** | PUT | `/user/avatar` | `avatarUrl` | `{ message: "Cập nhật thành công" }` | 200 |
| **User** | PUT | `/user/profile` | `fullName` | `{ message: "Cập nhật thành công" }` | 200 |
| **Quiz** | GET | `/quiz/myquiz` | None | `{ data: [...] }` | 200 |
| **Quiz** | GET | `/quiz/public/open` | `page`, `pageSize` (Query) | `{ data: [...], meta }` | 200 |
| **Quiz** | POST | `/quiz/` | `title`, `description`, `thumbnailUrl` | `{ quizId }` | 201 |
| **Quiz** | GET | `/quiz/:id` | `id` (Path) | Đối tượng Quiz chi tiết | 200 |
| **Quiz** | PATCH | `/quiz/:id/status` | `status` (DRAFT/PUBLIC/PRIVATE) | None | 204 |
| **Quiz** | PATCH | `/quiz/:id/info` | `title`, `description`, `thumbnailUrl` | None | 204 |
| **Quiz** | PATCH | `/quiz/:id/settings` | `gradingScale`, `timeLimitSeconds`, ... | None | 204 |
| **Quiz** | DELETE | `/quiz/:id` | `id` (Path) | None | 204 |
| **Quiz** | POST | `/quiz/:id/generate-pin`| `id` (Path) | `{ pin }` | 200 |
| **Quiz** | DELETE | `/quiz/:id/pin` | `id` (Path) | None | 204 |
| **Quiz** | GET | `/quiz/join/:code` | `code` (Path) | Quiz Metadata | 200 |
| **Quiz** | POST | `/quiz/draft` | `quizId`, `answers` | `{ message: "Lưu bản nháp thành công" }` | 200 |
| **Quiz** | GET | `/quiz/draft` | `quizId` (Query) | Bản nháp đáp án | 200 |
| **Quiz** | GET | `/quiz/:id/export/:format`| `format`, `advanced` (Query) | Tệp tin (.xlsx/.pdf) | 200 |
| **Quiz** | GET | `/quiz/:id/import-excel/template` | None | Tệp mẫu .xlsx | 200 |
| **Quiz** | POST | `/quiz/:id/import-excel` | File (.xlsx) | `{ message, count }` | 200 |
| **Quiz** | GET | `/quiz/:id/preview`| `id` (Path) | Metadata & số câu hỏi | 200 |
| **Quiz** | GET | `/quiz/:id/leaderboard` | `id` (Path) | Bảng xếp hạng | 200 |
| **Quiz** | GET | `/quiz/:id/question-analytics` | `id` (Path) | Phân tích câu trả lời | 200 |
| **Quiz** | GET | `/quiz/:id/results-dashboard` | `id` (Path) | Tổng quan kết quả | 200 |
| **Quiz** | GET | `/quiz/:id/export/content` | `format`, `type`, `randomize`, `versionCount` | Tệp tin đề/đáp án | 200 |
| **Question**| GET | `/question/:quizId/list` | `quizId` (Path) | Danh sách câu hỏi | 200 |
| **Question**| POST | `/question/` | `quizId`, `content`, `type`, `options` | `{ id }` | 201 |
| **Question**| PATCH | `/question/:id` | `content`, `type`, `points`, `options` | `{ message: "Cập nhật thành công" }` | 200 |
| **Question**| DELETE | `/question/:id` | `id` (Path) | None | 204 |
| **Attempt** | GET | `/attempt/my` | `page`, `pageSize` (Query) | Danh sách lượt làm bài | 200 |
| **Attempt** | GET | `/attempt/stats/my` | None | Thống kê cá nhân | 200 |
| **Attempt** | GET | `/attempt/:id/review` | `id` (Path) | Chi tiết bài làm & nhận xét | 200 |
| **Attempt** | POST | `/attempt/start/:quizId` | `quizId` (Path) | `{ attemptId, data }` | 200 |
| **Attempt** | PATCH | `/attempt/:id/violation` | `id` (Path) | `{ message: "Báo cáo thành công" }` | 200 |
| **Attempt** | PATCH | `/attempt/:id/submit` | `answers`, `textAnswers` | `{ score, isPassed }` | 200 |
| **Attempt** | GET | `/attempt/:id/export-review`| `format`, `type` (Query) | Tệp tin (.pdf/.xlsx) | 200 |
| **Media** | GET | `/media/view` | `token`, `path` (Query) | Redirect đến URL Supabase | 302 |
| **Upload** | POST | `/upload/` | File (Multipart) | `{ url }` | 200 |
| **Bank** | GET | `/bank/` | None | Danh sách câu hỏi ngân hàng | 200 |
| **Bank** | POST | `/bank/` | `content`, `type`, `options` | `{ id }` | 201 |
| **Bank** | POST | `/bank/import/:quizId` | `questionIds` | `{ message: "Import thành công" }` | 200 |
| **Status** | GET | `/status/` | None | `{ status, uptime, services }` | 200 |

---

## Ghi chú về mã trạng thái (Status Code)
- `200 OK`: Yêu cầu thực hiện thành công.
- `201 Created`: Tạo mới tài nguyên thành công.
- `204 No Content`: Yêu cầu thực hiện thành công nhưng không có nội dung trả về.
- `400 Bad Request`: Dữ liệu gửi lên không hợp lệ.
- `401 Unauthorized`: Chưa xác thực hoặc Token hết hạn.
- `403 Forbidden`: Không có quyền truy cập tài nguyên.
- `404 Not Found`: Không tìm thấy tài nguyên.
- `500 Internal Server Error`: Lỗi hệ thống server.
