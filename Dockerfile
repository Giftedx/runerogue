# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./
COPY tsconfig*.json ./

# Install all dependencies including devDependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Create non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production --omit=dev

# Copy built application from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules

# Set environment to production
ENV NODE_ENV=production

# Set proper permissions
RUN chown -R appuser:appgroup /app
USER appuser

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT}/health || exit 1

# Copy built files from builder
COPY --from=builder /app/dist ./dist

# Copy other necessary files
COPY .env.example ./.env

# Expose ports
EXPOSE 3000
EXPOSE 2567

# Start the application
CMD ["node", "dist/server/index.js"]
