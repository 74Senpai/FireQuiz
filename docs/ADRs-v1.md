
# 1. Sử dụng ReactJS để phát triển front-end
* **Trạng thái**: Chấp nhận
* **Người quyết định**: Trần Đức Thông, Vũ Mạnh Huy, Nguyễn Huy Hoàng, Nguyễn Lương Tiên
* **Ngày**: 21/01/2026

## Bối cảnh
Nhóm cần một ứng dụng web hiện đại, đáp ứng được các tính năng mới theo xu hướng, phù hợp với công nghệ hiện tại, nhiều tài liệu hướng dẫn và dễ tiếp cận với **đa số** thành viên trong nhóm.

## Quyết định
Nhóm quyết định chọn **ReactJS**.
Lý do:
1. ReactJS là một trong những thư viện mạnh mẽ nhất hiện tại về front-end.
2. Đa số thành viên trong nhóm đã từng tiếp xúc, làm việc với ReactJS và JavaScript từ trước.
3. Cộng đồng lớn, tài liệu đa dạng, nhiều hướng dẫn bằng tiếng Việt.
4. Hiệu năng cao nhờ Virtual DOM, giúp ứng dụng mượt mà hơn.
5. Hỗ trợ tái sử dụng component, giúp tăng tốc độ phát triển.
6. Cơ chế Single Page Application (SPA) mang lại trải nghiệm mượt mà, phù hợp với ứng dụng làm quiz (tránh load lại trang khi chuyển câu hỏi).

## Hệ quả
* **Ưu điểm**: 
  - Dễ học, dễ sử dụng cho người đã biết JS.
  - Hiệu năng cao, tối ưu cho giao diện người dùng phức tạp.
  - Khả năng bảo trì cao nhờ kiến trúc component.
* **Nhược điểm**:
  - Cần kết hợp thêm các thư viện bổ trợ (React Router, Redux/Zustand) để quản lý ứng dụng.
  - SEO mặc định không tốt bằng Server Side Rendering (nhưng không phải vấn đề lớn với app quiz nội bộ).

---

# 2. Sử dụng Express.js để phát triển back-end
* **Trạng thái**: Chấp nhận
* **Người quyết định**: Trần Đức Thông, Vũ Mạnh Huy, Nguyễn Huy Hoàng, Nguyễn Lương Tiên
* **Ngày**: 21/01/2026

## Bối cảnh
Nhóm cần một framework back-end nhẹ, linh hoạt, tích hợp tốt với ReactJS và hỗ trợ phát triển nhanh các API RESTful.

## Quyết định
Nhóm quyết định chọn **Express.js**.
Lý do:
1. Là framework phổ biến và nhẹ nhất cho Node.js.
2. Tận dụng ngôn ngữ JavaScript trên toàn bộ hệ thống (Fullstack JS), giúp giảm thời gian chuyển đổi tư duy giữa front-end và back-end.
3. Hỗ trợ phát triển nhanh API, dễ dàng cài đặt middleware cho xác thực (auth) và bảo mật.
4. Cộng đồng hỗ trợ cực lớn.

## Hệ quả
* **Ưu điểm**:
  - Tốc độ phát triển nhanh.
  - Cộng đồng plugin (npm) phong phú.
  - Dễ dàng làm việc với JSON (phù hợp tuyệt đối với React).
* **Nhược điểm**:
  - Express không ép buộc cấu trúc code (unopinionated), do đó nhóm cần tự thống nhất quy định đặt tên và cấu trúc thư mục để tránh code bị rối.

---

# 3. Sử dụng MySQL làm hệ quản trị cơ sở dữ liệu
* **Trạng thái**: Chấp nhận
* **Người quyết định**: Trần Đức Thông, Vũ Mạnh Huy, Nguyễn Huy Hoàng, Nguyễn Lương Tiên
* **Ngày**: 21/01/2026

## Bối cảnh
Nhóm cần một hệ quản trị cơ sở dữ liệu quan hệ (RDBMS) ổn định để lưu trữ cấu trúc dữ liệu chặt chẽ của bài quiz (User, Quiz, Question, Answer).

## Quyết định
Nhóm quyết định chọn **MySQL**.
Lý do:
1. Đảm bảo tính toàn vẹn dữ liệu (ACID) tốt cho việc lưu kết quả thi.
2. Các thành viên đều đã có nền tảng về SQL.
3. Tích hợp tốt với Express.js qua các ORM như Sequelize hoặc thư viện `mysql2`.
4. Miễn phí và phổ biến trên các nền tảng cloud.

## Hệ quả
* **Ưu điểm**:
  - Dữ liệu có cấu trúc rõ ràng, dễ truy vấn thống kê điểm số.
  - Cộng đồng hỗ trợ và công cụ quản lý (như MySQL Workbench) mạnh mẽ.
* **Nhược điểm**:
  - Khó thay đổi cấu trúc bảng linh hoạt như các cơ sở dữ liệu NoSQL (như MongoDB) trong quá trình đang phát triển.

---

# 4. Sử dụng Railway để triển khai ứng dụng
* **Trạng thái**: Chấp nhận
* **Người quyết định**: Trần Đức Thông, Vũ Mạnh Huy, Nguyễn Huy Hoàng, Nguyễn Lương Tiên
* **Ngày**: 21/01/2026

## Bối cảnh
Nhóm cần một nền tảng triển khai (deployment) đơn giản, hỗ trợ cả app và database trên cùng một nơi với chi phí thấp (hoặc miễn phí).

## Quyết định
Nhóm quyết định chọn **Railway**.
Lý do:
1. Giao diện thân thiện, hỗ trợ kết nối trực tiếp với GitHub (tự động deploy khi push code).
2. Hỗ trợ "Zero configuration", tự động nhận diện project Node.js.
3. Cung cấp sẵn dịch vụ MySQL kèm theo, không cần cấu hình server phức tạp.
4. Có gói dùng thử miễn phí phù hợp cho đồ án/dự án nhỏ.

## Hệ quả
* **Ưu điểm**:
  - Tiết kiệm thời gian cấu hình server (DevOps).
  - Tự động hóa quy trình triển khai (CI/CD).
* **Nhược điểm**:
  - Gói miễn phí có giới hạn về tài nguyên (RAM/CPU) và thời gian chạy (credit). Cần theo dõi để tránh ứng dụng bị dừng đột ngột khi hết hạn mức.
  - Không thể dùng các thư viện network như `smpt` do Railway không cho phép mở cổng tùy ý.
