# Multi-stage build for Canton Privacy Backend
# Stage 1: Builder
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci

# Copy source code
# Note: COPY follows symlinks by default, converting them to regular files/dirs
COPY src ./src

# Build TypeScript
RUN npm run build

# Stage 2: Production
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy built application from builder
COPY --from=builder /app/dist ./dist

# Copy daml-types to dist/ so compiled code can find it via ../daml-types
# Note: On Linux, nested node_modules are included (Windows excludes via .dockerignore)
COPY --from=builder /app/src/daml-types ./dist/daml-types

# Fix symlinks: Remove absolute symlinks and replace with relative ones
RUN find /app/dist/daml-types -type l -exec sh -c 'for link; do target=$(readlink "$link"); if [ "${target#/}" != "$target" ]; then echo "Absolute symlink found: $link -> $target"; rm "$link"; base=$(basename "$target"); ln -s "../../../$base" "$link"; echo "Fixed to: $link -> ../../../$base"; fi; done' sh {} +

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application
CMD ["npm", "start"]

