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
import { generateChatCompletion } from '@/lib/gemini';
import { rateLimitWidget } from '@/lib/rateLimit';

export const runtime = 'nodejs';

/**
 * POST /api/widget/[chatbotId]/chat
 * Public endpoint for widget - NO AUTHENTICATION REQUIRED
 */
export async function POST(request, { params }) {
  const startTime = Date.now();

  try {
    const { chatbotId } = await params;

    // Check rate limit BEFORE processing
    const rateLimitResult = await rateLimitWidget(request, chatbotId);

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: rateLimitResult.error,
        },
        {
          status: 429,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
            ...rateLimitResult.headers,
          },
        }
      );
    }

    const body = await request.json();

    const {
      message,
      conversationHistory = [],
      sessionId,
    } = body;

    // Validate input
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Get chatbot and verify it's public
    const chatbot = await Chatbot.findById(chatbotId);

    if (!chatbot) {
      return NextResponse.json(
        { error: 'Chatbot not found' },
        { status: 404 }
      );
    }

    // Check if chatbot is public
    if (!chatbot.isPublic) {
      return NextResponse.json(
        { error: 'This chatbot is not publicly accessible' },
        { status: 403 }
      );
    }

    // Process the message using RAG pipeline
    const originalQuery = message.trim();
    const optimizedQuery = optimizeQuery(originalQuery);

    // Generate embedding
    const queryEmbedding = await generateEmbedding(optimizedQuery);

    // Semantic search
    const retrievedChunks = await Chunk.searchByEmbedding(
      chatbotId,
      queryEmbedding,
      5 // limit
    );

    const relevantChunks = retrievedChunks.filter(
      chunk => chunk.similarity >= 0.3
    );

    // Calculate metrics
    const metrics = calculateRelevanceMetrics(relevantChunks);

    // Build context
    const contextData = buildContext(relevantChunks, {
      maxChunks: 5,
      minSimilarity: 0.3,
      includeMetadata: true,
    });

    // Build system prompt
    const systemPrompt = buildSystemPrompt(chatbot, contextData.context);

    // Build messages
    const messages = buildChatMessages(
      systemPrompt,
      originalQuery,
      conversationHistory
    );

    // Generate response
    const completion = await generateChatCompletion(messages, {
      model: 'gemini-2.0-flash-exp',
      temperature: chatbot.settings?.temperature || 0.7,
      maxTokens: chatbot.settings?.maxTokens || 2000,
    });

    const responseText = completion.text;
    const citations = extractCitations(responseText);

    // Save conversation if sessionId provided
    if (sessionId) {
      try {
        let conversation = await Conversation.findBySessionId(sessionId);

        if (!conversation) {
          conversation = await Conversation.create({
            chatbotId,
            sessionId,
            messages: [{
              role: 'user',
              content: originalQuery,
              timestamp: new Date()
            }]
          });
        } else {
          await Conversation.addMessage(sessionId, {
            role: 'user',
            content: originalQuery
          });
        }

        const sourceChunkIds = relevantChunks.map(chunk => chunk._id);
        await Conversation.addMessage(sessionId, {
          role: 'assistant',
          content: responseText,
          sources: sourceChunkIds,
          metadata: {
            model: completion.model,
            qualityScore: metrics.qualityScore,
            confidence: metrics.confidence
          }
        });
      } catch (convError) {
        console.error('Failed to save conversation:', convError);
      }
    }

    const totalTime = Date.now() - startTime;

    // Return widget-friendly response
    return NextResponse.json({
      success: true,
      response: responseText,
      metadata: {
        sources: contextData.sources.length,
        confidence: metrics.confidence,
        processingTime: totalTime,
      },
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        ...rateLimitResult.headers,
      }
    });

  } catch (error) {
    console.error('Widget chat error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'An error occurred processing your message. Please try again.',
      },
      {
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        }
      }
    );
  }
}

/**
 * OPTIONS /api/widget/[chatbotId]/chat
 * Handle CORS preflight
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
