/**
 * Script tạo file Excel mẫu đầy đủ dữ liệu cho Trường THCS Nguyễn Trãi
 * Chạy: cd code/backend && npx ts-node prisma/generate-sample-import.ts
 */
import * as XLSX from 'xlsx';
import * as path from 'path';

// ============================================================
// DỮ LIỆU MẪU - TRƯỜNG THCS NGUYỄN TRÃI
// ============================================================

const SCHOOL_NAME = 'THCS Nguyễn Trãi';

// --- Danh sách Giáo viên ---
const teachers = [
  { code: 'GV01', name: 'Nguyễn Thị Mai',     email: 'mai.nguyen@nguyentrai.edu.vn',  phone: '0912345001', subject: 'Toán học' },
  { code: 'GV02', name: 'Trần Văn Hùng',      email: 'hung.tran@nguyentrai.edu.vn',   phone: '0912345002', subject: 'Ngữ văn' },
  { code: 'GV03', name: 'Lê Thị Hương',       email: 'huong.le@nguyentrai.edu.vn',    phone: '0912345003', subject: 'Tiếng Anh' },
  { code: 'GV04', name: 'Phạm Minh Tuấn',     email: 'tuan.pham@nguyentrai.edu.vn',   phone: '0912345004', subject: 'Vật lý' },
  { code: 'GV05', name: 'Hoàng Thị Lan',      email: 'lan.hoang@nguyentrai.edu.vn',   phone: '0912345005', subject: 'Hóa học' },
  { code: 'GV06', name: 'Đỗ Quang Minh',      email: 'minh.do@nguyentrai.edu.vn',     phone: '0912345006', subject: 'Sinh học' },
  { code: 'GV07', name: 'Vũ Thị Thanh',       email: 'thanh.vu@nguyentrai.edu.vn',    phone: '0912345007', subject: 'Lịch sử' },
  { code: 'GV08', name: 'Bùi Đức Thắng',      email: 'thang.bui@nguyentrai.edu.vn',   phone: '0912345008', subject: 'Địa lý' },
  { code: 'GV09', name: 'Ngô Thị Hạnh',       email: 'hanh.ngo@nguyentrai.edu.vn',    phone: '0912345009', subject: 'GDCD' },
  { code: 'GV10', name: 'Đinh Văn Phong',      email: 'phong.dinh@nguyentrai.edu.vn',  phone: '0912345010', subject: 'Tin học' },
  { code: 'GV11', name: 'Trịnh Thị Ngọc',     email: 'ngoc.trinh@nguyentrai.edu.vn',  phone: '0912345011', subject: 'Công nghệ' },
  { code: 'GV12', name: 'Lý Minh Đức',        email: 'duc.ly@nguyentrai.edu.vn',      phone: '0912345012', subject: 'Thể dục' },
];

// --- Cấu hình lớp học (8 lớp: 6A, 6B, 7A, 7B, 8A, 8B, 9A, 9B) ---
interface ClassConfig {
  code: string;
  name: string;
  grade: number;
  homeroomTeacherCode: string;
}

const classes: ClassConfig[] = [
  { code: '6A',  name: 'Lớp 6A',  grade: 6, homeroomTeacherCode: 'GV01' },
  { code: '6B',  name: 'Lớp 6B',  grade: 6, homeroomTeacherCode: 'GV02' },
  { code: '7A',  name: 'Lớp 7A',  grade: 7, homeroomTeacherCode: 'GV03' },
  { code: '7B',  name: 'Lớp 7B',  grade: 7, homeroomTeacherCode: 'GV04' },
  { code: '8A',  name: 'Lớp 8A',  grade: 8, homeroomTeacherCode: 'GV05' },
  { code: '8B',  name: 'Lớp 8B',  grade: 8, homeroomTeacherCode: 'GV06' },
  { code: '9A',  name: 'Lớp 9A',  grade: 9, homeroomTeacherCode: 'GV07' },
  { code: '9B',  name: 'Lớp 9B',  grade: 9, homeroomTeacherCode: 'GV08' },
];

// --- Họ và Tên Việt Nam phổ biến ---
const lastNames = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Phan', 'Vũ', 'Võ', 'Đặng', 'Bùi', 'Đỗ', 'Hồ', 'Ngô', 'Dương', 'Lý'];
const middleNamesMale = ['Văn', 'Minh', 'Đức', 'Quang', 'Thanh', 'Công', 'Hữu', 'Quốc', 'Bá', 'Trung'];
const middleNamesFemale = ['Thị', 'Ngọc', 'Phương', 'Thanh', 'Bích', 'Kim', 'Hoàng', 'Diệu', 'Mai'];
const firstNamesMale = ['An', 'Bảo', 'Cường', 'Dũng', 'Đạt', 'Hào', 'Hiếu', 'Huy', 'Khang', 'Khôi', 'Kiên', 'Long', 'Minh', 'Nam', 'Phát', 'Phúc', 'Quân', 'Sơn', 'Thành', 'Trí', 'Tuấn', 'Vinh', 'Vũ', 'Nhật', 'Đăng', 'Tài', 'Lộc', 'Thiện', 'Bình', 'Đông'];
const firstNamesFemale = ['Anh', 'Chi', 'Dung', 'Giang', 'Hà', 'Hằng', 'Hạnh', 'Hiền', 'Hoa', 'Hương', 'Lan', 'Linh', 'Mai', 'Ngân', 'Ngọc', 'Như', 'Phương', 'Quỳnh', 'Thảo', 'Trang', 'Trinh', 'Uyên', 'Vân', 'Yến', 'Thủy', 'Diệp', 'Ly', 'Nhi', 'Trâm', 'Châu'];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateVietnameseName(gender: 'Nam' | 'Nữ'): string {
  const last = pick(lastNames);
  const middle = gender === 'Nam' ? pick(middleNamesMale) : pick(middleNamesFemale);
  const first = gender === 'Nam' ? pick(firstNamesMale) : pick(firstNamesFemale);
  return `${last} ${middle} ${first}`;
}

function generateDOB(grade: number): string {
  // Học sinh lớp 6 sinh năm 2014, lớp 7 → 2013, lớp 8 → 2012, lớp 9 → 2011
  const birthYear = 2020 - grade;
  const month = Math.floor(Math.random() * 12) + 1;
  const day = Math.floor(Math.random() * 28) + 1;
  return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${birthYear}`;
}

function generatePhone(prefix: string, index: number): string {
  return `${prefix}${String(index).padStart(6, '0')}`;
}

// ============================================================
// SINH DỮ LIỆU
// ============================================================

// Sheet 1: Lớp & Giáo viên
const classesSheetData: any[][] = [
  ['Mã Lớp', 'Tên Lớp', 'Khối', 'Mã GVCN', 'Họ Tên GVCN', 'Email GVCN', 'SĐT GVCN', 'Môn Phụ Trách'],
];

for (const cls of classes) {
  const teacher = teachers.find(t => t.code === cls.homeroomTeacherCode)!;
  classesSheetData.push([
    cls.code,
    cls.name,
    cls.grade,
    teacher.code,
    teacher.name,
    teacher.email,
    teacher.phone,
    teacher.subject,
  ]);
}

// Sheet 2: Học sinh & Phụ huynh
const studentsSheetData: any[][] = [
  [
    'Mã Học Sinh',
    'Họ Tên Học Sinh',
    'Mã Lớp',
    'Ngày Sinh (dd/mm/yyyy)',
    'Giới Tính',
    'Email Học Sinh',
    'Họ Tên Phụ Huynh 1',
    'SĐT Phụ Huynh 1',
    'Quan Hệ PH 1',
    'Họ Tên Phụ Huynh 2',
    'SĐT Phụ Huynh 2',
    'Quan Hệ PH 2',
  ],
];

let studentIndex = 1;
let parentPhoneIndex = 100001;

// Dữ liệu phụ huynh có nhiều con (để test multi-child mapping)
const sharedParents = [
  { name1: 'Nguyễn Văn Tuấn',   phone1: '0901000001', rel1: 'Bố', name2: 'Lê Thị Thu',       phone2: '0902000001', rel2: 'Mẹ' },
  { name1: 'Trần Đức Hải',      phone1: '0901000002', rel1: 'Bố', name2: 'Phạm Thị Hồng',    phone2: '0902000002', rel2: 'Mẹ' },
  { name1: 'Hoàng Minh Quang',  phone1: '0901000003', rel1: 'Bố', name2: 'Vũ Thị Lan Anh',   phone2: '0902000003', rel2: 'Mẹ' },
];

for (const cls of classes) {
  const studentsPerClass = cls.code.endsWith('A') ? 5 : 5; // 5 HS/lớp = 40 HS tổng
  
  for (let i = 0; i < studentsPerClass; i++) {
    const gender: 'Nam' | 'Nữ' = i % 2 === 0 ? 'Nam' : 'Nữ';
    const studentCode = `HS${String(studentIndex).padStart(4, '0')}`;
    const studentName = generateVietnameseName(gender);
    const dob = generateDOB(cls.grade);

    let parentName1 = '';
    let parentPhone1 = '';
    let parentRel1 = '';
    let parentName2 = '';
    let parentPhone2 = '';
    let parentRel2 = '';

    // Dùng shared parents cho 2 học sinh đầu tiên mỗi khối lớp (test multi-child)
    if (i === 0 && cls.code.endsWith('A')) {
      const sharedIdx = Math.min(Math.floor((cls.grade - 6)), sharedParents.length - 1);
      const sp = sharedParents[sharedIdx];
      parentName1 = sp.name1;
      parentPhone1 = sp.phone1;
      parentRel1 = sp.rel1;
      parentName2 = sp.name2;
      parentPhone2 = sp.phone2;
      parentRel2 = sp.rel2;
    } else if (i === 0 && cls.code.endsWith('B')) {
      // Dùng lại SĐT của shared parent (anh chị em khác lớp)
      const sharedIdx = Math.min(Math.floor((cls.grade - 6)), sharedParents.length - 1);
      const sp = sharedParents[sharedIdx];
      parentName1 = sp.name1;
      parentPhone1 = sp.phone1;
      parentRel1 = sp.rel1;
      parentName2 = '';
      parentPhone2 = '';
      parentRel2 = '';
    } else {
      // Phụ huynh bình thường
      const lastName = studentName.split(' ')[0];
      parentName1 = `${lastName} Văn ${pick(firstNamesMale)}`;
      parentPhone1 = generatePhone('0903', parentPhoneIndex++);
      parentRel1 = 'Bố';

      // 60% học sinh có cả bố lẫn mẹ
      if (Math.random() < 0.6) {
        parentName2 = `${pick(lastNames)} Thị ${pick(firstNamesFemale)}`;
        parentPhone2 = generatePhone('0907', parentPhoneIndex++);
        parentRel2 = 'Mẹ';
      }
    }

    studentsSheetData.push([
      studentCode,
      studentName,
      cls.code,
      dob,
      gender,
      '', // Email học sinh (trống cho THCS)
      parentName1,
      parentPhone1,
      parentRel1,
      parentName2,
      parentPhone2,
      parentRel2,
    ]);

    studentIndex++;
  }
}

// ============================================================
// TẠO FILE EXCEL
// ============================================================
const wb = XLSX.utils.book_new();

const wsClasses = XLSX.utils.aoa_to_sheet(classesSheetData);
// Set column widths
wsClasses['!cols'] = [
  { wch: 10 }, // Mã Lớp
  { wch: 12 }, // Tên Lớp
  { wch: 6 },  // Khối
  { wch: 10 }, // Mã GVCN
  { wch: 22 }, // Họ Tên GVCN
  { wch: 32 }, // Email GVCN
  { wch: 14 }, // SĐT GVCN
  { wch: 16 }, // Môn Phụ Trách
];
XLSX.utils.book_append_sheet(wb, wsClasses, 'Lop_Va_GiaoVien');

const wsStudents = XLSX.utils.aoa_to_sheet(studentsSheetData);
wsStudents['!cols'] = [
  { wch: 10 }, // Mã Học Sinh
  { wch: 24 }, // Họ Tên Học Sinh
  { wch: 8 },  // Mã Lớp
  { wch: 18 }, // Ngày Sinh
  { wch: 8 },  // Giới Tính
  { wch: 28 }, // Email Học Sinh
  { wch: 24 }, // Họ Tên PH1
  { wch: 14 }, // SĐT PH1
  { wch: 10 }, // Quan Hệ PH1
  { wch: 24 }, // Họ Tên PH2
  { wch: 14 }, // SĐT PH2
  { wch: 10 }, // Quan Hệ PH2
];
XLSX.utils.book_append_sheet(wb, wsStudents, 'HocSinh_Va_PhuHuynh');

// Ghi file
const outputPath = path.join(__dirname, '..', '..', '..', 'docs', 'MauImport_THCS_NguyenTrai.xlsx');
XLSX.writeFile(wb, outputPath);

console.log('='.repeat(60));
console.log(`✅ Đã tạo file mẫu: ${outputPath}`);
console.log('='.repeat(60));
console.log(`📚 Trường:           ${SCHOOL_NAME}`);
console.log(`🏫 Số lớp:           ${classes.length} lớp (Khối 6 → 9, mỗi khối 2 lớp)`);
console.log(`👩‍🏫 Số giáo viên:     ${teachers.length} giáo viên`);
console.log(`👨‍🎓 Số học sinh:      ${studentIndex - 1} học sinh (${studentsPerClassInfo()})`);
console.log(`👨‍👩‍👧 Phụ huynh trùng:  3 gia đình có anh chị em học cùng trường`);
console.log('='.repeat(60));
console.log('');
console.log('📋 Thông tin test Multi-child Mapping:');
for (const sp of sharedParents) {
  console.log(`   • ${sp.name1} (${sp.phone1}) có con ở nhiều lớp → Hệ thống sẽ gộp 1 tài khoản PH`);
}
console.log('');
console.log('🔑 Mật khẩu mặc định:');
console.log('   • Học sinh:    Ngày sinh ddmmyyyy (VD: 15052014) hoặc Student@123');
console.log('   • Giáo viên:   Teacher@123');
console.log('   • Phụ huynh:   Parent@123');
console.log('   → Tất cả phải đổi mật khẩu ở lần đăng nhập đầu tiên.');

function studentsPerClassInfo(): string {
  return classes.map(c => `${c.code}: 5 HS`).join(', ');
}

