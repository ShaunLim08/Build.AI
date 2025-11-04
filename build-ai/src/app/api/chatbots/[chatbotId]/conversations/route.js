import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { Chatbot } from '@/models/Chatbot';
import { Conversation } from '@/models/Conversation';

export const runtime = 'nodejs';

/**
 * GET /api/chatbots/[chatbotId]/conversations
 * Get all conversations for a chatbot
 */
export async function GET(request, { params }) {
  try {
    // Authenticate user
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Await params (required in Next.js 15)
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

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit')) || 50;
    const skip = parseInt(searchParams.get('skip')) || 0;
    const sortBy = searchParams.get('sortBy') || 'lastMessageAt';
    const order = searchParams.get('order') === 'asc' ? 1 : -1;

    // Fetch conversations
    const conversations = await Conversation.findByChatbotId(chatbotId, {
      limit,
      skip,
      sortBy,
      order
    });

    // Get stats
    const stats = await Conversation.getStats(chatbotId);

    return NextResponse.json({
      success: true,
      conversations,
      stats,
      pagination: {
        limit,
        skip,
        total: conversations.length
      }
    });

  } catch (error) {
    console.error('Get conversations error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 }
    );
  }
}
