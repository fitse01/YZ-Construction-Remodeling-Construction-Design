import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// Handle Prisma connection errors
prisma.$on('error', (e) => {
  console.error('Prisma Client Error:', e);
});

export default prisma;
