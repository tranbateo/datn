import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { Role } from '@prisma/client';
import * as XLSX from 'xlsx';
import * as bcrypt from 'bcryptjs';

export interface ImportPreviewResult {
  isValid: boolean;
  summary: {
    classesCount: number;
    teachersCount: number;
    studentsCount: number;
    parentsCount: number;
    newStudentsCount: number;
    existingStudentsCount: number;
  };
  warnings: string[];
  errors: string[];
}

@Injectable()
export class SchoolsImportService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  /**
   * Sinh file Excel mẫu 2 sheet cho Nhà trường tải về điền dữ liệu
   */
  generateTemplate(): Buffer {
    const wb = XLSX.utils.book_new();

    // Sheet 1: Lớp & Giáo viên
    const classesData = [
      [
        'Mã Lớp',
        'Tên Lớp',
        'Khối',
        'Mã GVCN',
        'Họ Tên GVCN',
        'Email GVCN',
        'SĐT GVCN',
        'Môn Phụ Trách',
      ],
      [
        '6A',
        'Lớp 6A',
        6,
        'GV01',
        'Nguyễn Thị Mai',
        'mai.nguyen@school.edu.vn',
        '0912345678',
        'Toán học',
      ],
      [
        '6B',
        'Lớp 6B',
        6,
        'GV02',
        'Trần Văn Tuấn',
        'tuan.tran@school.edu.vn',
        '0987654321',
        'Ngữ văn',
      ],
      [
        '10A1',
        'Lớp 10A1',
        10,
        'GV03',
        'Lê Hồng Phong',
        'phong.le@school.edu.vn',
        '0933445566',
        'Vật lý',
      ],
    ];
    const wsClasses = XLSX.utils.aoa_to_sheet(classesData);
    XLSX.utils.book_append_sheet(wb, wsClasses, 'Lop_Va_GiaoVien');

    // Sheet 2: Học sinh & Phụ huynh
    const studentsData = [
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
      [
        'HS001',
        'Nguyễn Gia Bảo',
        '6A',
        '15/05/2014',
        'Nam',
        '',
        'Nguyễn Văn Tuấn',
        '0901112223',
        'Bố',
        'Lê Thị Thu',
        '0902223334',
        'Mẹ',
      ],
      [
        'HS002',
        'Trần Ngọc Linh',
        '6A',
        '20/08/2014',
        'Nữ',
        '',
        'Trần Văn Hùng',
        '0903334445',
        'Bố',
        '',
        '',
        '',
      ],
      [
        'HS003',
        'Nguyễn Gia Huy',
        '6B',
        '10/11/2014',
        'Nam',
        '',
        'Nguyễn Văn Tuấn',
        '0901112223',
        'Bố',
        '',
        '',
        '',
      ],
    ];
    const wsStudents = XLSX.utils.aoa_to_sheet(studentsData);
    XLSX.utils.book_append_sheet(wb, wsStudents, 'HocSinh_Va_PhuHuynh');

    return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  }

  /**
   * Đọc và kiểm tra lỗi file Excel trước khi lưu (Dry-run Preview)
   */
  async previewImport(
    schoolId: string,
    fileBuffer: Buffer,
  ): Promise<ImportPreviewResult> {
    const school = await this.prisma.school.findUnique({
      where: { id: schoolId },
    });
    if (!school) {
      throw new NotFoundException('Không tìm thấy trường học');
    }

    const wb = XLSX.read(fileBuffer, { type: 'buffer' });
    const errors: string[] = [];
    const warnings: string[] = [];

    const sheetClassesName = wb.SheetNames.find(
      (name) =>
        name.toLowerCase().includes('lop') ||
        name.toLowerCase().includes('class'),
    ) || wb.SheetNames[0];

    const sheetStudentsName = wb.SheetNames.find(
      (name) =>
        name.toLowerCase().includes('hocsinh') ||
        name.toLowerCase().includes('student'),
    ) || wb.SheetNames[1];

    if (!sheetClassesName || !sheetStudentsName) {
      errors.push('File Excel phải có ít nhất 2 sheet: Lớp & Giáo viên và Học sinh & Phụ huynh.');
      return {
        isValid: false,
        summary: {
          classesCount: 0,
          teachersCount: 0,
          studentsCount: 0,
          parentsCount: 0,
          newStudentsCount: 0,
          existingStudentsCount: 0,
        },
        warnings,
        errors,
      };
    }

    const classesRows: any[] = XLSX.utils.sheet_to_json(
      wb.Sheets[sheetClassesName],
    );
    const studentsRows: any[] = XLSX.utils.sheet_to_json(
      wb.Sheets[sheetStudentsName],
    );

    // Validate Classes & Teachers
    const classCodesInFile = new Set<string>();
    const teacherCodesInFile = new Set<string>();

    classesRows.forEach((row, idx) => {
      const rowNum = idx + 2;
      const classCode = String(row['Mã Lớp'] || '').trim();
      const grade = parseInt(row['Khối'], 10);
      const teacherCode = String(row['Mã GVCN'] || '').trim();
      const teacherName = String(row['Họ Tên GVCN'] || '').trim();
      const teacherPhone = String(row['SĐT GVCN'] || '').trim();

      if (!classCode) {
        errors.push(`Sheet [${sheetClassesName}], Dòng ${rowNum}: Thiếu Mã Lớp.`);
      } else {
        classCodesInFile.add(classCode);
      }

      if (isNaN(grade) || grade < 1 || grade > 12) {
        errors.push(
          `Sheet [${sheetClassesName}], Dòng ${rowNum}: Khối lớp phải là số từ 1 đến 12.`,
        );
      }

      if (!teacherName) {
        warnings.push(`Sheet [${sheetClassesName}], Dòng ${rowNum}: Lớp ${classCode} chưa có thông tin Giáo viên chủ nhiệm.`);
      }

      if (teacherCode) {
        teacherCodesInFile.add(teacherCode);
      }
    });

    // Validate Students & Parents
    const studentCodesInFile = new Set<string>();
    const parentPhonesInFile = new Map<string, string[]>(); // phone -> list of student names
    let newStudentsCount = 0;
    let existingStudentsCount = 0;

    // Lấy danh sách học sinh hiện có của trường
    const existingStudents = await this.prisma.user.findMany({
      where: { schoolId, role: Role.STUDENT },
      select: { studentCode: true },
    });
    const existingStudentCodes = new Set(
      existingStudents.map((s) => s.studentCode).filter(Boolean),
    );

    studentsRows.forEach((row, idx) => {
      const rowNum = idx + 2;
      const studentCode = String(row['Mã Học Sinh'] || '').trim();
      const studentName = String(row['Họ Tên Học Sinh'] || '').trim();
      const classCode = String(row['Mã Lớp'] || '').trim();
      const parentName1 = String(row['Họ Tên Phụ Huynh 1'] || '').trim();
      const parentPhone1 = String(row['SĐT Phụ Huynh 1'] || '').trim();

      if (!studentCode) {
        errors.push(`Sheet [${sheetStudentsName}], Dòng ${rowNum}: Thiếu Mã Học Sinh.`);
      } else if (studentCodesInFile.has(studentCode)) {
        errors.push(`Sheet [${sheetStudentsName}], Dòng ${rowNum}: Trùng lặp Mã Học Sinh [${studentCode}] trong file.`);
      } else {
        studentCodesInFile.add(studentCode);
      }

      if (!studentName) {
        errors.push(`Sheet [${sheetStudentsName}], Dòng ${rowNum}: Thiếu Họ Tên Học Sinh.`);
      }

      if (!classCode) {
        errors.push(`Sheet [${sheetStudentsName}], Dòng ${rowNum}: Học sinh [${studentName}] chưa có Mã Lớp.`);
      } else if (!classCodesInFile.has(classCode)) {
        errors.push(
          `Sheet [${sheetStudentsName}], Dòng ${rowNum}: Mã Lớp [${classCode}] của học sinh [${studentName}] không tồn tại trong sheet Lớp học.`,
        );
      }

      if (!parentPhone1) {
        warnings.push(`Sheet [${sheetStudentsName}], Dòng ${rowNum}: Học sinh [${studentName}] chưa có SĐT Phụ huynh.`);
      } else {
        // Track parent linking for multi-child check
        const currentList = parentPhonesInFile.get(parentPhone1) || [];
        currentList.push(`${studentName} (${classCode})`);
        parentPhonesInFile.set(parentPhone1, currentList);
      }

      if (existingStudentCodes.has(studentCode)) {
        existingStudentsCount++;
      } else {
        newStudentsCount++;
      }
    });

    // Thông báo gộp tài khoản phụ huynh nếu có
    parentPhonesInFile.forEach((students, phone) => {
      if (students.length > 1) {
        warnings.push(
          `Phụ huynh SĐT [${phone}] có ${students.length} con cùng học: ${students.join(', ')}. Hệ thống sẽ tự động liên kết vào 1 tài khoản phụ huynh duy nhất.`,
        );
      }
    });

    return {
      isValid: errors.length === 0,
      summary: {
        classesCount: classCodesInFile.size,
        teachersCount: teacherCodesInFile.size,
        studentsCount: studentCodesInFile.size,
        parentsCount: parentPhonesInFile.size,
        newStudentsCount,
        existingStudentsCount,
      },
      warnings,
      errors,
    };
  }

  /**
   * Thực thi import danh sách vào Database (chạy trong transaction)
   */
  async executeImport(schoolId: string, fileBuffer: Buffer) {
    const preview = await this.previewImport(schoolId, fileBuffer);
    if (!preview.isValid) {
      throw new BadRequestException({
        message: 'File Excel chứa lỗi dữ liệu, không thể import.',
        errors: preview.errors,
      });
    }

    const wb = XLSX.read(fileBuffer, { type: 'buffer' });
    const sheetClassesName = wb.SheetNames.find(
      (name) =>
        name.toLowerCase().includes('lop') ||
        name.toLowerCase().includes('class'),
    ) || wb.SheetNames[0];

    const sheetStudentsName = wb.SheetNames.find(
      (name) =>
        name.toLowerCase().includes('hocsinh') ||
        name.toLowerCase().includes('student'),
    ) || wb.SheetNames[1];

    const classesRows: any[] = XLSX.utils.sheet_to_json(
      wb.Sheets[sheetClassesName],
    );
    const studentsRows: any[] = XLSX.utils.sheet_to_json(
      wb.Sheets[sheetStudentsName],
    );

    const pepper =
      this.configService.get<string>('PASSWORD_PEPPER') || 'DEFAULT_PEPPER';
    const defaultTeacherPasswordHash = await bcrypt.hash(
      'Teacher@123' + pepper,
      10,
    );
    const defaultParentPasswordHash = await bcrypt.hash(
      'Parent@123' + pepper,
      10,
    );
    const defaultStudentPasswordHash = await bcrypt.hash(
      'Student@123' + pepper,
      10,
    );

    return this.prisma.$transaction(
      async (tx) => {
        // 1. Tạo hoặc lấy Niên khóa hiện tại (AcademicYear)
        const currentYearName = '2025-2026';
        let academicYear = await tx.academicYear.findFirst({
          where: { schoolId, isCurrent: true },
        });

        if (!academicYear) {
          academicYear = await tx.academicYear.create({
            data: {
              schoolId,
              name: currentYearName,
              isCurrent: true,
            },
          });
        }

        // 2. Xử lý Giáo viên & Lớp học (Sheet 1)
        const classMap = new Map<string, string>(); // classCode -> classId

        for (const row of classesRows) {
          const classCode = String(row['Mã Lớp'] || '').trim();
          const className = String(row['Tên Lớp'] || classCode).trim();
          const grade = parseInt(row['Khối'], 10);
          const teacherCode = String(row['Mã GVCN'] || '').trim();
          const teacherName = String(row['Họ Tên GVCN'] || '').trim();
          const teacherEmail = String(row['Email GVCN'] || '').trim() || null;
          const teacherPhone = String(row['SĐT GVCN'] || '').trim() || null;

          let homeroomTeacherId: string | null = null;

          if (teacherName && (teacherEmail || teacherPhone)) {
            // Upsert Giáo viên
            const existingTeacher = await tx.user.findFirst({
              where: {
                schoolId,
                role: Role.TEACHER,
                OR: [
                  teacherEmail ? { email: teacherEmail } : {},
                  teacherPhone ? { phone: teacherPhone } : {},
                  teacherCode ? { studentCode: teacherCode } : {},
                ].filter((c) => Object.keys(c).length > 0),
              },
            });

            if (existingTeacher) {
              homeroomTeacherId = existingTeacher.id;
              await tx.user.update({
                where: { id: existingTeacher.id },
                data: {
                  fullName: teacherName,
                  email: teacherEmail || existingTeacher.email,
                  phone: teacherPhone || existingTeacher.phone,
                },
              });
            } else {
              const newTeacher = await tx.user.create({
                data: {
                  schoolId,
                  fullName: teacherName,
                  email: teacherEmail,
                  phone: teacherPhone,
                  studentCode: teacherCode || null,
                  role: Role.TEACHER,
                  passwordHash: defaultTeacherPasswordHash,
                  mustChangePassword: true,
                  isActive: true,
                },
              });
              homeroomTeacherId = newTeacher.id;
            }
          }

          // Upsert Class
          let classRecord = await tx.class.findFirst({
            where: {
              schoolId,
              academicYearId: academicYear.id,
              name: className,
            },
          });

          if (classRecord) {
            classRecord = await tx.class.update({
              where: { id: classRecord.id },
              data: {
                grade,
                homeroomTeacherId: homeroomTeacherId || classRecord.homeroomTeacherId,
              },
            });
          } else {
            classRecord = await tx.class.create({
              data: {
                schoolId,
                academicYearId: academicYear.id,
                name: className,
                grade,
                homeroomTeacherId,
                status: 'ACTIVE',
              },
            });
          }

          classMap.set(classCode, classRecord.id);
          classMap.set(className, classRecord.id);
        }

        // 3. Xử lý Học sinh & Phụ huynh (Sheet 2)
        let studentsProcessed = 0;
        let parentsProcessed = 0;
        let linksProcessed = 0;

        for (const row of studentsRows) {
          const studentCode = String(row['Mã Học Sinh'] || '').trim();
          const studentName = String(row['Họ Tên Học Sinh'] || '').trim();
          const classCode = String(row['Mã Lớp'] || '').trim();
          const birthDateStr = String(row['Ngày Sinh (dd/mm/yyyy)'] || '').trim();
          const email = String(row['Email Học Sinh'] || '').trim() || null;

          const parentName1 = String(row['Họ Tên Phụ Huynh 1'] || '').trim();
          const parentPhone1 = String(row['SĐT Phụ Huynh 1'] || '').trim();
          const parentRel1 = String(row['Quan Hệ PH 1'] || 'Phụ huynh').trim();

          const parentName2 = String(row['Họ Tên Phụ Huynh 2'] || '').trim();
          const parentPhone2 = String(row['SĐT Phụ Huynh 2'] || '').trim();
          const parentRel2 = String(row['Quan Hệ PH 2'] || 'Phụ huynh').trim();

          const classId = classMap.get(classCode);
          if (!classId) continue;

          // Mật khẩu mặc định học sinh: ngày sinh ddmmyyyy (nếu có) hoặc Student@123
          let studentPasswordHash = defaultStudentPasswordHash;
          if (birthDateStr) {
            const cleanDate = birthDateStr.replace(/[^0-9]/g, '');
            if (cleanDate.length === 8) {
              studentPasswordHash = await bcrypt.hash(cleanDate + pepper, 10);
            }
          }

          // Upsert Student
          let student = await tx.user.findFirst({
            where: {
              schoolId,
              studentCode,
            },
          });

          if (student) {
            student = await tx.user.update({
              where: { id: student.id },
              data: {
                fullName: studentName,
                email: email || student.email,
              },
            });
          } else {
            student = await tx.user.create({
              data: {
                schoolId,
                studentCode,
                fullName: studentName,
                email,
                role: Role.STUDENT,
                passwordHash: studentPasswordHash,
                mustChangePassword: true,
                isActive: true,
              },
            });
          }
          studentsProcessed++;

          // Enroll student into Class
          await tx.classEnrollment.upsert({
            where: {
              classId_studentId: {
                classId,
                studentId: student.id,
              },
            },
            create: {
              classId,
              studentId: student.id,
              status: 'ACTIVE',
            },
            update: {
              status: 'ACTIVE',
            },
          });

          // Process Parent 1
          if (parentPhone1) {
            let parent1 = await tx.user.findFirst({
              where: {
                phone: parentPhone1,
                role: Role.PARENT,
              },
            });

            if (!parent1) {
              parent1 = await tx.user.create({
                data: {
                  schoolId,
                  phone: parentPhone1,
                  fullName: parentName1 || `Phụ huynh ${studentName}`,
                  role: Role.PARENT,
                  passwordHash: defaultParentPasswordHash,
                  mustChangePassword: true,
                  isActive: true,
                },
              });
              parentsProcessed++;
            }

            // Link Parent 1 with Student
            await tx.parentStudentLink.upsert({
              where: {
                parentId_studentId: {
                  parentId: parent1.id,
                  studentId: student.id,
                },
              },
              create: {
                parentId: parent1.id,
                studentId: student.id,
                relationship: parentRel1,
              },
              update: {
                relationship: parentRel1,
              },
            });
            linksProcessed++;
          }

          // Process Parent 2 (if present)
          if (parentPhone2) {
            let parent2 = await tx.user.findFirst({
              where: {
                phone: parentPhone2,
                role: Role.PARENT,
              },
            });

            if (!parent2) {
              parent2 = await tx.user.create({
                data: {
                  schoolId,
                  phone: parentPhone2,
                  fullName: parentName2 || `Phụ huynh 2 ${studentName}`,
                  role: Role.PARENT,
                  passwordHash: defaultParentPasswordHash,
                  mustChangePassword: true,
                  isActive: true,
                },
              });
              parentsProcessed++;
            }

            // Link Parent 2 with Student
            await tx.parentStudentLink.upsert({
              where: {
                parentId_studentId: {
                  parentId: parent2.id,
                  studentId: student.id,
                },
              },
              create: {
                parentId: parent2.id,
                studentId: student.id,
                relationship: parentRel2,
              },
              update: {
                relationship: parentRel2,
              },
            });
            linksProcessed++;
          }
        }

        return {
          success: true,
          message: 'Import dữ liệu trường học thành công.',
          summary: {
            classesCount: classMap.size,
            studentsCount: studentsProcessed,
            parentsCount: parentsProcessed,
            linksCount: linksProcessed,
          },
        };
      },
      {
        timeout: 60000, // 60s timeout for large batch operations
      },
    );
  }

  /**
   * Xuất danh sách tài khoản đã cấp phát theo Lớp để GVCN bàn giao
   */
  async exportCredentials(schoolId: string, classId?: string): Promise<Buffer> {
    const wb = XLSX.utils.book_new();

    const whereEnrollment: any = {
      class: { schoolId },
    };
    if (classId) {
      whereEnrollment.classId = classId;
    }

    const enrollments = await this.prisma.classEnrollment.findMany({
      where: whereEnrollment,
      include: {
        class: true,
        student: {
          include: {
            studentLinks: {
              include: { parent: true },
            },
          },
        },
      },
      orderBy: [{ class: { name: 'asc' } }, { student: { fullName: 'asc' } }],
    });

    const exportRows = [
      [
        'STT',
        'Tên Lớp',
        'Đối Tượng',
        'Họ và Tên',
        'Tên Đăng Nhập',
        'Email / SĐT',
        'Mật Khẩu Mặc Định',
        'Yêu Cầu Đổi Mật Khẩu',
      ],
    ];

    let stt = 1;
    for (const item of enrollments) {
      const student = item.student;
      exportRows.push([
        String(stt++),
        item.class.name,
        'Học sinh',
        student.fullName || '',
        student.studentCode || student.email || '',
        student.email || '',
        'Theo ngày sinh ddmmyyyy hoặc Student@123',
        student.mustChangePassword ? 'Có (bắt buộc đổi)' : 'Đã đổi',
      ]);

      // Phụ huynh của học sinh
      for (const link of student.studentLinks) {
        const parent = link.parent;
        exportRows.push([
          String(stt++),
          item.class.name,
          `Phụ huynh (${link.relationship || 'Người giám hộ'})`,
          parent.fullName || '',
          parent.phone || parent.email || '',
          parent.phone || parent.email || '',
          'Parent@123',
          parent.mustChangePassword ? 'Có (bắt buộc đổi)' : 'Đã đổi',
        ]);
      }
    }

    const ws = XLSX.utils.aoa_to_sheet(exportRows);
    XLSX.utils.book_append_sheet(wb, ws, 'Danh_Sach_Tai_Khoan');

    return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  }
}

