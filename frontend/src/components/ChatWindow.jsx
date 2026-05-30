import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Bot, 
  User, 
  Sparkles, 
  Search, 
  ChevronDown, 
  ChevronUp, 
  FileSpreadsheet, 
  ShieldAlert, 
  Maximize2,
  Terminal,
  Activity
} from 'lucide-react';

export default function ChatWindow({
  messages,
  activeThreadTitle,
  onSendMessage,
  streamingResponse,
  streamingCitations,
  streamingOptimizedQuery,
  loading,
  selectedFilters,
  cragEvents = []
}) {
  const [inputText, setInputText] = useState('');
  const [activeTelemetryIndex, setActiveTelemetryIndex] = useState(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingResponse, loading]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputText.trim() || loading) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Quick sample prompts
  const samplePrompts = [
    { title: "What is RAG?", desc: "Explain the four core stages of Retrieval-Augmented Generation." },
    { title: "ChromaDB Collections", desc: "How are collections managed and what distance metrics are supported?" },
    { title: "Reciprocal Rank Fusion", desc: "What is RRF and how does it combine vector and keyword search?" },
    { title: "Hybrid Search Setup", desc: "How do BM25 and dense semantic search compare in RAG?" }
  ];

  /**
   * Extremely lightweight, custom markdown renderer that parses:
   * - Bold text (**text**)
   * - Inline code (`code`)
   * - Block code (```code```)
   * - Citations ([Source N])
   * - Bullet lists (- item)
   */
  const renderMarkdown = (text, citations = []) => {
    if (!text) return '';
    
    let html = text;

    // 1. Escaping basic HTML to prevent injection
    html = html
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    // 2. Format citations: [Source N] -> <span class="citation-badge" onClick="...">[Source N]</span>
    html = html.replace(/\[Source (\d+)\]/g, (match, num) => {
      return `<span class="citation-badge" data-source-index="${num}">Source ${num}</span>`;
    });

    // 3. Format block code: ```javascript ... ```
    html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (match, lang, code) => {
      return `<pre><code class="language-${lang}">${code.trim()}</code></pre>`;
    });

    // 4. Format inline code: `code`
    html = html.replace(/`([^`\n]+)`/g, '<code>$1</code>');

    // 5. Format bold text: **bold**
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

    // 6. Format headers
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

    // 7. Format bullet points: - item
    html = html.replace(/^\s*-\s+(.*$)/gim, '<li>$1</li>');
    // Wrap consecutive list items in <ul>
    html = html.replace(/(<li>.*<\/li>)/gim, '<ul>$1</ul>');
    // Simple deduplication of adjacent tags
    html = html.replace(/<\/ul>\s*<ul>/g, '');

    // 8. Replace line breaks with double line breaks for paragraph separation
    html = html.replace(/\n\n/g, '<p></p>');
    html = html.replace(/\n/g, '<br/>');

    return <div className="markdown-content" dangerouslySetInnerHTML={{ __html: html }} onClick={handleCitationClick} />;
  };

  const handleCitationClick = (e) => {
    const badge = e.target.closest('.citation-badge');
    if (!badge) return;

    const sourceIdx = parseInt(badge.getAttribute('data-source-index')) - 1;
    // Find parent container or open details card
    // We can scroll down to telemetry section or highlight it
    const telemetrySection = document.getElementById(`source-citation-card-${sourceIdx}`);
    if (telemetrySection) {
      telemetrySection.scrollIntoView({ behavior: 'smooth', block: 'center' });
      telemetrySection.style.borderColor = 'hsl(var(--primary))';
      telemetrySection.style.boxShadow = '0 0 15px hsl(var(--primary-glow))';
      setTimeout(() => {
        telemetrySection.style.borderColor = '';
        telemetrySection.style.boxShadow = '';
      }, 2000);
    }
  };

  return (
    <div className="chat-window" style={{
      flex: 1,
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      backgroundColor: 'transparent'
    }}>
      {/* Thread Title Header */}
      <header className="chat-header" style={{
        height: 'var(--header-height)',
        borderBottom: '1px solid hsl(var(--border-color))',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        backdropFilter: 'blur(10px)',
        backgroundColor: 'hsl(var(--bg-primary) / 0.35)',
        zIndex: 5
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Bot size={20} color="hsl(var(--primary-hover))" />
          <h2 style={{ fontSize: '1rem', fontWeight: 600, fontFamily: 'Outfit' }}>
            {activeThreadTitle || 'RAG Assistant'}
          </h2>
        </div>

        {selectedFilters.length > 0 && (
          <div style={{
            fontSize: '0.75rem',
            backgroundColor: 'hsl(var(--secondary) / 0.1)',
            color: 'hsl(var(--secondary))',
            border: '1px solid hsl(var(--secondary) / 0.2)',
            padding: '4px 10px',
            borderRadius: '12px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '5px'
          }}>
            <Search size={12} />
            <span>Scoped Search ({selectedFilters.length} Selected Docs)</span>
          </div>
        )}
      </header>

      {/* Message List area */}
      <div className="message-container" style={{
        flex: 1,
        overflowY: 'auto',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px'
      }}>
        {messages.length === 0 && !streamingResponse ? (
          /* Welcome Dashboard dashboard splash screen */
          <div className="welcome-splash" style={{
            maxWidth: '720px',
            margin: 'auto',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            gap: '30px',
            padding: '40px 20px'
          }}>
            <div>
              <div style={{
                background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary)))',
                width: '60px',
                height: '60px',
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px auto',
                boxShadow: '0 8px 24px hsl(var(--primary-glow))'
              }}>
                <Sparkles size={28} color="white" />
              </div>
              <h1 style={{
                fontFamily: 'Outfit',
                fontSize: '2.2rem',
                fontWeight: 700,
                letterSpacing: '-0.5px',
                background: 'linear-gradient(90deg, hsl(var(--text-primary)), hsl(var(--text-secondary) / 0.7))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                marginBottom: '10px'
              }}>Welcome to Antigravity RAG</h1>
              <p style={{
                color: 'hsl(var(--text-secondary))',
                fontSize: '0.95rem',
                maxWidth: '520px',
                margin: '0 auto',
                lineHeight: 1.6
              }}>
                An advanced AI assistant utilizing hybrid search (vector similarity + BM25 keyword matching) on local documents with intelligent reranking.
              </p>
            </div>

            {/* Quick action sample prompts */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '16px',
              marginTop: '10px'
            }}>
              {samplePrompts.map((prompt, idx) => (
                <div
                  key={idx}
                  onClick={() => onSendMessage(prompt.desc)}
                  style={{
                    backgroundColor: 'hsl(var(--bg-secondary) / 0.4)',
                    border: '1px solid hsl(var(--border-color))',
                    borderRadius: 'var(--border-radius-lg)',
                    padding: '16px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'var(--transition-smooth)',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                  }}
                  className="prompt-card"
                >
                  <span style={{
                    display: 'block',
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    color: 'hsl(var(--secondary))',
                    fontFamily: 'Outfit',
                    marginBottom: '4px'
                  }}>{prompt.title}</span>
                  <span style={{
                    display: 'block',
                    fontSize: '0.75rem',
                    color: 'hsl(var(--text-secondary))',
                    lineHeight: 1.4
                  }}>{prompt.desc}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Render Messages */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '820px', width: '100%', margin: '0 auto' }}>
            {messages.map((msg, msgIdx) => (
              <div 
                key={msg.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  width: '100%'
                }}
              >
                {/* Bubble Outer */}
                <div style={{
                  display: 'flex',
                  gap: '16px',
                  flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                  width: '100%'
                }}>
                  {/* Icon Avatar */}
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: msg.role === 'user' ? 'hsl(var(--primary) / 0.15)' : 'hsl(var(--secondary) / 0.15)',
                    border: '1px solid',
                    borderColor: msg.role === 'user' ? 'hsl(var(--primary) / 0.3)' : 'hsl(var(--secondary) / 0.3)',
                    flexShrink: 0
                  }}>
                    {msg.role === 'user' ? (
                      <User size={16} color="hsl(var(--primary-hover))" />
                    ) : (
                      <Bot size={16} color="hsl(var(--secondary))" />
                    )}
                  </div>

                  {/* Text Content Bubble */}
                  <div style={{
                    backgroundColor: msg.role === 'user' ? 'hsl(var(--primary) / 0.08)' : 'hsl(var(--bg-secondary) / 0.3)',
                    border: '1px solid',
                    borderColor: msg.role === 'user' ? 'hsl(var(--primary) / 0.25)' : 'hsl(var(--border-color))',
                    borderRadius: 'var(--border-radius-lg)',
                    padding: '16px 20px',
                    maxWidth: '85%',
                    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.15)'
                  }}>
                    {/* Render message body markdown */}
                    {renderMarkdown(msg.content, msg.citations)}
                  </div>
                </div>

                {/* Retrieved Citations & Telemetry Insights Section */}
                {msg.role === 'assistant' && msg.citations && msg.citations.length > 0 && (
                  <div style={{
                    marginLeft: '52px',
                    maxWidth: '85%',
                    alignSelf: 'flex-start'
                  }}>
                    {/* Insights Expand Header */}
                    <button
                      onClick={() => setActiveTelemetryIndex(activeTelemetryIndex === msgIdx ? null : msgIdx)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'hsl(var(--text-muted))',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        transition: 'var(--transition-smooth)'
                      }}
                      className="telemetry-toggle-btn"
                    >
                      <Activity size={12} color="hsl(var(--secondary))" />
                      <span>{activeTelemetryIndex === msgIdx ? 'Hide Search Pipeline Telemetry' : 'Show Search Pipeline Telemetry'}</span>
                      {activeTelemetryIndex === msgIdx ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    </button>

                    {/* Telemetry drawer panel */}
                    {activeTelemetryIndex === msgIdx && (
                      <div style={{
                        marginTop: '10px',
                        padding: '16px',
                        borderRadius: 'var(--border-radius-lg)',
                        backgroundColor: 'hsl(var(--bg-secondary) / 0.6)',
                        border: '1px solid hsl(var(--border-color))',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px'
                      }} className="animate-fade-in-up">
                        
                        {/* Optimized Query Telemetry */}
                        {msg.optimizedQuery && (
                          <div style={{
                            padding: '10px 12px',
                            backgroundColor: 'hsl(var(--bg-primary))',
                            borderRadius: 'var(--border-radius-md)',
                            borderLeft: '3px solid hsl(var(--secondary))',
                            fontSize: '0.75rem'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'hsl(var(--text-muted))', fontWeight: 700, marginBottom: '4px' }}>
                              <Terminal size={12} />
                              <span>GROQ QUERY REWRITER/OPTIMIZER</span>
                            </div>
                            <span style={{ fontFamily: 'Courier New', color: 'hsl(var(--text-primary))' }}>"{msg.optimizedQuery}"</span>
                          </div>
                        )}

                        {/* Retrieved Chunks citations details list */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'hsl(var(--text-muted))' }}>RETRIEVED CONTEXT SOURCES:</span>
                          
                          <div style={{ display: 'grid', gap: '8px' }}>
                            {msg.citations.map((cite, citeIdx) => (
                              <div
                                key={citeIdx}
                                id={`source-citation-card-${citeIdx}`}
                                style={{
                                  padding: '12px',
                                  borderRadius: 'var(--border-radius-md)',
                                  backgroundColor: 'hsl(var(--bg-primary) / 0.5)',
                                  border: '1px solid hsl(var(--border-color))',
                                  fontSize: '0.75rem',
                                  transition: 'var(--transition-smooth)'
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}>
                                    <span style={{
                                      backgroundColor: 'hsl(var(--primary) / 0.15)',
                                      color: 'hsl(var(--primary-hover))',
                                      width: '18px',
                                      height: '18px',
                                      borderRadius: '4px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      fontSize: '0.65rem'
                                    }}>{citeIdx + 1}</span>
                                    <span style={{ color: 'hsl(var(--text-secondary))' }}>{cite.metadata.source}</span>
                                  </div>
                                  
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    {/* Retrieval strategy tag */}
                                    <span style={{
                                      fontSize: '0.6rem',
                                      backgroundColor: cite.retrievalMethod === 'vector' ? 'hsl(var(--primary) / 0.15)' :
                                                     cite.retrievalMethod === 'keyword' ? 'hsl(var(--warning) / 0.15)' :
                                                     'hsl(var(--secondary) / 0.15)',
                                      color: cite.retrievalMethod === 'vector' ? 'hsl(var(--primary-hover))' :
                                             cite.retrievalMethod === 'keyword' ? 'hsl(var(--warning))' :
                                             'hsl(var(--secondary))',
                                      padding: '1px 6px',
                                      borderRadius: '4px',
                                      fontWeight: 700,
                                      textTransform: 'uppercase'
                                    }}>{cite.retrievalMethod || 'hybrid'}</span>
                                    
                                    {/* Rank score indicator */}
                                    <span style={{ color: 'hsl(var(--secondary))', fontWeight: 700 }}>
                                      {(cite.rrfScore ? `RRF: ${cite.rrfScore.toFixed(4)}` : cite.distance ? `dist: ${cite.distance.toFixed(3)}` : 'Reranked')}
                                    </span>
                                  </div>
                                </div>
                                <p style={{ color: 'hsl(var(--text-muted))', lineHeight: 1.4, fontFamily: 'Plus Jakarta Sans', fontStyle: 'italic' }}>
                                  "{cite.document}"
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>

                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}

            {/* CRAG Events Display */}
            {cragEvents.length > 0 && (
              <div style={{ marginLeft: '52px', maxWidth: '85%', alignSelf: 'flex-start', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {cragEvents.map((event, idx) => (
                  <div key={idx} style={{
                    padding: '10px 12px',
                    backgroundColor: 'hsl(var(--bg-primary))',
                    borderRadius: 'var(--border-radius-md)',
                    borderLeft: '3px solid hsl(var(--primary))',
                    fontSize: '0.75rem'
                  }}>
                    {event.type === 'query_rewritten' && (
                      <>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'hsl(var(--text-muted))', fontWeight: 700, marginBottom: '4px' }}>
                          <Terminal size={12} />
                          <span>CRAG: QUERY REWRITTEN (Loop {event.data.loop})</span>
                        </div>
                        <span style={{ fontFamily: 'Courier New', color: 'hsl(var(--text-primary))' }}>"{event.data.query}"</span>
                      </>
                    )}
                    {event.type === 'retrieval' && (
                      <>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'hsl(var(--text-muted))', fontWeight: 700, marginBottom: '4px' }}>
                          <Search size={12} />
                          <span>CRAG: RETRIEVED CONTEXT (Loop {event.data.loop}) - {event.data.chunks.length} chunks</span>
                        </div>
                      </>
                    )}
                    {event.type === 'draft_answer' && (
                      <>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'hsl(var(--text-muted))', fontWeight: 700, marginBottom: '4px' }}>
                          <Sparkles size={12} />
                          <span>CRAG: DRAFT ANSWER GENERATED (Loop {event.data.loop})</span>
                        </div>
                      </>
                    )}
                    {event.type === 'verification' && (
                      <>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'hsl(var(--text-muted))', fontWeight: 700, marginBottom: '4px' }}>
                          <ShieldAlert size={12} />
                          <span>CRAG: VERIFICATION RESULT (Loop {event.data.loop}) - {event.data.verification.pass ? '✅ PASS' : '❌ FAIL'}</span>
                        </div>
                        {event.data.verification.reasoning && (
                          <div style={{ color: 'hsl(var(--text-secondary))' }}>{event.data.verification.reasoning}</div>
                        )}
                        {event.data.verification.issues && event.data.verification.issues.length > 0 && (
                          <div style={{ marginTop: '4px', color: 'hsl(var(--warning))' }}>
                            Issues: {event.data.verification.issues.join(', ')}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* SSE Streaming Message bubble */}
            {streamingResponse && (
              <div style={{ display: 'flex', gap: '16px', alignSelf: 'flex-start', width: '100%' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'hsl(var(--secondary) / 0.15)',
                  border: '1px solid hsl(var(--secondary) / 0.3)',
                  flexShrink: 0
                }}>
                  <Bot size={16} color="hsl(var(--secondary))" />
                </div>
                
                <div style={{
                  backgroundColor: 'hsl(var(--bg-secondary) / 0.3)',
                  border: '1px solid hsl(var(--border-color))',
                  borderRadius: 'var(--border-radius-lg)',
                  padding: '16px 20px',
                  maxWidth: '85%',
                  boxShadow: '0 4px 15px rgba(0, 0, 0, 0.15)'
                }}>
                  {renderMarkdown(streamingResponse)}
                  <span className="typing-caret" />
                </div>
              </div>
            )}

            {/* Skeleton bubble during startup query rewrite or retrieval */}
            {loading && !streamingResponse && (
              <div style={{ display: 'flex', gap: '16px', alignSelf: 'flex-start', width: '100%' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'hsl(var(--secondary) / 0.15)',
                  border: '1px solid hsl(var(--secondary) / 0.3)',
                  flexShrink: 0
                }}>
                  <Bot size={16} color="hsl(var(--secondary))" />
                </div>
                
                <div style={{
                  backgroundColor: 'hsl(var(--bg-secondary) / 0.3)',
                  border: '1px solid hsl(var(--border-color))',
                  borderRadius: 'var(--border-radius-lg)',
                  padding: '16px 20px',
                  maxWidth: '75%',
                  width: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}>
                  <div className="skeleton" style={{ width: '40%', height: '12px' }} />
                  <div className="skeleton" style={{ width: '90%', height: '12px' }} />
                  <div className="skeleton" style={{ width: '75%', height: '12px' }} />
                </div>
              </div>
            )}
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input bar Footer area */}
      <footer style={{
        padding: '16px 24px 24px 24px',
        borderTop: '1px solid hsl(var(--border-color))',
        backgroundColor: 'hsl(var(--bg-primary) / 0.25)',
        backdropFilter: 'blur(8px)',
        zIndex: 5
      }}>
        <form onSubmit={handleSubmit} style={{
          maxWidth: '820px',
          margin: '0 auto',
          position: 'relative'
        }}>
          {/* Main Input Text Field */}
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={loading ? "Generating answer..." : "Ask your document index a question..."}
            disabled={loading}
            rows={1}
            style={{
              width: '100%',
              backgroundColor: 'hsl(var(--bg-secondary) / 0.6)',
              border: '1px solid hsl(var(--border-color))',
              borderRadius: 'var(--border-radius-lg)',
              padding: '16px 60px 16px 20px',
              fontSize: '0.9rem',
              resize: 'none',
              maxHeight: '120px',
              boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.2)',
              outline: 'none',
              transition: 'var(--transition-smooth)',
              height: '52px'
            }}
            className="chat-textarea"
          />

          {/* Submit Action Button */}
          <button
            type="submit"
            disabled={!inputText.trim() || loading}
            style={{
              position: 'absolute',
              right: '12px',
              top: '8px',
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              backgroundColor: (!inputText.trim() || loading) ? 'transparent' : 'hsl(var(--primary))',
              border: 'none',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: (!inputText.trim() || loading) ? 'not-allowed' : 'pointer',
              boxShadow: (!inputText.trim() || loading) ? 'none' : '0 4px 10px hsl(var(--primary-glow))',
              transition: 'var(--transition-smooth)'
            }}
          >
            <Send size={16} />
          </button>
        </form>
        
        <div style={{
          textAlign: 'center',
          fontSize: '0.65rem',
          color: 'hsl(var(--text-muted))',
          marginTop: '8px'
        }}>
          Antigravity RAG. Using hybrid RRF search + Llama 3.3.
        </div>
      </footer>

      {/* Styled overrides */}
      <style dangerouslySetInnerHTML={{__html: `
        .prompt-card:hover {
          border-color: hsl(var(--primary) / 0.6) !important;
          background-color: hsl(var(--primary) / 0.05) !important;
          box-shadow: 0 4px 20px hsl(var(--primary-glow) / 0.1) !important;
          transform: translateY(-2px);
        }
        .telemetry-toggle-btn:hover {
          background-color: hsl(var(--bg-secondary) / 0.8) !important;
          color: hsl(var(--text-primary)) !important;
        }
        .chat-textarea:focus {
          border-color: hsl(var(--primary) / 0.6) !important;
          box-shadow: 0 0 15px hsl(var(--primary-glow) / 0.15), inset 0 2px 8px rgba(0,0,0,0.2) !important;
        }
        .skeleton {
          background: linear-gradient(90deg, hsl(var(--border-color) / 0.3) 25%, hsl(var(--border-color) / 0.8) 50%, hsl(var(--border-color) / 0.3) 75%);
          background-size: 200% 100%;
          animation: loadingSkeleton 1.5s infinite;
          border-radius: 4px;
        }
        @keyframes loadingSkeleton {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}} />
    </div>
  );
}
