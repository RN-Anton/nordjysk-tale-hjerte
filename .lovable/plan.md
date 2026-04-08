

# Fix: Align Build Args with Actual GitLab Variables

## Problem
The Dockerfile and `.gitlab-ci.yml` reference `TTS_BACKEND_CLIENT_ID` and `TTS_BACKEND_TENANT_ID`, but the actual GitLab CI/CD variables you added are named `VITE_CLIENT_ID` and `VITE_TENANT_ID`. The build args are empty because the names don't match.

## Changes

### 1. `.gitlab-ci.yml` — Update `DOCKER_BUILD_ARGS`
Replace `TTS_BACKEND_CLIENT_ID` → `VITE_CLIENT_ID` and `TTS_BACKEND_TENANT_ID` → `VITE_TENANT_ID` in the build args string.

### 2. `Dockerfile` — Update ARG/ENV mapping
- Change `ARG TTS_BACKEND_CLIENT_ID` → `ARG VITE_CLIENT_ID`
- Change `ARG TTS_BACKEND_TENANT_ID` → `ARG VITE_TENANT_ID`
- Change `ENV VITE_AZURE_CLIENT_ID=$TTS_BACKEND_CLIENT_ID` → `ENV VITE_AZURE_CLIENT_ID=$VITE_CLIENT_ID`
- Change `ENV VITE_AZURE_TENANT_ID=$TTS_BACKEND_TENANT_ID` → `ENV VITE_AZURE_TENANT_ID=$VITE_TENANT_ID`

No other files change. The frontend code already reads `VITE_AZURE_CLIENT_ID` / `VITE_AZURE_TENANT_ID` correctly.

