import { PrismaClient } from "@prisma/client"
import { PrismaLibSql } from "@prisma/adapter-libsql"
import { createClient } from "@libsql/client"

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined
}

const libsql = createClient({
    url: process.env.DATABASE_URL!,
})

const adapter = new PrismaLibSql(libsql as any)

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
    adapter,
    log: ['query', 'error', 'warn'],
})

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
