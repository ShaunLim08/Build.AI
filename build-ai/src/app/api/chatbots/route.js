import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { Chatbot } from '@/models/Chatbot';
import { ObjectId } from 'mongodb';

/**
 * GET /api/chatbots
 * Get all chatbots for the authenticated user
 */
export async function GET(request) {
  try {
    // Authenticate user
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get all chatbots for this user
    const chatbots = await Chatbot.findByUserId(user._id);

    return NextResponse.json({
      success: true,
      chatbots,
    });

  } catch (error) {
    console.error('Get chatbots error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chatbots' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/chatbots
 * Create a new chatbot
 */
export async function POST(request) {
  try {
    // Authenticate user
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, description, systemInstruction, settings } = body;

    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { error: 'Chatbot name is required' },
        { status: 400 }
      );
    }

    // Create chatbot
    const chatbot = await Chatbot.create({
      userId: user._id,
      name,
      description: description || '',
      systemInstruction: systemInstruction || 'You are a helpful assistant.',
      isPublic: false,
      settings: settings || {
        temperature: 0.7,
        maxTokens: 2000,
        responseStyle: 'balanced',
      },
    });

    return NextResponse.json({
      success: true,
      chatbot,
    }, { status: 201 });

  } catch (error) {
    console.error('Create chatbot error:', error);
    return NextResponse.json(
      { error: 'Failed to create chatbot' },
      { status: 500 }
    );
  }
}
