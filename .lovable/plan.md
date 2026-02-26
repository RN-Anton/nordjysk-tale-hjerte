

# Align Frontend API Calls with Backend

The frontend API layer (`src/lib/api.ts`) does not match the backend endpoints revealed by your working Python test script. Here are all the mismatches and the fixes needed.

## Issues Found

1. **Missing URL prefix** -- Backend uses `/api/v1/tts/` before each endpoint (`/languages`, `/voices`, `/generate`, `/voices/upload`). The frontend has no prefix.
2. **Response parsing for voices** -- Backend returns `{"voices": [...]}` but frontend expects a flat array.
3. **Response parsing for languages** -- Backend returns `{"languages": [...]}` but frontend expects a flat array.
4. **Voice upload field names** -- Backend expects `voice_name` and `voice_file`; frontend sends `name` and `file`.
5. **Generate payload** -- Backend does not use a `format` field; frontend sends one. The `voice` field should be omitted if empty (backend treats it as optional).

## Changes

### 1. `src/config/config.ts`
No structural change, but the `API_BASE_URL` should be set to include the base domain only (e.g. `http://10.253.131.155:4456`). The TTS prefix will be added in the API layer.

### 2. `src/lib/api.ts` (main changes)
- Add a `TTS_PREFIX` constant set to `/api/v1/tts`.
- Update all fetch URLs to use `BASE_URL + TTS_PREFIX + /endpoint`.
- `fetchVoices`: parse `response.json()` then extract `.voices` array; map each item to `{ id: item.name, name: item.name }`.
- `fetchLanguages`: parse `response.json()` then extract `.languages` array; map to `{ id, name }` using the known language list.
- `uploadVoice`: change FormData field names from `name`/`file` to `voice_name`/`voice_file`; remove `Content-Type` header (let browser set multipart boundary).
- `generateSpeech`: remove `format` from the JSON body; only include `voice` if provided.

### 3. `src/pages/Index.tsx`
- Remove the `format` select dropdown from the UI (backend always returns WAV).
- Remove `format` state variable.
- Update `handleGenerate` to call `generateSpeech(text, voice, language)` without format.
- Update download filename to always use `.wav`.

### 4. `src/components/VoiceUploadModal.tsx`
No changes needed -- the `uploadVoice` function signature stays the same; only the internals of `api.ts` change.

## Technical Summary

All changes ensure the frontend sends requests exactly matching the backend's tested API contract:
- `GET /api/v1/tts/languages` with `X-API-Key` header
- `GET /api/v1/tts/voices` with `X-API-Key` header
- `POST /api/v1/tts/voices/upload` with `X-API-Key` header, multipart form (`voice_name`, `language`, `voice_file`)
- `POST /api/v1/tts/generate` with `X-API-Key` + `Content-Type: application/json`, body `{"text", "voice", "language"}`

