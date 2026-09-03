import { getPrisma } from '@/lib/prisma';
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

const defaultLocations = [
  {
    id: "loc-telco",
    name: "Telco Colony",
    address: "Telco Colony, Shani Nagar, Ambegaon Budruk, Pune, Maharashtra 411046",
    city: "Pune",
    googleMapsUrl: "https://maps.app.goo.gl/73VSvHFejtk61pPM6?g_st=awb",
    latitude: 18.4539,
    longitude: 73.8373,
    isActive: true,
    timings: "Mon-Sat: 6:00 AM - 9:00 PM",
    programs: "Beginner to Black Belt Training"
  },
  {
    id: "loc-karve",
    name: "Karvenagar",
    address: "Karvenagar, Pune, Maharashtra",
    city: "Pune",
    googleMapsUrl: "https://maps.app.goo.gl/DU7V1mZnAwjWyRKJ8?g_st=awb",
    latitude: 18.4907,
    longitude: 73.8188,
    isActive: true,
    timings: "Mon-Sat: 6:00 AM - 9:00 PM",
    programs: "Beginner to Black Belt Training"
  },
  {
    id: "loc-hadapsar",
    name: "Hadapsar Bhosale Nagar",
    address: "Bhosale Nagar, Hadapsar, Pune, Maharashtra 411028",
    city: "Pune",
    googleMapsUrl: "https://maps.app.goo.gl/aVdBvByNibNTBkMn7?g_st=awb",
    latitude: 18.5089,
    longitude: 73.9260,
    isActive: true,
    timings: "Mon-Sat: 6:00 AM - 9:00 PM",
    programs: "Beginner to Black Belt Training"
  },
  {
    id: "loc-siddhi",
    name: "Siddhivinayak Society",
    address: "Siddhivinayak Society, Pune",
    city: "Pune",
    googleMapsUrl: "https://maps.app.goo.gl/U9ZG4AWhHawuRBJo6?g_st=awb",
    latitude: 18.5204,
    longitude: 73.8567,
    isActive: true,
    timings: "Mon-Sat: 6:00 AM - 9:00 PM",
    programs: "Beginner to Black Belt Training"
  }
];

export async function GET() {
  try {
    const prisma = getPrisma();
    if (prisma && (prisma as any).mapLocation) {
      const locations = await (prisma as any).mapLocation.findMany();
      if (locations && Array.isArray(locations) && locations.length > 0) {
        return NextResponse.json(locations);
      }
    }
  } catch (error) {
    console.error("Error fetching map locations, using defaults:", error);
  }

  return NextResponse.json(defaultLocations);
}
