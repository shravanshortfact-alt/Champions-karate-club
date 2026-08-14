import { getPrisma } from '@/lib/prisma';
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';


const prisma = getPrisma();

export async function POST(request: Request) {
  try {
    const { whatsappNumber, studentName } = await request.json();

    if (!whatsappNumber || !studentName) {
      return NextResponse.json({ success: false, error: "WhatsApp Number and Student Name are required." }, { status: 400 });
    }

    // Check if a student matches
    const student = await prisma.student.findFirst({
      where: {
        name: { equals: studentName.trim() },
        whatsappNumber: { equals: whatsappNumber.trim() },
        status: 'Active'
      }
    });

    if (!student) {
      return NextResponse.json({ success: false, error: "No active student found with this name and WhatsApp number." }, { status: 404 });
    }

    // Generate 4-digit OTP
    const otpCode = Math.floor(1000 + Math.random() * 9000).toString();

    // Set expiry to 5 minutes from now
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 5);

    // Save to DB
    await prisma.otpVerification.create({
      data: {
        whatsappNumber: whatsappNumber.trim(),
        studentName: studentName.trim(),
        otpCode,
        expiresAt
      }
    });

    // SIMULATE SENDING OTP
    // In a real scenario, you would call a WhatsApp API provider here.
    console.log(`[SIMULATION] OTP for ${studentName} is: ${otpCode}`);

    return NextResponse.json({ success: true, simulatedOtp: otpCode });
  } catch (error) {
    console.error("Error sending OTP:", error);
    return NextResponse.json({ success: false, error: "Failed to send OTP" }, { status: 500 });
  }
}
