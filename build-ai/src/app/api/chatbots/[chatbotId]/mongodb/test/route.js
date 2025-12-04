import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { validateConnectionString, testConnection } from '@/lib/mongoConnector';

export const runtime = 'nodejs';

/**
 * PUT /api/chatbots/[chatbotId]/mongodb/test
 * Test connection to external MongoDB database
 */
export async function PUT(request, { params }) {
  try {
    // Authenticate user
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { connectionString, databaseName } = body;

    console.log('🔍 Testing MongoDB connection...');
    console.log('   Database:', databaseName);

    // Validate required fields
    if (!connectionString || !databaseName) {
      return NextResponse.json(
        {
          error: 'Missing required fields',
          required: ['connectionString', 'databaseName'],
        },
        { status: 400 }
      );
    }

    // Validate connection string
    const validation = validateConnectionString(connectionString);
    if (!validation.valid) {
      return NextResponse.json(
        {
          valid: false,
          errors: validation.errors,
        },
        { status: 400 }
      );
    }

    console.log('✅ Connection string validated');

    // Test connection
    const connectionTest = await testConnection(connectionString, databaseName);

    if (!connectionTest.success) {
      console.error('❌ Connection test failed:', connectionTest.error);
      return NextResponse.json(
        {
          connectionSuccessful: false,
          error: connectionTest.error,
          details: connectionTest.details,
        },
        { status: 400 }
      );
    }

    console.log('✅ Connection successful');
    console.log(`   Collections found: ${connectionTest.collections.length}`);

    return NextResponse.json({
      connectionSuccessful: true,
      message: 'Connection successful',
      collections: connectionTest.collections,
      databaseName: connectionTest.databaseName,
    });
  } catch (error) {
    console.error('❌ MongoDB connection test error:', error);
    return NextResponse.json(
      {
        connectionSuccessful: false,
        error: error.message || 'Failed to test connection',
      },
      { status: 500 }
    );
  }
}
