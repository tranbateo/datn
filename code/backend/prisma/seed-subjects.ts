import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const defaultSubjects = [
  // Lớp 1, 2
  {
    grades: [1, 2],
    names: [
      'Toán',
      'Tiếng Việt',
      'Đạo đức',
      'Tự nhiên và Xã hội',
      'Giáo dục thể chất',
      'Nghệ thuật (Âm nhạc, Mỹ thuật)',
      'Hoạt động trải nghiệm',
    ],
  },
  // Lớp 3
  {
    grades: [3],
    names: [
      'Toán',
      'Tiếng Việt',
      'Đạo đức',
      'Tự nhiên và Xã hội',
      'Giáo dục thể chất',
      'Nghệ thuật (Âm nhạc, Mỹ thuật)',
      'Hoạt động trải nghiệm',
      'Tin học',
      'Ngoại ngữ 1',
    ],
  },
  // Lớp 4, 5
  {
    grades: [4, 5],
    names: [
      'Toán',
      'Tiếng Việt',
      'Đạo đức',
      'Lịch sử và Địa lí',
      'Khoa học',
      'Giáo dục thể chất',
      'Nghệ thuật (Âm nhạc, Mỹ thuật)',
      'Hoạt động trải nghiệm',
      'Tin học',
      'Ngoại ngữ 1',
    ],
  },
  // Lớp 6
  {
    grades: [6],
    names: [
      'Toán',
      'Ngữ văn',
      'Ngoại ngữ 1',
      'Giáo dục công dân',
      'Lịch sử và Địa lí',
      'Khoa học tự nhiên',
      'Tin học',
      'Công nghệ',
      'Giáo dục thể chất',
      'Nghệ thuật (Âm nhạc hoặc Mỹ thuật)',
      'Hoạt động trải nghiệm, hướng nghiệp',
    ],
  },
  // Lớp 7, 8, 9
  {
    grades: [7, 8, 9],
    names: [
      'Toán',
      'Ngữ văn',
      'Ngoại ngữ 1',
      'Giáo dục công dân',
      'Lịch sử và Địa lí',
      'Khoa học tự nhiên',
      'Tin học',
      'Công nghệ',
      'Giáo dục thể chất',
      'Nghệ thuật',
      'Hoạt động trải nghiệm, hướng nghiệp',
    ],
  },
  // Lớp 10, 11, 12
  {
    grades: [10, 11, 12],
    names: [
      'Toán',
      'Ngữ văn',
      'Ngoại ngữ 1',
      'Giáo dục thể chất',
      'Giáo dục quốc phòng và an ninh',
      'Hoạt động trải nghiệm, hướng nghiệp',
      'Nội dung giáo dục địa phương',
      'Vật lí',
      'Hóa học',
      'Sinh học',
      'Lịch sử',
      'Địa lí',
      'Giáo dục kinh tế và pháp luật',
      'Tin học',
      'Công nghệ',
      'Âm nhạc',
      'Mỹ thuật',
    ],
  },
];

async function main() {
  console.log('Start seeding subjects...');

  // Xóa các môn học cũ để tránh rác (chỉ dùng trong dev, nếu lỗi foreign key có thể bỏ qua xóa)
  try {
    await prisma.subject.deleteMany({});
    console.log('Deleted old subjects.');
  } catch {
    console.log(
      'Could not delete all old subjects (possibly due to foreign keys). Will upsert instead.',
    );
  }

  for (const group of defaultSubjects) {
    for (const grade of group.grades) {
      for (const name of group.names) {
        await prisma.subject.upsert({
          where: {
            name_grade: {
              name,
              grade,
            },
          },
          update: {},
          create: {
            name,
            grade,
            description: `Môn ${name} dành cho học sinh lớp ${grade}`,
          },
        });
      }
    }
  }

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
