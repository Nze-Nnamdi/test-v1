---
trigger: always_on
---

# code-style.md

## General Principles

Code should be:

* Simple
* Readable
* Predictable
* Maintainable

Avoid clever solutions.

---

## TypeScript

Always use TypeScript.

Avoid:

```ts
any
```

Prefer explicit types.

Never use `@ts-ignore` or `@ts-expect-error` unless absolutely necessary and commented.

---

## File and Folder Naming

### Folders

* Use `kebab-case` for all folders
* Example: `voice-recorder/`, `api-utils/`

### Files

* Components: `PascalCase.tsx` — `VoiceRecorder.tsx`
* Hooks: `useCamelCase.ts` — `useRecording.ts`
* Utilities: `camelCase.ts` — `formatDuration.ts`
* API routes: `route.ts` (Next.js convention)
* Types: `camelCase.ts` — `types.ts`
* Constants: `camelCase.ts` — `constants.ts`
* Tests: `*.test.ts` or `*.test.tsx`

### Extensions

* Components: `.tsx`
* Non-React code: `.ts`
* Styles: `.css` or `.module.css`

---

## Naming Conventions

### Components

```ts
VoiceRecorder
VoiceFeed
VoicePlayer
```

PascalCase.

### Functions

```ts
startRecording()
stopRecording()
uploadVoice()
fetchVoices()
```

camelCase.

### Hooks

```ts
useRecording()
useAudioPlayer()
useVoiceNotes()
```

camelCase, prefixed with `use`.

### Constants

```ts
MAX_UPLOAD_SIZE
ALLOWED_AUDIO_TYPES
DEFAULT_FEED_LIMIT
```

UPPER_SNAKE_CASE for values that never change.

camelCase for config objects:

```ts
const storageConfig = { ... }
```

### Types and Interfaces

```ts
interface VoiceNoteProps { ... }
interface RecordingState { ... }
type AudioFormat = "webm" | "mp4"
```

PascalCase. Prefer `interface` for objects, `type` for unions/intersections.

Suffix props interfaces with `Props`:

```ts
interface VoiceRecorderProps { ... }
```

---

## Import Ordering

Group imports in this order:

1. React / Next.js
2. External libraries
3. Internal components
4. Internal hooks
5. Internal utilities
6. Types
7. Constants

Separate groups with a blank line.

```ts
import { useState } from "react"

import { MediaRecorder } from "lib"

import { VoicePlayer } from "@/components/VoicePlayer"

import { useRecording } from "@/hooks/useRecording"

import { formatDuration } from "@/utils/formatDuration"

import type { VoiceNote } from "@/types"

import { MAX_UPLOAD_SIZE } from "@/constants"
```

---

## Component Design

Keep components small.

Preferred structure:

```text
components/
├── VoiceRecorder/
│   ├── VoiceRecorder.tsx
│   ├── VoiceRecorderControls.tsx
│   └── index.ts
├── VoiceFeed/
│   ├── VoiceFeed.tsx
│   ├── VoiceFeedItem.tsx
│   └── index.ts
```

One component per file. Export from index.ts.

Avoid giant components. If a component exceeds 100 lines, split it.

### Props

* Destructure props in function signature
* Keep prop count under 5. If more, use an props object.

```ts
interface VoicePlayerProps {
  audioUrl: string
  duration: number
}

export function VoicePlayer({ audioUrl, duration }: VoicePlayerProps) {
  // ...
}
```

### Client vs Server Components

* Use `"use client"` only when component needs state or browser APIs
* Default to Server Components
* Never mix client and server logic in one component

---

## API Routes

Keep route handlers focused.

One responsibility per endpoint.

Bad:

```ts
upload
analytics
notifications
moderation
```

inside one route.

Good:

```ts
POST /api/voices
GET /api/voices
GET /api/health
```

### Route Handler Pattern

```ts
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    // validate
    // process
    // return success
  } catch (error) {
    return NextResponse.json(
      { error: "Message" },
      { status: 500 }
    )
  }
}
```

---

## Error Handling

Always return structured errors.

```json
{
  "error": "Upload failed"
}
```

Never expose stack traces.

Use early returns for validation:

```ts
if (!audio) {
  return NextResponse.json(
    { error: "Missing audio" },
    { status: 400 }
  )
}

// proceed with valid input
```

---

## Null and Undefined Handling

* Use `undefined` for missing values
* Use `null` for intentional empty values
* Prefer optional chaining: `data?.notes`
* Prefer nullish coalescing: `value ?? defaultValue`
* Avoid `||` for default values (falsy includes 0 and "")

```ts
// Good
const limit = params.limit ?? 20

// Bad
const limit = params.limit || 20
```

---

## Async/Await

* Always use `async/await` over `.then()` chains
* Always handle errors with try/catch
* Never use `async` on functions that don't await

```ts
// Good
async function fetchVoices() {
  try {
    const res = await fetch("/api/voices")
    return await res.json()
  } catch (error) {
    throw new Error("Failed to fetch voices")
  }
}

// Bad
function fetchVoices() {
  return fetch("/api/voices").then((res) => res.json())
}
```

---

## Exports

* Prefer named exports over default exports
* Default exports only for page components (Next.js requirement)

```ts
// Good
export function formatDuration(seconds: number) { ... }
export const MAX_UPLOAD_SIZE = 10 * 1024 * 1024

// Bad (except pages)
export default function formatDuration(seconds: number) { ... }
```

---

## Formatting

Use:

* Prettier
* ESLint

Formatting should be automated.

### Prettier Config

```json
{
  "semi": false,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 80,
  "tabWidth": 2
}
```

### Rules

* No semicolons
* Single quotes
* Trailing commas everywhere
* 80 character line limit
* 2 space indentation
* No trailing whitespace

---

## Comments

Write comments only when necessary.

Avoid:

```ts
// increment count
count++
```

Prefer self-explanatory code.

Allowed comments:

* TODO: for future work
* HACK: for temporary workarounds
* Explanation of why, not what

```ts
// HACK: Safari doesn't support webm, so we fallback to mp4
const format = isSafari() ? "mp4" : "webm"
```

---

## Early Returns

Prefer early returns to reduce nesting.

```ts
// Good
function processVoice(note: VoiceNote | null) {
  if (!note) return

  if (!note.audioUrl) return

  // process
}

// Bad
function processVoice(note: VoiceNote | null) {
  if (note) {
    if (note.audioUrl) {
      // process
    }
  }
}
```

---

## Function Guidelines

* Keep functions under 40 lines
* One function, one responsibility
* Avoid side effects in utility functions
* Prefer pure functions where possible

---

## Nesting Depth

Keep nesting under 3 levels.

```ts
// Good
if (valid) {
  if (ready) {
    submit()
  }
}

// Bad
if (valid) {
  if (ready) {
    if (authorized) {
      if (complete) {
        submit()
      }
    }
  }
}
```

Use early returns to flatten.

---

## Arrays

* Prefer `map`, `filter`, `reduce` over `for` loops
* Use `for...of` when you need async/await in loop
* Avoid `forEach` with async operations

```ts
// Good
const urls = notes.map((n) => n.audioUrl)

// Good (async)
for (const note of notes) {
  await processNote(note)
}

// Bad
notes.forEach(async (note) => {
  await processNote(note)
})
```

---

## Strings

* Use template literals for interpolation
* Use single quotes for strings
* Avoid string concatenation

```ts
// Good
const message = `Failed to upload ${fileName}`

// Bad
const message = "Failed to upload " + fileName
```

---

## Barrel Files

Use `index.ts` for component folders only.

```ts
// components/VoiceRecorder/index.ts
export { VoiceRecorder } from './VoiceRecorder'
```

Do not create barrel files for utilities or hooks — import directly.

---

## Test File Naming

* Co-locate tests with source: `VoiceRecorder.tsx` → `VoiceRecorder.test.tsx`
* Use `.test.ts` or `.test.tsx` extension
* Never use `.spec.ts`

---

## Type Organization

* Shared types: `types.ts` in project root or feature folder
* Component props: inside component file or co-located `types.ts`
* API response types: near the route handler that returns them
* Avoid circular type imports

---

## Constants

Define constants in `constants.ts`:

```ts
export const MAX_UPLOAD_SIZE = 10 * 1024 * 1024
export const ALLOWED_AUDIO_TYPES = ["audio/webm", "audio/mp4", "audio/ogg"]
export const DEFAULT_FEED_LIMIT = 20
export const MAX_FEED_LIMIT = 100
export const MAX_RECORDING_SECONDS = 60
```

Never hardcode magic numbers in components or handlers.
