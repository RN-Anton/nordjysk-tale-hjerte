FROM node:18-alpine AS builder
WORKDIR /app

ARG VITE_API_BASE_URL
ARG VITE_API_KEY
ARG VITE_CLIENT_ID
ARG VITE_TENANT_ID

ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_API_KEY=$VITE_API_KEY
ENV VITE_CLIENT_ID=$VITE_CLIENT_ID
ENV VITE_TENANT_ID=$VITE_TENANT_ID

# Copy package files and install dependencies (npm only — ignore bun lockfiles)
COPY package.json package-lock.json* ./
RUN npm ci || npm install
# Copy the rest of the frontend source
COPY . .
# Remove bun lockfiles so they don't interfere
RUN rm -f bun.lock bun.lockb
# Build the frontend
RUN npm run build
# Ensure all build files are world-readable (644) and directories are accessible (755)
RUN chmod -R 755 /app/dist && find /app/dist -type f -exec chmod 644 {} \;

# Stage 2: Serve the app with Nginx
FROM nginx:alpine
# Remove default nginx content
RUN rm -rf /usr/share/nginx/html/
# Copy built files from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html
# Copy the entire public folder
COPY public/ /usr/share/nginx/html/
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY docker-entrypoint.sh /docker-entrypoint.d/99-runtime-env.sh
# Set permissions for files within the public folder
RUN find /usr/share/nginx/html/ -type f -name "*" -print0 | xargs -0 chmod 644
RUN find /usr/share/nginx/html/ -type d -print0 | xargs -0 chmod 755
# Configure nginx to run as non-root on port 80
RUN apk add --no-cache libcap \
    && setcap 'cap_net_bind_service=+ep' /usr/sbin/nginx \
    && apk del libcap \
    && sed -i '/^user /d' /etc/nginx/nginx.conf \
    && sed -i 's|/run/nginx.pid|/tmp/nginx.pid|' /etc/nginx/nginx.conf \
    && chown -R nginx:nginx /var/cache/nginx /var/log/nginx /etc/nginx/conf.d \
    && chmod -R 755 /var/cache/nginx /var/log/nginx \
    && chown nginx:nginx /usr/share/nginx/html/index.html

# Ensure all entrypoint scripts are executable (including base nginx entrypoint)
RUN chmod +x /docker-entrypoint.d/*.sh
RUN test ! -f /docker-entrypoint.sh || chmod +x /docker-entrypoint.sh

USER nginx

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
