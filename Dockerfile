# Use the official Bun image
FROM oven/bun:latest as builder

WORKDIR /app

# Copy root dependency files
COPY package.json bun.lock ./

# Install root dependencies
RUN bun install

# Copy client dependency files
COPY client/package.json client/bun.lock ./client/

# Install client dependencies
RUN cd client && bun install

# Copy everything else
COPY . .

# Build the client
RUN cd client && bun run build

# --- Production stage ---
FROM oven/bun:latest

WORKDIR /app

# Copy all files from builder (including dist)
COPY --from=builder /app .

# Expose the port
EXPOSE 3000

# Start the application
CMD ["bun", "run", "src/index.ts"]
