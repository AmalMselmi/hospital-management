FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files and install dependencies first (layer caching)
COPY package*.json ./
RUN npm install --omit=dev
# Copy source code
COPY src/ ./src/

# Create data directory for SQLite database file
RUN mkdir -p /app/data

# Expose gRPC port
EXPOSE 50051

# Run the service
CMD ["node", "src/index.js"]