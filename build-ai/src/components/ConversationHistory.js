'use client';

import { useState, useEffect } from 'react';
import { MessageSquare, Clock, User, Bot, ChevronDown, ChevronRight, Trash2 } from 'lucide-react';

export default function ConversationHistory({ chatbotId }) {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedConversation, setExpandedConversation] = useState(null);
  const [selectedConversation, setSelectedConversation] = useState(null);

  useEffect(() => {
    fetchConversations();
  }, [chatbotId]);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/chatbots/${chatbotId}/conversations`);

      if (!response.ok) {
        throw new Error('Failed to fetch conversations');
      }

      const data = await response.json();
      setConversations(data.conversations || []);
    } catch (err) {
      console.error('Error fetching conversations:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConversation = async (conversationId, e) => {
    e.stopPropagation();

    if (!confirm('Are you sure you want to delete this conversation?')) {
      return;
    }

    try {
      const response = await fetch(`/api/chatbots/${chatbotId}/conversations/${conversationId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete conversation');
      }

      // Remove from state
      setConversations(prev => prev.filter(c => c._id !== conversationId));

      if (selectedConversation?._id === conversationId) {
        setSelectedConversation(null);
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
      alert(`Failed to delete conversation: ${error.message}`);
    }
  };

  const toggleExpand = (conversationId) => {
    if (expandedConversation === conversationId) {
      setExpandedConversation(null);
    } else {
      setExpandedConversation(conversationId);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (start, end) => {
    const duration = new Date(end) - new Date(start);
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);

    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm text-muted-foreground">Loading conversations...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p className="text-red-800">Error: {error}</p>
        <button onClick={fetchConversations} className="btn-primary mt-3 text-sm">
          Try Again
        </button>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="text-center py-12">
        <MessageSquare className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
        <h3 className="text-lg font-medium mb-2">No conversations yet</h3>
        <p className="text-muted-foreground text-sm">
          Conversations will appear here when users start chatting with your bot
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold">Conversation History</h3>
          <p className="text-sm text-muted-foreground">{conversations.length} total conversations</p>
        </div>
        <button onClick={fetchConversations} className="btn-secondary text-sm">
          Refresh
        </button>
      </div>

      <div className="space-y-3">
        {conversations.map((conversation) => (
          <div
            key={conversation._id}
            className="border border-border rounded-lg overflow-hidden hover:shadow-md transition-shadow"
          >
            {/* Conversation Header */}
            <div
              className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => toggleExpand(conversation._id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {expandedConversation === conversation._id ? (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    )}
                    <MessageSquare className="w-4 h-4 text-primary" />
                    <span className="font-medium">
                      {conversation.messages[0]?.content?.substring(0, 60) || 'Conversation'}
                      {conversation.messages[0]?.content?.length > 60 && '...'}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground ml-6">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{formatDate(conversation.startedAt)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" />
                      <span>{conversation.messages.length} messages</span>
                    </div>
                    <span>
                      Duration: {formatDuration(conversation.startedAt, conversation.lastMessageAt)}
                    </span>
                  </div>
                </div>

                <button
                  onClick={(e) => handleDeleteConversation(conversation._id, e)}
                  className="p-2 text-muted-foreground hover:text-error hover:bg-red-50 rounded transition-colors"
                  title="Delete conversation"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Expanded Messages */}
            {expandedConversation === conversation._id && (
              <div className="border-t border-border bg-muted/20 p-4">
                <div className="space-y-3">
                  {conversation.messages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${
                          message.role === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-background border border-border'
                        }`}
                      >
                        <div className="flex items-start gap-2 mb-1">
                          {message.role === 'user' ? (
                            <User className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          ) : (
                            <Bot className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          )}
                          <div className="flex-1">
                            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-xs opacity-70 mt-2">
                          <span>{new Date(message.timestamp).toLocaleTimeString()}</span>
                          {message.sources && message.sources.length > 0 && (
                            <span className="ml-2">{message.sources.length} sources</span>
                          )}
                        </div>

                        {/* Metadata for assistant messages */}
                        {message.metadata && (
                          <div className="mt-2 pt-2 border-t border-border/50 text-xs space-y-1">
                            {message.metadata.model && (
                              <div><strong>Model:</strong> {message.metadata.model}</div>
                            )}
                            {message.metadata.qualityScore && (
                              <div>
                                <strong>Quality:</strong> {(message.metadata.qualityScore * 100).toFixed(1)}%
                              </div>
                            )}
                            {message.metadata.confidence && (
                              <div><strong>Confidence:</strong> {message.metadata.confidence}</div>
                            )}
                            {message.metadata.processingTime && (
                              <div><strong>Response Time:</strong> {message.metadata.processingTime}ms</div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
