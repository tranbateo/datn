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

    // Sheet 1: Lớp & Giáo viên (hỗ trợ cả GVCN và GVBM)
    const classesData = [
      [
        'Mã Lớp',
        'Tên Lớp',
        'Khối',
        'Vai Trò',
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
        'GVCN',
        'GV01',
        'Nguyễn Thị Mai',
        'mai.nguyen@nguyentrai.edu.vn',
        '0912345001',
        'Toán',
      ],
      [
        '6A',
        'Lớp 6A',
        6,
        'GVBM',
        'GV02',
        'Trần Văn Hùng',
        'hung.tran@nguyentrai.edu.vn',
        '0912345002',
        'Ngữ văn',
      ],
      [
        '6B',
        'Lớp 6B',
        6,
        'GVCN',
        'GV02',
        'Trần Văn Hùng',
        'hung.tran@nguyentrai.edu.vn',
        '0912345002',
        'Ngữ văn',
      ],
      [
        '6B',
        'Lớp 6B',
        6,
        'GVBM',
        'GV01',
        'Nguyễn Thị Mai',
        'mai.nguyen@nguyentrai.edu.vn',
        '0912345001',
        'Toán',
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
        'HS0001',
        'Nguyễn Gia Bảo',
        '6A',
        '15/05/2014',
        'Nam',
        '',
        'Nguyễn Văn Tuấn',
        '0901000001',
        'Bố',
        'Lê Thị Thu',
        '0902000001',
        'Mẹ',
      ],
      [
        'HS0002',
        'Trần Ngọc Linh',
        '6A',
        '20/08/2014',
        'Nữ',
        '',
        'Trần Văn Bình',
        '0903100001',
        'Bố',
        '',
        '',
        '',
      ],
      [
        'HS0006',
        'Nguyễn Gia Huy',
        '6B',
        '10/11/2014',
        'Nam',
        '',
        'Nguyễn Văn Tuấn',
        '0901000001',
        'Bố',
        'Lê Thị Thu',
        '0902000001',
        'Mẹ',
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

    const sheetClassesName =
      wb.SheetNames.find(
        (name) =>
          name.toLowerCase().includes('lop') ||
          name.toLowerCase().includes('class'),
      ) || wb.SheetNames[0];

    const sheetStudentsName =
      wb.SheetNames.find(
        (name) =>
          name.toLowerCase().includes('hocsinh') ||
          name.toLowerCase().includes('student'),
      ) || wb.SheetNames[1];

    if (!sheetClassesName || !sheetStudentsName) {
      errors.push(
        'File Excel phải có ít nhất 2 sheet: Lớp & Giáo viên và Học sinh & Phụ huynh.',
      );
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

    const classCodesInFile = new Set<string>();
    const teacherIdentifiersInFile = new Set<string>();

    classesRows.forEach((row, idx) => {
      const rowNum = idx + 2;
      const classCode = String(row['Mã Lớp'] || '').trim();
      const grade = parseInt(row['Khối'], 10);
      const teacherCode = String(row['Mã GVCN'] || row['Mã GV'] || '').trim();
      const teacherName = String(
        row['Họ Tên GVCN'] || row['Họ Tên GV'] || '',
      ).trim();
      const teacherEmail = String(
        row['Email GVCN'] || row['Email GV'] || '',
      ).trim();

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
        warnings.push(
          `Sheet [${sheetClassesName}], Dòng ${rowNum}: Lớp ${classCode} chưa có tên Giáo viên.`,
        );
      }

      if (teacherCode || teacherEmail) {
        teacherIdentifiersInFile.add(teacherCode || teacherEmail);
      }
    });

    const studentCodesInFile = new Set<string>();
    const parentPhonesInFile = new Map<string, string[]>();
    let newStudentsCount = 0;
    let existingStudentsCount = 0;

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
      const parentPhone1 = String(row['SĐT Phụ Huynh 1'] || '').trim();

      if (!studentCode) {
        errors.push(
          `Sheet [${sheetStudentsName}], Dòng ${rowNum}: Thiếu Mã Học Sinh.`,
        );
      } else if (studentCodesInFile.has(studentCode)) {
        errors.push(
          `Sheet [${sheetStudentsName}], Dòng ${rowNum}: Trùng lặp Mã Học Sinh [${studentCode}] trong file.`,
        );
      } else {
        studentCodesInFile.add(studentCode);
      }

      if (!studentName) {
        errors.push(
          `Sheet [${sheetStudentsName}], Dòng ${rowNum}: Thiếu Họ Tên Học Sinh.`,
        );
      }

      if (!classCode) {
        errors.push(
          `Sheet [${sheetStudentsName}], Dòng ${rowNum}: Học sinh [${studentName}] chưa có Mã Lớp.`,
        );
      } else if (!classCodesInFile.has(classCode)) {
        errors.push(
          `Sheet [${sheetStudentsName}], Dòng ${rowNum}: Mã Lớp [${classCode}] của học sinh [${studentName}] không tồn tại trong sheet Lớp học.`,
        );
      }

      if (!parentPhone1) {
        warnings.push(
          `Sheet [${sheetStudentsName}], Dòng ${rowNum}: Học sinh [${studentName}] chưa có SĐT Phụ huynh.`,
        );
      } else {
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
        teachersCount: teacherIdentifiersInFile.size,
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
    const sheetClassesName =
      wb.SheetNames.find(
        (name) =>
          name.toLowerCase().includes('lop') ||
          name.toLowerCase().includes('class'),
      ) || wb.SheetNames[0];

    const sheetStudentsName =
      wb.SheetNames.find(
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

        // 2. Xử lý Giáo viên (GVCN & GVBM) & Lớp học (Sheet 1)
        const classMap = new Map<
          string,
          { id: string; name: string; grade: number; courseIds: string[] }
        >();

        for (const row of classesRows) {
          const classCode = String(row['Mã Lớp'] || '').trim();
          const className = String(row['Tên Lớp'] || classCode).trim();
          const grade = parseInt(row['Khối'], 10);
          const roleType = String(row['Vai Trò'] || 'GVCN')
            .trim()
            .toUpperCase();
          const teacherCode = String(
            row['Mã GVCN'] || row['Mã GV'] || '',
          ).trim();
          const teacherName = String(
            row['Họ Tên GVCN'] || row['Họ Tên GV'] || '',
          ).trim();
          const teacherEmail =
            String(row['Email GVCN'] || row['Email GV'] || '').trim() || null;
          const teacherPhone =
            String(row['SĐT GVCN'] || row['SĐT GV'] || '').trim() || null;
          const subjectName = String(row['Môn Phụ Trách'] || '').trim();

          let teacherId: string | null = null;

          if (teacherName && (teacherEmail || teacherPhone || teacherCode)) {
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
              teacherId = existingTeacher.id;
              await tx.user.update({
                where: { id: existingTeacher.id },
                data: {
                  fullName: teacherName,
                  email: teacherEmail || existingTeacher.email,
                  phone: teacherPhone || existingTeacher.phone,
                  studentCode: teacherCode || existingTeacher.studentCode,
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
              teacherId = newTeacher.id;
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

          const isHomeroom = roleType === 'GVCN';

          if (classRecord) {
            classRecord = await tx.class.update({
              where: { id: classRecord.id },
              data: {
                grade,
                homeroomTeacherId:
                  isHomeroom && teacherId
                    ? teacherId
                    : classRecord.homeroomTeacherId,
              },
            });
          } else {
            classRecord = await tx.class.create({
              data: {
                schoolId,
                academicYearId: academicYear.id,
                name: className,
                grade,
                homeroomTeacherId: isHomeroom ? teacherId : null,
                inviteCode: `${classCode}-${academicYear.name}`,
                status: 'ACTIVE',
              },
            });
          }

          const existingClassEntry = classMap.get(classCode) || {
            id: classRecord.id,
            name: classRecord.name,
            grade: classRecord.grade,
            courseIds: [],
          };

          // Nếu có Môn Phụ Trách và Giáo viên -> Tạo Subject, ClassSubjectTeacher (GVBM) và Course tương ứng
          if (subjectName && teacherId) {
            const subject = await tx.subject.upsert({
              where: { name_grade: { name: subjectName, grade } },
              update: {},
              create: {
                name: subjectName,
                grade,
                description: `Môn ${subjectName} Khối ${grade}`,
              },
            });

            await tx.classSubjectTeacher.upsert({
              where: {
                classId_subjectId: {
                  classId: classRecord.id,
                  subjectId: subject.id,
                },
              },
              update: {
                teacherId,
                status: 'ACTIVE',
              },
              create: {
                classId: classRecord.id,
                subjectId: subject.id,
                teacherId,
                status: 'ACTIVE',
              },
            });

            // Đồng bộ Course cho lớp-môn để dùng chung với tài liệu RAG & bài tập
            const courseTitle = `${subjectName} - ${className}`;
            let course = await tx.course.findFirst({
              where: {
                schoolId,
                title: courseTitle,
              },
            });
            if (!course) {
              course = await tx.course.create({
                data: {
                  schoolId,
                  title: courseTitle,
                  description: `Học phần ${subjectName} dành cho ${className}`,
                  grade,
                  subjectId: subject.id,
                  teacherId,
                },
              });
            } else {
              course = await tx.course.update({
                where: { id: course.id },
                data: { teacherId, grade, subjectId: subject.id },
              });
            }

            if (!existingClassEntry.courseIds.includes(course.id)) {
              existingClassEntry.courseIds.push(course.id);
            }
          }

          classMap.set(classCode, existingClassEntry);
          classMap.set(className, existingClassEntry);
        }

        // 3. Xử lý Học sinh & Phụ huynh (Sheet 2)
        let studentsProcessed = 0;
        let parentsProcessed = 0;
        let linksProcessed = 0;

        for (const row of studentsRows) {
          const studentCode = String(row['Mã Học Sinh'] || '').trim();
          const studentName = String(row['Họ Tên Học Sinh'] || '').trim();
          const classCode = String(row['Mã Lớp'] || '').trim();
          const birthDateStr = String(
            row['Ngày Sinh (dd/mm/yyyy)'] || '',
          ).trim();
          const email = String(row['Email Học Sinh'] || '').trim() || null;

          const parentName1 = String(row['Họ Tên Phụ Huynh 1'] || '').trim();
          const parentPhone1 = String(row['SĐT Phụ Huynh 1'] || '').trim();
          const parentRel1 = String(row['Quan Hệ PH 1'] || 'Phụ huynh').trim();

          const parentName2 = String(row['Họ Tên Phụ Huynh 2'] || '').trim();
          const parentPhone2 = String(row['SĐT Phụ Huynh 2'] || '').trim();
          const parentRel2 = String(row['Quan Hệ PH 2'] || 'Phụ huynh').trim();

          const classInfo = classMap.get(classCode);
          if (!classInfo) continue;

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
                grade: classInfo.grade,
              },
            });
          } else {
            student = await tx.user.create({
              data: {
                schoolId,
                studentCode,
                fullName: studentName,
                email,
                grade: classInfo.grade,
                role: Role.STUDENT,
                passwordHash: studentPasswordHash,
                mustChangePassword: true,
                isActive: true,
              },
            });
          }
          studentsProcessed++;

          // Đảm bảo học sinh có GamificationProfile
          await tx.gamificationProfile.upsert({
            where: { userId: student.id },
            update: {},
            create: {
              userId: student.id,
              lifetimeXp: 0,
              spendableXp: 0,
              level: 1,
            },
          });

          // Enroll student into Class
          await tx.classEnrollment.upsert({
            where: {
              classId_studentId: {
                classId: classInfo.id,
                studentId: student.id,
              },
            },
            create: {
              classId: classInfo.id,
              studentId: student.id,
              status: 'ACTIVE',
            },
            update: {
              status: 'ACTIVE',
            },
          });

          // Đồng bộ Enrollment vào các Course bộ môn của lớp
          for (const courseId of classInfo.courseIds) {
            await tx.enrollment.upsert({
              where: {
                userId_courseId: {
                  userId: student.id,
                  courseId,
                },
              },
              create: {
                userId: student.id,
                courseId,
              },
              update: {},
            });
          }

          // Process Parent 1 (scoped by schoolId)
          if (parentPhone1) {
            let parent1 = await tx.user.findFirst({
              where: {
                schoolId,
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

          // Process Parent 2 (scoped by schoolId)
          if (parentPhone2) {
            let parent2 = await tx.user.findFirst({
              where: {
                schoolId,
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

        const uniqueClassIds = new Set(
          Array.from(classMap.values()).map((c) => c.id),
        );

        return {
          success: true,
          message: 'Import dữ liệu trường học thành công.',
          summary: {
            classesCount: uniqueClassIds.size,
            studentsCount: studentsProcessed,
            parentsCount: parentsProcessed,
            linksCount: linksProcessed,
          },
        };
      },
      {
        timeout: 60000,
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
        'Tên Đăng Nhập (Mã HS / SĐT)',
        'Email / SĐT',
        'Mật Khẩu Mặc Định',
        'Trạng Thái Đổi Mật Khẩu',
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
        'Ngày sinh ddmmyyyy hoặc Student@123',
        student.mustChangePassword ? 'Chưa đổi (Bắt buộc đổi)' : 'Đã đổi',
      ]);

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
          parent.mustChangePassword ? 'Chưa đổi (Bắt buộc đổi)' : 'Đã đổi',
        ]);
      }
    }

    const ws = XLSX.utils.aoa_to_sheet(exportRows);
    XLSX.utils.book_append_sheet(wb, ws, 'HS_Va_PhuHuynh');

    // Sheet 2: Tài khoản Giáo viên
    const teachers = await this.prisma.user.findMany({
      where: { schoolId, role: Role.TEACHER },
      include: {
        homeroomClasses: true,
        subjectClasses: { include: { class: true, subject: true } },
      },
      orderBy: { fullName: 'asc' },
    });

    const teacherRows = [
      [
        'STT',
        'Mã GV',
        'Họ và Tên',
        'Email Đăng Nhập',
        'Số Điện Thoại',
        'Lớp Chủ Nhiệm',
        'Lớp - Môn Giảng Dạy',
        'Mật Khẩu Mặc Định',
        'Trạng Thái Đổi Mật Khẩu',
      ],
    ];

    teachers.forEach((t, index) => {
      const homeroomNames = t.homeroomClasses.map((c) => c.name).join(', ');
      const subjectAssignments = t.subjectClasses
        .map((sc) => `${sc.subject.name} (${sc.class.name})`)
        .join(', ');
      teacherRows.push([
        String(index + 1),
        t.studentCode || '',
        t.fullName || '',
        t.email || '',
        t.phone || '',
        homeroomNames || 'Không',
        subjectAssignments || 'Chưa phân công',
        'Teacher@123',
        t.mustChangePassword ? 'Chưa đổi (Bắt buộc đổi)' : 'Đã đổi',
      ]);
    });

    const wsTeachers = XLSX.utils.aoa_to_sheet(teacherRows);
    XLSX.utils.book_append_sheet(wb, wsTeachers, 'Giao_Vien');

    return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  }
}
