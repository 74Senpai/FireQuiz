# Documentation: Test Case Checklist - FireQuiz

Tài liệu này cung cấp bộ kiểm thử toàn diện cho hệ thống FireQuiz, bao gồm các kịch bản cho Frontend, Backend, Bảo mật và Trải nghiệm người dùng (UX).

## 1. Authentication & Account Management (AUTH)

| TC ID  | Test Case                          | Expected Result                                                | Result | Status |
| :----- | :--------------------------------- | :------------------------------------------------------------- | :----- | :----- |
| AUTH01 | Đăng ký: Thông tin hợp lệ          | User được tạo, nhận mã OTP, chuyển trang verify                | Đúng   | pass   |
| AUTH02 | Đăng ký: Email đã tồn tại          | Thông báo lỗi "Email already registered"                       | Đúng   | pass   |
| AUTH03 | Xác thực OTP: Mã chính xác         | Kích hoạt tài khoản, chuyển đến Dashboard                      | Đúng   | pass   |
| AUTH04 | Xác thực OTP: Mã sai/Hết hạn       | Thông báo "Invalid or expired OTP"                             | Đúng   | pass   |
| AUTH05 | Đăng nhập: Email & Pass đúng       | Trả về Token, chuyển đến trang chủ                             | Đúng   | pass   |
| AUTH06 | Đăng nhập: Sai mật khẩu            | Thông báo "Invalid credentials"                                | Đúng   | pass   |
| AUTH07 | Quên mật khẩu: Email không tồn tại | Thông báo "User not found"                                     | Đúng   | pass   |
| AUTH08 | Quên mật khẩu: Reset thành công    | Mật khẩu mới có hiệu lực, login được                           | Đúng   | pass   |
| AUTH09 | Cập nhật hồ sơ: Đổi tên/Avatar     | Thông tin mới hiển thị chính xác sau khi Reload                | Đúng   | pass   |
| AUTH10 | Đổi mật khẩu: Pass cũ sai          | Thông báo "Old password is incorrect"                          | Đúng   | pass   |
| AUTH11 | Đăng xuất                          | Xóa Token, quay về trang Login, không thể nhấn Back để vào lại | Đúng   | pass   |

## 2. Quiz Creator Flow - Quản lý Quiz (MGMT)

| TC ID  | Test Case                      | Expected Result                                         | Result | Status |
| :----- | :----------------------------- | :------------------------------------------------------ | :----- | :----- |
| MGMT01 | Tạo mới Quiz (Tên, Mô tả)      | Quiz được tạo ở trạng thái 'Draft'                      | Đúng   | pass   |
| MGMT02 | Cập nhật thông tin Quiz        | Thay đổi Ảnh bìa, Tên, Category thành công              | Đúng   | pass   |
| MGMT03 | Cấu hình Settings: Bật Timer   | Quiz hiển thị đồng hồ đếm ngược khi làm bài             | Đúng   | pass   |
| MGMT04 | Cấu hình Settings: Đảo câu hỏi | Thứ tự câu hỏi thay đổi mỗi lần tham gia                | Đúng   | pass   |
| MGMT05 | Thay đổi trạng thái: Published | Quiz xuất hiện ngoài trang Explore công khai            | Đúng   | pass   |
| MGMT06 | Tạo mã PIN (Join Code)         | Mã PIN 6 số được tạo, cho phép người khác vào bằng code | Đúng   | pass   |
| MGMT07 | Xóa Quiz                       | Quiz bị xóa khỏi danh sách của Creator và DB            | Đúng   | pass   |
| MGMT08 | Dashboard: Thống kê số lượng   | Hiển thị đúng số Quiz hiện có và số lượt làm bài        | Đúng   | pass   |

## 3. Quiz Creator Flow - Nội dung & Câu hỏi (QUEST)

| TC ID   | Test Case                            | Expected Result                                        | Result | Status |
| :------ | :----------------------------------- | :----------------------------------------------------- | :----- | :----- |
| QUEST01 | Thêm câu hỏi: MCQ (1 đáp án)         | Lưu thành công nội dung và đáp án đúng                 | Đúng   | pass   |
| QUEST02 | Thêm câu hỏi: Multi-select           | Lưu nhiều đáp án đúng, validate ít nhất 1 chọn         | Đúng   | pass   |
| QUEST03 | Thêm câu hỏi: True/False             | Hiển thị 2 lựa chọn mặc định, lưu đúng                 | Đúng   | pass   |
| QUEST04 | Upload ảnh cho câu hỏi               | Ảnh hiển thị đúng trong trình editor và khi làm bài    | Đúng   | pass   |
| QUEST05 | Import từ Excel: Đúng mẫu            | Toàn bộ câu hỏi trong file được nạp vào Quiz           | Đúng   | pass   |
| QUEST06 | Import từ Excel: Sai định dạng       | Thông báo lỗi dòng/cột không hợp lệ                    | Đúng   | pass   |
| QUEST07 | Câu hỏi từ Ngân hàng (Question Bank) | Kéo được câu hỏi từ bộ sưu tập cá nhân vào Quiz mới    | Đúng   | pass   |
| QUEST08 | Xóa câu hỏi                          | Câu hỏi biến mất khỏi danh sách, cập nhật lại số lượng | Đúng   | pass   |

## 4. Student/Taker Flow - Làm bài (TAKE)

| TC ID  | Test Case                  | Expected Result                                              | Result | Status |
| :----- | :------------------------- | :----------------------------------------------------------- | :----- | :----- |
| TAKE01 | Tìm kiếm Quiz công khai    | Hiển thị kết quả đúng theo từ khóa                           | Đúng   | pass   |
| TAKE02 | Tham gia bằng mã PIN       | Vào đúng Quiz được định danh bởi PIN                         | Đúng   | pass   |
| TAKE03 | Làm bài: Chọn đáp án       | Hệ thống ghi nhận lựa chọn (highlight UI)                    | Đúng   | pass   |
| TAKE04 | Làm bài: Tự động lưu Draft | Nếu F5 hoặc mất mạng, các lựa chọn đã chọn không mất         | Đúng   | pass   |
| TAKE05 | Timer: Hết giờ làm bài     | Hệ thống tự động Submit và khóa không cho làm tiếp           | Đúng   | pass   |
| TAKE06 | Nộp bài: Xác nhận          | Hiển thị popup xác nhận trước khi nộp chính thức             | Đúng   | pass   |
| TAKE07 | Xem kết quả: Điểm số       | Hiển thị đúng số câu đúng/sai, số điểm, thời gian            | Đúng   | pass   |
| TAKE08 | Review bài làm             | Xem lại từng câu, thấy đáp án đúng và giải thích (nếu có)    | Đúng   | pass   |
| TAKE09 | Giới hạn lượt làm bài      | Nếu set 1 lượt, quay lại tham gia sẽ báo "Already attempted" | Đúng   | pass   |

## 5. Analytics & Reports (REPORT)

| TC ID  | Test Case                    | Expected Result                                         | Result | Status |
| :----- | :--------------------------- | :------------------------------------------------------ | :----- | :----- |
| REPO01 | Leaderboard (Bảng xếp hạng)  | Hiển thị đúng TOP người dùng theo điểm và thời gian     | Đúng   | pass   |
| REPO02 | Thống kê câu hỏi (Analytics) | Hiển thị % chọn từng đáp án của tất cả người làm        | Đúng   | pass   |
| REPO03 | Xuất Excel kết quả           | Tải về file Excel chứa danh sách điểm của học sinh      | Đúng   | pass   |
| REPO04 | Xuất PDF nội dung Quiz       | Tải về file PDF đẹp, chứa nội dung câu hỏi để in ấn     | Đúng   | pass   |
| REPO05 | Lịch sử làm bài (Taker)      | Người dùng xem lại được tất cả các lần thi đã thực hiện | Đúng   | pass   |

## 6. Backend API & Security (BACKEND)

| TC ID  | Test Case                            | Expected Result                                     | Result | Status |
| :----- | :----------------------------------- | :-------------------------------------------------- | :----- | :----- |
| SEC01  | Truy cập route Protected không token | Trả về 401 Unauthorized                             | Đúng   | pass   |
| SEC02  | Token giả mạo/Hết hạn                | Trả về 401, FE chuyển hướng về Login                | Đúng   | pass   |
| SEC03  | Phân quyền: User sửa Quiz người khác | Trả về 403 Forbidden                                | Đúng   | pass   |
| SEC04  | Validate dữ liệu input (Joi/Zod)     | Trả về 400 và chi tiết lỗi nếu thiếu field bắt buộc | Đúng   | pass   |
| PERF01 | Tải danh sách Quiz lớn (>100)        | Tải nhanh, có phân trang (pagination)               | Đúng   | pass   |
| RATE01 | Spam gửi OTP liên tục                | Rate Limiter block sau 3-5 lần yêu cầu/phút         | Đúng   | pass   |
| FILE01 | Upload file quá kích thước (>5MB)    | Server từ chối và báo lỗi dung lượng                | Đúng   | pass   |
| FILE02 | Upload file sai định dạng (v.d .exe) | Server từ chối, chỉ chấp nhận Image/Excel           | Đúng   | pass   |

## 7. UI/UX & Compatibility (UIUX)

| TC ID | Test Case               | Expected Result                                      | Result | Status |
| :---- | :---------------------- | :--------------------------------------------------- | :----- | :----- |
| UI01  | Responsive: Mobile View | Layout không bị vỡ, menu toggle hoạt động tốt        | Đúng   | pass   |
| UI02  | Responsive: Tablet View | Giao diện hiển thị grid linh hoạt                    | Đúng   | pass   |
| UI03  | Dark Mode support       | Màu sắc tương phản tốt khi chuyển chế độ tối         | Đúng   | pass   |
| UI04  | Loading States          | Hiển thị Skeleton hoặc Spinner khi đang fetch data   | Đúng   | pass   |
| UI05  | Error Pages (404/500)   | Hiển thị giao diện báo lỗi thân thiện cho người dùng | Đúng   | pass   |
