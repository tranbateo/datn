import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Xóa toàn bộ dữ liệu cũ
  await prisma.user.deleteMany({});
  
  const pepper = process.env.PASSWORD_PEPPER || 'A_VERY_SECRET_PEPPER_FOR_AITUTOR';
  const password = '123456';
  const passwordHash = await bcrypt.hash(password + pepper, 10);

  // 1. Create Student
  const student = await prisma.user.create({
    data: {
      email: 'student@eduai.com',
      fullName: 'Học sinh Demo',
      role: Role.STUDENT,
      passwordHash,
      isActive: true,
      grade: 10,
    },
  });

  // Gamification profile for student
  await prisma.gamificationProfile.create({
    data: { userId: student.id, lifetimeXp: 500, spendableXp: 500, level: 2 },
  });

  // 2. Create Teacher
  await prisma.user.create({
    data: {
      email: 'teacher@eduai.com',
      fullName: 'Giáo viên Demo',
      role: Role.TEACHER,
      passwordHash,
      isActive: true,
    },
  });

  // 3. Create Parent
  const parent = await prisma.user.create({
    data: {
      email: 'parent@eduai.com',
      fullName: 'Phụ huynh Demo',
      role: Role.PARENT,
      passwordHash,
      isActive: true,
    },
  });

  // Link Parent to Student
  await prisma.parentStudentLink.create({
    data: {
      parentId: parent.id,
      studentId: student.id,
      linkCode: 'DEMO-LINK-123',
    },
  });

  // 4. Create Admin
  await prisma.user.create({
    data: {
      email: 'admin@eduai.com',
      fullName: 'Quản trị viên',
      role: Role.ADMIN,
      passwordHash,
      isActive: true,
    },
  });

  console.log('Đã xóa user cũ và tạo 4 tài khoản mới thành công!');
  console.log('Student: student@eduai.com / 123456');
  console.log('Teacher: teacher@eduai.com / 123456');
  console.log('Parent: parent@eduai.com / 123456');
  console.log('Admin: admin@eduai.com / 123456');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
