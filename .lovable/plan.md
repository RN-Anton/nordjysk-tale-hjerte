
Goal: stop the startup crash first, then clean up the package/install failures that are blocking builds.

1. Fix the Docker startup path explicitly
- The current repo no longer calls `/docker-entrypoint.sh` directly.
- The error strongly suggests the image is still trying to execute that path as an entrypoint in the built container.
- Update the Dockerfile so the custom script is only used as an nginx startup snippet, while the base nginx image keeps its own entrypoint.
- Add an explicit permission fix for both possible paths:
  - `RUN chmod +x /docker-entrypoint.d/*.sh`
  - `RUN test ! -f /docker-entrypoint.sh || chmod +x /docker-entrypoint.sh`
- Keep `USER nginx` after all chmod/chown lines.

2. Verify the Dockerfile follows the safe order
- Final stage should look like this logically:
```text
COPY nginx.conf ...
COPY docker-entrypoint.sh /docker-entrypoint.d/99-runtime-env.sh
RUN ... chown/chmod for nginx/html/log/cache ...
RUN chmod +x /docker-entrypoint.d/*.sh
RUN test ! -f /docker-entrypoint.sh || chmod +x /docker-entrypoint.sh
USER nginx
CMD ["nginx", "-g", "daemon off;"]
```
- Do not add a custom `ENTRYPOINT`.
- Do not point anything to `/docker-entrypoint.sh`.

3. Re-check runtime env injection files
- Keep `index.html` using `${VITE_CLIENT_ID}` and `${VITE_TENANT_ID}` placeholders.
- Keep `src/authConfig.ts` reading from `window.*` first, then `import.meta.env`.
- No variable renaming is needed because the confirmed names are `VITE_CLIENT_ID` and `VITE_TENANT_ID`.

4. Fix the package-manager inconsistency causing install corruption
- The repo currently contains both `package-lock.json` and `bun.lock`/`bun.lockb`.
- The reported install errors (`IntegrityCheckFailed`, missing `react-router-dom`, missing `rollup`) are consistent with Bun trying to install from a corrupted or mismatched lockfile.
- Standardize on one package manager for CI/builds. The least risky path here is npm, because:
  - Dockerfile already uses `npm install`
  - `package-lock.json` exists
- In implementation, remove Bun lockfiles from the repo and ensure CI/install uses npm consistently.

5. Harden CI so Vite envs and dependencies are deterministic
- Keep the `.gitlab-ci.yml` step that writes `VITE_*` vars into `.env`.
- Make sure the CI job installs with npm, not Bun.
- If the shared GitLab template forces Bun, override the install/build commands in this project to use npm so the lockfile and installer match.

6. Validate after implementation
- Expected container behavior:
  - no `/bin/sh: can't open '/docker-entrypoint.sh': Permission denied`
  - nginx starts successfully
  - startup log prints env injection status from `99-runtime-env.sh`
- Expected build behavior:
  - no tarball integrity failures
  - `react-router-dom` resolves
  - `vite` no longer fails on missing `rollup`

Technical details
```text
Root causes likely split into two separate issues:

A. Runtime/container issue
- Built image or inherited startup is still touching /docker-entrypoint.sh
- safest repair: keep nginx default entrypoint, use /docker-entrypoint.d/*.sh only, and explicitly chmod both paths defensively

B. Dependency/install issue
- mixed lockfiles (npm + bun) plus Bun-based install path
- this causes integrity failures and incomplete node_modules, which then surfaces as:
  - TS2307 cannot find module react-router-dom
  - ERR_MODULE_NOT_FOUND: rollup
```

Implementation files to touch
- `Dockerfile`
- `.gitlab-ci.yml` if install command needs overriding
- remove `bun.lock`
- remove `bun.lockb`

Acceptance criteria
- Container starts cleanly with no permission error.
- Login page loads.
- CI install completes without integrity errors.
- TypeScript build resolves `react-router-dom`.
- Vite starts/builds without `rollup` missing.
