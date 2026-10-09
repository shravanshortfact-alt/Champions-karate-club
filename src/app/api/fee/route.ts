import { getPrisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { generateStudentFeeTimeline } from '@/lib/fee-calculator';
import { getSiteSettings } from '@/lib/settings';

export const dynamic = 'force-dynamic';

const prisma = getPrisma();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get('status'); // PAID, UNPAID, OVERDUE, ALL
    const monthFilter = searchParams.get('month');
    const yearFilter = searchParams.get('year') ? Number(searchParams.get('year')) : null;

    const settings = await getSiteSettings();
    const defaultMonthlyFee = Number(settings.defaultMonthlyFee) || 700;
    const lateFeeAmount = Number(settings.lateFeeAmount) || 100;
    const dueDay = Number(settings.dueDay) || 10;

    // Fetch all active students with their branch & fee payments
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

      const pendingMonths = timeline.filter(m => m.status === 'UNPAID' || m.status === 'OVERDUE' || m.status === 'PAYMENT_PENDING');
      const overdueMonths = timeline.filter(m => m.status === 'OVERDUE');
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
        totalDue,
        lastPaymentDate: lastPaidRecord ? (lastPaidRecord.paidAt || lastPaidRecord.createdAt) : null,
        timeline
      });

      // Flatten timeline records for tabular display
      for (const item of timeline) {
        // Apply filters if passed
        if (statusFilter && statusFilter !== 'ALL') {
          if (statusFilter === 'PAID' && item.status !== 'PAID') continue;
          if (statusFilter === 'UNPAID' && item.status !== 'UNPAID' && item.status !== 'OVERDUE') continue;
          if (statusFilter === 'OVERDUE' && item.status !== 'OVERDUE') continue;
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

export async function PATCH(request: Request) {
  try {
    const { id, status } = await request.json();

    if (!id || !status) {
      return NextResponse.json({ success: false, error: "Missing fields" }, { status: 400 });
    }

    const updated = await prisma.feePayment.update({
      where: { id },
      data: {
        status,
        paidAt: (status === 'Verified' || status === 'PAID') ? new Date() : undefined
      }
    });

    return NextResponse.json({ success: true, payment: updated });
  } catch (error) {
    console.error("Error updating fee payment:", error);
    return NextResponse.json({ success: false, error: "Failed to update fee payment" }, { status: 500 });
  }
}
