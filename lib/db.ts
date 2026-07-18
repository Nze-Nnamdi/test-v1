import { Pool } from "pg"

let pool: Pool | null = null

export async function getPool() {
  if (pool) return pool

  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error("Missing DATABASE_URL environment variable")
  }

  pool = new Pool({ connectionString })
  return pool
}

export async function query(text: string, params?: any[]) {
  const p = await getPool()
  return p.query(text, params)
}
