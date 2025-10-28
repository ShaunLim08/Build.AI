# Embedding Model Upgrade: gte-small → gte-large

## Summary

The embedding model has been successfully upgraded from **thenlper/gte-small** to **thenlper/gte-large** to match your MongoDB Atlas vector index configuration.

## Changes Made

### Model Specifications

| Aspect | gte-small (Old) | gte-large (New) |
|--------|----------------|-----------------|
| **Dimensions** | 384 | **1024** |
| **Model Size** | ~50MB | ~300MB |
| **First Load Time** | ~2-3s | ~3-5s |
| **Embedding Speed** | ~5ms | ~10-20ms |
| **Quality** | Good | **Better** |
| **Use Case** | Lightweight | High Quality |

### Files Updated

#### 1. Core Library - `src/lib/embeddings.js`
- ✅ Changed model from `Xenova/gte-small` to `Xenova/gte-large`
- ✅ Updated dimension from 384 to 1024
- ✅ Updated model size in comments (~50MB → ~300MB)
- ✅ Updated `getModelInfo()` function to return correct specs

#### 2. API Routes

**`src/app/api/chatbots/[chatbotId]/embeddings/route.js`**
- ✅ Updated POST response: `model: 'Xenova/gte-large'`
- ✅ Updated POST response: `dimensions` (now returns actual embedding length)
- ✅ Updated GET response: `model: 'Xenova/gte-large'`
- ✅ Updated GET response: `dimensions: 1024`
- ✅ Updated console log messages

**`src/app/api/chatbots/[chatbotId]/search/route.js`**
- ✅ Updated response: `model: 'Xenova/gte-large'`

#### 3. Documentation

**`RAG_PIPELINE_GUIDE.md`**
- ✅ Updated architecture diagram
- ✅ Updated model specifications section
- ✅ Updated MongoDB vector index example (dimensions: 1024)

**`EMBEDDING_SETUP_GUIDE.md`**
- ✅ Updated model name throughout
- ✅ Updated dimensions from 384 to 1024
- ✅ Updated model size (~50MB → ~300MB)
- ✅ Updated performance metrics (~5ms → ~10-20ms)
- ✅ Updated all API response examples
- ✅ Updated links to Hugging Face model page

## MongoDB Atlas Vector Index Configuration

Your Atlas vector index should be configured with these settings:

```javascript
{
  "fields": [
    {
      "numDimensions": 1024,  // ✅ Matches gte-large
      "path": "embedding",
      "similarity": "cosine",
      "type": "vector"
    }
  ]
}
```

### Creating the Index (if not already created)

Using MongoDB Shell:
```javascript
db.chunks.createSearchIndex({
  name: "vector_index",
  type: "vectorSearch",
  definition: {
    fields: [
      {
        type: "vector",
        path: "embedding",
        numDimensions: 1024,
        similarity: "cosine"
      }
    ]
  }
});
```

Using Atlas UI:
1. Go to Atlas → Database → Search
2. Click "Create Search Index"
3. Choose "JSON Editor"
4. Use the configuration above
5. Select the `chunks` collection

## Important Notes

### ⚠️ Regenerate Existing Embeddings

If you have existing documents with embeddings generated using gte-small (384 dimensions), you **MUST** regenerate them:

```bash
# Regenerate embeddings for all chunks
curl -X POST http://localhost:3000/api/chatbots/YOUR_CHATBOT_ID/embeddings \
  -H "Content-Type: application/json" \
  -d '{"regenerate": true}'
```

Or for a specific document:
```bash
curl -X POST http://localhost:3000/api/chatbots/YOUR_CHATBOT_ID/embeddings \
  -H "Content-Type: application/json" \
  -d '{"documentId": "YOUR_DOC_ID", "regenerate": true}'
```

### 🔄 Why Regeneration is Required

- Old embeddings are 384 dimensions
- New embeddings are 1024 dimensions
- Cannot mix different dimensions in vector search
- Atlas vector index expects 1024 dimensions

### 💾 Database Migration

If you have many existing documents, consider this approach:

1. **Check current embedding status:**
```javascript
const response = await fetch('/api/chatbots/YOUR_CHATBOT_ID/embeddings');
const { stats } = await response.json();
console.log(stats); // Shows how many chunks have embeddings
```

2. **Delete old 384-dim embeddings (optional):**
```javascript
// In MongoDB Shell
db.chunks.updateMany(
  { "embedding.0": { $exists: true } },
  { $unset: { embedding: "" } }
);
```

3. **Regenerate with new model:**
```javascript
const response = await fetch('/api/chatbots/YOUR_CHATBOT_ID/embeddings', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ regenerate: true })
});
```

## Performance Impact

### Advantages of gte-large
- ✅ **Better Accuracy**: More expressive 1024-dim embeddings
- ✅ **Better Semantic Understanding**: Captures more nuance
- ✅ **Production Ready**: Better for real-world applications
- ✅ **Atlas Compatible**: Matches your vector index configuration

### Trade-offs
- ⚠️ **Larger Model**: 300MB vs 50MB (first download)
- ⚠️ **Slightly Slower**: 10-20ms vs 5ms per embedding
- ⚠️ **More Memory**: ~1GB vs ~500MB in RAM

### Overall Impact
For most applications, the quality improvement far outweighs the minor performance trade-off. The difference in embedding time (5-15ms) is negligible compared to network latency and LLM generation time.

## Testing the Upgrade

### 1. Test Embedding Generation
```bash
node test-rag-pipeline.js YOUR_CHATBOT_ID "test query" --search-only
```

Expected output should show:
- ✅ Model: Xenova/gte-large
- ✅ Embeddings with 1024 dimensions

### 2. Test Full RAG Pipeline
```bash
node test-rag-pipeline.js YOUR_CHATBOT_ID "What is your return policy?"
```

Should work normally with improved semantic understanding.

### 3. Verify Embedding Dimensions
```javascript
const response = await fetch('/api/chatbots/YOUR_CHATBOT_ID/embeddings');
const { stats } = await response.json();
console.log(stats.dimensions); // Should be 1024
```

## Rollback Instructions (If Needed)

If you need to rollback to gte-small for any reason:

1. **Update `src/lib/embeddings.js`:**
   - Change `'Xenova/gte-large'` → `'Xenova/gte-small'`
   - Change dimensions 1024 → 384

2. **Update Atlas Vector Index:**
   - Change `numDimensions: 1024` → `numDimensions: 384`

3. **Regenerate embeddings** with the old model

## Verification Checklist

- ✅ Model changed to gte-large in all files
- ✅ Dimensions updated to 1024 everywhere
- ✅ Documentation updated
- ✅ API responses return correct model info
- ✅ MongoDB Atlas index configured for 1024 dimensions
- ⏳ Existing embeddings regenerated (if applicable)
- ⏳ RAG pipeline tested end-to-end

## Next Steps

1. **Test the embedding generation:**
   ```bash
   npm run dev
   # Upload a test document and generate embeddings
   ```

2. **Verify embeddings are working:**
   ```bash
   # Check that embeddings have correct dimensions
   curl http://localhost:3000/api/chatbots/YOUR_CHATBOT_ID/embeddings
   ```

3. **Test semantic search:**
   ```bash
   node test-rag-pipeline.js YOUR_CHATBOT_ID "sample query" --search-only
   ```

4. **Test complete RAG pipeline:**
   ```bash
   # Make sure GEMINI_API_KEY is set in .env.local
   node test-rag-pipeline.js YOUR_CHATBOT_ID "sample query"
   ```

## Support

If you encounter any issues:

1. **Dimension mismatch errors**: Make sure Atlas index is configured for 1024 dimensions
2. **Old embeddings**: Delete and regenerate all embeddings
3. **Model download issues**: Check internet connection; model is ~300MB
4. **Memory issues**: gte-large requires more RAM (~1GB)

## References

- [thenlper/gte-large on Hugging Face](https://huggingface.co/thenlper/gte-large)
- [MongoDB Atlas Vector Search](https://www.mongodb.com/docs/atlas/atlas-vector-search/)
- [Transformers.js Documentation](https://huggingface.co/docs/transformers.js)
