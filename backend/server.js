import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import morgan from 'morgan';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import logger from './config/logger.js';

import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import bookRoutes from './routes/bookRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Create upload directories if they don't exist
const uploadDirs = ['uploads/profile', 'uploads/books', 'logs'];
uploadDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Morgan logging
const morganFormat = process.env.NODE_ENV === 'production' ? 'combined' : 'dev';
app.use(morgan(morganFormat, {
  stream: {
    write: (message) => logger.info(message.trim())
  }
}));

// Serve static files
app.use('/uploads', express.static('uploads'));

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Srinivas Bookshop API',
      version: '1.0.0',
      description: 'API for Srinivas Bookshop application',
    },
    // Use a relative server URL to avoid path-to-regexp errors when colons
    // appear in absolute URLs (e.g. http://localhost:5000). Swagger UI
    // interprets the URL string as a route pattern, and the colon after
    // "http" is treated as a parameter without a name. A relative path
    // ensures compatibility across environments.
    servers: [
      {
        url: '/',
        description: 'Current server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: ['./routes/*.js'],
};

const specs = swaggerJsdoc(swaggerOptions);
// Serve API documentation. Passing the generated OpenAPI specification as the
// first argument to swaggerUi.setup is sufficient; additional options are not
// required and can trigger path-to-regexp parsing of nested objects.
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/admin', adminRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  logger.error('Unhandled error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
// In Express 5, passing a string like '*' to app.use() leads to it being
// interpreted as a route pattern by path-to-regexp, which can cause a
// "Missing parameter name" error. Register a catch-all handler without
// specifying a path so that it matches any unmatched request.
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Database connection
// Only connect to MongoDB and start the server if not running in a test environment.
if (process.env.NODE_ENV !== 'test') {
  mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/srinivas-bookshop')
    .then(() => {
      logger.info('Connected to MongoDB');
      app.listen(PORT, () => {
        logger.info(`Server running on port ${PORT}`);
        logger.info(`Swagger docs available at http://localhost:${PORT}/api-docs`);
      });
    })
    .catch((error) => {
      logger.error('MongoDB connection error:', error);
      process.exit(1);
    });
}

export default app;