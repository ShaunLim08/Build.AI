import { NextResponse } from 'next/server';
import { Chatbot } from '@/models/Chatbot';
import { Chunk } from '@/models/Chunk';
import { Conversation } from '@/models/Conversation';
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
import { rateLimitWidget } from '@/lib/rateLimit';

/**
 * POST /api/chatbots/[chatbotId]/chat
 * Complete RAG pipeline: retrieve context and generate response
 *
 * NOTE: This endpoint is publicly accessible for embeds and widgets.
 * Rate limiting is applied based on IP address to prevent abuse.
 */
export async function POST(request, { params }) {
  const startTime = Date.now();

  try {
    // Await params (required in Next.js 15)
    const { chatbotId } = await params;

    // Apply rate limiting (using widget limits for now since no auth)
    const rateLimitResult = await rateLimitWidget(request, chatbotId);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: rateLimitResult.error,
        },
        {
          status: 429,
          headers: rateLimitResult.headers,
        }
      );
    }

    const body = await request.json();

    const {
      message,
      conversationHistory = [],
      sessionId,
      stream = false,
      retrievalOptions = {},
      generationOptions = {},
    } = body;

    // Validate input
    if (
      !message ||
      typeof message !== 'string' ||
      message.trim().length === 0
    ) {
      return NextResponse.json(
        { success: false, error: 'Message is required' },
        {
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
          },
        }
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
        {
          status: 404,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
          },
        }
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
    const { limit = 5, minSimilarity = 0.3 } = retrievalOptions;

    const retrievedChunks = await Chunk.searchByEmbedding(
      chatbotId,
      queryEmbedding,
      limit
    );

    // Filter by minimum similarity
    const relevantChunks = retrievedChunks.filter(
      (chunk) => chunk.similarity >= minSimilarity
    );

    console.log(`✅ Found ${relevantChunks.length} relevant chunks`);
    if (relevantChunks.length > 0) {
      console.log(
        `   Top similarity: ${(relevantChunks[0].similarity * 100).toFixed(1)}%`
      );
      console.log(
        `   Avg similarity: ${(
          (relevantChunks.reduce((sum, c) => sum + c.similarity, 0) /
            relevantChunks.length) *
          100
        ).toFixed(1)}%`
      );
    }
    console.log('');

    // Step 5: Check if any chunks were found
    if (retrievedChunks.length === 0) {
      console.log('⚠️  No documents found for this chatbot');
      console.log('   The chatbot needs documents to be uploaded first.');
      console.log('');

      return NextResponse.json(
        {
          success: false,
          error: 'No knowledge base found',
          message:
            "This chatbot doesn't have any documents uploaded yet. Please upload documents first.",
        },
        {
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
          },
        }
      );
    }

    // Step 5: Calculate relevance metrics
    const metrics = calculateRelevanceMetrics(relevantChunks);
    console.log('📊 Relevance Metrics:');
    console.log(
      `   Quality Score: ${(metrics.qualityScore * 100).toFixed(1)}%`
    );
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
    console.log(
      `   Model: ${generationOptions.model || 'gemini-2.0-flash-exp'}`
    );
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
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ chunk })}\n\n`)
                );
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
          Connection: 'keep-alive',
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

      // Step 11: Save conversation if sessionId provided
      if (sessionId) {
        try {
          console.log('📌 STEP 9: Saving conversation...');

          // Check if conversation exists
          let conversation = await Conversation.findBySessionId(sessionId);

          if (!conversation) {
            // Create new conversation with user message
            conversation = await Conversation.create({
              chatbotId,
              sessionId,
              messages: [
                {
                  role: 'user',
                  content: originalQuery,
                  timestamp: new Date(),
                },
              ],
            });
            console.log('✅ New conversation created');
          } else {
            // Add user message to existing conversation
            await Conversation.addMessage(sessionId, {
              role: 'user',
              content: originalQuery,
            });
            console.log('✅ User message added to conversation');
          }

          // Add assistant message with sources
          const sourceChunkIds = relevantChunks.map((chunk) => chunk._id);
          await Conversation.addMessage(sessionId, {
            role: 'assistant',
            content: responseText,
            sources: sourceChunkIds,
            metadata: {
              model: completion.model,
              usage: usage,
              processingTime: totalTime,
              qualityScore: metrics.qualityScore,
              confidence: metrics.confidence,
            },
          });
          console.log('✅ Assistant message saved with sources');
          console.log('');
        } catch (convError) {
          console.error('⚠️  Failed to save conversation:', convError);
          // Don't fail the request if conversation saving fails
        }
      }

      // Return complete response with CORS headers
      return NextResponse.json(
        {
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
        },
        {
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
          },
        }
      );
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
        {
          status: 500,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
          },
        }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to process chat request',
        details:
          process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      {
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      }
    );
  }
}

/**
 * OPTIONS /api/chatbots/[chatbotId]/chat
 * Handle CORS preflight requests
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
