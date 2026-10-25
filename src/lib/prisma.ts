import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("Falta DATABASE_URL en el entorno local.");
}

type PrismaGlobal = typeof globalThis & {
  prisma?: PrismaClient;
};

const prismaGlobal = globalThis as PrismaGlobal;

export const prisma =
  prismaGlobal.prisma ??
  new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });

if (process.env.NODE_ENV !== "production") {
  prismaGlobal.prisma = prisma;
}
