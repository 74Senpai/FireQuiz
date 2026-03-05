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

## Cài đặt
1. Clone repository về máy:
   ```bash
   git clone https://github.com/74Senpai/FireQuiz.git
    ```
2. Cài đặt dependencies:
- Frontend:
   ```bash
   npm install
   ```

4. Chạy ứng dụng:
- Development mode:
   ```bash
   npm run dev
   ```
- Production mode:
   ```bash
    npm start
    ```