import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { Document } from '@/models/Document';
import { Chunk } from '@/models/Chunk';
import { Chatbot } from '@/models/Chatbot';
import {
  validateConnectionString,
  testConnection,
  fetchCollectionData,
  getCollectionSchema,
} from '@/lib/mongoConnector';
import { ObjectId } from 'mongodb';

export const runtime = 'nodejs';

// Configuration
const CHUNK_SIZE = 1000; // Characters per chunk

/**
 * Splits text into chunks for vector embedding
 */
function splitTextIntoChunks(text, source, chunkSize = CHUNK_SIZE) {
  const chunks = [];
  let currentChunk = '';
  let chunkIndex = 0;

  // Split by newlines and sentences
  const lines = text.split('\n');

  for (const line of lines) {
    if ((currentChunk + '\n' + line).length > chunkSize && currentChunk.length > 0) {
      chunks.push({
        text: currentChunk.trim(),
        metadata: {
          source,
          chunkIndex: chunkIndex++,
          type: 'mongodb',
        }
      });
      currentChunk = line;
    } else {
      currentChunk += (currentChunk.length > 0 ? '\n' : '') + line;
    }
  }

  // Add remaining chunk
  if (currentChunk.trim().length > 0) {
    chunks.push({
      text: currentChunk.trim(),
      metadata: {
        source,
        chunkIndex: chunkIndex++,
        type: 'mongodb',
      }
    });
  }

  return chunks;
}

/**
 * POST /api/chatbots/[chatbotId]/mongodb
 * Import data from external MongoDB database
 */
export async function POST(request, { params }) {
  try {
    // Authenticate user
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Await params (required in Next.js 15)
    const { chatbotId } = await params;

    // Verify chatbot exists and belongs to user
    const chatbot = await Chatbot.findById(chatbotId);
    if (!chatbot) {
      return NextResponse.json(
        { error: 'Chatbot not found' },
        { status: 404 }
      );
    }

    if (chatbot.userId.toString() !== user._id.toString()) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const {
      connectionString,
      databaseName,
      collectionName,
      limit = 100,
      query = {},
    } = body;

    // Validate required fields
    if (!connectionString || !databaseName || !collectionName) {
      return NextResponse.json(
        {
          error: 'Missing required fields',
          required: ['connectionString', 'databaseName', 'collectionName'],
        },
        { status: 400 }
      );
    }

    // Validate connection string
    const validation = validateConnectionString(connectionString);
    if (!validation.valid) {
      return NextResponse.json(
        { error: `Invalid connection string: ${validation.errors.join(', ')}` },
        { status: 400 }
      );
    }

    console.log(`\n📄 Processing MongoDB data import for chatbot: ${chatbot.name}`);
    console.log(`   Database: ${databaseName}`);
    console.log(`   Collection: ${collectionName}`);
    console.log(`   Limit: ${limit}`);

    // Fetch data from MongoDB
    let fetchResult;
    try {
      fetchResult = await fetchCollectionData(
        connectionString,
        databaseName,
        collectionName,
        { limit, query }
      );
    } catch (error) {
      console.error('MongoDB fetch error:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to fetch data from MongoDB' },
        { status: 400 }
      );
    }

    if (!fetchResult.success || fetchResult.documents.length === 0) {
      return NextResponse.json(
        { error: 'No documents found or unable to fetch data' },
        { status: 400 }
      );
    }

    // Create document record
    const document = await Document.create({
      chatbotId: new ObjectId(chatbotId),
      filename: `${databaseName}.${collectionName}`,
      type: 'application/mongodb',
      url: `mongodb://${databaseName}/${collectionName}`,
      pageCount: fetchResult.processedDocuments,
      wordCount: fetchResult.totalWords,
      status: 'processing',
      metadata: {
        databaseName,
        collectionName,
        totalDocuments: fetchResult.totalDocuments,
        fetchedDocuments: fetchResult.fetchedDocuments,
        importedAt: new Date(),
      },
    });

    console.log(`\n📊 Document record created: ${document._id}`);

    // Process each MongoDB document
    let totalChunks = 0;
    const chunkRecords = [];

    for (const mongoDoc of fetchResult.documents) {
      // Split into chunks
      const textChunks = splitTextIntoChunks(
        mongoDoc.text,
        `${collectionName}:${mongoDoc.documentId}`
      );

      // Create chunk records
      for (const chunk of textChunks) {
        chunkRecords.push({
          chatbotId: new ObjectId(chatbotId),
          documentId: document._id,
          text: chunk.text,
          embedding: [], // Placeholder
          metadata: {
            ...chunk.metadata,
            mongoDocumentId: mongoDoc.documentId,
            databaseName,
            collectionName,
          },
        });
      }

      totalChunks += textChunks.length;
    }

    console.log(`\n✂️ Created ${totalChunks} chunks from ${fetchResult.documents.length} documents`);

    // Save chunks to database
    if (chunkRecords.length > 0) {
      await Chunk.createMany(chunkRecords);
      console.log(`✅ ${chunkRecords.length} chunks saved to MongoDB\n`);
    }

    // Update document status
    await Document.updateStatus(document._id, 'processed', {
      chunkCount: chunkRecords.length,
    });

    return NextResponse.json({
      success: true,
      document: {
        ...document,
        status: 'processed',
        chunkCount: chunkRecords.length,
      },
      importData: {
        databaseName,
        collectionName,
        totalDocuments: fetchResult.totalDocuments,
        fetchedDocuments: fetchResult.fetchedDocuments,
        processedDocuments: fetchResult.processedDocuments,
        totalWords: fetchResult.totalWords,
        chunkCount: chunkRecords.length,
      },
    }, { status: 201 });

  } catch (error) {
    console.error('MongoDB import error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to import MongoDB data' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/chatbots/[chatbotId]/mongodb/test
 * Test connection to external MongoDB database
 */
export async function PUT(request, { params }) {
  try {
    // Authenticate user
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { connectionString, databaseName } = body;

    // Validate required fields
    if (!connectionString || !databaseName) {
      return NextResponse.json(
        {
          error: 'Missing required fields',
          required: ['connectionString', 'databaseName'],
        },
        { status: 400 }
      );
    }

    // Validate connection string
    const validation = validateConnectionString(connectionString);
    if (!validation.valid) {
      return NextResponse.json(
        {
          valid: false,
          errors: validation.errors,
        },
        { status: 200 }
      );
    }

    // Test connection
    const testResult = await testConnection(connectionString, databaseName);

    return NextResponse.json(testResult, { status: 200 });

  } catch (error) {
    console.error('MongoDB test connection error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to test connection' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/chatbots/[chatbotId]/mongodb/schema
 * Get schema/sample from a collection
 */
export async function GET(request, { params }) {
  try {
    // Authenticate user
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get query params
    const { searchParams } = new URL(request.url);
    const connectionString = searchParams.get('connectionString');
    const databaseName = searchParams.get('databaseName');
    const collectionName = searchParams.get('collectionName');

    if (!connectionString || !databaseName || !collectionName) {
      return NextResponse.json(
        {
          error: 'Missing required parameters',
          required: ['connectionString', 'databaseName', 'collectionName'],
        },
        { status: 400 }
      );
    }

    // Validate connection string
    const validation = validateConnectionString(connectionString);
    if (!validation.valid) {
      return NextResponse.json(
        { error: `Invalid connection string: ${validation.errors.join(', ')}` },
        { status: 400 }
      );
    }

    // Get schema
    const schemaResult = await getCollectionSchema(
      connectionString,
      databaseName,
      collectionName
    );

    return NextResponse.json(schemaResult, { status: 200 });

  } catch (error) {
    console.error('MongoDB schema error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get collection schema' },
      { status: 500 }
    );
  }
}
