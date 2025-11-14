# Multi-stage Dockerfile for ARM-based Ubuntu servers
# Supports both arm64 and amd64 architectures

FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install dependencies for native modules
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    sqlite

# Copy backend package files
COPY backend/package*.json ./backend/

# Install backend dependencies
WORKDIR /app/backend
RUN npm ci --only=production

# Copy backend source code
COPY backend/src ./src

# Create database directory
RUN mkdir -p /app/backend/database

# Expose port
EXPOSE 3001

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3001
ENV DB_PATH=/app/backend/database/donations.db

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the server
CMD ["node", "src/server.js"]
