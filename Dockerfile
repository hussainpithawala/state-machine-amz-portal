# Use Alpine-based Node.js to minimize OS-level attack surface
FROM node:24-alpine AS base

# Set working directory
WORKDIR /app

# Build the application
FROM base AS builder
COPY package.json package-lock.json* ./
# Install ALL dependencies (including devDependencies) for build
RUN npm ci

COPY . .
RUN npm run build

# Production stage - only production dependencies
FROM base AS runner
WORKDIR /app

# Create non-root user (Alpine syntax)
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 --ingroup nodejs nextjs

# Install production dependencies as root
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

# Copy built application
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Set default environment variables
ENV PORT=3000
ENV NODE_ENV=production

# Expose the port (for documentation purposes)
EXPOSE $PORT

# Change ownership to non-root user
RUN chown -R nextjs:nodejs ./
USER nextjs

# Health check using wget (bundled in Alpine) instead of curl
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:$PORT/api/health || exit 1

# Start the application with dynamic port
CMD ["node", "server.js"]
