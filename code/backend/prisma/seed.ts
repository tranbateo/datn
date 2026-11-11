import { PrismaClient, Role, SchoolLevel } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { SupabaseVectorStore } from '@langchain/community/vectorstores/supabase';
import { createClient } from '@supabase/supabase-js';
import { GDPT_2018_SUBJECTS } from './seed-subjects';
import { CURRICULUM_KNTT_6_7, CurriculumCourseSeed } from './curriculum-kntt-67.data';
import { CURRICULUM_KNTT_8_9 } from './curriculum-kntt-89.data';

const prisma = new PrismaClient();

interface TeacherSeedItem {
  code: string;
  fullName: string;
  email: string;
  phone: string;
  subject: string;
  assignedClasses: string[]; // Danh sách các lớp GVBM dạy (VD: ['Lớp 6A', 'Lớp 6C', 'Lớp 7B', 'Lớp 9C'])
}

async function main() {
  console.log('============================================================');
  console.log('Starting GDPT 2018 (Kết nối tri thức với cuộc sống) Seed...');
  console.log('============================================================');

  const pepper = process.env.PASSWORD_PEPPER || 'DEFAULT_PEPPER';
  const adminPasswordHash = await bcrypt.hash('Admin@123' + pepper, 10);
  const teacherPasswordHash = await bcrypt.hash('Teacher@123' + pepper, 10);
  const studentPasswordHash = await bcrypt.hash('Student@123' + pepper, 10);
  const parentPasswordHash = await bcrypt.hash('Parent@123' + pepper, 10);

  // -------------------------------------------------------------------------
  // 1. Sample School: Trường THCS Nguyễn Trãi
  // -------------------------------------------------------------------------
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
  console.log(`[1/8] School: ${school.name} (${school.code})`);

  // -------------------------------------------------------------------------
  // 2. School Admins
  // -------------------------------------------------------------------------
  const schoolAdmin = await prisma.user.upsert({
    where: { email: 'admin@nguyentrai.edu.vn' },
    update: {
      schoolId: school.id,
      role: Role.ADMIN,
      passwordHash: adminPasswordHash,
      mustChangePassword: false,
      isActive: true,
    },
    create: {
      schoolId: school.id,
      email: 'admin@nguyentrai.edu.vn',
      phone: '0909000111',
      fullName: 'Quản trị viên - THCS Nguyễn Trãi',
      role: Role.ADMIN,
      passwordHash: adminPasswordHash,
      mustChangePassword: false,
      isActive: true,
    },
  });

  await prisma.user.upsert({
    where: { email: 'admin@eduai.vn' },
    update: {
      schoolId: school.id,
      role: Role.ADMIN,
      fullName: 'Quản trị viên - THCS Nguyễn Trãi',
      passwordHash: adminPasswordHash,
      mustChangePassword: false,
      isActive: true,
    },
    create: {
      schoolId: school.id,
      email: 'admin@eduai.vn',
      fullName: 'Quản trị viên - THCS Nguyễn Trãi',
      role: Role.ADMIN,
      passwordHash: adminPasswordHash,
      mustChangePassword: false,
      isActive: true,
    },
  });

  await prisma.user.upsert({
    where: { email: 'schooladmin@nguyentrai.edu.vn' },
    update: {
      schoolId: school.id,
      role: Role.ADMIN,
      fullName: 'Ban Giám Hiệu - THCS Nguyễn Trãi',
      passwordHash: adminPasswordHash,
      mustChangePassword: false,
      isActive: true,
    },
    create: {
      schoolId: school.id,
      email: 'schooladmin@nguyentrai.edu.vn',
      phone: '0909000112',
      fullName: 'Ban Giám Hiệu - THCS Nguyễn Trãi',
      role: Role.ADMIN,
      passwordHash: adminPasswordHash,
      mustChangePassword: false,
      isActive: true,
    },
  });
  console.log(`[2/8] School Admin: ${schoolAdmin.email} / admin@eduai.vn`);

  // -------------------------------------------------------------------------
  // 3. Synchronize & Clean Subjects according to GDPT 2018
  // -------------------------------------------------------------------------
  const subjectMap = new Map<string, string>(); // `${name}_${grade}` -> id
  const validSubjectKeys = new Set<string>();

  for (const group of GDPT_2018_SUBJECTS) {
    for (const grade of group.grades) {
      for (const name of group.names) {
        const subj = await prisma.subject.upsert({
          where: { name_grade: { name, grade } },
          update: {
            description: `Môn ${name} - Khối ${grade} (Chương trình GDPT 2018 - Kết nối tri thức với cuộc sống)`,
          },
          create: {
            name,
            grade,
            description: `Môn ${name} - Khối ${grade} (Chương trình GDPT 2018 - Kết nối tri thức với cuộc sống)`,
          },
        });
        const key = `${name}_${grade}`;
        subjectMap.set(key, subj.id);
        validSubjectKeys.add(key);
      }
    }
  }

  // Migrate legacy/non-GDPT-2018 subjects
  const allSubjects = await prisma.subject.findMany();
  for (const oldSubj of allSubjects) {
    const key = `${oldSubj.name}_${oldSubj.grade}`;
    if (validSubjectKeys.has(key)) continue;

    let targetName = 'Toán';
    const n = oldSubj.name.toLowerCase();
    if (n.includes('toán')) targetName = 'Toán';
    else if (n.includes('văn') || n.includes('tiếng việt')) {
      targetName = oldSubj.grade <= 5 ? 'Tiếng Việt' : 'Ngữ văn';
    } else if (n.includes('anh') || n.includes('ngoại ngữ')) targetName = 'Tiếng Anh';
    else if (n.includes('gdcd') || n.includes('công dân')) targetName = 'Giáo dục công dân';
    else if (n.includes('thể dục') || n.includes('thể chất')) targetName = 'Giáo dục thể chất';
    else if (n.includes('nghệ thuật')) targetName = 'Nghệ thuật';
    else if (n.includes('trải nghiệm')) {
      targetName = oldSubj.grade <= 5 ? 'Hoạt động trải nghiệm' : 'Hoạt động trải nghiệm, hướng nghiệp';
    } else if (oldSubj.grade >= 6 && oldSubj.grade <= 9 && (n.includes('vật') || n.includes('hóa') || n.includes('sinh'))) {
      targetName = 'Khoa học tự nhiên';
    } else if (oldSubj.grade >= 6 && oldSubj.grade <= 9 && (n.includes('sử') || n.includes('địa'))) {
      targetName = 'Lịch sử và Địa lí';
    } else if (n.includes('vật lý')) targetName = 'Vật lí';
    else if (n.includes('địa lý')) targetName = 'Địa lí';

    const targetId = subjectMap.get(`${targetName}_${oldSubj.grade}`);
    if (targetId && targetId !== oldSubj.id) {
      await prisma.course.updateMany({ where: { subjectId: oldSubj.id }, data: { subjectId: targetId } });
      await prisma.quiz.updateMany({ where: { subjectId: oldSubj.id }, data: { subjectId: targetId } });
      await prisma.chatSession.updateMany({ where: { subjectId: oldSubj.id }, data: { subjectId: targetId } });
      await prisma.classSubjectTeacher.deleteMany({ where: { subjectId: oldSubj.id } });
    }
    try {
      await prisma.subject.delete({ where: { id: oldSubj.id } });
    } catch {
      // Ignore if still referenced
    }
  }
  console.log(`[3/8] Synchronized ${subjectMap.size} standard GDPT 2018 subjects (Grades 1-12).`);

  // -------------------------------------------------------------------------
  // 4. Academic Year 2025-2026
  // -------------------------------------------------------------------------
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

  // -------------------------------------------------------------------------
  // 5. Seed Full Roster of 28 Teachers across all 11 GDPT 2018 Subjects
  //    Classified clearly by Subject, Grade, and Class (16 classes: 6A..9D)
  // -------------------------------------------------------------------------
  const teacherSeeds: TeacherSeedItem[] = [
    // --- TỔ TOÁN (4 giáo viên phụ trách 16 lớp 6A..9D, mỗi GV dạy 4 lớp) ---
    {
      code: 'GV01',
      fullName: 'Nguyễn Thị Mai',
      email: 'mai.nguyen@nguyentrai.edu.vn',
      phone: '0912345001',
      subject: 'Toán',
      assignedClasses: ['Lớp 6A', 'Lớp 6C', 'Lớp 7B', 'Lớp 9C'],
    },
    {
      code: 'GV12',
      fullName: 'Bùi Trọng Nghĩa',
      email: 'nghia.bui@nguyentrai.edu.vn',
      phone: '0912345012',
      subject: 'Toán',
      assignedClasses: ['Lớp 6B', 'Lớp 6D', 'Lớp 7A', 'Lớp 8B'],
    },
    {
      code: 'GV13',
      fullName: 'Phan Thị Thu Thủy',
      email: 'thuy.phan@nguyentrai.edu.vn',
      phone: '0912345013',
      subject: 'Toán',
      assignedClasses: ['Lớp 7C', 'Lớp 7D', 'Lớp 8A', 'Lớp 9A'],
    },
    {
      code: 'GV14',
      fullName: 'Đặng Quốc Việt',
      email: 'viet.dang@nguyentrai.edu.vn',
      phone: '0912345014',
      subject: 'Toán',
      assignedClasses: ['Lớp 8C', 'Lớp 8D', 'Lớp 9B', 'Lớp 9D'],
    },

    // --- TỔ NGỮ VĂN (3 giáo viên phụ trách 16 lớp 6A..9D) ---
    {
      code: 'GV02',
      fullName: 'Trần Văn Hùng',
      email: 'hung.tran@nguyentrai.edu.vn',
      phone: '0912345002',
      subject: 'Ngữ văn',
      assignedClasses: ['Lớp 6A', 'Lớp 6B', 'Lớp 7A', 'Lớp 8C', 'Lớp 9A'],
    },
    {
      code: 'GV15',
      fullName: 'Nguyễn Thị Bích Ngọc',
      email: 'bichngoc.nguyen@nguyentrai.edu.vn',
      phone: '0912345015',
      subject: 'Ngữ văn',
      assignedClasses: ['Lớp 6C', 'Lớp 7B', 'Lớp 7C', 'Lớp 8A', 'Lớp 9B'],
    },
    {
      code: 'GV16',
      fullName: 'Lương Thế Vinh',
      email: 'vinh.luong@nguyentrai.edu.vn',
      phone: '0912345016',
      subject: 'Ngữ văn',
      assignedClasses: ['Lớp 6D', 'Lớp 7D', 'Lớp 8B', 'Lớp 8D', 'Lớp 9C', 'Lớp 9D'],
    },

    // --- TỔ TIẾNG ANH (3 giáo viên phụ trách 16 lớp 6A..9D) ---
    {
      code: 'GV03',
      fullName: 'Lê Thị Hương',
      email: 'huong.le@nguyentrai.edu.vn',
      phone: '0912345003',
      subject: 'Tiếng Anh',
      assignedClasses: ['Lớp 6A', 'Lớp 6D', 'Lớp 7A', 'Lớp 8B', 'Lớp 9D'],
    },
    {
      code: 'GV17',
      fullName: 'Phạm Thanh Thảo',
      email: 'thao.pham@nguyentrai.edu.vn',
      phone: '0912345017',
      subject: 'Tiếng Anh',
      assignedClasses: ['Lớp 6B', 'Lớp 6C', 'Lớp 7C', 'Lớp 8A', 'Lớp 9B'],
    },
    {
      code: 'GV18',
      fullName: 'Trương Minh Khôi',
      email: 'khoi.truong@nguyentrai.edu.vn',
      phone: '0912345018',
      subject: 'Tiếng Anh',
      assignedClasses: ['Lớp 7B', 'Lớp 7D', 'Lớp 8C', 'Lớp 8D', 'Lớp 9A', 'Lớp 9C'],
    },

    // --- TỔ KHOA HỌC TỰ NHIÊN (3 giáo viên phụ trách 16 lớp 6A..9D) ---
    {
      code: 'GV04',
      fullName: 'Phạm Minh Tuấn',
      email: 'tuan.pham@nguyentrai.edu.vn',
      phone: '0912345004',
      subject: 'Khoa học tự nhiên',
      assignedClasses: ['Lớp 6A', 'Lớp 7A', 'Lớp 8A', 'Lớp 8C', 'Lớp 9B'],
    },
    {
      code: 'GV19',
      fullName: 'Đào Thị Kim Anh',
      email: 'kimanh.dao@nguyentrai.edu.vn',
      phone: '0912345019',
      subject: 'Khoa học tự nhiên',
      assignedClasses: ['Lớp 6B', 'Lớp 6C', 'Lớp 7B', 'Lớp 7D', 'Lớp 9A'],
    },
    {
      code: 'GV20',
      fullName: 'Nguyễn Hoàng Nam',
      email: 'nam.nguyen@nguyentrai.edu.vn',
      phone: '0912345020',
      subject: 'Khoa học tự nhiên',
      assignedClasses: ['Lớp 6D', 'Lớp 7C', 'Lớp 8B', 'Lớp 8D', 'Lớp 9C', 'Lớp 9D'],
    },

    // --- TỔ LỊCH SỬ VÀ ĐỊA LÍ (3 giáo viên phụ trách 16 lớp 6A..9D) ---
    {
      code: 'GV05',
      fullName: 'Vũ Thị Thanh',
      email: 'thanh.vu@nguyentrai.edu.vn',
      phone: '0912345005',
      subject: 'Lịch sử và Địa lí',
      assignedClasses: ['Lớp 6A', 'Lớp 6B', 'Lớp 7C', 'Lớp 8A', 'Lớp 9A'],
    },
    {
      code: 'GV21',
      fullName: 'Hà Văn Kiên',
      email: 'kien.ha@nguyentrai.edu.vn',
      phone: '0912345021',
      subject: 'Lịch sử và Địa lí',
      assignedClasses: ['Lớp 6C', 'Lớp 7A', 'Lớp 8B', 'Lớp 8C', 'Lớp 9C'],
    },
    {
      code: 'GV22',
      fullName: 'Chu Thị Mai Phương',
      email: 'phuong.chu@nguyentrai.edu.vn',
      phone: '0912345022',
      subject: 'Lịch sử và Địa lí',
      assignedClasses: ['Lớp 6D', 'Lớp 7B', 'Lớp 7D', 'Lớp 8D', 'Lớp 9B', 'Lớp 9D'],
    },

    // --- TỔ GIÁO DỤC CÔNG DÂN (2 giáo viên phụ trách 16 lớp 6A..9D) ---
    {
      code: 'GV06',
      fullName: 'Ngô Thị Hạnh',
      email: 'hanh.ngo@nguyentrai.edu.vn',
      phone: '0912345006',
      subject: 'Giáo dục công dân',
      assignedClasses: ['Lớp 6A', 'Lớp 6B', 'Lớp 7A', 'Lớp 7C', 'Lớp 8A', 'Lớp 8B', 'Lớp 9A', 'Lớp 9C'],
    },
    {
      code: 'GV23',
      fullName: 'Tạ Quang Huy',
      email: 'huy.ta@nguyentrai.edu.vn',
      phone: '0912345023',
      subject: 'Giáo dục công dân',
      assignedClasses: ['Lớp 6C', 'Lớp 6D', 'Lớp 7B', 'Lớp 7D', 'Lớp 8C', 'Lớp 8D', 'Lớp 9B', 'Lớp 9D'],
    },

    // --- TỔ TIN HỌC (2 giáo viên phụ trách 16 lớp 6A..9D) ---
    {
      code: 'GV07',
      fullName: 'Đinh Văn Phong',
      email: 'phong.dinh@nguyentrai.edu.vn',
      phone: '0912345007',
      subject: 'Tin học',
      assignedClasses: ['Lớp 6A', 'Lớp 6C', 'Lớp 7A', 'Lớp 7B', 'Lớp 8A', 'Lớp 8C', 'Lớp 9A', 'Lớp 9B'],
    },
    {
      code: 'GV24',
      fullName: 'Lê Hoàng Yến',
      email: 'yen.le@nguyentrai.edu.vn',
      phone: '0912345024',
      subject: 'Tin học',
      assignedClasses: ['Lớp 6B', 'Lớp 6D', 'Lớp 7C', 'Lớp 7D', 'Lớp 8B', 'Lớp 8D', 'Lớp 9C', 'Lớp 9D'],
    },

    // --- TỔ CÔNG NGHỆ (2 giáo viên phụ trách 16 lớp 6A..9D) ---
    {
      code: 'GV08',
      fullName: 'Trịnh Thị Ngọc',
      email: 'ngoc.trinh@nguyentrai.edu.vn',
      phone: '0912345008',
      subject: 'Công nghệ',
      assignedClasses: ['Lớp 6A', 'Lớp 6D', 'Lớp 7B', 'Lớp 7C', 'Lớp 8A', 'Lớp 8D', 'Lớp 9A', 'Lớp 9C'],
    },
    {
      code: 'GV25',
      fullName: 'Nguyễn Đức Thắng',
      email: 'thang.nguyen@nguyentrai.edu.vn',
      phone: '0912345025',
      subject: 'Công nghệ',
      assignedClasses: ['Lớp 6B', 'Lớp 6C', 'Lớp 7A', 'Lớp 7D', 'Lớp 8B', 'Lớp 8C', 'Lớp 9B', 'Lớp 9D'],
    },

    // --- TỔ GIÁO DỤC THỂ CHẤT (2 giáo viên phụ trách 16 lớp 6A..9D) ---
    {
      code: 'GV09',
      fullName: 'Lý Minh Đức',
      email: 'duc.ly@nguyentrai.edu.vn',
      phone: '0912345009',
      subject: 'Giáo dục thể chất',
      assignedClasses: ['Lớp 6A', 'Lớp 6B', 'Lớp 7B', 'Lớp 7D', 'Lớp 8A', 'Lớp 8C', 'Lớp 9B', 'Lớp 9D'],
    },
    {
      code: 'GV26',
      fullName: 'Võ Thành Long',
      email: 'long.vo@nguyentrai.edu.vn',
      phone: '0912345026',
      subject: 'Giáo dục thể chất',
      assignedClasses: ['Lớp 6C', 'Lớp 6D', 'Lớp 7A', 'Lớp 7C', 'Lớp 8B', 'Lớp 8D', 'Lớp 9A', 'Lớp 9C'],
    },

    // --- TỔ NGHỆ THUẬT (2 giáo viên phụ trách 16 lớp 6A..9D) ---
    {
      code: 'GV10',
      fullName: 'Hoàng Thị Lan',
      email: 'lan.hoang@nguyentrai.edu.vn',
      phone: '0912345010',
      subject: 'Nghệ thuật',
      assignedClasses: ['Lớp 6A', 'Lớp 6C', 'Lớp 7C', 'Lớp 7D', 'Lớp 8B', 'Lớp 8C', 'Lớp 9A', 'Lớp 9D'],
    },
    {
      code: 'GV27',
      fullName: 'Mai Xuân Trường',
      email: 'truong.mai@nguyentrai.edu.vn',
      phone: '0912345027',
      subject: 'Nghệ thuật',
      assignedClasses: ['Lớp 6B', 'Lớp 6D', 'Lớp 7A', 'Lớp 7B', 'Lớp 8A', 'Lớp 8D', 'Lớp 9B', 'Lớp 9C'],
    },

    // --- TỔ HOẠT ĐỘNG TRẢI NGHIỆM, HƯỚNG NGHIỆP (2 giáo viên phụ trách 16 lớp 6A..9D) ---
    {
      code: 'GV11',
      fullName: 'Đỗ Quang Minh',
      email: 'minh.do@nguyentrai.edu.vn',
      phone: '0912345011',
      subject: 'Hoạt động trải nghiệm, hướng nghiệp',
      assignedClasses: ['Lớp 6A', 'Lớp 6B', 'Lớp 7A', 'Lớp 7B', 'Lớp 8C', 'Lớp 8D', 'Lớp 9A', 'Lớp 9B'],
    },
    {
      code: 'GV28',
      fullName: 'Đoàn Thị Thu Hà',
      email: 'ha.doan@nguyentrai.edu.vn',
      phone: '0912345028',
      subject: 'Hoạt động trải nghiệm, hướng nghiệp',
      assignedClasses: ['Lớp 6C', 'Lớp 6D', 'Lớp 7C', 'Lớp 7D', 'Lớp 8A', 'Lớp 8B', 'Lớp 9C', 'Lớp 9D'],
    },
  ];

  const teacherByCode = new Map<
    string,
    { id: string; fullName: string; subject: string; assignedClasses: string[] }
  >();

  for (const t of teacherSeeds) {
    // Check if another user holds this studentCode or email to avoid unique conflicts
    const existingByCode = await prisma.user.findUnique({
      where: { schoolId_studentCode: { schoolId: school.id, studentCode: t.code } },
    });
    const existingByEmail = await prisma.user.findUnique({
      where: { email: t.email },
    });

    let user;
    if (existingByCode && existingByEmail && existingByCode.id !== existingByEmail.id) {
      // Free the studentCode on the old record first
      await prisma.user.update({
        where: { id: existingByCode.id },
        data: { studentCode: null },
      });
    }

    const targetExisting = existingByEmail || existingByCode;
    if (targetExisting) {
      user = await prisma.user.update({
        where: { id: targetExisting.id },
        data: {
          schoolId: school.id,
          studentCode: t.code,
          email: t.email,
          phone: t.phone,
          fullName: t.fullName,
          role: Role.TEACHER,
          passwordHash: teacherPasswordHash,
          mustChangePassword: false,
          isActive: true,
        },
      });
    } else {
      user = await prisma.user.create({
        data: {
          schoolId: school.id,
          studentCode: t.code,
          email: t.email,
          phone: t.phone,
          fullName: t.fullName,
          role: Role.TEACHER,
          passwordHash: teacherPasswordHash,
          mustChangePassword: false,
          isActive: true,
        },
      });
    }

    teacherByCode.set(t.code, {
      id: user.id,
      fullName: t.fullName,
      subject: t.subject,
      assignedClasses: t.assignedClasses,
    });
  }
  console.log(`[4/8] Seeded ${teacherByCode.size} Teachers across all 11 GDPT 2018 Middle School subjects.`);

  // -------------------------------------------------------------------------
  // 6. Seed 16 Classes (4 classes per grade: A, B, C, D for Grades 6, 7, 8, 9)
  //    & Assign Homeroom Teachers (GVCN) + Subject Teachers (GVBM)
  // -------------------------------------------------------------------------
  const classConfigs = [
    // Khối 6 (4 lớp: 6A, 6B, 6C, 6D)
    { name: 'Lớp 6A', grade: 6, inviteCode: 'NT-6A-2026', homeroomCode: 'GV01' },
    { name: 'Lớp 6B', grade: 6, inviteCode: 'NT-6B-2026', homeroomCode: 'GV02' },
    { name: 'Lớp 6C', grade: 6, inviteCode: 'NT-6C-2026', homeroomCode: 'GV15' },
    { name: 'Lớp 6D', grade: 6, inviteCode: 'NT-6D-2026', homeroomCode: 'GV12' },

    // Khối 7 (4 lớp: 7A, 7B, 7C, 7D)
    { name: 'Lớp 7A', grade: 7, inviteCode: 'NT-7A-2026', homeroomCode: 'GV03' },
    { name: 'Lớp 7B', grade: 7, inviteCode: 'NT-7B-2026', homeroomCode: 'GV19' },
    { name: 'Lớp 7C', grade: 7, inviteCode: 'NT-7C-2026', homeroomCode: 'GV17' },
    { name: 'Lớp 7D', grade: 7, inviteCode: 'NT-7D-2026', homeroomCode: 'GV13' },

    // Khối 8 (4 lớp: 8A, 8B, 8C, 8D)
    { name: 'Lớp 8A', grade: 8, inviteCode: 'NT-8A-2026', homeroomCode: 'GV04' },
    { name: 'Lớp 8B', grade: 8, inviteCode: 'NT-8B-2026', homeroomCode: 'GV16' },
    { name: 'Lớp 8C', grade: 8, inviteCode: 'NT-8C-2026', homeroomCode: 'GV21' },
    { name: 'Lớp 8D', grade: 8, inviteCode: 'NT-8D-2026', homeroomCode: 'GV22' },

    // Khối 9 (4 lớp: 9A, 9B, 9C, 9D)
    { name: 'Lớp 9A', grade: 9, inviteCode: 'NT-9A-2026', homeroomCode: 'GV05' },
    { name: 'Lớp 9B', grade: 9, inviteCode: 'NT-9B-2026', homeroomCode: 'GV14' },
    { name: 'Lớp 9C', grade: 9, inviteCode: 'NT-9C-2026', homeroomCode: 'GV18' },
    { name: 'Lớp 9D', grade: 9, inviteCode: 'NT-9D-2026', homeroomCode: 'GV20' },
  ];

  // Clean up any non-standard classes in this school
  const validClassNames = classConfigs.map((c) => c.name);
  await prisma.class.deleteMany({
    where: {
      schoolId: school.id,
      name: { notIn: validClassNames },
    },
  });

  const classByName = new Map<string, { id: string; grade: number }>();

  for (const cfg of classConfigs) {
    const homeroom = teacherByCode.get(cfg.homeroomCode)!;
    const cls = await prisma.class.upsert({
      where: {
        schoolId_academicYearId_name: {
          schoolId: school.id,
          academicYearId: academicYear.id,
          name: cfg.name,
        },
      },
      update: {
        grade: cfg.grade,
        homeroomTeacherId: homeroom.id,
        inviteCode: cfg.inviteCode,
        status: 'ACTIVE',
      },
      create: {
        schoolId: school.id,
        academicYearId: academicYear.id,
        name: cfg.name,
        grade: cfg.grade,
        homeroomTeacherId: homeroom.id,
        inviteCode: cfg.inviteCode,
        status: 'ACTIVE',
      },
    });
    classByName.set(cfg.name, { id: cls.id, grade: cfg.grade });
  }

  // Clear old ClassSubjectTeacher records for this school's classes and assign according to teacherSeeds matrix
  const allClassIds = Array.from(classByName.values()).map((c) => c.id);
  await prisma.classSubjectTeacher.deleteMany({
    where: { classId: { in: allClassIds } },
  });

  let totalSubjectAssignments = 0;
  for (const t of teacherSeeds) {
    const teacher = teacherByCode.get(t.code);
    if (!teacher) continue;

    for (const className of t.assignedClasses) {
      const cls = classByName.get(className);
      if (!cls) continue;
      const subjId = subjectMap.get(`${t.subject}_${cls.grade}`);
      if (!subjId) continue;

      await prisma.classSubjectTeacher.upsert({
        where: { classId_subjectId: { classId: cls.id, subjectId: subjId } },
        update: { teacherId: teacher.id, status: 'ACTIVE' },
        create: {
          classId: cls.id,
          subjectId: subjId,
          teacherId: teacher.id,
          status: 'ACTIVE',
        },
      });
      totalSubjectAssignments++;
    }
  }
  console.log(
    `[5/8] Seeded ${classByName.size} Classes (6A..6D, 7A..7D, 8A..8D, 9A..9D) and ${totalSubjectAssignments} GVBM subject-class assignments.`,
  );

  // -------------------------------------------------------------------------
  // 7. Seed Students across all 16 Classes (6A..9D) & Parent Links
  // -------------------------------------------------------------------------
  const studentSeeds = [
    // Khối 6: 6A, 6B, 6C, 6D
    { code: 'HS0001', fullName: 'Nguyễn Gia Bảo', email: 'hs0001@nguyentrai.edu.vn', grade: 6, className: 'Lớp 6A', mustChangePassword: false, xp: 650, level: 4 },
    { code: 'HS0002', fullName: 'Trần Ngọc Ánh', email: 'hs0002@nguyentrai.edu.vn', grade: 6, className: 'Lớp 6A', mustChangePassword: false, xp: 520, level: 3 },
    { code: 'HS0003', fullName: 'Lê Hoàng Khang', email: 'hs0003@nguyentrai.edu.vn', grade: 6, className: 'Lớp 6A', mustChangePassword: false, xp: 480, level: 3 },
    { code: 'HS0004', fullName: 'Phạm Phương Thảo', email: 'hs0004@nguyentrai.edu.vn', grade: 6, className: 'Lớp 6B', mustChangePassword: false, xp: 510, level: 3 },
    { code: 'HS0005', fullName: 'Hoàng Minh Đức', email: 'hs0005@nguyentrai.edu.vn', grade: 6, className: 'Lớp 6B', mustChangePassword: false, xp: 430, level: 3 },
    { code: 'HS0006', fullName: 'Nguyễn Gia Huy', email: 'hs0006@nguyentrai.edu.vn', grade: 6, className: 'Lớp 6B', mustChangePassword: true, xp: 450, level: 3 },
    { code: 'HS0007', fullName: 'Vũ Hà My', email: 'hs0007@nguyentrai.edu.vn', grade: 6, className: 'Lớp 6C', mustChangePassword: false, xp: 610, level: 4 },
    { code: 'HS0008', fullName: 'Đặng Tuấn Kiệt', email: 'hs0008@nguyentrai.edu.vn', grade: 6, className: 'Lớp 6C', mustChangePassword: false, xp: 540, level: 3 },
    { code: 'HS0009', fullName: 'Bùi Thanh Trúc', email: 'hs0009@nguyentrai.edu.vn', grade: 6, className: 'Lớp 6D', mustChangePassword: false, xp: 490, level: 3 },
    { code: 'HS0010', fullName: 'Đỗ Quốc Anh', email: 'hs0010@nguyentrai.edu.vn', grade: 6, className: 'Lớp 6D', mustChangePassword: false, xp: 560, level: 3 },

    // Khối 7: 7A, 7B, 7C, 7D
    { code: 'HS0011', fullName: 'Trần Minh Quân', email: 'hs0011@nguyentrai.edu.vn', grade: 7, className: 'Lớp 7A', mustChangePassword: false, xp: 820, level: 5 },
    { code: 'HS0012', fullName: 'Nguyễn Bảo Ngọc', email: 'hs0012@nguyentrai.edu.vn', grade: 7, className: 'Lớp 7A', mustChangePassword: false, xp: 750, level: 4 },
    { code: 'HS0013', fullName: 'Lê Tuấn Anh', email: 'hs0013@nguyentrai.edu.vn', grade: 7, className: 'Lớp 7B', mustChangePassword: false, xp: 790, level: 4 },
    { code: 'HS0014', fullName: 'Phạm Khánh Linh', email: 'hs0014@nguyentrai.edu.vn', grade: 7, className: 'Lớp 7B', mustChangePassword: false, xp: 680, level: 4 },
    { code: 'HS0015', fullName: 'Hoàng Gia Hân', email: 'hs0015@nguyentrai.edu.vn', grade: 7, className: 'Lớp 7B', mustChangePassword: false, xp: 720, level: 4 },
    { code: 'HS0016', fullName: 'Vũ Minh Triết', email: 'hs0016@nguyentrai.edu.vn', grade: 7, className: 'Lớp 7C', mustChangePassword: false, xp: 640, level: 4 },
    { code: 'HS0017', fullName: 'Đặng Ngọc Diệp', email: 'hs0017@nguyentrai.edu.vn', grade: 7, className: 'Lớp 7C', mustChangePassword: false, xp: 710, level: 4 },
    { code: 'HS0018', fullName: 'Bùi Hải Đăng', email: 'hs0018@nguyentrai.edu.vn', grade: 7, className: 'Lớp 7D', mustChangePassword: false, xp: 690, level: 4 },
    { code: 'HS0019', fullName: 'Đỗ Thu Trang', email: 'hs0019@nguyentrai.edu.vn', grade: 7, className: 'Lớp 7D', mustChangePassword: false, xp: 740, level: 4 },
    { code: 'HS0020', fullName: 'Ngô Quang Vinh', email: 'hs0020@nguyentrai.edu.vn', grade: 7, className: 'Lớp 7D', mustChangePassword: false, xp: 660, level: 4 },

    // Khối 8: 8A, 8B, 8C, 8D
    { code: 'HS0021', fullName: 'Lê Khánh Huyền', email: 'hs0021@nguyentrai.edu.vn', grade: 8, className: 'Lớp 8A', mustChangePassword: false, xp: 940, level: 6 },
    { code: 'HS0022', fullName: 'Nguyễn Minh Khôi', email: 'hs0022@nguyentrai.edu.vn', grade: 8, className: 'Lớp 8A', mustChangePassword: false, xp: 880, level: 5 },
    { code: 'HS0023', fullName: 'Trần Thảo Tiên', email: 'hs0023@nguyentrai.edu.vn', grade: 8, className: 'Lớp 8B', mustChangePassword: false, xp: 850, level: 5 },
    { code: 'HS0024', fullName: 'Phạm Đức Duy', email: 'hs0024@nguyentrai.edu.vn', grade: 8, className: 'Lớp 8B', mustChangePassword: false, xp: 910, level: 5 },
    { code: 'HS0025', fullName: 'Hoàng Thanh Mai', email: 'hs0025@nguyentrai.edu.vn', grade: 8, className: 'Lớp 8C', mustChangePassword: false, xp: 870, level: 5 },
    { code: 'HS0026', fullName: 'Vũ Quốc Bảo', email: 'hs0026@nguyentrai.edu.vn', grade: 8, className: 'Lớp 8C', mustChangePassword: false, xp: 830, level: 5 },
    { code: 'HS0027', fullName: 'Đặng Minh Châu', email: 'hs0027@nguyentrai.edu.vn', grade: 8, className: 'Lớp 8C', mustChangePassword: false, xp: 890, level: 5 },
    { code: 'HS0028', fullName: 'Bùi Trọng Nhân', email: 'hs0028@nguyentrai.edu.vn', grade: 8, className: 'Lớp 8D', mustChangePassword: false, xp: 810, level: 5 },
    { code: 'HS0029', fullName: 'Đỗ Lan Hương', email: 'hs0029@nguyentrai.edu.vn', grade: 8, className: 'Lớp 8D', mustChangePassword: false, xp: 860, level: 5 },
    { code: 'HS0030', fullName: 'Dương Tuấn Dũng', email: 'hs0030@nguyentrai.edu.vn', grade: 8, className: 'Lớp 8D', mustChangePassword: false, xp: 840, level: 5 },

    // Khối 9: 9A, 9B, 9C, 9D
    { code: 'HS0031', fullName: 'Phạm Hoàng Long', email: 'hs0031@nguyentrai.edu.vn', grade: 9, className: 'Lớp 9A', mustChangePassword: false, xp: 1250, level: 7 },
    { code: 'HS0032', fullName: 'Nguyễn Ngọc Trâm', email: 'hs0032@nguyentrai.edu.vn', grade: 9, className: 'Lớp 9A', mustChangePassword: false, xp: 1120, level: 6 },
    { code: 'HS0033', fullName: 'Trần Đăng Khoa', email: 'hs0033@nguyentrai.edu.vn', grade: 9, className: 'Lớp 9B', mustChangePassword: false, xp: 1080, level: 6 },
    { code: 'HS0034', fullName: 'Lê Minh Thư', email: 'hs0034@nguyentrai.edu.vn', grade: 9, className: 'Lớp 9B', mustChangePassword: false, xp: 1150, level: 6 },
    { code: 'HS0035', fullName: 'Hoàng Việt Hoàng', email: 'hs0035@nguyentrai.edu.vn', grade: 9, className: 'Lớp 9C', mustChangePassword: false, xp: 1190, level: 6 },
    { code: 'HS0036', fullName: 'Vũ Quỳnh Anh', email: 'hs0036@nguyentrai.edu.vn', grade: 9, className: 'Lớp 9C', mustChangePassword: false, xp: 1210, level: 7 },
    { code: 'HS0037', fullName: 'Đặng Thiên Phúc', email: 'hs0037@nguyentrai.edu.vn', grade: 9, className: 'Lớp 9C', mustChangePassword: false, xp: 1050, level: 6 },
    { code: 'HS0038', fullName: 'Bùi Phương Uyên', email: 'hs0038@nguyentrai.edu.vn', grade: 9, className: 'Lớp 9D', mustChangePassword: false, xp: 1090, level: 6 },
    { code: 'HS0039', fullName: 'Đỗ Thành Đạt', email: 'hs0039@nguyentrai.edu.vn', grade: 9, className: 'Lớp 9D', mustChangePassword: false, xp: 1140, level: 6 },
    { code: 'HS0040', fullName: 'Lý Hoài An', email: 'hs0040@nguyentrai.edu.vn', grade: 9, className: 'Lớp 9D', mustChangePassword: false, xp: 1170, level: 6 },
  ];

  const studentsByGrade = new Map<number, string[]>(); // grade -> studentIds[]
  const linkedStudentIds: string[] = [];

  for (const s of studentSeeds) {
    const existingByCode = await prisma.user.findUnique({
      where: { schoolId_studentCode: { schoolId: school.id, studentCode: s.code } },
    });
    const existingByEmail = await prisma.user.findUnique({
      where: { email: s.email },
    });

    if (existingByCode && existingByEmail && existingByCode.id !== existingByEmail.id) {
      await prisma.user.update({
        where: { id: existingByCode.id },
        data: { studentCode: null },
      });
    }

    const targetStu = existingByCode || existingByEmail;
    const stu = targetStu
      ? await prisma.user.update({
          where: { id: targetStu.id },
          data: {
            schoolId: school.id,
            studentCode: s.code,
            fullName: s.fullName,
            email: s.email,
            grade: s.grade,
            role: Role.STUDENT,
            passwordHash: studentPasswordHash,
            mustChangePassword: s.mustChangePassword,
            isActive: true,
          },
        })
      : await prisma.user.create({
          data: {
            schoolId: school.id,
            studentCode: s.code,
            email: s.email,
            fullName: s.fullName,
            role: Role.STUDENT,
            grade: s.grade,
            passwordHash: studentPasswordHash,
            mustChangePassword: s.mustChangePassword,
            isActive: true,
          },
        });

    const cls = classByName.get(s.className)!;
    // Ensure student is enrolled in exactly their assigned official class
    await prisma.classEnrollment.deleteMany({
      where: { studentId: stu.id, classId: { not: cls.id } },
    });
    await prisma.classEnrollment.upsert({
      where: { classId_studentId: { classId: cls.id, studentId: stu.id } },
      update: { status: 'ACTIVE' },
      create: { classId: cls.id, studentId: stu.id, status: 'ACTIVE' },
    });

    await prisma.gamificationProfile.upsert({
      where: { userId: stu.id },
      update: { lifetimeXp: s.xp, spendableXp: s.xp, level: s.level },
      create: {
        userId: stu.id,
        lifetimeXp: s.xp,
        spendableXp: s.xp,
        level: s.level,
        currentStreak: 5,
        longestStreak: 10,
      },
    });

    const list = studentsByGrade.get(s.grade) || [];
    list.push(stu.id);
    studentsByGrade.set(s.grade, list);

    if (s.code === 'HS0001' || s.code === 'HS0006') {
      linkedStudentIds.push(stu.id);
    }
  }

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

  for (const stuId of linkedStudentIds) {
    await prisma.parentStudentLink.upsert({
      where: { parentId_studentId: { parentId: parent1.id, studentId: stuId } },
      update: { relationship: 'Bố' },
      create: {
        parentId: parent1.id,
        studentId: stuId,
        relationship: 'Bố',
      },
    });
  }
  console.log(`[6/8] Seeded ${studentSeeds.length} Students across all 16 classes (6A..9D) & linked Parent account.`);

  // -------------------------------------------------------------------------
  // 8. Seed All 3 Linked Parts for Grades 6, 7, 8, 9 (Kết nối tri thức với cuộc sống):
  //    Part A: Courses & Lessons
  //    Part B: Documents (Prisma metadata) + Vector Store Chunks
  //    Part C: Quizzes & QuizQuestions
  // -------------------------------------------------------------------------
  const allCurriculum: CurriculumCourseSeed[] = [
    ...CURRICULUM_KNTT_6_7,
    ...CURRICULUM_KNTT_8_9,
  ];

  // Clean up legacy empty courses from previous seeds
  const validCourseTitles = new Set(allCurriculum.map((c) => c.title));
  await prisma.course.deleteMany({
    where: {
      schoolId: school.id,
      title: { notIn: Array.from(validCourseTitles) },
    },
  });

  const vectorDocsToEmbed: {
    pageContent: string;
    metadata: Record<string, any>;
  }[] = [];

  let totalCourses = 0;
  let totalLessons = 0;
  let totalDocuments = 0;
  let totalQuizzes = 0;
  let totalQuestions = 0;

  for (const item of allCurriculum) {
    const subjectId = subjectMap.get(`${item.subjectName}_${item.grade}`);
    // Pick a teacher who teaches this subject in this grade (preferring item.teacherCode if they teach this grade)
    const defaultTeacher = teacherByCode.get(item.teacherCode);
    const defaultTeachesGrade = defaultTeacher?.assignedClasses.some(
      (cName) => classByName.get(cName)?.grade === item.grade,
    );
    const matchingTeacherSeed = teacherSeeds.find(
      (t) =>
        t.subject === item.subjectName &&
        t.assignedClasses.some((cName) => classByName.get(cName)?.grade === item.grade),
    );
    const teacher = defaultTeachesGrade
      ? defaultTeacher
      : matchingTeacherSeed
        ? teacherByCode.get(matchingTeacherSeed.code)
        : defaultTeacher;

    if (!subjectId || !teacher) {
      console.warn(`Skipping ${item.title}: missing subject or teacher`);
      continue;
    }

    // --- PART A: Course & Lessons ---
    let course = await prisma.course.findFirst({
      where: {
        schoolId: school.id,
        title: item.title,
      },
    });

    if (course) {
      course = await prisma.course.update({
        where: { id: course.id },
        data: {
          description: item.description,
          grade: item.grade,
          subjectId,
          teacherId: teacher.id,
        },
      });
    } else {
      course = await prisma.course.create({
        data: {
          schoolId: school.id,
          title: item.title,
          description: item.description,
          grade: item.grade,
          subjectId,
          teacherId: teacher.id,
        },
      });
    }
    totalCourses++;

    // Enroll all students of this grade into the course
    const gradeStudentIds = studentsByGrade.get(item.grade) || [];
    for (const stuId of gradeStudentIds) {
      await prisma.enrollment.upsert({
        where: { userId_courseId: { userId: stuId, courseId: course.id } },
        update: {},
        create: { userId: stuId, courseId: course.id },
      });
    }

    // Replace lessons for this course to ensure clean, deterministic ordering
    await prisma.lesson.deleteMany({ where: { courseId: course.id } });
    for (const lesson of item.lessons) {
      await prisma.lesson.create({
        data: {
          courseId: course.id,
          title: lesson.title,
          order: lesson.order,
          content: lesson.content,
        },
      });
      totalLessons++;
    }

    // --- PART B: Documents & RAG Chunks ---
    for (const docSeed of item.documents) {
      const existingDoc = await prisma.document.findFirst({
        where: { courseId: course.id, fileName: docSeed.fileName },
      });
      const createdDoc = existingDoc
        ? await prisma.document.update({
            where: { id: existingDoc.id },
            data: {
              schoolId: school.id,
              type: 'application/pdf',
              size: docSeed.size,
              status: 'Embedded',
            },
          })
        : await prisma.document.create({
            data: {
              schoolId: school.id,
              courseId: course.id,
              fileName: docSeed.fileName,
              type: 'application/pdf',
              size: docSeed.size,
              status: 'Embedded',
            },
          });
      totalDocuments++;

      for (const chunk of docSeed.chunks) {
        vectorDocsToEmbed.push({
          pageContent: chunk.content,
          metadata: {
            courseId: course.id,
            documentId: createdDoc.id,
            schoolId: school.id,
            subjectId,
            subjectName: item.subjectName,
            grade: item.grade,
            fileName: docSeed.fileName,
            loc: { pageNumber: chunk.page },
          },
        });
      }
    }

    // --- PART C: Quiz & QuizQuestions ---
    await prisma.quiz.deleteMany({
      where: {
        schoolId: school.id,
        subjectId,
        grade: item.grade,
      },
    });

    await prisma.quiz.create({
      data: {
        schoolId: school.id,
        subjectId,
        grade: item.grade,
        title: item.quiz.title,
        description: item.quiz.description,
        duration: item.quiz.duration,
        status: 'PUBLISHED',
        questions: {
          create: item.quiz.questions.map((q) => ({
            content: q.content,
            options: q.options,
            correctOption: q.correctOption,
            explanation: q.explanation,
          })),
        },
      },
    });
    totalQuizzes++;
    totalQuestions += item.quiz.questions.length;
  }

  // Remove any stale teacher accounts in this school not in GV01..GV28 (now safe since Courses are reassigned)
  const validTeacherIds = Array.from(teacherByCode.values()).map((t) => t.id);
  await prisma.user.deleteMany({
    where: {
      schoolId: school.id,
      role: Role.TEACHER,
      id: { notIn: validTeacherIds },
    },
  });

  console.log(
    `[7/8] Seeded Prisma DB: ${totalCourses} Courses, ${totalLessons} Lessons, ${totalDocuments} Documents, ${totalQuizzes} Quizzes (${totalQuestions} Questions).`,
  );

  // -------------------------------------------------------------------------
  // 9. Embed RAG Documents into Supabase pgvector (`public.documents`)
  // -------------------------------------------------------------------------
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_PRIVATE_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;

  if (
    supabaseUrl &&
    supabaseKey &&
    geminiKey &&
    !supabaseUrl.includes('placeholder') &&
    !geminiKey.includes('placeholder')
  ) {
    try {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS public.documents (
          id bigserial PRIMARY KEY,
          content text,
          metadata jsonb,
          embedding vector(3072)
        );
      `);

      const existingVecCountRes = await prisma.$queryRawUnsafe<{ count: bigint }[]>(
        `SELECT COUNT(*)::bigint as count FROM public.documents WHERE metadata->>'schoolId' = $1`,
        school.id,
      );
      const existingVecCount = Number(existingVecCountRes?.[0]?.count || 0);

      if (existingVecCount >= vectorDocsToEmbed.length && process.env.FORCE_REEMBED !== 'true') {
        console.log(
          `[8/8] Supabase Vector Store already contains ${existingVecCount} embedded curriculum chunks (skipping re-embed; set FORCE_REEMBED=true to regenerate).`,
        );
      } else {
        await prisma.$executeRawUnsafe(
          `DELETE FROM public.documents WHERE metadata->>'schoolId' = $1`,
          school.id,
        );

        const client = createClient(supabaseUrl, supabaseKey);
        const embeddings = new GoogleGenerativeAIEmbeddings({
          apiKey: geminiKey,
          model: process.env.GEMINI_EMBEDDING_MODEL || 'gemini-embedding-001',
        });

        const vectorStore = new SupabaseVectorStore(embeddings, {
          client,
          tableName: 'documents',
          queryName: 'match_documents',
        });

        console.log(
          `[8/8] Generating embeddings and uploading ${vectorDocsToEmbed.length} curriculum chunks to Supabase Vector Store...`,
        );

        const batchSize = 15;
        for (let i = 0; i < vectorDocsToEmbed.length; i += batchSize) {
          const batch = vectorDocsToEmbed.slice(i, i + batchSize);
          await vectorStore.addDocuments(batch);
          console.log(
            `   -> Embedded ${Math.min(i + batchSize, vectorDocsToEmbed.length)}/${vectorDocsToEmbed.length} chunks`,
          );
        }

        console.log('[8/8] Successfully populated Supabase Vector Store (public.documents)!');
      }
    } catch (vecErr) {
      console.error('Warning: Could not populate vector embeddings:', vecErr);
    }
  } else {
    console.log(
      '[8/8] Skipping vector embedding upload (SUPABASE_URL / GEMINI_API_KEY not configured).',
    );
  }

  console.log('============================================================');
  console.log('GDPT 2018 (Kết nối tri thức - Khối 6, 7, 8, 9) Seed Complete!');
  console.log('============================================================');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
