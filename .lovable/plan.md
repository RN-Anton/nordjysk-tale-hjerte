

# Region Nordjylland – Tekst-til-Tale Service

## Overview
A professional, accessible Text-to-Speech web application for Region Nordjylland. Fully Danish-language interface designed for non-technical users. Connects to an external TTS API via Docker environment variables.

---

## 1. Visual Identity & Layout
- **Color scheme**: Region Nordjylland blue (#004165) as primary, white/light grey backgrounds, professional red for accents/errors
- **Header**: Region Nordjylland logo placeholder + title "Regional Tekst-til-Tale Service"
- **Layout**: Clean, centered card on a light grey background — simple, uncluttered, public-service aesthetic
- **Typography**: Large, readable fonts with generous spacing for accessibility
- **All text in Danish** — labels, buttons, placeholders, error/success messages

## 2. Main Interface (Single Page)
A centered card with the following sections, top to bottom:

### Text Input
- Large `Textarea` labeled "Indtast din tekst her" with a helpful placeholder
- **Required field** — if empty when user clicks "Generer lydfil", show a Danish error message (e.g., "Du skal indtaste tekst før du kan generere en lydfil") and prevent submission

### Settings Row (all pre-filled with defaults)
- **Stemme (Voice)**: Dropdown fetching from `GET /voices` on mount — **default: `danish_voice`**
- **Sprog (Language)**: Dropdown fetching from `GET /languages` on mount — **default: first available / Danish**
- **Output format**: Toggle/dropdown — **default: `.wav`**

All settings come pre-selected so the user only needs to type text and press the button.

### Actions
- **"Upload stemme"** button → opens a modal dialog
- **"Generer lydfil"** button (large, prominent, blue) — **disabled/blocked if text field is empty**

### Output Area (appears after generation)
- Progress bar ("Fremdriftsbjælke") shown during processing
- Inline HTML5 audio player for playback
- "Download lydfil" download button

## 3. Voice Upload Modal
- Opens from "Upload stemme" button
- Fields: "Stemmenavn" (text input), "Sprog" (language select), file upload (.wav only)
- Danish validation: "Kun .wav filer er tilladt"
- Sends `POST /voices/upload` as FormData
- Success/error toast notifications in Danish

## 4. API Integration
- All API calls use `import.meta.env.VITE_API_BASE_URL` and `import.meta.env.VITE_API_KEY`
- Every request includes `X-API-Key` header
- Endpoints:
  - `GET /voices` — populate voice dropdown
  - `GET /languages` — populate language dropdown
  - `POST /generate` — JSON body with text, voice, language → returns audio file
  - `POST /voices/upload` — FormData with name, language, .wav file

## 5. Validation & Defaults Summary
- **Text field**: Required. Empty text → block submission + show Danish error message
- **Voice**: Defaults to `danish_voice` (pre-selected on load)
- **Output format**: Defaults to `.wav` (pre-selected on load)
- **Language**: Defaults to Danish (first available or matched from API)
- User can change any setting, but never has to — just type and click

## 6. Error Handling & UX
- All error messages in Danish (e.g., "Noget gik galt. Prøv igen.", "Kun .wav filer er tilladt", "Du skal indtaste tekst")
- Loading states on all async actions
- Disabled buttons during processing
- Toast notifications for success/failure
- Graceful handling if API is unreachable

## 7. Docker Configuration
- `Dockerfile` with multi-stage build (Node 20 → Nginx Alpine)
- Build args for `VITE_API_BASE_URL` and `VITE_API_KEY`
- `docker-compose.yml` for easy deployment

