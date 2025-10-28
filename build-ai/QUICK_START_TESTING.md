# Quick Start: Test Your RAG Chatbot

## ✅ You're Ready to Test!

Your environment is set up with:
- ✅ Gemini API Key configured
- ✅ RAG pipeline implemented
- ✅ Chat interface ready
- ✅ Embedding model: gte-large (1024 dimensions)

## 🚀 Test in 3 Steps

### Step 1: Start the Server

```bash
npm run dev
```

Wait for: `Ready on http://localhost:3000`

### Step 2: Get Your Chatbot ID

**Option A - From Dashboard:**
1. Go to http://localhost:3000/dashboard
2. Copy your chatbot ID from the dashboard

**Option B - From Database:**
```bash
# If you know your chatbot name or need to find it
# You can query MongoDB or check your dashboard
```

### Step 3: Open the Chat Interface

```
http://localhost:3000/chat/YOUR_CHATBOT_ID
```

Replace `YOUR_CHATBOT_ID` with your actual ID.

## 🎯 What to Test

### Basic Chat Flow

1. **Type a question** related to your uploaded documents
2. **Press Enter** or click "Send"
3. **Watch the magic happen:**
   - Query gets optimized
   - Embeddings generated for your query
   - Relevant chunks retrieved from your documents
   - Gemini generates a contextual response
   - Response appears with metadata

### Enable Metadata View

Click **"Show Metadata"** button to see:
- How your query was optimized
- Number of chunks retrieved
- Quality score and confidence level
- Which documents were used
- Token usage
- Processing time

### Try These Test Queries

```
"What are the main features?"
"How much does it cost?"
"What is the refund policy?"
"Can you explain [specific topic from your docs]?"
```

## 📊 What You'll See

### Successful Response Format

```
User: What is your return policy?

Bot: [AI-generated response based on your documents]

📈 3 chunks • high confidence

[When metadata is shown]
Query Optimized: what is your return policy
Retrieval: 5 retrieved, 3 used
Quality Score: 87.5%
Confidence: high
Sources: policy.pdf
Tokens: 1823
Processing Time: 2341ms
```

### Response Quality Indicators

| Confidence | Quality Score | Meaning |
|-----------|---------------|---------|
| **High** | >70% | Excellent match, highly relevant |
| **Medium** | 50-70% | Good match, relevant |
| **Low** | <50% | Poor match, may lack context |

## 🧪 Testing Checklist

Before you start, make sure:

- [ ] Server is running (`npm run dev`)
- [ ] You have a chatbot created
- [ ] Documents are uploaded to your chatbot
- [ ] Embeddings are generated (1024 dimensions)
- [ ] GEMINI_API_KEY is set (already done ✅)

### Quick Pre-Test Verification

```bash
# Check your chatbot ID
CHATBOT_ID="your_chatbot_id_here"

# Test 1: Check embedding status
curl http://localhost:3000/api/chatbots/$CHATBOT_ID/embeddings

# Expected response:
# {
#   "success": true,
#   "stats": {
#     "totalChunks": 150,
#     "chunksWithEmbeddings": 150,
#     "model": "Xenova/gte-large",
#     "dimensions": 1024
#   }
# }
```

## 🎮 Interactive Features

### 1. Clear Chat
Click **"Clear Chat"** to start a fresh conversation

### 2. Show/Hide Metadata
Toggle between simple and detailed view

### 3. Conversation History
The chatbot remembers your conversation context

### 4. Auto-scroll
Messages automatically scroll to the latest

## 🐛 Troubleshooting

### If you see an error:

**"Gemini API key not configured"**
- Your key is already set, restart the server: `Ctrl+C` then `npm run dev`

**"No chunks found"**
- Generate embeddings: `curl -X POST http://localhost:3000/api/chatbots/$CHATBOT_ID/embeddings -H "Content-Type: application/json" -d '{}'`

**"Chatbot not found"**
- Verify your chatbot ID is correct
- Check: http://localhost:3000/dashboard

**Slow first response (10+ seconds)**
- Normal! The embedding model downloads on first use (~300MB)
- Subsequent responses will be fast (2-5 seconds)

## 📝 Example Test Session

```
👤 User: What are your business hours?

🤖 Bot: Based on the information provided, our business hours are
Monday through Friday, 9 AM to 6 PM EST. We are closed on weekends
and major holidays. [Document 1]

📊 Metadata: 2 chunks • high confidence • 2.1s

───────────────────────────────────────────────────

👤 User: Do you offer weekend support?

🤖 Bot: According to our support policy, weekend support is available
for premium plan customers only. Emergency support is available 24/7
for critical issues. [Document 2]

📊 Metadata: 3 chunks • high confidence • 1.8s
```

## 🎯 Success Criteria

Your chatbot is working correctly if:

✅ Responses are relevant to your documents
✅ Quality score is >60%
✅ Confidence level is "medium" or "high"
✅ Sources match your uploaded documents
✅ Processing time is 2-5 seconds
✅ Conversation context is maintained

## 🚀 Next Steps After Testing

Once basic testing works:

1. **Upload more documents** for better coverage
2. **Test edge cases** (questions outside your docs)
3. **Adjust retrieval parameters** (in the API call)
4. **Add custom system prompts** to your chatbot
5. **Test multi-turn conversations**
6. **Optimize for your use case**

## 💡 Pro Tips

### Get Better Responses

1. **Upload comprehensive documents** covering your topic
2. **Use clear, specific questions** for testing
3. **Check quality scores** - add more docs if consistently low
4. **Enable metadata** to understand what's happening
5. **Test conversation flow** with follow-up questions

### Optimize Performance

1. **Adjust chunk retrieval limit** (default: 5)
2. **Set minimum similarity threshold** (default: 0.3)
3. **Use appropriate Gemini model:**
   - `gemini-1.5-flash` - Fast (default)
   - `gemini-1.5-pro` - Best quality

### Testing with CLI

```bash
# Quick test without browser
node test-rag-pipeline.js YOUR_CHATBOT_ID "What is your return policy?"

# Search only (no LLM)
node test-rag-pipeline.js YOUR_CHATBOT_ID "test query" --search-only

# With streaming
node test-rag-pipeline.js YOUR_CHATBOT_ID "test query" --stream
```

## 📚 Additional Resources

- **Full Testing Guide:** `TESTING_GUIDE.md`
- **RAG Pipeline Details:** `RAG_PIPELINE_GUIDE.md`
- **Embedding Setup:** `EMBEDDING_SETUP_GUIDE.md`
- **Model Upgrade Info:** `EMBEDDING_MODEL_UPGRADE.md`

## 🎉 Ready to Test!

Your URL (replace with your actual chatbot ID):
```
http://localhost:3000/chat/YOUR_CHATBOT_ID
```

Start asking questions and see the RAG pipeline in action! 🚀

---

**Need Help?**
- Check terminal logs for detailed pipeline execution
- Open browser DevTools (F12) for debugging
- Review the TESTING_GUIDE.md for detailed troubleshooting
