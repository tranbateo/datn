import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // 1. Seed Subjects
  const mathSubject = await prisma.subject.upsert({
    where: { name_grade: { name: 'Toán học', grade: 12 } },
    update: {},
    create: {
      name: 'Toán học',
      grade: 12,
      description: 'Môn Toán lớp 12',
    },
  });

  await prisma.subject.upsert({
    where: { name_grade: { name: 'Vật lý', grade: 12 } },
    update: {},
    create: {
      name: 'Vật lý',
      grade: 12,
      description: 'Môn Vật lý lớp 12',
    },
  });

  // 2. Seed Quizzes
  // Check if quiz exists to avoid duplicates
  const existingQuizzes = await prisma.quiz.findMany({
    where: { subjectId: mathSubject.id },
  });

  if (existingQuizzes.length === 0) {
    const mathQuiz = await prisma.quiz.create({
      data: {
        title: 'Ôn tập Đạo hàm và Ứng dụng',
        description: 'Bài kiểm tra 15 phút ôn tập chương 1 Giải tích 12.',
        grade: 12,
        subjectId: mathSubject.id,
        duration: 15,
        questions: {
          create: [
            {
              content: 'Đạo hàm của hàm số y = x^3 - 3x là:',
              options: JSON.stringify([
                "y' = 3x^2 - 3",
                "y' = 3x^2 + 3",
                "y' = x^2 - 3",
                "y' = 3x - 3",
              ]),
              correctOption: "y' = 3x^2 - 3",
              explanation: 'Áp dụng công thức đạo hàm cơ bản.',
            },
            {
              content: 'Hàm số y = x^3 - 3x nghịch biến trên khoảng nào?',
              options: JSON.stringify([
                '(-1; 1)',
                '(-\\infty; -1)',
                '(1; +\\infty)',
                '(-1; +\\infty)',
              ]),
              correctOption: '(-1; 1)',
              explanation: "y' < 0 khi 3x^2 - 3 < 0 => x thuộc (-1; 1).",
            },
            {
              content: 'Điểm cực đại của đồ thị hàm số y = x^3 - 3x là:',
              options: JSON.stringify([
                '(-1; 2)',
                '(1; -2)',
                '(0; 0)',
                '(-1; -2)',
              ]),
              correctOption: '(-1; 2)',
              explanation:
                "y' = 0 => x = ±1. y''(-1) = -6 < 0 => x = -1 là điểm cực đại. y(-1) = 2.",
            },
          ],
        },
      },
    });
    console.log(`Created Math Quiz: ${mathQuiz.title}`);
  }

  // 3. Seed Dummy Users & Gamification
  const testUsers = [
    { email: 'student1@test.com', name: 'Nguyễn Văn A', xp: 1250, streak: 5 },
    { email: 'student2@test.com', name: 'Trần Thị B', xp: 850, streak: 3 },
    { email: 'student3@test.com', name: 'Lê Văn C', xp: 2100, streak: 12 },
    { email: 'student4@test.com', name: 'Phạm Thị D', xp: 420, streak: 1 },
    { email: 'student5@test.com', name: 'Hoàng Văn E', xp: 3500, streak: 20 },
  ];

  for (const tUser of testUsers) {
    const user = await prisma.user.upsert({
      where: { email: tUser.email },
      update: {},
      create: {
        email: tUser.email,
        fullName: tUser.name,
        role: Role.STUDENT,
        grade: 12,
      },
    });

    const level = Math.floor(Math.sqrt(tUser.xp / 100)) + 1;

    await prisma.gamificationProfile.upsert({
      where: { userId: user.id },
      update: {
        lifetimeXp: tUser.xp,
        spendableXp: tUser.xp,
        level,
        currentStreak: tUser.streak,
        longestStreak: tUser.streak,
      },
      create: {
        userId: user.id,
        lifetimeXp: tUser.xp,
        spendableXp: tUser.xp,
        level,
        currentStreak: tUser.streak,
        longestStreak: tUser.streak,
      },
    });
  }

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
