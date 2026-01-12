# RAG Pipeline - Complete Implementation Guide

## Overview

This guide documents the complete Retrieval-Augmented Generation (RAG) pipeline implementation for the Build.AI chatbot platform.

## Architecture

```
USER QUERY
    ↓
1. QUERY PREPROCESSING
   - Clean & validate input
   - Query optimization (remove filler words, expand abbreviations)
    ↓
2. EMBEDDING GENERATION
   - Generate query embedding using Xenova/gte-large (1024 dimensions)
    ↓
3. SEMANTIC SEARCH
   - Search chunks by cosine similarity
   - Retrieve top K relevant chunks (default: 5)
   - Filter by minimum similarity (default: 0.3)
    ↓
4. CONTEXT RETRIEVAL & FORMATTING
   - Format retrieved chunks with metadata
   - Calculate relevance metrics
   - Estimate token usage
    ↓
5. PROMPT CONSTRUCTION
   - Build system prompt with instructions
   - Insert retrieved context
   - Add conversation history (optional)
   - Add user query
    ↓
6. LLM GENERATION (Gemini)
   - Send to Gemini API (default: gemini-1.5-flash)
   - Support streaming or non-streaming
    ↓
7. RESPONSE POST-PROCESSING
   - Extract citations
   - Format output with metadata
    ↓
RETURN TO USER
```

## Components

### 1. Embeddings (src/lib/embeddings.js)

**Functions:**
- `generateEmbedding(text)` - Generate embedding for single text
- `generateEmbeddingsBatch(texts)` - Batch embedding generation
- `cosineSimilarity(emb1, emb2)` - Calculate similarity between embeddings
- `findSimilar(queryEmb, documents, topK)` - Find most similar documents

**Model:** Xenova/gte-large
- 1024 dimensions
- ~300MB download on first run
- Local execution (no API costs)
- Higher quality embeddings than gte-small

### 2. RAG Pipeline (src/lib/rag.js)

**Functions:**

#### buildContext(chunks, options)
Formats retrieved chunks into structured context for LLM.

**Options:**
- `maxChunks` (default: 5) - Maximum chunks to include
- `minSimilarity` (default: 0.3) - Minimum similarity threshold
- `maxTokens` (default: 4000) - Approximate token limit
- `includeMetadata` (default: true) - Include chunk metadata

**Returns:**
```javascript
{
  context: string,          // Formatted context text
  chunksUsed: number,       // Number of chunks included
  tokensEstimate: number,   // Estimated tokens
  sources: string[],        // Unique source list
  chunks: object[]          // Chunk metadata (if includeMetadata)
}
```

#### optimizeQuery(query, options)
Optimizes user query for better semantic search.

**Optimizations:**
- Remove filler words (um, uh, like, etc.)
- Expand contractions (what's → what is)
- Clean multiple spaces

#### buildSystemPrompt(chatbot, context)
Creates complete system prompt with instructions and context.

**Structure:**
1. Base assistant instructions
2. Custom chatbot instructions (if configured)
3. RAG-specific guidelines
4. Retrieved context (formatted)

#### buildChatMessages(systemPrompt, userQuery, history)
Builds complete message array for chat completion.

**Returns:** Array of message objects compatible with Gemini API

#### extractCitations(response)
Extracts document references from LLM response.

**Returns:** Array of document numbers referenced

#### calculateRelevanceMetrics(chunks)
Analyzes quality of retrieved chunks.

**Returns:**
```javascript
{
  averageSimilarity: number,
  maxSimilarity: number,
  minSimilarity: number,
  qualityScore: number,      // Weighted score (0-1)
  confidence: string         // 'high', 'medium', or 'low'
}
```

### 3. Gemini API Integration (src/lib/gemini.js)

**Functions:**

#### generateChatCompletion(messages, options)
Generate non-streaming chat completion.

**Options:**
- `model` (default: 'gemini-1.5-flash')
- `temperature` (default: 0.7)
- `maxTokens` (default: 2048)
- `topP` (default: 0.95)
- `topK` (default: 40)

**Returns:**
```javascript
{
  text: string,              // Generated response
  finishReason: string,      // Completion reason
  safetyRatings: object[],   // Safety check results
  model: string,             // Model used
  usage: {
    promptTokens: number,
    completionTokens: number,
    totalTokens: number
  }
}
```

#### streamChatCompletion(messages, options, onChunk)
Stream chat completion with callback for each chunk.

**onChunk callback:** `(chunkText: string) => void`

#### generateText(prompt, options)
Simple text generation (non-chat format).

**Available Models:**
- `gemini-1.5-pro` - Most capable, 2M token context
- `gemini-1.5-flash` - Fast and efficient, 1M token context
- `gemini-2.0-flash-exp` - Latest experimental, 1M token context

### 4. Database Models

#### Chunk (src/models/Chunk.js)
Stores document chunks with embeddings.

**Key Methods:**
- `searchByEmbedding(chatbotId, queryEmbedding, limit)` - Semantic search
- `createMany(chunksData)` - Batch create chunks
- `updateEmbeddingsBatch(updates)` - Batch update embeddings

#### Chatbot (src/models/Chatbot.js)
Stores chatbot configuration.

**Fields:**
- `name` - Chatbot name
- `systemPrompt` - Custom instructions
- `userId` - Owner user ID

#### Document (src/models/Document.js)
Stores uploaded documents.

**Fields:**
- `chatbotId` - Associated chatbot
- `filename` - Original filename
- `status` - processing/processed/failed
- `source` - Source type (upload, web, mongodb, etc.)

## API Endpoints

### POST /api/chatbots/[chatbotId]/chat

Main RAG pipeline endpoint.

**Request Body:**
```javascript
{
  message: string,              // Required: User query
  conversationHistory: array,   // Optional: Previous messages
  stream: boolean,              // Optional: Enable streaming (default: false)
  retrievalOptions: {
    limit: number,              // Max chunks to retrieve (default: 5)
    minSimilarity: number       // Minimum similarity (default: 0.3)
  },
  generationOptions: {
    model: string,              // Gemini model (default: gemini-1.5-flash)
    temperature: number,        // Randomness (default: 0.7)
    maxTokens: number          // Max output tokens (default: 2048)
  }
}
```

**Response (Non-streaming):**
```javascript
{
  success: true,
  response: string,           // Generated response
  metadata: {
    chatbotId: string,
    query: string,
    optimizedQuery: string,
    retrieval: {
      chunksRetrieved: number,
      chunksUsed: number,
      sources: string[],
      metrics: {
        qualityScore: number,
        confidence: string,
        // ... more metrics
      }
    },
    generation: {
      model: string,
      usage: {
        promptTokens: number,
        completionTokens: number,
        totalTokens: number
      }
    },
    citations: number[],      // Referenced document numbers
    processingTime: number,   // Total time in ms
    timestamp: string
  }
}
```

**Response (Streaming):**
Server-Sent Events (SSE) format:
```
data: {"chunk": "piece of text"}
data: {"chunk": "more text"}
data: [DONE]
```

### POST /api/chatbots/[chatbotId]/search

Semantic search endpoint (without LLM generation).

**Request Body:**
```javascript
{
  query: string,              // Required: Search query
  limit: number,              // Optional: Max results (default: 5)
  minSimilarity: number       // Optional: Min threshold (default: 0.0)
}
```

**Response:**
```javascript
{
  success: true,
  query: string,
  results: [{
    _id: string,
    text: string,
    similarity: number,
    similarityScore: string,  // Percentage
    source: string,
    // ... other chunk fields
  }],
  count: number,
  model: string
}
```

## Configuration

### Environment Variables

```bash
# MongoDB connection
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/

# Gemini API key (required for chat)
GEMINI_API_KEY=your_gemini_api_key_here
```

### Getting a Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with Google account
3. Click "Create API Key"
4. Copy the key and add to `.env.local`

## Usage Examples

### Example 1: Simple Chat Request

```javascript
const response = await fetch('/api/chatbots/123abc/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: 'What is the return policy?'
  })
});

const data = await response.json();
console.log(data.response);
console.log('Confidence:', data.metadata.retrieval.metrics.confidence);
```

### Example 2: Chat with History

```javascript
const response = await fetch('/api/chatbots/123abc/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: 'What about refunds?',
    conversationHistory: [
      { role: 'user', content: 'What is the return policy?' },
      { role: 'assistant', content: 'You can return items within 30 days...' }
    ]
  })
});
```

### Example 3: Streaming Response

```javascript
const response = await fetch('/api/chatbots/123abc/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: 'Explain the pricing tiers',
    stream: true
  })
});

const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;

  const chunk = decoder.decode(value);
  const lines = chunk.split('\n');

  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const data = line.slice(6);
      if (data === '[DONE]') continue;

      const parsed = JSON.parse(data);
      process.stdout.write(parsed.chunk);
    }
  }
}
```

### Example 4: Custom Retrieval Options

```javascript
const response = await fetch('/api/chatbots/123abc/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: 'Find technical specifications',
    retrievalOptions: {
      limit: 10,              // Get more chunks
      minSimilarity: 0.5     // Higher quality threshold
    },
    generationOptions: {
      model: 'gemini-1.5-pro',  // Use more capable model
      temperature: 0.3           // More focused output
    }
  })
});
```

## Testing

### Test the Search Endpoint

```bash
curl -X POST http://localhost:3000/api/chatbots/YOUR_CHATBOT_ID/search \
  -H "Content-Type: application/json" \
  -d '{"query": "test query", "limit": 5}'
```

### Test the Chat Endpoint

```bash
curl -X POST http://localhost:3000/api/chatbots/YOUR_CHATBOT_ID/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello, what can you tell me?"}'
```

## Performance Considerations

### Embedding Generation
- First query: ~2-3 seconds (model initialization)
- Subsequent queries: ~100-300ms
- Batch processing: ~50ms per text (depends on length)

### Semantic Search
- Small knowledge base (<1000 chunks): <100ms
- Medium (1000-10000 chunks): 100-500ms
- Large (>10000 chunks): Consider MongoDB vector search

### LLM Generation
- Gemini 1.5 Flash: ~1-2 seconds (typical)
- Gemini 1.5 Pro: ~2-4 seconds (more complex)
- Streaming: First token in ~500ms-1s

### Total Pipeline
- End-to-end: 2-5 seconds typical
- With caching: Can reduce to 1-2 seconds

## Optimization Tips

### 1. Adjust Retrieval Parameters
```javascript
// For faster responses (lower quality)
retrievalOptions: {
  limit: 3,
  minSimilarity: 0.4
}

// For better quality (slower)
retrievalOptions: {
  limit: 10,
  minSimilarity: 0.2
}
```

### 2. Choose the Right Model
- Use `gemini-1.5-flash` for speed
- Use `gemini-1.5-pro` for complex reasoning
- Use `gemini-2.0-flash-exp` for latest features

### 3. Cache Embeddings
- Always store embeddings in database
- Reuse for multiple queries
- Batch generate on document upload

### 4. Implement Vector Search
For large knowledge bases (>10000 chunks), consider MongoDB vector search:
```javascript
// Create vector index in MongoDB
db.chunks.createIndex(
  { embedding: "vector" },
  {
    name: "vector_index",
    vectorSearchOptions: {
      type: "vectorSearch",
      similarity: "cosine",
      dimensions: 1024
    }
  }
);
```

## Troubleshooting

### Error: GEMINI_API_KEY not set
**Solution:** Add `GEMINI_API_KEY` to your `.env.local` file

### No chunks found
**Solution:**
1. Ensure documents are uploaded
2. Check embeddings are generated
3. Try lower `minSimilarity` threshold

### Low quality responses
**Solution:**
1. Increase `limit` in retrievalOptions
2. Lower `minSimilarity` to get more context
3. Improve document chunking strategy
4. Add better system instructions in chatbot config

### Slow response times
**Solution:**
1. Reduce `limit` in retrievalOptions
2. Use `gemini-2.0-flash` instead of Pro
3. Implement caching
4. Consider vector search for large datasets

## Next Steps

1. **Add Conversation Memory**
   - Store conversation history in database
   - Implement conversation sessions

2. **Improve Chunking**
   - Semantic chunking (split by meaning)
   - Overlapping chunks for better context

3. **Add Feedback Loop**
   - Track response quality
   - User feedback on answers
   - Fine-tune retrieval parameters

4. **Implement Caching**
   - Cache common queries
   - Cache embeddings
   - Use Redis for session data

5. **Add Analytics**
   - Track query patterns
   - Monitor response quality
   - Measure latency and costs

6. **Enhance Security**
   - Rate limiting
   - User authentication
   - Content filtering

## Resources

- [Gemini API Documentation](https://ai.google.dev/docs)
- [MongoDB Vector Search](https://www.mongodb.com/docs/atlas/atlas-vector-search/vector-search-overview/)
- [RAG Best Practices](https://www.anthropic.com/index/retrieval-augmented-generation)
