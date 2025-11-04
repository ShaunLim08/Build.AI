import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { Chatbot } from '@/models/Chatbot';
import { ApiKey } from '@/models/ApiKey';

/**
 * GET /api/chatbots/[chatbotId]/api-keys
 * Get all API keys for a chatbot
 */
export async function GET(request, { params }) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { chatbotId } = await params;

    // Verify chatbot ownership
    const chatbot = await Chatbot.findById(chatbotId);

    if (!chatbot) {
      return NextResponse.json(
        { error: 'Chatbot not found' },
        { status: 404 }
      );
    }

    if (chatbot.userId.toString() !== user._id.toString()) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Get all API keys
    const apiKeys = await ApiKey.findByChatbotId(chatbotId);

    // Get usage stats
    const stats = await ApiKey.getUsageStats(chatbotId);

    // Mask the keys for security (show only last 8 characters)
    const maskedKeys = apiKeys.map(key => ({
      ...key,
      key: `...${key.key.slice(-8)}`,
      fullKey: undefined, // Remove full key from response
    }));

    return NextResponse.json({
      success: true,
      apiKeys: maskedKeys,
      stats,
    });

  } catch (error) {
    console.error('Error fetching API keys:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/chatbots/[chatbotId]/api-keys
 * Generate a new API key
 */
export async function POST(request, { params }) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { chatbotId } = await params;
    const body = await request.json();

    // Verify chatbot ownership
    const chatbot = await Chatbot.findById(chatbotId);

    if (!chatbot) {
      return NextResponse.json(
        { error: 'Chatbot not found' },
        { status: 404 }
      );
    }

    if (chatbot.userId.toString() !== user._id.toString()) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Check if user already has max API keys (limit to 10 per chatbot)
    const existingKeys = await ApiKey.findByChatbotId(chatbotId);
    if (existingKeys.length >= 10) {
      return NextResponse.json(
        { error: 'Maximum API keys limit reached (10 per chatbot)' },
        { status: 400 }
      );
    }

    // Create API key
    const options = {
      name: body.name || 'API Key',
      environment: body.environment || 'production',
      permissions: body.permissions || ['chat'],
      rateLimit: body.rateLimit || {
        requestsPerMinute: 60,
        requestsPerDay: 10000,
      },
      allowedOrigins: body.allowedOrigins || ['*'],
      allowedIPs: body.allowedIPs || [],
      expiresAt: body.expiresAt || null,
    };

    const apiKey = await ApiKey.create(chatbotId, user._id, options);

    // Return full key ONLY on creation (user won't see it again)
    return NextResponse.json({
      success: true,
      message: 'API key created successfully. Save this key - you won\'t see it again!',
      apiKey: {
        _id: apiKey._id,
        key: apiKey.key, // Full key shown only once
        name: apiKey.name,
        environment: apiKey.environment,
        permissions: apiKey.permissions,
        rateLimit: apiKey.rateLimit,
        createdAt: apiKey.createdAt,
        allowedOrigins: apiKey.allowedOrigins,
        allowedIPs: apiKey.allowedIPs,
      },
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating API key:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
