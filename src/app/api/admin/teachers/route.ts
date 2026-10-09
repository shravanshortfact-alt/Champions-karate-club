import { getPrisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const prisma = getPrisma();

// GET all teachers and branches
export async function GET(request: Request) {
  try {
    const teachers = await prisma.teacher.findMany({
      include: {
        branches: true,
        _count: {
          select: { feePayments: true }
        }
      },
      orderBy: { name: 'asc' }
    });

    const branches = await prisma.branch.findMany({
      include: {
        teacher: {
          select: { id: true, name: true, upiId: true, upiDisplayName: true }
        }
      },
      orderBy: { name: 'asc' }
    });

    return NextResponse.json({
      success: true,
      teachers,
      branches
    });
  } catch (error: any) {
    console.error("Error fetching teachers:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch teachers" }, { status: 500 });
  }
}

// POST create new teacher
export async function POST(request: Request) {
  try {
    const { name, username, password, upiId, upiDisplayName, paymentEnabled = true } = await request.json();

    if (!name || !username || !password) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: name, username, password." },
        { status: 400 }
      );
    }

    const existing = await prisma.teacher.findUnique({
      where: { username: username.trim() }
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: "Teacher username already exists. Please choose another." },
        { status: 400 }
      );
    }

    const teacher = await prisma.teacher.create({
      data: {
        name: name.trim(),
        username: username.trim(),
        password: password.trim(),
        upiId: upiId ? upiId.trim() : null,
        upiDisplayName: upiDisplayName ? upiDisplayName.trim() : name.trim(),
        paymentEnabled: Boolean(paymentEnabled)
      }
    });

    return NextResponse.json({
      success: true,
      message: `Teacher ${teacher.name} created successfully!`,
      teacher
    });
  } catch (error: any) {
    console.error("Error creating teacher:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to create teacher" }, { status: 500 });
  }
}

// PATCH update teacher info or assign branch to teacher
export async function PATCH(request: Request) {
  try {
    const { teacherId, name, password, upiId, upiDisplayName, paymentEnabled, assignBranchId } = await request.json();

    if (assignBranchId && teacherId) {
      // Assign or reassign branch to teacher
      const updatedBranch = await prisma.branch.update({
        where: { id: assignBranchId },
        data: {
          teacherId: teacherId === 'NONE' ? null : teacherId
        },
        include: { teacher: true }
      });

      return NextResponse.json({
        success: true,
        message: `Branch ${updatedBranch.name} assigned to ${updatedBranch.teacher?.name || 'Unassigned'}!`,
        branch: updatedBranch
      });
    }

    if (!teacherId) {
      return NextResponse.json({ success: false, error: "Missing teacherId for update." }, { status: 400 });
    }

    const updateData: any = {};
    if (name) updateData.name = name.trim();
    if (password) updateData.password = password.trim();
    if (upiId !== undefined) updateData.upiId = upiId ? upiId.trim() : null;
    if (upiDisplayName !== undefined) updateData.upiDisplayName = upiDisplayName ? upiDisplayName.trim() : null;
    if (paymentEnabled !== undefined) updateData.paymentEnabled = Boolean(paymentEnabled);

    const updatedTeacher = await prisma.teacher.update({
      where: { id: teacherId },
      data: updateData
    });

    return NextResponse.json({
      success: true,
      message: `Teacher ${updatedTeacher.name} updated successfully!`,
      teacher: updatedTeacher
    });
  } catch (error: any) {
    console.error("Error updating teacher:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to update teacher" }, { status: 500 });
  }
}
