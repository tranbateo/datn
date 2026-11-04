import { PrismaClient, Role, SchoolLevel } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting comprehensive B2B School seed...');

  const pepper = process.env.PASSWORD_PEPPER || 'DEFAULT_PEPPER';
  const adminPasswordHash = await bcrypt.hash('Admin@123' + pepper, 10);
  const teacherPasswordHash = await bcrypt.hash('Teacher@123' + pepper, 10);
  const studentPasswordHash = await bcrypt.hash('Student@123' + pepper, 10);
  const parentPasswordHash = await bcrypt.hash('Parent@123' + pepper, 10);

  // 1. System Admin
  const sysAdmin = await prisma.user.upsert({
    where: { email: 'admin@eduai.vn' },
    update: {
      role: Role.ADMIN,
      passwordHash: adminPasswordHash,
      mustChangePassword: false,
      isActive: true,
    },
    create: {
      email: 'admin@eduai.vn',
      fullName: 'Quản trị Hệ thống EduAI',
      role: Role.ADMIN,
      passwordHash: adminPasswordHash,
      mustChangePassword: false,
      isActive: true,
    },
  });
  console.log(`✅ System Admin: ${sysAdmin.email} (Password: Admin@123)`);

  // 2. Sample School: THCS Nguyễn Trãi
  const school = await prisma.school.upsert({
    where: { code: 'THCSNT' },
    update: {
      name: 'Trường THCS Nguyễn Trãi',
      level: SchoolLevel.MIDDLE,
      isActive: true,
      licenseKey: 'LIC-THCSNT-2026-PRO',
      licenseExpiresAt: new Date('2027-12-31T23:59:59Z'),
      maxUsers: 1000,
      aiTokenQuota: 10000000,
    },
    create: {
      name: 'Trường THCS Nguyễn Trãi',
      code: 'THCSNT',
      level: SchoolLevel.MIDDLE,
      isActive: true,
      licenseKey: 'LIC-THCSNT-2026-PRO',
      licenseExpiresAt: new Date('2027-12-31T23:59:59Z'),
      maxUsers: 1000,
      aiTokenQuota: 10000000,
      aiTokensUsed: 125000,
      aiProvider: 'SYSTEM',
    },
  });
  console.log(`✅ School: ${school.name} (${school.code})`);

  // 3. School Admin for THCS Nguyễn Trãi
  const schoolAdmin = await prisma.user.upsert({
    where: { email: 'schooladmin@nguyentrai.edu.vn' },
    update: {
      schoolId: school.id,
      role: Role.SCHOOL_ADMIN,
      passwordHash: adminPasswordHash,
      mustChangePassword: false,
      isActive: true,
    },
    create: {
      schoolId: school.id,
      email: 'schooladmin@nguyentrai.edu.vn',
      phone: '0909000111',
      fullName: 'Ban Giám Hiệu - THCS Nguyễn Trãi',
      role: Role.SCHOOL_ADMIN,
      passwordHash: adminPasswordHash,
      mustChangePassword: false,
      isActive: true,
    },
  });
  console.log(`✅ School Admin: ${schoolAdmin.email} (Password: Admin@123)`);

  // 4. Seed Standard Subjects for Grades 6 - 12
  const subjectNames = [
    'Toán học',
    'Ngữ văn',
    'Tiếng Anh',
    'Vật lý',
    'Hóa học',
    'Sinh học',
    'Lịch sử',
    'Địa lý',
    'GDCD',
    'Tin học',
    'Công nghệ',
    'Thể dục',
  ];

  const subjectMap = new Map<string, string>(); // `${name}_${grade}` -> id
  for (const grade of [6, 7, 8, 9, 10, 11, 12]) {
    for (const name of subjectNames) {
      const subj = await prisma.subject.upsert({
        where: { name_grade: { name, grade } },
        update: {},
        create: {
          name,
          grade,
          description: `Môn ${name} Khối ${grade}`,
        },
      });
      subjectMap.set(`${name}_${grade}`, subj.id);
    }
  }
  console.log(`✅ Seeded ${subjectMap.size} subjects across grades 6-12`);

  // 5. Academic Year 2025-2026
  const academicYear = await prisma.academicYear.upsert({
    where: {
      schoolId_name: {
        schoolId: school.id,
        name: '2025-2026',
      },
    },
    update: { isCurrent: true },
    create: {
      schoolId: school.id,
      name: '2025-2026',
      startDate: new Date('2025-09-05T00:00:00Z'),
      endDate: new Date('2026-05-31T23:59:59Z'),
      isCurrent: true,
    },
  });

  // 6. Seed Teachers (GVCN & GVBM)
  const teacherMai = await prisma.user.upsert({
    where: { email: 'mai.nguyen@nguyentrai.edu.vn' },
    update: {
      schoolId: school.id,
      studentCode: 'GV01',
      phone: '0912345001',
      fullName: 'Nguyễn Thị Mai',
      role: Role.TEACHER,
      passwordHash: teacherPasswordHash,
      mustChangePassword: false,
      isActive: true,
    },
    create: {
      schoolId: school.id,
      studentCode: 'GV01',
      email: 'mai.nguyen@nguyentrai.edu.vn',
      phone: '0912345001',
      fullName: 'Nguyễn Thị Mai',
      role: Role.TEACHER,
      passwordHash: teacherPasswordHash,
      mustChangePassword: false,
      isActive: true,
    },
  });

  const teacherHung = await prisma.user.upsert({
    where: { email: 'hung.tran@nguyentrai.edu.vn' },
    update: {
      schoolId: school.id,
      studentCode: 'GV02',
      phone: '0912345002',
      fullName: 'Trần Văn Hùng',
      role: Role.TEACHER,
      passwordHash: teacherPasswordHash,
      mustChangePassword: false,
      isActive: true,
    },
    create: {
      schoolId: school.id,
      studentCode: 'GV02',
      email: 'hung.tran@nguyentrai.edu.vn',
      phone: '0912345002',
      fullName: 'Trần Văn Hùng',
      role: Role.TEACHER,
      passwordHash: teacherPasswordHash,
      mustChangePassword: false,
      isActive: true,
    },
  });

  // 7. Seed Classes 6A & 6B
  const class6A = await prisma.class.upsert({
    where: {
      schoolId_academicYearId_name: {
        schoolId: school.id,
        academicYearId: academicYear.id,
        name: 'Lớp 6A',
      },
    },
    update: {
      grade: 6,
      homeroomTeacherId: teacherMai.id,
    },
    create: {
      schoolId: school.id,
      academicYearId: academicYear.id,
      name: 'Lớp 6A',
      grade: 6,
      homeroomTeacherId: teacherMai.id,
      inviteCode: 'NT-6A-2026',
      status: 'ACTIVE',
    },
  });

  const class6B = await prisma.class.upsert({
    where: {
      schoolId_academicYearId_name: {
        schoolId: school.id,
        academicYearId: academicYear.id,
        name: 'Lớp 6B',
      },
    },
    update: {
      grade: 6,
      homeroomTeacherId: teacherHung.id,
    },
    create: {
      schoolId: school.id,
      academicYearId: academicYear.id,
      name: 'Lớp 6B',
      grade: 6,
      homeroomTeacherId: teacherHung.id,
      inviteCode: 'NT-6B-2026',
      status: 'ACTIVE',
    },
  });

  // Assign GVBM to 6A & 6B
  const math6Id = subjectMap.get('Toán học_6')!;
  const lit6Id = subjectMap.get('Ngữ văn_6')!;

  await prisma.classSubjectTeacher.upsert({
    where: { classId_subjectId: { classId: class6A.id, subjectId: math6Id } },
    update: { teacherId: teacherMai.id },
    create: { classId: class6A.id, subjectId: math6Id, teacherId: teacherMai.id },
  });
  await prisma.classSubjectTeacher.upsert({
    where: { classId_subjectId: { classId: class6A.id, subjectId: lit6Id } },
    update: { teacherId: teacherHung.id },
    create: { classId: class6A.id, subjectId: lit6Id, teacherId: teacherHung.id },
  });
  await prisma.classSubjectTeacher.upsert({
    where: { classId_subjectId: { classId: class6B.id, subjectId: math6Id } },
    update: { teacherId: teacherMai.id },
    create: { classId: class6B.id, subjectId: math6Id, teacherId: teacherMai.id },
  });
  await prisma.classSubjectTeacher.upsert({
    where: { classId_subjectId: { classId: class6B.id, subjectId: lit6Id } },
    update: { teacherId: teacherHung.id },
    create: { classId: class6B.id, subjectId: lit6Id, teacherId: teacherHung.id },
  });

  // Create corresponding Courses for 6A
  let courseMath6A = await prisma.course.findFirst({
    where: { schoolId: school.id, title: 'Toán học - Lớp 6A' },
  });
  if (!courseMath6A) {
    courseMath6A = await prisma.course.create({
      data: {
        schoolId: school.id,
        title: 'Toán học - Lớp 6A',
        description: 'Môn Toán học Lớp 6A - GV Nguyễn Thị Mai',
        grade: 6,
        subjectId: math6Id,
        teacherId: teacherMai.id,
      },
    });
  }

  let courseLit6A = await prisma.course.findFirst({
    where: { schoolId: school.id, title: 'Ngữ văn - Lớp 6A' },
  });
  if (!courseLit6A) {
    courseLit6A = await prisma.course.create({
      data: {
        schoolId: school.id,
        title: 'Ngữ văn - Lớp 6A',
        description: 'Môn Ngữ văn Lớp 6A - GV Trần Văn Hùng',
        grade: 6,
        subjectId: lit6Id,
        teacherId: teacherHung.id,
      },
    });
  }

  // 8. Seed Students & Parents (with Multi-child Link)
  const student1 = await prisma.user.upsert({
    where: { schoolId_studentCode: { schoolId: school.id, studentCode: 'HS0001' } },
    update: {
      fullName: 'Nguyễn Gia Bảo',
      grade: 6,
      passwordHash: studentPasswordHash,
      mustChangePassword: false,
    },
    create: {
      schoolId: school.id,
      studentCode: 'HS0001',
      email: 'hs0001@nguyentrai.edu.vn',
      fullName: 'Nguyễn Gia Bảo',
      role: Role.STUDENT,
      grade: 6,
      passwordHash: studentPasswordHash,
      mustChangePassword: false,
      isActive: true,
    },
  });

  const student2 = await prisma.user.upsert({
    where: { schoolId_studentCode: { schoolId: school.id, studentCode: 'HS0006' } },
    update: {
      fullName: 'Nguyễn Gia Huy',
      grade: 6,
      passwordHash: studentPasswordHash,
      mustChangePassword: false,
    },
    create: {
      schoolId: school.id,
      studentCode: 'HS0006',
      email: 'hs0006@nguyentrai.edu.vn',
      fullName: 'Nguyễn Gia Huy',
      role: Role.STUDENT,
      grade: 6,
      passwordHash: studentPasswordHash,
      mustChangePassword: true, // Để test luồng bắt buộc đổi mật khẩu lần đầu
      isActive: true,
    },
  });

  // Class Enrollments & Course Enrollments & Gamification Profiles
  for (const [stu, cls] of [
    [student1, class6A],
    [student2, class6B],
  ] as const) {
    await prisma.classEnrollment.upsert({
      where: { classId_studentId: { classId: cls.id, studentId: stu.id } },
      update: { status: 'ACTIVE' },
      create: { classId: cls.id, studentId: stu.id, status: 'ACTIVE' },
    });

    await prisma.enrollment.upsert({
      where: { userId_courseId: { userId: stu.id, courseId: courseMath6A.id } },
      update: {},
      create: { userId: stu.id, courseId: courseMath6A.id },
    });

    await prisma.gamificationProfile.upsert({
      where: { userId: stu.id },
      update: {},
      create: {
        userId: stu.id,
        lifetimeXp: 450,
        spendableXp: 450,
        level: 3,
        currentStreak: 4,
        longestStreak: 7,
      },
    });
  }

  // Parent with 2 children (HS0001 in 6A & HS0006 in 6B)
  let parent1 = await prisma.user.findFirst({
    where: { schoolId: school.id, phone: '0901000001', role: Role.PARENT },
  });
  if (!parent1) {
    parent1 = await prisma.user.create({
      data: {
        schoolId: school.id,
        phone: '0901000001',
        email: 'phuhuynh.tuan@gmail.com',
        fullName: 'Nguyễn Văn Tuấn',
        role: Role.PARENT,
        passwordHash: parentPasswordHash,
        mustChangePassword: false,
        isActive: true,
      },
    });
  }

  for (const stu of [student1, student2]) {
    await prisma.parentStudentLink.upsert({
      where: { parentId_studentId: { parentId: parent1.id, studentId: stu.id } },
      update: { relationship: 'Bố' },
      create: {
        parentId: parent1.id,
        studentId: stu.id,
        relationship: 'Bố',
      },
    });
  }

  // 9. Seed Sample Quiz for Grade 6 Math
  const existingQuiz = await prisma.quiz.findFirst({
    where: { schoolId: school.id, subjectId: math6Id },
  });
  if (!existingQuiz) {
    await prisma.quiz.create({
      data: {
        schoolId: school.id,
        title: 'Kiểm tra 15 phút: Tập hợp các số tự nhiên (Toán 6)',
        description: 'Bài kiểm tra kiến thức Chương 1 Toán lớp 6.',
        grade: 6,
        subjectId: math6Id,
        duration: 15,
        status: 'PUBLISHED',
        questions: {
          create: [
            {
              content: 'Tập hợp các số tự nhiên khác 0 được ký hiệu là gì?',
              options: JSON.stringify(['N*', 'N', 'Z', 'Q']),
              correctOption: 'N*',
              explanation: 'N* là tập hợp các số tự nhiên khác 0: {1; 2; 3; ...}.',
            },
            {
              content: 'Kết quả của phép tính 2^3 . 2^2 dưới dạng một lũy thừa là:',
              options: JSON.stringify(['2^5', '2^6', '4^5', '4^6']),
              correctOption: '2^5',
              explanation: 'Khi nhân hai lũy thừa cùng cơ số, ta giữ nguyên cơ số và cộng các số mũ: 2^(3+2) = 2^5.',
            },
            {
              content: 'Số nào sau đây chia hết cho cả 2, 3, 5 và 9?',
              options: JSON.stringify(['90', '60', '45', '120']),
              correctOption: '90',
              explanation: 'Số chia hết cho 2 và 5 tận cùng là 0. Tổng các chữ số của 90 là 9 chia hết cho cả 3 và 9.',
            },
          ],
        },
      },
    });
  }

  console.log('🎉 Comprehensive B2B School Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
