import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined
}

function createPrismaClient() {
    const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:Amul1234sharma@db.zmvntgzkwijlclmrtibi.supabase.co:5432/postgres'

    // Add sslmode for production (Vercel) if not already present
    const connStr = connectionString.includes('sslmode')
        ? connectionString
        : connectionString + '?sslmode=require'

    const adapter = new PrismaPg({ connectionString: connStr })
    return new PrismaClient({ adapter })
}

export const db = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
