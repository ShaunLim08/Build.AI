/**
 * RAG (Retrieval-Augmented Generation) Pipeline
 *
 * This module provides utilities for building context from retrieved chunks
 * and preparing prompts for LLM generation.
 */

/**
 * Format a single chunk for context inclusion
 * @param {Object} chunk - The chunk object with text and metadata
 * @param {number} index - Index of the chunk
 * @returns {string} - Formatted chunk text
 */
function formatChunk(chunk, index) {
  const lines = [];

  // Add source information if available
  if (chunk.source) {
    lines.push(`Source: ${chunk.source}`);
  }

  // Add similarity score if available (for internal context only, not shown to user)
  if (chunk.similarity) {
    lines.push(`Relevance: ${(chunk.similarity * 100).toFixed(1)}%`);
  }

  if (chunk.source || chunk.similarity) {
    lines.push('---');
  }

  lines.push(chunk.text);
  lines.push('');

  return lines.join('\n');
}

/**
 * Build context from retrieved chunks
 * @param {Array} chunks - Array of retrieved chunks with similarity scores
 * @param {Object} options - Configuration options
 * @returns {Object} - Formatted context and metadata
 */
export function buildContext(chunks, options = {}) {
  const {
    maxChunks = 5,
    minSimilarity = 0.3,
    maxTokens = 4000, // Approximate token limit for context
    includeMetadata = true,
  } = options;

  if (!Array.isArray(chunks) || chunks.length === 0) {
    return {
      context: '',
      chunksUsed: 0,
      tokensEstimate: 0,
      sources: [],
    };
  }

  // Filter by similarity threshold
  const relevantChunks = chunks
    .filter(chunk => chunk.similarity >= minSimilarity)
    .slice(0, maxChunks);

  if (relevantChunks.length === 0) {
    return {
      context: '',
      chunksUsed: 0,
      tokensEstimate: 0,
      sources: [],
      warning: 'No chunks met the minimum similarity threshold',
    };
  }

  // Format chunks
  const formattedChunks = relevantChunks.map((chunk, index) =>
    formatChunk(chunk, index)
  );

  // Build context string
  const contextParts = [
    '# Retrieved Context',
    '',
    'The following documents were found to be relevant to your query:',
    '',
    ...formattedChunks,
  ];

  const context = contextParts.join('\n');

  // Estimate tokens (rough: ~4 chars per token)
  const tokensEstimate = Math.ceil(context.length / 4);

  // Extract unique sources
  const sources = [...new Set(
    relevantChunks
      .map(chunk => chunk.source)
      .filter(source => source)
  )];

  return {
    context,
    chunksUsed: relevantChunks.length,
    tokensEstimate,
    sources,
    chunks: includeMetadata ? relevantChunks.map(({ embedding, ...rest }) => rest) : undefined,
  };
}

/**
 * Optimize/rewrite query for better retrieval
 * @param {string} query - Original user query
 * @param {Object} options - Optimization options
 * @returns {string} - Optimized query
 */
export function optimizeQuery(query, options = {}) {
  if (!query || typeof query !== 'string') {
    return '';
  }

  let optimizedQuery = query.trim();

  // Remove common filler words that don't help semantic search
  const fillerWords = ['um', 'uh', 'like', 'you know', 'basically', 'actually'];
  fillerWords.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    optimizedQuery = optimizedQuery.replace(regex, '');
  });

  // Clean up multiple spaces
  optimizedQuery = optimizedQuery.replace(/\s+/g, ' ').trim();

  // Expand common abbreviations for better matching
  const expansions = {
    'whats': 'what is',
    'wheres': 'where is',
    'hows': 'how is',
    'whos': 'who is',
    'dont': 'do not',
    'doesnt': 'does not',
    'cant': 'cannot',
    'wont': 'will not',
  };

  Object.entries(expansions).forEach(([abbr, expansion]) => {
    const regex = new RegExp(`\\b${abbr}\\b`, 'gi');
    optimizedQuery = optimizedQuery.replace(regex, expansion);
  });

  return optimizedQuery;
}

/**
 * Build system prompt with instructions
 * @param {Object} chatbot - Chatbot configuration
 * @param {string} context - Retrieved context
 * @returns {string} - Complete system prompt
 */
export function buildSystemPrompt(chatbot, context) {
  const parts = [];

  // Base instructions
  parts.push('You are a helpful AI assistant that answers questions based on the provided context.');
  parts.push('');

  // Custom instructions from chatbot config
  if (chatbot.systemPrompt) {
    parts.push(chatbot.systemPrompt);
    parts.push('');
  }

  // Context instructions
  parts.push('IMPORTANT INSTRUCTIONS:');
  parts.push('1. Base your answers PRIMARILY on the context provided below');
  parts.push('2. If the context does not contain enough information, say so clearly');
  parts.push('3. Do not make up information that is not in the context');
  parts.push('4. You may use your general knowledge to clarify or explain, but prioritize the context');
  parts.push('5. Provide clear, natural answers WITHOUT including document numbers or citation markers');
  parts.push('');

  // Add the context
  if (context) {
    parts.push(context);
    parts.push('');
  } else {
    parts.push('Note: No relevant context was found for this query. Use your general knowledge to assist.');
    parts.push('');
  }

  return parts.join('\n');
}

/**
 * Build complete prompt for LLM
 * @param {string} systemPrompt - System prompt with context
 * @param {string} userQuery - User's question
 * @param {Array} conversationHistory - Previous messages (optional)
 * @returns {Array} - Messages array for chat completion
 */
export function buildChatMessages(systemPrompt, userQuery, conversationHistory = []) {
  const messages = [
    {
      role: 'system',
      content: systemPrompt,
    },
  ];

  // Add conversation history if provided
  if (conversationHistory && conversationHistory.length > 0) {
    messages.push(...conversationHistory);
  }

  // Add current user query
  messages.push({
    role: 'user',
    content: userQuery,
  });

  return messages;
}

/**
 * Extract citations from response
 * @param {string} response - LLM response
 * @returns {Array} - Array of document references
 */
export function extractCitations(response) {
  const citations = [];
  const regex = /\[Document (\d+)\]/g;
  let match;

  while ((match = regex.exec(response)) !== null) {
    const docNum = parseInt(match[1], 10);
    if (!citations.includes(docNum)) {
      citations.push(docNum);
    }
  }

  return citations.sort((a, b) => a - b);
}

/**
 * Calculate relevance metrics for quality assessment
 * @param {Array} chunks - Retrieved chunks with similarity scores
 * @returns {Object} - Quality metrics
 */
export function calculateRelevanceMetrics(chunks) {
  if (!chunks || chunks.length === 0) {
    return {
      averageSimilarity: 0,
      maxSimilarity: 0,
      minSimilarity: 0,
      qualityScore: 0,
    };
  }

  const similarities = chunks.map(c => c.similarity);
  const sum = similarities.reduce((acc, val) => acc + val, 0);
  const avgSimilarity = sum / similarities.length;
  const maxSimilarity = Math.max(...similarities);
  const minSimilarity = Math.min(...similarities);

  // Quality score: weighted combination of max and average similarity
  const qualityScore = (maxSimilarity * 0.6 + avgSimilarity * 0.4);

  return {
    averageSimilarity: avgSimilarity,
    maxSimilarity: maxSimilarity,
    minSimilarity: minSimilarity,
    qualityScore: qualityScore,
    confidence: qualityScore > 0.7 ? 'high' : qualityScore > 0.5 ? 'medium' : 'low',
  };
}
