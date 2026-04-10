

## Changes

### 1. Update button text in `src/pages/Landing.tsx`
Change "Log ind" to "Digitalisering og IT Login" on the login button.

### 2. Switch from popup to redirect-based login in `src/useAuth.ts`
- Replace `loginPopup` with `loginRedirect` — the login page opens in the same tab
- Replace `logoutPopup` with `logoutRedirect`
- Add `handleRedirectPromise()` call at the start of `restoreSession` to process the return from Azure AD
- The `login` function will no longer return a value (it navigates away), so `Landing.tsx` will just call `login()` without awaiting a result
- Post-login session restoration happens automatically when the page reloads after redirect

### Files to change
- `src/pages/Landing.tsx` — button text + simplify `handleLogin`
- `src/useAuth.ts` — redirect flow + `handleRedirectPromise`

