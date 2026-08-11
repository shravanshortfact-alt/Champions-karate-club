import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// This endpoint should be protected in production (e.g., using a secret token header check)
export async function POST(request: Request) {
  try {
    const today = new Date();
    // Format today as MM-DD (since DOB might be YYYY-MM-DD)
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const currentMonthDay = `${month}-${day}`;

    // Get the default message from Settings
    const setting = await prisma.systemSettings.findUnique({ where: { key: 'birthdayMessage' } });
    let birthdayMessageTemplate = setting?.value || 'Happy Birthday, {Student Name}! 🎉\nChampion Karate Club wishes you success, discipline, strength, and happiness. 🥋';

    // Fetch all active students who have a DOB matching today's month-day
    const students = await prisma.student.findMany({
      where: {
        status: 'Active',
        dob: {
          endsWith: `-${currentMonthDay}` // e.g. ends with "-07-06" if dob is stored as YYYY-MM-DD
        }
      }
    });

    let sentCount = 0;

    for (const student of students) {
      if (!student.whatsappNumber) {
        // Log failure if no number
        await prisma.messageLog.create({
          data: {
            studentId: student.id,
            type: 'Birthday',
            message: birthdayMessageTemplate.replace('{Student Name}', student.name),
            status: 'Failed',
            recipient: 'Unknown',
            errorMessage: 'No WhatsApp number registered'
          }
        });
        continue;
      }

      const messageContent = birthdayMessageTemplate.replace('{Student Name}', student.name);

      // SIMULATE SENDING WHATSAPP MESSAGE HERE
      // e.g. await fetch('https://api.twilio.com/...', { ... })
      // For now, we simulate success
      let sendSuccess = true; 
      let errorMessage = null;

      // Log the result
      await prisma.messageLog.create({
        data: {
          studentId: student.id,
          type: 'Birthday',
          message: messageContent,
          status: sendSuccess ? 'Sent' : 'Failed',
          recipient: student.whatsappNumber,
          errorMessage
        }
      });

      if (sendSuccess) {
        sentCount++;
      }
    }

    return NextResponse.json({ success: true, sentCount, processed: students.length });
  } catch (error) {
    console.error("Cron Error:", error);
    return NextResponse.json({ success: false, error: "Failed to run birthday cron" }, { status: 500 });
  }
}
