# 1. Choose a Node.js LTS version
FROM node:18-alpine AS builder

# 2. Set working directory
WORKDIR /usr/src/app

# 3. Copy package.json and package-lock.json (or npm-shrinkwrap.json)
COPY package*.json ./

# 4. Install TypeScript and build the project
RUN npm install --global typescript             && npm install             && npm run build

# 5. Start a new stage for the production environment
FROM node:18-alpine AS production

ENV NODE_ENV=production

WORKDIR /usr/src/app

# 6. Copy built artifacts and production dependencies from the builder stage
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY package*.json ./
# If you have other assets to copy, do it here e.g.
# COPY --from=builder /usr/src/app/static ./static

# 7. Expose the port the app runs on
# The PORT environment variable will be used by Cloud Run, default to 8080.
# Colyseus default is 2567. The server code (index.ts) uses process.env.PORT || 2567.
EXPOSE ${PORT:-8080}

# 8. Command to run the application
# This will use the "start" script from package.json: "node dist/index.js"
CMD [ "npm", "start" ]
