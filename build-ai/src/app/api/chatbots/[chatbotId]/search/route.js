import { NextResponse } from 'next/server';
import { Chunk } from '@/models/Chunk';
import { generateEmbedding } from '@/lib/embeddings';

/**
 * POST /api/chatbots/[chatbotId]/search
 * Perform semantic search using embeddings
 */
export async function POST(request, { params }) {
  try {
    const { chatbotId } = params;
    const body = await request.json();
    const { query, limit = 5, minSimilarity = 0.0 } = body;

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Query is required' },
        { status: 400 }
      );
    }

    console.log(`\n🔍 Semantic search for chatbot: ${chatbotId}`);
    console.log(`   Query: "${query}"`);
    console.log(`   Limit: ${limit}`);

    // Generate embedding for the query
    console.log(`🔄 Generating query embedding...`);
    const queryEmbedding = await generateEmbedding(query);
    console.log(`✅ Query embedding generated (${queryEmbedding.length} dimensions)`);

    // Search for similar chunks
    console.log(`🔍 Searching for similar chunks...`);
    const results = await Chunk.searchByEmbedding(chatbotId, queryEmbedding, limit);

    // Filter by minimum similarity if specified
    const filteredResults = results.filter(result => result.similarity >= minSimilarity);

    console.log(`✅ Found ${filteredResults.length} relevant chunks`);
    if (filteredResults.length > 0) {
      console.log(`   Top similarity: ${(filteredResults[0].similarity * 100).toFixed(1)}%`);
    }

    // Format results (remove embedding from response to reduce size)
    const formattedResults = filteredResults.map(({ embedding, ...chunk }) => ({
      ...chunk,
      similarityScore: (chunk.similarity * 100).toFixed(2) + '%'
    }));

    return NextResponse.json({
      success: true,
      query,
      results: formattedResults,
      count: formattedResults.length,
      model: 'Xenova/gte-large'
    });

  } catch (error) {
    console.error('❌ Error performing semantic search:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to perform search'
      },
      { status: 500 }
    );
  }
}
