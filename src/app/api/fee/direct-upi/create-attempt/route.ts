import { getPrisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getSiteSettings } from '@/lib/settings';
import { calculateMonthFeeDetails, MONTH_NAMES } from '@/lib/fee-calculator';

export const dynamic = 'force-dynamic';

const prisma = getPrisma();

export async function POST(request: Request) {
  try {
    const { studentId, selectedMonths } = await request.json();

    if (!studentId || !Array.isArray(selectedMonths) || selectedMonths.length === 0) {
      return NextResponse.json(
        { success: false, error: "Missing student ID or selected months." },
        { status: 400 }
      );
    }

    // SERVER RESOLUTION: Fetch student with branch and branch teacher
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
    let destinationUpiName = teacher?.upiDisplayName || teacher?.name || 'Karate Sensei';
    let teacherId = teacher?.id || null;

    // Fallback to global UPI ID if branch has no teacher assigned
    if (!destinationUpiId) {
      const settings = await getSiteSettings();
      destinationUpiId = settings.upiId || 'championkarate@upi';
      destinationUpiName = 'Champions Karate Club';
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
