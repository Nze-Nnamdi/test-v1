const fs = require("fs")
const path = require("path")
const { Pool } = require("pg")

// Load .env file manually
const envPath = path.join(__dirname, "..", ".env")
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf8")
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue
    const eqIdx = trimmed.indexOf("=")
    if (eqIdx === -1) continue
    const key = trimmed.slice(0, eqIdx).trim()
    let value = trimmed.slice(eqIdx + 1).trim()
    // Remove surrounding quotes
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    process.env[key] = value
  }
}

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "VoiceNote" (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        "audioUrl" TEXT NOT NULL,
        format TEXT NOT NULL,
        duration INTEGER NOT NULL,
        "sessionId" TEXT,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `)
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_voicenote_createdat ON "VoiceNote" ("createdAt")
    `)
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_voicenote_sessionid ON "VoiceNote" ("sessionId")
    `)
    console.log("Table created successfully")
  } catch (e) {
    console.error("Error:", e.message)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

main()
