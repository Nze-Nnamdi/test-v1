---
trigger: always_on
---

# architecture.md

## Architecture Overview

Echoes MVP follows a simple client-server architecture.

```text
Browser
   |
   v
Next.js Frontend
   |
   v
Route Handlers
   |
   +-------> Supabase Storage
   |
   v
PostgreSQL (Prisma)
```

---

## Environment Variables

Required in `.env.local`:

```text
DATABASE_URL=postgresql://...
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

* `NEXT_PUBLIC_` prefix required for client-side usage.
* Never commit `.env.local`.
* Never expose `SUPABASE_SERVICE_ROLE_KEY` to the client.

---

## Frontend Responsibilities

### Recording

* Request microphone permission
* Record audio using `MediaRecorder` API
* Manage recording state (idle, recording, submitting, error)
* Show countdown timer during recording (60s max)
* Auto-stop recording when 60s limit reached
* Show loading spinner during upload submission
* Disable record button while submitting
* Submit audio blob to `POST /api/voices`
* Handle upload errors gracefully

### Feed

* Fetch voice notes from `GET /api/voices`
* Render public feed (newest first)
* Play audio on user click (never auto-play)
* Show play/pause button per voice note
* Show loading skeleton while fetching
* Handle empty feed state
* Refresh feed on page load (no polling)
* Load more notes on scroll (infinite scroll with cursor pagination)

---

## Backend Responsibilities

### Upload Endpoint

POST /api/voices

Request:

```json
{
  "audio": "<blob>",
  "duration": 42
}
```

Validation:

* Audio required
* Max file size: 10 MB
* Accepted MIME types: `audio/webm`, `audio/mp4`, `audio/ogg`
* Duration required, in seconds, max 60 (1 minute)
* Duration must be a positive integer

Responses:

| Status | Body | When |
|--------|------|------|
| 201 | `{ "id": "...", "audioUrl": "...", "duration": 42, "createdAt": "..." }` | Success |
| 400 | `{ "error": "Missing audio" }` | Validation failed |
| 413 | `{ "error": "File too large" }` | Exceeds 10 MB |
| 500 | `{ "error": "Upload failed" }` | Storage or DB error |

---

### Feed Endpoint

GET /api/voices

Query params:

* `limit` — number of notes to return (default: 20, max: 100)
* `cursor` — ISO timestamp for pagination (optional)

Response:

```json
{
  "notes": [
    {
      "id": "...",
      "audioUrl": "...",
      "duration": 42,
      "createdAt": "2026-07-17T12:00:00Z"
    }
  ],
  "nextCursor": "2026-07-17T11:58:00Z" | null
}
```

Responses:

| Status | Body | When |
|--------|------|------|
| 200 | `{ "notes": [...], "nextCursor": "..." }` | Success |
| 500 | `{ "error": "Failed to fetch" }` | DB error |

---

## Storage Layer

Supabase Storage

Stores:

* Audio files only

File naming:

```text
voices/{uuid}.{extension}
```

* Extension determined by recorded format: `.webm` or `.mp4`
* Always use UUID to prevent filename collisions

Bucket policy:

* Public read access for audio files
* Authenticated write (server-side only via service role key)

---

## Database Layer

PostgreSQL via Prisma ORM

Stores metadata only. Never store audio blobs in PostgreSQL.

Schema:

```prisma
model VoiceNote {
  id        String   @id @default(uuid())
  audioUrl  String
  format    String
  duration  Int
  createdAt DateTime @default(now())

  @@index([createdAt])
}
```

Duration unit: seconds (integer).
Format: `webm` or `mp4` (used for file extension and MIME type).

---

## State Management

Use React `useState` and `useReducer`.

Do not introduce:

* Redux
* Zustand
* MobX
* Jotai
* Recoil
* Complex client state systems

MVP complexity does not justify them.

---

## Error Handling

### Client Side

* Catch upload failures and show user-friendly message
* Catch fetch failures and show retry option
* Never expose raw error messages or stack traces

### Server Side

* Wrap all route handler logic in try/catch
* Log errors to console.error with context
* Return structured `{ "error": "message" }` responses
* Never expose internal details (DB errors, storage keys) to client

---

## Security

* CORS: Allow only same-origin requests
* Rate limiting: 10 uploads per IP per hour
* Input validation: Validate all inputs before processing
* File validation: Check MIME type and file size before storage
* Never expose service role key to client
* Use Supabase RLS policies for storage bucket access

---

## Audio Formats

Primary: `.webm` (Chrome, Firefox, Edge)
Fallback: `.mp4` (Safari)

Detect browser support via `MediaRecorder.isTypeSupported()` and select optimal format.

---

## Deployment

Recommended:

* Vercel (frontend + route handlers)
* Supabase (database + storage)

Deploy steps:

1. Push to GitHub
2. Connect repository to Vercel
3. Set environment variables in Vercel dashboard
4. Run `npx prisma db push` to sync schema
5. Create Supabase Storage bucket named `voices`
6. Set bucket policy to public read

---

## Logging

* Log upload attempts: `console.log("Upload:", fileName, fileSize)`
* Log errors: `console.error("Upload failed:", error.message)`
* Log feed requests in development only
* Never log sensitive data (API keys, user IPs)

---

## Health Check

GET /api/health

Response:

```json
{
  "status": "ok",
  "timestamp": "2026-07-17T12:00:00Z"
}
```

Use for deployment monitoring and uptime checks.

---

## Future Architecture

Only after validation:

* Analytics
* Reactions
* Notification systems
* Real-time infrastructure
* Discovery systems
