

# Landing Page with Login Gate and Admin-Conditional UI

## Overview
Replace the current direct-to-app flow with a landing page that requires Azure AD login. After login, check admin status via `/auth/me`. Non-admins see the TTS tool without the admin button; admins see the Settings icon to access the admin panel.

## Changes

### 1. New Landing Page (`src/pages/Landing.tsx`)
- Full-screen page with the same primary color header/branding as Index
- Region Nordjylland logo, "Velkommen til Regional Tekst-til-Tale Service" heading
- Single "Log ind" button that triggers MSAL login popup
- On successful login, navigate to `/` (the main app)
- Uses same theme colors/ThemeToggle

### 2. Update Routing (`src/App.tsx`)
- Add new route: `/login` renders `Landing`
- `/` still renders `Index` (but Index now gates on authentication)

### 3. Update Index Page (`src/pages/Index.tsx`)
- On mount: check if MSAL has an active account. If not, redirect to `/login`.
- After confirming authentication, call `fetchAuthMe(token)` to get admin status.
- Store `isAdmin` in local state.
- Conditionally render the Settings (admin panel) button only when `isAdmin === true`.
- Remove the Settings button for non-admin users entirely.
- Show a loading spinner while the auth check is in progress.

### 4. Auth helper update (`src/lib/auth.ts`)
- Remove `X-API-Key` from the `/auth/me` call (backend says it's not required for this endpoint).

## Flow

```text
User visits /
  → No MSAL account? → Redirect to /login (Landing page)
  → "Log ind" button → MSAL popup → On success → Navigate to /
  → Index mounts → acquireToken → fetchAuthMe
    → isAdmin=true  → show Settings icon + TTS tool
    → isAdmin=false → show TTS tool only (no Settings icon)
```

## Technical Details
- MSAL `instance.getAllAccounts()` is used to check if user is logged in
- The `useMsal` and `useIsAuthenticated` hooks from `@azure/msal-react` handle reactivity
- Landing page uses `instance.loginPopup(loginRequest)` for the login flow
- No changes to the Admin page itself -- it already has its own auth gating

