FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
# Use npm install instead of npm ci to ensure compatibility with
# environments where package-lock.json may not exactly match the
# dependency tree. npm ci strictly requires a lock file and can
# prune dependencies needed during runtime. Here we install all
# dependencies for production.
RUN npm install

# Copy source code
COPY . .

# Create upload directories
RUN mkdir -p uploads/profile uploads/books logs

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) }).on('error', () => process.exit(1))"

# Start the application
CMD ["npm", "start"]