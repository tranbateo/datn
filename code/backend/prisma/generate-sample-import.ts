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

// --- Danh sách Giáo viên (12 giáo viên phụ trách các bộ môn) ---
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
  subjectTeacherCodes: string[];
}

const classes: ClassConfig[] = [
  { code: '6A', name: 'Lớp 6A', grade: 6, homeroomTeacherCode: 'GV01', subjectTeacherCodes: ['GV02', 'GV03', 'GV09', 'GV10'] },
  { code: '6B', name: 'Lớp 6B', grade: 6, homeroomTeacherCode: 'GV02', subjectTeacherCodes: ['GV01', 'GV03', 'GV09', 'GV10'] },
  { code: '7A', name: 'Lớp 7A', grade: 7, homeroomTeacherCode: 'GV03', subjectTeacherCodes: ['GV01', 'GV02', 'GV04', 'GV11'] },
  { code: '7B', name: 'Lớp 7B', grade: 7, homeroomTeacherCode: 'GV04', subjectTeacherCodes: ['GV01', 'GV02', 'GV03', 'GV11'] },
  { code: '8A', name: 'Lớp 8A', grade: 8, homeroomTeacherCode: 'GV05', subjectTeacherCodes: ['GV01', 'GV02', 'GV03', 'GV06', 'GV12'] },
  { code: '8B', name: 'Lớp 8B', grade: 8, homeroomTeacherCode: 'GV06', subjectTeacherCodes: ['GV01', 'GV02', 'GV03', 'GV05', 'GV12'] },
  { code: '9A', name: 'Lớp 9A', grade: 9, homeroomTeacherCode: 'GV07', subjectTeacherCodes: ['GV01', 'GV02', 'GV03', 'GV04', 'GV05', 'GV08'] },
  { code: '9B', name: 'Lớp 9B', grade: 9, homeroomTeacherCode: 'GV08', subjectTeacherCodes: ['GV01', 'GV02', 'GV03', 'GV04', 'GV05', 'GV07'] },
];

// --- Danh sách học sinh cố định (đảm bảo tính tất định khi chạy lại) ---
const studentNamesMale = [
  'Nguyễn Gia Bảo', 'Trần Minh Quân', 'Lê Hoàng Nam', 'Phạm Đức Anh', 'Hoàng Quốc Khánh',
  'Vũ Tuấn Kiệt', 'Đặng Quang Huy', 'Bùi Minh Khang', 'Đỗ Đăng Khoa', 'Hồ Trọng Nghĩa',
  'Ngô Nhật Minh', 'Dương Hải Đăng', 'Lý Thành Đạt', 'Phan Quốc Bảo', 'Huỳnh Gia Huy',
  'Võ Anh Tuấn', 'Nguyễn Đức Duy', 'Trần Quốc Việt', 'Lê Minh Triết', 'Phạm Hoàng Long',
];

const studentNamesFemale = [
  'Nguyễn Ngọc Linh', 'Trần Phương Thảo', 'Lê Khánh Huyền', 'Phạm Bảo Ngọc', 'Hoàng Thanh Hà',
  'Vũ Mai Anh', 'Đặng Thu Trang', 'Bùi Ngọc Ánh', 'Đỗ Thanh Trúc', 'Hồ Diệu Linh',
  'Ngô Quỳnh Hương', 'Dương Bích Ngọc', 'Lý Minh Châu', 'Phan Thanh Tâm', 'Huỳnh Bảo Trâm',
  'Võ Yến Nhi', 'Nguyễn Hà My', 'Trần Lan Anh', 'Lê Tuyết Nhi', 'Phạm Kim Ngân',
];

function generateDOB(grade: number, idx: number): string {
  const birthYear = 2020 - grade;
  const month = (idx % 12) + 1;
  const day = ((idx * 3) % 28) + 1;
  return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${birthYear}`;
}

function generatePhone(prefix: string, index: number): string {
  return `${prefix}${String(index).padStart(6, '0')}`;
}

// ============================================================
// SINH DỮ LIỆU
// ============================================================

// Sheet 1: Lớp & Giáo viên (Bao gồm cả GVCN và GVBM)
const classesSheetData: any[][] = [
  ['Mã Lớp', 'Tên Lớp', 'Khối', 'Vai Trò', 'Mã GVCN', 'Họ Tên GVCN', 'Email GVCN', 'SĐT GVCN', 'Môn Phụ Trách'],
];

for (const cls of classes) {
  // Dòng chính: GVCN của lớp
  const gvcn = teachers.find((t) => t.code === cls.homeroomTeacherCode)!;
  classesSheetData.push([
    cls.code,
    cls.name,
    cls.grade,
    'GVCN',
    gvcn.code,
    gvcn.name,
    gvcn.email,
    gvcn.phone,
    gvcn.subject,
  ]);

  // Các dòng phân công GVBM của lớp
  for (const stCode of cls.subjectTeacherCodes) {
    const gvbm = teachers.find((t) => t.code === stCode)!;
    classesSheetData.push([
      cls.code,
      cls.name,
      cls.grade,
      'GVBM',
      gvbm.code,
      gvbm.name,
      gvbm.email,
      gvbm.phone,
      gvbm.subject,
    ]);
  }
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
let maleIdx = 0;
let femaleIdx = 0;

// Dữ liệu phụ huynh có nhiều con (để test multi-child mapping)
const sharedParents = [
  { name1: 'Nguyễn Văn Tuấn',  phone1: '0901000001', rel1: 'Bố', name2: 'Lê Thị Thu',      phone2: '0902000001', rel2: 'Mẹ' },
  { name1: 'Trần Đức Hải',     phone1: '0901000002', rel1: 'Bố', name2: 'Phạm Thị Hồng',   phone2: '0902000002', rel2: 'Mẹ' },
  { name1: 'Hoàng Minh Quang', phone1: '0901000003', rel1: 'Bố', name2: 'Vũ Thị Lan Anh',  phone2: '0902000003', rel2: 'Mẹ' },
];

for (const cls of classes) {
  const studentsPerClass = 5; // 5 HS/lớp = 40 HS tổng

  for (let i = 0; i < studentsPerClass; i++) {
    const gender: 'Nam' | 'Nữ' = i % 2 === 0 ? 'Nam' : 'Nữ';
    const studentCode = `HS${String(studentIndex).padStart(4, '0')}`;
    const studentName =
      gender === 'Nam'
        ? studentNamesMale[maleIdx++ % studentNamesMale.length]
        : studentNamesFemale[femaleIdx++ % studentNamesFemale.length];
    const dob = generateDOB(cls.grade, studentIndex);

    let parentName1 = '';
    let parentPhone1 = '';
    let parentRel1 = '';
    let parentName2 = '';
    let parentPhone2 = '';
    let parentRel2 = '';

    // Dùng shared parents cho học sinh đầu tiên mỗi lớp (test multi-child)
    if (i === 0 && cls.code.endsWith('A') && cls.grade <= 8) {
      const sharedIdx = cls.grade - 6;
      const sp = sharedParents[sharedIdx];
      parentName1 = sp.name1;
      parentPhone1 = sp.phone1;
      parentRel1 = sp.rel1;
      parentName2 = sp.name2;
      parentPhone2 = sp.phone2;
      parentRel2 = sp.rel2;
    } else if (i === 0 && cls.code.endsWith('B') && cls.grade <= 8) {
      const sharedIdx = cls.grade - 6;
      const sp = sharedParents[sharedIdx];
      parentName1 = sp.name1;
      parentPhone1 = sp.phone1;
      parentRel1 = sp.rel1;
      parentName2 = sp.name2;
      parentPhone2 = sp.phone2;
      parentRel2 = sp.rel2;
    } else {
      const lastName = studentName.split(' ')[0];
      parentName1 = `${lastName} Văn Bình`;
      parentPhone1 = generatePhone('0903', parentPhoneIndex++);
      parentRel1 = 'Bố';

      if (i % 2 === 0) {
        parentName2 = `Lê Thị Hoa`;
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
      '', // Email học sinh (tùy chọn cho THCS)
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
wsClasses['!cols'] = [
  { wch: 10 }, // Mã Lớp
  { wch: 12 }, // Tên Lớp
  { wch: 6 },  // Khối
  { wch: 10 }, // Vai Trò
  { wch: 10 }, // Mã GVCN
  { wch: 22 }, // Họ Tên GVCN
  { wch: 32 }, // Email GVCN
  { wch: 14 }, // SĐT GVCN
  { wch: 16 }, // Môn Phụ Trách
];
XLSX.utils.book_append_sheet(wb, wsClasses, 'Lop_Va_GiaoVien');

const wsStudents = XLSX.utils.aoa_to_sheet(studentsSheetData);
wsStudents['!cols'] = [
  { wch: 12 }, // Mã Học Sinh
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
console.log(`Đã tạo file mẫu: ${outputPath}`);
console.log('='.repeat(60));
console.log(`Trường:           ${SCHOOL_NAME}`);
console.log(`Số lớp:           ${classes.length} lớp (Khối 6 -> 9, mỗi khối 2 lớp)`);
console.log(`Số giáo viên:     ${teachers.length} giáo viên (đầy đủ GVCN & GVBM)`);
console.log(`Số học sinh:      ${studentIndex - 1} học sinh`);
console.log(`Phụ huynh trùng:  3 gia đình có anh chị em học cùng trường`);
console.log('='.repeat(60));
