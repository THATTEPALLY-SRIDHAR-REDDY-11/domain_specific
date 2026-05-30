import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import DocumentManager from './components/DocumentManager';
import ChatWindow from './components/ChatWindow';
import EvaluationDashboard from './components/EvaluationDashboard';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';

export default function App() {
  const [threads, setThreads] = useState(() => {
    const saved = localStorage.getItem('rag_threads');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [activeThreadId, setActiveThreadId] = useState(() => {
    const saved = localStorage.getItem('rag_active_thread_id');
    return saved || null;
  });

  const [documents, setDocuments] = useState([]);
  const [selectedFilters, setSelectedFilters] = useState([]); // List of file names to query
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [dbResetting, setDbResetting] = useState(false);

  // Evaluation state
  const [evaluation, setEvaluation] = useState(null);
  const [evaluating, setEvaluating] = useState(false);

  // Settings state
  const [settings, setSettings] = useState({
    model: 'llama-3.1-8b-instant',
    temperature: 0,
    retrieveLimit: 10,
    contextLimit: 4,
    rerankMethod: 'local'
  });

  // Active streaming states
  const [loading, setLoading] = useState(false);
  const [streamingResponse, setStreamingResponse] = useState('');
  const [streamingCitations, setStreamingCitations] = useState([]);
  const [streamingOptimizedQuery, setStreamingOptimizedQuery] = useState('');
  const [cragEvents, setCragEvents] = useState([]);

  // Fetch indexed documents on startup
  useEffect(() => {
    fetchDocuments();
  }, []);

  // Run evaluation automatically when documents are loaded or updated
  useEffect(() => {
    if (documents.length > 0) {
      handleRunEvaluation();
    } else {
      setEvaluation(null);
    }
  }, [documents]);

  // Save threads to localStorage on change
  useEffect(() => {
    localStorage.setItem('rag_threads', JSON.stringify(threads));
    if (activeThreadId) {
      localStorage.setItem('rag_active_thread_id', activeThreadId);
    } else {
      localStorage.removeItem('rag_active_thread_id');
    }
  }, [threads, activeThreadId]);

  // Ensure there is at least one active thread if none exists
  useEffect(() => {
    if (threads.length === 0) {
      handleNewThread();
    } else if (!activeThreadId) {
      setActiveThreadId(threads[0].id);
    }
  }, [threads, activeThreadId]);

  const fetchDocuments = async () => {
    setLoadingDocs(true);
    try {
      const response = await fetch(`${API_BASE}/documents`);
      const data = await response.json();
      if (data.success) {
        setDocuments(data.documents || []);
      }
    } catch (error) {
      console.error('Failed to fetch indexed documents:', error);
    } finally {
      setLoadingDocs(false);
    }
  };

  const handleNewThread = () => {
    const newThread = {
      id: `thread_${Date.now()}`,
      title: 'New Conversation',
      messages: []
    };
    setThreads(prev => [newThread, ...prev]);
    setActiveThreadId(newThread.id);
  };

  const handleDeleteThread = (threadId) => {
    setThreads(prev => prev.filter(t => t.id !== threadId));
    if (activeThreadId === threadId) {
      setActiveThreadId(null);
    }
  };

  const handleSendMessage = async (text) => {
    const activeThread = threads.find(t => t.id === activeThreadId);
    if (!activeThread) return;

    // 1. Append User Message
    const userMsg = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: text
    };

    const updatedMessages = [...activeThread.messages, userMsg];
    
    // Update thread title if it was default
    const isNewTitle = activeThread.title === 'New Conversation';
    const updatedTitle = isNewTitle ? (text.substring(0, 30) + (text.length > 30 ? '...' : '')) : activeThread.title;

    setThreads(prev => prev.map(t => {
      if (t.id === activeThreadId) {
        return {
          ...t,
          title: updatedTitle,
          messages: updatedMessages
        };
      }
      return t;
    }));

    // 2. Set loading and prepare streaming
    setLoading(true);
    setStreamingResponse('');
    setStreamingCitations([]);
    setStreamingOptimizedQuery('');
    setCragEvents([]);

    try {
      // Setup metadata filter object: e.g. { source: { "$in": ['a.txt', 'b.txt'] } }
      // If we only have 1 item, we can use { source: 'a.txt' }
      const whereFilter = {};
      if (selectedFilters.length > 0) {
        if (selectedFilters.length === 1) {
          whereFilter.source = selectedFilters[0];
        } else {
          whereFilter.source = { "$in": selectedFilters };
        }
      }

      // Start fetching the stream
      const response = await fetch(`${API_BASE}/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: text,
          history: activeThread.messages.map(m => ({ role: m.role, content: m.content })),
          filters: whereFilter,
          settings: settings
        })
      });

      if (!response.ok) {
        let errorDetail = response.statusText || 'Unknown backend error';
        try {
          const errorBody = await response.clone().json();
          errorDetail = errorBody.error || errorBody.message || JSON.stringify(errorBody);
        } catch {
          const errorText = await response.text().catch(() => '');
          if (errorText) errorDetail = errorText;
        }

        throw new Error(`Server returned ${response.status}: ${errorDetail}`);
      }

      // Read SSE stream
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let activeCitations = [];
      let activeQuery = '';
      let activeText = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop(); // Hold remaining partial line

        for (const line of lines) {
          const cleanLine = line.trim();
          if (!cleanLine.startsWith('data: ')) continue;

          const rawData = cleanLine.substring(6);
          try {
            const parsed = JSON.parse(rawData);

            if (parsed.type === 'query_rewritten') {
              activeQuery = parsed.query;
              setStreamingOptimizedQuery(parsed.query);
              setCragEvents(prev => [...prev, { type: 'query_rewritten', data: parsed }]);
            } else if (parsed.type === 'retrieval') {
              activeCitations = parsed.chunks;
              setStreamingCitations(parsed.chunks);
              setCragEvents(prev => [...prev, { type: 'retrieval', data: parsed }]);
            } else if (parsed.type === 'draft_answer') {
              setCragEvents(prev => [...prev, { type: 'draft_answer', data: parsed }]);
            } else if (parsed.type === 'verification') {
              setCragEvents(prev => [...prev, { type: 'verification', data: parsed }]);
            } else if (parsed.type === 'token') {
              activeText += parsed.token;
              setStreamingResponse(activeText);
            } else if (parsed.type === 'done') {
              // Append final assistant message to active thread
              const assistantMsg = {
                id: `msg_assistant_${Date.now()}`,
                role: 'assistant',
                content: parsed.completeText || activeText,
                citations: activeCitations,
                optimizedQuery: activeQuery
              };

              setThreads(prev => prev.map(t => {
                if (t.id === activeThreadId) {
                  return {
                    ...t,
                    messages: [...updatedMessages, assistantMsg]
                  };
                }
                return t;
              }));

              // Clear streaming states
              setStreamingResponse('');
              setStreamingCitations([]);
              setStreamingOptimizedQuery('');
            } else if (parsed.type === 'error') {
              throw new Error(parsed.error);
            }
          } catch (e) {
            console.error('Error parsing streaming line:', rawData, e);
          }
        }
      }
    } catch (err) {
      console.error('Streaming RAG generation failed:', err);
      // Append error message to history
      const errMsgLower = err.message.toLowerCase();
      const isConnectionError = 
        errMsgLower.includes('fetch') || 
        errMsgLower.includes('network') || 
        errMsgLower.includes('failed') || 
        errMsgLower.includes('connect');
      
      const contentText = isConnectionError
        ? `⚠️ **RAG Ingestion or Model Error:** ${err.message}. Please verify your backend server connection, ChromaDB port 8000 state, and Groq API key configuration.`
        : `⚠️ **RAG Ingestion or Model Error:** ${err.message}`;

      const errorMsg = {
        id: `msg_err_${Date.now()}`,
        role: 'assistant',
        content: contentText
      };
      setThreads(prev => prev.map(t => {
        if (t.id === activeThreadId) {
          return {
            ...t,
            messages: [...updatedMessages, errorMsg]
          };
        }
        return t;
      }));
    } finally {
      setLoading(false);
    }
  };

  const handleUploadFile = async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE}/documents/upload`, {
      method: 'POST',
      body: formData
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Failed to upload and index document.');
    }

    await fetchDocuments();
  };

  const handleDeleteDocument = async (fileName) => {
    try {
      const response = await fetch(`${API_BASE}/documents/${fileName}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      if (data.success) {
        // Clear deletion from metadata filter if it was selected
        setSelectedFilters(prev => prev.filter(f => f !== fileName));
        await fetchDocuments();
      }
    } catch (error) {
      console.error('Failed to delete document:', error);
    }
  };

  const handleResetDatabase = async () => {
    setDbResetting(true);
    try {
      const response = await fetch(`${API_BASE}/documents/reset`, {
        method: 'POST'
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setSelectedFilters([]);
        await fetchDocuments();
      } else {
        throw new Error(data.error || 'Reset failed');
      }
    } catch (error) {
      console.error('Failed to reset vector database:', error);
      alert(`Wipe database failed: ${error.message}`);
    } finally {
      setDbResetting(false);
    }
  };

  const handleClearBrowserHistory = () => {
    if (window.confirm('Are you sure you want to clear all chat history from your browser?')) {
      localStorage.removeItem('rag_threads');
      localStorage.removeItem('rag_active_thread_id');
      setThreads([]);
      setActiveThreadId(null);
      alert('Chat history cleared! Now start a new conversation!');
    }
  };

  const handleRunEvaluation = async () => {
    setEvaluating(true);
    try {
      const response = await fetch(`${API_BASE}/evaluate`);
      const data = await response.json();
      if (data.success) {
        setEvaluation(data);
      } else {
        console.error('Evaluation failed');
      }
    } catch (error) {
      console.error('Error running evaluation:', error);
    } finally {
      setEvaluating(false);
    }
  };

  const activeThread = threads.find(t => t.id === activeThreadId) || { title: 'New Conversation', messages: [] };

  return (
    <div className="app-container">
      {/* Sidebar - left */}
      <Sidebar
        threads={threads}
        activeThreadId={activeThreadId}
        setActiveThreadId={setActiveThreadId}
        onNewThread={handleNewThread}
        onDeleteThread={handleDeleteThread}
        settings={settings}
        setSettings={setSettings}
        onResetDatabase={handleResetDatabase}
        dbResetting={dbResetting}
        onClearBrowserHistory={handleClearBrowserHistory}
      />

      {/* Main Chat Window - center */}
      <ChatWindow
        messages={activeThread.messages}
        activeThreadTitle={activeThread.title}
        onSendMessage={handleSendMessage}
        streamingResponse={streamingResponse}
        streamingCitations={streamingCitations}
        streamingOptimizedQuery={streamingOptimizedQuery}
        loading={loading}
        selectedFilters={selectedFilters}
        cragEvents={cragEvents}
      />

      {/* Document Manager Dashboard - right */}
      <DocumentManager
        documents={documents}
        onUploadFile={handleUploadFile}
        onDeleteDocument={handleDeleteDocument}
        selectedFilters={selectedFilters}
        setSelectedFilters={setSelectedFilters}
        loadingDocs={loadingDocs}
      />

      {/* Evaluation Dashboard */}
      <EvaluationDashboard 
        evaluation={evaluation}
        running={evaluating}
      />
    </div>
  );
}
