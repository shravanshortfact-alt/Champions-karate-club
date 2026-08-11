import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log("Clearing all data...");
  
  await prisma.feePayment.deleteMany();
  await prisma.achievement.deleteMany();
  await prisma.messageLog.deleteMany();
  await prisma.notificationRecipient.deleteMany();
  await prisma.feeReminderLog.deleteMany();
  await prisma.pushSubscription.deleteMany();
  
  await prisma.beltExam.deleteMany();
  await prisma.competition.deleteMany();
  await prisma.seminar.deleteMany();
  await prisma.registration.deleteMany();
  
  await prisma.student.deleteMany();
  
  console.log("All data cleared successfully! Dashboard counters should now be 0.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
