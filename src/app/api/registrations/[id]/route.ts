import { getPrisma } from '@/lib/prisma';
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';



const prisma = getPrisma();

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;
    
    // Safely parse body if present
    let body: any = {};
    try {
      body = await request.json();
    } catch (e) {
      // Body may be empty
    }

    // Find the registration
    const registration = await prisma.registration.findUnique({ where: { id } });
    if (!registration) {
      return NextResponse.json({ error: "Registration not found" }, { status: 404 });
    }

    let extraData: any = {};
    try {
      extraData = JSON.parse(registration.extraData || '{}');
    } catch(e) {}

    const selectedBelt = body.currentBelt || body.belt || registration.appearingBelt || extraData.currentBelt || extraData.belt || 'White Belt';
    extraData.currentBelt = selectedBelt;
    extraData.belt = selectedBelt;

    const newStatus = body.status || 'Verified';

    // Update status and belt on registration
    await prisma.registration.update({
      where: { id },
      data: { 
        status: newStatus,
        appearingBelt: selectedBelt,
        extraData: JSON.stringify(extraData)
      }
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
      appearingBelt: selectedBelt,
      currentBelt: selectedBelt,
      generatedPassword: extraData.generatedPassword || ''
    };

    try {
      if (reg.category === 'Admission' && reg.name) {
        const branch = await prisma.branch.findFirst({ where: { name: reg.branch || 'Main Branch' } });
        let branchId = branch?.id;
        if (!branchId) {
          const newBranch = await prisma.branch.create({ data: { name: reg.branch || 'Main Branch', address: '' } });
          branchId = newBranch.id;
        }

        const existingStudent = await prisma.student.findUnique({
          where: { registrationNumber: reg.id }
        });

        if (existingStudent) {
          // Update existing student's belt
          await prisma.student.update({
            where: { id: existingStudent.id },
            data: {
              currentBelt: selectedBelt,
              ...(reg.profilePhotoUrl ? { profilePhotoUrl: reg.profilePhotoUrl } : {})
            }
          });
        } else if (newStatus === 'Verified') {
          // Create new student with the selected belt
          const generatedPassword = Math.floor(100000 + Math.random() * 900000).toString();
          reg.generatedPassword = generatedPassword; // Store for response

          extraData.generatedPassword = generatedPassword;
          await prisma.registration.update({
            where: { id },
            data: { extraData: JSON.stringify(extraData) }
          });

          await prisma.student.create({
            data: {
              registrationNumber: reg.id,
              name: reg.name,
              age: parseInt(reg.age || '0') || 0,
              branchId: branchId,
              currentBelt: selectedBelt,
              profilePhotoUrl: reg.profilePhotoUrl || null,
              dob: reg.dob || null,
              whatsappNumber: reg.whatsappNumber || null,
              password: generatedPassword
            }
          });
        }
      } else if (reg.name) {
        // For other forms, update student record if found
        const student = await prisma.student.findFirst({
          where: { name: reg.name, status: 'Active' }
        });
        
        if (student) {
          const updateData: any = {};
          if (reg.category === 'Belt Exam' && (body.currentBelt || reg.appearingBelt)) {
            updateData.currentBelt = body.currentBelt || reg.appearingBelt;
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
      registration: { ...reg, status: newStatus },
      generatedPassword: reg.generatedPassword,
      studentName: reg.name,
      whatsappNumber: reg.whatsappNumber,
      studentId: reg.id,
      currentBelt: selectedBelt
    });
  } catch (error) {
    console.error("Error updating registration:", error);
    return NextResponse.json({ error: "Failed to update registration" }, { status: 500 });
  }
}
