/**
 * Diagnose Embeddings Script
 *
 * This script checks what embeddings exist in your database
 * and shows you dimension mismatches
 *
 * Usage:
 *   node diagnose-embeddings.js <chatbot-id>
 */

const { MongoClient, ObjectId } = require('mongodb');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

const chatbotId = process.argv[2];

if (!chatbotId) {
  console.error('❌ Error: Please provide a chatbot ID');
  console.log('\nUsage: node diagnose-embeddings.js <chatbot-id>');
  process.exit(1);
}

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = 'buildai';

async function diagnoseEmbeddings() {
  let client;

  try {
    console.log('\n' + '='.repeat(80));
    console.log('🔍 DIAGNOSING EMBEDDINGS');
    console.log('='.repeat(80));
    console.log(`\n📋 Chatbot ID: ${chatbotId}\n`);

    client = new MongoClient(MONGODB_URI);
    await client.connect();

    const db = client.db(DB_NAME);
    const chunks = db.collection('chunks');

    // Get all chunks for this chatbot
    const allChunks = await chunks.find({
      chatbotId: new ObjectId(chatbotId)
    }).toArray();

    console.log(`Total chunks: ${allChunks.length}\n`);

    if (allChunks.length === 0) {
      console.log('⚠️  No chunks found. Upload documents first.');
      return;
    }

    // Analyze embeddings
    const stats = {
      withEmbedding: 0,
      withoutEmbedding: 0,
      dimensions: {},
      nullEmbeddings: 0,
      emptyEmbeddings: 0
    };

    allChunks.forEach(chunk => {
      if (!chunk.embedding) {
        stats.withoutEmbedding++;
        stats.nullEmbeddings++;
      } else if (Array.isArray(chunk.embedding) && chunk.embedding.length === 0) {
        stats.withoutEmbedding++;
        stats.emptyEmbeddings++;
      } else if (Array.isArray(chunk.embedding)) {
        stats.withEmbedding++;
        const dim = chunk.embedding.length;
        stats.dimensions[dim] = (stats.dimensions[dim] || 0) + 1;
      }
    });

    console.log('📊 Embedding Statistics:\n');
    console.log(`Chunks with embeddings: ${stats.withEmbedding}`);
    console.log(`Chunks without embeddings: ${stats.withoutEmbedding}`);
    console.log(`  - Null embeddings: ${stats.nullEmbeddings}`);
    console.log(`  - Empty arrays: ${stats.emptyEmbeddings}`);
    console.log('');

    console.log('📏 Embedding Dimensions:\n');
    Object.entries(stats.dimensions).forEach(([dim, count]) => {
      const status = dim === '1024' ? '✅' : '❌';
      console.log(`${status} ${dim} dimensions: ${count} chunks`);
    });
    console.log('');

    // Show problems
    const problems = [];

    if (stats.withoutEmbedding > 0) {
      problems.push(`${stats.withoutEmbedding} chunks have no embeddings`);
    }

    const wrongDimensions = Object.keys(stats.dimensions).filter(d => d !== '1024');
    if (wrongDimensions.length > 0) {
      problems.push(`Chunks with wrong dimensions: ${wrongDimensions.join(', ')}`);
    }

    if (problems.length > 0) {
      console.log('❌ PROBLEMS FOUND:\n');
      problems.forEach((problem, i) => {
        console.log(`${i + 1}. ${problem}`);
      });
      console.log('');
      console.log('💡 SOLUTION:');
      console.log('');
      console.log('Run complete cleanup to start fresh:');
      console.log(`   node complete-cleanup.js ${chatbotId}`);
      console.log('');
      console.log('Then upload documents and generate embeddings:');
      console.log(`   node regenerate-embeddings.js ${chatbotId}`);
    } else {
      console.log('✅ All embeddings are correct (1024 dimensions)!');
    }

    console.log('\n' + '='.repeat(80) + '\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    if (client) await client.close();
  }
}

diagnoseEmbeddings().catch(console.error);
