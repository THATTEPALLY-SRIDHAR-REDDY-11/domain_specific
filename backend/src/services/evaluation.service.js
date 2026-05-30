import logger from '../utils/logger.js';
import hybridSearchService from './hybrid.service.js';
import embeddingService from './embedding.service.js';

class EvaluationService {
  constructor() {
    this.testQueries = [
      {
        query: "What is diabetes management?",
        expectedRelevantDocs: ["1-Diabetes-Management-Guide.md"]
      },
      {
        query: "How to treat hypertension?",
        expectedRelevantDocs: ["2-Hypertension-Treatment-Guidelines.md"]
      },
      {
        query: "What are the protocols for COVID-19?",
        expectedRelevantDocs: ["4-COVID-19-Protocols.md"]
      },
      {
        query: "How to manage mental health?",
        expectedRelevantDocs: ["15-Mental-Health-Handbook.md"]
      },
      {
        query: "What are the emergency room protocols?",
        expectedRelevantDocs: ["41-Emergency-Room-Protocols.md"]
      },
      {
        query: "How to handle insurance claims?",
        expectedRelevantDocs: ["46-Health-Insurance-Claims-Guide.md"]
      },
      {
        query: "What are the hospital safety procedures?",
        expectedRelevantDocs: ["44-Hospital-Safety-Procedures.md"]
      },
      {
        query: "How to assess fever?",
        expectedRelevantDocs: ["16-Fever-Assessment-Guide.md"]
      }
    ];
  }

  calculatePrecision(retrievedDocs, expectedDocs) {
    if (retrievedDocs.length === 0) return 0;
    const relevantRetrieved = retrievedDocs.filter(doc => 
      expectedDocs.includes(doc.metadata.source)
    ).length;
    return relevantRetrieved / retrievedDocs.length;
  }

  calculateRecall(retrievedDocs, expectedDocs) {
    if (expectedDocs.length === 0) return 1;
    const relevantRetrieved = retrievedDocs.filter(doc => 
      expectedDocs.includes(doc.metadata.source)
    ).length;
    return relevantRetrieved / expectedDocs.length;
  }

  calculateF1Score(precision, recall) {
    if (precision + recall === 0) return 0;
    return 2 * (precision * recall) / (precision + recall);
  }

  async evaluateQuery(query, expectedRelevantDocs, retrieveLimit = 5, contextLimit = 4) {
    try {
      const retrievedDocs = await hybridSearchService.search(query, retrieveLimit);
      const precision = this.calculatePrecision(retrievedDocs, expectedRelevantDocs);
      const recall = this.calculateRecall(retrievedDocs, expectedRelevantDocs);
      const f1 = this.calculateF1Score(precision, recall);
      
      return {
        query,
        expectedRelevantDocs,
        retrievedDocSources: retrievedDocs.map(doc => doc.metadata.source),
        precision,
        recall,
        f1Score: f1
      };
    } catch (error) {
      logger.error(`Error evaluating query "${query}": ${error.message}`);
      return {
        query,
        error: error.message,
        precision: 0,
        recall: 0,
        f1Score: 0
      };
    }
  }

  async runFullEvaluation() {
    const results = [];
    let totalPrecision = 0;
    let totalRecall = 0;
    let totalF1 = 0;
    let successfulQueries = 0;

    logger.info("Starting full RAG evaluation...");

    for (const testCase of this.testQueries) {
      const result = await this.evaluateQuery(testCase.query, testCase.expectedRelevantDocs);
      results.push(result);
      if (!result.error) {
        totalPrecision += result.precision;
        totalRecall += result.recall;
        totalF1 += result.f1Score;
        successfulQueries++;
      }
    }

    const overallMetrics = {
      averagePrecision: successfulQueries > 0 ? totalPrecision / successfulQueries : 0,
      averageRecall: successfulQueries > 0 ? totalRecall / successfulQueries : 0,
      averageF1Score: successfulQueries > 0 ? totalF1 / successfulQueries : 0,
      totalTestQueries: this.testQueries.length,
      successfulEvaluations: successfulQueries,
      failedEvaluations: this.testQueries.length - successfulQueries
    };

    logger.info(`Evaluation complete. Average Precision: ${overallMetrics.averagePrecision.toFixed(2)}, Average Recall: ${overallMetrics.averageRecall.toFixed(2)}`);
    
    return {
      individualResults: results,
      overallMetrics
    };
  }
}

const evaluationService = new EvaluationService();
export default evaluationService;
