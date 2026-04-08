FROM node:18-alpine AS builder
WORKDIR /app

ARG VITE_API_BASE_URL
ARG VITE_API_KEY
ARG TTS_BACKEND_CLIENT_ID
ARG TTS_BACKEND_TENANT_ID

ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_API_KEY=$VITE_API_KEY
ENV VITE_AZURE_CLIENT_ID=$TTS_BACKEND_CLIENT_ID
ENV VITE_AZURE_TENANT_ID=$TTS_BACKEND_TENANT_ID

# Copy package files and install dependencies
COPY package.json ./
RUN npm install
# Copy the rest of the frontend source
COPY . .
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
# Set permissions for files within the public folder
RUN find /usr/share/nginx/html/ -type f -name "*" -print0 | xargs -0 chmod 644
RUN find /usr/share/nginx/html/ -type d -print0 | xargs -0 chmod 755

# Configure nginx to run as non-root
RUN sed -i '/^user /d' /etc/nginx/nginx.conf \
    && sed -i 's|/run/nginx.pid|/tmp/nginx.pid|' /etc/nginx/nginx.conf \
    && chown -R nginx:nginx /var/cache/nginx /var/log/nginx /etc/nginx/conf.d \
    && chmod -R 755 /var/cache/nginx /var/log/nginx

USER nginx

EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]