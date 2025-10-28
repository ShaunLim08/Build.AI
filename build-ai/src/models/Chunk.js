import { MongoClient, ObjectId } from 'mongodb';
import { cosineSimilarity } from '../lib/embeddings.js';

const uri = process.env.MONGODB_URI;
const dbName = 'buildai';

let client;
let db;

async function connectToDatabase() {
  if (db) return db;

  client = new MongoClient(uri);
  await client.connect();
  db = client.db(dbName);
  return db;
}

export class Chunk {
  static async create(chunkData) {
    const database = await connectToDatabase();
    const chunks = database.collection('chunks');

    const chunk = {
      ...chunkData,
      embedding: chunkData.embedding || null, // Store embedding vector
      createdAt: new Date(),
    };

    const result = await chunks.insertOne(chunk);
    return { _id: result.insertedId, ...chunk };
  }

  static async createMany(chunksData) {
    const database = await connectToDatabase();
    const chunks = database.collection('chunks');

    const chunksWithTimestamp = chunksData.map(chunk => ({
      ...chunk,
      embedding: chunk.embedding || null, // Store embedding vector
      createdAt: new Date(),
    }));

    const result = await chunks.insertMany(chunksWithTimestamp);
    return result.insertedIds;
  }

  static async findByChatbotId(chatbotId) {
    const database = await connectToDatabase();
    const chunks = database.collection('chunks');

    return await chunks.find({ chatbotId: new ObjectId(chatbotId) }).toArray();
  }

  static async findByDocumentId(documentId) {
    const database = await connectToDatabase();
    const chunks = database.collection('chunks');

    return await chunks.find({ documentId: new ObjectId(documentId) }).toArray();
  }

  static async searchByEmbedding(chatbotId, queryEmbedding, limit = 5) {
    const database = await connectToDatabase();
    const chunks = database.collection('chunks');

    // Fetch all chunks for this chatbot that have embeddings
    const allChunks = await chunks
      .find({
        chatbotId: new ObjectId(chatbotId),
        embedding: { $exists: true, $ne: null }
      })
      .toArray();

    if (allChunks.length === 0) {
      return [];
    }

    // Filter chunks to only include those with matching embedding dimensions
    const queryDimension = queryEmbedding.length;
    const validChunks = allChunks.filter(chunk => {
      if (!chunk.embedding || !Array.isArray(chunk.embedding)) {
        console.warn(`⚠️  Chunk ${chunk._id} has invalid embedding (null or not array)`);
        return false;
      }
      if (chunk.embedding.length === 0) {
        console.warn(`⚠️  Chunk ${chunk._id} has empty embedding array`);
        return false;
      }
      if (chunk.embedding.length !== queryDimension) {
        console.warn(`⚠️  Chunk ${chunk._id} has wrong dimension: ${chunk.embedding.length} (expected ${queryDimension})`);
        return false;
      }
      return true;
    });

    if (validChunks.length === 0) {
      console.error(`❌ No chunks with matching embedding dimensions found!`);
      console.error(`   Query dimension: ${queryDimension}`);
      console.error(`   Total chunks: ${allChunks.length}`);
      console.error(`   Valid chunks: 0`);
      console.error(`   → Please regenerate embeddings with: node regenerate-embeddings.js ${chatbotId}`);
      return [];
    }

    console.log(`✅ Found ${validChunks.length} chunks with ${queryDimension}-dimension embeddings`);

    // Calculate cosine similarity for each valid chunk
    const chunksWithSimilarity = validChunks.map(chunk => ({
      ...chunk,
      similarity: cosineSimilarity(queryEmbedding, chunk.embedding)
    }));

    // Sort by similarity (highest first) and return top K
    return chunksWithSimilarity
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);
  }

  /**
   * Update embeddings for chunks
   */
  static async updateEmbeddings(chunkId, embedding) {
    const database = await connectToDatabase();
    const chunks = database.collection('chunks');

    const result = await chunks.updateOne(
      { _id: new ObjectId(chunkId) },
      { $set: { embedding, embeddingUpdatedAt: new Date() } }
    );

    return result.modifiedCount > 0;
  }

  /**
   * Batch update embeddings
   */
  static async updateEmbeddingsBatch(updates) {
    const database = await connectToDatabase();
    const chunks = database.collection('chunks');

    const bulkOps = updates.map(({ chunkId, embedding }) => ({
      updateOne: {
        filter: { _id: new ObjectId(chunkId) },
        update: {
          $set: {
            embedding,
            embeddingUpdatedAt: new Date()
          }
        }
      }
    }));

    if (bulkOps.length === 0) {
      return 0;
    }

    const result = await chunks.bulkWrite(bulkOps);
    return result.modifiedCount;
  }

  /**
   * Find chunks without embeddings
   */
  static async findChunksWithoutEmbeddings(chatbotId, limit = 100) {
    const database = await connectToDatabase();
    const chunks = database.collection('chunks');

    return await chunks
      .find({
        chatbotId: new ObjectId(chatbotId),
        $or: [
          { embedding: { $exists: false } },
          { embedding: null }
        ]
      })
      .limit(limit)
      .toArray();
  }

  static async deleteByDocumentId(documentId) {
    const database = await connectToDatabase();
    const chunks = database.collection('chunks');

    const result = await chunks.deleteMany({ documentId: new ObjectId(documentId) });
    return result.deletedCount;
  }

  static async deleteByChatbotId(chatbotId) {
    const database = await connectToDatabase();
    const chunks = database.collection('chunks');

    const result = await chunks.deleteMany({ chatbotId: new ObjectId(chatbotId) });
    return result.deletedCount;
  }
}
