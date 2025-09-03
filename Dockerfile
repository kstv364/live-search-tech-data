# Dockerfile for Next.js + SQLite - Production Ready
FROM node:22-alpine AS base

# Install system dependencies for better-sqlite3
RUN apk add --no-cache python3 make g++ libc6-compat

WORKDIR /app

# Dependencies stage
FROM base AS deps
# Copy package files
COPY package*.json ./
# Install production dependencies only
RUN npm ci --only=production && npm cache clean --force

# Build stage  
FROM base AS builder
COPY package*.json ./
# Install all dependencies for build
RUN npm ci
COPY . .
# Build the application
RUN npm run build

# Runtime stage
FROM base AS runner
WORKDIR /app

# Install curl for health checks
RUN apk add --no-cache curl

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Copy necessary files for database operations
COPY --from=builder --chown=nextjs:nodejs /app/src ./src
COPY --from=builder --chown=nextjs:nodejs /app/data_model ./data_model
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./
COPY --chown=nextjs:nodejs wait-for-setup.sh ./wait-for-setup.sh

# Make scripts executable
RUN chmod +x ./wait-for-setup.sh

# Create database directory with proper permissions
RUN mkdir -p database && chown -R nextjs:nodejs database

USER nextjs

# Expose port
EXPOSE 3000

# Environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Start command - Next.js standalone creates server.js
CMD ["node", "server.js"]
