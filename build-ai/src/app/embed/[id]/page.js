'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Send, Minimize2, Maximize2, Volume2, VolumeX } from 'lucide-react';
import Link from 'next/link';

export default function EmbedPage({ params }) {
  const [chatbotId, setChatbotId] = useState(null);
  const [chatbot, setChatbot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const messagesEndRef = useRef(null);

  // Styling from URL parameters
  const [styling, setStyling] = useState({
    bg: '#0a0808',
    text: '#ffffff',
    button: '#6366f1',
    watermark: true,
  });

  // Parse URL parameters on mount
  useEffect(() => {
    params.then(resolvedParams => {
      setChatbotId(resolvedParams.id);
      fetchChatbot(resolvedParams.id);
    });

    // Parse URL query parameters for styling and session
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);

      // Use sessionId from URL if provided, otherwise generate new one
      const urlSessionId = urlParams.get('sessionId');
      if (urlSessionId) {
        setSessionId(urlSessionId);
      } else {
        const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        setSessionId(newSessionId);
      }

      const bgColor = urlParams.get('bg');
      const textColor = urlParams.get('text');
      const buttonColor = urlParams.get('button');
      const watermark = urlParams.get('watermark');

      setStyling({
        bg: bgColor ? `#${bgColor}` : '#0a0808',
        text: textColor ? `#${textColor}` : '#ffffff',
        button: buttonColor ? `#${buttonColor}` : '#6366f1',
        watermark: watermark !== 'false',
      });
    }
  }, [params]);

  const fetchChatbot = async (id) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/chatbots/${id}`);

      if (!response.ok) {
        throw new Error('Chatbot not found');
      }

      const data = await response.json();
      setChatbot(data.chatbot);

      // Add welcome message
      setMessages([{
        role: 'assistant',
        content: `Hello! I'm ${data.chatbot.name}. ${data.chatbot.description || 'How can I help you today?'}`,
        timestamp: new Date().toISOString(),
      }]);
    } catch (err) {
      console.error('Error fetching chatbot:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e) => {
    e?.preventDefault();

    if (!inputMessage.trim() || isTyping) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');

    // Add user message
    const newUserMessage = {
      role: 'user',
      content: userMessage,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, newUserMessage]);
    setIsTyping(true);

    try {
      // Build conversation history
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
          sessionId: sessionId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get response');
      }

      const data = await response.json();

      // Add assistant message
      const assistantMessage = {
        role: 'assistant',
        content: data.response,
        timestamp: new Date().toISOString(),
        metadata: data.metadata,
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Notify parent window about new message (for unread counter)
      if (window.parent !== window) {
        window.parent.postMessage({
          type: 'buildai:newMessage',
          message: assistantMessage
        }, '*');
      }

    } catch (error) {
      console.error('Error sending message:', error);

      // Add error message
      const errorMessage = {
        role: 'error',
        content: `Error: ${error.message}`,
        timestamp: new Date().toISOString(),
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const adjustColor = (hex, amount) => {
    let r = parseInt(hex.substring(1, 3), 16);
    let g = parseInt(hex.substring(3, 5), 16);
    let b = parseInt(hex.substring(5, 7), 16);

    r = Math.max(0, Math.min(255, r + amount));
    g = Math.max(0, Math.min(255, g + amount));
    b = Math.max(0, Math.min(255, b + amount));

    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div
        className="h-screen w-full flex items-center justify-center"
        style={{ backgroundColor: styling.bg, color: styling.text }}
      >
        <motion.div
          className="w-12 h-12 border-4 rounded-full"
          style={{
            borderColor: `${styling.button}40`,
            borderTopColor: styling.button
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
      </div>
    );
  }

  if (error || !chatbot) {
    return (
      <div
        className="h-screen w-full flex flex-col items-center justify-center p-6"
        style={{ backgroundColor: styling.bg, color: styling.text }}
      >
        <div className="text-red-500 text-xl mb-2">Error</div>
        <p className="text-center opacity-70 mb-4">
          {error || 'Chatbot not found'}
        </p>
        <Link
          href="/"
          className="hover:underline"
          style={{ color: styling.button }}
        >
          Return to Homepage
        </Link>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Chat Widget */}
      <div
        className="w-full h-full sm:h-auto sm:max-h-[600px] sm:max-w-md sm:w-full shadow-2xl sm:rounded-lg overflow-hidden"
        style={{ backgroundColor: styling.bg }}
      >
        {/* Header */}
        <div
          className="p-4 flex justify-between items-center cursor-pointer"
          onClick={() => setMinimized(!minimized)}
          style={{
            background: `linear-gradient(to right, ${styling.bg}, ${adjustColor(styling.bg, -10)})`,
            borderBottom: `1px solid ${adjustColor(styling.bg, -20)}`
          }}
        >
          <div className="flex items-center">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold mr-3"
              style={{ backgroundColor: styling.button }}
            >
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold" style={{ color: styling.text }}>
                {chatbot.name}
              </h3>
              <p className="text-xs" style={{ color: adjustColor(styling.text, -40) }}>
                Online
              </p>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="p-2 rounded-full hover:bg-white/10"
            style={{ color: styling.text }}
          >
            {minimized ? <Maximize2 className="w-5 h-5" /> : <Minimize2 className="w-5 h-5" />}
          </motion.button>
        </div>

        {/* Chat Area */}
        <AnimatePresence>
          {!minimized && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* Messages */}
              <div
                className="h-[calc(100vh-180px)] sm:h-[400px] overflow-y-auto p-4"
                style={{ backgroundColor: styling.bg }}
              >
                <div className="space-y-4">
                  {messages.map((message, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] px-4 py-3 rounded-lg ${
                          message.role === 'user'
                            ? 'rounded-br-none'
                            : 'rounded-bl-none'
                        }`}
                        style={{
                          backgroundColor: message.role === 'user'
                            ? styling.button
                            : message.error
                            ? '#dc2626'
                            : adjustColor(styling.bg, 10),
                          color: styling.text,
                          border: message.role === 'assistant' && !message.error
                            ? `1px solid ${adjustColor(styling.bg, -20)}`
                            : 'none'
                        }}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium opacity-70">
                            {message.role === 'user' ? 'You' : chatbot.name}
                          </span>
                          {message.timestamp && (
                            <span className="text-xs opacity-50 ml-2">
                              {formatTime(message.timestamp)}
                            </span>
                          )}
                        </div>
                        <div className="text-sm whitespace-pre-wrap break-words">
                          {message.content}
                        </div>

                        {/* Metadata for assistant messages */}
                        {message.metadata && (
                          <div className="mt-2 pt-2 text-xs opacity-60" style={{ borderTop: `1px solid ${adjustColor(styling.bg, -10)}` }}>
                            {message.metadata.retrieval?.chunksUsed > 0 && (
                              <span>
                                {message.metadata.retrieval.chunksUsed} sources • {' '}
                                {message.metadata.retrieval.metrics?.confidence}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}

                  {/* Typing indicator */}
                  {isTyping && (
                    <div className="flex justify-start">
                      <div
                        className="px-4 py-3 rounded-lg rounded-bl-none"
                        style={{
                          backgroundColor: adjustColor(styling.bg, 10),
                          border: `1px solid ${adjustColor(styling.bg, -20)}`
                        }}
                      >
                        <div className="flex items-center space-x-1">
                          {[0, 1, 2].map((i) => (
                            <motion.div
                              key={i}
                              animate={{ opacity: [0.4, 1, 0.4] }}
                              transition={{
                                duration: 1.5,
                                repeat: Infinity,
                                delay: i * 0.2,
                              }}
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: styling.text, opacity: 0.4 }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* Input Area */}
              <form
                onSubmit={handleSendMessage}
                className="p-4"
                style={{
                  backgroundColor: styling.bg,
                  borderTop: `1px solid ${adjustColor(styling.bg, -20)}`
                }}
              >
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder={`Message ${chatbot.name}...`}
                    className="flex-1 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 transition-all"
                    style={{
                      backgroundColor: adjustColor(styling.bg, 5),
                      color: styling.text,
                      border: `1px solid ${adjustColor(styling.bg, -20)}`,
                      '--tw-ring-color': styling.button
                    }}
                    disabled={isTyping}
                  />
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="submit"
                    disabled={isTyping || !inputMessage.trim()}
                    className="px-6 py-3 rounded-lg font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    style={{ backgroundColor: styling.button }}
                  >
                    <Send className="w-5 h-5" />
                  </motion.button>
                </div>
              </form>

              {/* Footer/Watermark */}
              {styling.watermark && (
                <div
                  className="px-4 py-2 flex justify-center"
                  style={{
                    backgroundColor: styling.bg,
                    borderTop: `1px solid ${adjustColor(styling.bg, -20)}`
                  }}
                >
                  <Link
                    href="https://build-ai.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] hover:underline"
                    style={{ color: adjustColor(styling.text, -40) }}
                  >
                    Powered by Build.AI
                  </Link>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
