import { getPrisma, getD1 } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getSiteSettings } from '@/lib/settings';
import { calculateMonthFeeDetails, MONTH_NAMES } from '@/lib/fee-calculator';

export const dynamic = 'force-dynamic';

const WORKER_CREATE_ATTEMPT_URL = 'https://karate-club.shravanshortfact.workers.dev/api/fee/direct-upi/create-attempt';

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

  const { studentId, selectedMonths } = body;

  if (!studentId || !Array.isArray(selectedMonths) || selectedMonths.length === 0) {
    return NextResponse.json(
      { success: false, error: "Missing student ID or selected months." },
      { status: 400 }
    );
  }

  // Forward to Cloudflare Worker if running on Vercel without D1
  if (!d1 && process.env.NODE_ENV === 'production') {
    try {
      const res = await fetch(WORKER_CREATE_ATTEMPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: bodyText
      });
      const data = await res.json();
      return NextResponse.json(data, { status: res.status });
    } catch (err: any) {
      console.error("Failed to forward create-attempt to Cloudflare Worker:", err);
    }
  }

  // 1. Direct D1 execution
  if (d1) {
    try {
      const student: any = await d1.prepare(`
        SELECT s.*, b.name as branchName, b.teacherId, t.name as teacherName, t.upiId as teacherUpiId, t.upiDisplayName as teacherUpiDisplayName
        FROM Student s
        LEFT JOIN Branch b ON s.branchId = b.id
        LEFT JOIN Teacher t ON b.teacherId = t.id
        WHERE s.id = ?
      `).bind(studentId).first();

      if (!student || student.status !== 'Active') {
        return NextResponse.json(
          { success: false, error: "Student record not found or inactive." },
          { status: 404 }
        );
      }

      let destinationUpiId = student?.teacherUpiId;
      let destinationUpiName = student?.teacherUpiDisplayName || student?.teacherName || 'Dipak Shendre';
      let teacherId = student?.teacherId || null;

      const settings = await getSiteSettings();
      if (!destinationUpiId) {
        destinationUpiId = settings.upiId || 'shendredipak518-1@okhdfcbank';
        destinationUpiName = 'Dipak Shendre';
      }

      const defaultMonthlyFee = Number(settings.defaultMonthlyFee) || 700;
      const lateFeeAmount = Number(settings.lateFeeAmount) || 100;
      const dueDay = Number(settings.dueDay) || 10;
      const baseMonthlyFee = (student.monthlyFee && student.monthlyFee > 0) ? student.monthlyFee : defaultMonthlyFee;

      const { results: existingPayments } = await d1.prepare(`
        SELECT * FROM FeePayment WHERE studentId = ?
      `).bind(student.id).all();

      for (const item of selectedMonths) {
        const existing = (existingPayments || []).find(
          (p: any) => p.month === item.month && p.year === item.year
        );
        if (existing && (existing.status === 'PAID' || existing.status === 'Verified')) {
          return NextResponse.json(
            { success: false, error: `Fee for ${item.month} ${item.year} is already paid.` },
            { status: 400 }
          );
        }
      }

      let totalServerAmount = 0;
      const itemizedDetails: any[] = [];

      for (const item of selectedMonths) {
        const existing: any = (existingPayments || []).find(
          (p: any) => p.month === item.month && p.year === item.year
        );
        const isWaived = existing?.lateFeeWaived ? true : false;

        const calc = calculateMonthFeeDetails({
          monthName: item.month,
          year: item.year,
          baseMonthlyFee: existing?.baseAmount || baseMonthlyFee,
          isPaid: false,
          isPending: false,
          isWaived,
          dueDay,
          lateFeeAmount
        });

        totalServerAmount += calc.totalAmount;
        itemizedDetails.push({
          month: item.month,
          year: item.year,
          baseAmount: calc.baseAmount,
          lateFee: calc.lateFee,
          totalAmount: calc.totalAmount,
          lateFeeWaived: isWaived,
          existingId: existing?.id || null
        });
      }

      if (totalServerAmount <= 0) {
        return NextResponse.json({ success: false, error: "Invalid payment total amount calculated." }, { status: 400 });
      }

      const now = new Date();
      const yearStr = now.getFullYear();
      const monthStr = String(now.getMonth() + 1).padStart(2, '0');
      const randomSeq = Math.floor(100000 + Math.random() * 900000);
      const paymentReference = `CKC-FEE-${yearStr}-${monthStr}-${randomSeq}`;
      const orderNumber = `ORD-${Date.now()}-${randomSeq}`;

      for (const item of itemizedDetails) {
        if (item.existingId) {
          await d1.prepare(`
            UPDATE FeePayment 
            SET branchId = ?, teacherId = ?, baseAmount = ?, lateFee = ?, totalAmount = ?, status = 'PAYMENT_CREATED', paymentReference = ?, teacherUpiIdSnapshot = ?, teacherUpiNameSnapshot = ?, paymentMethod = 'DIRECT_UPI'
            WHERE id = ?
          `).bind(student.branchId, teacherId, item.baseAmount, item.lateFee, item.totalAmount, paymentReference, destinationUpiId, destinationUpiName, item.existingId).run();
        } else {
          const feeId = 'fp_' + Date.now() + '_' + Math.floor(1000 + Math.random() * 9000);
          await d1.prepare(`
            INSERT INTO FeePayment (id, studentId, branchId, teacherId, month, year, baseAmount, lateFee, totalAmount, status, paymentReference, teacherUpiIdSnapshot, teacherUpiNameSnapshot, paymentMethod, createdAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'PAYMENT_CREATED', ?, ?, ?, 'DIRECT_UPI', ?)
          `).bind(feeId, student.id, student.branchId, teacherId, item.month, item.year, item.baseAmount, item.lateFee, item.totalAmount, paymentReference, destinationUpiId, destinationUpiName, new Date().toISOString()).run();
        }
      }

      const orderId = 'po_' + Date.now() + '_' + Math.floor(1000 + Math.random() * 9000);
      await d1.prepare(`
        INSERT INTO PaymentOrder (id, orderNumber, paymentReference, studentId, branchId, teacherId, teacherUpiIdSnapshot, teacherUpiNameSnapshot, amount, status, paymentMethod, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'PAYMENT_CREATED', 'DIRECT_UPI', ?, ?)
      `).bind(orderId, orderNumber, paymentReference, student.id, student.branchId, teacherId, destinationUpiId, destinationUpiName, totalServerAmount, new Date().toISOString(), new Date().toISOString()).run();

      const encodedName = encodeURIComponent(destinationUpiName);
      const encodedNote = encodeURIComponent(`Fee:${paymentReference}`);
      const upiUri = `upi://pay?pa=${destinationUpiId}&pn=${encodedName}&am=${totalServerAmount.toFixed(2)}&cu=INR&tn=${encodedNote}`;

      return NextResponse.json({
        success: true,
        paymentReference,
        amount: totalServerAmount,
        teacher: {
          id: teacherId,
          name: destinationUpiName,
          upiId: destinationUpiId,
          branchName: student.branchName || 'Main Dojo'
        },
        student: {
          name: student.name,
          registrationNumber: student.registrationNumber
        },
        upiUri,
        itemizedDetails
      });
    } catch (error: any) {
      console.error("D1 error creating direct UPI attempt:", error);
      return NextResponse.json(
        { success: false, error: "Failed to create payment attempt: " + (error?.message || String(error)) },
        { status: 500 }
      );
    }
  }

  // 2. Prisma fallback
  try {
    const prisma = getPrisma();
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        branch: {
          include: { teacher: true }
        }
      }
    });

    if (!student || student.status !== 'Active') {
      return NextResponse.json(
        { success: false, error: "Student record not found or inactive." },
        { status: 404 }
      );
    }

    // Determine Teacher & Teacher UPI ID strictly on the server
    const teacher = student.branch?.teacher;

    let destinationUpiId = teacher?.upiId;
    let destinationUpiName = teacher?.upiDisplayName || teacher?.name || 'Dipak Shendre';
    let teacherId = teacher?.id || null;

    // Fallback to global UPI ID if branch has no teacher assigned
    if (!destinationUpiId) {
      const settings = await getSiteSettings();
      destinationUpiId = settings.upiId || 'shendredipak518-1@okhdfcbank';
      destinationUpiName = 'Dipak Shendre';
    }

    const settings = await getSiteSettings();
    const defaultMonthlyFee = Number(settings.defaultMonthlyFee) || 700;
    const lateFeeAmount = Number(settings.lateFeeAmount) || 100;
    const dueDay = Number(settings.dueDay) || 10;
    const baseMonthlyFee = student.monthlyFee > 0 ? student.monthlyFee : defaultMonthlyFee;

    // Fetch existing payment records for selected months
    const existingPayments = await prisma.feePayment.findMany({
      where: {
        studentId: student.id,
        OR: selectedMonths.map((m) => ({ month: m.month, year: m.year }))
      }
    });

    // Check if any selected month is already paid
    for (const item of selectedMonths) {
      const existing = existingPayments.find(
        (p) => p.month === item.month && p.year === item.year
      );
      if (existing && (existing.status === 'PAID' || existing.status === 'Verified')) {
        return NextResponse.json(
          {
            success: false,
            error: `Fee for ${item.month} ${item.year} is already paid.`
          },
          { status: 400 }
        );
      }
    }

    // SERVER-SIDE RECALCULATION
    let totalServerAmount = 0;
    const itemizedDetails = [];

    for (const item of selectedMonths) {
      const existing = existingPayments.find(
        (p) => p.month === item.month && p.year === item.year
      );

      const isWaived = existing?.lateFeeWaived ?? false;

      const calc = calculateMonthFeeDetails({
        monthName: item.month,
        year: item.year,
        baseMonthlyFee: existing?.baseAmount || baseMonthlyFee,
        isPaid: false,
        isPending: false,
        isWaived,
        dueDay,
        lateFeeAmount
      });

      totalServerAmount += calc.totalAmount;

      itemizedDetails.push({
        month: item.month,
        year: item.year,
        baseAmount: calc.baseAmount,
        lateFee: calc.lateFee,
        totalAmount: calc.totalAmount,
        lateFeeWaived: isWaived,
        existingId: existing?.id || null
      });
    }

    if (totalServerAmount <= 0) {
      return NextResponse.json(
        { success: false, error: "Invalid payment total amount calculated." },
        { status: 400 }
      );
    }

    // Generate Collision-Safe Unique Payment Reference on Backend
    const now = new Date();
    const yearStr = now.getFullYear();
    const monthStr = String(now.getMonth() + 1).padStart(2, '0');
    const randomSeq = Math.floor(100000 + Math.random() * 900000);
    const paymentReference = `CKC-FEE-${yearStr}-${monthStr}-${randomSeq}`;
    const orderNumber = `ORD-${Date.now()}-${randomSeq}`;

    // Create or update FeePayment records to PAYMENT_CREATED with UPI snapshots
    const feePaymentIds: string[] = [];

    for (const item of itemizedDetails) {
      let record;
      if (item.existingId) {
        record = await prisma.feePayment.update({
          where: { id: item.existingId },
          data: {
            branchId: student.branchId,
            teacherId,
            baseAmount: item.baseAmount,
            lateFee: item.lateFee,
            totalAmount: item.totalAmount,
            status: 'PAYMENT_CREATED',
            paymentReference,
            teacherUpiIdSnapshot: destinationUpiId,
            teacherUpiNameSnapshot: destinationUpiName,
            paymentMethod: 'DIRECT_UPI'
          }
        });
      } else {
        record = await prisma.feePayment.create({
          data: {
            studentId: student.id,
            branchId: student.branchId,
            teacherId,
            month: item.month,
            year: item.year,
            baseAmount: item.baseAmount,
            lateFee: item.lateFee,
            totalAmount: item.totalAmount,
            status: 'PAYMENT_CREATED',
            paymentReference,
            teacherUpiIdSnapshot: destinationUpiId,
            teacherUpiNameSnapshot: destinationUpiName,
            paymentMethod: 'DIRECT_UPI'
          }
        });
      }
      feePaymentIds.push(record.id);
    }

    // Create PaymentOrder record with snapshots
    const paymentOrder = await prisma.paymentOrder.create({
      data: {
        orderNumber,
        paymentReference,
        studentId: student.id,
        branchId: student.branchId,
        teacherId,
        teacherUpiIdSnapshot: destinationUpiId,
        teacherUpiNameSnapshot: destinationUpiName,
        amount: totalServerAmount,
        status: 'PAYMENT_CREATED',
        paymentMethod: 'DIRECT_UPI',
        feePayments: {
          connect: feePaymentIds.map((id) => ({ id }))
        }
      }
    });

    // Generate standard UPI payment URI string
    const encodedName = encodeURIComponent(destinationUpiName);
    const encodedNote = encodeURIComponent(`Fee:${paymentReference}`);
    const upiUri = `upi://pay?pa=${destinationUpiId}&pn=${encodedName}&am=${totalServerAmount.toFixed(2)}&cu=INR&tn=${encodedNote}`;

    return NextResponse.json({
      success: true,
      paymentReference,
      amount: totalServerAmount,
      teacher: {
        id: teacherId,
        name: destinationUpiName,
        upiId: destinationUpiId,
        branchName: student.branch?.name || 'Main Dojo'
      },
      student: {
        name: student.name,
        registrationNumber: student.registrationNumber
      },
      upiUri,
      itemizedDetails
    });
  } catch (error: any) {
    console.error("Error creating direct UPI payment attempt:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create payment attempt." },
      { status: 500 }
    );
  }
}
