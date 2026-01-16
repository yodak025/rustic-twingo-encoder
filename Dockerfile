# Multi-stage build for optimized production image
# Stage 1: Builder
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (production only)
RUN npm ci --only=production

# Copy source code
COPY . .

# Build Next.js application
RUN npm run build

# Stage 2: Runtime
FROM node:20-alpine

WORKDIR /app

# Install ffmpeg and bash (required for audio processing)
RUN apk add --no-cache ffmpeg bash

# Create app user for security
RUN addgroup -g 1000 appuser && \
    adduser -u 1000 -G appuser -s /bin/sh -D appuser

# Copy built application from builder
COPY --from=builder --chown=appuser:appuser /app/package*.json ./
COPY --from=builder --chown=appuser:appuser /app/node_modules ./node_modules
COPY --from=builder --chown=appuser:appuser /app/.next ./.next
COPY --from=builder --chown=appuser:appuser /app/public ./public
COPY --from=builder --chown=appuser:appuser /app/bash ./bash
COPY --from=builder --chown=appuser:appuser /app/config ./config
COPY --from=builder --chown=appuser:appuser /app/next.config.mjs ./

# Make bash scripts executable
RUN chmod +x /app/bash/*.sh

# Create mount points for volumes
RUN mkdir -p /music /outputs && \
    chown appuser:appuser /music /outputs

# Switch to non-root user
USER appuser

# Expose application port
EXPOSE 3000

# Health check to verify application is running
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/config', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

# Start Next.js production server
CMD ["npm", "start"]
