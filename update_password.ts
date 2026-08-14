import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
prisma.student.updateMany({
  where: { name: 'ayush' },
  data: { password: '535597' }
}).then(() => console.log('Password updated to 535597')).finally(() => prisma.$disconnect());
