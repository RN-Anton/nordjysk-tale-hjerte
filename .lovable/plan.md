
Fix the broken removal by cleaning up the last leftover voice-upload references in `src/pages/Index.tsx`.

## What to change

1. Remove the unused refresh callback
- Delete `refreshVoices`, since it only existed for the upload modal success flow.
- This also removes dead code around selecting a newly uploaded voice.

2. Remove the lingering modal render
- Delete the `<VoiceUploadModal ... />` block at the bottom of `Index.tsx`.
- This is the direct cause of the current runtime and TypeScript errors:
  - `VoiceUploadModal is not defined`
  - `uploadOpen is not defined`
  - `setUploadOpen is not defined`

3. Keep the rest of the page intact
- Leave `SingleGenerator` and `BulkGenerator` usage unchanged.
- Keep voice/language fetching and the shared props as they are.

## Expected result

- The page builds again without the `VoiceUploadModal` reference errors.
- The “Upload stemme” button remains removed from the app.
- No upload modal is rendered anywhere from the index page.

## Technical details

Current issue in `src/pages/Index.tsx`:
```text
<VoiceUploadModal
  open={uploadOpen}
  onOpenChange={setUploadOpen}
  languages={languages}
  onSuccess={refreshVoices}
/>
```

Those identifiers no longer exist, but this JSX block was left behind.

After cleanup, the component should end right after `</main>` and return:
```text
    </div>
  );
};
```

## Note on the console warning
There is also a separate existing warning in `BulkGenerator` about refs and `Select`. That is unrelated to this build failure and should be handled as a follow-up task after the `Index.tsx` cleanup restores the app.
