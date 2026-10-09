import { getPrisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const prisma = getPrisma();

export async function POST(request: Request) {
  try {
    const { paymentReference, utr } = await request.json();

    if (!paymentReference) {
      return NextResponse.json(
        { success: false, error: "Missing payment reference." },
        { status: 400 }
      );
    }

    const sanitizedUtr = utr ? String(utr).trim().replace(/[^a-zA-Z0-9]/g, '') : null;

    // Find payment order
    const paymentOrder = await prisma.paymentOrder.findFirst({
      where: { paymentReference },
      include: {
        student: { include: { branch: true } },
        teacher: true,
        feePayments: true
      }
    });

    if (!paymentOrder) {
      return NextResponse.json(
        { success: false, error: "Payment reference record not found." },
        { status: 404 }
      );
    }

    // Update PaymentOrder to AWAITING_CONFIRMATION
    await prisma.paymentOrder.update({
      where: { id: paymentOrder.id },
      data: {
        status: 'AWAITING_CONFIRMATION',
        utr: sanitizedUtr || paymentOrder.utr
      }
    });

    // Update FeePayment records to AWAITING_CONFIRMATION
    await prisma.feePayment.updateMany({
      where: {
        OR: [
          { paymentOrderId: paymentOrder.id },
          { paymentReference }
        ]
      },
      data: {
        status: 'AWAITING_CONFIRMATION',
        utr: sanitizedUtr || paymentOrder.utr
      }
    });

    // Route in-app Notification ONLY to the assigned teacher
    try {
      const monthNames = paymentOrder.feePayments.map(f => `${f.month} ${f.year}`).join(', ');
      await prisma.notification.create({
        data: {
          title: `New Payment Confirmation: ${paymentOrder.student.name}`,
          message: `Student ${paymentOrder.student.name} (${paymentOrder.student.branch?.name}) submitted payment of ₹${paymentOrder.amount} for ${monthNames}. Ref: ${paymentReference}${sanitizedUtr ? ` | UTR: ${sanitizedUtr}` : ''}`,
          type: 'Fee Reminder',
          priority: 'Urgent',
          status: 'Pending',
          createdBy: paymentOrder.teacherId || 'System'
        }
      });
    } catch (nErr) {
      console.error("Failed to create teacher notification log:", nErr);
    }

    return NextResponse.json({
      success: true,
      message: "Payment submitted for teacher verification.",
      status: "AWAITING_CONFIRMATION",
      paymentReference,
      teacherName: paymentOrder.teacherUpiNameSnapshot || 'Teacher',
      studentName: paymentOrder.student.name,
      amount: paymentOrder.amount
    });
  } catch (error: any) {
    console.error("Error submitting direct UPI payment confirmation:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to submit payment confirmation." },
      { status: 500 }
    );
  }
}
