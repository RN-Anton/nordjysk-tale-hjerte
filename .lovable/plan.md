

# Fix: Pass Azure AD Variables to Docker Build

## Problem
`VITE_AZURE_CLIENT_ID` and `VITE_AZURE_TENANT_ID` are not declared as `ARG`/`ENV` in the Dockerfile. Vite inlines these at build time (`npm run build`), so they're empty in the built bundle → MSAL sends no `client_id` → Azure rejects with `AADSTS900144`.

## Changes

### 1. Update `Dockerfile`
Add the two missing build args alongside the existing ones:

```dockerfile
ARG VITE_API_BASE_URL
ARG VITE_API_KEY
ARG VITE_AZURE_CLIENT_ID
ARG VITE_AZURE_TENANT_ID
ARG VITE_AZURE_REDIRECT_URI

ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_API_KEY=$VITE_API_KEY
ENV VITE_AZURE_CLIENT_ID=$VITE_AZURE_CLIENT_ID
ENV VITE_AZURE_TENANT_ID=$VITE_AZURE_TENANT_ID
ENV VITE_AZURE_REDIRECT_URI=$VITE_AZURE_REDIRECT_URI
```

### 2. Update CI/CD Pipeline
In your GitLab CI variables (or `DOCKER_BUILD_ARGS`), add:
- `VITE_AZURE_CLIENT_ID` = your Azure app client ID
- `VITE_AZURE_TENANT_ID` = your Azure tenant ID
- `VITE_AZURE_REDIRECT_URI` = the URL users access the app at (e.g. `http://10.15.12.134:4457`)

These should be added the same way you already pass `VITE_API_KEY` and `VITE_API_BASE_URL`.

### 3. For local Docker testing
```bash
docker build \
  --build-arg VITE_AZURE_CLIENT_ID=your-client-id \
  --build-arg VITE_AZURE_TENANT_ID=your-tenant-id \
  --build-arg VITE_AZURE_REDIRECT_URI=http://localhost:4457 \
  --build-arg VITE_API_BASE_URL=... \
  --build-arg VITE_API_KEY=... \
  -t tts_frontend .
```

### Important
The `docker-compose.yml` `environment` section does **not** help here — Vite variables are baked into static JS at build time, not read at container runtime. They **must** be build args.

