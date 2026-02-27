

# Add AI Text Optimization Button

## Overview
Add a new "AI Optimer tekst" button that sends the user's text to the backend LLM endpoint (`/api/v1/llm/query`) and replaces it with the optimized version. The button will have a distinct AI-branded look (purple/violet gradient) to make it clearly stand out as an AI feature.

## Changes

### 1. `src/lib/api.ts` -- Add LLM query function

Add a new `queryLlm` function:
- Endpoint: `POST {BASE_URL}/api/v1/llm/query`
- Headers: `X-API-Key` + `Content-Type: application/json`
- Payload: `{ user_query: string }`
- Returns the `response` string from the JSON result `{ response: "..." }`
- Uses the same `headers()` helper and config validation as the other API calls

### 2. `src/pages/Index.tsx` -- Add AI optimize button and state

**New state:**
- `optimizing: boolean` -- tracks loading state for the LLM call

**New handler `handleOptimize`:**
- Validates text is not empty
- Calls `queryLlm(text)`
- Replaces `text` state with the returned optimized text
- Shows a toast on success/error

**UI placement -- below the textarea:**
- Place a new button directly under the textarea, right-aligned
- The button uses a purple/violet gradient background (`bg-gradient-to-r from-violet-500 to-purple-600`) with white text and a `Sparkles` icon from lucide-react
- Shows a spinning loader while optimizing
- Label: "AI Optimer tekst"
- Disabled when text is empty or when already optimizing/generating

This keeps the layout clean: textarea at top, AI button right below it as a utility action on the text, then settings, then the main generate button.

### 3. Visual distinction for the AI button

- Purple/violet gradient background (clearly different from the blue primary theme)
- `Sparkles` icon to signal AI functionality
- Slightly smaller than the main CTA but still prominent
- Hover state darkens the gradient

## Files changed
- `src/lib/api.ts` -- add `queryLlm()` function
- `src/pages/Index.tsx` -- add state, handler, and AI button UI

## What stays the same
- All existing functionality and layout structure
- Color scheme for non-AI elements
- API authentication pattern

