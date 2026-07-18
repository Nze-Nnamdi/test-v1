import { Pool } from "pg"

let pool: Pool | null = null
let prismaInstance: any = null

function getPool() {
  if (pool) return pool
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error("Missing DATABASE_URL environment variable")
  }
  pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
  })
  return pool
}

function mapNote(row: any) {
  if (!row) return null
  return {
    id: row.id,
    audioUrl: row.audiourl ?? row.audioUrl,
    format: row.format,
    duration: row.duration,
    createdAt: row.createdat ?? row.createdAt,
  }
}

export async function getPrisma() {
  if (prismaInstance) return prismaInstance

  prismaInstance = {
    voiceNote: {
      async create({ data }: { data: { audioUrl: string; format: string; duration: number } }) {
        const p = getPool()
        const result = await p.query(
          `INSERT INTO "VoiceNote" ("audioUrl", format, duration) VALUES ($1, $2, $3) RETURNING *`,
          [data.audioUrl, data.format, data.duration]
        )
        return mapNote(result.rows[0])
      },
      async findUnique({ where }: { where: { id: string } }) {
        const p = getPool()
        const result = await p.query(
          `SELECT * FROM "VoiceNote" WHERE id = $1`,
          [where.id]
        )
        return mapNote(result.rows[0] || null)
      },
      async delete({ where }: { where: { id: string } }) {
        const p = getPool()
        const result = await p.query(
          `DELETE FROM "VoiceNote" WHERE id = $1 RETURNING *`,
          [where.id]
        )
        return mapNote(result.rows[0])
      },
      async findMany({
        take,
        orderBy,
        cursor,
        skip,
      }: {
        take?: number
        orderBy?: Record<string, "asc" | "desc">
        cursor?: { createdAt?: Date }
        skip?: number
      }) {
        const p = getPool()
        const orderCol = Object.keys(orderBy || { createdAt: "desc" })[0] || "createdAt"
        const orderDir = (orderBy as any)?.[orderCol] || "desc"

        let result
        if (cursor?.createdAt) {
          const operator = orderDir === "desc" ? "<=" : ">="
          result = await p.query(
            `SELECT * FROM "VoiceNote" WHERE "${orderCol}" ${operator} $1 ORDER BY "${orderCol}" ${orderDir} LIMIT $2 OFFSET ${skip || 0}`,
            [cursor.createdAt.toISOString(), take]
          )
        } else {
          result = await p.query(
            `SELECT * FROM "VoiceNote" ORDER BY "${orderCol}" ${orderDir} LIMIT $1`,
            [take]
          )
        }

        return result.rows.map(mapNote)
      },
    },
  }

  return prismaInstance
}
