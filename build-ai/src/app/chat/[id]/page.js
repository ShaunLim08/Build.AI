'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function ChatPage({ params }) {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      content: "Hello! I'm your AI assistant. How can I help you today?",
      timestamp: new Date().toISOString()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatbot, setChatbot] = useState(null);
  const [showMetadata, setShowMetadata] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  const chatbotId = params.id;

  // Fetch chatbot details
  useEffect(() => {
    async function fetchChatbot() {
      try {
        const response = await fetch(`/api/chatbots/${chatbotId}`);
        if (response.ok) {
          const data = await response.json();
          setChatbot(data.chatbot);
        }
      } catch (error) {
        console.error('Error fetching chatbot:', error);
      }
    }
    fetchChatbot();
  }, [chatbotId]);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputValue.trim(),
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setError(null);

    try {
      // Build conversation history (last 10 messages, excluding system message)
      const history = messages
        .slice(1) // Skip initial welcome message
        .map(msg => ({
          role: msg.type === 'user' ? 'user' : 'assistant',
          content: msg.content
        }));

      console.log('Sending request to RAG pipeline...');
      const response = await fetch(`/api/chatbots/${chatbotId}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.content,
          conversationHistory: history,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get response');
      }

      const data = await response.json();
      console.log('Received response:', data);

      // Add bot response
      const botResponse = {
        id: Date.now() + 1,
        type: 'bot',
        content: data.response,
        timestamp: new Date().toISOString(),
        metadata: data.metadata
      };

      setMessages(prev => [...prev, botResponse]);

    } catch (error) {
      console.error('Error sending message:', error);
      setError(error.message);

      // Add error message
      const errorMessage = {
        id: Date.now() + 1,
        type: 'error',
        content: `Error: ${error.message}`,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: 1,
        type: 'bot',
        content: "Hello! I'm your AI assistant. How can I help you today?",
        timestamp: new Date().toISOString()
      }
    ]);
    setError(null);
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="container py-4">
          <nav className="flex items-center justify-between">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <Image
                src="/buildai.png"
                alt="Build.AI Logo"
                width={32}
                height={32}
                className="w-8 h-8"
              />
              <span className="text-xl font-bold">Build.AI</span>
            </Link>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {chatbot ? chatbot.name : `Chatbot ${chatbotId}`}
              </span>
              <button
                onClick={() => setShowMetadata(!showMetadata)}
                className="btn-secondary text-sm"
              >
                {showMetadata ? 'Hide' : 'Show'} Metadata
              </button>
              <button
                onClick={clearChat}
                className="btn-secondary text-sm"
              >
                Clear Chat
              </button>
              <Link href="/dashboard" className="btn-secondary text-sm">
                Back to Dashboard
              </Link>
            </div>
          </nav>
        </div>
      </header>

      {/* Chat Interface */}
      <div className="flex-1 flex flex-col max-w-5xl mx-auto w-full">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-4 ${
                  message.type === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : message.type === 'error'
                    ? 'bg-red-100 text-red-800 border border-red-300'
                    : 'bg-card border border-border'
                }`}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>

                {/* Timestamp and basic info */}
                <div className="flex items-center justify-between mt-2 text-xs opacity-70">
                  <span>{formatTimestamp(message.timestamp)}</span>
                  {message.type === 'bot' && message.metadata && (
                    <span className="ml-2">
                      {message.metadata.retrieval.chunksUsed} chunks •{' '}
                      {message.metadata.retrieval.metrics.confidence} confidence
                    </span>
                  )}
                </div>

                {/* Detailed metadata (if enabled) */}
                {message.type === 'bot' && message.metadata && showMetadata && (
                  <div className="mt-4 pt-4 border-t border-border text-xs space-y-2 text-muted-foreground">
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

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-card border border-border rounded-lg p-4 max-w-[70%]">
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span className="text-sm text-muted-foreground">Thinking...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-border p-4">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Type your message... (Press Enter to send)"
              className="input flex-1"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isLoading}
              className="btn-primary px-6 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Sending...' : 'Send'}
            </button>
          </form>
        </div>
      </div>

      {/* Info Panel */}
      <div className="bg-muted/50 border-t border-border p-4">
        <div className="container">
          <p className="text-sm text-muted-foreground text-center">
            {error ? (
              <span className="text-red-600">
                ⚠️ {error}
                {error.includes('GEMINI_API_KEY') && (
                  <span> - Please set GEMINI_API_KEY in your .env.local file</span>
                )}
              </span>
            ) : (
              <>
                Powered by RAG (Retrieval-Augmented Generation) • Gemini 2.0 Flash •{' '}
                <strong>gte-large (1024 dimensions)</strong>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
