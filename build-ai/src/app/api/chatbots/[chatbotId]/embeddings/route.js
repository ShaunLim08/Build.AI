import { NextResponse } from 'next/server';
import { Chunk } from '@/models/Chunk';
import { generateEmbedding, getModelInfo } from '@/lib/embeddings';

/**
 * GET /api/chatbots/[chatbotId]/embeddings
 * Get embedding statistics for a chatbot
 */
export async function GET(request, { params }) {
  try {
    const { chatbotId } = params;

    // Get all chunks for this chatbot
    const allChunks = await Chunk.findByChatbotId(chatbotId);

    // Count chunks with and without embeddings
    const chunksWithEmbeddings = allChunks.filter(
      chunk => chunk.embedding && Array.isArray(chunk.embedding) && chunk.embedding.length > 0
    );
    const chunksWithoutEmbeddings = allChunks.filter(
      chunk => !chunk.embedding || !Array.isArray(chunk.embedding) || chunk.embedding.length === 0
    );

    // Get model info
    const modelInfo = getModelInfo();

    // Analyze embedding dimensions
    const dimensionCounts = {};
    chunksWithEmbeddings.forEach(chunk => {
      const dim = chunk.embedding.length;
      dimensionCounts[dim] = (dimensionCounts[dim] || 0) + 1;
    });

    return NextResponse.json({
      success: true,
      stats: {
        totalChunks: allChunks.length,
        chunksWithEmbeddings: chunksWithEmbeddings.length,
        chunksWithoutEmbeddings: chunksWithoutEmbeddings.length,
        model: modelInfo.model,
        dimensions: modelInfo.dimensions,
        dimensionBreakdown: dimensionCounts,
      },
    });
  } catch (error) {
    console.error('Error fetching embedding stats:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/chatbots/[chatbotId]/embeddings
 * Regenerate embeddings for all chunks
 */
export async function POST(request, { params }) {
  try {
    const { chatbotId } = params;
    const body = await request.json();
    const { regenerate = true, batchSize = 16 } = body;

    console.log('\n' + '='.repeat(80));
    console.log('🔄 EMBEDDING GENERATION API');
    console.log('='.repeat(80));
    console.log(`📋 Chatbot ID: ${chatbotId}`);
    console.log(`🔄 Regenerate: ${regenerate}`);
    console.log(`📦 Batch size: ${batchSize}`);
    console.log('');

    // Get all chunks for this chatbot
    const allChunks = await Chunk.findByChatbotId(chatbotId);

    if (allChunks.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No chunks found for this chatbot',
      }, { status: 404 });
    }

    console.log(`📊 Found ${allChunks.length} chunks`);

    // Filter chunks that need embeddings
    let chunksToProcess;
    if (regenerate) {
      // Regenerate all embeddings
      chunksToProcess = allChunks;
      console.log('🔄 Regenerating ALL embeddings');
    } else {
      // Only process chunks without embeddings
      chunksToProcess = allChunks.filter(
        chunk => !chunk.embedding || !Array.isArray(chunk.embedding) || chunk.embedding.length === 0
      );
      console.log(`🔄 Generating embeddings for ${chunksToProcess.length} chunks without embeddings`);
    }

    if (chunksToProcess.length === 0) {
      console.log('✅ All chunks already have embeddings');
      console.log('');
      return NextResponse.json({
        success: true,
        message: 'All chunks already have embeddings',
        processed: 0,
        model: getModelInfo().model,
        dimensions: getModelInfo().dimensions,
      });
    }

    console.log('');
    console.log(`⏳ Processing ${chunksToProcess.length} chunks...`);
    console.log('');

    const modelInfo = getModelInfo();
    let processedCount = 0;
    const updates = [];

    // Process in batches
    for (let i = 0; i < chunksToProcess.length; i += batchSize) {
      const batch = chunksToProcess.slice(i, i + batchSize);
      const batchNumber = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(chunksToProcess.length / batchSize);

      console.log(`📦 Processing batch ${batchNumber}/${totalBatches} (${batch.length} chunks)`);

      // Generate embeddings for this batch
      for (const chunk of batch) {
        try {
          const embedding = await generateEmbedding(chunk.text);

          updates.push({
            chunkId: chunk._id.toString(),
            embedding,
          });

          processedCount++;

          // Log progress every 10 chunks
          if (processedCount % 10 === 0) {
            console.log(`   ✓ Processed ${processedCount}/${chunksToProcess.length} chunks`);
          }
        } catch (error) {
          console.error(`   ❌ Error processing chunk ${chunk._id}:`, error.message);
        }
      }

      // Update embeddings in database for this batch
      if (updates.length > 0) {
        const updated = await Chunk.updateEmbeddingsBatch(updates);
        console.log(`   ✅ Updated ${updated} embeddings in database`);
        updates.length = 0; // Clear the updates array
      }

      console.log('');
    }

    console.log('✅ Embedding generation complete!');
    console.log(`   Processed: ${processedCount} chunks`);
    console.log(`   Model: ${modelInfo.model}`);
    console.log(`   Dimensions: ${modelInfo.dimensions}`);
    console.log('');
    console.log('='.repeat(80));

    return NextResponse.json({
      success: true,
      processed: processedCount,
      model: modelInfo.model,
      dimensions: modelInfo.dimensions,
    });

  } catch (error) {
    console.error('\n❌ Error regenerating embeddings:', error);
    console.error('Stack:', error.stack);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to regenerate embeddings',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
