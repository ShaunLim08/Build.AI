import { NextResponse } from 'next/server';
import { Chatbot } from '@/models/Chatbot';
import { Chunk } from '@/models/Chunk';
import { generateEmbedding } from '@/lib/embeddings';
import {
  optimizeQuery,
  buildContext,
  buildSystemPrompt,
  buildChatMessages,
  extractCitations,
  calculateRelevanceMetrics,
} from '@/lib/rag';
import { generateChatCompletion, streamChatCompletion } from '@/lib/gemini';

/**
 * POST /api/chatbots/[chatbotId]/chat
 * Complete RAG pipeline: retrieve context and generate response
 */
export async function POST(request, { params }) {
  const startTime = Date.now();

  try {
    const { chatbotId } = params;
    const body = await request.json();

    const {
      message,
      conversationHistory = [],
      stream = false,
      retrievalOptions = {},
      generationOptions = {},
    } = body;

    // Validate input
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Message is required' },
        { status: 400 }
      );
    }

    console.log('\n' + '='.repeat(80));
    console.log('🤖 RAG PIPELINE STARTED');
    console.log('='.repeat(80));
    console.log(`📋 Chatbot ID: ${chatbotId}`);
    console.log(`💬 User Query: "${message}"`);
    console.log(`⏱️  Timestamp: ${new Date().toISOString()}`);
    console.log('');

    // Step 1: Fetch chatbot configuration
    console.log('📌 STEP 1: Fetching chatbot configuration...');
    const chatbot = await Chatbot.findById(chatbotId);

    if (!chatbot) {
      return NextResponse.json(
        { success: false, error: 'Chatbot not found' },
        { status: 404 }
      );
    }

    console.log(`✅ Chatbot found: ${chatbot.name}`);
    console.log('');

    // Step 2: Query optimization
    console.log('📌 STEP 2: Optimizing query...');
    const originalQuery = message.trim();
    const optimizedQuery = optimizeQuery(originalQuery);
    console.log(`   Original: "${originalQuery}"`);
    console.log(`   Optimized: "${optimizedQuery}"`);
    console.log('');

    // Step 3: Generate query embedding
    console.log('📌 STEP 3: Generating query embedding...');
    const queryEmbedding = await generateEmbedding(optimizedQuery);
    console.log(`✅ Embedding generated (${queryEmbedding.length} dimensions)`);
    console.log('');

    // Step 4: Semantic search for relevant chunks
    console.log('📌 STEP 4: Performing semantic search...');
    const {
      limit = 5,
      minSimilarity = 0.3,
    } = retrievalOptions;

    const retrievedChunks = await Chunk.searchByEmbedding(
      chatbotId,
      queryEmbedding,
      limit
    );

    // Filter by minimum similarity
    const relevantChunks = retrievedChunks.filter(
      chunk => chunk.similarity >= minSimilarity
    );

    console.log(`✅ Found ${relevantChunks.length} relevant chunks`);
    if (relevantChunks.length > 0) {
      console.log(`   Top similarity: ${(relevantChunks[0].similarity * 100).toFixed(1)}%`);
      console.log(`   Avg similarity: ${(relevantChunks.reduce((sum, c) => sum + c.similarity, 0) / relevantChunks.length * 100).toFixed(1)}%`);
    }
    console.log('');

    // Step 5: Calculate relevance metrics
    const metrics = calculateRelevanceMetrics(relevantChunks);
    console.log('📊 Relevance Metrics:');
    console.log(`   Quality Score: ${(metrics.qualityScore * 100).toFixed(1)}%`);
    console.log(`   Confidence: ${metrics.confidence}`);
    console.log('');

    // Step 6: Build context from retrieved chunks
    console.log('📌 STEP 5: Building context...');
    const contextData = buildContext(relevantChunks, {
      maxChunks: limit,
      minSimilarity,
      includeMetadata: true,
    });

    console.log(`✅ Context built`);
    console.log(`   Chunks used: ${contextData.chunksUsed}`);
    console.log(`   Estimated tokens: ${contextData.tokensEstimate}`);
    console.log(`   Sources: ${contextData.sources.length}`);
    console.log('');

    // Step 7: Build system prompt with context
    console.log('📌 STEP 6: Building prompt...');
    const systemPrompt = buildSystemPrompt(chatbot, contextData.context);
    console.log(`✅ System prompt built (${systemPrompt.length} chars)`);
    console.log('');

    // Step 8: Build complete message array
    const messages = buildChatMessages(
      systemPrompt,
      originalQuery,
      conversationHistory
    );

    console.log('📌 STEP 7: Generating response with Gemini...');
    console.log(`   Model: ${generationOptions.model || 'gemini-2.0-flash-exp'}`);
    console.log(`   Stream: ${stream}`);
    console.log('');

    // Step 9: Generate response using Gemini
    let responseText;
    let usage;

    if (stream) {
      // For streaming, we'll use a different approach
      // Create a ReadableStream to stream back to the client
      const encoder = new TextEncoder();

      const streamResponse = new ReadableStream({
        async start(controller) {
          try {
            await streamChatCompletion(
              messages,
              {
                model: generationOptions.model || 'gemini-2.0-flash-exp',
                temperature: generationOptions.temperature || 0.7,
                maxTokens: generationOptions.maxTokens || 2048,
              },
              (chunk) => {
                // Send each chunk to the client
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ chunk })}\n\n`));
              }
            );

            // Send completion signal
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
            controller.close();
          } catch (error) {
            controller.error(error);
          }
        },
      });

      return new Response(streamResponse, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    } else {
      // Non-streaming response
      const completion = await generateChatCompletion(messages, {
        model: generationOptions.model || 'gemini-2.0-flash-exp',
        temperature: generationOptions.temperature || 0.7,
        maxTokens: generationOptions.maxTokens || 2048,
      });

      responseText = completion.text;
      usage = completion.usage;

      console.log('✅ Response generated');
      console.log('');

      // Step 10: Extract citations
      console.log('📌 STEP 8: Post-processing...');
      const citations = extractCitations(responseText);
      console.log(`✅ Found ${citations.length} citations`);
      console.log('');

      // Calculate total time
      const totalTime = Date.now() - startTime;
      console.log('='.repeat(80));
      console.log(`✅ RAG PIPELINE COMPLETED in ${totalTime}ms`);
      console.log('='.repeat(80));
      console.log('');

      // Return complete response
      return NextResponse.json({
        success: true,
        response: responseText,
        metadata: {
          chatbotId,
          query: originalQuery,
          optimizedQuery,
          retrieval: {
            chunksRetrieved: retrievedChunks.length,
            chunksUsed: contextData.chunksUsed,
            sources: contextData.sources,
            metrics: metrics,
          },
          generation: {
            model: completion.model,
            usage: usage,
          },
          citations,
          processingTime: totalTime,
          timestamp: new Date().toISOString(),
        },
      });
    }

  } catch (error) {
    console.error('\n❌ RAG PIPELINE ERROR:', error);
    console.error('Stack:', error.stack);

    // Check for specific error types
    if (error.message.includes('GEMINI_API_KEY')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Gemini API key not configured',
          details: 'Please set the GEMINI_API_KEY environment variable',
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to process chat request',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
