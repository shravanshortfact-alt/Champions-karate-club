import { getPrisma, getD1 } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const WORKER_SUBMIT_PAID_URL = 'https://karate-club.shravanshortfact.workers.dev/api/fee/direct-upi/submit-paid';

export async function POST(request: Request) {
  const d1 = getD1();
  const rawBodyText = await request.text();
  const bodyText = rawBodyText.replace(/^\uFEFF/, '').trim();
  let body: any = {};
  try {
    body = JSON.parse(bodyText);
  } catch (e) {
    return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
  }

  const { paymentReference, utr } = body;

  if (!paymentReference) {
    return NextResponse.json(
      { success: false, error: "Missing payment reference." },
      { status: 400 }
    );
  }

  const sanitizedUtr = utr ? String(utr).trim().replace(/[^a-zA-Z0-9]/g, '') : null;

  // Forward to Cloudflare Worker if running on Vercel without D1
  if (!d1 && process.env.NODE_ENV === 'production') {
    try {
      const res = await fetch(WORKER_SUBMIT_PAID_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: bodyText
      });
      const data = await res.json();
      return NextResponse.json(data, { status: res.status });
    } catch (err: any) {
      console.error("Failed to forward submit-paid to Cloudflare Worker:", err);
    }
  }

  // 1. Direct D1 execution
  if (d1) {
    try {
      const paymentOrder: any = await d1.prepare(`
        SELECT p.*, s.name as studentName, b.name as branchName
        FROM PaymentOrder p
        LEFT JOIN Student s ON p.studentId = s.id
        LEFT JOIN Branch b ON p.branchId = b.id
        WHERE p.paymentReference = ?
      `).bind(paymentReference).first();

      if (!paymentOrder) {
        return NextResponse.json(
          { success: false, error: "Payment reference record not found." },
          { status: 404 }
        );
      }

      await d1.prepare("UPDATE PaymentOrder SET status = 'AWAITING_CONFIRMATION', utr = ? WHERE id = ?")
        .bind(sanitizedUtr || paymentOrder.utr, paymentOrder.id).run();

      await d1.prepare("UPDATE FeePayment SET status = 'AWAITING_CONFIRMATION', utr = ? WHERE paymentReference = ?")
        .bind(sanitizedUtr || paymentOrder.utr, paymentReference).run();

      try {
        const notifId = 'notif_' + Date.now();
        await d1.prepare(`
          INSERT INTO Notification (id, title, message, type, priority, status, createdBy, createdAt)
          VALUES (?, ?, ?, 'Fee Reminder', 'Urgent', 'Pending', ?, ?)
        `).bind(
          notifId,
          `New Payment Confirmation: ${paymentOrder.studentName || 'Student'}`,
          `Student ${paymentOrder.studentName || ''} (${paymentOrder.branchName || ''}) submitted payment of ₹${paymentOrder.amount}. Ref: ${paymentReference}${sanitizedUtr ? ` | UTR: ${sanitizedUtr}` : ''}`,
          paymentOrder.teacherId || 'System',
          new Date().toISOString()
        ).run();
      } catch (nErr) {}

      return NextResponse.json({
        success: true,
        message: "Payment submitted for teacher verification.",
        status: "AWAITING_CONFIRMATION",
        paymentReference,
        teacherName: paymentOrder.teacherUpiNameSnapshot || 'Teacher',
        studentName: paymentOrder.studentName,
        amount: paymentOrder.amount
      });
    } catch (error: any) {
      console.error("D1 error submitting paid:", error);
      return NextResponse.json(
        { success: false, error: "Failed to submit payment confirmation: " + (error?.message || String(error)) },
        { status: 500 }
      );
    }
  }

  // 2. Prisma fallback
  try {
    const prisma = getPrisma();
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

    await prisma.paymentOrder.update({
      where: { id: paymentOrder.id },
      data: {
        status: 'AWAITING_CONFIRMATION',
        utr: sanitizedUtr || paymentOrder.utr
      }
    });

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
