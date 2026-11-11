import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const GDPT_2018_SUBJECTS = [
  // Lớp 1, 2
  {
    grades: [1, 2],
    names: [
      'Toán',
      'Tiếng Việt',
      'Đạo đức',
      'Tự nhiên và Xã hội',
      'Giáo dục thể chất',
      'Nghệ thuật',
      'Hoạt động trải nghiệm',
    ],
  },
  // Lớp 3
  {
    grades: [3],
    names: [
      'Toán',
      'Tiếng Việt',
      'Tiếng Anh',
      'Đạo đức',
      'Tự nhiên và Xã hội',
      'Tin học và Công nghệ',
      'Giáo dục thể chất',
      'Nghệ thuật',
      'Hoạt động trải nghiệm',
    ],
  },
  // Lớp 4, 5
  {
    grades: [4, 5],
    names: [
      'Toán',
      'Tiếng Việt',
      'Tiếng Anh',
      'Đạo đức',
      'Lịch sử và Địa lí',
      'Khoa học',
      'Tin học và Công nghệ',
      'Giáo dục thể chất',
      'Nghệ thuật',
      'Hoạt động trải nghiệm',
    ],
  },
  // Cấp THCS: Lớp 6, 7, 8, 9 (Chương trình GDPT 2018 - Kết nối tri thức với cuộc sống)
  {
    grades: [6, 7, 8, 9],
    names: [
      'Toán',
      'Ngữ văn',
      'Tiếng Anh',
      'Khoa học tự nhiên',
      'Lịch sử và Địa lí',
      'Giáo dục công dân',
      'Tin học',
      'Công nghệ',
      'Giáo dục thể chất',
      'Nghệ thuật',
      'Hoạt động trải nghiệm, hướng nghiệp',
    ],
  },
  // Cấp THPT: Lớp 10, 11, 12 (Chương trình GDPT 2018)
  {
    grades: [10, 11, 12],
    names: [
      'Toán',
      'Ngữ văn',
      'Tiếng Anh',
      'Lịch sử',
      'Địa lí',
      'Giáo dục kinh tế và pháp luật',
      'Vật lí',
      'Hóa học',
      'Sinh học',
      'Tin học',
      'Công nghệ',
      'Giáo dục thể chất',
      'Giáo dục quốc phòng và an ninh',
      'Nghệ thuật',
      'Hoạt động trải nghiệm, hướng nghiệp',
    ],
  },
];

async function main() {
  console.log('Start seeding GDPT 2018 subjects...');

  for (const group of GDPT_2018_SUBJECTS) {
    for (const grade of group.grades) {
      for (const name of group.names) {
        await prisma.subject.upsert({
          where: {
            name_grade: {
              name,
              grade,
            },
          },
          update: {
            description: `Môn ${name} - Khối ${grade} (Chương trình GDPT 2018 - Kết nối tri thức với cuộc sống)`,
          },
          create: {
            name,
            grade,
            description: `Môn ${name} - Khối ${grade} (Chương trình GDPT 2018 - Kết nối tri thức với cuộc sống)`,
          },
        });
      }
    }
  }

  console.log('Seeding GDPT 2018 subjects finished.');
}

if (require.main === module) {
  main()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
