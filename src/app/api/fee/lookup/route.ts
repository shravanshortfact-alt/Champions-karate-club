import { getPrisma, getD1 } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { generateStudentFeeTimeline } from '@/lib/fee-calculator';
import { getSiteSettings } from '@/lib/settings';

export const dynamic = 'force-dynamic';

const WORKER_FEE_LOOKUP_URL = 'https://karate-club.shravanshortfact.workers.dev/api/fee/lookup';

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

  const { studentName, registrationNumber } = body;
  const term = String(studentName || registrationNumber || '').trim();

  if (!term) {
    return NextResponse.json(
      { success: false, error: "Please provide a Student Name or Registration Number." },
      { status: 400 }
    );
  }

  // Forward to Cloudflare Worker if running on Vercel without D1
  if (!d1 && process.env.NODE_ENV === 'production') {
    try {
      const res = await fetch(WORKER_FEE_LOOKUP_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: bodyText
      });
      const data = await res.json();
      return NextResponse.json(data, { status: res.status });
    } catch (err: any) {
      console.error("Failed to forward fee lookup to Cloudflare Worker:", err);
    }
  }

  // 1. Direct D1 execution
  if (d1) {
    try {
      const student: any = await d1.prepare(`
        SELECT s.*, b.name as branchName 
        FROM Student s 
        LEFT JOIN Branch b ON s.branchId = b.id 
        WHERE s.status = 'Active' AND (
          LOWER(TRIM(s.name)) = LOWER(TRIM(?))
          OR UPPER(TRIM(s.registrationNumber)) = UPPER(TRIM(?))
          OR TRIM(s.password) = TRIM(?)
          OR TRIM(s.whatsappNumber) = TRIM(?)
          OR LOWER(s.name) LIKE '%' || LOWER(TRIM(?)) || '%'
        )
      `).bind(term, term, term, term, term).first();

      if (!student) {
        return NextResponse.json(
          { success: false, error: "Active student record not found." },
          { status: 404 }
        );
      }

      const { results: feePayments } = await d1.prepare(`
        SELECT * FROM FeePayment WHERE studentId = ? ORDER BY createdAt DESC
      `).bind(student.id).all();

      const settings = await getSiteSettings();
      const defaultMonthlyFee = Number(settings.defaultMonthlyFee) || 700;
      const lateFeeAmount = Number(settings.lateFeeAmount) || 100;
      const dueDay = Number(settings.dueDay) || 10;

      const timeline = generateStudentFeeTimeline({
        student: {
          id: student.id,
          monthlyFee: student.monthlyFee,
          createdAt: student.createdAt,
          status: student.status
        },
        existingPayments: (feePayments || []) as any,
        defaultMonthlyFee,
        lateFeeAmount,
        dueDay
      });

      const pendingMonths = timeline.filter(
        (m) => m.status === 'UNPAID' || m.status === 'OVERDUE' || m.status === 'PAYMENT_PENDING'
      );
      const totalDueAmount = pendingMonths.reduce((acc, m) => acc + m.totalAmount, 0);

      return NextResponse.json({
        success: true,
        student: {
          id: student.id,
          registrationNumber: student.registrationNumber,
          name: student.name,
          branch: student.branchName || 'Main Dojo',
          currentBelt: student.currentBelt,
          monthlyFee: student.monthlyFee || defaultMonthlyFee,
          whatsappNumber: student.whatsappNumber,
          profilePhotoUrl: student.profilePhotoUrl
        },
        timeline,
        summary: {
          totalPendingMonths: pendingMonths.length,
          totalDueAmount,
          dueDay,
          lateFeeAmount
        },
        settings: {
          upiId: settings.upiId || 'championkarate@upi',
          cashfreeEnvironment: settings.cashfreeEnvironment || 'sandbox'
        }
      });
    } catch (error: any) {
      console.error("D1 error looking up student fee:", error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch student fee details: " + (error?.message || String(error)) },
        { status: 500 }
      );
    }
  }

  // 2. Prisma fallback
  try {
    const prisma = getPrisma();
    const student = await prisma.student.findFirst({
      where: {
        status: 'Active',
        OR: [
          { name: { equals: term } },
          { registrationNumber: { equals: term } },
          { password: { equals: term } }
        ]
      },
      include: {
        branch: true,
        feePayments: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!student) {
      return NextResponse.json(
        { success: false, error: "Active student record not found." },
        { status: 404 }
      );
    }

    const settings = await getSiteSettings();
    const defaultMonthlyFee = Number(settings.defaultMonthlyFee) || 700;
    const lateFeeAmount = Number(settings.lateFeeAmount) || 100;
    const dueDay = Number(settings.dueDay) || 10;

    const timeline = generateStudentFeeTimeline({
      student: {
        id: student.id,
        monthlyFee: student.monthlyFee,
        createdAt: student.createdAt,
        status: student.status
      },
      existingPayments: student.feePayments as any,
      defaultMonthlyFee,
      lateFeeAmount,
      dueDay
    });

    const pendingMonths = timeline.filter((m) => m.status === 'UNPAID' || m.status === 'OVERDUE' || m.status === 'PAYMENT_PENDING');
    const totalDueAmount = pendingMonths.reduce((acc, m) => acc + m.totalAmount, 0);

    return NextResponse.json({
      success: true,
      student: {
        id: student.id,
        registrationNumber: student.registrationNumber,
        name: student.name,
        branch: student.branch?.name || 'Main Dojo',
        currentBelt: student.currentBelt,
        monthlyFee: student.monthlyFee || defaultMonthlyFee,
        whatsappNumber: student.whatsappNumber,
        profilePhotoUrl: student.profilePhotoUrl
      },
      timeline,
      summary: {
        totalPendingMonths: pendingMonths.length,
        totalDueAmount,
        dueDay,
        lateFeeAmount
      },
      settings: {
        upiId: settings.upiId || 'championkarate@upi',
        cashfreeEnvironment: settings.cashfreeEnvironment || 'sandbox'
      }
    });
  } catch (error) {
    console.error("Error looking up student fee history:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch student fee details." },
      { status: 500 }
    );
  }
}
