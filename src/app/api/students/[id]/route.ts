import { getPrisma } from '@/lib/prisma';
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';


const prisma = getPrisma();

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;

    // Delete related records to avoid foreign key constraint errors
    await prisma.feePayment.deleteMany({ where: { studentId: id } });
    await prisma.messageLog.deleteMany({ where: { studentId: id } });
    await prisma.achievement.deleteMany({ where: { studentId: id } });
    await prisma.notificationRecipient.deleteMany({ where: { studentId: id } });
    await prisma.feeReminderLog.deleteMany({ where: { studentId: id } });
    await prisma.pushSubscription.deleteMany({ where: { studentId: id } });

    // Now delete the student
    await prisma.student.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting student:", error);
    return NextResponse.json({ error: "Failed to delete student" }, { status: 500 });
  }
}
