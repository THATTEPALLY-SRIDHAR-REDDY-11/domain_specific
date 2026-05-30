import fs from 'fs/promises';
import path from 'path';
import pdfParse from 'pdf-parse';
import chokidar from 'chokidar';
import logger from '../utils/logger.js';
import chunkerService from './chunker.service.js';
import embeddingService from './embedding.service.js';
import chromaService from './chroma.service.js';

class IngestService {
  constructor() {
    this.documentsDir = path.resolve('documents');
    this.isIndexing = false;
    this.watcher = null;
  }

  async ensureDirectoryExists() {
    try {
      await fs.mkdir(this.documentsDir, { recursive: true });
      logger.info(`Ensured documents directory exists at ${this.documentsDir}`);
    } catch (error) {
      logger.error(`Error creating documents directory: ${error.message}`);
    }
  }

  async initialize() {
    await this.ensureDirectoryExists();

    const ingestOnStartup = process.env.INGEST_ON_STARTUP !== 'false';

    if (ingestOnStartup) {
      // Perform initial ingestion on server startup
      try {
        await this.ingestAll();
      } catch (error) {
        logger.error(`Initial document ingestion failed: ${error.message}`);
      }
    } else {
      logger.info('Skipping startup document ingestion because INGEST_ON_STARTUP=false');
    }

    // Start watching the folder for changes (hot-reindexing)
    this.startWatcher();
  }

  async ingestAll() {
    if (this.isIndexing) {
      logger.warn('Ingestion already in progress. Skipping...');
      return;
    }
    
    this.isIndexing = true;
    logger.info('Starting document ingestion scan...');

    try {
      const files = await fs.readdir(this.documentsDir);
      logger.info(`Found ${files.length} items in documents directory`);

      for (const file of files) {
        const filePath = path.join(this.documentsDir, file);
        const stats = await fs.stat(filePath);
        
        if (stats.isFile()) {
          await this.ingestFile(filePath, file);
        }
      }

      logger.info('Document ingestion scan completed successfully.');
    } catch (error) {
      logger.error(`Error in ingestAll: ${error.message}`, error);
      throw error;
    } finally {
      this.isIndexing = false;
    }
  }

  async ingestFile(filePath, fileName) {
    logger.info(`Processing file: ${fileName}...`);
    const ext = path.extname(fileName).toLowerCase();
    let text = '';

    try {
      if (ext === '.txt' || ext === '.md') {
        text = await fs.readFile(filePath, 'utf-8');
      } else if (ext === '.json') {
        const raw = await fs.readFile(filePath, 'utf-8');
        const obj = JSON.parse(raw);
        text = typeof obj === 'string' ? obj : JSON.stringify(obj, null, 2);
      } else if (ext === '.pdf') {
        const dataBuffer = await fs.readFile(filePath);
        const pdfData = await pdfParse(dataBuffer);
        text = pdfData.text;
      } else {
        logger.warn(`Unsupported file type skipped: ${fileName}`);
        return;
      }

      if (!text || text.trim().length === 0) {
        logger.warn(`File is empty: ${fileName}`);
        return;
      }

      // 1. Chunk document
      const chunks = chunkerService.splitDocument(text);
      if (chunks.length === 0) {
        logger.warn(`No chunks generated for file: ${fileName}`);
        return;
      }

      // 2. Clear out old chunks of this file to prevent duplicates (Upsert pattern)
      await chromaService.deleteByMetadata({ source: fileName });

      // 3. Generate embeddings
      const embeddings = await embeddingService.getEmbeddingsBatch(chunks);

      // 4. Prep DB data
      const ids = [];
      const metadatas = [];
      const documentsList = [];

      for (let i = 0; i < chunks.length; i++) {
        ids.push(`${fileName}_chunk_${i}`);
        documentsList.push(chunks[i]);
        metadatas.push({
          source: fileName,
          fileType: ext,
          chunkIndex: i,
          totalChunks: chunks.length,
          length: chunks[i].length,
          timestamp: Date.now()
        });
      }

      // 5. Add to ChromaDB
      await chromaService.addDocuments(ids, embeddings, documentsList, metadatas);
      logger.info(`Successfully ingested/updated file: ${fileName} (${chunks.length} chunks)`);
    } catch (error) {
      logger.error(`Failed to ingest file ${fileName}: ${error.message}`, error);
    }
  }

  async removeFile(fileName) {
    try {
      logger.info(`Removing file from index: ${fileName}`);
      await chromaService.deleteByMetadata({ source: fileName });
      logger.info(`Successfully removed ${fileName} from index`);
    } catch (error) {
      logger.error(`Failed to remove file ${fileName} from index: ${error.message}`);
    }
  }

  startWatcher() {
    if (this.watcher) {
      this.watcher.close();
    }

    logger.info(`Starting file watcher on ${this.documentsDir}...`);
    this.watcher = chokidar.watch(this.documentsDir, {
      ignored: /(^|[\/\\])\../, // ignore dotfiles
      persistent: true,
      ignoreInitial: true // ignore initial files as we ingestAll on startup
    });

    this.watcher
      .on('add', async (filePath) => {
        const fileName = path.basename(filePath);
        logger.info(`File watcher: Added ${fileName}`);
        await this.ingestFile(filePath, fileName);
      })
      .on('change', async (filePath) => {
        const fileName = path.basename(filePath);
        logger.info(`File watcher: Changed ${fileName}`);
        await this.ingestFile(filePath, fileName);
      })
      .on('unlink', async (filePath) => {
        const fileName = path.basename(filePath);
        logger.info(`File watcher: Removed ${fileName}`);
        await this.removeFile(fileName);
      });
  }

  async getIndexedDocuments() {
    try {
      const chunks = await chromaService.getAllDocuments(false);
      // Group chunks by source filename to build a list of indexed files
      const docsMap = {};
      for (const chunk of chunks) {
        const src = chunk.metadata.source;
        if (!docsMap[src]) {
          docsMap[src] = {
            fileName: src,
            fileType: chunk.metadata.fileType,
            chunkCount: 0,
            totalChars: 0,
            lastUpdated: chunk.metadata.timestamp
          };
        }
        docsMap[src].chunkCount++;
        docsMap[src].totalChars += chunk.metadata.length || 0;
        if (chunk.metadata.timestamp > docsMap[src].lastUpdated) {
          docsMap[src].lastUpdated = chunk.metadata.timestamp;
        }
      }
      return Object.values(docsMap);
    } catch (error) {
      logger.error(`Error getting indexed documents: ${error.message}`);
      return [];
    }
  }
}

const ingestService = new IngestService();
export default ingestService;
