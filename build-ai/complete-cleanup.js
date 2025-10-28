/**
 * Complete Cleanup Script
 *
 * This script completely cleans up a chatbot's data:
 * - Deletes ALL chunks (including old 384-dim embeddings)
 * - Deletes ALL documents
 * - Gives you a fresh start for uploading new documents
 *
 * Usage:
 *   node complete-cleanup.js <chatbot-id>
 *
 * Example:
 *   node complete-cleanup.js 68f7039782260da3dcb4a736
 */

const { MongoClient, ObjectId } = require('mongodb');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: '.env.local' });

const chatbotId = process.argv[2];

if (!chatbotId) {
  console.error('❌ Error: Please provide a chatbot ID');
  console.log('\nUsage: node complete-cleanup.js <chatbot-id>');
  console.log('Example: node complete-cleanup.js 68f7039782260da3dcb4a736');
  process.exit(1);
}

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = 'buildai';

if (!MONGODB_URI) {
  console.error('❌ Error: MONGODB_URI not found in .env.local');
  process.exit(1);
}

async function completeCleanup() {
  let client;

  try {
    console.log('\n' + '='.repeat(80));
    console.log('🧹 COMPLETE CHATBOT CLEANUP');
    console.log('='.repeat(80));
    console.log(`\n⚠️  WARNING: This will delete ALL documents and chunks for this chatbot!`);
    console.log(`📋 Chatbot ID: ${chatbotId}`);
    console.log('');

    // Connect to MongoDB
    console.log('🔌 Connecting to MongoDB...');
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log('✅ Connected to MongoDB\n');

    const db = client.db(DB_NAME);
    const documentsCollection = db.collection('documents');
    const chunksCollection = db.collection('chunks');

    // Step 1: Count current data
    console.log('📊 Step 1: Checking current data...\n');

    const documentCount = await documentsCollection.countDocuments({
      chatbotId: new ObjectId(chatbotId)
    });

    const chunkCount = await chunksCollection.countDocuments({
      chatbotId: new ObjectId(chatbotId)
    });

    console.log(`Found:`);
    console.log(`  - ${documentCount} documents`);
    console.log(`  - ${chunkCount} chunks`);
    console.log('');

    if (documentCount === 0 && chunkCount === 0) {
      console.log('✅ Chatbot is already clean! No data to delete.');
      console.log('\n' + '='.repeat(80));
      return;
    }

    // Step 2: Delete all chunks
    console.log('🗑️  Step 2: Deleting all chunks...\n');

    const chunksDeleted = await chunksCollection.deleteMany({
      chatbotId: new ObjectId(chatbotId)
    });

    console.log(`✅ Deleted ${chunksDeleted.deletedCount} chunks\n`);

    // Step 3: Delete all documents
    console.log('🗑️  Step 3: Deleting all documents...\n');

    const documentsDeleted = await documentsCollection.deleteMany({
      chatbotId: new ObjectId(chatbotId)
    });

    console.log(`✅ Deleted ${documentsDeleted.deletedCount} documents\n`);

    // Step 4: Verify cleanup
    console.log('🔍 Step 4: Verifying cleanup...\n');

    const remainingDocs = await documentsCollection.countDocuments({
      chatbotId: new ObjectId(chatbotId)
    });

    const remainingChunks = await chunksCollection.countDocuments({
      chatbotId: new ObjectId(chatbotId)
    });

    console.log(`Remaining data:`);
    console.log(`  - ${remainingDocs} documents`);
    console.log(`  - ${remainingChunks} chunks`);
    console.log('');

    if (remainingDocs === 0 && remainingChunks === 0) {
      console.log('✅ CLEANUP SUCCESSFUL!');
      console.log('');
      console.log('📝 Next Steps:');
      console.log('   1. Upload new documents via dashboard:');
      console.log(`      http://localhost:3000/dashboard/${chatbotId}`);
      console.log('');
      console.log('   2. Generate embeddings (1024 dimensions):');
      console.log(`      node regenerate-embeddings.js ${chatbotId}`);
      console.log('');
      console.log('   3. Test your chatbot:');
      console.log(`      http://localhost:3000/chat/${chatbotId}`);
    } else {
      console.log('⚠️  Warning: Some data may still remain. Check manually.');
    }

    console.log('\n' + '='.repeat(80));

  } catch (error) {
    console.error('\n❌ Error during cleanup:', error);
    console.error('\nDetails:', error.message);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      console.log('\n🔌 Disconnected from MongoDB\n');
    }
  }
}

// Run the cleanup
completeCleanup().catch(console.error);
