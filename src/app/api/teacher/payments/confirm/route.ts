import { getPrisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const prisma = getPrisma();

export async function POST(request: Request) {
  try {
    const { paymentId, action, teacherId } = await request.json();

    if (!paymentId || !action || !teacherId) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: paymentId, action, teacherId." },
        { status: 400 }
      );
    }

    const teacher = await prisma.teacher.findUnique({
      where: { id: teacherId },
      include: { branches: true }
    });

    if (!teacher) {
      return NextResponse.json({ success: false, error: "Teacher record not found." }, { status: 404 });
    }

    const assignedBranchIds = teacher.branches.map(b => b.id);

    // Find target FeePayment
    const feePayment = await prisma.feePayment.findUnique({
      where: { id: paymentId },
      include: {
        student: { include: { branch: true } }
      }
    });

    if (!feePayment) {
      return NextResponse.json({ success: false, error: "Fee payment record not found." }, { status: 404 });
    }

    // SERVER-SIDE DATA ISOLATION CHECK:
    // Check if the student's branch or payment's teacherId belongs to this teacher
    const isOwner =
      feePayment.teacherId === teacher.id ||
      (feePayment.branchId && assignedBranchIds.includes(feePayment.branchId)) ||
      (feePayment.student?.branchId && assignedBranchIds.includes(feePayment.student.branchId));

    if (!isOwner) {
      console.warn(`Unauthorized attempt by Teacher ${teacher.name} (${teacher.id}) to access payment ${paymentId}`);
      return NextResponse.json(
        { success: false, error: "403 Forbidden: You do not have permission to verify payments for another teacher's branch." },
        { status: 403 }
      );
    }

    const now = new Date();

    if (action === 'CONFIRM') {
      const updated = await prisma.feePayment.update({
        where: { id: paymentId },
        data: {
          status: 'PAID',
          confirmedBy: teacher.name,
          confirmedAt: now,
          paidAt: now
        }
      });

      // Update parent PaymentOrder if linked
      if (feePayment.paymentOrderId) {
        await prisma.paymentOrder.update({
          where: { id: feePayment.paymentOrderId },
          data: {
            status: 'PAID',
            confirmedBy: teacher.name,
            confirmedAt: now,
            paidAt: now
          }
        });
      }

      return NextResponse.json({
        success: true,
        message: `Payment for ${feePayment.month} ${feePayment.year} confirmed as PAID by ${teacher.name}!`,
        payment: updated
      });
    } else if (action === 'REJECT') {
      const updated = await prisma.feePayment.update({
        where: { id: paymentId },
        data: {
          status: 'PAYMENT_NOT_VERIFIED',
          confirmedBy: teacher.name,
          confirmedAt: now
        }
      });

      if (feePayment.paymentOrderId) {
        await prisma.paymentOrder.update({
          where: { id: feePayment.paymentOrderId },
          data: {
            status: 'PAYMENT_NOT_VERIFIED',
            confirmedBy: teacher.name,
            confirmedAt: now
          }
        });
      }

      return NextResponse.json({
        success: true,
        message: `Payment marked as NOT RECEIVED. History preserved for audit.`,
        payment: updated
      });
    } else {
      return NextResponse.json({ success: false, error: "Invalid action type." }, { status: 400 });
    }
  } catch (error: any) {
    console.error("Error in teacher payment confirmation:", error);
    return NextResponse.json({ success: false, error: "Failed to process payment action." }, { status: 500 });
  }
}
