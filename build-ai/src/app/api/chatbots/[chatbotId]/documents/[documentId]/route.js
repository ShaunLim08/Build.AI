import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { Document } from '@/models/Document';
import { Chunk } from '@/models/Chunk';
import { Chatbot } from '@/models/Chatbot';
import { unlink } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

/**
 * DELETE /api/chatbots/[chatbotId]/documents/[documentId]
 * Delete a document and its associated chunks
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
    const { chatbotId, documentId } = await params;

    console.log(`\n🗑️  DELETE request for document: ${documentId}`);

    // Verify chatbot exists and belongs to user
    const chatbot = await Chatbot.findById(chatbotId);
    if (!chatbot) {
      return NextResponse.json(
        { error: 'Chatbot not found' },
        { status: 404 }
      );
    }

    // Compare ObjectIds by converting both to strings
    if (chatbot.userId.toString() !== user._id.toString()) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Get document to verify it exists and belongs to this chatbot
    const document = await Document.findById(documentId);
    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    // Verify document belongs to this chatbot
    if (document.chatbotId.toString() !== chatbotId) {
      return NextResponse.json(
        { error: 'Document does not belong to this chatbot' },
        { status: 403 }
      );
    }

    console.log(`📄 Deleting document: ${document.filename}`);

    // Delete associated chunks
    console.log(`🔄 Deleting associated chunks...`);
    const deletedChunks = await Chunk.deleteByDocumentId(documentId);
    console.log(`✅ Deleted ${deletedChunks} chunks`);

    // Delete the physical file if it exists
    if (document.url) {
      try {
        // Extract file path from URL
        const filepath = path.join(process.cwd(), 'public', document.url);
        if (existsSync(filepath)) {
          await unlink(filepath);
          console.log(`✅ Deleted physical file: ${filepath}`);
        }
      } catch (fileError) {
        console.error('⚠️  Error deleting physical file:', fileError);
        // Continue with deletion even if file removal fails
      }
    }

    // Delete document record
    const deleted = await Document.delete(documentId);
    if (!deleted) {
      return NextResponse.json(
        { error: 'Failed to delete document' },
        { status: 500 }
      );
    }

    console.log(`✅ Document deleted successfully\n`);

    return NextResponse.json({
      success: true,
      message: 'Document and associated chunks deleted successfully',
      deletedChunks,
    });

  } catch (error) {
    console.error('❌ Document deletion error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete document' },
      { status: 500 }
    );
  }
}
