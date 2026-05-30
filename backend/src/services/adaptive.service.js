import Groq from 'groq-sdk';
import logger from '../utils/logger.js';

class AdaptiveRAGService {
  constructor() {
    this.apiKey = process.env.GROQ_API_KEY;
    this.client = null;
  }

  getClient() {
    if (this.client) return this.client;

    const key = process.env.GROQ_API_KEY || this.apiKey;
    if (!key || key.includes('placeholder')) {
      logger.error('Groq API Key is not configured for adaptive RAG.');
      throw new Error('Groq API Key is missing.');
    }

    this.client = new Groq({ apiKey: key });
    return this.client;
  }

  /**
   * Classifies the query to determine the optimal retrieval strategy
   * Returns: { needsRetrieval, complexity, queryType, reasoning }
   */
  async classifyQuery(query, history = []) {
    try {
      const client = this.getClient();

      const systemPrompt = `You are a query classifier for an Adaptive RAG system. Your job is to analyze a user query and determine the optimal retrieval strategy.

Classify the query into these categories:
1. needsRetrieval: boolean - Whether this query requires document retrieval
   - true: Questions about specific documents, facts, or information in the knowledge base
   - false: General knowledge questions, greetings, simple conversational queries

2. complexity: "simple" | "moderate" | "complex"
   - simple: Single-step retrieval needed, straightforward question
   - moderate: May need multiple retrieval steps or comparison
   - complex: Multi-hop reasoning required, needs multiple related queries

3. queryType: "factual" | "analytical" | "conversational" | "comparison" | "procedural"
   - factual: Asking for specific facts or information
   - analytical: Requires analysis or interpretation
   - conversational: Chat, greetings, general discussion
   - comparison: Comparing multiple items or concepts
   - procedural: How-to or step-by-step instructions

Return ONLY a valid JSON object with these three fields. No explanation.`;

      const userPrompt = `User Query: "${query}"

${history.length > 0 ? `Conversation History (last 3 messages):\n${history.slice(-3).map(m => `${m.role}: ${m.content}`).join('\n')}\n` : ''}

Classify this query and return JSON with needsRetrieval, complexity, and queryType.`;

      const response = await client.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.1,
        max_tokens: 200,
        response_format: { type: "json_object" }
      });

      const result = JSON.parse(response.choices[0]?.message?.content || '{}');
      logger.info(`Query classification: ${JSON.stringify(result)}`);
      return result;
    } catch (error) {
      logger.error(`Failed to classify query: ${error.message}`);
      // Fallback: assume retrieval is needed with moderate complexity
      return {
        needsRetrieval: true,
        complexity: 'moderate',
        queryType: 'factual'
      };
    }
  }

  /**
   * Decomposes complex queries into sub-queries for multi-step retrieval
   */
  async decomposeQuery(query, history = []) {
    try {
      const client = this.getClient();

      const systemPrompt = `You are a query decomposition specialist. Break down complex queries into 2-4 simpler sub-queries that can be answered independently through retrieval.

Rules:
1. Each sub-query should be self-contained and answerable
2. Sub-queries should cover different aspects of the original query
3. Maintain the original intent and context
4. Return as a JSON array of strings

Example:
Original: "Compare the performance of React and Vue in terms of rendering speed and developer experience"
Sub-queries: ["React rendering performance", "Vue rendering performance", "React developer experience", "Vue developer experience"]`;

      const response = await client.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Decompose this query: "${query}"` }
        ],
        temperature: 0.2,
        max_tokens: 300,
        response_format: { type: "json_object" }
      });

      const result = JSON.parse(response.choices[0]?.message?.content || '{}');
      const subQueries = result.sub_queries || result.queries || result.subqueries || [];
      logger.info(`Query decomposed into ${subQueries.length} sub-queries`);
      return subQueries;
    } catch (error) {
      logger.error(`Failed to decompose query: ${error.message}`);
      return [query]; // Fallback to original query
    }
  }

  /**
   * Selects the optimal retrieval strategy based on query classification
   */
  selectStrategy(classification) {
    const { needsRetrieval, complexity } = classification;

    if (!needsRetrieval) {
      return 'no_retrieval';
    }

    switch (complexity) {
      case 'simple':
        return 'single_retrieval';
      case 'moderate':
        return 'hybrid_retrieval';
      case 'complex':
        return 'multi_step_retrieval';
      default:
        return 'hybrid_retrieval';
    }
  }
}

const adaptiveRAGService = new AdaptiveRAGService();
export default adaptiveRAGService;
