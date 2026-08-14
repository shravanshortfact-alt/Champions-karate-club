import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const branchName = 'aman';
  // Ensure branch exists
  let branch = await prisma.branch.findFirst({ where: { name: branchName } });
  if (!branch) {
    branch = await prisma.branch.create({ data: { name: branchName, address: 'Demo Address' } });
  }

  // Ensure Registration exists
  await prisma.registration.upsert({
    where: { id: 'CKC-7126' },
    update: {},
    create: {
      id: 'CKC-7126',
      name: 'ayush',
      age: '20',
      branch: branchName,
      status: 'Verified',
      category: 'Admission',
      whatsappNumber: '1234567890',
      createdAt: new Date(),
    }
  });

  // Ensure Student exists
  await prisma.student.upsert({
    where: { registrationNumber: 'CKC-7126' },
    update: {},
    create: {
      registrationNumber: 'CKC-7126',
      name: 'ayush',
      age: 20,
      branchId: branch.id,
      currentBelt: 'White',
      status: 'Active',
      createdAt: new Date(),
    }
  });

  console.log("Demo user ensured in DB!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
