import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaLibSQL } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'

const libsql = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
})

const adapter = new PrismaLibSQL(libsql)
const prisma = new PrismaClient({ adapter } as any)

async function main() {
  try {
    console.log('Testing Prisma + Turso connection...')
    const user = await prisma.user.findUnique({
      where: { id: 'demo-user-001' },
    })
    console.log('User found:', user)
  } catch (e) {
    console.error('Error:', e)
  } finally {
    await prisma.$disconnect()
  }
}

main()
