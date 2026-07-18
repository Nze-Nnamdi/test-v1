# Component Builder Skill

## Purpose

Build React components for Echoes MVP #1 using Next.js and TypeScript.

The skill must prioritize:

* Simplicity
* Readability
* Reusability
* Accessibility

---

# Responsibilities

When asked to build a component:

1. Understand its purpose
2. Verify it supports an approved MVP feature
3. Determine if client or server component
4. Create a strongly typed component
5. Keep the component focused on a single responsibility
6. Handle all states (loading, empty, error, success)
7. Follow design-system.md
8. Follow code-style.md

---

# Approved MVP Components

```text
VoiceRecorder
VoiceFeed
VoicePlayer
VoiceFeedItem
Header
Footer
Button
```

---

# Client vs Server Decision

### Client Component

Use when component needs:

* `useState` / `useReducer`
* Browser APIs (`MediaRecorder`, `navigator.mediaDevices`)
* Event handlers (`onClick`, `onChange`)
* `useEffect` with browser interaction

Add directive at top:

```tsx
"use client"
```

### Server Component

Use when component:

* Only fetches/displays data
* Has no interactivity
* Uses no browser APIs

Default. No directive needed.

### Rules

* Never mix client and server in one file
* Keep client components as small as possible
* Extract server logic to separate files

---

# Component Structure

### Client Component

```tsx
"use client"

import { useState } from "react"

type VoiceRecorderProps = {
  onComplete: (blob: Blob) => void
}

export function VoiceRecorder({ onComplete }: VoiceRecorderProps) {
  const [state, setState] = useState<"idle" | "recording" | "submitting">("idle")

  if (!onComplete) return null

  return (
    <div>
      {/* content */}
    </div>
  )
}
```

### Server Component

```tsx
import { prisma } from "@/lib/prisma"

type VoiceFeedProps = {
  limit?: number
}

export async function VoiceFeed({ limit = 20 }: VoiceFeedProps) {
  const notes = await prisma.voiceNote.findMany({
    take: limit,
    orderBy: { createdAt: "desc" },
  })

  if (notes.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No voice notes yet</p>
      </div>
    )
  }

  return (
    <div>
      {/* content */}
    </div>
  )
}
```

---

# Rules

## Single Responsibility

Good:

```text
VoiceRecorder — records audio
VoicePlayer — plays audio
VoiceFeed — displays list
```

Bad:

```text
VoiceRecorderAndFeedAndPlayer
```

## Type Safety

Never use:

```ts
any
```

Always define types explicitly.

## Accessibility

Every interactive component must include:

* `aria-label` on buttons
* Keyboard support (Enter, Space, Escape)
* Focus states
* Screen reader announcements for state changes

```tsx
<button
  aria-label={isRecording ? "Stop recording" : "Start recording"}
  className="focus:outline-none focus:ring-2 focus:ring-blue-500"
  onClick={toggleRecording}
>
  {isRecording ? "Stop" : "Record"}
</button>
```

## State Management

Use:

```tsx
useState
useEffect
useReducer
```

Avoid introducing:

```text
Redux
MobX
Zustand
Jotai
Recoil
```

for MVP.

## Props

* Destructure in function signature
* Keep under 5 props
* Suffix interface with `Props`

```tsx
type VoicePlayerProps = {
  audioUrl: string
  duration: number
}

export function VoicePlayer({ audioUrl, duration }: VoicePlayerProps) {
  // ...
}
```

---

# State Handling

Every component must handle:

### Loading State

```tsx
if (loading) {
  return (
    <div className="animate-pulse bg-gray-100 h-12 rounded-lg" />
  )
}
```

### Empty State

```tsx
if (items.length === 0) {
  return (
    <div className="text-center py-12">
      <p className="text-gray-500">No voice notes yet</p>
    </div>
  )
}
```

### Error State

```tsx
if (error) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
      <p className="text-red-600">{error}</p>
      <button onClick={retry}>Try again</button>
    </div>
  )
}
```

### Success State

```tsx
return (
  <div>
    {/* normal content */}
  </div>
)
```

---

# File Location

### Feature Components

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
├── VoicePlayer/
│   ├── VoicePlayer.tsx
│   └── index.ts
```

### Shared Components

```text
components/
├── Button/
│   ├── Button.tsx
│   └── index.ts
├── Header/
│   ├── Header.tsx
│   └── index.ts
├── Footer/
│   ├── Footer.tsx
│   └── index.ts
```

---

# Barrel Files

Create `index.ts` for each component folder:

```ts
export { VoiceRecorder } from './VoiceRecorder'
```

Import via barrel:

```tsx
import { VoiceRecorder } from "@/components/VoiceRecorder"
```

---

# CSS/Styling

Use Tailwind CSS classes.

Follow design-system.md spacing scale:

```text
4px  — p-1 / m-1
8px  — p-2 / m-2
12px — p-3 / m-3
16px — p-4 / m-4
24px — p-6 / m-6
32px — p-8 / m-8
48px — p-12 / m-12
64px — p-16 / m-16
```

Colors from palette:

```text
#000000  — text-black
#FFFFFF  — bg-white
#2563EB  — bg-blue-600
#F9FAFB  — bg-gray-50
#F3F4F6  — bg-gray-100
#E5E7EB  — border-gray-200
#6B7280  — text-gray-500
#DC2626  — text-red-600
#16A34A  — text-green-600
```

Never use inline styles.

---

# Testing

Each component should have a test file:

```text
VoiceRecorder.tsx → VoiceRecorder.test.tsx
```

Basic tests:

* Renders without error
* Handles click events
* Shows correct state
* Accessible elements present

---

# Output Requirements

Every generated component must include:

* TypeScript typing
* Named export
* Client directive (if needed)
* State handling (loading, empty, error)
* Accessibility attributes
* Tailwind styling
* Placed in correct file location
* Barrel file updated

---

# Hook Extraction

If component has complex logic, extract to custom hook:

```tsx
// hooks/useRecording.ts
export function useRecording() {
  const [state, setState] = useState("idle")
  // logic
  return { state, start, stop }
}

// components/VoiceRecorder/VoiceRecorder.tsx
"use client"
import { useRecording } from "@/hooks/useRecording"

export function VoiceRecorder() {
  const { state, start, stop } = useRecording()
  // render
}
```

Hook naming: `use` prefix, camelCase.

---

# MVP Guardrail

If the requested component supports:

* Reactions
* Notifications
* Profiles
* Messaging
* Search
* Moderation

Refuse implementation and explain that the feature is outside MVP scope.
