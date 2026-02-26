

# Fix: Double-nested API response parsing

## Problem
The backend wraps responses in a double-nested structure that the frontend doesn't handle:
- `/voices` returns `{"voices": {"voices": [...]}}`  
- `/languages` returns `{"languages": {"languages": [...]}}`

The current `normalizeVoices`/`normalizeLanguages` receive an object instead of an array, so they return empty results.

## Fix in `src/lib/api.ts`

### `fetchVoices` (around line 70-80)
Change the raw data extraction to unwrap the double nesting:
```
const outer = data.voices ?? data;
const raw = Array.isArray(outer) ? outer : (outer.voices ?? outer);
```
This handles both `{"voices": [...]}` and `{"voices": {"voices": [...]}}`.

### `fetchLanguages` (around line 82-92)
Same pattern:
```
const outer = data.languages ?? data;
const raw = Array.isArray(outer) ? outer : (outer.languages ?? outer);
```

### `normalizeLanguages` function
The backend returns language objects with `code` and `name` fields (e.g. `{"code":"da","name":"Danish"}`). Update the normalizer to also read the `code` field for the `id`:
- Already handled: the existing code reads `obj.code` as a fallback for `id`. No change needed here.

## Summary of changes
Only `src/lib/api.ts` needs to be edited -- two small changes to unwrap the double-nested response before passing to the normalizer functions. No UI changes needed since the loading/error states already work correctly.
