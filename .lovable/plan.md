

# Visual Polish: Bigger, Cleaner, Designer-Quality UI

## Overview
Elevate the UI to feel like it was crafted by a professional designer. Bigger touch targets, more whitespace, refined typography, subtle polish -- while keeping the clean Region Nordjylland identity.

## Changes

### 1. `src/index.css` -- Refined global styles
- Increase `--radius` from `0.5rem` to `0.75rem` for softer, more modern corners
- Add smooth font rendering (`-webkit-font-smoothing: antialiased`)
- Add subtle selection color styling

### 2. `src/pages/Index.tsx` -- Layout and component sizing

**Header**:
- Increase padding (`py-5 px-8`) and title size (`text-2xl`)
- Make the RN logo badge larger (`h-12 w-12`, bigger text)
- Add subtle subtitle letter-spacing

**Card**:
- Increase max-width to `max-w-2xl` and center with generous vertical padding (`py-16`)
- Add larger shadow (`shadow-lg`) and more internal padding
- Make card title larger (`text-xl`) with a larger icon

**Textarea**:
- Increase min-height to `180px` and font size to `text-lg`
- Add more padding inside

**Select triggers**:
- Make them taller (`h-12`) with larger text
- Labels bump to `text-base font-medium`

**Buttons**:
- "Upload stemme" button: use `size="lg"` with `h-12 px-6 text-base`
- "Generer lydfil" button: make even larger (`h-14 text-lg rounded-xl`) as the primary CTA
- Download button group: `size="lg"` with `h-12`

**Audio output section**:
- More padding, larger rounded corners (`rounded-xl p-6`)
- Bigger label text

**Progress bar**:
- Slightly taller (`h-4`) for better visibility

**General spacing**:
- Increase `space-y-6` to `space-y-8` for more breathing room between sections
- Settings grid gap from `gap-4` to `gap-6`
- Actions row gap from `gap-3` to `gap-4`

### 3. `src/components/VoiceUploadModal.tsx` -- Consistent sizing
- Make modal inputs taller (add `h-12` class)
- Upload button uses `size="lg"`
- More internal spacing

### 4. `src/components/ui/button.tsx` -- Global button size adjustments
- Default size: increase from `h-10` to `h-11`
- `lg` size: increase from `h-11` to `h-12 px-8 text-base`
- `icon` size: increase from `h-10 w-10` to `h-11 w-11`
- Add `font-semibold` to all buttons for stronger presence

## Files changed
- `src/index.css`
- `src/pages/Index.tsx`
- `src/components/VoiceUploadModal.tsx`
- `src/components/ui/button.tsx`

## What stays the same
- All functionality (API calls, state, logic)
- Color palette (Region Nordjylland blue identity)
- Dark mode support
- Component structure

