import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const dataFile = path.join(process.cwd(), 'data', 'registrations.json');

export async function GET(
  request: Request,
  { params }: { params: Promise<{ regNo: string }> | { regNo: string } }
) {
  try {
    const resolvedParams = await params;
    const { regNo } = resolvedParams;
    
    let data;
    try {
      data = await fs.readFile(dataFile, 'utf8');
    } catch (e) {
      return NextResponse.json({ error: "No records found" }, { status: 404 });
    }
    
    const registrations = JSON.parse(data);

    // Search by ID or Name (case insensitive)
    const searchTerm = regNo.trim().toLowerCase();
    const mainReg = registrations.find(
      (r: any) => 
        (r.id && r.id.toLowerCase() === searchTerm) || 
        (r.name && r.name.toLowerCase() === searchTerm)
    );
    
    if (!mainReg) {
      return NextResponse.json({ error: "No records found for this ID or Name" }, { status: 404 });
    }

    const studentName = mainReg.name;
    // Get all records for this student from registrations.json
    const allRecords = registrations.filter(
      (r: any) => r.name && r.name.toLowerCase() === studentName.toLowerCase()
    );

    // Fetch from Prisma for profile photo and achievements
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    let profile = null;
    let achievements = [];
    try {
      const student = await prisma.student.findFirst({
        where: { name: { equals: studentName } },
        include: {
          achievements: {
            where: { status: { not: 'Rejected' } },
            include: { event: true },
            orderBy: { createdAt: 'desc' }
          }
        }
      });
      if (student) {
        // Calculate Rank
        const allStudents = await prisma.student.findMany({
          where: { status: 'Active' },
          select: { id: true, totalPoints: true },
          orderBy: { totalPoints: 'desc' }
        });
        const rankIndex = allStudents.findIndex((s: any) => s.id === student.id);
        const globalRank = rankIndex !== -1 ? rankIndex + 1 : '-';

        profile = {
          id: student.id,
          currentBelt: student.currentBelt,
          totalPoints: student.totalPoints,
          profilePhotoUrl: student.profilePhotoUrl,
          globalRank
        };
        achievements = student.achievements;
      }
    } catch (e) {
      console.error("Prisma error", e);
    }

    return NextResponse.json({
      registrations: allRecords,
      profile,
      achievements
    });
  } catch (error) {
    console.error("Error fetching student data:", error);
    return NextResponse.json({ error: "Failed to fetch student data" }, { status: 500 });
  }
}
