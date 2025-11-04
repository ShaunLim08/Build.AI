import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { Chatbot } from '@/models/Chatbot';
import { ApiKey } from '@/models/ApiKey';
import { ObjectId } from 'mongodb';

/**
 * DELETE /api/chatbots/[chatbotId]/api-keys/[keyId]
 * Revoke an API key
 */
export async function DELETE(request, { params }) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { chatbotId, keyId } = await params;

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

    // Revoke the API key
    const success = await ApiKey.revoke(keyId);

    if (!success) {
      return NextResponse.json(
        { error: 'API key not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'API key revoked successfully',
    });

  } catch (error) {
    console.error('Error revoking API key:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/chatbots/[chatbotId]/api-keys/[keyId]
 * Update an API key
 */
export async function PATCH(request, { params }) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { chatbotId, keyId } = await params;
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

    // Update the API key
    const updates = {
      name: body.name,
      isActive: body.isActive,
      permissions: body.permissions,
      rateLimit: body.rateLimit,
      allowedOrigins: body.allowedOrigins,
      allowedIPs: body.allowedIPs,
    };

    const success = await ApiKey.update(keyId, updates);

    if (!success) {
      return NextResponse.json(
        { error: 'API key not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'API key updated successfully',
    });

  } catch (error) {
    console.error('Error updating API key:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
