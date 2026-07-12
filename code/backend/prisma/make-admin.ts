import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.log(
      'Vui lòng cung cấp email. Ví dụ: npx ts-node prisma/make-admin.ts admin@edutech.com',
    );
    process.exit(1);
  }

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    console.log(`Không tìm thấy user với email: ${email}`);
    process.exit(1);
  }

  const updatedUser = await prisma.user.update({
    where: { email },
    data: { role: Role.ADMIN },
  });

  console.log(
    `Đã cấp quyền ADMIN thành công cho tài khoản: ${updatedUser.email}`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
