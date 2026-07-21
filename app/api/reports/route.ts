import { NextResponse } from "next/server"
import { getPrisma } from "@/lib/prisma"
import { getCorsHeaders, handleOptions, checkRateLimit, getClientIp } from "@/lib/api-utils"

export async function OPTIONS(request: Request) {
  return handleOptions(request)
}

export async function POST(request: Request) {
  const corsHeaders = getCorsHeaders(request)
  const ip = getClientIp(request)

  if (!checkRateLimit(ip, 10, 3600000)) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429, headers: corsHeaders as Record<string, string> }
    )
  }

  try {
    const { voiceNoteId, sessionId, reason } = await request.json()

    if (!voiceNoteId || !sessionId) {
      return NextResponse.json(
        { error: "Missing voiceNoteId or sessionId" },
        { status: 400, headers: corsHeaders as Record<string, string> }
      )
    }

    const prisma = await getPrisma()

    const existing = await prisma.report.findUnique({
      voiceNoteId_sessionId: { voiceNoteId, sessionId },
    })

    if (existing) {
      return NextResponse.json(
        { error: "You have already reported this voice note" },
        { status: 409, headers: corsHeaders as Record<string, string> }
      )
    }

    const note = await prisma.voiceNote.findUnique({ where: { id: voiceNoteId } })
    if (!note) {
      return NextResponse.json(
        { error: "Voice note not found" },
        { status: 404, headers: corsHeaders as Record<string, string> }
      )
    }

    const report = await prisma.report.create({
      data: { voiceNoteId, sessionId, reason },
    })

    console.log(`Report submitted: ${report.id} for voice note ${voiceNoteId}`)

    return NextResponse.json({ success: true, report }, {
      status: 201,
      headers: corsHeaders as Record<string, string>,
    })
  } catch (error) {
    console.error("POST /api/reports error:", error)
    const message = error instanceof Error ? error.message : "Failed to submit report"
    return NextResponse.json(
      { error: message },
      { status: 500, headers: corsHeaders as Record<string, string> }
    )
  }
}
