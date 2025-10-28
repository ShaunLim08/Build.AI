import { NextResponse } from 'next/server';
import { generateEmbedding, generateEmbeddingsBatch, cosineSimilarity, getModelInfo } from '@/lib/embeddings';

/**
 * GET /api/test/embeddings
 * Test embedding generation with sample texts
 */
export async function GET() {
  try {
    console.log('\n🧪 Testing Embedding Generation\n');

    // Get model info
    const modelInfo = getModelInfo();
    console.log('📊 Model Info:', modelInfo);

    // Sample texts (from the user's example)
    const sentences = [
      "That is a happy person",
      "That is a happy dog",
      "That is a very happy person",
      "Today is a sunny day"
    ];

    console.log('\n📝 Sample sentences:');
    sentences.forEach((s, i) => console.log(`   ${i + 1}. "${s}"`));

    // Test 1: Generate single embedding
    console.log('\n🔄 Test 1: Generating single embedding...');
    const singleStart = Date.now();
    const singleEmbedding = await generateEmbedding(sentences[0]);
    const singleTime = Date.now() - singleStart;

    console.log(`✅ Generated embedding in ${singleTime}ms`);
    console.log(`   Dimensions: ${singleEmbedding.length}`);
    console.log(`   First 5 values: [${singleEmbedding.slice(0, 5).map(v => v.toFixed(4)).join(', ')}...]`);

    // Test 2: Generate batch embeddings
    console.log('\n🔄 Test 2: Generating batch embeddings...');
    const batchStart = Date.now();
    const embeddings = await generateEmbeddingsBatch(sentences, { batchSize: 2 });
    const batchTime = Date.now() - batchStart;

    console.log(`✅ Generated ${embeddings.length} embeddings in ${batchTime}ms`);
    console.log(`   Average time per embedding: ${(batchTime / embeddings.length).toFixed(2)}ms`);

    // Test 3: Calculate similarities
    console.log('\n🔄 Test 3: Calculating similarities...');
    const similarities = [];

    for (let i = 0; i < sentences.length; i++) {
      const row = [];
      for (let j = 0; j < sentences.length; j++) {
        const similarity = cosineSimilarity(embeddings[i], embeddings[j]);
        row.push(similarity);
      }
      similarities.push(row);
    }

    console.log('\n📊 Similarity Matrix:');
    console.log('     ', sentences.map((_, i) => `S${i + 1}`).join('    '));
    similarities.forEach((row, i) => {
      console.log(`S${i + 1}: [${row.map(v => v.toFixed(3)).join(', ')}]`);
    });

    // Analyze similarities
    console.log('\n🔍 Analysis:');
    console.log(`   Similarity (S1 vs S2): ${(similarities[0][1] * 100).toFixed(1)}% - "happy person" vs "happy dog"`);
    console.log(`   Similarity (S1 vs S3): ${(similarities[0][2] * 100).toFixed(1)}% - "happy person" vs "very happy person"`);
    console.log(`   Similarity (S1 vs S4): ${(similarities[0][3] * 100).toFixed(1)}% - "happy person" vs "sunny day"`);

    // Find most similar pairs
    const pairs = [];
    for (let i = 0; i < sentences.length; i++) {
      for (let j = i + 1; j < sentences.length; j++) {
        pairs.push({
          sentence1: sentences[i],
          sentence2: sentences[j],
          similarity: similarities[i][j]
        });
      }
    }
    pairs.sort((a, b) => b.similarity - a.similarity);

    console.log('\n🏆 Most similar pairs:');
    pairs.slice(0, 3).forEach((pair, i) => {
      console.log(`   ${i + 1}. "${pair.sentence1}" ↔ "${pair.sentence2}"`);
      console.log(`      Similarity: ${(pair.similarity * 100).toFixed(2)}%`);
    });

    // Return results
    return NextResponse.json({
      success: true,
      model: modelInfo,
      tests: {
        singleEmbedding: {
          time: `${singleTime}ms`,
          dimensions: singleEmbedding.length,
          sample: singleEmbedding.slice(0, 5)
        },
        batchEmbeddings: {
          count: embeddings.length,
          totalTime: `${batchTime}ms`,
          avgTimePerEmbedding: `${(batchTime / embeddings.length).toFixed(2)}ms`
        },
        similarities: {
          matrix: similarities,
          topPairs: pairs.slice(0, 3).map(p => ({
            pair: [p.sentence1, p.sentence2],
            similarity: (p.similarity * 100).toFixed(2) + '%'
          }))
        }
      },
      sentences,
      interpretation: {
        expected: "S1 and S3 should have highest similarity (both about happy person)",
        actual: `Highest similarity: ${pairs[0].sentence1} ↔ ${pairs[0].sentence2} (${(pairs[0].similarity * 100).toFixed(1)}%)`
      }
    });

  } catch (error) {
    console.error('❌ Test failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        stack: error.stack
      },
      { status: 500 }
    );
  }
}
