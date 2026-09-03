import { PrismaClient } from '@prisma/client';
import { PrismaD1 } from '@prisma/adapter-d1';

let cachedPrisma: PrismaClient | undefined;

function createPrismaClient(): PrismaClient {
  if (cachedPrisma) return cachedPrisma;
  
  try {
    const opennext = require('@opennextjs/cloudflare');
    const env = opennext?.getCloudflareContext?.()?.env;
    if (env && env.DB) {
      const adapter = new PrismaD1(env.DB);
      cachedPrisma = new PrismaClient({ adapter });
      return cachedPrisma;
    }
  } catch (e) {
    // Cloudflare context not available (e.g. Vercel or local Node dev)
  }

  try {
    cachedPrisma = new PrismaClient();
    return cachedPrisma;
  } catch (e) {
    console.error("PrismaClient initialization error:", e);
    throw e;
  }
}

const prismaProxy = new Proxy({} as PrismaClient, {
  get(target, prop) {
    const client = createPrismaClient();
    const value = (client as any)[prop];
    if (typeof value === 'function') {
      return value.bind(client);
    }
    return value;
  }
});

export function getPrisma(): PrismaClient {
  return prismaProxy;
}
