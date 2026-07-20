const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function pingDatabase() {
  try {
    console.log('Pinging Supabase database to prevent pause...');
    // A simple query to wake up/keep the database active
    const result = await prisma.$queryRawUnsafe('SELECT 1 as result');
    console.log('Ping successful:', result);
  } catch (error) {
    console.error('Error pinging database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

pingDatabase();
