import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import logger from './src/utils/logger.js';
import chromaService from './src/services/chroma.service.js';
import ingestService from './src/services/ingest.service.js';
import apiRouter from './src/routes/chat.routes.js';
import langsmithService from './src/services/langsmith.service.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS
app.use(cors({
  origin: '*', // Allow all origins for local development ease
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// LangSmith tracing middleware
app.use(langsmithService.createTraceMiddleware());

// Parse JSON body
app.use(express.json());

// Serving static files from backend/documents if needed
app.use('/documents', express.static(path.resolve('documents')));

// API Routes
app.use('/api', apiRouter);

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const isChromaAlive = await chromaService.client?.heartbeat().then(() => true).catch(() => false);
    res.json({
      status: 'healthy',
      chroma: isChromaAlive ? 'connected' : 'disconnected',
      time: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ status: 'unhealthy', error: error.message });
  }
});

// Root fallback
app.get('/', (req, res) => {
  res.send('RAG Chatbot Backend API is running.');
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(`Express error: ${err.message}`, err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  });
});

// Start server function
async function startServer() {
  try {
    logger.info('Starting Advanced RAG Chatbot Backend Server...');

    // 1. Bind port first so the API can start even if Chroma is slow/rate-limited.
    const server = app.listen(PORT, () => {
      logger.info(`Server successfully running on port http://localhost:${PORT}`);
    });

    // 2. Initialize ChromaDB and ingestion after startup.
    const initializeServices = async () => {
      try {
        await chromaService.initialize();
      } catch (dbError) {
        logger.error(`Database initialization failed after startup: ${dbError.message}. Ensure ChromaDB is reachable.`);
      }

      try {
        await ingestService.initialize();
      } catch (error) {
        logger.error(`Ingestion service failed after startup: ${error.message}`, error);
      }
    };

    initializeServices();

    // Graceful Shutdown
    const shutdown = async () => {
      logger.info('Gracefully shutting down backend server...');
      if (ingestService.watcher) {
        logger.info('Closing file watcher...');
        await ingestService.watcher.close();
      }
      server.close(() => {
        logger.info('Express server closed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

  } catch (error) {
    logger.error(`Critical failure on server start: ${error.message}`, error);
    process.exit(1);
  }
}

startServer();
