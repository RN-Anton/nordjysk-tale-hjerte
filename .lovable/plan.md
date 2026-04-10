

## Problem

The Docker build uses `node:18-alpine`, but `vite@^6.4.2` requires Node >= 20. Additionally, esbuild 0.25.0 (required by Vite 6) conflicts with esbuild 0.21.5 that gets hoisted from other dependencies, causing the install script to fail with version mismatch.

## Plan

**1. Upgrade Dockerfile to Node 20**

Change line 1 from `node:18-alpine` to `node:20-alpine`. Vite 6 and its dependency `esbuild@0.25.0` require Node >= 20. This also resolves the `eslint-visitor-keys` engine warning.

**2. Regenerate `package-lock.json`**

Delete and regenerate the lockfile using Node 20 + npm to ensure all integrity hashes and resolved versions are consistent, particularly for esbuild 0.25.0.

### Files to change
- `Dockerfile` -- line 1: `node:18-alpine` → `node:20-alpine`
- `package-lock.json` -- regenerate fresh

