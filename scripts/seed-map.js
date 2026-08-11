const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const branches = [
    {
      name: "Telco Colony",
      address: "Telco Colony, Shani Nagar, Ambegaon Budruk, Pune, Maharashtra 411046",
      city: "Pune",
      googleMapsUrl: "https://maps.app.goo.gl/73VSvHFejtk61pPM6?g_st=awb",
      latitude: 18.4539,
      longitude: 73.8373,
      isActive: true,
    },
    {
      name: "Karvenagar",
      address: "Karvenagar, Pune, Maharashtra",
      city: "Pune",
      googleMapsUrl: "https://maps.app.goo.gl/DU7V1mZnAwjWyRKJ8?g_st=awb",
      latitude: 18.4907,
      longitude: 73.8188,
      isActive: true,
    },
    {
      name: "Hadapsar Bhosale Nagar",
      address: "Bhosale Nagar, Hadapsar, Pune, Maharashtra 411028",
      city: "Pune",
      googleMapsUrl: "https://maps.app.goo.gl/aVdBvByNibNTBkMn7?g_st=awb",
      latitude: 18.5089,
      longitude: 73.9260,
      isActive: true,
    },
    {
      name: "Siddhivinayak Society",
      address: "Siddhivinayak Society, Pune",
      city: "Pune",
      googleMapsUrl: "https://maps.app.goo.gl/U9ZG4AWhHawuRBJo6?g_st=awb",
      latitude: 18.5204, // Default Pune center approx
      longitude: 73.8567,
      isActive: true,
    }
  ];

  for (const branch of branches) {
    await prisma.mapLocation.create({
      data: branch
    });
    console.log(`Added ${branch.name}`);
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
