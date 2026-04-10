

## Problem

The `package-lock.json` is out of sync with `package.json`. The lockfile contains `vite@6.4.2` and `esbuild@0.25.0`, but `package.json` specifies `vite@^5.4.19` (which resolves to `5.4.x`) and its corresponding `esbuild@0.21.x`. This causes `npm ci` to fail with integrity/version mismatch errors.

## Root cause

When the lockfile was regenerated previously, it resolved to newer major versions that don't match the semver ranges in `package.json`.

## Plan

**1. Regenerate `package-lock.json` correctly**

Delete the current `package-lock.json` and run `npm install` fresh so it resolves versions that match the `^5.4.19` range for vite and all other dependencies. This produces a clean, consistent lockfile.

**2. Remove bun lockfiles**

Delete `bun.lock` and `bun.lockb` to prevent the Lovable sandbox (which uses Bun) from interfering with the npm-based lockfile.

**3. Update Dockerfile to handle lockfile sync issues defensively**

Change the install command from `npm ci || npm install` to just `npm install` as a fallback safety net, since `npm ci` is strict about lockfile sync and will fail if there's any drift.

### Technical details

- `npm ci` requires exact match between `package.json` and `package-lock.json`
- The lockfile had vite 6.x hashes but package.json constrains to 5.x
- Running `npm install` regenerates the lockfile to match current `package.json` ranges
- Files touched: `package-lock.json` (regenerated), `bun.lock` (deleted), `bun.lockb` (deleted), `Dockerfile` (minor install command tweak)

