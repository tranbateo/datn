# AI Tutor Mobile (React Native / Expo)

Ứng dụng di động dành cho **Học sinh** và **Phụ huynh** trong nền tảng **AI Tutor**, kết nối trực tiếp với Backend API tập trung (`code/backend`).

## Chức năng chính

### Xác thực & Bảo mật (`BR-AUTH-001`, `BR-AUTH-002`)
- Đăng nhập cho **Học sinh** (Mã học sinh / Email) và **Phụ huynh** (Số điện thoại / Email).
- Lưu `accessToken` và `refreshToken` bằng **`expo-secure-store`** (Keychain / Keystore), tự động xoay vòng refresh token khi phiên hết hạn và thu hồi session khi đăng xuất.
- Bắt buộc đổi mật khẩu lần đầu (`mustChangePassword`) và gửi yêu cầu cấp lại mật khẩu tới GVCN / Quản trị viên nhà trường.

### Cổng Học sinh (`(student)`)
- **Trang chủ:** Tổng quan trường/lớp/GVCN, cấp độ, XP, chuỗi học tập, môn học theo khối, lịch sắp tới và thông báo.
- **Gia sư AI (RAG):** Hỏi đáp theo môn học kèm trích dẫn nguồn tài liệu lớp (`BR-RAG-001`), đính kèm ảnh bài tập (Camera / Thư viện) và báo cáo câu trả lời sai (`BR-RAG-002`).
- **Luyện tập & Phòng thi:** Xem đề giáo viên giao, tạo đề ngẫu nhiên 30–50 câu, làm bài trắc nghiệm + tự luận có đếm ngược, xem kết quả và chữa lỗi chi tiết.
- **Bài giảng & Tài liệu:** Xem danh sách khóa học, nội dung bài học và tài liệu PDF đã xuất bản của khối lớp.
- **Lịch học & OCR:** Lịch tuần tương tác, thêm/xóa sự kiện và chụp/chọn ảnh thời khóa biểu quét OCR.
- **Tiến độ & Hồ sơ:** Phân tích mạnh/yếu theo môn, tạo mã liên kết Phụ huynh 6 số dùng 1 lần (`BR-LINK-001`), chỉnh sửa thông tin cá nhân và đổi mật khẩu.

### Cổng Phụ huynh (`(parent)`)
- **Tổng quan:** Theo dõi tiến độ nhiều con, XP/Level/Streak, điểm mạnh/yếu từng môn, bài kiểm tra gần đây, lịch học sắp tới và chuông thông báo.
- **Liên lạc Giáo viên:** Lọc giáo viên theo từng con (hiển thị chính xác nhãn GVCN của từng bé), nhắn tin 2 chiều đồng bộ với Cổng Giáo viên, gửi và theo dõi đơn xin phép / đề xuất.
- **Liên kết tài khoản:** Nhập mã 6 số liên kết con mới và hỗ trợ hủy liên kết (`BR-LINK-001`).
- **Cài đặt:** Cập nhật thông tin cá nhân, đổi mật khẩu, gửi góp ý về nhà trường và đăng xuất.

## Hướng dẫn chạy

1. Khởi động Backend (`code/backend`) trên cổng `3001`.
2. Tạo file `.env` từ `.env.example` (hoặc cấu hình trực tiếp địa chỉ máy chủ ngay trên màn hình Đăng nhập của ứng dụng):
   - **Android Emulator:** `EXPO_PUBLIC_API_URL=http://10.0.2.2:3001`
   - **iOS Simulator / Web:** `EXPO_PUBLIC_API_URL=http://localhost:3001`
   - **Điện thoại thật (Expo Go cùng Wi-Fi):** `EXPO_PUBLIC_API_URL=http://<IP_LAN_CUA_MAY_TINH>:3001`
3. Cài đặt thư viện và khởi chạy:

```bash
npm install
npx expo start
```
