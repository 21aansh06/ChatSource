import { PrismaClient } from '@prisma/client';
import { env } from '../config/env.js';

// Singleton instance of PrismaClient for Neon Postgres relational storage
declare global {
  var prismaGlobal: PrismaClient | undefined;
}

export const prisma = globalThis.prismaGlobal ?? new PrismaClient({
  datasources: {
    db: {
      url: env.DATABASE_URL,
    },
  },
});

if (process.env.NODE_ENV !== 'production') {
  globalThis.prismaGlobal = prisma;
}
