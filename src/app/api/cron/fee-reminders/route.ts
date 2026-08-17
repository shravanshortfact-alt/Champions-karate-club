import { getPrisma } from '@/lib/prisma';
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';



const prisma = getPrisma();

export async function GET(request: Request) {
  try {
    // In production, verify authorization headers to ensure only your cron job can call this

    const now = new Date();
    const currentDate = now.getDate();

    // Only run on 5th, 10th, 15th
    if (![5, 10, 15].includes(currentDate)) {
      return NextResponse.json({ success: true, message: `Skipped. Today is the ${currentDate}, not 5th, 10th, or 15th.` });
    }

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const currentMonth = monthNames[now.getMonth()];
    const currentYear = now.getFullYear();

    // Get all active students
    const activeStudents = await prisma.student.findMany({
      where: { status: 'Active' }
    });

    let remindersSent = 0;

    for (const student of activeStudents) {
      if (!student.whatsappNumber) continue;

      // Check if they already paid this month
      const payment = await prisma.feePayment.findFirst({
        where: {
          studentId: student.id,
          month: currentMonth,
          year: currentYear
        }
      });

      if (payment) continue; // Already paid or pending

      let message = `Reminder: Fee for ${currentMonth} is due. Please pay via: https://yourdomain.com/pay-fee`;
      if (currentDate >= 11) {
        message = `URGENT: Fee for ${currentMonth} is overdue. A late fee of ₹100 has been applied. Please pay via: https://yourdomain.com/pay-fee`;
      }

      // Log the reminder (Simulated SMS)
      await prisma.messageLog.create({
        data: {
          studentId: student.id,
          type: 'Fee Reminder',
          message: message,
          recipient: student.whatsappNumber,
          status: 'Sent'
        }
      });

      remindersSent++;
    }

    return NextResponse.json({ success: true, remindersSent, message: `Sent ${remindersSent} fee reminders for ${currentMonth}` });
  } catch (error) {
    console.error("Cron Error:", error);
    return NextResponse.json({ success: false, error: "Failed to run cron job" }, { status: 500 });
  }
}
