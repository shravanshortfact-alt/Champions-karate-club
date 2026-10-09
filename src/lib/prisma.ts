import { PrismaClient } from '@prisma/client';
import { PrismaD1 } from '@prisma/adapter-d1';

let cachedD1Prisma: PrismaClient | undefined;
let cachedNodePrisma: PrismaClient | undefined;

export function getD1(): any {
  try {
    const opennext = require('@opennextjs/cloudflare');
    const env = opennext?.getCloudflareContext?.()?.env;
    if (env && env.DB) return env.DB;
  } catch (e) {}

  try {
    if (typeof process !== 'undefined' && (process.env as any)?.DB) {
      return (process.env as any).DB;
    }
    if (typeof globalThis !== 'undefined' && (globalThis as any)?.DB) {
      return (globalThis as any).DB;
    }
    if (typeof globalThis !== 'undefined' && (globalThis as any)?.__env__?.DB) {
      return (globalThis as any).__env__.DB;
    }
  } catch (e) {}

  return null;
}

export function createPrismaClient(): PrismaClient {
  const d1 = getD1();
  if (d1) {
    if (!cachedD1Prisma) {
      const adapter = new PrismaD1(d1);
      cachedD1Prisma = new PrismaClient({ adapter });
    }
    return cachedD1Prisma;
  }

  if (!cachedNodePrisma) {
    cachedNodePrisma = new PrismaClient();
  }
  return cachedNodePrisma;
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
