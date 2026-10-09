import { getPrisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const prisma = getPrisma();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    let teacherId = searchParams.get('teacherId');

    if (!teacherId) {
      // Check cookie
      const cookieHeader = request.headers.get('cookie') || '';
      const match = cookieHeader.match(/teacher_session_id=([^;]+)/);
      if (match) {
        teacherId = match[1];
      }
    }

    if (!teacherId) {
      return NextResponse.json({ success: false, error: "Unauthorized teacher session." }, { status: 401 });
    }

    const teacher = await prisma.teacher.findUnique({
      where: { id: teacherId },
      include: { branches: true }
    });

    if (!teacher) {
      return NextResponse.json({ success: false, error: "Teacher account not found." }, { status: 404 });
    }

    const assignedBranchIds = teacher.branches.map(b => b.id);

    // SERVER-SIDE DATA ISOLATION QUERY: Only fetch payments for teacher's assigned branches or teacherId
    const feePayments = await prisma.feePayment.findMany({
      where: {
        OR: [
          { teacherId: teacher.id },
          { branchId: { in: assignedBranchIds } },
          { student: { branchId: { in: assignedBranchIds } } }
        ]
      },
      include: {
        student: {
          include: { branch: true }
        },
        branch: true,
        teacher: {
          select: { id: true, name: true, upiId: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Also fetch PaymentOrders
    const paymentOrders = await prisma.paymentOrder.findMany({
      where: {
        OR: [
          { teacherId: teacher.id },
          { branchId: { in: assignedBranchIds } },
          { student: { branchId: { in: assignedBranchIds } } }
        ]
      },
      include: {
        student: {
          include: { branch: true }
        },
        feePayments: true
      },
      orderBy: { createdAt: 'desc' }
    });

    const awaitingConfirmations = feePayments.filter(p => p.status === 'AWAITING_CONFIRMATION' || p.status === 'Pending');
    const confirmedPaid = feePayments.filter(p => p.status === 'PAID' || p.status === 'Verified');
    const unverified = feePayments.filter(p => p.status === 'PAYMENT_NOT_VERIFIED');

    return NextResponse.json({
      success: true,
      teacher: {
        id: teacher.id,
        name: teacher.name,
        upiId: teacher.upiId,
        upiDisplayName: teacher.upiDisplayName,
        paymentEnabled: teacher.paymentEnabled,
        branches: teacher.branches.map(b => b.name)
      },
      stats: {
        awaitingCount: awaitingConfirmations.length,
        confirmedCount: confirmedPaid.length,
        unverifiedCount: unverified.length,
        totalCollectedAmount: confirmedPaid.reduce((acc, p) => acc + p.totalAmount, 0)
      },
      feePayments,
      paymentOrders
    });
  } catch (error: any) {
    console.error("Error fetching teacher payments:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch teacher payments." }, { status: 500 });
  }
}
