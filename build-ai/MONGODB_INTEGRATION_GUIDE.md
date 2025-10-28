# MongoDB Dataset Integration Guide

## Overview

The MongoDB Dataset Integration feature allows you to connect to external MongoDB databases, fetch data from collections, and automatically convert it into a format suitable for your RAG chatbot's knowledge base.

## ✅ Implementation Complete

All tasks have been successfully implemented:

1. ✅ Design connection flow for external MongoDB
2. ✅ Create endpoint to accept connection details
3. ✅ Validate connection string format
4. ✅ Test connection to user's database
5. ✅ Fetch data from specified collection
6. ✅ Convert database records to text format
7. ✅ Process and chunk the data

---

## Features

### 1. **Secure Connection Validation**
- Validates MongoDB connection string format
- Blocks localhost and private network addresses (security)
- Tests connection before data import
- Connection strings are never stored

### 2. **Collection Discovery**
- Lists all available collections in database
- Shows collection count and metadata
- Allows manual collection name entry

### 3. **Schema Analysis**
- Analyzes collection structure
- Shows field names and types
- Provides sample document preview
- Helps users understand their data

### 4. **Smart Data Conversion**
- Converts MongoDB documents to readable text
- Handles nested objects and arrays
- Preserves data structure in text format
- Includes collection context

### 5. **Flexible Import Options**
- Set document limit (1-10,000 documents)
- Custom query filtering (optional)
- Field projection support
- Batch processing

### 6. **Automatic Processing**
- Chunks data for RAG retrieval
- Creates searchable text chunks
- Preserves MongoDB document IDs
- Stores metadata for reference

---

## Files Created

### Backend Utilities
**`src/lib/mongoConnector.js`** - Core MongoDB integration logic
- `validateConnectionString()` - Connection string validation
- `testConnection()` - Test database connectivity
- `fetchCollectionData()` - Fetch and convert documents
- `getCollectionSchema()` - Analyze collection structure
- `documentToText()` - Convert MongoDB docs to text

### API Endpoints
**`src/app/api/chatbots/[chatbotId]/mongodb/route.js`**
- `POST /api/chatbots/[chatbotId]/mongodb` - Import data
- `PUT /api/chatbots/[chatbotId]/mongodb/test` - Test connection
- `GET /api/chatbots/[chatbotId]/mongodb/schema` - Get schema

### UI Components
**`src/components/MongoDBConnector.js`** - 4-step wizard interface
- Step 1: Connection details
- Step 2: Collection selection
- Step 3: Data preview
- Step 4: Confirm import

### Integration Points
- ✅ Chatbot detail page (`src/app/dashboard/[id]/page.js`) - Added "MongoDB Import" tab
- ✅ Chatbot creation page (`src/app/dashboard/new/page.js`) - Added MongoDB option

---

## How to Use

### Step-by-Step Guide

#### **Step 1: Connection**
1. Enter your MongoDB connection string:
   ```
   mongodb+srv://username:password@cluster.mongodb.net
   ```
2. Enter database name
3. Click "Test Connection"
4. System verifies connection and lists collections

#### **Step 2: Select Collection**
1. Choose from dropdown (if collections listed)
2. Or manually enter collection name
3. Set document limit (default: 100, max: 10,000)
4. Click "Preview Data"

#### **Step 3: Preview**
1. View detected fields and their types
2. See sample document preview
3. Verify data looks correct
4. Click "Continue to Import"

#### **Step 4: Import**
1. Review import summary
2. Click "Import Data"
3. System fetches and processes documents
4. Data is chunked and added to chatbot

---

## API Documentation

### Test Connection
**PUT** `/api/chatbots/[chatbotId]/mongodb/test`

**Request:**
```json
{
  "connectionString": "mongodb+srv://...",
  "databaseName": "myDatabase"
}
```

**Response (Success):**
```json
{
  "success": true,
  "connectionSuccessful": true,
  "databaseName": "myDatabase",
  "collectionsCount": 5,
  "collections": [
    { "name": "users", "type": "collection" },
    { "name": "products", "type": "collection" }
  ],
  "stats": {
    "dataSize": 1024000,
    "storageSize": 2048000,
    "indexes": 3
  }
}
```

**Response (Error):**
```json
{
  "success": false,
  "connectionSuccessful": false,
  "error": "Authentication failed. Check your username and password."
}
```

### Get Collection Schema
**GET** `/api/chatbots/[chatbotId]/mongodb/schema?connectionString=...&databaseName=...&collectionName=...`

**Response:**
```json
{
  "success": true,
  "fields": [
    { "name": "_id", "type": "object", "sample": "ObjectId(...)" },
    { "name": "name", "type": "string", "sample": "John Doe" },
    { "name": "email", "type": "string", "sample": "john@example.com" },
    { "name": "age", "type": "number", "sample": "30" }
  ],
  "sample": { /* full document */ },
  "sampleText": "Collection: users\n---\n_id: ...\nname: John Doe\n..."
}
```

### Import Data
**POST** `/api/chatbots/[chatbotId]/mongodb`

**Request:**
```json
{
  "connectionString": "mongodb+srv://...",
  "databaseName": "myDatabase",
  "collectionName": "users",
  "limit": 100,
  "query": {}  // optional
}
```

**Response:**
```json
{
  "success": true,
  "document": {
    "_id": "...",
    "filename": "myDatabase.users",
    "type": "application/mongodb",
    "wordCount": 15000,
    "status": "processed",
    "chunkCount": 45
  },
  "importData": {
    "databaseName": "myDatabase",
    "collectionName": "users",
    "totalDocuments": 1000,
    "fetchedDocuments": 100,
    "processedDocuments": 100,
    "totalWords": 15000,
    "chunkCount": 45
  }
}
```

---

## Document Conversion Examples

### Simple Document
**MongoDB:**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "name": "John Doe",
  "email": "john@example.com",
  "age": 30
}
```

**Converted Text:**
```
Collection: users
---
_id: 507f1f77bcf86cd799439011
name: John Doe
email: john@example.com
age: 30
```

### Nested Document
**MongoDB:**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "name": "John Doe",
  "address": {
    "street": "123 Main St",
    "city": "New York",
    "zip": "10001"
  },
  "tags": ["developer", "nodejs"]
}
```

**Converted Text:**
```
Collection: users
---
_id: 507f1f77bcf86cd799439011
name: John Doe
address:
  street: 123 Main St
  city: New York
  zip: 10001
tags: developer, nodejs
```

### Complex Document with Arrays
**MongoDB:**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "product": "Laptop",
  "specs": [
    { "type": "RAM", "value": "16GB" },
    { "type": "CPU", "value": "i7" }
  ]
}
```

**Converted Text:**
```
Collection: products
---
_id: 507f1f77bcf86cd799439011
product: Laptop
specs: (array with 2 items)
  Item 1:
    type: RAM
    value: 16GB
  Item 2:
    type: CPU
    value: i7
```

---

## Security Features

### ✅ Implemented Security Measures

1. **Connection String Validation**
   - Must start with `mongodb://` or `mongodb+srv://`
   - Valid hostname required

2. **Network Protection**
   - Blocks `localhost`
   - Blocks `127.0.0.1`
   - Blocks private IP ranges (192.168.x.x, 10.x.x.x, 172.16-31.x.x)
   - Prevents internal network access

3. **Connection Timeouts**
   - 10-second connection timeout
   - Prevents hanging connections
   - Automatic cleanup on failure

4. **Data Limits**
   - Max 10,000 documents per import
   - Max 1MB per document
   - Total size monitoring

5. **Authentication Required**
   - User must be logged in
   - Must own the chatbot
   - Connection strings never stored

6. **No Credential Storage**
   - Connection strings used only for import
   - Not saved to database
   - Temporary use only

---

## Configuration

### Limits (Can be adjusted in `src/lib/mongoConnector.js`)

```javascript
const CONNECTION_TIMEOUT = 10000;      // 10 seconds
const MAX_DOCUMENTS = 10000;           // Max docs per import
const MAX_DOCUMENT_SIZE = 1000000;     // 1MB per document
```

### Chunk Settings (In API route)

```javascript
const CHUNK_SIZE = 1000;  // Characters per chunk
```

---

## Error Messages & Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| "Connection string must start with mongodb://" | Invalid format | Use proper MongoDB connection string |
| "Cannot connect to local or private network addresses" | Security block | Use cloud MongoDB (Atlas) or public IP |
| "Authentication failed" | Wrong credentials | Check username/password in connection string |
| "Connection timeout" | Server unreachable | Check network, firewall, MongoDB Atlas IP whitelist |
| "Could not find MongoDB server" | Invalid hostname | Verify connection string hostname |
| "Collection is empty" | No documents | Choose different collection or add data |
| "Limit cannot exceed 10000" | Too many docs requested | Reduce limit or import in batches |

---

## Best Practices

### ✅ Recommended

1. **Use MongoDB Atlas** - Cloud-hosted, publicly accessible
2. **Whitelist IPs** - Add your server IP to Atlas IP whitelist
3. **Read-only user** - Create dedicated read-only database user
4. **Start small** - Test with limit=10 first
5. **Preview first** - Always preview before importing
6. **Index collections** - Improves fetch performance
7. **Clean data** - Remove unnecessary fields before import

### ⚠️ Avoid

1. Local MongoDB instances (blocked for security)
2. Importing entire large collections at once
3. Collections with binary data (images, files)
4. Highly nested documents (may not convert well)
5. Using production admin credentials

---

## Use Cases

### 1. **Customer Data**
Import customer records to train chatbot on customer information.

```javascript
Collection: customers
Documents: { name, email, company, notes }
Result: Chatbot can answer questions about customers
```

### 2. **Product Catalog**
Import product database for product support chatbot.

```javascript
Collection: products
Documents: { name, description, specs, price, category }
Result: Chatbot can provide product information
```

### 3. **Knowledge Base**
Import FAQ or knowledge base articles.

```javascript
Collection: articles
Documents: { title, content, category, tags }
Result: Chatbot can answer based on articles
```

### 4. **User Logs/Analytics**
Import activity logs for analysis chatbot.

```javascript
Collection: logs
Documents: { timestamp, user, action, metadata }
Result: Chatbot can provide insights from logs
```

---

## Testing

### Test Connection Strings

**MongoDB Atlas (Recommended):**
```
mongodb+srv://username:password@cluster0.mongodb.net/database
```

**Self-hosted (if publicly accessible):**
```
mongodb://username:password@your-server.com:27017/database
```

### Sample Test Data

Create a test collection with sample documents:

```javascript
// In MongoDB
db.test_data.insertMany([
  {
    title: "Test Article 1",
    content: "This is test content for article 1",
    category: "Testing"
  },
  {
    title: "Test Article 2",
    content: "This is test content for article 2",
    category: "Testing"
  }
]);
```

Then import with:
- Database: your_database
- Collection: test_data
- Limit: 10

---

## Troubleshooting

### Connection Issues

**Problem:** "Connection timeout"
**Solutions:**
- Check MongoDB Atlas IP whitelist
- Verify connection string is correct
- Ensure database is running
- Check network/firewall settings

**Problem:** "Authentication failed"
**Solutions:**
- Verify username/password
- Check database user has read permissions
- Ensure database name is correct

### Import Issues

**Problem:** "No documents found"
**Solutions:**
- Verify collection name is correct
- Check collection actually has data
- Try different query/filter

**Problem:** "Document too large"
**Solutions:**
- Use projection to limit fields
- Break import into smaller batches
- Remove large fields from import

---

## Future Enhancements

Potential improvements:

- [ ] Support for MongoDB aggregation pipelines
- [ ] Custom field selection (projection UI)
- [ ] Query builder interface
- [ ] Scheduled re-imports for data sync
- [ ] Multiple collection import at once
- [ ] Incremental imports (only new documents)
- [ ] MongoDB change streams for real-time updates
- [ ] Connection string encryption/storage
- [ ] Import history and rollback

---

## Summary

The MongoDB Dataset Integration is **fully implemented and ready to use**!

**What's Included:**
- ✅ Secure connection validation
- ✅ Collection discovery and schema analysis
- ✅ Smart document-to-text conversion
- ✅ Automatic chunking for RAG
- ✅ 4-step wizard UI
- ✅ Comprehensive error handling
- ✅ Security measures
- ✅ Full integration with chatbot system

**Access Points:**
- Dashboard → [Chatbot] → "MongoDB Import" tab
- Create Chatbot → Step 4 → "MongoDB" button

Start using it now to import your MongoDB data into your RAG chatbot! 🚀
