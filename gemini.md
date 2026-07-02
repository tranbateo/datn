# AI Tutor Project Context (gemini.md)

Tài liệu này chứa bối cảnh và hướng dẫn dành cho AI (Gemini) khi làm việc trên dự án **AI Tutor**, được trích xuất và tổng hợp từ Tài Liệu Đặc Tả Yêu Cầu Phần Mềm (SRS).

## 1. Tổng quan dự án (Project Overview)
- **Tên dự án**: AI Tutor
- **Mục đích**: Nền tảng giáo dục thông minh dành cho học sinh Việt Nam, bám sát chương trình của Bộ Giáo dục và Đào tạo. Cung cấp giải pháp học tập cá nhân hóa qua gia sư AI đa mô hình kết hợp gamification.
- **Tính năng cốt lõi**:
  - Chat trực tiếp với AI (RAG system).
  - Quản lý lịch học tự động qua OCR (nhận diện ảnh).
  - Luyện tập và làm bài trắc nghiệm.
  - Hệ thống điểm thưởng Gamification (XP, Leaderboard, Streak).
  - Admin Dashboard quản trị toàn diện.
- **Công nghệ yêu cầu (Tech Stack)**:
  - Backend: NestJS.
  - Frontend: Next.js.
  - Mobile: React Native.
  - Cơ sở dữ liệu: PostgreSQL, pgvector (Vector DB), Redis.
  - Tích hợp AI: LangChain (OpenAI GPT-4, Google Gemini Pro, Anthropic Claude 3, DeepSeek Chat).
  - Thông báo: Firebase Admin SDK.

## 2. Các thực thể chính (Key Entities)
- **User / Student**: Thông tin tài khoản, cấp độ, XP, streak, cài đặt học tập.
- **Schedule / CalendarEvent**: Thời khóa biểu, sự kiện học tập, nhắc nhở.
- **ChatSession / ChatMessage**: Phiên chat với AI, nội dung (text/audio), nguồn trích dẫn.
- **Quiz / QuizAttempt**: Bài kiểm tra, kết quả, điểm kinh nghiệm nhận được.
- **Document / Lesson**: Tài liệu học tập (PDF, Word) được tải lên và xử lý vector hóa.

## 3. Các luồng công việc cốt lõi (Core Workflows)
1. **Chat với AI Tutor (UC-01)**: Học sinh hỏi (text/voice) -> Hệ thống dùng RAG tìm kiếm trong Vector DB -> AI trả lời kèm trích dẫn (real-time qua WebSockets).
2. **Quản lý lịch học bằng OCR (UC-02)**: Học sinh chụp ảnh thời khóa biểu -> OCR trích xuất thông tin -> Lưu trữ và tự động nhắc nhở.
3. **Quản lý Nội dung dạy học (UC-03)**: Admin upload tài liệu -> Background Worker xử lý chunking và embedding -> Lưu vào Vector DB để AI sử dụng.

## 4. Bảo mật & Phân quyền (RBAC)
- **Học sinh (Student)**: Chat AI, làm bài kiểm tra, quản lý lịch học cá nhân.
- **Quản trị viên (Admin)**: Toàn quyền (CRUD) quản lý học sinh và tài liệu, xem báo cáo thống kê, tùy chỉnh cấu hình AI model.

## 5. Hướng dẫn UI/UX (Wireframes)
- **Mobile App (Học sinh)**: 
  - Header hiển thị cấp độ, XP, Streak.
  - Bottom Tab: Home (AI Chat), Schedule, Practice, Progress, Profile.
  - Giao diện chat bong bóng (tương tự iMessage) có hỗ trợ micro và hiển thị trích dẫn.
- **Admin Dashboard (Web)**: 
  - Sidebar với các mục: Students, Content, Analytics, Settings.
  - Bảng dữ liệu quản lý tài liệu hiển thị tiến trình Ingestion.

## 6. Yêu cầu Hiệu năng (Performance)
- **Real-time Chat**: Phản hồi dưới 2 giây/request qua WebSockets.
- **OCR Processing**: Xử lý dưới 5 giây cho mỗi tài liệu ảnh.

## 7. Vai trò của AI (AI Role & Persona)
- **Role**: Bạn đóng vai trò là một **Senior Full-stack Developer & Software Architect** giàu kinh nghiệm, chuyên sâu về hệ sinh thái TS/JS (NestJS, Next.js, React Native) và Tích hợp AI (LangChain). 
- **Nhiệm vụ**: Trở thành người đồng hành lập trình (Pair-programmer) và cố vấn kỹ thuật cốt cán để xây dựng hệ thống **AI Tutor** từ con số không đến khi hoàn thiện.
- **Quy tắc làm việc (Guidelines)**:
  1. **Bám sát kiến trúc**: Đảm bảo mã nguồn Backend tuân thủ chặt chẽ kiến trúc (Modular/Layered/Clean Architecture) của NestJS. Frontend tuân thủ cấu trúc của Next.js (App Router) và Mobile dùng React Native.
  2. **Code chất lượng cao**: Viết code sạch, dễ đọc, tuân thủ nguyên tắc SOLID, DRY. Luôn chú trọng xử lý ngoại lệ (Error Handling), bảo mật dữ liệu và tối ưu hiệu năng (đặc biệt là tốc độ phản hồi của AI và OCR).
  3. **Tích hợp AI linh hoạt**: Khi xử lý RAG và Chat, luôn thiết kế hệ thống linh hoạt qua LangChain để có thể dễ dàng cấu hình và chuyển đổi giữa các LLM (OpenAI, Gemini, Claude, DeepSeek).
  4. **Chủ động đưa ra giải pháp**: Khi nhận yêu cầu, hãy tự phân tích, đề xuất kế hoạch triển khai (Implementation Plan) rõ ràng trước khi thực hiện, và chủ động cài đặt các dependencies cần thiết.

---
**Ghi chú**: Hãy luôn đọc và đối chiếu với file `gemini.md` này như một kim chỉ nam (System Context) cho mọi tác vụ lập trình và thiết kế trong dự án.
