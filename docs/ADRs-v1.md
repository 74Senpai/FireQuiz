# ARCHITECTURE DECISION RECORD

**ADR-001: Sử dụng ReactJS để phát triển Front-end**

**1. BỐI CẢNH (Context)**
Nhóm cần phát triển một ứng dụng web hiện đại, đáp ứng các tính năng theo xu hướng, hiệu năng mượt mà. Yêu cầu đặt ra là công nghệ phải phổ biến, có tài liệu hướng dẫn phong phú và dễ tiếp cận với đa số thành viên trong nhóm để tối ưu thời gian phát triển.

**2. CÁC PHƯƠNG ÁN XEM XÉT (Options Considered)**
*   **ReactJS:** Thư viện JavaScript phổ biến, dựa trên component.
*   **Vue.js:** Dễ học, nhưng cộng đồng và hệ sinh thái nhỏ hơn React tại thời điểm hiện tại.
*   **Angular:** Framework hoàn chỉnh nhưng có độ dốc học tập cao, quá phức tạp cho quy mô dự án hiện tại.

**3. QUYẾT ĐỊNH (Decision)**
Nhóm quyết định chọn **ReactJS** vì:
*   Đa số thành viên đã có kinh nghiệm cơ bản với ReactJS và JavaScript.
*   Cơ chế **Virtual DOM** giúp tăng hiệu năng hiển thị cho các ứng dụng tương tác nhiều như Quiz.
*   Hỗ trợ kiến trúc **Component**, giúp tái sử dụng mã nguồn và phát triển song song dễ dàng.
*   Hệ sinh thái thư viện bổ trợ và tài liệu tiếng Việt cực kỳ phong phú.

**4. HẬU QUẢ (Consequences)**
*   **Ưu điểm:** Tốc độ phát triển nhanh, giao diện phản hồi mượt mà (SPA), dễ bảo trì.
*   **Nhược điểm:** React chỉ là thư viện UI, nhóm phải tự chọn và quản lý thêm các thư viện cho Routing (React Router) và State Management. SEO mặc định không cao.

**5. LIÊN QUAN (Related)**
*   Người quyết định: Trần Đức Thông, Vũ Mạnh Huy, Nguyễn Huy Hoàng, Nguyễn Lương Tiên.
*   Ngày: 21/01/2026.

---

**ADR-002: Sử dụng Express.js để phát triển Back-end**

**1. BỐI CẢNH (Context)**
Dự án cần một Framework Back-end nhẹ, linh hoạt, có khả năng xây dựng các API RESTful nhanh chóng và tích hợp tốt với hệ sinh thái JavaScript của ReactJS.

**2. CÁC PHƯƠNG ÁN XEM XÉT (Options Considered)**
*   **Express.js:** Framework tối giản cho Node.js, cộng đồng lớn nhất.
*   **NestJS:** Kiến trúc tốt nhưng đòi hỏi kiến thức về TypeScript và Decorators sâu, có thể làm chậm tiến độ làm quen của nhóm.
*   **Django (Python):** Mạnh mẽ nhưng gây khó khăn trong việc chia sẻ logic/ngôn ngữ với Front-end.

**3. QUYẾT ĐỊNH (Decision)**
Nhóm quyết định chọn **Express.js** vì:
*   Sử dụng chung ngôn ngữ **JavaScript** với Front-end, giúp nhóm không phải chuyển đổi tư duy ngôn ngữ.
*   Cấu trúc cực kỳ nhẹ, không áp đặt, cho phép nhóm tự do thiết kế kiến trúc phù hợp.
*   Hỗ trợ xử lý JSON mặc định, tương thích hoàn hảo với yêu cầu của React.

**4. HẬU QUẢ (Consequences)**
*   **Ưu điểm:** Thời gian triển khai API rất nhanh, tài liệu hỗ trợ và thư viện middleware (Passport, JWT, Cors) cực kỳ nhiều.
*   **Nhược điểm:** Do tính tự do cao, nếu không quản lý tốt dễ dẫn đến mã nguồn lộn xộn (đã khắc phục bằng ADR-006).

**5. LIÊN QUAN (Related)**
*   Người quyết định: Trần Đức Thông, Vũ Mạnh Huy, Nguyễn Huy Hoàng, Nguyễn Lương Tiên.
*   Ngày: 21/01/2026.

---

**ADR-003: Sử dụng MySQL làm hệ quản trị cơ sở dữ liệu**

**1. BỐI CẢNH (Context)**
Ứng dụng Quiz có cấu trúc dữ liệu liên quan chặt chẽ (User, Đề thi, Câu hỏi, Đáp án). Nhóm cần một hệ thống đảm bảo tính toàn vẹn dữ liệu và các thành viên đã có nền tảng sử dụng từ trước.

**2. CÁC PHƯƠNG ÁN XEM XÉT (Options Considered)**
*   **MySQL:** Hệ quản trị CSDL quan hệ (RDBMS) phổ biến, ổn định.
*   **PostgreSQL:** Mạnh mẽ hơn về các tính năng nâng cao nhưng cấu hình và sử dụng phức tạp hơn một chút so với nhu cầu hiện tại.
*   **MongoDB:** Linh hoạt nhưng khó đảm bảo tính nhất quán cho các dữ liệu có quan hệ phức tạp như kết quả thi và bảng điểm.

**3. QUYẾT ĐỊNH (Decision)**
Nhóm quyết định chọn **MySQL** vì:
*   Đảm bảo các tính chất **ACID**, phù hợp để lưu trữ kết quả thi chính xác.
*   Nhóm đã có kinh nghiệm làm việc với SQL, giúp giảm thiểu sai sót trong thiết kế bảng.
*   Tích hợp tốt với Node.js thông qua các thư viện trung gian.

**4. HẬU QUẢ (Consequences)**
*   **Ưu điểm:** Dữ liệu có cấu trúc rõ ràng, hỗ trợ truy vấn phức tạp và báo cáo điểm số chính xác.
*   **Nhược điểm:** Việc thay đổi cấu trúc bảng (Migration) cần được thực hiện cẩn thận hơn so với các CSDL NoSQL.

**5. LIÊN QUAN (Related)**
*   Người quyết định: Trần Đức Thông, Vũ Mạnh Huy, Nguyễn Huy Hoàng, Nguyễn Lương Tiên.
*   Ngày: 21/01/2026.

---

**ADR-004: Sử dụng Railway để triển khai ứng dụng**

**1. BỐI CẢNH (Context)**
Nhóm cần đưa ứng dụng lên môi trường online để chạy thử nghiệm. Yêu cầu là quy trình triển khai phải đơn giản, hỗ trợ cả mã nguồn và cơ sở dữ liệu trên cùng một nền tảng với chi phí tối thiểu.

**2. CÁC PHƯƠNG ÁN XEM XÉT (Options Considered)**
*   **Railway:** Nền tảng PaaS hiện đại, hỗ trợ Deploy từ GitHub chỉ với vài cú click.
*   **Vercel/Netlify:** Chỉ mạnh về Front-end, khó khăn khi triển khai thêm Back-end và CSDL MySQL trên cùng một chỗ.
*   **AWS/Google Cloud:** Quá phức tạp trong việc cấu hình và chi phí cao.

**3. QUYẾT ĐỊNH (Decision)**
Nhóm quyết định chọn **Railway** vì:
*   Hỗ trợ tính năng **Zero Configuration**, tự động nhận diện project Express/React.
*   Cho phép khởi tạo dịch vụ MySQL trực tiếp trên cùng một project.
*   Có gói miễn phí (trial) phù hợp cho việc làm đồ án và thử nghiệm.

**4. HẬU QUẢ (Consequences)**
*   **Ưu điểm:** Tự động Deploy khi nhóm push code lên GitHub (CI/CD). Tiết kiệm thời gian quản trị server.
*   **Nhược điểm:** Gói miễn phí giới hạn tài nguyên và thời gian chạy. Không hỗ trợ mở cổng SMTP tùy ý để gửi email qua các thư viện network truyền thống.

**5. LIÊN QUAN (Related)**
*   Người quyết định: Trần Đức Thông, Vũ Mạnh Huy, Nguyễn Huy Hoàng, Nguyễn Lương Tiên.
*   Ngày: 21/01/2026.

---

**ADR-005: Kiến trúc hệ thống Client-Server**

**1. BỐI CẢNH (Context)**
Để ứng dụng có khả năng mở rộng và các thành viên có thể làm việc độc lập trên Front-end và Back-end mà không gây xung đột, nhóm cần một mô hình kiến trúc phân lớp rõ ràng.

**2. CÁC PHƯƠNG ÁN XEM XÉT (Options Considered)**
*   **Decoupled Client-Server:** Tách biệt hoàn toàn giao diện và logic dữ liệu.
*   **Monolithic Server-side Rendering:** Gộp chung logic vào một server duy nhất, server render ra HTML (ví dụ dùng EJS). Cách này gây khó khăn khi muốn nâng cấp giao diện hiện đại.

**3. QUYẾT ĐỊNH (Decision)**
Nhóm quyết định sử dụng kiến trúc **Client-Server tách biệt (Decoupled)**:
*   **Front-end:** ReactJS quản lý giao diện và trạng thái người dùng.
*   **Back-end:** Express.js đóng vai trò API Server cung cấp dữ liệu qua các Endpoint.
*   **Giao tiếp:** Sử dụng định dạng **JSON** qua giao thức HTTP/HTTPS.

**4. HẬU QUẢ (Consequences)**
*   **Ưu điểm:** Đội ngũ Front-end và Back-end có thể làm việc song song sau khi thống nhất API. Dễ dàng thay thế hoặc nâng cấp một trong hai phần mà không ảnh hưởng phần còn lại.
*   **Nhược điểm:** Cần quản lý cấu hình CORS và dành thời gian thiết kế tài liệu API (API Documentation) để hai bên kết nối đúng.

**5. LIÊN QUAN (Related)**
*   Người quyết định: Trần Đức Thông, Vũ Mạnh Huy, Nguyễn Huy Hoàng, Nguyễn Lương Tiên.
*   Ngày: 21/01/2026.

---

**ADR-006: Áp dụng kiến trúc Layered cho Back-end**

**1. BỐI CẢNH (Context)**
Express.js không bắt buộc cấu trúc thư mục, dễ dẫn đến tình trạng viết quá nhiều logic trong file định tuyến (Route), gây ra hiện tượng "Spaghetti code" khi logic nghiệp vụ Quiz (chấm điểm, xử lý câu hỏi) ngày càng phức tạp.

**2. CÁC PHƯƠNG ÁN XEM XÉT (Options Considered)**
*   **Controller-Service-Repository:** Chia code thành 3 lớp trách nhiệm rõ ràng.
*   **MVC truyền thống:** Tập trung vào Model-View-Controller, nhưng trong ứng dụng API thì lớp View không còn cần thiết trên Server.

**3. QUYẾT ĐỊNH (Decision)**
Nhóm áp dụng mô hình **Controller-Service-Repository**:
*   **Controller:** Tiếp nhận yêu cầu và trả về kết quả.
*   **Service:** Xử lý toàn bộ logic nghiệp vụ (logic chấm điểm, tính thời gian).
*   **Repository:** Tương tác trực tiếp với Database (truy vấn SQL).
  
**4. HẬU QUẢ (Consequences)**
*   **Ưu điểm:**  Mã nguồn cực kỳ sạch sẽ, dễ dàng viết Unit Test cho lớp Service. Giảm thiểu trùng lặp mã nguồn (DRY - Don't Repeat Yourself).
*   **Nhược điểm:** Số lượng file tăng lên ngay từ đầu, đòi hỏi các thành viên phải hiểu luồng dữ liệu đi qua các lớp.
**5. LIÊN QUAN (Related)**
* Người quyết định: Trần Đức Thông, Vũ Mạnh Huy, Nguyễn Huy Hoàng, Nguyễn Lương Tiên.
* Ngày: 21/01/2026.
  
