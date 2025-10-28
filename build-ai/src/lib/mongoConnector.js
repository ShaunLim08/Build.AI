import { MongoClient } from 'mongodb';

/**
 * Configuration
 */
const CONNECTION_TIMEOUT = 10000; // 10 seconds
const MAX_DOCUMENTS = 10000; // Max documents to fetch per collection
const MAX_DOCUMENT_SIZE = 1000000; // 1MB per document

/**
 * Validates MongoDB connection string format
 */
export function validateConnectionString(connectionString) {
  const errors = [];

  if (!connectionString || typeof connectionString !== 'string') {
    errors.push('Connection string is required');
    return { valid: false, errors };
  }

  connectionString = connectionString.trim();

  // Check if it starts with mongodb:// or mongodb+srv://
  if (!connectionString.startsWith('mongodb://') && !connectionString.startsWith('mongodb+srv://')) {
    errors.push('Connection string must start with "mongodb://" or "mongodb+srv://"');
  }

  // Check for localhost/private IPs (security)
  const lowercaseString = connectionString.toLowerCase();
  const dangerousPatterns = [
    'localhost',
    '127.0.0.1',
    '0.0.0.0',
    '192.168.',
    '10.0.',
    '172.16.',
  ];

  for (const pattern of dangerousPatterns) {
    if (lowercaseString.includes(pattern)) {
      errors.push(`Cannot connect to local or private network addresses (found: ${pattern})`);
      break;
    }
  }

  // Basic format validation
  try {
    const url = new URL(connectionString.replace('mongodb+srv://', 'https://').replace('mongodb://', 'https://'));
    if (!url.hostname) {
      errors.push('Invalid connection string format: missing hostname');
    }
  } catch (error) {
    errors.push('Invalid connection string format');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Tests connection to MongoDB database
 */
export async function testConnection(connectionString, databaseName) {
  let client;

  try {
    console.log(`\n🔌 Testing MongoDB connection...`);
    console.log(`   Database: ${databaseName}`);

    // Create client with timeout
    client = new MongoClient(connectionString, {
      serverSelectionTimeoutMS: CONNECTION_TIMEOUT,
      connectTimeoutMS: CONNECTION_TIMEOUT,
    });

    // Connect
    await client.connect();
    console.log(`✓ Connected successfully`);

    // Access database
    const db = client.db(databaseName);

    // List collections to verify access
    const collections = await db.listCollections().toArray();
    console.log(`✓ Found ${collections.length} collections`);

    // Get database stats
    const stats = await db.stats();

    return {
      success: true,
      connectionSuccessful: true,
      databaseName,
      collectionsCount: collections.length,
      collections: collections.map(c => ({
        name: c.name,
        type: c.type,
      })),
      stats: {
        dataSize: stats.dataSize,
        storageSize: stats.storageSize,
        indexes: stats.indexes,
      },
    };

  } catch (error) {
    console.error('MongoDB connection error:', error);

    let errorMessage = 'Failed to connect to MongoDB';

    if (error.message.includes('ENOTFOUND') || error.message.includes('getaddrinfo')) {
      errorMessage = 'Could not find MongoDB server. Check your connection string.';
    } else if (error.message.includes('authentication failed')) {
      errorMessage = 'Authentication failed. Check your username and password.';
    } else if (error.message.includes('timeout')) {
      errorMessage = 'Connection timeout. Server may be unreachable or too slow.';
    } else if (error.message.includes('ECONNREFUSED')) {
      errorMessage = 'Connection refused. Server may not be running.';
    } else {
      errorMessage = error.message;
    }

    return {
      success: false,
      connectionSuccessful: false,
      error: errorMessage,
    };

  } finally {
    if (client) {
      await client.close();
    }
  }
}

/**
 * Converts a MongoDB document to readable text
 */
function documentToText(doc, collectionName) {
  const lines = [];

  // Add collection context
  lines.push(`Collection: ${collectionName}`);
  lines.push('---');

  // Convert document to key-value pairs
  function processValue(key, value, indent = 0) {
    const prefix = '  '.repeat(indent);

    if (value === null || value === undefined) {
      lines.push(`${prefix}${key}: (empty)`);
    } else if (typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
      // Nested object
      if (value._bsontype === 'ObjectID' || value.toString().match(/^[a-f\d]{24}$/i)) {
        lines.push(`${prefix}${key}: ${value.toString()}`);
      } else {
        lines.push(`${prefix}${key}:`);
        Object.entries(value).forEach(([k, v]) => processValue(k, v, indent + 1));
      }
    } else if (Array.isArray(value)) {
      // Array
      if (value.length === 0) {
        lines.push(`${prefix}${key}: (empty array)`);
      } else if (typeof value[0] === 'object') {
        lines.push(`${prefix}${key}: (array with ${value.length} items)`);
        value.forEach((item, i) => {
          lines.push(`${prefix}  Item ${i + 1}:`);
          Object.entries(item).forEach(([k, v]) => processValue(k, v, indent + 2));
        });
      } else {
        lines.push(`${prefix}${key}: ${value.join(', ')}`);
      }
    } else if (value instanceof Date) {
      lines.push(`${prefix}${key}: ${value.toISOString()}`);
    } else {
      // Primitive value
      lines.push(`${prefix}${key}: ${value}`);
    }
  }

  // Process all fields in document
  Object.entries(doc).forEach(([key, value]) => {
    processValue(key, value);
  });

  return lines.join('\n');
}

/**
 * Fetches data from a MongoDB collection
 */
export async function fetchCollectionData(connectionString, databaseName, collectionName, options = {}) {
  let client;

  try {
    const {
      limit = 100,
      query = {},
      projection = {},
    } = options;

    console.log(`\n📊 Fetching data from MongoDB...`);
    console.log(`   Database: ${databaseName}`);
    console.log(`   Collection: ${collectionName}`);
    console.log(`   Limit: ${limit}`);

    // Validate limit
    if (limit > MAX_DOCUMENTS) {
      throw new Error(`Limit cannot exceed ${MAX_DOCUMENTS} documents`);
    }

    // Connect
    client = new MongoClient(connectionString, {
      serverSelectionTimeoutMS: CONNECTION_TIMEOUT,
      connectTimeoutMS: CONNECTION_TIMEOUT,
    });

    await client.connect();
    console.log(`✓ Connected successfully`);

    const db = client.db(databaseName);
    const collection = db.collection(collectionName);

    // Get collection stats
    const count = await collection.countDocuments(query);
    console.log(`✓ Found ${count} documents matching query`);

    // Fetch documents
    const documents = await collection
      .find(query, { projection })
      .limit(limit)
      .toArray();

    console.log(`✓ Fetched ${documents.length} documents`);

    // Convert documents to text
    const textDocuments = [];
    let totalSize = 0;

    for (const doc of documents) {
      const text = documentToText(doc, collectionName);
      const size = Buffer.byteLength(text, 'utf8');

      // Check document size
      if (size > MAX_DOCUMENT_SIZE) {
        console.warn(`⚠️  Document too large (${size} bytes), skipping`);
        continue;
      }

      totalSize += size;
      textDocuments.push({
        text,
        size,
        wordCount: text.split(/\s+/).filter(w => w.length > 0).length,
        documentId: doc._id?.toString() || 'unknown',
      });
    }

    console.log(`✓ Converted ${textDocuments.length} documents to text`);
    console.log(`   Total size: ${(totalSize / 1024).toFixed(2)} KB`);
    console.log(`   Total words: ${textDocuments.reduce((sum, d) => sum + d.wordCount, 0).toLocaleString()}`);

    return {
      success: true,
      collectionName,
      totalDocuments: count,
      fetchedDocuments: documents.length,
      processedDocuments: textDocuments.length,
      documents: textDocuments,
      totalSize,
      totalWords: textDocuments.reduce((sum, d) => sum + d.wordCount, 0),
    };

  } catch (error) {
    console.error('MongoDB fetch error:', error);
    throw error;

  } finally {
    if (client) {
      await client.close();
    }
  }
}

/**
 * Fetches data from multiple collections
 */
export async function fetchMultipleCollections(connectionString, databaseName, collectionNames, options = {}) {
  const results = [];
  const errors = [];

  for (const collectionName of collectionNames) {
    try {
      const result = await fetchCollectionData(connectionString, databaseName, collectionName, options);
      results.push({
        success: true,
        collectionName,
        data: result,
      });
    } catch (error) {
      console.error(`Failed to fetch collection ${collectionName}:`, error);
      errors.push({
        collectionName,
        error: error.message,
      });
      results.push({
        success: false,
        collectionName,
        error: error.message,
      });
    }
  }

  return {
    results,
    errors,
    successCount: results.filter(r => r.success).length,
    errorCount: errors.length,
  };
}

/**
 * Gets collection schema/sample
 */
export async function getCollectionSchema(connectionString, databaseName, collectionName) {
  let client;

  try {
    console.log(`\n🔍 Analyzing collection schema...`);

    client = new MongoClient(connectionString, {
      serverSelectionTimeoutMS: CONNECTION_TIMEOUT,
      connectTimeoutMS: CONNECTION_TIMEOUT,
    });

    await client.connect();

    const db = client.db(databaseName);
    const collection = db.collection(collectionName);

    // Get a sample document
    const sampleDoc = await collection.findOne();

    if (!sampleDoc) {
      return {
        success: true,
        fields: [],
        sample: null,
        message: 'Collection is empty',
      };
    }

    // Extract field names and types
    function getFieldsRecursive(obj, prefix = '') {
      const fields = [];

      for (const [key, value] of Object.entries(obj)) {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        const type = Array.isArray(value) ? 'array' :
                    value instanceof Date ? 'date' :
                    value === null ? 'null' :
                    typeof value === 'object' ? 'object' :
                    typeof value;

        fields.push({
          name: fullKey,
          type,
          sample: Array.isArray(value) ? `[${value.length} items]` :
                 typeof value === 'object' && value !== null ? '{...}' :
                 String(value).substring(0, 50),
        });

        // Recurse for nested objects (but not too deep)
        if (typeof value === 'object' && value !== null && !Array.isArray(value) && prefix.split('.').length < 2) {
          fields.push(...getFieldsRecursive(value, fullKey));
        }
      }

      return fields;
    }

    const fields = getFieldsRecursive(sampleDoc);

    console.log(`✓ Found ${fields.length} fields`);

    return {
      success: true,
      fields,
      sample: sampleDoc,
      sampleText: documentToText(sampleDoc, collectionName),
    };

  } catch (error) {
    console.error('Schema analysis error:', error);
    throw error;

  } finally {
    if (client) {
      await client.close();
    }
  }
}
