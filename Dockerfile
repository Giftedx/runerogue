# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

COPY tsconfig*.json ./


# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./


# Install production dependencies only
RUN npm ci --only=production

# Copy built files from builder
COPY --from=builder /app/dist ./dist

# Copy other necessary files
COPY .env.example ./.env

# Expose ports
EXPOSE 3000
EXPOSE 2567

# Start the application
CMD ["node", "dist/server/index.js"]
