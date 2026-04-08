#!/bin/sh
# Replace environment variable placeholders in index.html at container startup
# nginx's built-in envsubst only handles .conf templates, so we do HTML manually

envsubst '${VITE_CLIENT_ID} ${VITE_TENANT_ID}' \
  < /usr/share/nginx/html/index.html \
  > /usr/share/nginx/html/index.html.tmp \
  && mv /usr/share/nginx/html/index.html.tmp /usr/share/nginx/html/index.html

echo "[entrypoint] VITE_CLIENT_ID=${VITE_CLIENT_ID:+SET} VITE_TENANT_ID=${VITE_TENANT_ID:+SET}"

exec "$@"
