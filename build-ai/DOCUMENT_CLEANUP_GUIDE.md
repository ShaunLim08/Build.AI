# Document Cleanup & Deletion Guide

## ✅ Problem Fixed!

The document deletion functionality has been fixed. You can now:
- ✅ Delete documents from the dashboard UI
- ✅ Automatically delete associated chunks and embeddings
- ✅ Clean up orphaned documents from the database

## 🔧 What Was Fixed

### 1. **Delete Button Now Works**
   - Added `onClick` handler to the trash icon
   - Implemented `handleDeleteDocument` function
   - Added confirmation dialog before deletion

### 2. **Created DELETE API Endpoint**
   - New route: `/api/chatbots/[chatbotId]/documents/[documentId]`
   - Deletes document, chunks, and physical file
   - Includes proper authentication and authorization

### 3. **Cleanup Script for Orphaned Documents**
   - Script to remove documents without chunks
   - Useful after manual database operations

## 🗑️ How to Delete Documents (UI)

### Via Dashboard:

1. Go to: `http://localhost:3000/dashboard/YOUR_CHATBOT_ID`
2. Click the **"Documents"** tab
3. Find the document you want to delete
4. Click the **trash icon** (🗑️) next to the document
5. Confirm the deletion in the popup
6. Document, chunks, and embeddings are deleted!

## 🧹 Clean Up Orphaned Documents (Script)

Since you already deleted chunks from MongoDB, use this script to remove the orphaned document records:

### Step 1: Run the Cleanup Script

```bash
node cleanup-orphaned-documents.js 68f7039782260da3dcb4a736
```

Replace with your chatbot ID.

### What It Does:

1. ✅ Connects to your MongoDB database
2. ✅ Finds all documents for your chatbot
3. ✅ Checks which documents have 0 chunks (orphaned)
4. ✅ Deletes orphaned document records
5. ✅ Shows summary of what was cleaned up

### Expected Output:

```
================================================================================
🧹 CLEANING UP ORPHANED DOCUMENTS
================================================================================

📋 Chatbot ID: 68f7039782260da3dcb4a736
🔌 Connecting to MongoDB...
✅ Connected to MongoDB

📊 Step 1: Finding documents for this chatbot...

Found 3 documents total

🔍 Step 2: Checking for orphaned documents...

❌ Orphaned: document1.pdf (507f1f77bcf86cd799439011) - 0 chunks
❌ Orphaned: document2.pdf (507f1f77bcf86cd799439012) - 0 chunks
✅ Valid: document3.pdf - 25 chunks

📊 Summary:
   Total documents: 3
   Valid documents: 1
   Orphaned documents: 2

🗑️  Step 3: Deleting orphaned documents...

✅ Deleted 2 orphaned documents

📝 Deleted documents:
   1. document1.pdf
   2. document2.pdf

✅ Cleanup complete!
================================================================================
```

## 📤 Uploading New Documents

After cleanup, you can upload fresh documents:

### Via Dashboard UI:

1. Go to: `http://localhost:3000/dashboard/68f7039782260da3dcb4a736`
2. Click **"Upload Files"** tab
3. Drag & drop or click to select files
4. Wait for processing
5. Switch to **"Documents"** tab to see your new documents

### Generate Embeddings:

After uploading, generate embeddings:

```bash
node regenerate-embeddings.js 68f7039782260da3dcb4a736
```

Or use the API:

```bash
curl -X POST http://localhost:3000/api/chatbots/68f7039782260da3dcb4a736/embeddings \
  -H "Content-Type: application/json" \
  -d '{"batchSize": 16}'
```

## 🔄 Complete Workflow

### Starting Fresh:

```bash
# 1. Clean up orphaned documents
node cleanup-orphaned-documents.js YOUR_CHATBOT_ID

# 2. Upload new documents via dashboard UI
# (Go to http://localhost:3000/dashboard/YOUR_CHATBOT_ID)

# 3. Generate embeddings
node regenerate-embeddings.js YOUR_CHATBOT_ID

# 4. Test the chatbot
# (Go to http://localhost:3000/chat/YOUR_CHATBOT_ID)
```

## 📊 Document Deletion Details

### What Gets Deleted:

When you delete a document through the UI or API:

1. ✅ **Document record** from `documents` collection
2. ✅ **All chunks** from `chunks` collection
3. ✅ **All embeddings** associated with those chunks
4. ✅ **Physical file** from `/public/uploads/` (if exists)

### Safe to Delete:

- Documents you no longer need
- Duplicates
- Test documents
- Outdated information

### NOT Safe to Delete:

- Documents that are currently being referenced
- Your only source of important information

## 🎯 Quick Commands

```bash
# Clean up orphaned documents
node cleanup-orphaned-documents.js 68f7039782260da3dcb4a736

# Check embedding status
curl http://localhost:3000/api/chatbots/68f7039782260da3dcb4a736/embeddings

# Generate embeddings
node regenerate-embeddings.js 68f7039782260da3dcb4a736

# Test chatbot
# Visit: http://localhost:3000/chat/68f7039782260da3dcb4a736
```

## ⚠️ Important Notes

### Before Deleting Documents:

- Make sure you have backups if needed
- Deletion is permanent (cannot be undone)
- Associated chunks and embeddings are also deleted

### After Deleting Chunks Manually:

If you manually delete chunks from MongoDB (like you did):

1. Run the cleanup script to remove orphaned documents
2. Upload new documents
3. Generate embeddings for the new documents
4. Test your chatbot

### Database Consistency:

The cleanup script ensures:
- No documents without chunks
- No orphaned records
- Clean database state

## 🔍 Troubleshooting

### "Document not found" error
**Solution:** Document may have already been deleted. Refresh the page.

### Delete button doesn't respond
**Solution:**
- Make sure you're logged in
- Restart the dev server
- Check browser console for errors

### Cleanup script fails
**Solution:**
- Check MONGODB_URI in .env.local
- Verify chatbot ID is correct
- Check MongoDB connection

### Documents still showing after deletion
**Solution:**
- Refresh the page
- Check if deletion succeeded in terminal logs
- Run cleanup script if needed

## ✅ Testing Document Management

### Test the Complete Flow:

1. **Upload a test document:**
   - Go to dashboard → Upload Files
   - Upload a small PDF or TXT file
   - Wait for processing

2. **Generate embeddings:**
   ```bash
   node regenerate-embeddings.js YOUR_CHATBOT_ID
   ```

3. **Test the chatbot:**
   - Go to chat interface
   - Ask a question about the document
   - Verify it retrieves information

4. **Delete the document:**
   - Go to dashboard → Documents
   - Click trash icon
   - Confirm deletion

5. **Verify deletion:**
   - Document should disappear from list
   - Chunks should be deleted from database
   - Chatbot can no longer access that information

## 📚 Next Steps

After cleaning up:

1. ✅ Upload your production documents
2. ✅ Generate embeddings (1024 dimensions with gte-large)
3. ✅ Test the chatbot with real queries
4. ✅ Use the delete button when you need to remove documents
5. ✅ Keep your knowledge base up to date

---

**Your document management system is now fully functional!** 🎉
