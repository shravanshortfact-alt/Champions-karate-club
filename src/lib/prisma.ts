import { PrismaClient } from '@prisma/client';
import { PrismaD1 } from '@prisma/adapter-d1';
import { getRequestContext } from '@cloudflare/next-on-pages';

let cachedPrisma: PrismaClient | undefined;

function createPrismaClient(): PrismaClient {
  if (cachedPrisma) return cachedPrisma;
  
  try {
    const env = getRequestContext()?.env;
    if (env && env.DB) {
      const adapter = new PrismaD1(env.DB);
      cachedPrisma = new PrismaClient({ adapter });
      return cachedPrisma;
    }
  } catch (e) {
    console.warn("Cloudflare environment not found, falling back to local PrismaClient without adapter if possible");
  }

  cachedPrisma = new PrismaClient();
  return cachedPrisma;
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
