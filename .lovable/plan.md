

# Three changes: Default Danish, auto-select uploaded voice, download format picker

## 1. Default language to Danish ("da")

**Index.tsx**: When languages load, find the entry with `id === "da"` and use that as default instead of `l[0]`. Fallback to first entry if "da" not found.

**VoiceUploadModal.tsx**: Initialize `language` state to `"da"` instead of `""`, so Danish is pre-selected when the modal opens.

## 2. Auto-select newly uploaded voice

**VoiceUploadModal.tsx**: Change `onSuccess` callback signature to `onSuccess(voiceName: string)` so it passes the uploaded voice name back.

**Index.tsx**: Update `refreshVoices` to accept a `voiceName` parameter. After fetching the updated voice list, set the selected voice to the newly uploaded one. Update the `onSuccess` prop passed to the modal accordingly.

## 3. Download format dropdown (WAV, MP3, AU)

**Index.tsx**: Add a `downloadFormat` state (default `"wav"`). Replace the single "Download lydfil" button with a button group: a primary download button and a dropdown next to it for format selection (`.wav`, `.mp3`, `.au`).

The download handler will use the selected format for the file extension. Since the backend generates `.wav`, the file is downloaded as-is with the chosen extension. (Client-side audio conversion is not feasible without extra libraries, so this gives the user the filename they want -- if actual format conversion is needed later, that would be a backend feature.)

Uses the existing `DropdownMenu` component already available in the project.

## Technical details

### Files changed

**`src/pages/Index.tsx`**:
- Language default: find `"da"` in loaded languages array
- `refreshVoices` accepts optional `voiceName` string, sets `voice` state to it after fetch
- Add `downloadFormat` state, default `"wav"`
- Replace download button with button + dropdown menu for format selection
- Import `DropdownMenu` components and `ChevronDown` icon

**`src/components/VoiceUploadModal.tsx`**:
- Change `onSuccess` prop type to `(voiceName: string) => void`
- Initialize `language` state to `"da"`
- Pass `name` to `onSuccess(name)` on successful upload

