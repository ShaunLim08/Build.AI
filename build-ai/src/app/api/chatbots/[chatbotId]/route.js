import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { Chatbot } from '@/models/Chatbot';
import { Document } from '@/models/Document';
import { Chunk } from '@/models/Chunk';

export const runtime = 'nodejs';

/**
 * GET /api/chatbots/[chatbotId]
 * Get a specific chatbot by ID
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

    // Get chatbot
    const chatbot = await Chatbot.findById(chatbotId);

    if (!chatbot) {
      return NextResponse.json(
        { error: 'Chatbot not found' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (chatbot.userId.toString() !== user._id.toString()) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      chatbot,
    });

  } catch (error) {
    console.error('Get chatbot error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chatbot' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/chatbots/[chatbotId]
 * Update a chatbot
 */
export async function PATCH(request, { params }) {
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

    // Get chatbot to verify ownership
    const chatbot = await Chatbot.findById(chatbotId);

    if (!chatbot) {
      return NextResponse.json(
        { error: 'Chatbot not found' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (chatbot.userId.toString() !== user._id.toString()) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Get update data
    const body = await request.json();
    const { name, description, systemInstruction, isPublic, settings } = body;

    // Build update object
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (systemInstruction !== undefined) updateData.systemInstruction = systemInstruction;
    if (isPublic !== undefined) updateData.isPublic = isPublic;
    if (settings !== undefined) updateData.settings = settings;

    // Update chatbot
    const updatedChatbot = await Chatbot.update(chatbotId, updateData);

    return NextResponse.json({
      success: true,
      chatbot: updatedChatbot,
    });

  } catch (error) {
    console.error('Update chatbot error:', error);
    return NextResponse.json(
      { error: 'Failed to update chatbot' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/chatbots/[chatbotId]
 * Delete a chatbot and all its documents/chunks
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
    const { chatbotId } = await params;

    // Get chatbot to verify ownership
    const chatbot = await Chatbot.findById(chatbotId);

    if (!chatbot) {
      return NextResponse.json(
        { error: 'Chatbot not found' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (chatbot.userId.toString() !== user._id.toString()) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Cascade delete: delete all associated documents and chunks
    console.log(`🗑️  Deleting chatbot ${chatbotId} and all associated data...`);

    // Delete all chunks for this chatbot
    const deletedChunks = await Chunk.deleteByChatbotId(chatbotId);
    console.log(`   ✓ Deleted ${deletedChunks} chunks`);

    // Delete all documents for this chatbot
    const deletedDocuments = await Document.deleteByChatbotId(chatbotId);
    console.log(`   ✓ Deleted ${deletedDocuments} documents`);

    // Delete the chatbot itself
    await Chatbot.delete(chatbotId);
    console.log(`   ✓ Deleted chatbot`);

    return NextResponse.json({
      success: true,
      message: 'Chatbot deleted successfully',
      deletedCounts: {
        chatbot: 1,
        documents: deletedDocuments,
        chunks: deletedChunks,
      },
    });

  } catch (error) {
    console.error('Delete chatbot error:', error);
    return NextResponse.json(
      { error: 'Failed to delete chatbot' },
      { status: 500 }
    );
  }
}
