FROM node:18-alpine AS builder
WORKDIR /app
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
# Optional: SPA routing fix
# COPY nginx.conf /etc/nginx/conf.d/default.conf
# Expose port 80 for Nginx
EXPOSE 80
# Start Nginx
CMD ["nginx", "-g", "daemon off;"]