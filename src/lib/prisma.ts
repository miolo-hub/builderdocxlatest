import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function isPrismaClientCurrent(client: PrismaClient): boolean {
  // Dev hot-reload can keep an old singleton from before schema changes (e.g. Builder model).
  return typeof (client as PrismaClient & { builder?: unknown }).builder !== "undefined";
}

export function getPrisma(): PrismaClient {
  if (globalForPrisma.prisma && isPrismaClientCurrent(globalForPrisma.prisma)) {
    return globalForPrisma.prisma;
  }
  globalForPrisma.prisma = undefined;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }
  const adapter = new PrismaPg({ connectionString });
  const client = new PrismaClient({ adapter });
  globalForPrisma.prisma = client;
  return client;
}

export function isDatabaseConfigured(): boolean {
  return !!process.env.DATABASE_URL;
}
