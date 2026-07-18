import { NextResponse } from "next/server"
import { getPrisma } from "@/lib/prisma"
import { getSupabase } from "@/lib/supabase"
import {
  getCorsHeaders,
  handleOptions,
  checkRateLimit,
  getClientIp,
} from "@/lib/api-utils"

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB
const ALLOWED_TYPES = ["audio/webm", "audio/mp4", "audio/ogg"]
const MAX_DURATION = 60
const DEFAULT_LIMIT = 20
const MAX_LIMIT = 100

// Helper to validate audio magic bytes (first 4 bytes of stream)
function validateAudioBuffer(buffer: Buffer): boolean {
  const webm = [0x1A, 0x45, 0xDF, 0xA3]
  const ftyp = [0x66, 0x74, 0x79, 0x70] // mp4 ftyp container
  const ogg = [0x4F, 0x67, 0x67, 0x53]  // 'OggS'

  if (buffer.length < 4) return false

  const header = Array.from(buffer.subarray(0, 4))

  const isWebm = header.every((byte, i) => byte === webm[i])
  const isMp4 = header.every((byte, i) => byte === ftyp[i])
  const isOgg = header.every((byte, i) => byte === ogg[i])

  return isWebm || isMp4 || isOgg
}

export async function OPTIONS(request: Request) {
  return handleOptions(request)
}

export async function POST(request: Request) {
  const corsHeaders = getCorsHeaders(request)
  const ip = getClientIp(request)

  // Rate Limiting: 10 uploads per hour per IP
  if (!checkRateLimit(ip, 10, 3600000)) {
    return NextResponse.json(
      { error: "Too many uploads. Please try again later." },
      { status: 429, headers: corsHeaders as Record<string, string> }
    )
  }

  try {
    const formData = await request.formData()
    const audio = formData.get("audio") as File | null
    const duration = parseInt(formData.get("duration") as string, 10)

    if (!audio) {
      return NextResponse.json(
        { error: "Missing audio" },
        { status: 400, headers: corsHeaders as Record<string, string> }
      )
    }

    const baseType = audio.type.split(";")[0].trim()
    if (!ALLOWED_TYPES.includes(baseType)) {
      return NextResponse.json(
        { error: "Invalid file type" },
        { status: 400, headers: corsHeaders as Record<string, string> }
      )
    }

    if (audio.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File too large" },
        { status: 413, headers: corsHeaders as Record<string, string> }
      )
    }

    if (isNaN(duration) || duration <= 0 || duration > MAX_DURATION) {
      return NextResponse.json(
        { error: "Duration must be between 1 and 60 seconds" },
        { status: 400, headers: corsHeaders as Record<string, string> }
      )
    }

    const buffer = Buffer.from(await audio.arrayBuffer())

    // Security: Validate magic bytes to verify it's actually an audio file
    if (!validateAudioBuffer(buffer)) {
      return NextResponse.json(
        { error: "File verification failed" },
        { status: 400, headers: corsHeaders as Record<string, string> }
      )
    }

    const extension = baseType.includes("webm") ? "webm" : baseType.includes("ogg") ? "ogg" : "mp4"
    const filename = `voices/${crypto.randomUUID()}.${extension}`

    // Log upload details as requested in logging security policies
    console.log(`Upload attempt: ${filename}, size: ${audio.size} bytes`)

    const supabase = await getSupabase()

    const { error: uploadError } = await supabase.storage
      .from("voices")
      .upload(filename, buffer, {
        contentType: baseType,
      })

    if (uploadError) {
      console.error("Supabase upload error:", JSON.stringify(uploadError))
      return NextResponse.json(
        { error: `Upload failed: ${uploadError.message}` },
        { status: 500, headers: corsHeaders as Record<string, string> }
      )
    }

    const { data: urlData } = supabase.storage
      .from("voices")
      .getPublicUrl(filename)

    const prisma = await getPrisma()
    const voiceNote = await prisma.voiceNote.create({
      data: {
        audioUrl: urlData.publicUrl,
        format: extension,
        duration,
      },
    })

    console.log(`Upload success: ${voiceNote.id}`)

    return NextResponse.json(voiceNote, {
      status: 201,
      headers: corsHeaders as Record<string, string>,
    })
  } catch (error) {
    console.error("POST /api/voices error:", error)
    const message = error instanceof Error ? error.message : "Upload failed"
    return NextResponse.json(
        { error: message },
        { status: 500, headers: corsHeaders as Record<string, string> }
      )
  }
}

export async function DELETE(request: Request) {
  const corsHeaders = getCorsHeaders(request)

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json(
        { error: "Missing id" },
        { status: 400, headers: corsHeaders as Record<string, string> }
      )
    }

    const prisma = await getPrisma()
    const note = await prisma.voiceNote.findUnique({ where: { id } })

    if (!note) {
      return NextResponse.json(
        { error: "Voice note not found" },
        { status: 404, headers: corsHeaders as Record<string, string> }
      )
    }

    const supabase = await getSupabase()
    const publicUrl = note.audiourl || note.audioUrl
    const publicPrefix = `${supabase.storage.from("voices").getPublicUrl("").data.publicUrl}`
    const filePath = publicUrl.startsWith(publicPrefix)
      ? publicUrl.slice(publicPrefix.length)
      : null

    if (filePath) {
      const { error: removeError } = await supabase.storage
        .from("voices")
        .remove([filePath])

      if (removeError) {
        console.error("Supabase storage delete error:", removeError)
      }
    }

    const deleted = await prisma.voiceNote.delete({ where: { id } })

    return NextResponse.json(deleted, {
      headers: corsHeaders as Record<string, string>,
    })
  } catch (error) {
    console.error("DELETE /api/voices error:", error)
    const message = error instanceof Error ? error.message : "Failed to delete voice note"
    return NextResponse.json(
      { error: message },
      { status: 500, headers: corsHeaders as Record<string, string> }
    )
  }
}

export async function GET(request: Request) {
  const corsHeaders = getCorsHeaders(request)

  try {
    const { searchParams } = new URL(request.url)
    const limit = Math.min(
      parseInt(searchParams.get("limit") || String(DEFAULT_LIMIT), 10),
      MAX_LIMIT
    )
    const cursor = searchParams.get("cursor")

    const prisma = await getPrisma()
    const notes = await prisma.voiceNote.findMany({
      take: limit + 1,
      orderBy: { createdAt: "desc" },
      ...(cursor && {
        cursor: { createdAt: new Date(cursor) },
        skip: 1,
      }),
    })

    const hasMore = notes.length > limit
    const data = hasMore ? notes.slice(0, limit) : notes
    const nextCursor = hasMore
      ? data[data.length - 1].createdAt.toISOString()
      : null

    return NextResponse.json(
      { notes: data, nextCursor },
      { headers: corsHeaders as Record<string, string> }
    )
  } catch (error) {
    console.error("GET /api/voices error:", error)
    const message = error instanceof Error ? error.message : "Failed to fetch voices"
    return NextResponse.json(
      { error: message },
      { status: 500, headers: corsHeaders as Record<string, string> }
    )
  }
}
