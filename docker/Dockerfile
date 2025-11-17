FROM debian:stable-slim

# Install LibreOffice Impress and Node.js
RUN apt-get update && \
    apt-get install -y \
    libreoffice-impress \
    libreoffice-writer \
    nodejs \
    npm \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --omit=dev

# Copy built dist files
COPY dist ./dist

# Environment variables
ENV PORT=3000

# Expose port
EXPOSE 3000

# Default command (HTTP server)
CMD ["node", "dist/server/httpServer.js"]
