import { useState, useRef } from 'react';
import { 
  FileText, 
  Upload, 
  Trash2, 
  Filter, 
  CheckSquare, 
  Square,
  AlertCircle,
  FileMinus,
  Loader
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function DocumentManager({
  documents,
  onUploadFile,
  onDeleteDocument,
  selectedFilters,
  setSelectedFilters,
  loadingDocs
}) {
  const [dragActive, setDragActive] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processFile = async (file) => {
    const allowedExtensions = ['txt', 'md', 'json', 'pdf'];
    const fileExt = file.name.split('.').pop().toLowerCase();
    
    if (!allowedExtensions.includes(fileExt)) {
      setUploadError(`Unsupported file extension: .${fileExt}. Please use .txt, .md, .json, or .pdf.`);
      return;
    }

    setUploadError(null);
    setUploadingFile(true);

    try {
      await onUploadFile(file);
      
      // Trigger success confetti!
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#a855f7', '#06b6d4', '#10b981']
      });

    } catch (err) {
      setUploadError(err.message || 'Failed to upload and index document.');
    } finally {
      setUploadingFile(false);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = async (e) => {
    if (e.target.files && e.target.files[0]) {
      await processFile(e.target.files[0]);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current.click();
  };

  const toggleFilter = (fileName) => {
    setSelectedFilters(prev => {
      if (prev.includes(fileName)) {
        return prev.filter(f => f !== fileName);
      } else {
        return [...prev, fileName];
      }
    });
  };

  const selectAllFilters = () => {
    if (selectedFilters.length === documents.length) {
      setSelectedFilters([]); // Clear all
    } else {
      setSelectedFilters(documents.map(d => d.fileName)); // Select all
    }
  };

  const formatSize = (chars) => {
    if (!chars) return '0 chars';
    if (chars > 1000) return `${(chars / 1000).toFixed(1)}k chars`;
    return `${chars} chars`;
  };

  return (
    <div className="doc-manager glass-panel animate-fade-in-up" style={{
      width: '320px',
      height: '100vh',
      borderLeft: '1px solid hsl(var(--border-color))',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 10
    }}>
      {/* Panel Header */}
      <div style={{
        padding: '24px 20px',
        borderBottom: '1px solid hsl(var(--border-color))',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileText size={18} color="hsl(var(--primary-hover))" />
          <h2 style={{ fontSize: '1.05rem', fontWeight: 700, fontFamily: 'Outfit' }}>Document Index</h2>
        </div>
        <span style={{
          fontSize: '0.75rem',
          backgroundColor: 'hsl(var(--primary) / 0.15)',
          color: 'hsl(var(--primary-hover))',
          padding: '2px 8px',
          borderRadius: '20px',
          fontWeight: 700
        }}>{documents.length} Files</span>
      </div>

      {/* Drag and Drop Uploader */}
      <div style={{ padding: '16px 20px' }}>
        <div 
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={triggerFileSelect}
          style={{
            border: dragActive ? '2px dashed hsl(var(--secondary))' : '1px dashed hsl(var(--border-color))',
            borderRadius: 'var(--border-radius-lg)',
            padding: '20px 16px',
            textAlign: 'center',
            cursor: uploadingFile ? 'not-allowed' : 'pointer',
            backgroundColor: dragActive ? 'hsl(var(--secondary) / 0.05)' : 'hsl(var(--bg-secondary) / 0.2)',
            transition: 'var(--transition-smooth)',
            position: 'relative'
          }}
          className="upload-dropzone"
        >
          <input 
            ref={fileInputRef}
            type="file"
            onChange={handleFileInput}
            style={{ display: 'none' }}
            accept=".txt,.md,.json,.pdf"
            disabled={uploadingFile}
          />
          
          {uploadingFile ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <Loader className="spin" size={24} color="hsl(var(--secondary))" />
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'hsl(var(--secondary))' }}>Chunking & Indexing...</span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <Upload size={24} color="hsl(var(--text-muted))" />
              <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Drag & Drop or Click</span>
              <span style={{ fontSize: '0.65rem', color: 'hsl(var(--text-muted))' }}>PDF, Markdown, Text, JSON</span>
            </div>
          )}
        </div>

        {uploadError && (
          <div style={{
            marginTop: '8px',
            padding: '8px 12px',
            borderRadius: 'var(--border-radius-sm)',
            backgroundColor: 'hsl(var(--error) / 0.15)',
            border: '1px solid hsl(var(--error) / 0.3)',
            color: 'hsl(var(--error))',
            fontSize: '0.75rem',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <AlertCircle size={14} style={{ flexShrink: 0 }} />
            <span>{uploadError}</span>
          </div>
        )}
      </div>

      {/* Metadata Search Filtering Control */}
      <div style={{
        padding: '0 20px 10px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '0.75rem',
        color: 'hsl(var(--text-muted))'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700 }}>
          <Filter size={12} />
          <span>QUERY METADATA SCOPE</span>
        </div>
        {documents.length > 0 && (
          <button
            onClick={selectAllFilters}
            style={{
              background: 'none',
              border: 'none',
              color: 'hsl(var(--secondary))',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            {selectedFilters.length === documents.length ? 'Clear Scope' : 'Select All'}
          </button>
        )}
      </div>

      {/* Documents List */}
      <div className="doc-list-section" style={{
        flex: 1,
        overflowY: 'auto',
        padding: '0 16px 16px 16px'
      }}>
        {loadingDocs ? (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100px'
          }}>
            <Loader className="spin" size={20} color="hsl(var(--primary))" />
          </div>
        ) : documents.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '40px 16px',
            color: 'hsl(var(--text-muted))',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px'
          }}>
            <FileMinus size={36} style={{ strokeWidth: 1 }} />
            <div>
              <span style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600 }}>Empty Index</span>
              <span style={{ display: 'block', fontSize: '0.7rem', marginTop: '4px' }}>Add documents or PDFs to build your chatbot's knowledge base.</span>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {documents.map((doc) => {
              const isSelected = selectedFilters.includes(doc.fileName);
              return (
                <div
                  key={doc.fileName}
                  style={{
                    padding: '12px',
                    borderRadius: 'var(--border-radius-md)',
                    backgroundColor: 'hsl(var(--bg-secondary) / 0.5)',
                    border: '1px solid',
                    borderColor: isSelected ? 'hsl(var(--secondary) / 0.3)' : 'hsl(var(--border-color))',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    position: 'relative',
                    transition: 'var(--transition-smooth)'
                  }}
                  className="doc-card"
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', paddingRight: '22px' }}>
                    {/* Checkbox toggle for filter scope */}
                    <button
                      onClick={() => toggleFilter(doc.fileName)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: isSelected ? 'hsl(var(--secondary))' : 'hsl(var(--text-muted))',
                        cursor: 'pointer',
                        padding: 0,
                        marginTop: '2px',
                        flexShrink: 0
                      }}
                    >
                      {isSelected ? <CheckSquare size={16} /> : <Square size={16} />}
                    </button>
                    
                    <div style={{ overflow: 'hidden' }}>
                      <span style={{
                        display: 'block',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        color: isSelected ? 'hsl(var(--text-primary))' : 'hsl(var(--text-secondary))'
                      }} title={doc.fileName}>{doc.fileName}</span>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', fontSize: '0.65rem', color: 'hsl(var(--text-muted))' }}>
                        <span>{doc.fileType.toUpperCase()}</span>
                        <span>•</span>
                        <span>{doc.chunkCount} Chunks</span>
                        <span>•</span>
                        <span>{formatSize(doc.totalChars)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Deletion Button */}
                  <button
                    onClick={() => onDeleteDocument(doc.fileName)}
                    style={{
                      position: 'absolute',
                      top: '10px',
                      right: '10px',
                      background: 'none',
                      border: 'none',
                      color: 'hsl(var(--text-muted))',
                      cursor: 'pointer',
                      opacity: 0,
                      transition: 'var(--transition-smooth)'
                    }}
                    className="delete-doc-btn"
                  >
                    <Trash2 size={13} className="hover-danger" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .doc-card:hover .delete-doc-btn {
          opacity: 1 !important;
        }
        .upload-dropzone:hover {
          border-color: hsl(var(--primary)) !important;
          background-color: hsl(var(--primary) / 0.03) !important;
        }
      `}} />
    </div>
  );
}
