const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const students = await prisma.student.findMany();
  for (const student of students) {
    if (student.registrationNumber) {
      const reg = await prisma.registration.findUnique({
        where: { id: student.registrationNumber }
      });
      if (reg) {
        let extraData = {};
        try { extraData = JSON.parse(reg.extraData || '{}'); } catch(e){}
        if (!extraData.generatedPassword) {
          extraData.generatedPassword = student.password;
          await prisma.registration.update({
            where: { id: reg.id },
            data: { extraData: JSON.stringify(extraData) }
          });
          console.log('Fixed password for', student.name);
        }
      }
    }
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
