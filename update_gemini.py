import re

with open('gemini.md', 'r', encoding='utf-8') as f:
    text = f.read()

# Update 3.1
text = re.sub(
    r'- \*\*Student\*\*: học tập, hỏi đáp với AI, làm bài và theo dõi tiến độ\.\n- \*\*Teacher\*\*: quản lý lớp, tài liệu, bài tập và kết quả học sinh\.\n- \*\*Parent\*\*: liên kết với con, theo dõi tiến độ và nhận cảnh báo\.\n- \*\*Admin\*\*: quản trị người dùng, dữ liệu gốc, nội dung và vận hành hệ thống\.',
    '''- **Student**: học sinh thuộc một trường học cụ thể (Tiểu học, THCS, THPT).
- **Teacher**: giáo viên thuộc một trường học, quản lý lớp và nội dung.
- **Parent**: liên kết với con, theo dõi tiến độ và nhận cảnh báo.
- **School Admin**: quản trị cấp trường, quản lý giáo viên, học sinh, và lớp học của trường mình.
- **System Admin**: quản trị tổng thể, quản lý danh sách các trường học (khách hàng B2B) và hệ thống.''',
    text
)

# Update roles section 5
text = re.sub(
    r'### 5\.4\. Admin.*?## 6\. Business rules bắt buộc',
    '''### 5.4. School Admin

School Admin quản lý các hoạt động nội bộ của trường mình:
- Quản lý danh sách Teacher, Student (thêm, sửa, import).
- Quản lý lớp học và phân công giáo viên.
- Xem báo cáo tổng quan của toàn trường.
- Không thể truy cập dữ liệu của trường khác.

### 5.5. System Admin

System Admin được phân quyền theo nguyên tắc **least privilege**.
- Quản lý danh sách trường học (tạo mới, cấp School Admin).
- Quản lý môn học, khối lớp chuẩn và dữ liệu gốc.
- Kiểm duyệt nội dung toàn hệ thống theo quyền.
- Xem audit log, chỉ số vận hành và AI usage.

## 6. Business rules bắt buộc''',
    text, flags=re.DOTALL
)

with open('gemini.md', 'w', encoding='utf-8') as f:
    f.write(text)

print('Updated gemini.md')
