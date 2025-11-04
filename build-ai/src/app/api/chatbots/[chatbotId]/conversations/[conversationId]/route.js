import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { Chatbot } from '@/models/Chatbot';
import { Conversation } from '@/models/Conversation';

export const runtime = 'nodejs';

/**
 * GET /api/chatbots/[chatbotId]/conversations/[conversationId]
 * Get a specific conversation
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
    const { chatbotId, conversationId } = await params;

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

    // Get conversation
    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    // Verify conversation belongs to this chatbot
    if (conversation.chatbotId.toString() !== chatbotId) {
      return NextResponse.json(
        { error: 'Conversation does not belong to this chatbot' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      conversation
    });

  } catch (error) {
    console.error('Get conversation error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversation' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/chatbots/[chatbotId]/conversations/[conversationId]
 * Delete a specific conversation
 */
export async function DELETE(request, { params }) {
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
    const { chatbotId, conversationId } = await params;

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

    // Get conversation to verify ownership
    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    // Verify conversation belongs to this chatbot
    if (conversation.chatbotId.toString() !== chatbotId) {
      return NextResponse.json(
        { error: 'Conversation does not belong to this chatbot' },
        { status: 403 }
      );
    }

    // Delete conversation
    await Conversation.delete(conversationId);

    return NextResponse.json({
      success: true,
      message: 'Conversation deleted successfully'
    });

  } catch (error) {
    console.error('Delete conversation error:', error);
    return NextResponse.json(
      { error: 'Failed to delete conversation' },
      { status: 500 }
    );
  }
}
