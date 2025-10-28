# Testing the RAG Chatbot - Complete Guide

## Prerequisites

Before testing, ensure you have:

1. ✅ MongoDB connection configured
2. ✅ At least one chatbot created
3. ✅ Documents uploaded and processed
4. ✅ Embeddings generated for your documents
5. ✅ Gemini API key configured

## Step-by-Step Testing Guide

### 1. Set Up Environment Variables

First, make sure your `.env.local` file is properly configured:

```bash
# Copy the example file if you haven't already
cp .env.local.example .env.local
```

Edit `.env.local` and add your credentials:

```bash
# MongoDB Connection (Required)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/

# Gemini API Key (Required for chat)
GEMINI_API_KEY=your_actual_gemini_api_key_here

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

#### Getting a Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the key and paste it into `.env.local`

### 2. Start the Development Server

```bash
npm run dev
```

The server should start at `http://localhost:3000`

### 3. Prepare Your Chatbot

#### Option A: Using an Existing Chatbot

If you already have a chatbot with documents:

1. Go to `http://localhost:3000/dashboard`
2. Note the chatbot ID from your dashboard
3. Skip to Step 4

#### Option B: Creating a New Test Chatbot

1. Navigate to `http://localhost:3000/dashboard/new`
2. Create a new chatbot (note the ID)
3. Upload test documents
4. Generate embeddings

**Quick Test Document Upload:**

```bash
# Upload a test document
curl -X POST http://localhost:3000/api/chatbots/YOUR_CHATBOT_ID/documents \
  -F "file=@path/to/your/document.pdf"
```

**Generate Embeddings:**

```bash
# Generate embeddings for all documents
curl -X POST http://localhost:3000/api/chatbots/YOUR_CHATBOT_ID/embeddings \
  -H "Content-Type: application/json" \
  -d '{}'
```

### 4. Test the Chat Interface

#### Method 1: Browser UI

1. Navigate to: `http://localhost:3000/chat/YOUR_CHATBOT_ID`
   - Replace `YOUR_CHATBOT_ID` with your actual chatbot ID

2. You should see:
   - Chat interface with welcome message
   - Input field at the bottom
   - Header with "Show Metadata" and "Clear Chat" buttons

3. Type a test message and press Enter or click "Send"

4. The chatbot should:
   - Show a "Thinking..." indicator
   - Retrieve relevant chunks from your documents
   - Generate a response using Gemini
   - Display the response with metadata

5. Click "Show Metadata" to see:
   - Query optimization
   - Chunks retrieved/used
   - Quality score and confidence
   - Sources
   - Token usage
   - Processing time

#### Method 2: Command Line Test

Use the test script:

```bash
# Test search functionality only
node test-rag-pipeline.js YOUR_CHATBOT_ID "What is your return policy?" --search-only

# Test complete RAG pipeline
node test-rag-pipeline.js YOUR_CHATBOT_ID "What is your return policy?"

# Test with streaming
node test-rag-pipeline.js YOUR_CHATBOT_ID "Explain the pricing" --stream
```

#### Method 3: API Testing with curl

**Test Search Endpoint:**
```bash
curl -X POST http://localhost:3000/api/chatbots/YOUR_CHATBOT_ID/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What is your return policy?",
    "limit": 5
  }'
```

**Test Chat Endpoint:**
```bash
curl -X POST http://localhost:3000/api/chatbots/YOUR_CHATBOT_ID/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What is your return policy?"
  }'
```

### 5. Understanding the Response

A successful chat response includes:

```javascript
{
  "success": true,
  "response": "Based on the provided context...", // The actual answer
  "metadata": {
    "chatbotId": "...",
    "query": "What is your return policy?",
    "optimizedQuery": "what is your return policy", // Cleaned query
    "retrieval": {
      "chunksRetrieved": 5,
      "chunksUsed": 3,
      "sources": ["document1.pdf", "faq.txt"],
      "metrics": {
        "qualityScore": 0.85,
        "confidence": "high",
        "averageSimilarity": 0.82,
        "maxSimilarity": 0.92
      }
    },
    "generation": {
      "model": "gemini-1.5-flash",
      "usage": {
        "promptTokens": 1234,
        "completionTokens": 567,
        "totalTokens": 1801
      }
    },
    "citations": [1, 2],
    "processingTime": 2500,  // milliseconds
    "timestamp": "2025-01-01T12:00:00.000Z"
  }
}
```

### 6. Test Scenarios

#### Scenario 1: Simple Question
**Query:** "What are your business hours?"
**Expected:** Should retrieve and cite relevant documents

#### Scenario 2: Multi-Turn Conversation
1. **First:** "What services do you offer?"
2. **Second:** "How much does the premium plan cost?"
3. **Third:** "What's included in it?"

The chatbot should maintain context across turns.

#### Scenario 3: Question Without Context
**Query:** "What is quantum physics?"
**Expected:** Should indicate limited context and use general knowledge

#### Scenario 4: Complex Query
**Query:** "Compare the features of your basic and premium plans, and explain which is better for small businesses"
**Expected:** Should retrieve multiple chunks and provide comprehensive answer

### 7. Verify Metadata

When "Show Metadata" is enabled, verify:

- ✅ **Query Optimized:** Should remove filler words
- ✅ **Chunks Retrieved/Used:** Should show how many documents were found
- ✅ **Quality Score:** Higher is better (70%+ is good)
- ✅ **Confidence:** Should be "high", "medium", or "low"
- ✅ **Sources:** Should list your uploaded documents
- ✅ **Processing Time:** Typically 2-5 seconds

### 8. Common Issues and Solutions

#### Issue 1: "GEMINI_API_KEY not configured"
**Solution:**
- Check `.env.local` has `GEMINI_API_KEY=your_key`
- Restart the dev server (`npm run dev`)
- Verify the key is valid at [Google AI Studio](https://makersuite.google.com/app/apikey)

#### Issue 2: "No chunks found" or "0 chunks used"
**Solution:**
- Verify documents are uploaded: `GET /api/chatbots/[id]/documents`
- Generate embeddings: `POST /api/chatbots/[id]/embeddings`
- Check embedding status: `GET /api/chatbots/[id]/embeddings`

#### Issue 3: Low Quality Score (<50%)
**Solution:**
- Query may not match document content well
- Try more specific queries
- Add more relevant documents
- Check documents are properly chunked

#### Issue 4: Slow Response Times (>10 seconds)
**Solution:**
- First run: Model downloads (~300MB), this is normal
- Reduce `limit` in retrieval options (default: 5)
- Use `gemini-1.5-flash` instead of Pro
- Check network connection

#### Issue 5: MongoDB Connection Error
**Solution:**
- Verify `MONGODB_URI` in `.env.local`
- Check MongoDB Atlas IP whitelist (allow your IP)
- Ensure database name is correct
- Test connection: `node -e "require('mongodb').MongoClient.connect(process.env.MONGODB_URI).then(() => console.log('OK'))"`

### 9. Performance Benchmarks

Expected performance metrics:

| Stage | Time | Notes |
|-------|------|-------|
| **Query Optimization** | <10ms | Instant |
| **Embedding Generation** | 100-300ms | First run: 3-5s (model load) |
| **Semantic Search** | 50-200ms | Depends on chunk count |
| **Context Building** | <50ms | Fast |
| **Gemini API Call** | 1-3s | Network dependent |
| **Total Pipeline** | 2-5s | Typical end-to-end |

### 10. Debugging Tips

#### Enable Verbose Logging

The chat endpoint already logs detailed information. Check your terminal for:

```
================================================================================
🤖 RAG PIPELINE STARTED
================================================================================
📋 Chatbot ID: ...
💬 User Query: "..."
...
```

#### Check Browser Console

Open browser DevTools (F12) and check:
- Network tab for API requests/responses
- Console tab for any JavaScript errors

#### Test Individual Components

1. **Test Embeddings:**
```bash
curl http://localhost:3000/api/chatbots/YOUR_ID/embeddings
# Should show stats with dimensions: 1024
```

2. **Test Search:**
```bash
curl -X POST http://localhost:3000/api/chatbots/YOUR_ID/search \
  -H "Content-Type: application/json" \
  -d '{"query": "test"}'
# Should return relevant chunks
```

3. **Test Chatbot Endpoint:**
```bash
curl http://localhost:3000/api/chatbots/YOUR_ID
# Should return chatbot details
```

### 11. Advanced Testing

#### Load Testing

Test with multiple concurrent requests:

```javascript
// test-load.js
async function loadTest(chatbotId, queries) {
  const results = await Promise.all(
    queries.map(query =>
      fetch(`http://localhost:3000/api/chatbots/${chatbotId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: query })
      }).then(r => r.json())
    )
  );
  console.log('All requests completed:', results.length);
}

loadTest('YOUR_ID', [
  'What are your hours?',
  'What services do you offer?',
  'How much does it cost?'
]);
```

#### Quality Testing

Measure response quality:

1. Ask the same question multiple times
2. Check consistency of answers
3. Verify citations are correct
4. Ensure no hallucinations

### 12. Checklist Before Going Live

- [ ] Environment variables set in production
- [ ] MongoDB connection secured
- [ ] Gemini API key valid and funded
- [ ] All documents uploaded and embedded
- [ ] Tested multiple query types
- [ ] Verified response quality
- [ ] Checked performance benchmarks
- [ ] Error handling tested
- [ ] Rate limiting considered
- [ ] User authentication enabled (if needed)

## Quick Test Commands

```bash
# 1. Check environment
cat .env.local | grep GEMINI_API_KEY

# 2. Start server
npm run dev

# 3. Get chatbot ID (from dashboard or database)
# Then test:
CHATBOT_ID="your_chatbot_id_here"

# 4. Test search
node test-rag-pipeline.js $CHATBOT_ID "test query" --search-only

# 5. Test complete RAG
node test-rag-pipeline.js $CHATBOT_ID "test query"

# 6. Open browser
# Navigate to: http://localhost:3000/chat/$CHATBOT_ID
```

## Example Test Session

```
User: What is your return policy?

Bot: Based on our return policy document, you can return items within
30 days of purchase for a full refund. Items must be in original
condition with tags attached. [Document 1]

Metadata:
- Chunks used: 3
- Confidence: high
- Quality score: 87.5%
- Sources: returns-policy.pdf
- Processing time: 2341ms
- Tokens: 1823 (1245 prompt + 578 completion)

User: Can I return sale items?

Bot: According to our policy, sale items are final sale and cannot
be returned or exchanged, except if they arrive damaged or defective.
[Document 1]

Metadata:
- Chunks used: 2
- Confidence: high
- Quality score: 91.2%
- Sources: returns-policy.pdf
- Processing time: 1987ms
```

## Support

If you encounter issues:

1. Check this guide first
2. Review the terminal logs
3. Check browser console
4. Verify environment variables
5. Test individual components
6. Check documentation in `RAG_PIPELINE_GUIDE.md`

## Next Steps

After successful testing:

1. Upload your production documents
2. Generate embeddings for all documents
3. Test with real-world queries
4. Optimize retrieval parameters
5. Add custom system prompts
6. Implement user authentication
7. Deploy to production

Happy testing! 🚀
