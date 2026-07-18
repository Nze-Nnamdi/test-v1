# Workflow: New Component

## Goal

Create a new React component that follows Echoes MVP architecture, design, and code standards.

---

# Step 1 — Validate Purpose

Ask:

```text
Does this component directly support:
- Recording audio?
- Uploading audio?
- Displaying voice notes?
- Playing audio?
```

If NO:

Stop and explain why it falls outside MVP scope.

---

# Step 2 — Identify Component Type

Examples:

```text
UI Component
Feature Component
Layout Component
```

Examples:

```text
Button
VoiceRecorder
VoiceFeed
Header
```

---

# Step 3 — Determine Client vs Server

Decide if component needs:

* State (`useState`, `useReducer`)
* Browser APIs (`MediaRecorder`, `navigator.mediaDevices`)
* Event handlers (`onClick`, `onChange`)
* Effects (`useEffect`)

If YES:

Add `"use client"` directive at top of file.

If NO:

Default to Server Component.

---

# Step 4 — Define Props

Create explicit TypeScript types.

Example:

```tsx
type VoicePlayerProps = {
  audioUrl: string
  duration: number
}
```

Rules:

* Suffix props interface with `Props`
* Use `interface` for objects
* Destructure in function signature
* Keep under 5 props

---

# Step 5 — Build Component

Requirements:

* Functional component
* TypeScript
* Accessible controls
* Single responsibility
* Early returns for validation

Template:

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
      {/* component content */}
    </div>
  )
}
```

---

# Step 6 — Add States

Handle all possible states:

### Loading State

```tsx
if (loading) {
  return <div className="animate-pulse bg-gray-100 h-12 rounded-lg" />
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

---

# Step 7 — Add Accessibility

Every component must include:

* `aria-label` on interactive elements
* Keyboard support (Enter, Space, Escape)
* Focus states
* Screen reader announcements for state changes

```tsx
<button
  aria-label={isRecording ? "Stop recording" : "Start recording"}
  onClick={toggleRecording}
>
  {isRecording ? "Stop" : "Record"}
</button>
```

---

# Step 8 — Verify Design System

Confirm:

* Spacing scale (4, 8, 12, 16, 24, 32, 48, 64)
* Typography (Inter font, correct weights)
* Colors from palette
* Mobile responsiveness
* Touch targets (44px minimum)

---

# Step 9 — Verify Code Style

Confirm:

* No `any` types
* Clear naming (PascalCase components, camelCase functions)
* Imports ordered correctly
* Early returns used
* Functions under 40 lines
* No unnecessary comments

---

# Step 10 — Verify MVP Alignment

Reject implementation if component introduces:

```text
profiles
comments
likes
notifications
messaging
search
AI features
moderation
```

---

# Step 11 — Output

Generate:

1. Component file in correct location
2. Types (inline or imported)
3. Correct imports
4. Named export
5. Client directive (if needed)

---

# File Location

### Components

```text
components/
├── VoiceRecorder/
│   ├── VoiceRecorder.tsx
│   ├── VoiceRecorderControls.tsx
│   └── index.ts
```

### Utility Components

```text
components/
├── Button/
│   ├── Button.tsx
│   └── index.ts
```

### Barrel Files

Create `index.ts` for component folders:

```ts
export { VoiceRecorder } from './VoiceRecorder'
```

---

# Example

Request:

```text
Build VoiceRecorder component
```

Workflow:

```text
Validate purpose
→ Determine client component
→ Define props
→ Create TypeScript component
→ Add recording controls
→ Handle all states
→ Add accessibility
→ Verify design system
→ Verify code style
→ Return implementation
```

---

# Success Criteria

A successful component:

* Solves one problem
* Is reusable
* Is accessible
* Handles all states (loading, empty, error, success)
* Matches design-system.md
* Supports MVP validation goals
* Is placed in correct file location
* Uses named export
