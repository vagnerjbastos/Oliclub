import { PrismaClient } from '@prisma/client'
import { PrismaLibSQL } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  const dbUrl = process.env.DATABASE_URL || 'file:./db/custom.db'
  const authToken = process.env.TURSO_AUTH_TOKEN

  if (dbUrl.startsWith('libsql://')) {
    const libsql = createClient({ url: dbUrl, authToken })
    const adapter = new PrismaLibSQL(libsql)
    return new PrismaClient({ adapter, log: process.env.NODE_ENV !== 'production' ? ['query'] : [] })
  }

  return new PrismaClient({
    log: process.env.NODE_ENV !== 'production' ? ['query'] : [],
  })
}

export const db = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
