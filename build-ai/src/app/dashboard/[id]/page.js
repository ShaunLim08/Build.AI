'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Bot, FileText, Plus, Trash2, Settings, ArrowLeft, Loader2, Globe, Database } from 'lucide-react';
import FileUploader from '@/components/FileUploader';
import WebScraper from '@/components/WebScraper';
import MongoDBConnector from '@/components/MongoDBConnector';

export default function ChatbotDetailPage({ params }) {
  const router = useRouter();
  const [chatbotId, setChatbotId] = useState(null);
  const [chatbot, setChatbot] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('documents');

  useEffect(() => {
    params.then(resolvedParams => {
      setChatbotId(resolvedParams.id);
      fetchChatbotData(resolvedParams.id);
    });
  }, []);

  const fetchChatbotData = async (id) => {
    try {
      setLoading(true);

      // Fetch chatbot details
      const chatbotResponse = await fetch(`/api/chatbots/${id}`);
      if (!chatbotResponse.ok) {
        throw new Error('Failed to fetch chatbot');
      }
      const chatbotData = await chatbotResponse.json();
      setChatbot(chatbotData.chatbot);

      // Fetch documents
      const docsResponse = await fetch(`/api/chatbots/${id}/documents`);
      if (!docsResponse.ok) {
        throw new Error('Failed to fetch documents');
      }
      const docsData = await docsResponse.json();
      setDocuments(docsData.documents || []);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadComplete = (document) => {
    setDocuments(prev => [document, ...prev]);
    // Refresh to get updated counts
    if (chatbotId) {
      fetchChatbotData(chatbotId);
    }
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'N/A';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  const handleDeleteDocument = async (documentId, filename) => {
    if (!confirm(`Are you sure you want to delete "${filename}"? This will also delete all associated chunks and embeddings.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/chatbots/${chatbotId}/documents/${documentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete document');
      }

      const data = await response.json();
      console.log(`✅ Deleted document and ${data.deletedChunks} chunks`);

      // Remove document from state
      setDocuments(prev => prev.filter(doc => doc._id !== documentId));

      // Show success message (you could add a toast notification here)
      alert(`Successfully deleted "${filename}" and ${data.deletedChunks} chunks`);

    } catch (error) {
      console.error('Error deleting document:', error);
      alert(`Failed to delete document: ${error.message}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <main className="container py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Loading chatbot...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error || !chatbot) {
    return (
      <div className="min-h-screen bg-background">
        <main className="container py-8">
          <div className="card p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">⚠️</span>
            </div>
            <h3 className="text-lg font-medium mb-2">Error loading chatbot</h3>
            <p className="text-muted-foreground mb-4">{error || 'Chatbot not found'}</p>
            <Link href="/dashboard" className="btn-primary">
              Back to Dashboard
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>

          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <Bot className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold mb-2">{chatbot.name}</h1>
                <p className="text-muted-foreground mb-3">
                  {chatbot.description || 'No description provided'}
                </p>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>Created {formatDate(chatbot.createdAt)}</span>
                  {chatbot.isPublic && (
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-success/10 text-success">
                      Public
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href={`/chat/${chatbot._id}`}
                className="btn-primary flex items-center gap-2"
              >
                Test Chatbot
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card p-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-1">Total Documents</h3>
            <p className="text-3xl font-bold">{documents.length}</p>
          </div>
          <div className="card p-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-1">Total Pages</h3>
            <p className="text-3xl font-bold text-primary">
              {documents.reduce((sum, doc) => sum + (doc.pageCount || 0), 0)}
            </p>
          </div>
          <div className="card p-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-1">Total Words</h3>
            <p className="text-3xl font-bold text-success">
              {documents.reduce((sum, doc) => sum + (doc.wordCount || 0), 0).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="card">
          <div className="border-b border-border">
            <div className="flex gap-8 px-6">
              <button
                onClick={() => setActiveTab('documents')}
                className={`py-4 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'documents'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                Documents ({documents.length})
              </button>
              <button
                onClick={() => setActiveTab('upload')}
                className={`py-4 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'upload'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                Upload Files
              </button>
              <button
                onClick={() => setActiveTab('scrape')}
                className={`py-4 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'scrape'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                Scrape Websites
              </button>
              <button
                onClick={() => setActiveTab('mongodb')}
                className={`py-4 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'mongodb'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                MongoDB Import
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`py-4 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'settings'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                Settings
              </button>
            </div>
          </div>

          <div className="p-6">
            {activeTab === 'documents' && (
              <div>
                {documents.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No documents yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Upload PDFs or TXT files to train your chatbot
                    </p>
                    <button
                      onClick={() => setActiveTab('upload')}
                      className="btn-primary inline-flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Upload First Document
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {documents.map((doc) => (
                      <div
                        key={doc._id}
                        className="border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3 flex-1">
                            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                              <FileText className="w-5 h-5 text-primary" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium mb-1">{doc.filename}</h4>
                              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                                <span>{doc.pageCount || 0} pages</span>
                                <span>•</span>
                                <span>{(doc.wordCount || 0).toLocaleString()} words</span>
                                <span>•</span>
                                <span>{doc.chunkCount || 0} chunks</span>
                                <span>•</span>
                                <span>Uploaded {formatDate(doc.uploadedAt)}</span>
                              </div>
                              <div className="mt-2">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  doc.status === 'processed'
                                    ? 'bg-success/10 text-success'
                                    : doc.status === 'processing'
                                    ? 'bg-warning/10 text-warning'
                                    : 'bg-error/10 text-error'
                                }`}>
                                  {doc.status}
                                </span>
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => handleDeleteDocument(doc._id, doc.filename)}
                            className="text-muted-foreground hover:text-error transition-colors"
                            title="Delete document"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'upload' && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Upload New Document</h3>
                <FileUploader
                  chatbotId={chatbot._id}
                  onUploadComplete={handleUploadComplete}
                />
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                  <p className="text-xs text-blue-700">
                    <strong>Tip:</strong> Uploaded documents are automatically processed and chunked for RAG retrieval.
                    You can upload multiple documents to expand your chatbot's knowledge base.
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'scrape' && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Scrape Website Content</h3>
                <WebScraper
                  chatbotId={chatbot._id}
                  onScrapeComplete={handleUploadComplete}
                />
              </div>
            )}

            {activeTab === 'mongodb' && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Import from MongoDB</h3>
                <MongoDBConnector
                  chatbotId={chatbot._id}
                  onImportComplete={handleUploadComplete}
                />
              </div>
            )}

            {activeTab === 'settings' && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Chatbot Settings</h3>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Name</label>
                    <input
                      type="text"
                      value={chatbot.name}
                      disabled
                      className="input opacity-60 cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Description</label>
                    <textarea
                      value={chatbot.description || ''}
                      disabled
                      rows={3}
                      className="input resize-none opacity-60 cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">System Instruction</label>
                    <textarea
                      value={chatbot.systemInstruction || ''}
                      disabled
                      rows={4}
                      className="input resize-none opacity-60 cursor-not-allowed"
                    />
                  </div>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-xs text-yellow-700">
                      Settings editing will be available in a future update. For now, settings are read-only.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
