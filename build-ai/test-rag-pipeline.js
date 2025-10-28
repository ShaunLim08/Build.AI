/**
 * RAG Pipeline Test Script
 *
 * This script tests the complete RAG pipeline end-to-end
 *
 * Usage:
 *   node test-rag-pipeline.js <chatbot-id> <query>
 *
 * Example:
 *   node test-rag-pipeline.js 507f1f77bcf86cd799439011 "What is your return policy?"
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

async function testSearch(chatbotId, query) {
  console.log('\n' + '='.repeat(80));
  console.log('🔍 TESTING SEMANTIC SEARCH');
  console.log('='.repeat(80));

  const url = `${BASE_URL}/api/chatbots/${chatbotId}/search`;

  console.log(`\n📍 Endpoint: POST ${url}`);
  console.log(`📝 Query: "${query}"`);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        limit: 5,
        minSimilarity: 0.0,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('❌ Search failed:', error);
      return null;
    }

    const data = await response.json();

    console.log('\n✅ Search completed successfully!');
    console.log(`\n📊 Results: ${data.count} chunks found`);

    if (data.results && data.results.length > 0) {
      console.log('\nTop 3 Results:');
      data.results.slice(0, 3).forEach((result, index) => {
        console.log(`\n[${index + 1}] Similarity: ${result.similarityScore}`);
        console.log(`    Source: ${result.source || 'N/A'}`);
        console.log(`    Text: ${result.text.substring(0, 150)}...`);
      });
    } else {
      console.log('\n⚠️  No results found');
    }

    return data;
  } catch (error) {
    console.error('\n❌ Error during search:', error.message);
    return null;
  }
}

async function testChat(chatbotId, query, options = {}) {
  console.log('\n' + '='.repeat(80));
  console.log('💬 TESTING RAG CHAT PIPELINE');
  console.log('='.repeat(80));

  const url = `${BASE_URL}/api/chatbots/${chatbotId}/chat`;

  console.log(`\n📍 Endpoint: POST ${url}`);
  console.log(`📝 Query: "${query}"`);

  try {
    const requestBody = {
      message: query,
      stream: options.stream || false,
      retrievalOptions: {
        limit: options.limit || 5,
        minSimilarity: options.minSimilarity || 0.3,
      },
      generationOptions: {
        model: options.model || 'gemini-1.5-flash',
        temperature: options.temperature || 0.7,
        maxTokens: options.maxTokens || 2048,
      },
    };

    console.log(`\n⚙️  Configuration:`);
    console.log(`    Model: ${requestBody.generationOptions.model}`);
    console.log(`    Retrieval limit: ${requestBody.retrievalOptions.limit}`);
    console.log(`    Min similarity: ${requestBody.retrievalOptions.minSimilarity}`);

    const startTime = Date.now();

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('\n❌ Chat request failed:', error);

      if (error.error && error.error.includes('GEMINI_API_KEY')) {
        console.error('\n⚠️  Missing GEMINI_API_KEY environment variable!');
        console.error('    Please add it to your .env.local file');
        console.error('    Get a key from: https://makersuite.google.com/app/apikey');
      }

      return null;
    }

    const data = await response.json();
    const endTime = Date.now();

    console.log('\n✅ Chat completed successfully!');
    console.log(`⏱️  Total time: ${endTime - startTime}ms`);

    if (data.metadata) {
      console.log('\n📊 Pipeline Metrics:');
      console.log(`    Query optimization: "${data.metadata.optimizedQuery}"`);
      console.log(`    Chunks retrieved: ${data.metadata.retrieval.chunksRetrieved}`);
      console.log(`    Chunks used: ${data.metadata.retrieval.chunksUsed}`);
      console.log(`    Quality score: ${(data.metadata.retrieval.metrics.qualityScore * 100).toFixed(1)}%`);
      console.log(`    Confidence: ${data.metadata.retrieval.metrics.confidence}`);
      console.log(`    Sources: ${data.metadata.retrieval.sources.length}`);

      if (data.metadata.generation && data.metadata.generation.usage) {
        console.log(`\n💰 Token Usage:`);
        console.log(`    Prompt tokens: ${data.metadata.generation.usage.promptTokens}`);
        console.log(`    Completion tokens: ${data.metadata.generation.usage.completionTokens}`);
        console.log(`    Total tokens: ${data.metadata.generation.usage.totalTokens}`);
      }

      if (data.metadata.citations && data.metadata.citations.length > 0) {
        console.log(`\n📚 Citations: [${data.metadata.citations.join(', ')}]`);
      }
    }

    console.log('\n💬 Response:');
    console.log('─'.repeat(80));
    console.log(data.response);
    console.log('─'.repeat(80));

    return data;
  } catch (error) {
    console.error('\n❌ Error during chat:', error.message);
    console.error(error.stack);
    return null;
  }
}

async function testStreamingChat(chatbotId, query) {
  console.log('\n' + '='.repeat(80));
  console.log('📡 TESTING STREAMING CHAT');
  console.log('='.repeat(80));

  const url = `${BASE_URL}/api/chatbots/${chatbotId}/chat`;

  console.log(`\n📍 Endpoint: POST ${url}`);
  console.log(`📝 Query: "${query}"`);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: query,
        stream: true,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('\n❌ Streaming request failed:', error);
      return;
    }

    console.log('\n💬 Streaming Response:');
    console.log('─'.repeat(80));

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        console.log('\n─'.repeat(80));
        console.log('✅ Stream completed');
        break;
      }

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);

          if (data === '[DONE]') {
            continue;
          }

          try {
            const parsed = JSON.parse(data);
            if (parsed.chunk) {
              process.stdout.write(parsed.chunk);
            }
          } catch (e) {
            // Ignore parsing errors for incomplete chunks
          }
        }
      }
    }

  } catch (error) {
    console.error('\n❌ Error during streaming:', error.message);
  }
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.log('Usage: node test-rag-pipeline.js <chatbot-id> <query> [options]');
    console.log('\nExamples:');
    console.log('  node test-rag-pipeline.js 507f1f77bcf86cd799439011 "What is your return policy?"');
    console.log('  node test-rag-pipeline.js 507f1f77bcf86cd799439011 "Explain pricing" --stream');
    console.log('  node test-rag-pipeline.js 507f1f77bcf86cd799439011 "Compare features" --search-only');
    process.exit(1);
  }

  const chatbotId = args[0];
  const query = args[1];
  const flags = args.slice(2);

  console.log('\n🚀 Starting RAG Pipeline Tests...');
  console.log(`🤖 Chatbot ID: ${chatbotId}`);
  console.log(`🔍 Query: "${query}"`);

  if (flags.includes('--search-only')) {
    // Test search only
    await testSearch(chatbotId, query);
  } else if (flags.includes('--stream')) {
    // Test streaming chat
    await testStreamingChat(chatbotId, query);
  } else {
    // Test both search and chat
    await testSearch(chatbotId, query);
    await testChat(chatbotId, query);
  }

  console.log('\n✅ All tests completed!\n');
}

// Check if running in Node.js environment
if (typeof window === 'undefined') {
  main().catch(console.error);
}
