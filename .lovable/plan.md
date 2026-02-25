

# Config File Instead of Environment Variables

## What Changes
Replace `import.meta.env` usage with a simple config file at `src/config/config.ts`.

## New File: `src/config/config.ts`
A single TypeScript file exporting configuration constants:
- `API_BASE_URL` (string, default empty)
- `API_KEY` (string, default empty)

## Modified File: `src/lib/api.ts`
- Remove the two `import.meta.env` lines
- Import `API_BASE_URL` and `API_KEY` from `../config/config`
- Use them in place of the old constants

No other files need changes.

