

## Problem

The `99-runtime-env.sh` script fails with "Permission denied" despite `chmod +x` being applied in the Dockerfile. The most likely cause is **Windows-style CRLF line endings** in the shell script. When a `.sh` file has `\r\n` endings, the shebang becomes `#!/bin/sh\r`, which the shell cannot interpret -- producing the misleading "can't open" error.

## Plan

**1. Strip CRLF in Dockerfile before chmod**

Add a `dos2unix` or `sed` command to strip carriage returns from the entrypoint script before making it executable:

```dockerfile
# After COPY docker-entrypoint.sh /docker-entrypoint.d/99-runtime-env.sh
RUN sed -i 's/\r$//' /docker-entrypoint.d/99-runtime-env.sh
RUN chmod +x /docker-entrypoint.d/*.sh
```

**2. Prevent future CRLF issues via `.gitattributes`**

Add a rule to force LF endings for all shell scripts:

```
*.sh text eol=lf
```

### Files to change
- `Dockerfile` -- add `sed` line to strip `\r` before chmod
- `.gitattributes` -- add `*.sh text eol=lf`

