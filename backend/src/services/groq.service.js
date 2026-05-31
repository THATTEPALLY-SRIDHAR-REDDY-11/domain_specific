import Groq from 'groq-sdk';
import logger from '../utils/logger.js';

class GroqService {
  constructor() {
    this.apiKey = process.env.GROQ_API_KEY;
    this.client = null;
    this.defaultModel = 'llama-3.1-8b-instant'; // Smaller, faster model to avoid rate limits
    this.maxRetries = 3; // Retry up to 3 times
    this.retryDelay = 1000; // Wait 1 second between retries
  }

  // Helper function to delay execution
  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Helper function to retry async functions
  async withRetry(fn, retryCount = 0) {
    try {
      return await fn();
    } catch (error) {
      if (retryCount < this.maxRetries) {
        logger.warn(`Retrying (${retryCount + 1}/${this.maxRetries}) after error: ${error.message}`);
        await this.delay(this.retryDelay * (retryCount + 1)); // Exponential backoff
        return this.withRetry(fn, retryCount + 1);
      } else {
        logger.error(`Max retries reached. Final error: ${error.message}`);
        throw error;
      }
    }
  }

  getClient() {
    if (this.client) return this.client;

    const key = process.env.GROQ_API_KEY || this.apiKey;
    if (!key || key.includes('placeholder')) {
      logger.error('Groq API Key is not configured in environment variables.');
      throw new Error('Groq API Key is missing. Please set it in your backend .env file.');
    }

    this.client = new Groq({ apiKey: key });
    return this.client;
  }

  /**
   * Rewrites/optimizes user query based on conversation history to make it search-friendly.
   */
  async optimizeQuery(query, history = []) {
    try {
      // NO QUERY REWRITING AT ALL - this is causing all the issues!
      logger.info('Skipping query optimization to avoid hallucination.');
      return query;
    } catch (error) {
      logger.error(`Failed to optimize query: ${error.message}. Using original query.`, error);
      return query; // Fallback to original query on failure
    }
  }

  /**
   * Generates a streaming chat completion with RAG context injected.
   */
  async generateRAGStream(query, contextChunks, history = [], options = {}, onToken, onComplete, onError) {
    try {
      const client = this.getClient();
      let model = options.model || this.defaultModel;
      const temperature = options.temperature !== undefined ? Number(options.temperature) : 0;

      logger.info(`Generating streaming RAG response using model: ${model}, temp: ${temperature}`);

      // Format retrieved context
      logger.info(`Passing ${contextChunks.length} context chunks to LLM`);
      contextChunks.forEach((chunk, idx) => {
        logger.info(`Context chunk ${idx + 1}: ${chunk.document.substring(0, 50)}...`);
      });

      const contextText = contextChunks.map((chunk, idx) => {
        return `[Source ${idx + 1}]
File Name: ${chunk.metadata.source}
Content: ${chunk.document}
----------------------------------------`;
      }).join('\n\n');

      const systemPrompt = `CRITICAL INSTRUCTIONS FOR HEALTHCARE RAG:
1. YOUR ONLY JOB IS TO ANSWER USING EXACTLY THE INFORMATION IN THE "Context Documents" BELOW.
2. IF THE CONTEXT DOCUMENTS DO NOT CONTAIN ANY INFORMATION RELATED TO THE QUERY, YOU MUST ONLY SAY: "The requested information is not available in the provided healthcare knowledge base". IF THEY DO CONTAIN RELEVANT INFORMATION (EVEN IF BRIEF OR INCOMPLETE), SUMMARIZE THAT INFORMATION DIRECTLY.
3. ABSOLUTELY NO GENERAL KNOWLEDGE, NO EXTERNAL INFORMATION, NO HALLUCINATIONS.
4. YOU CANNOT INVENT ANYTHING THAT IS NOT EXPLICITLY IN THE CONTEXT DOCUMENTS.
5. DO NOT REFERENCE ANYTHING NOT IN THE CONTEXT DOCUMENTS.
6. WHEN IN DOUBT, SAY YOU DON'T HAVE ENOUGH INFO.

Context Documents:
========================================
${contextText}
========================================

Additional Rules:
- ONLY CITE INFORMATION THAT IS EXACTLY IN THE CONTEXT DOCUMENTS.
- USE [Source X] WHERE X IS THE NUMBER OF THE DOCUMENT IN THE CONTEXT LIST.
- GIVE A HELPFUL, STRUCTURED ANSWER WHEN THE CONTEXT SUPPORTS IT.
- INCLUDE ALL RELEVANT DETAILS FROM THE CONTEXT, NOT ONLY ONE SENTENCE.
- ORGANIZE LONGER ANSWERS WITH SHORT PARAGRAPHS OR BULLETS.
- IF THE CONTEXT IS BRIEF, SAY SO AND THEN PRESENT EVERY AVAILABLE DETAIL.
- DO NOT ADD MEDICAL ADVICE BEYOND EXACTLY WHAT IS IN THE DOCUMENTS.`;

      // Build message log: System prompt + History + User Query
      const messages = [
        { role: 'system', content: systemPrompt }
      ];

      // Add conversation history
      if (history && history.length > 0) {
        history.forEach(msg => {
          messages.push({
            role: msg.role === 'user' ? 'user' : 'assistant',
            content: msg.content
          });
        });
      }

      // Add active user query
      messages.push({
        role: 'user',
        content: query
      });

      try {
        const stream = await this.withRetry(async () => {
          return await client.chat.completions.create({
            model,
            messages,
            temperature,
            stream: true
          });
        });

        let completeResponse = '';

        for await (const chunk of stream) {
          const token = chunk.choices[0]?.delta?.content || '';
          if (token) {
            completeResponse += token;
            onToken(token);
          }
        }

        logger.info('RAG stream completed successfully.');
        if (onComplete) {
          onComplete(completeResponse);
        }
      } catch (error) {
        // If we hit rate limit or error, try falling back to smaller model
        if (model !== 'llama-3.1-8b-instant') {
          logger.warn(`Falling back to smaller model due to error: ${error.message}`);
          model = 'llama-3.1-8b-instant';
          const stream = await this.withRetry(async () => {
            return await client.chat.completions.create({
              model,
              messages,
              temperature,
              stream: true
            });
          });

          let completeResponse = '';

          for await (const chunk of stream) {
            const token = chunk.choices[0]?.delta?.content || '';
            if (token) {
              completeResponse += token;
              onToken(token);
            }
          }

          logger.info('RAG stream completed successfully using fallback model.');
          if (onComplete) {
            onComplete(completeResponse);
          }
        } else {
          throw error;
        }
      }
    } catch (error) {
      logger.error(`Error in generateRAGStream: ${error.message}`, error);
      if (onError) {
        onError(error);
      } else {
        throw error;
      }
    }
  }

  /**
   * Generates a non-streaming draft RAG answer for the verifier loop.
   */
  async generateDraftAnswer(query, contextChunks, history = [], options = {}) {
    try {
      const client = this.getClient();
      let model = options.model || this.defaultModel;
      const temperature = options.temperature !== undefined ? Number(options.temperature) : 0;

      logger.info(`Generating draft RAG response using model: ${model}, temp: ${temperature}`);

      const contextText = contextChunks.map((chunk, idx) => {
        return `[Source ${idx + 1}]
File Name: ${chunk.metadata.source}
Content: ${chunk.document}
----------------------------------------`;
      }).join('\n\n');

      const systemPrompt = `CRITICAL INSTRUCTIONS FOR HEALTHCARE RAG:
1. YOUR ONLY JOB IS TO ANSWER USING EXACTLY THE INFORMATION IN THE "Context Documents" BELOW.
2. IF THE CONTEXT DOCUMENTS DO NOT CONTAIN ANY INFORMATION RELATED TO THE QUERY, YOU MUST ONLY SAY: "The requested information is not available in the provided healthcare knowledge base". IF THEY DO CONTAIN RELEVANT INFORMATION (EVEN IF BRIEF OR INCOMPLETE), SUMMARIZE THAT INFORMATION DIRECTLY.
3. ABSOLUTELY NO GENERAL KNOWLEDGE, NO EXTERNAL INFORMATION, NO HALLUCINATIONS.
4. YOU CANNOT INVENT ANYTHING THAT IS NOT EXPLICITLY IN THE CONTEXT DOCUMENTS.
5. DO NOT REFERENCE ANYTHING NOT IN THE CONTEXT DOCUMENTS.
6. WHEN IN DOUBT, SAY YOU DON'T HAVE ENOUGH INFO.

Context Documents:
========================================
${contextText}
========================================

Additional Rules:
- ONLY CITE INFORMATION THAT IS EXACTLY IN THE CONTEXT DOCUMENTS.
- USE [Source X] WHERE X IS THE NUMBER OF THE DOCUMENT IN THE CONTEXT LIST.
- GIVE A HELPFUL, STRUCTURED ANSWER WHEN THE CONTEXT SUPPORTS IT.
- INCLUDE ALL RELEVANT DETAILS FROM THE CONTEXT, NOT ONLY ONE SENTENCE.
- ORGANIZE LONGER ANSWERS WITH SHORT PARAGRAPHS OR BULLETS.
- IF THE CONTEXT IS BRIEF, SAY SO AND THEN PRESENT EVERY AVAILABLE DETAIL.
- DO NOT ADD MEDICAL ADVICE BEYOND EXACTLY WHAT IS IN THE DOCUMENTS.`;

      const messages = [
        { role: 'system', content: systemPrompt }
      ];

      if (history && history.length > 0) {
        history.forEach(msg => {
          messages.push({
            role: msg.role === 'user' ? 'user' : 'assistant',
            content: msg.content
          });
        });
      }

      messages.push({
        role: 'user',
        content: query
      });

      const response = await this.withRetry(async () => {
        return await client.chat.completions.create({
          model,
          messages,
          temperature
        });
      });

      return response.choices[0]?.message?.content || '';
    } catch (error) {
      logger.error(`Error in generateDraftAnswer: ${error.message}`, error);
      throw error;
    }
  }

  /**
   * Classifies if the provided text is related to health, medicine, biology, healthcare, or clinical treatments.
   */
  async isHealthcareRelated(text) {
    try {
      const client = this.getClient();
      // Extract a sample to be fast and cost-effective
      const sampleText = text.substring(0, 5000);

      const systemPrompt = `You are a medical healthcare validation assistant. Your sole job is to classify if the provided document text is related to health, medicine, biology, healthcare, clinical treatments, anatomy, pharmacology, wellness, diseases, or patient care.
      
If the text is related to any of the above health-related topics, return a JSON object with:
{
  "isHealthRelated": true,
  "reason": "Brief explanation of why it is health-related"
}

If the text is completely unrelated to health/medicine/biology/healthcare (e.g., general software programming, financial reports, recipe guides, sports news, general marketing, music, etc.), return:
{
  "isHealthRelated": false,
  "reason": "Brief explanation of why it is not health-related"
}

Return ONLY valid JSON. Do not include any markdown format (like \`\`\`json) in the response outside of the JSON itself.`;

      const response = await this.withRetry(async () => {
        return await client.chat.completions.create({
          model: 'llama-3.1-8b-instant',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Document text sample:\n\n${sampleText}\n\nClassification JSON:` }
          ],
          temperature: 0.0,
          max_tokens: 200,
          response_format: { type: "json_object" }
        });
      });

      let content = response.choices[0]?.message?.content || '{}';
      content = content.trim();
      const result = JSON.parse(content);
      logger.info(`Healthcare validation result: ${result.isHealthRelated ? 'VALID' : 'INVALID'} - Reason: ${result.reason}`);
      return result;
    } catch (error) {
      logger.error(`Error in isHealthcareRelated classification: ${error.message}`);
      // Safety fallback: allow upload but log it, so we don't completely lock out the system in case of Groq API transient errors
      return { isHealthRelated: true, reason: 'Validation error fallback: ' + error.message };
    }
  }
}

const groqService = new GroqService();
export default groqService;
