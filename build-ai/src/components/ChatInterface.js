'use client';

import { useState, useRef, useEffect } from 'react';

/**
 * ChatInterface Component
 *
 * A complete chat interface for testing the RAG pipeline
 *
 * Usage:
 * <ChatInterface chatbotId="your-chatbot-id" />
 */
export default function ChatInterface({ chatbotId, chatbotName = 'AI Assistant' }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showMetadata, setShowMetadata] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setError(null);

    // Add user message to chat
    const newMessage = {
      role: 'user',
      content: userMessage,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, newMessage]);
    setLoading(true);

    try {
      // Build conversation history (last 5 messages)
      const history = messages.slice(-10).map(msg => ({
        role: msg.role,
        content: msg.content,
      }));

      const response = await fetch(`/api/chatbots/${chatbotId}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          conversationHistory: history,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get response');
      }

      const data = await response.json();

      // Add assistant message to chat
      const assistantMessage = {
        role: 'assistant',
        content: data.response,
        timestamp: new Date().toISOString(),
        metadata: data.metadata,
      };

      setMessages(prev => [...prev, assistantMessage]);

    } catch (error) {
      console.error('Error sending message:', error);
      setError(error.message);

      // Add error message
      const errorMessage = {
        role: 'error',
        content: `Error: ${error.message}`,
        timestamp: new Date().toISOString(),
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
    setError(null);
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <div className="flex flex-col h-full max-h-[800px] border rounded-lg shadow-lg bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <div>
          <h2 className="text-xl font-semibold">{chatbotName}</h2>
          <p className="text-sm text-blue-100">RAG-powered chatbot</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowMetadata(!showMetadata)}
            className="px-3 py-1 text-sm bg-blue-500 hover:bg-blue-600 rounded transition"
          >
            {showMetadata ? 'Hide' : 'Show'} Metadata
          </button>
          <button
            onClick={clearChat}
            className="px-3 py-1 text-sm bg-red-500 hover:bg-red-600 rounded transition"
          >
            Clear Chat
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 py-12">
            <p className="text-lg mb-2">=K Start a conversation!</p>
            <p className="text-sm">Ask me anything about your knowledge base.</p>
          </div>
        )}

        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-4 ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : message.role === 'error'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              <div className="whitespace-pre-wrap break-words">{message.content}</div>

              <div className="flex items-center justify-between mt-2 text-xs opacity-70">
                <span>{formatTimestamp(message.timestamp)}</span>
                {message.role === 'assistant' && message.metadata && (
                  <span>
                    {message.metadata.retrieval.chunksUsed} chunks "{' '}
                    {message.metadata.retrieval.metrics.confidence} confidence
                  </span>
                )}
              </div>

              {/* Metadata display */}
              {message.role === 'assistant' && message.metadata && showMetadata && (
                <div className="mt-4 pt-4 border-t border-gray-300 text-xs space-y-2">
                  <div>
                    <strong>Query Optimized:</strong> {message.metadata.optimizedQuery}
                  </div>
                  <div>
                    <strong>Retrieval:</strong> {message.metadata.retrieval.chunksRetrieved}{' '}
                    retrieved, {message.metadata.retrieval.chunksUsed} used
                  </div>
                  <div>
                    <strong>Quality Score:</strong>{' '}
                    {(message.metadata.retrieval.metrics.qualityScore * 100).toFixed(1)}%
                  </div>
                  <div>
                    <strong>Confidence:</strong> {message.metadata.retrieval.metrics.confidence}
                  </div>
                  {message.metadata.retrieval.sources.length > 0 && (
                    <div>
                      <strong>Sources:</strong> {message.metadata.retrieval.sources.join(', ')}
                    </div>
                  )}
                  {message.metadata.citations && message.metadata.citations.length > 0 && (
                    <div>
                      <strong>Citations:</strong> [{message.metadata.citations.join(', ')}]
                    </div>
                  )}
                  {message.metadata.generation?.usage && (
                    <div>
                      <strong>Tokens:</strong> {message.metadata.generation.usage.totalTokens} (
                      {message.metadata.generation.usage.promptTokens} prompt +{' '}
                      {message.metadata.generation.usage.completionTokens} completion)
                    </div>
                  )}
                  <div>
                    <strong>Processing Time:</strong> {message.metadata.processingTime}ms
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="text-gray-600">Thinking...</span>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 text-sm">
            <strong>Error:</strong> {error}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t p-4">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Type your message... (Press Enter to send)"
            className="flex-1 border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            rows="2"
            disabled={loading}
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Sending
              </span>
            ) : (
              'Send'
            )}
          </button>
        </div>

        <div className="mt-2 text-xs text-gray-500">
          Powered by RAG (Retrieval-Augmented Generation) " Gemini 1.5 Flash
        </div>
      </div>
    </div>
  );
}
