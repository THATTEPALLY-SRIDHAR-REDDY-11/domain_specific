import Groq from 'groq-sdk';
import logger from '../utils/logger.js';

class CorrectiveRAGService {
  constructor() {
    this.apiKey = process.env.GROQ_API_KEY;
    this.client = null;
    this.maxCorrectionLoops = 2; // Limit to prevent infinite loops
  }

  getClient() {
    if (this.client) return this.client;

    const key = process.env.GROQ_API_KEY || this.apiKey;
    if (!key || key.includes('placeholder')) {
      logger.error('Groq API Key is not configured for corrective RAG.');
      throw new Error('Groq API Key is missing.');
    }

    this.client = new Groq({ apiKey: key });
    return this.client;
  }

  /**
   * Step 2: Query Understanding / Optional Rewriting
   */
  async rewriteQuery(query, history = []) {
    try {
      // If no history, NEVER rewrite - always return original query!
      if (!history || history.length === 0) {
        logger.info(`No conversation history, keeping original query: "${query}"`);
        return query;
      }

      // Even with history, only rewrite if there are pronouns to resolve!
      // Otherwise just return original query!
      const hasPronouns = /\b(he|she|it|they|this|that|these|those)\b/i.test(query);
      if (!hasPronouns) {
        logger.info(`No pronouns to resolve, keeping original query: "${query}"`);
        return query;
      }

      const client = this.getClient();
      
      const systemPrompt = `You are a query understanding specialist. Rewrite the user query ONLY to resolve pronouns using conversation history.

Rules:
1. ONLY resolve pronouns (he, she, it, they, this, that, these, those)
2. DO NOT add any extra text
3. Keep the original query's intent and wording EXACTLY the same
4. Return only the rewritten query, no explanations`;

      const historyText = history.slice(-5).map(msg => `${msg.role.toUpperCase()}: ${msg.content}`).join('\n');

      const response = await client.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Conversation History:\n${historyText}\n\nOriginal Query: "${query}"\n\nRewritten Query:` }
        ],
        temperature: 0.0,
        max_tokens: 200
      });

      const rewritten = response.choices[0]?.message?.content?.trim();
      logger.info(`Query rewritten: "${rewritten}"`);
      return rewritten || query;
    } catch (error) {
      logger.error(`Failed to rewrite query: ${error.message}`);
      return query;
    }
  }

  /**
   * Step 7-8: Verification / Critic Layer
   * Checks relevance, hallucinations, evidence grounding, and consistency
   */
  async verifyAnswer(query, draftAnswer, contextChunks) {
    try {
      const client = this.getClient();

      const contextText = contextChunks.map((chunk, idx) => {
        return `[Source ${idx + 1}] ${chunk.document}`;
      }).join('\n\n');

      const systemPrompt = `You are a grounded answer verifier for a RAG system. Evaluate the draft answer against ONLY the provided context.

Verification Criteria:
1. RELEVANCE: Is the answer directly relevant to the query?
2. EVIDENCE GROUNDING: Does every claim in the answer have supporting evidence from the context?
3. HALLUCINATION CHECK: Are there any claims not supported by the context?
4. CONSISTENCY: Is the answer consistent with itself and the context?
5. COMPLETENESS: Does the answer include the relevant details that are actually present in the context?

Important:
- Do NOT require external evidence, peer-reviewed journals, medical guidelines, or sources that are not in the provided context.
- Do NOT fail an answer just because the context is brief.
- Do NOT require the answer to cite every source if some sources are irrelevant or repetitive.
- If the answer is accurate, grounded, and covers the available relevant context, pass it.

Return ONLY a JSON object with:
- pass: boolean (true if all checks pass)
- reasoning: string (brief explanation of pass/fail)
- issues: array of strings (specific issues if failed)
- suggestions: array of strings (how to improve if failed)`;

      const response = await client.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Query: "${query}"\n\nContext:\n${contextText}\n\nDraft Answer:\n${draftAnswer}\n\nVerification Result (JSON only):` }
        ],
        temperature: 0.1,
        max_tokens: 500,
        response_format: { type: "json_object" }
      });

      let content = response.choices[0]?.message?.content || '{}';
      content = content.trim();
      const codeBlockMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
      if (codeBlockMatch) {
        content = codeBlockMatch[1].trim();
      }
      const result = JSON.parse(content);
      logger.info(`Verification result: ${result.pass ? 'PASS' : 'FAIL'}`);
      return result;
    } catch (error) {
      logger.error(`Failed to verify answer: ${error.message}`);
      return { pass: true, reasoning: 'Verification failed, assuming pass', issues: [], suggestions: [] };
    }
  }

  /**
   * Step 10: Correction / Refinement Loop
   * Refines query based on verification feedback to fetch missing information.
   */
  async refineQuery(query, verificationResult, history = []) {
    try {
      logger.info(`Refining query "${query}" based on verification feedback...`);
      
      const client = this.getClient();
      
      const issues = Array.isArray(verificationResult?.issues) ? verificationResult.issues : [];
      const suggestions = Array.isArray(verificationResult?.suggestions) ? verificationResult.suggestions : [];
      
      if (issues.length === 0 && suggestions.length === 0) {
        logger.info('No issues or suggestions provided for refinement. Keeping original query.');
        return query;
      }
      
      const issuesText = issues.map((issue, idx) => `${idx + 1}. ${issue}`).join('\n');
      const suggestionsText = suggestions.map((sug, idx) => `${idx + 1}. ${sug}`).join('\n');
      
      const systemPrompt = `You are an expert query refinement specialist for a local document RAG system. Your job is to improve a search query only within the user's uploaded knowledge base.
      
Your goal is to rewrite the search query specifically to retrieve context chunks that address the issues and suggestions raised by the verifier.

Rules:
1. Output ONLY the refined search query.
2. DO NOT add any greeting, quotes, preamble, or explanation.
3. Incorporate conversational context and target the missing facts or evidence.
4. Do NOT use web search operators (such as site:, filetype:, OR, AND, etc.), brackets, or quotes. The query must be plain text search keywords suitable for semantic similarity vector search and BM25 keyword matching.
5. Do NOT add external-source terms such as peer-reviewed journals, medical guidelines, evidence-based practices, clinical trials, or research unless the original user query explicitly asked for those terms.
6. Preserve the original user's scope. If the user asks about ICU procedures, keep the query focused on ICU procedures, workflow, monitoring, staffing, patient care, and safety from the local documents.`;

      const userPrompt = `Previous Search Query: "${query}"

Verifier Issues:
${issuesText}

Verifier Suggestions:
${suggestionsText}

Refined Search Query:`;

      const response = await client.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
        max_tokens: 150
      });

      const refined = response.choices[0]?.message?.content?.trim();
      logger.info(`Query refined successfully: "${refined}"`);
      return refined || query;
    } catch (error) {
      logger.error(`Failed to refine query: ${error.message}`);
      return query;
    }
  }
}

const correctiveRAGService = new CorrectiveRAGService();
export default correctiveRAGService;
