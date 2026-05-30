import React from 'react';

export default function EvaluationDashboard({ evaluation, running }) {
  return (
    <div className="evaluation-dashboard">
      <div className="card">
        <div className="card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3>RAG Evaluation Metrics</h3>
          {running && (
            <span style={{ 
              fontSize: '0.75rem', 
              color: 'hsl(var(--secondary))',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              🔄 Recalculating...
            </span>
          )}
        </div>
        <div className="card-body">
          {!evaluation && running && (
            <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'hsl(var(--text-muted))' }}>
              <div className="skeleton" style={{ width: '80%', height: '12px', margin: '0 auto 10px auto' }} />
              <div className="skeleton" style={{ width: '60%', height: '12px', margin: '0 auto 10px auto' }} />
              <span style={{ fontSize: '0.8rem' }}>Running initial evaluation...</span>
            </div>
          )}

          {!evaluation && !running && (
            <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'hsl(var(--text-muted))', fontSize: '0.8rem' }}>
              No evaluation data available. Upload documents to index.
            </div>
          )}

          {evaluation && (
            <div style={{ marginTop: '1rem' }}>
              <h4>Overall Metrics</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '0.5rem', marginBottom: '1rem' }}>
                <div className="metric-box" style={{ padding: '0.75rem', border: '1px solid #e0e0e0', borderRadius: '4px' }}>
                  <div className="metric-label" style={{ fontSize: '0.875rem', color: '#666' }}>Average Precision</div>
                  <div className="metric-value" style={{ fontSize: '1.25rem', fontWeight: 600, color: '#2d7d9a' }}>
                    {(evaluation.overallMetrics.averagePrecision * 100).toFixed(1)}%
                  </div>
                </div>
                <div className="metric-box" style={{ padding: '0.75rem', border: '1px solid #e0e0e0', borderRadius: '4px' }}>
                  <div className="metric-label" style={{ fontSize: '0.875rem', color: '#666' }}>Average Recall</div>
                  <div className="metric-value" style={{ fontSize: '1.25rem', fontWeight: 600, color: '#2d7d9a' }}>
                    {(evaluation.overallMetrics.averageRecall * 100).toFixed(1)}%
                  </div>
                </div>
                <div className="metric-box" style={{ padding: '0.75rem', border: '1px solid #e0e0e0', borderRadius: '4px' }}>
                  <div className="metric-label" style={{ fontSize: '0.875rem', color: '#666' }}>Average F1 Score</div>
                  <div className="metric-value" style={{ fontSize: '1.25rem', fontWeight: 600, color: '#2d7d9a' }}>
                    {(evaluation.overallMetrics.averageF1Score * 100).toFixed(1)}%
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '0.5rem', marginBottom: '1rem' }}>
                <div className="metric-box" style={{ padding: '0.75rem', border: '1px solid #e0e0e0', borderRadius: '4px' }}>
                  <div className="metric-label" style={{ fontSize: '0.875rem', color: '#666' }}>Total Test Queries</div>
                  <div className="metric-value" style={{ fontSize: '1.25rem', fontWeight: 600, color: '#2d7d9a' }}>
                    {evaluation.overallMetrics.totalTestQueries}
                  </div>
                </div>
                <div className="metric-box" style={{ padding: '0.75rem', border: '1px solid #e0e0e0', borderRadius: '4px' }}>
                  <div className="metric-label" style={{ fontSize: '0.875rem', color: '#666' }}>Successful Evaluations</div>
                  <div className="metric-value" style={{ fontSize: '1.25rem', fontWeight: 600, color: '#2d7d9a' }}>
                    {evaluation.overallMetrics.successfulEvaluations}
                  </div>
                </div>
              </div>

              <h4>Individual Query Results</h4>
              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {evaluation.individualResults.map((result, index) => (
                  <div 
                    key={index} 
                    style={{ 
                      borderBottom: '1px solid #eee', 
                      padding: '0.5rem 0' 
                    }}
                  >
                    <div style={{ fontWeight: 600 }}>Query: {result.query}</div>
                    {result.error ? (
                      <div style={{ color: '#dc2626' }}>Error: {result.error}</div>
                    ) : (
                      <div style={{ display: 'flex', gap: '1rem', marginTop: '0.25rem', fontSize: '0.875rem' }}>
                        <span>Precision: {(result.precision * 100).toFixed(0)}%</span>
                        <span>Recall: {(result.recall * 100).toFixed(0)}%</span>
                        <span>F1: {(result.f1Score * 100).toFixed(0)}%</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
