# Stage 1: Builder
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install build dependencies
RUN apk add --no-cache python3 make g++ git

# Install all dependencies
RUN npm install

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Stage 2: Production
FROM node:20-alpine

WORKDIR /app

# Set NODE_ENV to production
ENV NODE_ENV=production

# Install build dependencies for native modules in production
RUN apk add --no-cache python3 make g++ git

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm install --omit=dev --ignore-scripts && \
  npm cache clean --force

# Copy built assets from builder stage
COPY --from=builder /app/dist ./dist

# Create logs directory and set permissions
RUN mkdir -p logs && chown -R node:node logs

# Switch to non-root user
USER node

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Start the server
CMD ["node", "dist/src/server/server.js"]
