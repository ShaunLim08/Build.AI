import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }

    // This is a protected endpoint - only authenticated users can access it
    return NextResponse.json(
      {
        message: 'This is protected data',
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
        },
        data: {
          // Your protected data here
          example: 'Only authenticated users can see this',
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Protected route error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
