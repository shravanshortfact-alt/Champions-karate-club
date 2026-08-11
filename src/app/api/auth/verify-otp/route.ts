export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const { whatsappNumber, studentName, otpCode } = await request.json();

    if (!whatsappNumber || !studentName || !otpCode) {
      return NextResponse.json({ success: false, error: "Missing required fields." }, { status: 400 });
    }

    // Find the latest unverified OTP record for this user
    const otpRecord = await prisma.otpVerification.findFirst({
      where: {
        whatsappNumber: { equals: whatsappNumber.trim() },
        studentName: { equals: studentName.trim() },
        otpCode: { equals: otpCode.trim() },
        verified: false,
        expiresAt: {
          gt: new Date() // Must not be expired
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (!otpRecord) {
      return NextResponse.json({ success: false, error: "Invalid or expired OTP." }, { status: 400 });
    }

    // Mark as verified
    await prisma.otpVerification.update({
      where: { id: otpRecord.id },
      data: { verified: true }
    });

    // Get the student record to return ID or name as a token
    const student = await prisma.student.findFirst({
      where: {
        name: { equals: studentName.trim() },
        whatsappNumber: { equals: whatsappNumber.trim() },
        status: 'Active'
      }
    });

    if (!student) {
       return NextResponse.json({ success: false, error: "Student not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true, token: student.id, studentName: student.name });
  } catch (error) {
    console.error("Error verifying OTP:", error);
    return NextResponse.json({ success: false, error: "Failed to verify OTP" }, { status: 500 });
  }
}
