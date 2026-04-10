
## Problem

The latest logs show the container can discover and attempt to launch `99-runtime-env.sh`, but `/bin/sh` still cannot open it. Based on the current files, the earlier CRLF fix is not enough and is probably not the real issue.

Two problems are visible in the current setup:

1. `99-runtime-env.sh` is executed by the nginx entrypoint after the image switches to `USER nginx`
2. That script rewrites `/usr/share/nginx/html/index.html`, but the image only changes ownership of the file itself, not the whole served directory/script path, and the copied script may still not be readable/executable enough for the `nginx` user

## Likely root cause

The runtime script approach is fragile in this image because a non-root user is asked to:
- read/execute a copied custom script in `/docker-entrypoint.d`
- write a temp file into `/usr/share/nginx/html`

That is why the fix should focus on permissions/ownership and, ideally, simplify runtime injection to use nginx’s native template flow instead of a custom startup script.

## Plan

**1. Replace the custom startup script with nginx template-based envsubst**

Use nginx’s built-in `/docker-entrypoint.d/20-envsubst-on-templates.sh` instead of launching a custom `99-runtime-env.sh`.

Implementation:
- remove `COPY docker-entrypoint.sh /docker-entrypoint.d/99-runtime-env.sh`
- add an HTML template file such as `index.html.template` or `public/index.html.template`
- let nginx render it into `/usr/share/nginx/html/index.html` automatically at startup

This is the safest fix because the base nginx image already runs that step correctly.

**2. Keep runtime Azure values in the HTML template**

Preserve the current pattern:
```html
window.VITE_CLIENT_ID = "${VITE_CLIENT_ID}";
window.VITE_TENANT_ID = "${VITE_TENANT_ID}";
```

That keeps `src/authConfig.ts` working unchanged, since it already reads from `window.VITE_CLIENT_ID` and `window.VITE_TENANT_ID`.

**3. If needed, align Dockerfile copy paths with nginx template conventions**

Update the Dockerfile so:
- built app assets still go to `/usr/share/nginx/html`
- the runtime HTML template goes to nginx’s template directory
- no custom shell script in `/docker-entrypoint.d` is needed

Example shape:
```text
builder dist  -> /usr/share/nginx/html
index template -> /etc/nginx/templates/index.html.template
```

**4. Remove the no-longer-needed script hardening**

Once the custom script is removed, also remove the related Dockerfile lines:
- CRLF stripping for `99-runtime-env.sh`
- `chmod +x /docker-entrypoint.d/*.sh` done specifically for that custom file
- any extra handling for `/docker-entrypoint.sh`

This reduces moving parts and avoids future startup regressions.

**5. Verify favicon/static asset behavior**

The browser logs also showed 502s for `/` and `/favicon.ico`. After the entrypoint fix, verify that:
- generated `index.html` is present
- `/favicon.jpg` or `/favicon.ico` resolves consistently with the files in `public/`
- the app loads on `/login` without nginx startup failure

### Technical details

Current evidence from the code:
- `Dockerfile` already includes:
  - `RUN sed -i 's/\r$//' /docker-entrypoint.d/99-runtime-env.sh`
  - `RUN chmod +x /docker-entrypoint.d/*.sh`
- `docker-entrypoint.sh` rewrites `index.html` using:
  - `envsubst '${VITE_CLIENT_ID} ${VITE_TENANT_ID}'`
- `index.html` already contains runtime placeholders for those variables
- `src/authConfig.ts` depends on those globals and does not need a logic change

Why this approach is better:
- uses standard nginx behavior already present in the base image
- avoids custom shell execution under `USER nginx`
- avoids file permission edge cases in `/docker-entrypoint.d`
- preserves runtime environment injection without rebuilding the frontend

### Files likely to change

- `Dockerfile`
- `index.html` or a new HTML template file
- remove dependency on `docker-entrypoint.sh` for runtime env injection

### Fallback option if you want minimal change instead

If you prefer not to switch to templates, the alternative is:
- explicitly set readable/executable permissions on `/docker-entrypoint.d/99-runtime-env.sh`
- ensure `nginx` owns or can write to `/usr/share/nginx/html`
- likely `chown -R nginx:nginx /usr/share/nginx/html /docker-entrypoint.d`

But I recommend the template approach because it is simpler and more robust.
