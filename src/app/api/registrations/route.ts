import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const dataFile = path.join(process.cwd(), 'data', 'registrations.json');

// Ensure data file exists
async function ensureFile() {
  try {
    await fs.access(dataFile);
  } catch (error) {
    await fs.writeFile(dataFile, JSON.stringify([]));
  }
}

export async function GET() {
  try {
    await ensureFile();
    const data = await fs.readFile(dataFile, 'utf8');
    return NextResponse.json(JSON.parse(data));
  } catch (error) {
    console.error("Error reading registrations:", error);
    return NextResponse.json({ error: "Failed to load registrations" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await ensureFile();
    const data = await fs.readFile(dataFile, 'utf8');
    const registrations = JSON.parse(data);

    const newRegistration = await request.json();
    
    // Add missing metadata
    const idPrefix = newRegistration.category === 'Admission' ? 'CKC' : 
                     newRegistration.category === 'Belt Exam' ? 'EXM' : 
                     newRegistration.category === 'Competition' ? 'CMP' : 'SEM';
                     
    newRegistration.id = `${idPrefix}-${Math.floor(1000 + Math.random() * 9000)}`;
    newRegistration.status = 'Pending';
    newRegistration.createdAt = new Date().toISOString();
    newRegistration.month = new Date().toLocaleString('en-US', { month: 'long' });

    registrations.unshift(newRegistration);
    
    await fs.writeFile(dataFile, JSON.stringify(registrations, null, 2));

    // Automatic Belt Upgrade if it's a Belt Exam
    if (newRegistration.category === 'Belt Exam' && newRegistration.name && newRegistration.appearingBelt) {
      try {
        const { PrismaClient } = require('@prisma/client');
        const prisma = new PrismaClient();
        
        const student = await prisma.student.findFirst({
          where: { name: newRegistration.name, status: 'Active' }
        });
        
        if (student) {
          await prisma.student.update({
            where: { id: student.id },
            data: { currentBelt: newRegistration.appearingBelt }
          });
        }
      } catch (e) {
        console.error("Failed to automatically upgrade belt in Prisma", e);
      }
    }

    return NextResponse.json({ success: true, id: newRegistration.id });
  } catch (error) {
    console.error("Error saving registration:", error);
    return NextResponse.json({ error: "Failed to save registration" }, { status: 500 });
  }
}
