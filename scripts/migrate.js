const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
  const dataPath = path.join(__dirname, '..', 'data', 'registrations.json');
  if (!fs.existsSync(dataPath)) {
    console.log('No registrations.json found.');
    return;
  }

  const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

  for (const reg of data) {
    if (reg.category === 'Admission') {
      // Find or create branch
      let branch = await prisma.branch.findFirst({ where: { name: reg.branch } });
      if (!branch) {
        branch = await prisma.branch.create({
          data: { name: reg.branch, address: '' }
        });
      }

      // Check if student exists
      let student = await prisma.student.findUnique({
        where: { registrationNumber: reg.id }
      });
      
      if (!student) {
        await prisma.student.create({
          data: {
            registrationNumber: reg.id,
            name: reg.name,
            age: parseInt(reg.age) || 0,
            branchId: branch.id,
            paymentStatus: reg.status === 'Verified' ? 'Verified' : 'Pending',
            transactionId: reg.transactionId || null,
            createdAt: new Date(reg.createdAt || Date.now())
          }
        });
        console.log(`Migrated student ${reg.name}`);
      }
    }
  }

  console.log('Migration complete.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
