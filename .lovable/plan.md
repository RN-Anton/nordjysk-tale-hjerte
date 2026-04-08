

# Fix: MSAL `crypto_nonexistent` Error

## Problem
`new PublicClientApplication(msalConfig)` runs at module load time (line 15) and immediately requires the Web Crypto API. In environments where crypto is unavailable (e.g., the Lovable preview iframe, or certain restricted browser contexts like Imprivata CE), this crashes the entire app.

## Solution
Defer MSAL initialization into a React component using `useState` + `useEffect`, and guard it with a crypto availability check. If crypto is unavailable, render the app without `MsalProvider` (landing page will show an error message instead of crashing).

### Changes

**`src/App.tsx`**
- Remove the top-level `const msalInstance = new PublicClientApplication(msalConfig)`.
- Add a state-based initialization inside the `App` component:
  - `msalInstance` state starts as `null`.
  - `useEffect` checks `window.crypto?.subtle` exists, then creates the instance.
  - If crypto is unavailable, set an `error` state.
- If `msalInstance` is `null` and no error, show a loading spinner.
- If error, show a message: "Browseren understøtter ikke den nødvendige kryptering. Prøv en anden browser."
- If initialized, render `<MsalProvider instance={msalInstance}>` as before.

**`src/pages/Landing.tsx`** — no changes needed; it already depends on `useMsal` which will only run when wrapped in `MsalProvider`.

This approach ensures the app never crashes at load time, and works correctly once deployed to a proper environment with Web Crypto support.

