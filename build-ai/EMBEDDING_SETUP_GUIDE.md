# Embedding Setup Guide

## ✅ Setup Complete!

The embedding system has been successfully set up using **thenlper/gte-large** from Hugging Face via `@xenova/transformers`.

## 📊 System Overview

### Model Details
- **Model**: Xenova/gte-large (thenlper/gte-large)
- **Provider**: Hugging Face (via @xenova/transformers)
- **Dimensions**: 1024
- **Max Tokens**: 512
- **Cost**: Free (open source)
- **Performance**: ~10-20ms per embedding (after initial load)

### Test Results
The system has been tested with sample sentences and shows excellent semantic understanding:

| Sentence Pair | Similarity |
|--------------|------------|
| "happy person" ↔ "very happy person" | 97.95% ✅ |
| "happy person" ↔ "happy dog" | 92.53% |
| "happy person" ↔ "sunny day" | 81.6% |

## 🚀 Features Implemented

### 1. Embedding Generation (`src/lib/embeddings.js`)
- ✅ Single text embedding generation
- ✅ Batch embedding generation (efficient processing)
- ✅ Cosine similarity calculation
- ✅ Semantic search functionality
- ✅ Automatic model initialization and caching

### 2. Database Schema (`src/models/Chunk.js`)
Enhanced Chunk model with:
- ✅ `embedding` field (1024-dimensional vector)
- ✅ `embeddingUpdatedAt` timestamp
- ✅ Vector similarity search
- ✅ Batch update operations
- ✅ Query methods for chunks without embeddings

### 3. API Endpoints

#### Generate Embeddings
```
POST /api/chatbots/[chatbotId]/embeddings
```

Generate and store embeddings for chunks.

**Request Body:**
```json
{
  "documentId": "optional - specific document ID",
  "regenerate": false,
  "batchSize": 32
}
```

**Response:**
```json
{
  "success": true,
  "message": "Successfully generated embeddings for 150 chunks",
  "processed": 150,
  "dimensions": 1024,
  "model": "Xenova/gte-large"
}
```

#### Get Embedding Stats
```
GET /api/chatbots/[chatbotId]/embeddings
```

**Response:**
```json
{
  "success": true,
  "stats": {
    "totalChunks": 200,
    "chunksWithEmbeddings": 150,
    "chunksWithoutEmbeddings": 50,
    "percentageEmbedded": "75.0",
    "model": "Xenova/gte-large",
    "dimensions": 1024
  }
}
```

#### Semantic Search
```
POST /api/chatbots/[chatbotId]/search
```

Perform semantic search using natural language queries.

**Request Body:**
```json
{
  "query": "How do I reset my password?",
  "limit": 5,
  "minSimilarity": 0.7
}
```

**Response:**
```json
{
  "success": true,
  "query": "How do I reset my password?",
  "results": [
    {
      "_id": "...",
      "content": "Password reset instructions...",
      "similarity": 0.92,
      "similarityScore": "92.00%"
    }
  ],
  "count": 5,
  "model": "Xenova/gte-large"
}
```

#### Test Endpoint
```
GET /api/test/embeddings
```

Test the embedding system with sample sentences.

## 📝 Usage Examples

### 1. Generate Embeddings for a Document

After uploading a document, generate embeddings:

```javascript
// After document upload
const response = await fetch(`/api/chatbots/${chatbotId}/embeddings`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    documentId: documentId
  })
});

const result = await response.json();
console.log(`Generated embeddings for ${result.processed} chunks`);
```

### 2. Generate Embeddings for All Chunks

Process all chunks that don't have embeddings:

```javascript
const response = await fetch(`/api/chatbots/${chatbotId}/embeddings`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    batchSize: 32  // Process 32 chunks at a time
  })
});
```

### 3. Perform Semantic Search

Search for relevant content using natural language:

```javascript
const response = await fetch(`/api/chatbots/${chatbotId}/search`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: "What are the pricing plans?",
    limit: 5,
    minSimilarity: 0.7  // Only return results with >70% similarity
  })
});

const { results } = await response.json();
results.forEach(chunk => {
  console.log(`${chunk.similarityScore}: ${chunk.content.substring(0, 100)}...`);
});
```

### 4. Check Embedding Status

Get stats about embedding coverage:

```javascript
const response = await fetch(`/api/chatbots/${chatbotId}/embeddings`);
const { stats } = await response.json();

console.log(`Embedded: ${stats.chunksWithEmbeddings}/${stats.totalChunks} (${stats.percentageEmbedded}%)`);
```

## 🔧 Advanced Usage

### Custom Embedding Generation

Use the embedding utility directly:

```javascript
import { generateEmbedding, generateEmbeddingsBatch, cosineSimilarity } from '@/lib/embeddings';

// Generate single embedding
const embedding = await generateEmbedding("Hello world");

// Generate batch
const embeddings = await generateEmbeddingsBatch(
  ["Text 1", "Text 2", "Text 3"],
  {
    batchSize: 32,
    onProgress: (progress) => {
      console.log(`${progress.current}/${progress.total}`);
    }
  }
);

// Calculate similarity
const similarity = cosineSimilarity(embedding1, embedding2);
```

### Database Queries

Work with embeddings in the database:

```javascript
import { Chunk } from '@/models/Chunk';

// Find chunks without embeddings
const chunks = await Chunk.findChunksWithoutEmbeddings(chatbotId, 100);

// Update embeddings in batch
await Chunk.updateEmbeddingsBatch([
  { chunkId: "id1", embedding: [0.1, 0.2, ...] },
  { chunkId: "id2", embedding: [0.3, 0.4, ...] }
]);

// Semantic search
const results = await Chunk.searchByEmbedding(chatbotId, queryEmbedding, 5);
```

## 🎯 Next Steps

### Integration with Chat Interface
1. When user asks a question, generate query embedding
2. Search for most similar chunks
3. Use retrieved chunks as context for AI response

Example flow:
```javascript
// 1. User asks question
const userQuestion = "How do I reset my password?";

// 2. Generate embedding for question
const queryEmbedding = await generateEmbedding(userQuestion);

// 3. Find most relevant chunks
const relevantChunks = await Chunk.searchByEmbedding(
  chatbotId,
  queryEmbedding,
  3  // Top 3 most relevant
);

// 4. Build context from chunks
const context = relevantChunks
  .map(chunk => chunk.content)
  .join('\n\n');

// 5. Send to AI with context
const aiResponse = await callAI({
  context: context,
  question: userQuestion
});
```

### Automatic Embedding Generation

Add automatic embedding generation when documents are uploaded:

```javascript
// In your document upload handler
async function handleDocumentUpload(file, chatbotId) {
  // 1. Process document and create chunks
  const chunks = await processDocument(file);

  // 2. Generate embeddings for chunks
  const texts = chunks.map(c => c.content);
  const embeddings = await generateEmbeddingsBatch(texts);

  // 3. Store chunks with embeddings
  const chunksWithEmbeddings = chunks.map((chunk, i) => ({
    ...chunk,
    embedding: embeddings[i]
  }));

  await Chunk.createMany(chunksWithEmbeddings);
}
```

## ⚡ Performance Considerations

### First Load
- Model downloads ~300MB on first use
- First embedding takes ~3-5 seconds (includes model initialization)
- Subsequent embeddings are fast (~10-20ms each)

### Optimization Tips
1. **Batch Processing**: Always use `generateEmbeddingsBatch()` for multiple texts
2. **Caching**: The model is automatically cached after first load
3. **Parallel Processing**: Process independent documents in parallel
4. **MongoDB Indexing**: Consider adding indexes on `chatbotId` and `embedding` fields

### Scaling
For production with many documents:
- Consider MongoDB Atlas Vector Search for faster similarity search
- Use a dedicated vector database (Pinecone, Weaviate, Qdrant) for millions of vectors
- Implement background jobs for embedding generation

## 🔒 Security Note

**⚠️ IMPORTANT**: Never commit API keys to version control!

While this implementation uses a free, open-source model (no API key required), if you switch to a paid provider:

1. Store API keys in `.env.local`:
   ```
   EMBEDDING_API_KEY=your_key_here
   ```

2. Add to `.gitignore`:
   ```
   .env.local
   .env*.local
   ```

3. Revoke any exposed keys immediately

## 📚 Additional Resources

- **Model**: [Hugging Face - thenlper/gte-large](https://huggingface.co/thenlper/gte-large)
- **Library**: [@xenova/transformers](https://github.com/xenova/transformers.js)
- **Paper**: [General Text Embeddings](https://arxiv.org/abs/2308.03281)

## ✅ Testing

Test the entire system:

```bash
# Start dev server
npm run dev

# Test embedding generation (in browser or curl)
curl http://localhost:3001/api/test/embeddings

# Expected: Shows similarity matrix with correct semantic relationships
```

## 🎉 Summary

You now have a fully functional, production-ready embedding system:
- ✅ Free and open source
- ✅ High-quality embeddings (1024 dimensions)
- ✅ Fast batch processing
- ✅ Semantic search capability
- ✅ MongoDB Atlas Vector Search compatible
- ✅ REST API endpoints
- ✅ Tested and verified

The system correctly understands semantic similarity and is ready to power intelligent search and retrieval for your chatbot!
