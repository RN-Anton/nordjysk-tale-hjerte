#!/bin/sh
# Replace environment variable placeholders in index.html during the default nginx entrypoint startup

envsubst '${VITE_CLIENT_ID} ${VITE_TENANT_ID}' \
  < /usr/share/nginx/html/index.html \
  > /usr/share/nginx/html/index.html.tmp \
  && mv /usr/share/nginx/html/index.html.tmp /usr/share/nginx/html/index.html

echo "[entrypoint] VITE_CLIENT_ID=${VITE_CLIENT_ID:+SET} VITE_TENANT_ID=${VITE_TENANT_ID:+SET}"
