---
trigger: always_on
---

# design-system.md

## Design Philosophy

Echoes MVP should feel:

* Simple
* Fast
* Minimal
* Focused

The recording experience should be the primary action.

---

## Color Palette

### Primary

```text
#000000  — Black (text, icons)
#FFFFFF  — White (backgrounds)
```

### Accent

```text
#2563EB  — Blue (primary buttons, active states)
#1D4ED8  — Blue dark (hover states)
#DBEAFE  — Blue light (subtle backgrounds)
```

### Neutral

```text
#F9FAFB  — Gray 50 (page background)
#F3F4F6  — Gray 100 (card backgrounds)
#E5E7EB  — Gray 200 (borders)
#9CA3AF  — Gray 400 (secondary text)
#6B7280  — Gray 500 (placeholders)
#374151  — Gray 700 (secondary text)
#111827  — Gray 900 (headings)
```

### State

```text
#DC2626  — Red (errors, stop recording)
#16A34A  — Green (success, recording active)
#F59E0B  — Amber (warnings)
```

### Dark Mode

Not included in MVP #1. Light theme only.

---

## Responsive Breakpoints

```text
Mobile:  0px — 639px
Tablet:  640px — 1023px
Desktop: 1024px — infinity
```

Design mobile first. Enhance for larger screens.

---

## Layout

Single page application.

Structure:

```text
Header
  Logo / Title

Recording Section
  Record Button
  Timer
  Submit Button

Voice Feed
  Voice Cards (list)

Footer
  Minimal text
```

---

## Max Width

Content container max width:

```text
Mobile:  100% (with 16px padding)
Tablet:  640px
Desktop: 768px
```

Center content horizontally.

---

## Spacing Scale

```text
4px   — xs
8px   — sm
12px  — md
16px  — lg
24px  — xl
32px  — 2xl
48px  — 3xl
64px  — 4xl
```

Use consistently. Never use arbitrary values.

---

## Border Radius

```text
8px  — Standard (buttons, cards, inputs)
9999px — Full round (circular buttons, badges)
```

---

## Borders

```text
1px solid #E5E7EB — Default border
```

No thick borders. No decorative borders.

---

## Shadows

```text
sm: 0 1px 2px rgba(0,0,0,0.05)
md: 0 4px 6px rgba(0,0,0,0.07)
lg: 0 10px 15px rgba(0,0,0,0.1)
```

Use for elevation only. No decorative shadows.

---

## Typography

### Font

```text
Inter
```

Fallback:

```text
sans-serif
```

### Weights

```text
400 — Regular (body text)
500 — Medium (buttons, labels)
600 — Semibold (headings)
700 — Bold (hero text, primary actions)
```

### Sizes

```text
12px — xs   (captions, timestamps)
14px — sm   (secondary text)
16px — base (body text)
18px — lg   (subheadings)
20px — xl   (section titles)
24px — 2xl  (page titles)
32px — 3xl  (hero text)
```

### Line Heights

```text
1.4 — Tight (headings)
1.5 — Normal (body text)
1.6 — Relaxed (long form)
```

---

## Icons

Use emoji or simple SVG icons.

No icon library required for MVP.

Keep icons minimal. Maximum one icon per card.

---

## Buttons

### Primary Button

```text
Background: #2563EB
Text:       #FFFFFF
Height:     48px
Padding:    16px 24px
Radius:     8px
Font:       16px, weight 600
```

Hover:

```text
Background: #1D4ED8
```

Disabled:

```text
Background: #9CA3AF
Cursor:     not-allowed
```

### Secondary Button

```text
Background: transparent
Border:     1px solid #E5E7EB
Text:       #374151
Height:     48px
```

### Icon Button (Play/Pause)

```text
Size:       48px x 48px
Background: #2563EB
Icon:       #FFFFFF
Radius:     9999px (circle)
```

### Touch Targets

Minimum 44px x 44px for all interactive elements.

---

## Form Inputs

### Text Input

```text
Height:     48px
Padding:    12px 16px
Border:     1px solid #E5E7EB
Radius:     8px
Font:       16px
Background: #FFFFFF
```

Focus:

```text
Border:     #2563EB
Ring:       0 0 0 3px #DBEAFE
```

---

## Cards

### Voice Note Card

```text
Background: #FFFFFF
Border:     1px solid #E5E7EB
Radius:     8px
Padding:    16px
Shadow:     sm
```

Contents:

```text
[Play Button]  Duration   Timestamp
```

Spacing between cards:

```text
12px
```

---

## Recording Section

### Recording Indicator

When recording active:

```text
Pulsing red dot    (12px circle, #DC2626)
Countdown timer    (24px, weight 600, color #374151)
```

Animation:

```text
Pulse: scale 1 → 1.2 → 1, infinite, 1s ease
```

### Timer Display

```text
Format:   MM:SS
Size:     32px
Weight:   600
Color:    #374151
```

When under 10 seconds remaining:

```text
Color:    #DC2626
```

---

## Loading States

### Skeleton Loader

```text
Background: #F3F4F6
Border:     8px
Animation:  shimmer (left to right gradient, 1.5s infinite)
```

### Spinner

```text
Size:       24px
Color:      #2563EB
Animation:  rotate 360deg, 1s linear infinite
```

### Button Loading

Replace text with spinner. Disable button during loading.

---

## Empty State

When feed has no voice notes:

```text
Icon:    Microphone emoji
Title:   "No voice notes yet"
Subtitle: "Be the first to record"
```

Centered. Gray text (#6B7280).

---

## Error State

When upload fails or fetch fails:

```text
Background: #FEF2F2
Border:     1px solid #FEE2E2
Text:       #DC2626
Radius:     8px
Padding:    16px
```

Show retry button below message.

---

## Animations

Keep animations minimal.

```text
Duration:  150ms — 300ms
Easing:    ease-in-out
```

No complex transitions. No bouncing. No parallax.

---

## Focus States

All interactive elements:

```text
Outline:   2px solid #2563EB
Outline:   2px offset
```

Never remove focus outline. Required for keyboard navigation.

---

## Accessibility

Provide:

* Keyboard navigation (Tab, Enter, Space, Escape)
* Focus states on all interactive elements
* ARIA labels on buttons and controls
* Contrast ratio 4.5:1 minimum for text
* Alt text for decorative elements (if any)
* Screen reader announcements for recording state

Recording controls must be accessible.

---

## Header

```text
Title:    "Echoes"
Subtitle: "Voice notes from strangers"
```

No logo. No navigation. No complexity.

---

## Footer

```text
Text: "Echoes MVP"
```

Centered. Gray text. No links.

---

## Design Rule

If a UI element does not help users:

* Record
* Upload
* Listen

It probably should not exist in MVP #1.
