# Multi-stage build for Canton Privacy Frontend
# Stage 1: Builder
FROM node:20-alpine AS builder

# Build argument for API URL (can be overridden at build time)
ARG VITE_API_URL=http://backend:3001

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code and config
COPY . .

# Create .env file with the API URL for Vite build
RUN echo "VITE_API_URL=${VITE_API_URL}" > .env

# Build for production (Vite will use the .env file)
RUN npm run build

# Stage 2: Production with Nginx
FROM nginx:alpine

# Copy built app from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD wget --quiet --tries=1 --spider http://localhost/health || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]

