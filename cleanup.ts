import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const keepId = 'CKC-7126';
  
  // 1. Delete dependent records first (where not associated with keepId)
  await prisma.feePayment.deleteMany({
    where: {
      student: {
        registrationNumber: { not: keepId }
      }
    }
  });
  
  await prisma.messageLog.deleteMany({
    where: {
      student: {
        registrationNumber: { not: keepId }
      }
    }
  });

  await prisma.achievement.deleteMany({
    where: {
      student: {
        registrationNumber: { not: keepId }
      }
    }
  });

  await prisma.notificationRecipient.deleteMany({
    where: {
      student: {
        registrationNumber: { not: keepId }
      }
    }
  });

  await prisma.feeReminderLog.deleteMany({
    where: {
      student: {
        registrationNumber: { not: keepId }
      }
    }
  });

  await prisma.pushSubscription.deleteMany({
    where: {
      student: {
        registrationNumber: { not: keepId }
      }
    }
  });

  // 2. Delete students except the one with keepId
  const deletedStudents = await prisma.student.deleteMany({
    where: {
      registrationNumber: { not: keepId }
    }
  });
  console.log(`Deleted ${deletedStudents.count} students.`);

  // 3. Delete registrations except keepId
  const deletedRegistrations = await prisma.registration.deleteMany({
    where: {
      id: { not: keepId }
    }
  });
  console.log(`Deleted ${deletedRegistrations.count} registrations.`);

  // 4. Delete belt exams except keepId
  try {
    const deletedBeltExams = await prisma.$executeRaw`DELETE FROM "BeltExam" WHERE "registrationNumber" != ${keepId} OR "registrationNumber" IS NULL`;
    console.log(`Deleted ${deletedBeltExams} belt exams.`);
  } catch(e) {}

  // 5. Delete competitions except keepId
  try {
    const deletedCompetitions = await prisma.$executeRaw`DELETE FROM "Competition" WHERE "registrationNumber" != ${keepId} OR "registrationNumber" IS NULL`;
    console.log(`Deleted ${deletedCompetitions} competitions.`);
  } catch(e) {}

  // 6. Delete seminars except keepId
  try {
    const deletedSeminars = await prisma.$executeRaw`DELETE FROM "Seminar" WHERE "registrationNumber" != ${keepId} OR "registrationNumber" IS NULL`;
    console.log(`Deleted ${deletedSeminars} seminars.`);
  } catch(e) {}

  console.log('Cleanup complete!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
