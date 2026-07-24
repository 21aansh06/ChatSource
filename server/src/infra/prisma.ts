import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { env } from "../config/env";


const globalForPrisma = globalThis as {
    prisma?: PrismaClient;
};

const connectionString = env.DATABASE_URL;

if (!connectionString) {
    throw new Error("DATABASE_URL is not defined.");
}

const adapter = new PrismaNeon({
    connectionString,
});


export const prisma =
    globalForPrisma.prisma ??
    new PrismaClient({
        adapter,
    });

if (env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prisma;
}