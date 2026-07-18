import { NextResponse } from "next/server"
import { getCorsHeaders, handleOptions } from "@/lib/api-utils"

export async function OPTIONS(request: Request) {
  return handleOptions(request)
}

export async function GET(request: Request) {
  const headers = getCorsHeaders(request)
  return NextResponse.json(
    {
      status: "ok",
      timestamp: new Date().toISOString(),
    },
    {
      headers: headers as Record<string, string>,
    }
  )
}
