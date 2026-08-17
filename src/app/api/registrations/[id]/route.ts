import { getPrisma } from '@/lib/prisma';
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';

export const runtime = 'edge';



const prisma = getPrisma();

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;
    
    // Find the registration
    const registration = await prisma.registration.findUnique({ where: { id } });
    if (!registration) {
      return NextResponse.json({ error: "Registration not found" }, { status: 404 });
    }

    // Update status to verified
    await prisma.registration.update({
      where: { id },
      data: { status: 'Verified' }
    });

    // Extract fields safely
    const reg = {
      id: registration.id,
      category: registration.category,
      name: registration.name,
      age: registration.age,
      branch: registration.branch,
      profilePhotoUrl: registration.profilePhotoUrl,
      dob: registration.dob,
      whatsappNumber: registration.whatsappNumber,
      appearingBelt: registration.appearingBelt,
      generatedPassword: ''
    };

    try {
      if (reg.category === 'Admission' && reg.name) {
        // Create new student
        const branch = await prisma.branch.findFirst({ where: { name: reg.branch || 'Main Branch' } });
        let branchId = branch?.id;
        if (!branchId) {
          const newBranch = await prisma.branch.create({ data: { name: reg.branch || 'Main Branch', address: '' } });
          branchId = newBranch.id;
        }

        const generatedPassword = Math.floor(100000 + Math.random() * 900000).toString();
        reg.generatedPassword = generatedPassword; // Temporary store for response

        // Save password in extraData so admin can see it later
        let newExtraData: any = {};
        try { newExtraData = JSON.parse(registration.extraData || '{}'); } catch(e){}
        newExtraData.generatedPassword = generatedPassword;
        await prisma.registration.update({
          where: { id },
          data: { extraData: JSON.stringify(newExtraData) }
        });

        await prisma.student.create({
          data: {
            registrationNumber: reg.id,
            name: reg.name,
            age: parseInt(reg.age || '0') || 0,
            branchId: branchId,
            currentBelt: 'White Belt',
            profilePhotoUrl: reg.profilePhotoUrl || null,
            dob: reg.dob || null,
            whatsappNumber: reg.whatsappNumber || null,
            password: generatedPassword
          }
        });
      } else if (reg.name) {
        // For other forms, update profile photo if provided
        const student = await prisma.student.findFirst({
          where: { name: reg.name, status: 'Active' }
        });
        
        if (student) {
          const updateData: any = {};
          if (reg.category === 'Belt Exam' && reg.appearingBelt) {
            updateData.currentBelt = reg.appearingBelt;
          }
          if (reg.profilePhotoUrl) {
            updateData.profilePhotoUrl = reg.profilePhotoUrl;
          }
          
          if (Object.keys(updateData).length > 0) {
            await prisma.student.update({
              where: { id: student.id },
              data: updateData
            });
          }
        }
      }
    } catch (e) {
      console.error("Failed to sync with Prisma", e);
    }

    return NextResponse.json({ 
      success: true, 
      registration: { ...reg, status: 'Verified' },
      generatedPassword: reg.generatedPassword,
      studentName: reg.name,
      whatsappNumber: reg.whatsappNumber,
      studentId: reg.id
    });
  } catch (error) {
    console.error("Error updating registration:", error);
    return NextResponse.json({ error: "Failed to update registration" }, { status: 500 });
  }
}
