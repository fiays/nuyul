# use the official Bun image
FROM oven/bun:1

WORKDIR /app

# Copy root package files
COPY package.json bun.lock ./

# Copy client package files
COPY client/package.json client/bun.lock ./client/

# Install dependencies
RUN bun install
RUN cd client && bun install

# Copy the rest of the application
COPY . .

# Build the frontend
RUN cd client && bun run build

# Expose the server port
EXPOSE 3000

# Start the server
CMD ["bun", "run", "src/index.ts"]
