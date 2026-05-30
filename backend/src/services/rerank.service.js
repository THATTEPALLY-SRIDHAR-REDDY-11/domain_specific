import { AutoTokenizer, AutoModelForSequenceClassification } from '@xenova/transformers';
import Groq from 'groq-sdk';
import logger from '../utils/logger.js';

class RerankService {
  constructor() {
    this.rerankMethod = process.env.RERANK_METHOD || 'groq';
    this.localModelName = 'Xenova/ms-marco-MiniLM-L-6-v2'; // Lightweight cross-encoder (~90MB)
    this.tokenizer = null;
    this.model = null;
    this.initializingPromise = null;
  }

  async initializeLocal() {
    if (this.tokenizer && this.model) return { tokenizer: this.tokenizer, model: this.model };
    if (this.initializingPromise) return this.initializingPromise;

    this.initializingPromise = (async () => {
      logger.info(`Loading local cross-encoder model & tokenizer: ${this.localModelName}...`);
      try {
        this.tokenizer = await AutoTokenizer.from_pretrained(this.localModelName);
        this.model = await AutoModelForSequenceClassification.from_pretrained(this.localModelName);
        logger.info(`Successfully loaded cross-encoder model & tokenizer: ${this.localModelName}`);
        return { tokenizer: this.tokenizer, model: this.model };
      } catch (error) {
        logger.error(`Error loading cross-encoder: ${error.message}`);
        this.initializingPromise = null;
        throw error;
      }
    })();

    return this.initializingPromise;
  }

  async rerank(query, documents, limit = 4) {
    if (!documents || documents.length === 0) return [];
    if (documents.length <= 1) return documents.slice(0, limit);

    const method = process.env.RERANK_METHOD || this.rerankMethod;
    logger.info(`Reranking ${documents.length} chunks using method: ${method}...`);

    try {
      if (method === 'none') {
        logger.info('Reranking disabled (none). Returning top chunks in original RRF order.');
        return documents.slice(0, limit);
      }

      if (method === 'local') {
        try {
          return await this.rerankLocal(query, documents, limit);
        } catch (localError) {
          logger.warn(`Local cross-encoder rerank failed: ${localError.message}. Falling back to Groq...`);
          // Fall back to Groq if local fails
          return await this.rerankGroq(query, documents, limit);
        }
      }

      // Default: Groq LLM-based reranking
      return await this.rerankGroq(query, documents, limit);
    } catch (error) {
      logger.error(`Reranking failed completely: ${error.message}. Returning original order as fallback.`, error);
      // Fail-safe: return original results in their current order
      return documents.slice(0, limit);
    }
  }

  async rerankLocal(query, documents, limit) {
    const { tokenizer, model } = await this.initializeLocal();
    
    logger.info(`Running local cross-encoder classification on ${documents.length} passages...`);
    
    const scoredDocs = [];
    for (const doc of documents) {
      try {
        const inputs = await tokenizer(query, { text_pair: doc.document, padding: true, truncation: true });
        const { logits } = await model(inputs);
        const score = logits.data[0];
        const relevanceScore = 1 / (1 + Math.exp(-score)); // Sigmoid mapping
        
        scoredDocs.push({
          ...doc,
          rerankScore: relevanceScore
        });
      } catch (err) {
        logger.error(`Error scoring document chunk: ${err.message}`);
        scoredDocs.push({
          ...doc,
          rerankScore: 0.0
        });
      }
    }

    // Sort descending by score
    const sorted = scoredDocs.sort((a, b) => b.rerankScore - a.rerankScore);
    logger.info(`Local reranking completed.`);
    return sorted.slice(0, limit);
  }

  async rerankGroq(query, documents, limit) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey || apiKey.includes('placeholder')) {
      logger.warn('Groq API Key is not configured. Skipping LLM reranking.');
      return documents.slice(0, limit);
    }

    const groq = new Groq({ apiKey });
    
    // Format documents list for LLM context
    const docsPromptText = documents.map((doc, idx) => {
      return `[Document Index ${idx}]
Source: ${doc.metadata.source}
Content: ${doc.document}
----------------------------------------`;
    }).join('\n');

    const prompt = `You are an expert search engine reranker. Your job is to analyze the relevance of a list of text chunks relative to a user's search query.

Query: "${query}"

Rank the following documents based on their relevance to the query. For each document, assign a relevance score between 0.0 and 1.0 (where 1.0 is extremely relevant and 0.0 is completely irrelevant).

Documents:
${docsPromptText}

You must return a valid JSON object containing a "rankings" key with an array of objects. Each object in the array must have 'index' (0-based matching the Document Index above) and 'score' (number between 0.0 and 1.0) keys, sorted by score in descending order. 
Your output MUST be a valid JSON object ONLY, enclosed in a markdown json code block. Do not write any other explanation or text.

Example Output format:
\`\`\`json
{
  "rankings": [
    { "index": 2, "score": 0.95 },
    { "index": 0, "score": 0.82 },
    { "index": 1, "score": 0.15 }
  ]
}
\`\`\``;

    let response;
    try {
      logger.info('Calling Groq API for LLM-based reranking (small model)...');
      response = await groq.chat.completions.create({
        model: 'llama-3.1-8b-instant', // Small model to avoid rate limits
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        response_format: { type: "json_object" } // Enforce JSON response if supported
      });
    } catch (error) {
      logger.warn(`Small model rerank failed: ${error.message}. Falling back to local reranking...`);
      return await this.rerankLocal(query, documents, limit);
    }

    const reply = response.choices[0]?.message?.content;
    if (!reply) throw new Error('Empty response from Groq Reranker');

    // Parse the JSON array out of response
    let rankings;
    try {
      // Find JSON block or parse raw if it's already JSON
      let cleanJson = reply.trim();
      const codeBlockMatch = cleanJson.match(/```json\s*([\s\S]*?)\s*```/);
      if (codeBlockMatch) {
        cleanJson = codeBlockMatch[1];
      }
      
      const parsed = JSON.parse(cleanJson);
      // Handle if it's wrapped in an object like { "rankings": [...] }
      rankings = Array.isArray(parsed) ? parsed : (parsed.rankings || parsed.results || Object.values(parsed)[0]);
      
      if (!Array.isArray(rankings)) {
        throw new Error('Parsed LLM response is not an array');
      }
    } catch (parseError) {
      logger.error(`Error parsing Groq reranker response: ${parseError.message}\nRaw response: ${reply}`);
      throw parseError;
    }

    // Re-order original documents based on the returned indexes
    const rerankedDocs = [];
    const seenIndices = new Set();

    for (const item of rankings) {
      const idx = Number(item.index);
      const score = Number(item.score);
      
      if (idx >= 0 && idx < documents.length && !seenIndices.has(idx)) {
        rerankedDocs.push({
          ...documents[idx],
          rerankScore: score
        });
        seenIndices.add(idx);
      }
    }

    // Append any documents that were missed by the LLM, keeping their original RRF order
    documents.forEach((doc, idx) => {
      if (!seenIndices.has(idx)) {
        rerankedDocs.push({
          ...doc,
          rerankScore: 0.0 // Lowest score since it wasn't rated
        });
      }
    });

    logger.info(`Groq reranking completed. Reordered ${rerankedDocs.length} items.`);
    return rerankedDocs.slice(0, limit);
  }
}

const rerankService = new RerankService();
export default rerankService;
