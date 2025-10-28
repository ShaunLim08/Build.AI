/**
 * Cleanup Orphaned Documents Script
 *
 * This script removes documents from the database that no longer have associated chunks
 * (e.g., if chunks were manually deleted from MongoDB)
 *
 * Usage:
 *   node cleanup-orphaned-documents.js <chatbot-id>
 *
 * Example:
 *   node cleanup-orphaned-documents.js 68f7039782260da3dcb4a736
 */

const { MongoClient, ObjectId } = require('mongodb');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: '.env.local' });

const chatbotId = process.argv[2];

if (!chatbotId) {
  console.error('❌ Error: Please provide a chatbot ID');
  console.log('\nUsage: node cleanup-orphaned-documents.js <chatbot-id>');
  console.log('Example: node cleanup-orphaned-documents.js 68f7039782260da3dcb4a736');
  process.exit(1);
}

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = 'buildai';

if (!MONGODB_URI) {
  console.error('❌ Error: MONGODB_URI not found in .env.local');
  process.exit(1);
}

async function cleanupOrphanedDocuments() {
  let client;

  try {
    console.log('\n' + '='.repeat(80));
    console.log('🧹 CLEANING UP ORPHANED DOCUMENTS');
    console.log('='.repeat(80));
    console.log(`\n📋 Chatbot ID: ${chatbotId}`);
    console.log(`🔌 Connecting to MongoDB...`);

    // Connect to MongoDB
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log('✅ Connected to MongoDB\n');

    const db = client.db(DB_NAME);
    const documentsCollection = db.collection('documents');
    const chunksCollection = db.collection('chunks');

    // Step 1: Find all documents for this chatbot
    console.log('📊 Step 1: Finding documents for this chatbot...\n');
    const documents = await documentsCollection.find({
      chatbotId: new ObjectId(chatbotId)
    }).toArray();

    console.log(`Found ${documents.length} documents total\n`);

    if (documents.length === 0) {
      console.log('⚠️  No documents found for this chatbot');
      return;
    }

    // Step 2: Check each document for orphaned status
    console.log('🔍 Step 2: Checking for orphaned documents...\n');
    const orphanedDocuments = [];

    for (const doc of documents) {
      const chunkCount = await chunksCollection.countDocuments({
        documentId: doc._id
      });

      if (chunkCount === 0) {
        orphanedDocuments.push({
          _id: doc._id,
          filename: doc.filename,
          uploadedAt: doc.uploadedAt
        });
        console.log(`❌ Orphaned: ${doc.filename} (${doc._id}) - 0 chunks`);
      } else {
        console.log(`✅ Valid: ${doc.filename} - ${chunkCount} chunks`);
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   Total documents: ${documents.length}`);
    console.log(`   Valid documents: ${documents.length - orphanedDocuments.length}`);
    console.log(`   Orphaned documents: ${orphanedDocuments.length}`);
    console.log('');

    if (orphanedDocuments.length === 0) {
      console.log('✅ No orphaned documents found. Your database is clean!');
      console.log('\n' + '='.repeat(80));
      return;
    }

    // Step 3: Delete orphaned documents
    console.log('🗑️  Step 3: Deleting orphaned documents...\n');

    const documentIdsToDelete = orphanedDocuments.map(doc => doc._id);

    const deleteResult = await documentsCollection.deleteMany({
      _id: { $in: documentIdsToDelete }
    });

    console.log(`✅ Deleted ${deleteResult.deletedCount} orphaned documents\n`);

    // List deleted documents
    console.log('📝 Deleted documents:');
    orphanedDocuments.forEach((doc, index) => {
      console.log(`   ${index + 1}. ${doc.filename}`);
    });

    console.log('\n✅ Cleanup complete!');
    console.log('\n' + '='.repeat(80));

  } catch (error) {
    console.error('\n❌ Error during cleanup:', error);
    console.error('\nDetails:', error.message);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      console.log('\n🔌 Disconnected from MongoDB');
    }
  }
}

// Run the cleanup
cleanupOrphanedDocuments().catch(console.error);
