const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  console.log('Testing prisma...');
  
  // 1. Create a dummy user
  let user = await prisma.user.findFirst();
  if (!user) {
    user = await prisma.user.create({
      data: {
        email: 'test' + Date.now() + '@example.com',
        role: 'STUDENT',
      }
    });
    console.log('Created dummy user', user.id);
  }

  // 2. Test GamificationProfile creation
  let profile = await prisma.gamificationProfile.findUnique({
    where: { userId: user.id },
    include: { badges: { include: { badge: true } } },
  });

  if (!profile) {
    profile = await prisma.gamificationProfile.create({
      data: { userId: user.id },
      include: { badges: { include: { badge: true } } },
    });
    console.log('Created gamification profile');
  }

  console.log('Profile:', profile);
  
  // 3. Test XP formula
  const currentXp = profile.xp + 10;
  const newLevel = Math.floor(Math.sqrt(currentXp / 100)) + 1;
  console.log(`New XP: ${currentXp}, New Level: ${newLevel}`);

  await prisma.gamificationProfile.update({
    where: { userId: user.id },
    data: { xp: currentXp, level: newLevel }
  });
  console.log('Updated profile');

  console.log('Done!');
}

test().catch(e => {
  console.error(e);
}).finally(() => prisma.$disconnect());
