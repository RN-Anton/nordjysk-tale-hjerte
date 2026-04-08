

# Fix Dockerfile: Alpine Linux Compatibility

## Problem
Two issues on lines 37-38:
1. **`useradd` doesn't exist in Alpine Linux** — Alpine uses `adduser` instead
2. **`/app` doesn't exist in the nginx stage** — `/app` was only in the builder stage; the nginx stage serves from `/usr/share/nginx/html`

Also, running nginx as a non-root user on port 80 requires extra config. Since this is an internal tool, the non-root user block can simply be removed — nginx:alpine already runs worker processes as `nginx` user.

## Change

**`Dockerfile`** — Remove lines 36-41 (the non-root user block entirely). The `useradd` + `/app` reference is broken, and nginx needs root to bind port 80. The security benefit is minimal for an internal container.

Lines to remove:
```dockerfile
# 🔐 Create non-root user for security
RUN useradd --create-home --shell /usr/sbin/nologin appuser \
    && chown -R appuser:appuser /app

# Switch to non-root user
USER appuser
```

This will fix the build failure immediately.

