import { getPrisma, getD1 } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { generateStudentFeeTimeline } from '@/lib/fee-calculator';
import { getSiteSettings } from '@/lib/settings';

export const dynamic = 'force-dynamic';

const WORKER_FEE_URL = 'https://karate-club.shravanshortfact.workers.dev/api/fee';

export async function GET(request: Request) {
  const d1 = getD1();
  const { searchParams } = new URL(request.url);
  const statusFilter = searchParams.get('status') || 'ALL'; // PAID, UNPAID, OVERDUE, AWAITING_CONFIRMATION, ALL
  const monthFilter = searchParams.get('month') || 'ALL';
  const yearFilter = searchParams.get('year') ? Number(searchParams.get('year')) : null;

  // Forward to Cloudflare Worker if running on Vercel without direct D1
  if (!d1 && process.env.NODE_ENV === 'production') {
    try {
      const res = await fetch(`${WORKER_FEE_URL}?${searchParams.toString()}`, {
        cache: 'no-store'
      });
      const data = await res.json();
      return NextResponse.json(data, { status: res.status });
    } catch (err: any) {
      console.error("Failed to forward fee query to Cloudflare Worker:", err);
    }
  }

  const settings = await getSiteSettings();
  const defaultMonthlyFee = Number(settings.defaultMonthlyFee) || 700;
  const lateFeeAmount = Number(settings.lateFeeAmount) || 100;
  const dueDay = Number(settings.dueDay) || 10;

  // 1. Direct D1 execution
  if (d1) {
    try {
      const { results: rawStudents } = await d1.prepare(`
        SELECT s.*, b.name as branchName 
        FROM Student s 
        LEFT JOIN Branch b ON s.branchId = b.id 
        WHERE s.status = 'Active' 
        ORDER BY s.name ASC
      `).all();

      const { results: rawPayments } = await d1.prepare(`
        SELECT * FROM FeePayment ORDER BY createdAt DESC
      `).all();

      const students = rawStudents || [];
      const feePayments = rawPayments || [];

      const allRecords: any[] = [];
      const studentSummaries: any[] = [];

      for (const student of students) {
        const studentPayments = feePayments.filter((p: any) => p.studentId === student.id);

        const timeline = generateStudentFeeTimeline({
          student: {
            id: student.id,
            monthlyFee: student.monthlyFee,
            createdAt: student.createdAt,
            status: student.status
          },
          existingPayments: studentPayments as any,
          defaultMonthlyFee,
          lateFeeAmount,
          dueDay
        });

        const pendingMonths = timeline.filter(m => m.status === 'UNPAID' || m.status === 'OVERDUE' || m.status === 'PAYMENT_PENDING' || m.status === 'AWAITING_CONFIRMATION');
        const overdueMonths = timeline.filter(m => m.status === 'OVERDUE');
        const awaitingMonths = timeline.filter(m => m.status === 'AWAITING_CONFIRMATION');
        const totalDue = pendingMonths.reduce((acc, m) => acc + m.totalAmount, 0);

        const lastPaidRecord = studentPayments.find((p: any) => p.status === 'PAID' || p.status === 'Verified');

        studentSummaries.push({
          studentId: student.id,
          studentName: student.name,
          registrationNumber: student.registrationNumber,
          whatsappNumber: student.whatsappNumber,
          branchName: student.branchName || 'Main Dojo',
          currentBelt: student.currentBelt,
          monthlyFee: student.monthlyFee || defaultMonthlyFee,
          pendingCount: pendingMonths.length,
          overdueCount: overdueMonths.length,
          awaitingCount: awaitingMonths.length,
          totalDue,
          lastPaymentDate: lastPaidRecord ? (lastPaidRecord.paidAt || lastPaidRecord.createdAt) : null,
          timeline
        });

        for (const item of timeline) {
          // Status filter
          if (statusFilter && statusFilter !== 'ALL') {
            if (statusFilter === 'PAID' && item.status !== 'PAID') continue;
            if (statusFilter === 'AWAITING_CONFIRMATION' && item.status !== 'AWAITING_CONFIRMATION') continue;
            if (statusFilter === 'OVERDUE' && item.status !== 'OVERDUE') continue;
            if (statusFilter === 'UNPAID' && item.status !== 'UNPAID' && item.status !== 'OVERDUE' && item.status !== 'AWAITING_CONFIRMATION') continue;
          }

          if (monthFilter && monthFilter !== 'ALL' && item.month !== monthFilter) continue;
          if (yearFilter && item.year !== yearFilter) continue;

          allRecords.push({
            id: item.id || `virtual_${student.id}_${item.month}_${item.year}`,
            studentId: student.id,
            studentName: student.name,
            registrationNumber: student.registrationNumber,
            whatsappNumber: student.whatsappNumber,
            branchName: student.branchName || 'Main Dojo',
            month: item.month,
            year: item.year,
            baseAmount: item.baseAmount,
            lateFee: item.lateFee,
            totalAmount: item.totalAmount,
            status: item.status,
            lateFeeWaived: item.lateFeeWaived,
            waiverReason: item.waiverReason,
            paymentMethod: item.paymentMethod,
            paymentReference: item.paymentReference,
            utr: item.utr,
            paidAt: item.paidAt,
            createdAt: item.createdAt
          });
        }
      }

      return NextResponse.json({
        records: allRecords,
        students: studentSummaries,
        settings: {
          defaultMonthlyFee,
          lateFeeAmount,
          dueDay
        }
      });
    } catch (d1Err: any) {
      console.error("D1 error in fee route:", d1Err);
    }
  }

  // 2. Prisma fallback
  try {
    const prisma = getPrisma();
    const students = await prisma.student.findMany({
      where: { status: 'Active' },
      include: {
        branch: true,
        feePayments: {
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: { name: 'asc' }
    });

    const allRecords: any[] = [];
    const studentSummaries: any[] = [];

    for (const student of students) {
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

      const pendingMonths = timeline.filter(m => m.status === 'UNPAID' || m.status === 'OVERDUE' || m.status === 'PAYMENT_PENDING' || m.status === 'AWAITING_CONFIRMATION');
      const overdueMonths = timeline.filter(m => m.status === 'OVERDUE');
      const awaitingMonths = timeline.filter(m => m.status === 'AWAITING_CONFIRMATION');
      const totalDue = pendingMonths.reduce((acc, m) => acc + m.totalAmount, 0);

      const lastPaidRecord = student.feePayments.find(p => p.status === 'PAID' || p.status === 'Verified');

      studentSummaries.push({
        studentId: student.id,
        studentName: student.name,
        registrationNumber: student.registrationNumber,
        whatsappNumber: student.whatsappNumber,
        branchName: student.branch?.name || 'Main Dojo',
        currentBelt: student.currentBelt,
        monthlyFee: student.monthlyFee || defaultMonthlyFee,
        pendingCount: pendingMonths.length,
        overdueCount: overdueMonths.length,
        awaitingCount: awaitingMonths.length,
        totalDue,
        lastPaymentDate: lastPaidRecord ? (lastPaidRecord.paidAt || lastPaidRecord.createdAt) : null,
        timeline
      });

      for (const item of timeline) {
        if (statusFilter && statusFilter !== 'ALL') {
          if (statusFilter === 'PAID' && item.status !== 'PAID') continue;
          if (statusFilter === 'AWAITING_CONFIRMATION' && item.status !== 'AWAITING_CONFIRMATION') continue;
          if (statusFilter === 'OVERDUE' && item.status !== 'OVERDUE') continue;
          if (statusFilter === 'UNPAID' && item.status !== 'UNPAID' && item.status !== 'OVERDUE' && item.status !== 'AWAITING_CONFIRMATION') continue;
        }

        if (monthFilter && monthFilter !== 'ALL' && item.month !== monthFilter) continue;
        if (yearFilter && item.year !== yearFilter) continue;

        allRecords.push({
          id: item.id || `virtual_${student.id}_${item.month}_${item.year}`,
          studentId: student.id,
          studentName: student.name,
          registrationNumber: student.registrationNumber,
          whatsappNumber: student.whatsappNumber,
          branchName: student.branch?.name || 'Main Dojo',
          month: item.month,
          year: item.year,
          baseAmount: item.baseAmount,
          lateFee: item.lateFee,
          totalAmount: item.totalAmount,
          status: item.status,
          lateFeeWaived: item.lateFeeWaived,
          waiverReason: item.waiverReason,
          paymentMethod: item.paymentMethod,
          paymentReference: (item as any).paymentReference,
          utr: (item as any).utr,
          paidAt: item.paidAt,
          createdAt: item.createdAt
        });
      }
    }

    return NextResponse.json({
      records: allRecords,
      students: studentSummaries,
      settings: {
        defaultMonthlyFee,
        lateFeeAmount,
        dueDay
      }
    });
  } catch (error) {
    console.error("Error fetching fee payments:", error);
    return NextResponse.json({ error: "Failed to fetch fee payments" }, { status: 500 });
  }
}
