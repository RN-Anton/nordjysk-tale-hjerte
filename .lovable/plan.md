

# Add Speed Slider (0.5x - 2.0x)

## Overview
Add a speed control slider to both the single and bulk generators, sending the `speed` parameter to the backend's `/api/v1/tts/generate` endpoint.

## Changes

### 1. `src/lib/api.ts` -- Add `speed` parameter to `generateSpeech`
- Add `speed: number = 1.0` as a fourth parameter
- Include `speed` in the JSON payload sent to the backend

### 2. `src/pages/Index.tsx` -- Shared speed state
- Add `speed` state (default `1.0`) alongside existing `voice`/`language` state
- Pass `speed` and `setSpeed` via `sharedProps` to both generators

### 3. `src/components/SingleGenerator.tsx` -- Speed slider UI + usage
- Add `speed` and `setSpeed` to the props interface
- Add a slider row below the voice/language selects using the existing `Slider` component from `@/components/ui/slider`
- Slider config: `min={0.5}`, `max={2}`, `step={0.25}`, showing the current value as a label (e.g. "1.0x")
- Pass `speed` to the `generateSpeech` call

### 4. `src/components/BulkGenerator.tsx` -- Same slider + usage
- Add `speed` and `setSpeed` to the props interface
- Add the same speed slider in the settings area
- Pass `speed` to each `generateSpeech` call in the bulk queue

## Slider UI
- Placed in a new row below the voice/language grid (or as a third column on wide screens)
- Label: "Hastighed" with the current value displayed (e.g. "1.0x")
- Uses the existing Radix `Slider` component already in the project

## Files changed
- `src/lib/api.ts`
- `src/pages/Index.tsx`
- `src/components/SingleGenerator.tsx`
- `src/components/BulkGenerator.tsx`

