import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const pepper =
    process.env.PASSWORD_PEPPER || 'A_VERY_SECRET_PEPPER_FOR_AITUTOR';
  const password = 'password123';
  const passwordHash = await bcrypt.hash(password + pepper, 10);

  // 1. Create Student
  const student = await prisma.user.upsert({
    where: { email: 'student@eduai.com' },
    update: { passwordHash, isActive: true },
    create: {
      email: 'student@eduai.com',
      fullName: 'Học sinh Demo',
      role: Role.STUDENT,
      passwordHash,
      isActive: true,
      grade: 10,
    },
  });

  // Gamification profile for student
  await prisma.gamificationProfile.upsert({
    where: { userId: student.id },
    update: {},
    create: { userId: student.id, xp: 500, level: 2 },
  });

  // 2. Create Teacher
  await prisma.user.upsert({
    where: { email: 'teacher@eduai.com' },
    update: { passwordHash, isActive: true },
    create: {
      email: 'teacher@eduai.com',
      fullName: 'Giáo viên Demo',
      role: Role.TEACHER,
      passwordHash,
      isActive: true,
    },
  });

  // 3. Create Parent
  const parent = await prisma.user.upsert({
    where: { email: 'parent@eduai.com' },
    update: { passwordHash, isActive: true },
    create: {
      email: 'parent@eduai.com',
      fullName: 'Phụ huynh Demo',
      role: Role.PARENT,
      passwordHash,
      isActive: true,
    },
  });

  // Link Parent to Student
  await prisma.parentStudentLink.upsert({
    where: {
      parentId_studentId: { parentId: parent.id, studentId: student.id },
    },
    update: {},
    create: {
      parentId: parent.id,
      studentId: student.id,
      linkCode: 'DEMO-LINK-123',
    },
  });

  console.log('Created accounts successfully!');
  console.log('Student: student@eduai.com / password123');
  console.log('Teacher: teacher@eduai.com / password123');
  console.log('Parent: parent@eduai.com / password123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
