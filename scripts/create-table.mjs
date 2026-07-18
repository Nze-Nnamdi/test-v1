import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

try {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "VoiceNote" (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
      "audioUrl" TEXT NOT NULL,
      format TEXT NOT NULL,
      duration INTEGER NOT NULL,
      "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `)
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS idx_voicenote_createdat ON "VoiceNote" ("createdAt")
  `)
  console.log("Table created successfully")
  await prisma.$disconnect()
} catch (e) {
  console.error("Error:", e.message)
  await prisma.$disconnect()
  process.exit(1)
}
