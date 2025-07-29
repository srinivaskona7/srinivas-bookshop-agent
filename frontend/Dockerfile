FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
# Use npm install instead of npm ci for compatibility with package
# resolution in environments without an exact lock file match.
RUN npm install

# Copy source code
COPY . .

# Expose port
EXPOSE 3000

# Health check
# Use the dedicated /health endpoint to verify that the frontend is up.
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) }).on('error', () => process.exit(1))"

# Start the application
CMD ["npm", "start"]