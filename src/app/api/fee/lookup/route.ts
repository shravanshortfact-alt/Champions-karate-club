import { getPrisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { generateStudentFeeTimeline } from '@/lib/fee-calculator';
import { getSiteSettings } from '@/lib/settings';

export const dynamic = 'force-dynamic';

const prisma = getPrisma();

export async function POST(request: Request) {
  try {
    const { studentName, registrationNumber } = await request.json();

    if (!studentName && !registrationNumber) {
      return NextResponse.json(
        { success: false, error: "Please provide a Student Name or Registration Number." },
        { status: 400 }
      );
    }

    // Build search query
    const whereClause: any = { status: 'Active' };
    if (registrationNumber) {
      whereClause.registrationNumber = { equals: registrationNumber.trim() };
    } else if (studentName) {
      whereClause.name = { equals: studentName.trim() };
    }

    const student = await prisma.student.findFirst({
      where: whereClause,
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

    // Summary calculations
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
