import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const dataFile = path.join(process.cwd(), 'data', 'registrations.json');

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;
    
    // Read the current data
    const data = await fs.readFile(dataFile, 'utf8');
    const registrations = JSON.parse(data);

    // Find the registration and update it
    const index = registrations.findIndex((r: any) => r.id === id);
    if (index === -1) {
      return NextResponse.json({ error: "Registration not found" }, { status: 404 });
    }

    registrations[index].status = 'Verified';

    // Handle specific logic on verification
    const reg = registrations[index];
    try {
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();

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

        await prisma.student.create({
          data: {
            registrationNumber: reg.id,
            name: reg.name,
            age: parseInt(reg.age) || 0,
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

    // Save back to file
    await fs.writeFile(dataFile, JSON.stringify(registrations, null, 2));

    return NextResponse.json({ 
      success: true, 
      registration: registrations[index],
      generatedPassword: reg.generatedPassword,
      studentName: reg.name,
      whatsappNumber: reg.whatsappNumber
    });
  } catch (error) {
    console.error("Error updating registration:", error);
    return NextResponse.json({ error: "Failed to update registration" }, { status: 500 });
  }
}
