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
    sessionId: row.sessionid ?? row.sessionId,
    playCount: row.playcount ?? row.playCount ?? 0,
    createdAt: row.createdat ?? row.createdAt,
  }
}

export async function getPrisma() {
  if (prismaInstance) return prismaInstance

  prismaInstance = {
    voiceNote: {
      async create({ data }: { data: { audioUrl: string; format: string; duration: number; sessionId?: string } }) {
        const p = getPool()
        const result = await p.query(
          `INSERT INTO "VoiceNote" ("audioUrl", format, duration, "sessionId") VALUES ($1, $2, $3, $4) RETURNING *`,
          [data.audioUrl, data.format, data.duration, data.sessionId ?? null]
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
      async incrementPlayCount({ where }: { where: { id: string } }) {
        const p = getPool()
        const result = await p.query(
          `UPDATE "VoiceNote" SET "playCount" = "playCount" + 1 WHERE id = $1 RETURNING *`,
          [where.id]
        )
        return mapNote(result.rows[0])
      },
      async findMany({
        take,
        orderBy,
        cursor,
        skip,
        where,
      }: {
        take?: number
        orderBy?: Record<string, "asc" | "desc">
        cursor?: { createdAt?: Date }
        skip?: number
        where?: { sessionId?: string }
      }) {
        const p = getPool()
        const orderCol = Object.keys(orderBy || { createdAt: "desc" })[0] || "createdAt"
        const orderDir = (orderBy as any)?.[orderCol] || "desc"

        const conditions: string[] = []
        const params: any[] = []

        if (where?.sessionId) {
          conditions.push(`"sessionId" = $${params.length + 1}`)
          params.push(where.sessionId)
        }

        if (cursor?.createdAt) {
          const operator = orderDir === "desc" ? "<=" : ">="
          conditions.push(`"${orderCol}" ${operator} $${params.length + 1}`)
          params.push(cursor.createdAt.toISOString())
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : ""
        const offsetClause = skip ? `OFFSET ${skip}` : ""

        let result
        if (cursor?.createdAt || where?.sessionId) {
          result = await p.query(
            `SELECT * FROM "VoiceNote" ${whereClause} ORDER BY "${orderCol}" ${orderDir} LIMIT $${params.length + 1} ${offsetClause}`,
            [...params, take]
          )
        } else {
          result = await p.query(
            `SELECT * FROM "VoiceNote" ${whereClause} ORDER BY "${orderCol}" ${orderDir} LIMIT $1`,
            [take]
          )
        }

        return result.rows.map(mapNote)
      },
    },
    report: {
      async create({ data }: { data: { voiceNoteId: string; sessionId: string; reason?: string } }) {
        const p = getPool()
        const result = await p.query(
          `INSERT INTO "Report" ("voiceNoteId", "sessionId", reason) VALUES ($1, $2, $3) RETURNING *`,
          [data.voiceNoteId, data.sessionId, data.reason ?? null]
        )
        return result.rows[0]
      },
      async findUnique(where: { voiceNoteId_sessionId: { voiceNoteId: string; sessionId: string } }) {
        const p = getPool()
        const result = await p.query(
          `SELECT * FROM "Report" WHERE "voiceNoteId" = $1 AND "sessionId" = $2`,
          [where.voiceNoteId_sessionId.voiceNoteId, where.voiceNoteId_sessionId.sessionId]
        )
        return result.rows[0] || null
      },
    },
  }

  return prismaInstance
}
