# CLL.md — Nordjysk Tale Hjerte (Regional TTS Frontend)

## 1. Project Identity
- **Name:** Nordjysk Tale Hjerte (Regional Tekst-til-Tale Service)
- **Org:** Region Nordjylland
- **Purpose:** Web frontend for a text-to-speech platform. Users input text, select voice/language, and generate downloadable audio. Supports single and bulk generation with AI text optimization via LLM. Includes content safety filtering.
- **Language:** Danish UI (all labels, messages, and errors are in Danish)

---

## 2. Tech Stack
| Layer | Technology |
|-------|-----------|
| Framework | React 18 + TypeScript |
| Bundler | Vite (port 8080 dev) |
| UI | Tailwind CSS + Shadcn UI (Radix primitives) + `class-variance-authority` |
| Routing | `react-router-dom` v6 |
| Data Fetching | TanStack React Query (`QueryClient` in `App.tsx`) |
| Auth | `@azure/msal-browser` v5 (Azure AD SSO, redirect flow, sessionStorage cache) |
| Styling Utils | `tailwind-merge`, `clsx` |
| File Handling | `jszip` (bulk ZIP download), `mammoth` (DOCX parsing) |
| Testing | Vitest + jsdom + `@testing-library/react` |
| Linting | ESLint v9 + `typescript-eslint` |
| Icons | `lucide-react` |

---

## 3. Project Structure
```
nordjysk-tale-hjerte/
├── src/
│   ├── App.tsx                # Root: BrowserRouter, QueryClientProvider, Routes
│   ├── main.tsx               # Entry point (ReactDOM.createRoot)
│   ├── authConfig.ts          # MSAL config (clientId, tenantId, redirectUri)
│   ├── useAuth.ts             # Auth hook: login, logout, restoreSession, getToken
│   ├── config/
│   │   └── config.ts          # API_BASE_URL, AUTH_BASE_URL, API_KEY (from env vars)
│   ├── lib/
│   │   └── api.ts             # All backend API calls (TTS + LLM + Admin + Content Safety)
│   ├── hooks/
│   │   └── use-toast.ts       # Shadcn toast hook (singleton reducer pattern)
│   ├── components/
│   │   ├── SingleGenerator.tsx    # Single text-to-speech UI (with content validation)
│   │   ├── BulkGenerator.tsx      # Bulk TTS (file upload, queue, ZIP export, content validation)
│   │   ├── VoiceUploadModal.tsx   # Admin voice upload dialog
│   │   ├── ThemeToggle.tsx        # Light/Dark theme switcher
│   │   ├── NavLink.tsx            # Navigation link helper
│   │   └── ui/                    # Shadcn UI primitives (48 components)
│   ├── pages/
│   │   ├── Index.tsx          # Main app page (authenticated, tabs: single/bulk)
│   │   ├── Admin.tsx          # Admin panel (voice upload + AD group management)
│   │   ├── Landing.tsx        # Login landing page
│   │   ├── Callback.tsx       # Azure AD redirect callback handler
│   │   └── NotFound.tsx       # 404 fallback
│   └── assets/
│       └── rn-logo.png        # Region Nordjylland logo
├── public/
│   ├── favicon.ico, favicon.jpg, placeholder.svg, robots.txt
├── Dockerfile                 # Multi-stage: node:20-alpine build → nginx:alpine serve
├── docker-compose.yml         # Service definition (port 4457:80, external network)
├── nginx.conf                 # SPA fallback (try_files $uri /index.html), asset caching
├── .gitlab-ci.yml             # CI/CD: includes shared docker-build-publish template
├── vite.config.ts             # Vite + SWC React plugin, @ alias → ./src
├── vitest.config.ts           # Vitest + jsdom environment
├── tailwind.config.ts         # Tailwind + shadcn theme, dark mode via class
├── tsconfig.json              # Composite: app + node refs, strict mode
├── components.json            # Shadcn UI config
└── package.json               # Dependencies and scripts
```

---

## 4. Routing
| Route | Component | Auth Required | Admin Only |
|-------|-----------|--------------|------------|
| `/callback` | `Callback` | No (handles redirect) | No |
| `/login` | `Landing` | No (login page) | No |
| `/` | `Index` | Yes | No |
| `/admin` | `Admin` | Yes | Yes |
| `*` | `NotFound` | No | No |

---

## 5. Authentication Flow
1. **Config:** `VITE_CLIENT_ID` + `VITE_TENANT_ID` env vars → `msalInstance` in `authConfig.ts`
2. **Login:** `loginRedirect()` with `prompt: select_account` → Azure AD → redirect to `/callback`
3. **Callback:** `handleRedirectPromise()` → `acquireTokenSilent()` → call `AUTH_BASE_URL/auth/me`
4. **Auth Response:** `{ isAuthenticated, isAdmin, user: { sub, name, email } }`
5. **Session Restore:** On app load, `restoreSession()` checks for cached accounts and silently acquires token
6. **Auth Guard:** `Index` and `Admin` pages check `isLoggedIn`/`isAdmin` and redirect to `/login` if unauthenticated
7. **Cache:** `sessionStorage` (MSAL), token passed as `Bearer` header to admin endpoints

**Important:** `AUTH_BASE_URL` is the same as `API_BASE_URL` (both point to the backend mounted at `/call`).
The backend endpoint is: `GET /call/auth/me` with `Authorization: Bearer <azure_ad_jwt_token>`.

---

## 6. Backend API (`src/lib/api.ts`)

### Base Configuration
- **Base URL:** `API_BASE_URL` from `config/config.ts` (set via `VITE_API_BASE_URL` env var)
- **Auth Header:** `X-API-Key: API_KEY` for TTS endpoints
- **Admin Auth:** `Authorization: Bearer <token>` in addition to API key

### Endpoints

| Method | Endpoint | Function | Returns | Auth |
|--------|----------|----------|---------|------|
| GET | `/auth/me` | (Auth verification) | `{ isAuthenticated, isAdmin, user }` | Bearer Token |
| GET | `/api/v1/tts/voices` | `fetchVoices()` | `Voice[]` | API Key |
| GET | `/api/v1/tts/languages` | `fetchLanguages()` | `Language[]` | API Key |
| POST | `/api/v1/tts/generate` | `generateSpeech(text, voice, language, speed)` | `Blob` (audio) | API Key |
| POST | `/api/v1/llm/query` | `queryLlm(userQuery)` | `{ response: string }` | API Key |
| POST | `/api/v1/llm/validate` | `validateContent(text)` | `ValidationResult` | API Key |
| POST | `/api/v1/tts/voices/upload` | `uploadVoice(name, language, file, token?)` | `void` | API Key + Bearer |
| GET | `/api/v1/tts/ad-groups` | `fetchAdGroups(token)` | `{ groups: AdGroup[] }` | Bearer |
| GET | `/api/v1/tts/ad-groups/voice-access` | `fetchVoiceAccessGroup(token)` | `{ group_id: string }` | Bearer |
| PUT | `/api/v1/tts/ad-groups/voice-access` | `setVoiceAccessGroup(token, groupId)` | `void` | Bearer |

### Data Models
```typescript
interface Voice { id: string; name: string; }
interface Language { id: string; name: string; }
interface AdGroup { id: string; name: string; }
interface ValidationResult { is_safe: boolean; reason: string | null; }
interface AuthUser { sub?: string; name?: string; email?: string; }
interface AuthMeResponse { isAuthenticated: boolean; isAdmin: boolean; user: AuthUser | null; error?: string; }
interface BulkLine {
  id: string; text: string; optimizedText?: string;
  status: "pending" | "optimizing" | "generating" | "done" | "error";
  progress: number; audioUrl?: string; audioBlob?: Blob; error?: string;
}
```

### Voice/Language Normalization
- `fetchVoices()` and `fetchLanguages()` handle multiple response formats (array of strings, array of objects with `name`/`id`/`code` keys, nested `data.voices` wrappers)
- Deduplication by `id` using a `Set`

### Content Safety Filter
- `validateContent(text)` calls `POST /api/v1/llm/validate` with `{ user_query: text }`
- Returns `{ is_safe: boolean, reason: string | null }`
- Checks for: Bandord (swearing), Seksuelt indhold (sexual content), Racisme og diskrimination (racism/discrimination), Politiske ekstremer (political extremes), Toksicitet (toxicity)
- Used as pre-validation in both `SingleGenerator` and `BulkGenerator` before calling `generateSpeech`
- `generateSpeech` also handles 400 errors from backend content validation

---

## 7. Core Features

### Single Generator (`SingleGenerator.tsx`)
- Text input (min-height textarea)
- Voice and language selectors (populated from API)
- AI text optimization via `queryLlm()` with progress bar
- **Content Safety:** Pre-validates text via `validateContent()` before generation
- Speech generation with animated progress indicator
- Audio playback with downloadable output (WAV/MP3/AU format selector)
- Clear text button

### Bulk Generator (`BulkGenerator.tsx`)
- Paste multiple text lines (separated by empty lines)
- File upload: `.txt` (newline-separated), `.csv` (row-separated), `.docx` (mammoth parsing)
- Queue management: add, edit (inline), remove lines
- Per-line actions: AI optimize, generate, re-generate
- Bulk actions: Optimize all, Generate all
- **Content Safety:** Pre-validates each line before generation in both single and bulk modes
- Individual audio playback and download per line
- Bulk ZIP download (using `jszip`)
- Status tracking per line with progress bars

### Admin Panel (`Admin.tsx`)
- Voice upload form (name, language, audio file — supports `.wav`, `.mp3`, `.ogg`, `.flac`, `.m4a`)
- AD group management: view available groups, select access group for voice upload feature
- Auth guard: requires `isAdmin: true` from `/auth/me` response

### Theme Toggle
- Light/Dark mode via `next-themes`

---

## 8. Environment Variables

| Variable | Used In | Purpose |
|----------|---------|---------|
| `VITE_API_BASE_URL` | Docker build arg | Backend API base URL (e.g., `https://talebesked.ai.rn.dk/call`) |
| `VITE_API_KEY` | Docker build arg | TTS API authentication key |
| `VITE_CLIENT_ID` | Docker build arg, nginx runtime | Azure AD application client ID |
| `VITE_TENANT_ID` | Docker build arg, nginx runtime | Azure AD tenant ID |

**Note:** `config/config.ts` reads `VITE_API_BASE_URL` and `VITE_API_KEY` at build time. `AUTH_BASE_URL` is derived from `API_BASE_URL`.

---

## 9. Docker & Deployment

### Dockerfile (Multi-stage)
- **Stage 1 (builder):** `node:20-alpine`, installs deps via npm, runs `npm run build`
- **Stage 2 (serve):** `nginx:alpine`, copies dist + public, uses `envsubst` for runtime env injection of `VITE_*` vars in `index.html`
- Runs as non-root `nginx` user on port 80
- Build args: `VITE_API_BASE_URL`, `VITE_API_KEY`, `VITE_CLIENT_ID`, `VITE_TENANT_ID`

### docker-compose.yml
- Service: `tts_frontend`
- Port mapping: `4457:80`
- External network: `small_apps`
- Resource limits: 4GB RAM, 0.5 CPU
- Runtime env: `VITE_API_BASE_URL`, `VITE_API_KEY`, `VITE_CLIENT_ID`, `VITE_TENANT_ID`

### nginx.conf
- SPA mode: `try_files $uri /index.html`
- Static asset caching: 1 year for common file types
- Error 404 → fallback to `index.html`

### GitLab CI
- Includes shared template: `iam/automation/templates/ci_cd-pipelines/.gitlab-ci-docker-build-publish.yml`
- Passes all `VITE_*` vars as Docker build args
- Leaks disabled (`DISABLE_GITLEAKS: "true"`)

---

## 10. NPM Scripts
```bash
npm run dev          # Start Vite dev server (port 8080)
npm run build        # Production build
npm run build:dev    # Development mode build
npm run lint         # ESLint
npm run preview      # Preview production build locally
npm run test         # Run Vitest once
npm run test:watch   # Vitest watch mode
```

---

## 11. Key Development Notes

### Adding New API Endpoints
1. Add function to `src/lib/api.ts`
2. Use `headers()` helper for `X-API-Key` auth
3. Add `Authorization: Bearer <token>` for admin endpoints
4. Handle errors with descriptive Danish messages

### Adding New UI Components
- Use Shadcn primitives from `src/components/ui/`
- Follow existing patterns: controlled inputs, toast notifications, loading states
- Import icons from `lucide-react`

### Adding New Pages
1. Create component in `src/pages/`
2. Add route in `src/App.tsx`
3. Wrap with auth checks using `useAuth()` if needed

### Speed Parameter
- Current `generateSpeech()` calls always pass `speed: 0.5` (hardcoded in both generators)
- The `speed` state exists in parent components but is not connected to the generate call

### Content Safety Integration
- Pre-validation via `validateContent()` is called before `generateSpeech()` in both generators
- If content is unsafe, the user receives a toast error with the reason from the backend
- Bulk mode skips unsafe lines and marks them as `"error"` with the validation reason
- Backend also validates on `/generate` and returns 400 if unsafe — handled in `generateSpeech()`

### Theme
- Dark mode supported via `next-themes` and Tailwind `dark:` variants
- `ThemeToggle` component available in headers

---

## 12. Test Setup
- **Framework:** Vitest with jsdom environment
- **Libraries:** `@testing-library/react` v16, `@testing-library/jest-dom`
- **Config:** `vitest.config.ts` — aliases `@` → `./src`
- Test files located in `src/test/`

---

## 13. Quick Reference

### Important Imports
```typescript
import { useAuth } from "@/useAuth";          // Auth hook
import { useToast } from "@/hooks/use-toast";  // Toast notifications
import { generateSpeech, fetchVoices, fetchLanguages, queryLlm, validateContent } from "@/lib/api";
import { API_BASE_URL, API_KEY, AUTH_BASE_URL } from "@/config/config";
import { isAuthConfigured } from "@/authConfig";
```

### Path Alias
- `@/` maps to `./src/` (configured in `vite.config.ts` and `tsconfig.app.json`)

---

*Last updated: 2026-05-21*