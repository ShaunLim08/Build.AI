/**
 * Regenerate Embeddings Script
 *
 * This script regenerates all embeddings with the new gte-large model (1024 dimensions)
 * Run this after upgrading from gte-small (384 dimensions) to gte-large
 *
 * Usage:
 *   node regenerate-embeddings.js <chatbot-id>
 *
 * Example:
 *   node regenerate-embeddings.js 68f7039782260da3dcb4a736
 */

const chatbotId = process.argv[2];

if (!chatbotId) {
  console.error('❌ Error: Please provide a chatbot ID');
  console.log('\nUsage: node regenerate-embeddings.js <chatbot-id>');
  console.log('Example: node regenerate-embeddings.js 68f7039782260da3dcb4a736');
  process.exit(1);
}

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

async function regenerateEmbeddings() {
  console.log('\n' + '='.repeat(80));
  console.log('🔄 REGENERATING EMBEDDINGS');
  console.log('='.repeat(80));
  console.log(`\n📋 Chatbot ID: ${chatbotId}`);
  console.log('🎯 Model: gte-large (1024 dimensions)');
  console.log('');

  try {
    // Step 1: Check current status
    console.log('📊 Step 1: Checking current embedding status...\n');

    const statusResponse = await fetch(`${BASE_URL}/api/chatbots/${chatbotId}/embeddings`);

    if (!statusResponse.ok) {
      throw new Error(`Failed to fetch embedding status: ${statusResponse.status}`);
    }

    const statusData = await statusResponse.json();

    console.log('Current Status:');
    console.log(`  Total chunks: ${statusData.stats.totalChunks}`);
    console.log(`  With embeddings: ${statusData.stats.chunksWithEmbeddings}`);
    console.log(`  Without embeddings: ${statusData.stats.chunksWithoutEmbeddings}`);
    console.log(`  Current model: ${statusData.stats.model}`);
    console.log(`  Current dimensions: ${statusData.stats.dimensions}`);
    console.log('');

    if (statusData.stats.totalChunks === 0) {
      console.log('⚠️  No chunks found. Please upload documents first.');
      return;
    }

    // Step 2: Clear old embeddings (optional, but recommended for clean slate)
    console.log('🗑️  Step 2: Preparing to regenerate...\n');
    console.log('Note: Old 384-dim embeddings will be replaced with new 1024-dim embeddings');
    console.log('');

    // Step 3: Regenerate embeddings
    console.log('🔄 Step 3: Generating new embeddings...\n');
    console.log('⚠️  This may take a while depending on the number of chunks.');
    console.log('⚠️  First run will download the gte-large model (~300MB)');
    console.log('');

    const startTime = Date.now();

    const regenerateResponse = await fetch(`${BASE_URL}/api/chatbots/${chatbotId}/embeddings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        regenerate: true,  // Force regeneration of all embeddings
        batchSize: 16      // Process 16 at a time to avoid overwhelming the system
      }),
    });

    if (!regenerateResponse.ok) {
      const errorData = await regenerateResponse.json();
      throw new Error(errorData.error || 'Failed to regenerate embeddings');
    }

    const regenerateData = await regenerateResponse.json();
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    console.log('\n✅ Embeddings regenerated successfully!\n');
    console.log('Results:');
    console.log(`  Processed: ${regenerateData.processed} chunks`);
    console.log(`  Model: ${regenerateData.model}`);
    console.log(`  Dimensions: ${regenerateData.dimensions}`);
    console.log(`  Time taken: ${duration} seconds`);
    console.log('');

    // Step 4: Verify
    console.log('🔍 Step 4: Verifying new embeddings...\n');

    const verifyResponse = await fetch(`${BASE_URL}/api/chatbots/${chatbotId}/embeddings`);
    const verifyData = await verifyResponse.json();

    console.log('Final Status:');
    console.log(`  Total chunks: ${verifyData.stats.totalChunks}`);
    console.log(`  With embeddings: ${verifyData.stats.chunksWithEmbeddings}`);
    console.log(`  Model: ${verifyData.stats.model}`);
    console.log(`  Dimensions: ${verifyData.stats.dimensions}`);
    console.log('');

    if (verifyData.stats.dimensions === 1024) {
      console.log('✅ SUCCESS! All embeddings are now 1024 dimensions (gte-large)');
      console.log('');
      console.log('🎉 Your chatbot is ready to use!');
      console.log(`   Test it at: http://localhost:3000/chat/${chatbotId}`);
    } else {
      console.log('⚠️  Warning: Embeddings may not be fully updated');
    }

    console.log('\n' + '='.repeat(80));

  } catch (error) {
    console.error('\n❌ Error regenerating embeddings:', error.message);
    console.error('\nDetails:', error);
    process.exit(1);
  }
}

// Run if this is the main module
if (typeof window === 'undefined') {
  regenerateEmbeddings().catch(console.error);
}
