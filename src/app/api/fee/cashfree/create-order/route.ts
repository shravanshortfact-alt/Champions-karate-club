import { getPrisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getSiteSettings } from '@/lib/settings';
import { calculateMonthFeeDetails } from '@/lib/fee-calculator';
import { createCashfreeOrder } from '@/lib/cashfree';

export const dynamic = 'force-dynamic';

const prisma = getPrisma();

export async function POST(request: Request) {
  try {
    const { studentId, selectedMonths } = await request.json();

    if (!studentId || !Array.isArray(selectedMonths) || selectedMonths.length === 0) {
      return NextResponse.json(
        { success: false, error: "Missing student ID or selected months for payment." },
        { status: 400 }
      );
    }

    const student = await prisma.student.findUnique({
      where: { id: studentId }
    });

    if (!student || student.status !== 'Active') {
      return NextResponse.json(
        { success: false, error: "Student record is invalid or inactive." },
        { status: 404 }
      );
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

    // Check if any month is already paid
    for (const item of selectedMonths) {
      const existing = existingPayments.find(
        (p) => p.month === item.month && p.year === item.year
      );
      if (existing && (existing.status === 'PAID' || existing.status === 'Verified')) {
        return NextResponse.json(
          {
            success: false,
            error: `Fee for ${item.month} ${item.year} is already paid. Please uncheck it and try again.`
          },
          { status: 400 }
        );
      }
    }

    // SERVER-SIDE RECALCULATION OF ALL MONTHS
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

    // Generate unique Cashfree Order ID
    const uniqueTag = `${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const cashfreeOrderId = `KFEE_${student.registrationNumber || student.id.slice(-6)}_${uniqueTag}`;
    const orderNumber = `REC-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${uniqueTag.slice(-6)}`;

    // Create or update FeePayment records to PAYMENT_PENDING
    const feePaymentIds: string[] = [];

    for (const item of itemizedDetails) {
      let record;
      if (item.existingId) {
        record = await prisma.feePayment.update({
          where: { id: item.existingId },
          data: {
            baseAmount: item.baseAmount,
            lateFee: item.lateFee,
            totalAmount: item.totalAmount,
            status: 'PAYMENT_PENDING',
            cashfreeOrderId
          }
        });
      } else {
        record = await prisma.feePayment.create({
          data: {
            studentId: student.id,
            month: item.month,
            year: item.year,
            baseAmount: item.baseAmount,
            lateFee: item.lateFee,
            totalAmount: item.totalAmount,
            status: 'PAYMENT_PENDING',
            cashfreeOrderId,
            paymentMethod: 'CASHFREE_UPI'
          }
        });
      }
      feePaymentIds.push(record.id);
    }

    // Call Cashfree API to create Order with server-calculated amount
    const cashfreeRes = await createCashfreeOrder({
      orderId: cashfreeOrderId,
      amount: totalServerAmount,
      studentId: student.id,
      studentName: student.name,
      whatsappNumber: student.whatsappNumber,
      note: `Karate Fee: ${selectedMonths.map(m => `${m.month} ${m.year}`).join(', ')}`
    });

    // Create PaymentOrder record
    const paymentOrder = await prisma.paymentOrder.create({
      data: {
        orderNumber,
        studentId: student.id,
        cashfreeOrderId,
        paymentSessionId: cashfreeRes.paymentSessionId,
        amount: totalServerAmount,
        status: 'PENDING',
        paymentMethod: 'CASHFREE_UPI',
        feePayments: {
          connect: feePaymentIds.map((id) => ({ id }))
        }
      }
    });

    return NextResponse.json({
      success: true,
      orderId: cashfreeOrderId,
      orderNumber,
      paymentSessionId: cashfreeRes.paymentSessionId,
      amount: totalServerAmount,
      isMock: cashfreeRes.isMock,
      environment: cashfreeRes.environment,
      student: {
        name: student.name,
        registrationNumber: student.registrationNumber
      },
      itemizedDetails
    });
  } catch (error: any) {
    console.error("Error creating Cashfree payment order:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create payment order." },
      { status: 500 }
    );
  }
}
