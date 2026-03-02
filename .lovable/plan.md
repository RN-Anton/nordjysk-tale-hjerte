

# Inject API Key from GitLab CI/CD into the Docker Build

## Current Setup
Your `.gitlab-ci.yml` uses a shared organizational template (`/.gitlab-ci-docker-build-publish.yml`) that handles the Docker build internally. You don't write the `docker build` command yourself -- the template does it.

## What Needs to Happen

### Step 1: Add CI/CD Variables in GitLab (done by you)
In your GitLab project:
1. Go to **Settings > CI/CD > Variables**
2. Add `VITE_API_KEY` with your API key value -- mark it **Protected** and **Masked**
3. Add `VITE_API_BASE_URL` with value `https://talebesked.ai.rn.dk/call` (optional, since the code will have this as default)

### Step 2: Pass variables as Docker build args in `.gitlab-ci.yml`
Most shared CI templates support a `DOCKER_BUILD_ARGS` or `BUILD_ARGS` variable to forward extra arguments. Update your `.gitlab-ci.yml`:

```yaml
include:
  - project: "iam/automation/templates/ci_cd-pipelines"
    file: "/.gitlab-ci-docker-build-publish.yml"

variables:
  CI_PROJECT_NAME: $CI_PROJECT_NAME
  DISABLE_GITLEAKS: "true"
  DOCKER_BUILD_ARGS: "--build-arg VITE_API_BASE_URL=$VITE_API_BASE_URL --build-arg VITE_API_KEY=$VITE_API_KEY"
```

**Important**: The exact variable name (`DOCKER_BUILD_ARGS`, `BUILD_ARGS`, `BUILDARGS`, etc.) depends on what your shared template expects. You may need to check the template file at `iam/automation/templates/ci_cd-pipelines/.gitlab-ci-docker-build-publish.yml` to find the correct variable name. Ask your DevOps team if unsure.

### Step 3: Code changes (2 files)

**`src/config/config.ts`** -- Read from Vite env vars with sensible defaults:
```ts
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://talebesked.ai.rn.dk/call";
export const API_KEY = import.meta.env.VITE_API_KEY || "";
```

**`src/lib/api.ts`** -- Soften validation so it warns instead of throwing:
- Remove the hard throw when `API_BASE_URL` is empty (it now has a default)
- Change `API_KEY` check to a `console.warn` instead of throwing an error

### No changes to Dockerfile
Your `Dockerfile` already declares `ARG VITE_API_KEY` and sets it as an env var during build. This is correct and stays as-is.

## How the flow works

```text
GitLab CI/CD Variable (VITE_API_KEY=secret123)
        |
  .gitlab-ci.yml passes it as --build-arg
        |
  Dockerfile: ARG VITE_API_KEY --> ENV VITE_API_KEY
        |
  Vite embeds it into the JS bundle at build time
        |
  config.ts reads import.meta.env.VITE_API_KEY
        |
  api.ts sends it as X-API-Key header
```

The API key never appears in your source code or Git history.

