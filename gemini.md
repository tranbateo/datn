# AI Tutor Project Context (gemini.md)

Tài liệu này chứa bối cảnh và hướng dẫn dành cho AI (Gemini) khi làm việc trên dự án **AI Tutor**, được trích xuất và tổng hợp từ Tài Liệu Đặc Tả Yêu Cầu Phần Mềm (SRS).

## 1. Tổng quan dự án (Project Overview)
- **Tên dự án**: AI Tutor
- **Mục đích**: Nền tảng giáo dục thông minh dành cho học sinh Việt Nam, bám sát chương trình của Bộ Giáo dục và Đào tạo. Cung cấp giải pháp học tập cá nhân hóa qua gia sư AI đa mô hình kết hợp gamification, đồng thời cung cấp công cụ cho giáo viên giảng dạy và phụ huynh theo dõi.
- **Tính năng cốt lõi**:
  - Chat trực tiếp với AI (RAG system).
  - Quản lý lịch học tự động qua OCR (nhận diện ảnh).
  - Luyện tập và làm bài trắc nghiệm.
  - Hệ thống điểm thưởng Gamification (XP, Leaderboard, Streak).
  - Giáo viên tự quản lý khóa học, tài liệu và bài tập.
  - Phụ huynh theo dõi tiến độ của học sinh.
  - Admin Dashboard quản trị toàn diện hệ thống.
- **Nền tảng hệ sinh thái**: Dữ liệu được đồng bộ realtime 100% qua Backend API tập trung. Cung cấp đa nền tảng:
  - App Mobile (AI Tutor) cho Học sinh.
  - App Mobile / Web Portal (Parent Portal) cho Phụ huynh.
  - Web Portal (Teacher Dashboard) cho Giáo viên.
  - Web Portal (Admin Dashboard) cho Ban quản trị.
- **Công nghệ yêu cầu (Tech Stack)**:
  - Backend: NestJS.
  - Frontend: Next.js.
  - Mobile: React Native.
  - Cơ sở dữ liệu: PostgreSQL, pgvector (Vector DB), Redis.
  - Tích hợp AI: LangChain (OpenAI GPT-4, Google Gemini Pro, Anthropic Claude 3, DeepSeek Chat).
  - Thông báo: Firebase Admin SDK.

## 2. Các thực thể chính (Key Entities)
- **User / Session / Device**: Quản lý xác thực an toàn bằng JWT Cookie, thu hồi thiết bị, thông báo Push.
- **Student**: Quản lý cấp độ (Level, Grade), XP, Streak. Mua vật phẩm trong Cửa hàng (`shop_items`, `student_inventory`).
- **Teacher**: Quản lý Lớp học (Đa khối), tạo Bài kiểm tra (bao gồm Đề thi Vượt cấp), sử dụng AI tạo Quiz.
- **Parent**: Quét QR liên kết với con, theo dõi Bảng điểm và nhận Cảnh báo bảo mật.
- **Quiz / Graduation Exam**: Bài kiểm tra thông thường và Bài thi Đầu ra để lên lớp.
- **Document / Vector**: Tài liệu PDF băm nhỏ để RAG.
- **Social / Payment**: Quản lý kết bạn, nhắn tin nội bộ, và đăng ký khóa học VIP (Subscriptions).

## 3. Các luồng công việc cốt lõi (Core Workflows)
1. **Học tập & Vượt cấp**: Học sinh học tập tích lũy XP. Khi đủ điều kiện, tham gia thi **Đề thi Đầu ra (Graduation Exam)** do Giáo viên thiết lập. Điểm >= Passing Score sẽ được thăng cấp lên lớp.
2. **AI Sinh Bài Tập**: Giáo viên upload tài liệu, hệ thống RAG không chỉ để Học sinh hỏi đáp mà còn giúp Giáo viên **tự động sinh ra câu hỏi trắc nghiệm (AI Quiz Builder)**.
3. **Gamification & Social**: Mua sắm Avatar, khung viền. Kết bạn và chat trực tiếp nội bộ giữa học sinh.
4. **Thanh toán**: Tích hợp VNPay/Momo để mua Gói VIP.
5. **Cảnh báo Phụ huynh**: Phụ huynh quét QR liên kết, tự động nhận Push Notification khi con trượt bài hoặc có hành vi gian lận.

## 4. Bảo mật & Phân quyền (RBAC)
- **Học sinh (Student)**: Chat AI, làm bài kiểm tra, quản lý lịch học.
- **Giáo viên (Teacher)**: Soạn thảo giáo trình, tự upload tài liệu học tập, tạo câu hỏi/bài tập, xem báo cáo của học sinh thuộc lớp mình.
- **Phụ huynh (Parent)**: Xem tiến trình học tập, nhận thông báo (read-only đối với dữ liệu của con).
- **Quản trị viên (Admin)**: Toàn quyền quản trị hệ thống, quản lý User. Giám sát và kiểm duyệt tài liệu của Teacher (nhưng không trực tiếp upload), tùy chỉnh cấu hình AI model.

## 5. Hướng dẫn UI/UX (Wireframes)
- **Mobile App (Học sinh)**: Header (Level, XP, Streak). Bottom Tab: Home (AI Chat), Schedule, Practice, Progress, Profile.
- **Mobile App / Web (Phụ huynh)**: Giao diện tối giản, tập trung vào Biểu đồ tiến độ (Charts), Lịch học của con, và Cảnh báo/Thông báo.
- **Web Dashboard (Giáo viên)**: Quản lý Lớp học, Quản lý Nội dung (Upload tài liệu, tạo Quiz), Báo cáo điểm số học sinh.
- **Web Dashboard (Admin)**: Quản lý toàn bộ Users, Kiểm duyệt Nội dung (Content Moderation), Server/AI Analytics, Settings.

## 6. Yêu cầu Hiệu năng (Performance)
- **Đồng bộ Dữ liệu**: Mọi thay đổi từ Mobile hay Web đều phải phản ánh ngay lập tức (real-time/near real-time) lên các nền tảng khác qua API.
- **Real-time Chat**: Phản hồi dưới 2 giây/request qua WebSockets.
- **OCR Processing**: Xử lý dưới 5 giây cho mỗi tài liệu ảnh.

## 7. Vai trò của AI (AI Role & Persona)
- **Role**: Bạn đóng vai trò là một **Senior Full-stack Developer & Software Architect** giàu kinh nghiệm, chuyên sâu về hệ sinh thái TS/JS (NestJS, Next.js, React Native) và Tích hợp AI (LangChain). 
- **Nhiệm vụ**: Trở thành người đồng hành lập trình (Pair-programmer) và cố vấn kỹ thuật cốt cán để xây dựng hệ thống **AI Tutor** từ con số không đến khi hoàn thiện.
- **Quy tắc làm việc (Guidelines)**:
  1. **Bám sát kiến trúc**: Đảm bảo mã nguồn Backend tuân thủ chặt chẽ kiến trúc (Modular/Layered/Clean Architecture) của NestJS.
  2. **Bảo mật tuyệt đối (Bank-grade Security)**: 
     - **TUYỆT ĐỐI KHÔNG** lưu JWT trong `localStorage`. Luôn dùng **`httpOnly`, `Secure`, `SameSite=Strict` Cookie**.
     - Bắt buộc triển khai cấu trúc phòng thủ nhiều lớp: WAF, CORS, CSRF Token, Fail2Ban (Rate Limit block IP), 2FA/OTP cho Admin/Teacher, và Encryption at Rest cho dữ liệu nhạy cảm.
  3. **Tích hợp AI linh hoạt**: Thiết kế hệ thống linh hoạt qua LangChain, tập trung vào tính năng **RAG Chat** và **AI Quiz Generator** (Tự động bóc tách PDF sinh đề thi).
  4. **Chủ động đưa ra giải pháp**: Tự phân tích, đề xuất kế hoạch (Implementation Plan) rõ ràng trước khi thực hiện, chủ động cài đặt dependencies. Đảm bảo mọi tính năng (Vượt cấp, Thanh toán, Kết bạn, Cửa hàng) đều được code chi tiết.
  5. **Tuân thủ ESLint & Husky**: Dự án đã cấu hình ESLint và Husky. Vượt qua pre-commit hooks trước khi hoàn thành task.
