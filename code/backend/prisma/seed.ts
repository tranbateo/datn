import { PrismaClient, Role, SchoolLevel } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { SupabaseVectorStore } from '@langchain/community/vectorstores/supabase';
import { createClient } from '@supabase/supabase-js';
import { GDPT_2018_SUBJECTS } from './seed-subjects';
import { CURRICULUM_KNTT_6_7, CurriculumCourseSeed } from './curriculum-kntt-67.data';
import { CURRICULUM_KNTT_8_9 } from './curriculum-kntt-89.data';

const prisma = new PrismaClient();

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

  // Migrate legacy/non-GDPT-2018 subjects (e.g. "Toán học" -> "Toán", "GDCD" -> "Giáo dục công dân", etc.)
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
  // 5. Seed Teachers for GDPT 2018 Subjects (Grades 6, 7, 8, 9)
  // -------------------------------------------------------------------------
  const teacherSeeds = [
    { code: 'GV01', fullName: 'Nguyễn Thị Mai', email: 'mai.nguyen@nguyentrai.edu.vn', phone: '0912345001', subject: 'Toán' },
    { code: 'GV02', fullName: 'Trần Văn Hùng', email: 'hung.tran@nguyentrai.edu.vn', phone: '0912345002', subject: 'Ngữ văn' },
    { code: 'GV03', fullName: 'Lê Thị Hương', email: 'huong.le@nguyentrai.edu.vn', phone: '0912345003', subject: 'Tiếng Anh' },
    { code: 'GV04', fullName: 'Phạm Minh Tuấn', email: 'tuan.pham@nguyentrai.edu.vn', phone: '0912345004', subject: 'Khoa học tự nhiên' },
    { code: 'GV05', fullName: 'Vũ Thị Thanh', email: 'thanh.vu@nguyentrai.edu.vn', phone: '0912345005', subject: 'Lịch sử và Địa lí' },
    { code: 'GV06', fullName: 'Ngô Thị Hạnh', email: 'hanh.ngo@nguyentrai.edu.vn', phone: '0912345006', subject: 'Giáo dục công dân' },
    { code: 'GV07', fullName: 'Đinh Văn Phong', email: 'phong.dinh@nguyentrai.edu.vn', phone: '0912345007', subject: 'Tin học' },
    { code: 'GV08', fullName: 'Trịnh Thị Ngọc', email: 'ngoc.trinh@nguyentrai.edu.vn', phone: '0912345008', subject: 'Công nghệ' },
    { code: 'GV09', fullName: 'Lý Minh Đức', email: 'duc.ly@nguyentrai.edu.vn', phone: '0912345009', subject: 'Giáo dục thể chất' },
    { code: 'GV10', fullName: 'Hoàng Thị Lan', email: 'lan.hoang@nguyentrai.edu.vn', phone: '0912345010', subject: 'Nghệ thuật' },
    { code: 'GV11', fullName: 'Đỗ Quang Minh', email: 'minh.do@nguyentrai.edu.vn', phone: '0912345011', subject: 'Hoạt động trải nghiệm, hướng nghiệp' },
  ];

  const teacherByCode = new Map<string, { id: string; fullName: string; subject: string }>();
  for (const t of teacherSeeds) {
    const user = await prisma.user.upsert({
      where: { email: t.email },
      update: {
        schoolId: school.id,
        studentCode: t.code,
        phone: t.phone,
        fullName: t.fullName,
        role: Role.TEACHER,
        passwordHash: teacherPasswordHash,
        mustChangePassword: false,
        isActive: true,
      },
      create: {
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
    teacherByCode.set(t.code, { id: user.id, fullName: t.fullName, subject: t.subject });
  }
  console.log(`[4/8] Seeded ${teacherByCode.size} Teachers across all GDPT 2018 Middle School subjects.`);

  // -------------------------------------------------------------------------
  // 6. Seed Classes for Grades 6, 7, 8, 9 & Assign Subject Teachers
  // -------------------------------------------------------------------------
  const classConfigs = [
    { name: 'Lớp 6A', grade: 6, inviteCode: 'NT-6A-2026', homeroomCode: 'GV01' },
    { name: 'Lớp 6B', grade: 6, inviteCode: 'NT-6B-2026', homeroomCode: 'GV02' },
    { name: 'Lớp 7A', grade: 7, inviteCode: 'NT-7A-2026', homeroomCode: 'GV03' },
    { name: 'Lớp 8A', grade: 8, inviteCode: 'NT-8A-2026', homeroomCode: 'GV04' },
    { name: 'Lớp 9A', grade: 9, inviteCode: 'NT-9A-2026', homeroomCode: 'GV05' },
  ];

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

    // Assign all 11 GDPT 2018 subject teachers to this class
    for (const t of teacherSeeds) {
      const subjId = subjectMap.get(`${t.subject}_${cfg.grade}`);
      const teacher = teacherByCode.get(t.code);
      if (subjId && teacher) {
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
      }
    }
  }
  console.log(`[5/8] Seeded ${classByName.size} Classes (Grades 6, 7, 8, 9) and assigned GDPT 2018 subject teachers.`);

  // -------------------------------------------------------------------------
  // 7. Seed Students (Grades 6, 7, 8, 9) & Parent Links
  // -------------------------------------------------------------------------
  const studentSeeds = [
    { code: 'HS0001', fullName: 'Nguyễn Gia Bảo', email: 'hs0001@nguyentrai.edu.vn', grade: 6, className: 'Lớp 6A', mustChangePassword: false, xp: 650, level: 4 },
    { code: 'HS0006', fullName: 'Nguyễn Gia Huy', email: 'hs0006@nguyentrai.edu.vn', grade: 6, className: 'Lớp 6B', mustChangePassword: true, xp: 450, level: 3 },
    { code: 'HS0011', fullName: 'Trần Minh Quân', email: 'hs0011@nguyentrai.edu.vn', grade: 7, className: 'Lớp 7A', mustChangePassword: false, xp: 820, level: 5 },
    { code: 'HS0021', fullName: 'Lê Khánh Huyền', email: 'hs0021@nguyentrai.edu.vn', grade: 8, className: 'Lớp 8A', mustChangePassword: false, xp: 940, level: 6 },
    { code: 'HS0031', fullName: 'Phạm Hoàng Long', email: 'hs0031@nguyentrai.edu.vn', grade: 9, className: 'Lớp 9A', mustChangePassword: false, xp: 1250, level: 7 },
  ];

  const studentsByGrade = new Map<number, string[]>(); // grade -> studentIds[]
  const linkedStudentIds: string[] = [];

  for (const s of studentSeeds) {
    const stu = await prisma.user.upsert({
      where: { schoolId_studentCode: { schoolId: school.id, studentCode: s.code } },
      update: {
        fullName: s.fullName,
        email: s.email,
        grade: s.grade,
        passwordHash: studentPasswordHash,
        mustChangePassword: s.mustChangePassword,
        isActive: true,
      },
      create: {
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
  console.log(`[6/8] Seeded Students across Grades 6, 7, 8, 9 & linked Parent account.`);

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

  // Clean up legacy empty courses from previous seeds (e.g., "Toán học - Lớp 6A", "Ngữ văn - Lớp 6A")
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
    const teacher = teacherByCode.get(item.teacherCode);
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
    await prisma.document.deleteMany({ where: { courseId: course.id } });
    for (const docSeed of item.documents) {
      const createdDoc = await prisma.document.create({
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
    // Remove previous quizzes of this subject & grade in this school to avoid duplicates
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

      // Remove existing vector chunks for this school before inserting fresh chunks
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

      // Batch in groups of 15 to avoid rate limits
      const batchSize = 15;
      for (let i = 0; i < vectorDocsToEmbed.length; i += batchSize) {
        const batch = vectorDocsToEmbed.slice(i, i + batchSize);
        await vectorStore.addDocuments(batch);
        console.log(
          `   -> Embedded ${Math.min(i + batchSize, vectorDocsToEmbed.length)}/${vectorDocsToEmbed.length} chunks`,
        );
      }

      console.log('[8/8] Successfully populated Supabase Vector Store (public.documents)!');
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
