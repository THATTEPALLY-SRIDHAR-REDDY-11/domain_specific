import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import logger from '../utils/logger.js';
import groqService from '../services/groq.service.js';
import hybridSearchService from '../services/hybrid.service.js';
import rerankService from '../services/rerank.service.js';
import ingestService from '../services/ingest.service.js';
import chromaService from '../services/chroma.service.js';
import correctiveRAGService from '../services/corrective.service.js';
import evaluationService from '../services/evaluation.service.js';


const router = express.Router();

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.resolve('documents'));
  },
  filename: function (req, file, cb) {
    // Keep original filename but sanitise it slightly
    const sanitized = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    cb(null, sanitized);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: function (req, file, cb) {
    const allowedExts = ['.txt', '.md', '.json', '.pdf'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedExts.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type. Supported extensions: ${allowedExts.join(', ')}`));
    }
  }
});

/**
 * POST /api/chat/stream
 * Handles Corrective RAG (CRAG) query processing and streams the LLM response via Server-Sent Events (SSE).
 */
router.post('/chat/stream', async (req, res) => {
  const { message, history = [], filters = {}, settings = {} } = req.body;

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Message must be a non-empty string' });
  }

  logger.info(`Received streaming CRAG request. Message: "${message.substring(0, 50)}..."`);

  // Set headers for Server-Sent Events (SSE)
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders(); // Establish connection immediately

  // First, check for simple greetings and respond directly
  const simpleGreetings = ['hi', 'hello', 'hey', 'how are you', 'what\'s up', 'good morning', 'good afternoon', 'good evening'];
  const lowerMessage = message.toLowerCase().trim();
  
  if (simpleGreetings.some(greeting => lowerMessage.includes(greeting)) && (!history || history.length === 0)) {
    const greetingResponse = "Hello! I'm your Corrective RAG assistant. Feel free to ask me anything about your documents!";
    
    for (const char of greetingResponse) {
      res.write(`data: ${JSON.stringify({ type: 'token', token: char })}\n\n`);
      // Small delay to simulate streaming
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    
    res.write(`data: ${JSON.stringify({ type: 'done', completeText: greetingResponse })}\n\n`);
    res.end();
    return;
  }

  try {
    let currentQuery = message;
    
    // Step 1: Query understanding / pronoun resolution
    try {
      currentQuery = await correctiveRAGService.rewriteQuery(message, history);
      res.write(`data: ${JSON.stringify({ type: 'query_rewritten', query: currentQuery, loop: 0 })}\n\n`);
    } catch (rewriteErr) {
      logger.error(`Failed to rewrite query: ${rewriteErr.message}`);
    }

    // Step 2: Retrieve context chunks
    const retrieveLimit = settings.retrieveLimit ? Number(settings.retrieveLimit) : 20;
    const contextLimit = settings.contextLimit ? Number(settings.contextLimit) : 4;

    let retrievedChunks = await hybridSearchService.search(currentQuery, retrieveLimit, filters);
    
    // Step 3: Rerank top results
    let finalContextChunks = await rerankService.rerank(currentQuery, retrievedChunks, contextLimit);
    res.write(`data: ${JSON.stringify({ type: 'retrieval', chunks: finalContextChunks, loop: 0 })}\n\n`);

    if (finalContextChunks.length === 0) {
      logger.warn('No context documents retrieved.');
    }

    // Corrective RAG Verification & Correction Loop (max 2 loops)
    let loopCount = 0;
    const maxLoops = 2;
    let verificationPass = false;
    let draftAnswer = '';
    let verificationResult = null;

    while (loopCount < maxLoops) {
      // 1. Generate draft answer (non-streaming)
      draftAnswer = await groqService.generateDraftAnswer(currentQuery, finalContextChunks, history, {
        model: settings.model,
        temperature: settings.temperature
      });
      res.write(`data: ${JSON.stringify({ type: 'draft_answer', draftAnswer, loop: loopCount })}\n\n`);

      // 2. Critic Layer: Verification
      verificationResult = await correctiveRAGService.verifyAnswer(currentQuery, draftAnswer, finalContextChunks);
      res.write(`data: ${JSON.stringify({ type: 'verification', verification: verificationResult, loop: loopCount })}\n\n`);

      if (verificationResult.pass) {
        verificationPass = true;
        break;
      }

      loopCount++;
      if (loopCount < maxLoops) {
        logger.info(`Verification failed. Starting correction loop ${loopCount + 1}/${maxLoops}`);
        
        // 3. Query refinement based on verifier feedback
        const refinedQuery = await correctiveRAGService.refineQuery(currentQuery, verificationResult, history);
        currentQuery = refinedQuery;
        res.write(`data: ${JSON.stringify({ type: 'query_rewritten', query: currentQuery, loop: loopCount })}\n\n`);

        // 4. Retrieve and rank again with refined query
        const loopRetrievedChunks = await hybridSearchService.search(currentQuery, retrieveLimit, filters);
        
        // Deduplicate and merge retrieved chunks
        const uniqueChunks = [];
        const seenIds = new Set();
        
        // Add new loop-retrieved chunks first
        for (const chunk of loopRetrievedChunks) {
          if (!seenIds.has(chunk.id)) {
            uniqueChunks.push(chunk);
            seenIds.add(chunk.id);
          }
        }
        // Merge with existing context chunks
        for (const chunk of finalContextChunks) {
          if (!seenIds.has(chunk.id)) {
            uniqueChunks.push(chunk);
            seenIds.add(chunk.id);
          }
        }

        // Rerank unified candidate set
        finalContextChunks = await rerankService.rerank(currentQuery, uniqueChunks, contextLimit);
        res.write(`data: ${JSON.stringify({ type: 'retrieval', chunks: finalContextChunks, loop: loopCount })}\n\n`);
      }
    }

    // Step 4: Stream final answer to user
    let finalAnswer = '';
    
    await groqService.generateRAGStream(
      currentQuery,
      finalContextChunks,
      history,
      {
        model: settings.model,
        temperature: settings.temperature
      },
      (token) => {
        finalAnswer += token;
        res.write(`data: ${JSON.stringify({ type: 'token', token })}\n\n`);
      },
      (completeText) => {
        finalAnswer = completeText;
      },
      (err) => {
        logger.error(`Error in generation: ${err.message}`);
        throw err;
      }
    );

    // Final done event
    res.write(`data: ${JSON.stringify({ type: 'done', completeText: finalAnswer })}\n\n`);
    res.end();

 } catch (error) {
      logger.error(`Failed during CRAG pipeline execution: ${error.message}`, error);
      let userErrorMessage = error.message;
      // Check for rate limit errors and give a nicer message
      if (error.message.includes("429") || error.message.includes("rate limit")) {
        userErrorMessage = "Sorry, we're hitting API rate limits! Please wait a minute and try again, or ask a shorter question.";
      }
      res.write(`data: ${JSON.stringify({ type: "error", error: userErrorMessage })}\n\n`);
      res.end();
    }
});

/**
 * GET /api/documents
 * List all currently indexed documents in ChromaDB with metadata details.
 */
router.get('/documents', async (req, res) => {
  try {
    const docs = await ingestService.getIndexedDocuments();
    res.json({ success: true, documents: docs });
  } catch (error) {
    logger.error(`Failed to list indexed documents: ${error.message}`);
    res.status(500).json({ error: 'Failed to list indexed documents' });
  }
});

/**
 * POST /api/documents/upload
 * Dynamically upload and index a file.
 */
router.post('/documents/upload', (req, res) => {
  upload.single('file')(req, res, async function (err) {
    if (err instanceof multer.MulterError) {
      logger.error(`Multer upload error: ${err.message}`);
      return res.status(400).json({ error: `Upload error: ${err.message}` });
    } else if (err) {
      logger.error(`File filter error: ${err.message}`);
      return res.status(400).json({ error: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileName = req.file.filename;
    logger.info(`Dynamic file upload completed: ${fileName}`);

    try {
      // Direct call to ingest to ensure fast response, chokidar watcher is ignored for this specific trigger
      await ingestService.ingestFile(req.file.path, fileName);
      res.json({
        success: true,
        message: `File '${fileName}' uploaded and indexed successfully.`,
        document: {
          fileName: fileName,
          fileType: path.extname(fileName),
          status: 'indexed'
        }
      });
    } catch (ingestError) {
      logger.error(`Ingest error for uploaded file: ${ingestError.message}`);
      res.status(500).json({ error: `Upload succeeded but indexing failed: ${ingestError.message}` });
    }
  });
});

/**
 * DELETE /api/documents/:fileName
 * Deletes a file from the documents folder and clears its index in ChromaDB.
 */
router.delete('/documents/:fileName', async (req, res) => {
  const fileName = req.params.fileName;
  if (!fileName) {
    return res.status(400).json({ error: 'Filename is required' });
  }

  logger.info(`Requested deletion for document: ${fileName}`);

  try {
    const filePath = path.join(path.resolve('documents'), fileName);
    
    // 1. Delete physical file (chokidar watcher will trigger ingestion removal,
    // but we also explicitly call removeFile to be fast and safe)
    await fs.unlink(filePath).catch(err => {
      logger.warn(`Could not delete file from disk (might already be deleted): ${err.message}`);
    });

    // 2. Delete index entries from ChromaDB
    await ingestService.removeFile(fileName);

    res.json({ success: true, message: `Successfully deleted document '${fileName}' and cleared its search index.` });
  } catch (error) {
    logger.error(`Failed to delete document: ${error.message}`);
    res.status(500).json({ error: `Failed to delete document: ${error.message}` });
  }
});

/**
 * POST /api/documents/reset
 * Clear ChromaDB collection and re-ingest all documents on disk.
 */
router.post('/documents/reset', async (req, res) => {
  try {
    logger.warn('Received collection reset request.');
    await chromaService.resetCollection();
    // Re-ingest current files in document folder
    await ingestService.ingestAll();
    res.json({ success: true, message: 'Vector database collection reset and re-indexed successfully.' });
  } catch (error) {
    logger.error(`Failed to reset database: ${error.message}`);
    res.status(500).json({ error: `Failed to reset database: ${error.message}` });
  }
});

/**
 * GET /api/evaluate
 * Run RAG evaluation with precision, recall, F1 metrics
 */
router.get('/evaluate', async (req, res) => {
  try {
    logger.info('Running RAG evaluation...');
    const evaluationResults = await evaluationService.runFullEvaluation();
    res.json({ success: true, ...evaluationResults });
  } catch (error) {
    logger.error(`Failed to run evaluation: ${error.message}`);
    res.status(500).json({ error: `Failed to run evaluation: ${error.message}` });
  }
});

export default router;

