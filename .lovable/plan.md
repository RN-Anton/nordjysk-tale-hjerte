

# Remove "Upload stemme" Button

Remove the voice upload button and modal from the entire application.

## Changes

### 1. `src/components/SingleGenerator.tsx`
- Remove `onUploadClick` from props interface and destructuring
- Remove the "Upload stemme" `<Button>` (lines 220-223)
- Remove `Upload` icon import if no longer used

### 2. `src/components/BulkGenerator.tsx`
- Remove `onUploadClick` from props interface and destructuring
- Remove the "Upload stemme" button in bulk actions (lines 479-482)
- Remove the "Upload stemme" button in empty state (lines 661-664)
- Remove `Upload` icon import if no longer used

### 3. `src/pages/Index.tsx`
- Remove `uploadOpen` state and `setUploadOpen`
- Remove `onUploadClick` from `sharedProps`
- Remove `<VoiceUploadModal>` component and its import
- Remove `VoiceUploadModal` import

### 4. Delete `src/components/VoiceUploadModal.tsx`
- No longer needed

