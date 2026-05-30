import { pipeline } from '@xenova/transformers';
import logger from '../utils/logger.js';

class EmbeddingService {
  constructor() {
    this.modelName = process.env.EMBEDDING_MODEL || 'Xenova/all-MiniLM-L6-v2';
    this.extractor = null;
    this.initializingPromise = null;
  }

  async initialize() {
    if (this.extractor) return this.extractor;
    if (this.initializingPromise) return this.initializingPromise;

    this.initializingPromise = (async () => {
      logger.info(`Loading local embedding model: ${this.modelName}...`);
      try {
        this.extractor = await pipeline('feature-extraction', this.modelName);
        logger.info(`Successfully loaded embedding model: ${this.modelName}`);
        return this.extractor;
      } catch (error) {
        logger.error(`Error loading embedding model: ${error.message}`, error);
        this.initializingPromise = null;
        throw error;
      }
    })();

    return this.initializingPromise;
  }

  async getEmbedding(text) {
    if (!text || typeof text !== 'string') {
      throw new Error('Input text must be a non-empty string');
    }

    const extractor = await this.initialize();
    try {
      const output = await extractor(text, {
        pooling: 'mean',
        normalize: true,
      });

      // output.data is a Float32Array containing the embedding vector
      return Array.from(output.data);
    } catch (error) {
      logger.error(`Error generating embedding: ${error.message}`, error);
      throw error;
    }
  }

  async getEmbeddingsBatch(texts) {
    if (!Array.isArray(texts) || texts.length === 0) {
      return [];
    }

    const extractor = await this.initialize();
    try {
      logger.info(`Generating embeddings for batch of ${texts.length} items...`);
      const embeddings = [];
      
      // Process in small sub-batches to avoid memory blowup
      const batchSize = 10;
      for (let i = 0; i < texts.length; i += batchSize) {
        const subBatch = texts.slice(i, i + batchSize);
        const promises = subBatch.map(async (text) => {
          const output = await extractor(text, {
            pooling: 'mean',
            normalize: true,
          });
          return Array.from(output.data);
        });
        
        const subEmbeddings = await Promise.all(promises);
        embeddings.push(...subEmbeddings);
      }

      logger.info(`Generated all ${embeddings.length} embeddings successfully`);
      return embeddings;
    } catch (error) {
      logger.error(`Error generating embeddings batch: ${error.message}`, error);
      throw error;
    }
  }
}

const embeddingService = new EmbeddingService();
export default embeddingService;
