import { getPrisma } from '@/lib/prisma';
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';



const prisma = getPrisma();

export async function POST(request: Request) {
  try {
    const { studentName } = await request.json();

    if (!studentName) {
      return NextResponse.json({ success: false, error: "Missing student name." }, { status: 400 });
    }

    const student = await prisma.student.findFirst({
      where: {
        name: { equals: studentName.trim() },
        status: 'Active'
      },
      include: {
        branch: true
      }
    });

    if (!student) {
       return NextResponse.json({ success: false, error: "Student not found or inactive." }, { status: 404 });
    }

    // Determine current month and year
    const now = new Date();
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const currentMonth = monthNames[now.getMonth()];
    const currentYear = now.getFullYear();

    // Check if fee is already paid/pending for this month
    const existingPayment = await prisma.feePayment.findFirst({
      where: {
        studentId: student.id,
        month: currentMonth,
        year: currentYear
      }
    });

    if (existingPayment && existingPayment.status === "Verified") {
      return NextResponse.json({ success: false, error: `Fee for ${currentMonth} ${currentYear} is already paid and verified.` }, { status: 400 });
    }

    if (existingPayment && existingPayment.status === "Pending") {
      return NextResponse.json({ success: false, error: `Fee payment for ${currentMonth} ${currentYear} is currently pending admin verification.` }, { status: 400 });
    }

    // Calculate Late Fee
    // If today's date is > 10, add late fee of 100
    const currentDate = now.getDate();
    let lateFee = 0;
    if (currentDate > 10) {
      lateFee = 100;
    }

    const baseAmount = student.monthlyFee;
    const totalAmount = baseAmount + lateFee;

    // Fetch UPI ID from settings
    let upiId = 'championkarate@upi'; // Default fallback
    try {
      const { getSiteSettings } = await import('@/lib/settings');
      const settings = await getSiteSettings();
      if (settings.upiId) {
        upiId = settings.upiId;
      }
    } catch (e) {
      console.error("Could not fetch settings", e);
    }

    return NextResponse.json({ 
      success: true, 
      student: {
        id: student.id,
        name: student.name,
        branch: student.branch.name,
        monthlyFee: student.monthlyFee,
      },
      feeDetails: {
        month: currentMonth,
        year: currentYear,
        baseAmount,
        lateFee,
        totalAmount
      },
      upiId
    });
  } catch (error) {
    console.error("Error looking up fee details:", error);
    return NextResponse.json({ success: false, error: "Failed to look up fee details" }, { status: 500 });
  }
}
