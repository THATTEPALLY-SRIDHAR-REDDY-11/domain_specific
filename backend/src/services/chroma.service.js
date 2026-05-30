import { ChromaClient } from 'chromadb';
import logger from '../utils/logger.js';

class ChromaService {
  constructor() {
    this.client = null;
    this.collection = null;
    this.collectionName = null; // Will be set in initialize()
    this.chromaUrl = null;
    this.apiKey = null;
    this.tenant = null;
    this.database = null;
  }

  async initialize() {
    if (this.collection) return this.collection;

    // Dynamically retrieve environment variables at init time (after dotenv.config() runs)
    const url = process.env.CHROMA_URL || 'http://127.0.0.1:8000';
    const apiKey = process.env.CHROMA_API_KEY || null;
    const tenant = process.env.CHROMA_TENANT || null;
    const database = process.env.CHROMA_DATABASE || null;
    const collectionName = process.env.COLLECTION_NAME || 'rag_documents';
    
    // Save to instance variables
    this.chromaUrl = url;
    this.apiKey = apiKey;
    this.tenant = tenant;
    this.database = database;
    this.collectionName = collectionName;

    try {
      logger.info(`Connecting to ChromaDB at ${url}...`);
      
      const clientOptions = { path: url };
      
      // Pass token authentication for authenticated cloud instances
      if (apiKey) {
        clientOptions.auth = {
          provider: "token",
          credentials: apiKey,
          tokenHeaderType: "X_CHROMA_TOKEN"
        };
      }
      
      // Pass custom tenant if specified
      if (tenant) {
        clientOptions.tenant = tenant;
      }
      
      // Pass custom database if specified
      if (database) {
        clientOptions.database = database;
      }

      this.client = new ChromaClient(clientOptions);
      
      // Heartbeat to check if connection works
      const hb = await this.client.heartbeat();
      logger.info(`ChromaDB heartbeat successful: ${hb}`);

      this.collection = await this.client.getOrCreateCollection({
        name: this.collectionName
      });
      logger.info(`Connected to ChromaDB collection: ${this.collectionName}`);
      return this.collection;
    } catch (error) {
      logger.error(`Failed to initialize ChromaDB: ${error.message}`, error);
      throw error;
    }
  }

  async addDocuments(ids, embeddings, documents, metadatas) {
    const col = await this.initialize();
    try {
      logger.info(`Adding ${ids.length} chunks to ChromaDB...`);
      await col.add({
        ids,
        embeddings,
        documents,
        metadatas
      });
      logger.info(`Successfully added ${ids.length} chunks to ChromaDB.`);
    } catch (error) {
      logger.error(`Error adding documents to ChromaDB: ${error.message}`, error);
      throw error;
    }
  }

  async query(queryEmbedding, nResults = 5, where = null) {
    const col = await this.initialize();
    try {
      const queryParams = {
        queryEmbeddings: [queryEmbedding],
        nResults
      };

      if (where && Object.keys(where).length > 0) {
        queryParams.where = where;
      }

      logger.info(`Querying ChromaDB for top ${nResults} semantic matches...`);
      const results = await col.query(queryParams);
      
      // Format results to a clean list
      const formatted = [];
      if (results && results.ids && results.ids[0]) {
        for (let i = 0; i < results.ids[0].length; i++) {
          formatted.push({
            id: results.ids[0][i],
            document: results.documents[0][i],
            metadata: results.metadatas[0][i],
            distance: results.distances ? results.distances[0][i] : null
          });
        }
      }

      logger.info(`ChromaDB returned ${formatted.length} semantic results`);
      return formatted;
    } catch (error) {
      logger.error(`Error querying ChromaDB: ${error.message}`, error);
      throw error;
    }
  }

  async getAllDocuments(includeEmbeddings = false) {
    const col = await this.initialize();
    try {
      logger.info(`Retrieving all documents from ChromaDB...`);
      const include = ['documents', 'metadatas'];
      if (includeEmbeddings) {
        include.push('embeddings');
      }

      const results = await col.get({
        include
      });

      const formatted = [];
      if (results && results.ids) {
        for (let i = 0; i < results.ids.length; i++) {
          formatted.push({
            id: results.ids[i],
            document: results.documents[i],
            metadata: results.metadatas[i],
            embedding: includeEmbeddings ? results.embeddings[i] : null
          });
        }
      }

      logger.info(`Retrieved ${formatted.length} chunks from ChromaDB`);
      return formatted;
    } catch (error) {
      logger.error(`Error fetching all documents from ChromaDB: ${error.message}`, error);
      throw error;
    }
  }

  async deleteByMetadata(where) {
    const col = await this.initialize();
    try {
      if (!where || Object.keys(where).length === 0) {
        throw new Error('Must specify filter criteria for deletion');
      }
      logger.info(`Deleting chunks matching filter: ${JSON.stringify(where)}`);
      await col.delete({ where });
      logger.info(`Deleted documents matching filter from ChromaDB`);
    } catch (error) {
      logger.error(`Error deleting documents from ChromaDB: ${error.message}`, error);
      throw error;
    }
  }

  async resetCollection() {
    const col = await this.initialize();
    try {
      logger.warn(`Resetting entire collection: ${this.collectionName}`);
      // Chroma collection delete
      await this.client.deleteCollection({ name: this.collectionName });
      this.collection = null;
      await this.initialize();
      logger.info(`Collection reset successfully`);
    } catch (error) {
      logger.error(`Error resetting collection: ${error.message}`, error);
      throw error;
    }
  }
}

const chromaService = new ChromaService();
export default chromaService;
