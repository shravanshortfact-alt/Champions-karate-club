import { PrismaClient } from '@prisma/client';
import { PrismaD1 } from '@prisma/adapter-d1';
import { getRequestContext } from '@cloudflare/next-on-pages';

export function getPrisma(): PrismaClient {
  try {
    const env = getRequestContext()?.env;
    if (env && env.DB) {
      const adapter = new PrismaD1(env.DB);
      return new PrismaClient({ adapter });
    }
  } catch (e) {
    // Fallback if not running in Cloudflare context
    console.warn("Cloudflare environment not found, falling back to local PrismaClient without adapter if possible");
  }

  return new PrismaClient();
}
