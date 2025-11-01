'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from "next/link";
import { Bot, FileText, Plus, Sparkles, Upload, Trash2 } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const [chatbots, setChatbots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchChatbots();
  }, []);

  const fetchChatbots = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/chatbots');

      if (!response.ok) {
        throw new Error('Failed to fetch chatbots');
      }

      const data = await response.json();
      setChatbots(data.chatbots || []);
    } catch (err) {
      console.error('Error fetching chatbots:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleDeleteChatbot = async (chatbotId, chatbotName) => {
    if (!confirm(`Are you sure you want to delete "${chatbotName}"?\n\nThis will permanently delete:\n• The chatbot\n• All uploaded documents\n• All generated chunks and embeddings\n\nThis action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/chatbots/${chatbotId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete chatbot');
      }

      const data = await response.json();
      console.log(`✅ Deleted chatbot "${chatbotName}":`);
      console.log(`   - Documents: ${data.deletedCounts?.documents || 0}`);
      console.log(`   - Chunks: ${data.deletedCounts?.chunks || 0}`);

      // Remove chatbot from state
      setChatbots(prev => prev.filter(bot => bot._id !== chatbotId));

      // Show success message
      alert(`Successfully deleted "${chatbotName}" and all associated data.`);

    } catch (error) {
      console.error('Error deleting chatbot:', error);
      alert(`Failed to delete chatbot: ${error.message}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <main className="container py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading your chatbots...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <main className="container py-8">
          <div className="card p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">⚠️</span>
            </div>
            <h3 className="text-lg font-medium mb-2">Error loading chatbots</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <button onClick={fetchChatbots} className="btn-primary">
              Try Again
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Main Content */}
      <main className="container py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Your Chatbots</h1>
            <p className="text-muted-foreground">
              Manage and monitor your RAG-powered chatbots
            </p>
          </div>
          <Link href="/dashboard/new" className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Create Chatbot
          </Link>
        </div>

        {chatbots.length === 0 ? (
          /* Empty State */
          <div className="card">
            <div className="p-12 text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Bot className="w-12 h-12 text-purple-600" />
              </div>
              <h2 className="text-2xl font-bold mb-3">No chatbots yet</h2>
              <p className="text-muted-foreground mb-2 max-w-md mx-auto">
                Get started by creating your first AI chatbot. Upload PDFs, train with your data, and embed anywhere.
              </p>
              <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                It only takes a few minutes to set up!
              </p>

              <Link href="/dashboard/new" className="btn-primary inline-flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Create Your First Chatbot
              </Link>

              <div className="mt-12 pt-8 border-t border-border">
                <p className="text-sm font-medium text-muted-foreground mb-4">Quick Start Guide</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                      <Plus className="w-6 h-6 text-primary" />
                    </div>
                    <h4 className="font-medium text-sm mb-1">1. Create Chatbot</h4>
                    <p className="text-xs text-muted-foreground">Give it a name and description</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                      <Upload className="w-6 h-6 text-primary" />
                    </div>
                    <h4 className="font-medium text-sm mb-1">2. Upload Documents</h4>
                    <p className="text-xs text-muted-foreground">Add PDFs to train your bot</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                      <Sparkles className="w-6 h-6 text-primary" />
                    </div>
                    <h4 className="font-medium text-sm mb-1">3. Start Chatting</h4>
                    <p className="text-xs text-muted-foreground">Test and embed your chatbot</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="card p-6">
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Total Chatbots</h3>
                <p className="text-3xl font-bold">{chatbots.length}</p>
              </div>
              <div className="card p-6">
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Documents Uploaded</h3>
                <p className="text-3xl font-bold text-primary">
                  {chatbots.reduce((sum, bot) => sum + (bot.documentCount || 0), 0)}
                </p>
              </div>
              <div className="card p-6">
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Total Chunks</h3>
                <p className="text-3xl font-bold text-success">
                  {chatbots.reduce((sum, bot) => sum + (bot.chunkCount || 0), 0)}
                </p>
              </div>
            </div>

            {/* Chatbots List */}
            <div className="card">
              <div className="p-6 border-b border-border flex items-center justify-between">
                <h2 className="text-xl font-semibold">All Chatbots</h2>
                <span className="text-sm text-muted-foreground">{chatbots.length} total</span>
              </div>
              <div className="divide-y divide-border">
                {chatbots.map((chatbot) => (
                  <div key={chatbot._id} className="p-6 hover:bg-muted/50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Bot className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h3 className="text-lg font-medium">{chatbot.name}</h3>
                            <p className="text-xs text-muted-foreground">
                              Created {formatDate(chatbot.createdAt)}
                            </p>
                          </div>
                        </div>
                        <p className="text-muted-foreground mb-3 ml-13">
                          {chatbot.description || 'No description provided'}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground ml-13">
                          <div className="flex items-center gap-1">
                            <FileText className="w-4 h-4" />
                            <span>{chatbot.documentCount || 0} documents</span>
                          </div>
                          {chatbot.isPublic && (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-success/10 text-success">
                              Public
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Link
                          href={`/dashboard/${chatbot._id}`}
                          className="btn-secondary text-sm"
                        >
                          Manage
                        </Link>
                        <Link
                          href={`/chat/${chatbot._id}`}
                          className="btn-primary text-sm"
                        >
                          Test
                        </Link>
                        <button
                          onClick={() => handleDeleteChatbot(chatbot._id, chatbot.name)}
                          className="p-2 text-muted-foreground hover:text-error hover:bg-red-50 rounded transition-colors"
                          title="Delete chatbot"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}