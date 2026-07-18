---
trigger: always_on
---

# security.md

## Security Philosophy

Echoes MVP prioritizes practical security appropriate for an early-stage validation product.

Protect:

* Infrastructure
* Storage
* Database
* Users

Avoid unnecessary complexity.

---

## CORS Policy

Allow only same-origin requests.

```ts
Access-Control-Allow-Origin: https://echoes.vercel.app
Access-Control-Allow-Methods: GET, POST
Access-Control-Allow-Headers: Content-Type
```

Reject requests from unknown origins.

In Next.js, configure in route handler:

```ts
export async function POST(request: Request) {
  const origin = request.headers.get("origin")

  if (origin !== process.env.ALLOWED_ORIGIN) {
    return NextResponse.json(
      { error: "Forbidden" },
      { status: 403 }
    )
  }

  // proceed
}
```

---

## Content Security Policy

Add CSP headers via Next.js middleware or Vercel config.

```text
Content-Security-Policy:
  default-src 'self';
  script-src 'self';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data:;
  media-src 'self' https://*.supabase.co;
  connect-src 'self' https://*.supabase.co;
  font-src 'self';
  object-src 'none';
  frame-ancestors 'none';
```

Restricts what can load on the page. Prevents XSS.

---

## Security Headers

Configure in `next.config.js` or Vercel:

```text
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(self)
```

---

## File Upload Validation

Only allow audio uploads.

Accepted types:

```text
audio/webm
audio/mp4
audio/mpeg
audio/ogg
```

Reject all other file types.

### Validate MIME Type

Check `Content-Type` header from upload.

### Validate Magic Bytes

Read first 4 bytes of file to confirm actual format.

```ts
function validateAudioBuffer(buffer: Buffer): boolean {
  const webm = [0x1A, 0x45, 0xDF, 0xA3]
  const ftyp = [0x66, 0x74, 0x79, 0x70]

  const header = Array.from(buffer.slice(0, 4))

  const isWebm = header.every((byte, i) => byte === webm[i])
  const isMp4 = header.every((byte, i) => byte === ftyp[i])

  return isWebm || isMp4
}
```

Never trust file extension alone.

---

## Upload Limits

Maximum upload size:

```text
10 MB
```

Maximum duration:

```text
60 seconds
```

Reject larger uploads with `413` status.

---

## Storage Rules

Audio files stored in Supabase Storage.

Use generated UUID filenames.

Never trust user-provided filenames.

Example:

```text
voices/7f2d3c0d-4b5a-4e6f-8a1b-2c3d4e5f6a7b.webm
```

---

## Supabase RLS Policies

Enable Row Level Security on storage bucket.

### Public Read Policy

```sql
CREATE POLICY "Public read access"
ON storage.objects
FOR SELECT
USING (bucket_id = 'voices');
```

### Authenticated Write Policy

```sql
CREATE POLICY "Server write access"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'voices' AND auth.role() = 'service_role');
```

No anonymous uploads. Server-side only via service role key.

---

## Database Protection

Use Prisma ORM.

Never construct raw SQL queries using user input.

Prefer:

```ts
prisma.voiceNote.create()
```

Never use:

```ts
prisma.$queryRaw(`INSERT INTO voices...`)
```

---

## Input Sanitization

### Duration

Validate is a positive integer.

```ts
const duration = parseInt(input, 10)

if (isNaN(duration) || duration <= 0 || duration > 60) {
  return NextResponse.json(
    { error: "Invalid duration" },
    { status: 400 }
  )
}
```

### Audio

Validate buffer size and magic bytes before storage.

### All Inputs

Never interpolate user input into strings, queries, or logs without sanitization.

---

## XSS Prevention

* Never render user-provided text as HTML
* Use React's default escaping (JSX)
* Never use `dangerouslySetInnerHTML`
* Sanitize any metadata stored in database

---

## CSRF Protection

For MVP, CSRF risk is low since:

* No authentication
* No state-changing operations from forms
* Uploads require direct API call

If adding forms later, implement CSRF tokens.

---

## Environment Variables

Store secrets in environment variables.

Required:

```env
DATABASE_URL=
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
ALLOWED_ORIGIN=
```

Never commit secrets.

Never expose `SUPABASE_SERVICE_ROLE_KEY` to client.

---

## Rate Limiting

```text
10 uploads per hour per IP
100 feed requests per hour per IP
```

Prevents abuse during MVP testing.

Implement via middleware or edge function.

Store counters in memory or Redis (if available).

---

## Error Responses

Do not expose:

* Stack traces
* Database details
* Storage credentials
* Internal IP addresses
* File paths

Return generic messages:

```json
{
  "error": "Upload failed"
}
```

Error response format:

```ts
interface ErrorResponse {
  error: string
}
```

Never include `success: false` — use HTTP status codes instead.

---

## HTTPS

All production traffic must use HTTPS.

Never transmit uploads over HTTP.

Vercel provides HTTPS by default.

---

## Logging

Log:

* Upload attempts (with timestamp, file size)
* Upload success
* Upload failure
* API errors
* Feed requests (development only)

Do not log:

* Secrets
* Access tokens
* Database credentials
* User IP addresses
* Full file contents
* Request bodies containing audio

---

## Dependency Security

* Run `npm audit` before deployment
* Fix critical and high vulnerabilities immediately
* Update dependencies monthly
* Use `npm audit --fix` for minor patches

---

## Secrets Management

* Never hardcode secrets in source code
* Never log secrets
* Never include secrets in error messages
* Rotate keys if exposed
* Use different keys for development and production

---

## Data Retention

MVP data retention policy:

* Voice notes: permanent until manual deletion
* Database records: permanent until manual deletion
* No automatic cleanup

Future: Add data retention after validation.

---

## Privacy Considerations

* No user tracking
* No cookies for identification
* No analytics that capture personal data
* Voice notes are public — warn users implicitly through UX
* Comply with GDPR if serving EU users

---

## Incident Response

If a security issue is discovered:

1. Assess severity (critical, high, medium, low)
2. Fix immediately if critical/high
3. Document the issue
4. Rotate any exposed credentials
5. Monitor for abuse

---

## Audit Logging

Track in logs:

* Successful uploads
* Failed uploads (with reason)
* API errors
* Rate limit hits

Do not store audit logs in database for MVP.

---

## Backup and Restore

* Database: Supabase handles backups
* Storage: Supabase handles redundancy
* Code: GitHub repository
* Environment variables: Document in secure location

---

## Future Security Features

Only after validation:

* User authentication
* Moderation systems
* Abuse detection
* Content reporting
* Advanced rate limiting
* Audit trails
* Encryption at rest
* IP blocking
* Content scanning

These are intentionally deferred until the core hypothesis is validated.
