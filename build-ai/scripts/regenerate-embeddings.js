/**
 * Regenerate Embeddings Script
 * 
 * This script regenerates all embeddings for a chatbot using the new Gemini API.
 * Use this after switching from local embeddings (1024-dim) to Gemini API (768-dim).
 * 
 * Usage: node scripts/regenerate-embeddings.js <chatbotId>
 */

import { MongoClient, ObjectId } from 'mongodb';
import { generateEmbeddingsBatch } from '../src/lib/embeddings.js';

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = 'buildai';

async function regenerateEmbeddings(chatbotId) {
  if (!chatbotId) {
    console.error('❌ Please provide a chatbot ID');
    console.log('Usage: node scripts/regenerate-embeddings.js <chatbotId>');
    process.exit(1);
  }

  console.log('\n' + '='.repeat(80));
  console.log('🔄 REGENERATING EMBEDDINGS');
  console.log('='.repeat(80));
  console.log(`Chatbot ID: ${chatbotId}\n`);

  let client;

  try {
    // Connect to MongoDB
    console.log('📦 Connecting to MongoDB...');
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db(DB_NAME);
    
    console.log('✅ Connected to MongoDB\n');

    // Get all chunks for this chatbot
    console.log('📊 Fetching chunks...');
    const chunks = await db.collection('chunks')
      .find({ chatbotId: new ObjectId(chatbotId) })
      .toArray();

    if (chunks.length === 0) {
      console.log('⚠️  No chunks found for this chatbot');
      process.exit(0);
    }

    console.log(`✅ Found ${chunks.length} chunks\n`);

    // Check current embedding dimensions
    const sampleChunk = chunks.find(c => c.embedding && c.embedding.length > 0);
    if (sampleChunk) {
      console.log(`Current embedding dimension: ${sampleChunk.embedding.length}`);
      console.log(`New embedding dimension: 768 (Gemini API)\n`);
    }

    // Extract text content from chunks
    console.log('🔄 Generating new embeddings...');
    const texts = chunks.map(chunk => chunk.content);

    // Generate new embeddings in batches
    const newEmbeddings = await generateEmbeddingsBatch(texts, {
      batchSize: 10,
      onProgress: (progress) => {
        console.log(`   Progress: ${progress.current}/${progress.total} (${progress.progress.toFixed(1)}%)`);
      }
    });

    console.log(`✅ Generated ${newEmbeddings.length} new embeddings\n`);

    // Update chunks with new embeddings
    console.log('💾 Updating chunks in database...');
    const bulkOps = chunks.map((chunk, index) => ({
      updateOne: {
        filter: { _id: chunk._id },
        update: {
          $set: {
            embedding: newEmbeddings[index],
            embeddingUpdatedAt: new Date(),
            embeddingModel: 'text-embedding-004',
            embeddingProvider: 'Google Gemini'
          }
        }
      }
    }));

    const result = await db.collection('chunks').bulkWrite(bulkOps);
    
    console.log(`✅ Updated ${result.modifiedCount} chunks\n`);

    console.log('='.repeat(80));
    console.log('✅ EMBEDDINGS REGENERATION COMPLETE');
    console.log('='.repeat(80));
    console.log(`\nYour chatbot "${chatbotId}" now uses the new Gemini embeddings!`);
    console.log('You can now use it in embeds and on your website.\n');

  } catch (error) {
    console.error('\n❌ Error regenerating embeddings:', error);
    console.error('Stack:', error.stack);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      console.log('📦 Database connection closed\n');
    }
  }
}

// Get chatbot ID from command line
const chatbotId = process.argv[2];
regenerateEmbeddings(chatbotId);
