import { useState } from 'react';
import { 
  MessageSquare, 
  Plus, 
  Trash2, 
  Settings2, 
  Sliders, 
  Cpu, 
  Database, 
  
  RefreshCw
} from 'lucide-react';

export default function Sidebar({
  threads,
  activeThreadId,
  setActiveThreadId,
  onNewThread,
  onDeleteThread,
  settings,
  setSettings,
  onResetDatabase,
  dbResetting,
  onClearBrowserHistory
}) {
  const [showSettings, setShowSettings] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleResetClick = () => {
    if (confirmReset) {
      onResetDatabase();
      setConfirmReset(false);
    } else {
      setConfirmReset(true);
      setTimeout(() => setConfirmReset(false), 5000); // Reset confirmation state after 5 seconds
    }
  };

  return (
    <aside className="sidebar glass-panel" style={{
      width: 'var(--sidebar-width)',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      borderRight: '1px solid hsl(var(--border-color))',
      zIndex: 10
    }}>
      {/* Brand Header */}
      <div className="sidebar-brand" style={{
        padding: '24px 20px',
        borderBottom: '1px solid hsl(var(--border-color))',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <div style={{
          background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary)))',
          width: '38px',
          height: '38px',
          borderRadius: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 15px hsl(var(--primary-glow))'
        }}>
          <Cpu size={20} color="white" />
        </div>
        <div>
          <h1 style={{ 
            fontSize: '1.15rem', 
            fontWeight: 700, 
            fontFamily: 'Outfit', 
            letterSpacing: '0.5px' 
          }}>Medical Healthcare RAG</h1>
          <span style={{ 
            fontSize: '0.75rem', 
            color: 'hsl(var(--secondary))',
            fontWeight: 600
          }}>MEDICAL HEALTHCARE ENGINE</span>
        </div>
      </div>

      {/* New Conversation Button */}
      <div style={{ padding: '16px 20px' }}>
        <button 
          onClick={onNewThread}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: 'var(--border-radius-lg)',
            background: 'linear-gradient(90deg, hsl(var(--primary) / 0.1), transparent)',
            border: '1px dashed hsl(var(--primary) / 0.4)',
            color: 'hsl(var(--text-primary))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'var(--transition-smooth)'
          }}
          className="new-chat-btn"
        >
          <Plus size={18} />
          New Chat
        </button>
      </div>

      {/* Thread List Section */}
      <div className="thread-section" style={{
        flex: 1,
        overflowY: 'auto',
        padding: '0 12px 16px 12px'
      }}>
        <span style={{
          fontSize: '0.75rem',
          fontWeight: 700,
          color: 'hsl(var(--text-muted))',
          textTransform: 'uppercase',
          letterSpacing: '1px',
          padding: '0 8px',
          display: 'block',
          marginBottom: '8px'
        }}>Conversations</span>

        {threads.length === 0 ? (
          <div style={{
            padding: '24px 12px',
            textAlign: 'center',
            color: 'hsl(var(--text-muted))',
            fontSize: '0.85rem'
          }}>
            No recent chats.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {threads.map(thread => (
              <div 
                key={thread.id}
                onClick={() => setActiveThreadId(thread.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                  borderRadius: 'var(--border-radius-md)',
                  cursor: 'pointer',
                  backgroundColor: activeThreadId === thread.id ? 'hsl(var(--primary) / 0.15)' : 'transparent',
                  border: '1px solid',
                  borderColor: activeThreadId === thread.id ? 'hsl(var(--primary) / 0.3)' : 'transparent',
                  transition: 'var(--transition-smooth)'
                }}
                className="thread-item"
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden', flex: 1 }}>
                  <MessageSquare size={16} color={activeThreadId === thread.id ? 'hsl(var(--primary-hover))' : 'hsl(var(--text-muted))'} />
                  <span style={{
                    fontSize: '0.85rem',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    fontWeight: activeThreadId === thread.id ? 600 : 500
                  }}>{thread.title}</span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteThread(thread.id);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'hsl(var(--text-muted))',
                    cursor: 'pointer',
                    opacity: 0,
                    transition: 'var(--transition-smooth)'
                  }}
                  className="delete-thread-btn"
                >
                  <Trash2 size={14} className="hover-danger" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Control Panel Switcher */}
      <div style={{
        padding: '12px 16px',
        borderTop: '1px solid hsl(var(--border-color))',
        backgroundColor: 'hsl(var(--bg-secondary) / 0.4)'
      }}>
        <button
          onClick={() => setShowSettings(!showSettings)}
          style={{
            width: '100%',
            padding: '10px',
            borderRadius: 'var(--border-radius-md)',
            background: showSettings ? 'hsl(var(--primary) / 0.1)' : 'transparent',
            border: '1px solid',
            borderColor: showSettings ? 'hsl(var(--primary) / 0.3)' : 'transparent',
            color: showSettings ? 'hsl(var(--primary-hover))' : 'hsl(var(--text-secondary))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.85rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'var(--transition-smooth)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Settings2 size={16} />
            Advanced Settings
          </div>
          <Sliders size={14} style={{ transform: showSettings ? 'rotate(90deg)' : 'none', transition: 'var(--transition-smooth)' }} />
        </button>
      </div>

      {/* Settings Drawer Panel */}
      {showSettings && (
        <div style={{
          padding: '16px',
          borderTop: '1px solid hsl(var(--border-color))',
          backgroundColor: 'hsl(var(--bg-secondary) / 0.7)',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          overflowY: 'auto',
          maxHeight: '320px'
        }} className="animate-fade-in-up">
          
          {/* Model Selector */}
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'hsl(var(--text-muted))', display: 'block', marginBottom: '6px' }}>GROQ LLM MODEL</label>
            <select
              value={settings.model}
              onChange={(e) => handleSettingChange('model', e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: 'var(--border-radius-sm)',
                backgroundColor: 'hsl(var(--bg-primary))',
                border: '1px solid hsl(var(--border-color))',
                fontSize: '0.8rem',
                cursor: 'pointer'
              }}
            >
              <option value="llama-3.3-70b-versatile">Llama 3.3 70B (Recommended)</option>
              <option value="llama-3.1-8b-instant">Llama 3.1 8B (Super Fast)</option>
              <option value="gemma-2-9b-it">Gemma 2 9B (Google)</option>
              <option value="mixtral-8x7b-32768">Mixtral 8x7B (MoE)</option>
            </select>
          </div>

          {/* Reranker Selector */}
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'hsl(var(--text-muted))', display: 'block', marginBottom: '6px' }}>RERANKING STRATEGY</label>
            <select
              value={settings.rerankMethod}
              onChange={(e) => handleSettingChange('rerankMethod', e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: 'var(--border-radius-sm)',
                backgroundColor: 'hsl(var(--bg-primary))',
                border: '1px solid hsl(var(--border-color))',
                fontSize: '0.8rem',
                cursor: 'pointer'
              }}
            >
              <option value="groq">(Recommended) Groq LLM</option>
              <option value="local">Local Cross-Encoder</option>
              <option value="none">No Reranking (Pure RRF)</option>
            </select>
          </div>

          {/* Temperature Slider */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '4px' }}>
              <span style={{ fontWeight: 700, color: 'hsl(var(--text-muted))' }}>TEMPERATURE</span>
              <span style={{ fontWeight: 600, color: 'hsl(var(--secondary))' }}>{settings.temperature}</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={settings.temperature}
              onChange={(e) => handleSettingChange('temperature', parseFloat(e.target.value))}
              style={{ width: '100%', accentColor: 'hsl(var(--primary))', cursor: 'pointer' }}
            />
          </div>

          {/* Limits adjustment */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'hsl(var(--text-muted))', display: 'block', marginBottom: '4px' }}>RETRIEVE LIMIT</label>
              <input
                type="number"
                min="1"
                max="20"
                value={settings.retrieveLimit}
                onChange={(e) => handleSettingChange('retrieveLimit', Math.max(1, parseInt(e.target.value) || 10))}
                style={{
                  width: '100%',
                  padding: '6px',
                  borderRadius: 'var(--border-radius-sm)',
                  backgroundColor: 'hsl(var(--bg-primary))',
                  border: '1px solid hsl(var(--border-color))',
                  fontSize: '0.8rem'
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'hsl(var(--text-muted))', display: 'block', marginBottom: '4px' }}>CONTEXT LIMIT</label>
              <input
                type="number"
                min="1"
                max="10"
                value={settings.contextLimit}
                onChange={(e) => handleSettingChange('contextLimit', Math.max(1, parseInt(e.target.value) || 4))}
                style={{
                  width: '100%',
                  padding: '6px',
                  borderRadius: 'var(--border-radius-sm)',
                  backgroundColor: 'hsl(var(--bg-primary))',
                  border: '1px solid hsl(var(--border-color))',
                  fontSize: '0.8rem'
                }}
              />
            </div>
          </div>

          {/* Database Control Section */}
          <div style={{ marginTop: '6px', paddingTop: '12px', borderTop: '1px dashed hsl(var(--border-color))' }}>
            <button
              onClick={onClearBrowserHistory}
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: 'var(--border-radius-sm)',
                backgroundColor: 'hsl(var(--border-color))',
                border: '1px solid hsl(var(--border-color))',
                color: 'hsl(var(--text-secondary))',
                fontSize: '0.75rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                cursor: 'pointer',
                transition: 'var(--transition-smooth)',
                marginBottom: '8px'
              }}
            >
              <Trash2 size={12} />
              Clear Browser History
            </button>
            <button
              onClick={handleResetClick}
              disabled={dbResetting}
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: 'var(--border-radius-sm)',
                backgroundColor: confirmReset ? 'hsl(var(--error) / 0.15)' : 'hsl(var(--border-color))',
                border: '1px solid',
                borderColor: confirmReset ? 'hsl(var(--error) / 0.4)' : 'hsl(var(--border-color))',
                color: confirmReset ? 'hsl(var(--error))' : 'hsl(var(--text-secondary))',
                fontSize: '0.75rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                cursor: 'pointer',
                transition: 'var(--transition-smooth)'
              }}
            >
              {dbResetting ? (
                <RefreshCw size={12} className="spin" />
              ) : (
                <Database size={12} />
              )}
              {dbResetting ? 'Resetting Index...' : confirmReset ? 'Confirm Full Reset' : 'Clear Vector DB'}
            </button>
          </div>
        </div>
      )}

      {/* Styled Inline Styles for sidebar elements */}
      <style dangerouslySetInnerHTML={{__html: `
        .thread-item:hover .delete-thread-btn {
          opacity: 1 !important;
        }
        .hover-danger:hover {
          color: hsl(var(--error)) !important;
        }
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}} />
    </aside>
  );
}
