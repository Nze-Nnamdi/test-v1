# API Route Scaffolder Skill

## Purpose

Create Next.js Route Handlers for Echoes MVP #1.

All routes must follow:

* architecture.md
* security.md
* code-style.md

---

# Approved Endpoints

## POST /api/voices

Upload voice note.

## GET /api/voices

Retrieve public voice feed.

## GET /api/health

Health check endpoint.

---

# POST /api/voices

## Responsibilities

* Validate file type and size
* Validate duration
* Upload to Supabase Storage
* Save database record
* Return created voice note

## Request

```json
{
  "audio": "<blob>",
  "duration": 42
}
```

## Validation Rules

### File Type

Allow:

```text
audio/webm
audio/mp4
audio/ogg
```

### File Size

Maximum: `10 MB`

### Duration

Required. Integer. Max `60` seconds.

## Response

### Success (201)

```json
{
  "id": "uuid",
  "audioUrl": "https://storage.supabase.co/voices/uuid.webm",
  "duration": 42,
  "format": "webm",
  "createdAt": "2026-07-17T12:00:00Z"
}
```

### Validation Error (400)

```json
{
  "error": "Missing audio"
}
```

### File Too Large (413)

```json
{
  "error": "File too large"
}
```

### Duration Invalid (400)

```json
{
  "error": "Duration must be between 1 and 60 seconds"
}
```

### Server Error (500)

```json
{
  "error": "Upload failed"
}
```

---

# GET /api/voices

## Responsibilities

* Fetch voice notes from database
* Sort newest first
* Return paginated results

## Query Parameters

| Param | Type | Default | Max | Description |
|-------|------|---------|-----|-------------|
| limit | number | 20 | 100 | Notes per page |
| cursor | string | - | - | ISO timestamp for pagination |

## Response

### Success (200)

```json
{
  "notes": [
    {
      "id": "uuid",
      "audioUrl": "https://storage.supabase.co/voices/uuid.webm",
      "duration": 42,
      "format": "webm",
      "createdAt": "2026-07-17T12:00:00Z"
    }
  ],
  "nextCursor": "2026-07-17T11:58:00Z"
}
```

`nextCursor` is `null` when no more pages.

### Server Error (500)

```json
{
  "error": "Failed to fetch voices"
}
```

---

# GET /api/health

## Response

### Success (200)

```json
{
  "status": "ok",
  "timestamp": "2026-07-17T12:00:00Z"
}
```

---

# Route Templates

## POST Template

```ts
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { supabase } from "@/lib/supabase"

const MAX_FILE_SIZE = 10 * 1024 * 1024
const ALLOWED_TYPES = ["audio/webm", "audio/mp4", "audio/ogg"]
const MAX_DURATION = 60

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const audio = formData.get("audio") as File | null
    const duration = parseInt(formData.get("duration") as string, 10)

    if (!audio) {
      return NextResponse.json(
        { error: "Missing audio" },
        { status: 400 }
      )
    }

    if (!ALLOWED_TYPES.includes(audio.type)) {
      return NextResponse.json(
        { error: "Invalid file type" },
        { status: 400 }
      )
    }

    if (audio.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File too large" },
        { status: 413 }
      )
    }

    if (isNaN(duration) || duration <= 0 || duration > MAX_DURATION) {
      return NextResponse.json(
        { error: "Duration must be between 1 and 60 seconds" },
        { status: 400 }
      )
    }

    const buffer = Buffer.from(await audio.arrayBuffer())
    const extension = audio.type.includes("webm") ? "webm" : "mp4"
    const filename = `${crypto.randomUUID()}.${extension}`

    const { error: uploadError } = await supabase.storage
      .from("voices")
      .upload(filename, buffer, {
        contentType: audio.type,
      })

    if (uploadError) {
      console.error("Upload failed:", uploadError.message)
      return NextResponse.json(
        { error: "Upload failed" },
        { status: 500 }
      )
    }

    const { data: urlData } = supabase.storage
      .from("voices")
      .getPublicUrl(filename)

    const voiceNote = await prisma.voiceNote.create({
      data: {
        audioUrl: urlData.publicUrl,
        format: extension,
        duration,
      },
    })

    return NextResponse.json(voiceNote, { status: 201 })
  } catch (error) {
    console.error("POST /api/voices error:", error)
    return NextResponse.json(
      { error: "Upload failed" },
      { status: 500 }
    )
  }
}
```

## GET Template

```ts
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

const DEFAULT_LIMIT = 20
const MAX_LIMIT = 100

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = Math.min(
      parseInt(searchParams.get("limit") || String(DEFAULT_LIMIT), 10),
      MAX_LIMIT
    )
    const cursor = searchParams.get("cursor")

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

    return NextResponse.json({ notes: data, nextCursor })
  } catch (error) {
    console.error("GET /api/voices error:", error)
    return NextResponse.json(
      { error: "Failed to fetch voices" },
      { status: 500 }
    )
  }
}
```

## Health Check Template

```ts
import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
  })
}
```

---

# CORS Implementation

Add to every route handler:

```ts
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN

function getCorsHeaders(origin: string | null) {
  if (origin !== ALLOWED_ORIGIN) return {}

  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
    "Access-Control-Allow-Methods": "GET, POST",
    "Access-Control-Allow-Headers": "Content-Type",
  }
}
```

---

# Rate Limiting

Implement via middleware or in-memory store:

```ts
const rateLimit = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(ip: string, limit = 10, windowMs = 3600000) {
  const now = Date.now()
  const record = rateLimit.get(ip)

  if (!record || now > record.resetAt) {
    rateLimit.set(ip, { count: 1, resetAt: now + windowMs })
    return true
  }

  if (record.count >= limit) return false

  record.count++
  return true
}
```

---

# Database Access

Use Prisma ORM.

Preferred:

```ts
prisma.voiceNote.create()
prisma.voiceNote.findMany()
```

Never use raw SQL.

---

# Error Handling

Always:

* Wrap in try/catch
* Return structured errors
* Log errors with context

Never:

* Expose stack traces
* Expose credentials
* Return raw database errors

---

# File Location

```text
app/
├── api/
│   ├── voices/
│   │   ├── route.ts
│   │   └── health/
│   │       └── route.ts
```

---

# Response Format Consistency

Always use `{ "error": "message" }` for errors.

NEVER use `{ "success": false, "message": "..." }`.

Success responses return data directly (POST returns object, GET returns object).

---

# Echoes MVP Guardrail

Do not scaffold routes for:

* auth
* comments
* reactions
* notifications
* profiles
* messaging

unless the PRD explicitly changes.
