import { getPrisma, getD1 } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const WORKER_FEE_VERIFY_URL = 'https://karate-club.shravanshortfact.workers.dev/api/admin/fee/verify';

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

  const { studentId, month, year, feePaymentId, paymentReference, adminName = 'Admin' } = body;

  if (!studentId && !feePaymentId && !paymentReference) {
    return NextResponse.json(
      { success: false, error: "Missing studentId, feePaymentId, or paymentReference." },
      { status: 400 }
    );
  }

  // Forward to Cloudflare Worker if running on Vercel without D1
  if (!d1 && process.env.NODE_ENV === 'production') {
    try {
      const res = await fetch(WORKER_FEE_VERIFY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: bodyText
      });
      const data = await res.json();
      return NextResponse.json(data, { status: res.status });
    } catch (err: any) {
      console.error("Failed to forward fee verify to Cloudflare Worker:", err);
    }
  }

  const now = new Date().toISOString();

  // 1. Direct D1 execution
  if (d1) {
    try {
      let targetPayment: any = null;
      if (feePaymentId) {
        targetPayment = await d1.prepare("SELECT * FROM FeePayment WHERE id = ?").bind(feePaymentId).first();
      }
      if (!targetPayment && paymentReference) {
        targetPayment = await d1.prepare("SELECT * FROM FeePayment WHERE paymentReference = ?").bind(paymentReference).first();
      }
      if (!targetPayment && studentId && month && year) {
        targetPayment = await d1.prepare("SELECT * FROM FeePayment WHERE studentId = ? AND month = ? AND year = ?")
          .bind(studentId, month, Number(year)).first();
      }

      const sId = targetPayment?.studentId || studentId;
      const student: any = await d1.prepare("SELECT * FROM Student WHERE id = ?").bind(sId).first();

      if (!student) {
        return NextResponse.json({ success: false, error: "Student record not found." }, { status: 404 });
      }

      if (targetPayment) {
        await d1.prepare(`
          UPDATE FeePayment 
          SET status = 'PAID', paidAt = ?, confirmedBy = ?, confirmedAt = ? 
          WHERE id = ?
        `).bind(now, adminName, now, targetPayment.id).run();

        if (targetPayment.paymentReference) {
          await d1.prepare(`
            UPDATE PaymentOrder 
            SET status = 'PAID', paidAt = ?, confirmedBy = ?, confirmedAt = ? 
            WHERE paymentReference = ?
          `).bind(now, adminName, now, targetPayment.paymentReference).run();
        }
      } else {
        // Create new record as PAID
        const newFeeId = 'fp_' + Date.now();
        await d1.prepare(`
          INSERT INTO FeePayment (id, studentId, branchId, month, year, baseAmount, lateFee, totalAmount, status, paidAt, confirmedBy, confirmedAt, createdAt)
          VALUES (?, ?, ?, ?, ?, 700, 0, 700, 'PAID', ?, ?, ?, ?)
        `).bind(newFeeId, student.id, student.branchId, month, Number(year), now, adminName, now, now).run();
      }

      return NextResponse.json({
        success: true,
        message: `Fee payment verified for ${student.name}!`,
        studentName: student.name,
        registrationNumber: student.registrationNumber,
        whatsappNumber: student.whatsappNumber,
        month: targetPayment?.month || month,
        year: targetPayment?.year || year,
        amount: targetPayment?.totalAmount || 700,
        utr: targetPayment?.utr || 'Direct UPI'
      });
    } catch (e: any) {
      console.error("D1 fee verify error:", e);
      return NextResponse.json({ success: false, error: e?.message || "D1 error verifying fee" }, { status: 500 });
    }
  }

  // 2. Prisma fallback
  try {
    const prisma = getPrisma();
    let payment: any = null;

    if (feePaymentId) {
      payment = await prisma.feePayment.findUnique({
        where: { id: feePaymentId },
        include: { student: true }
      });
    }
    if (!payment && paymentReference) {
      payment = await prisma.feePayment.findFirst({
        where: { paymentReference },
        include: { student: true }
      });
    }
    if (!payment && studentId && month && year) {
      payment = await prisma.feePayment.findFirst({
        where: { studentId, month, year: Number(year) },
        include: { student: true }
      });
    }

    if (!payment) {
      const student = await prisma.student.findUnique({ where: { id: studentId } });
      if (!student) {
        return NextResponse.json({ success: false, error: "Student not found." }, { status: 404 });
      }

      const created = await prisma.feePayment.create({
        data: {
          studentId: student.id,
          branchId: student.branchId,
          month,
          year: Number(year),
          baseAmount: student.monthlyFee || 700,
          lateFee: 0,
          totalAmount: student.monthlyFee || 700,
          status: 'PAID',
          paidAt: new Date(),
          confirmedBy: adminName,
          confirmedAt: new Date()
        }
      });

      return NextResponse.json({
        success: true,
        message: `Fee payment recorded & verified for ${student.name}!`,
        studentName: student.name,
        registrationNumber: student.registrationNumber,
        whatsappNumber: student.whatsappNumber,
        month,
        year,
        amount: created.totalAmount,
        utr: 'Direct Manual'
      });
    }

    const updated = await prisma.feePayment.update({
      where: { id: payment.id },
      data: {
        status: 'PAID',
        paidAt: new Date(),
        confirmedBy: adminName,
        confirmedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      message: `Fee payment verified for ${payment.student?.name || 'student'}!`,
      studentName: payment.student?.name,
      registrationNumber: payment.student?.registrationNumber,
      whatsappNumber: payment.student?.whatsappNumber,
      month: updated.month,
      year: updated.year,
      amount: updated.totalAmount,
      utr: updated.utr || 'Direct UPI'
    });
  } catch (error: any) {
    console.error("Prisma error verifying fee:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to verify fee" }, { status: 500 });
  }
}
