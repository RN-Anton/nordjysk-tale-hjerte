

# Admin Panel with OIDC/SSO Authentication

## Overview
Add a protected admin page at `/admin` with OIDC/SSO login (Azure AD). The admin panel provides two features: voice upload and AD group permission management. The frontend will call backend endpoints that you'll add to the TTS backend later.

## Expected Backend Endpoints (for you to implement later)

| Endpoint | Method | Purpose |
|---|---|---|
| `/auth/me` | GET | Returns `{ isAuthenticated, isAdmin, user }` based on Bearer token |
| `/api/v1/tts/voices/upload` | POST | Already exists -- upload a voice file |
| `/api/v1/tts/ad-groups` | GET | Returns list of available AD groups |
| `/api/v1/tts/ad-groups/voice-access` | GET | Returns currently selected AD group for voice access |
| `/api/v1/tts/ad-groups/voice-access` | PUT | Sets which AD group has voice access |

All admin endpoints expect a Bearer token in the Authorization header.

## Frontend Changes

### 1. Auth library and OIDC config
- Add `@azure/msal-browser` and `@azure/msal-react` for Azure AD SSO
- Create `src/config/auth.ts` with MSAL config reading from `VITE_AZURE_CLIENT_ID`, `VITE_AZURE_TENANT_ID`, and `VITE_AZURE_REDIRECT_URI` env vars
- Wrap the app in `MsalProvider` in `App.tsx`

### 2. Auth context (`src/lib/auth.ts`)
- Helper to acquire a token silently from MSAL
- `fetchAuthMe(token)` function that calls `GET /auth/me` with the Bearer token
- Returns user info and admin status

### 3. API additions (`src/lib/api.ts`)
- `fetchAdGroups(token)` -- calls `GET /api/v1/tts/ad-groups`
- `fetchVoiceAccessGroup(token)` -- calls `GET /api/v1/tts/ad-groups/voice-access`
- `setVoiceAccessGroup(token, groupId)` -- calls `PUT /api/v1/tts/ad-groups/voice-access`
- Re-export existing `uploadVoice` (already in api.ts)

### 4. Admin page (`src/pages/Admin.tsx`)
- On mount: acquire token silently, call `/auth/me`
- If not authenticated: show "Log ind" button triggering MSAL login popup
- If authenticated but not admin: show "Ingen adgang" message
- If admin, show two card sections:

**Voice Upload card** -- reuses the upload form (name, language, file) previously in VoiceUploadModal, now inline on the page.

**AD Group Access card** -- fetches available AD groups from backend, shows a Select dropdown of groups, displays the currently selected group, and a "Gem" (Save) button to update the selection.

### 5. Routing (`src/App.tsx`)
- Add `<Route path="/admin" element={<Admin />} />`

### 6. Navigation
- Add an "Admin" link/icon in the header of `Index.tsx` that navigates to `/admin`
- Admin page gets a "Tilbage" (Back) link to return to `/`

## Technical Details

- MSAL handles the OIDC token exchange with Azure AD
- The token is passed as `Authorization: Bearer <token>` to all admin API calls
- The existing `X-API-Key` header continues to be sent alongside the Bearer token
- Config values (`VITE_AZURE_CLIENT_ID`, `VITE_AZURE_TENANT_ID`) will be empty in dev but injected at build time via CI/CD, same pattern as `VITE_API_KEY`
- When backend endpoints aren't ready yet, the UI will show appropriate error messages from failed fetches

