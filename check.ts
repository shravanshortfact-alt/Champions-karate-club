import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
prisma.registration.findUnique({ where: { id: 'CKC-7126' } }).then(r => console.log('Registration:', r)).finally(() => prisma.$disconnect());
