import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { Document } from '@/models/Document';
import { Chunk } from '@/models/Chunk';
import { Chatbot } from '@/models/Chatbot';
import { writeFile, mkdir, readFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { ObjectId } from 'mongodb';
import { generateEmbedding } from '@/lib/embeddings';

// Configuration
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain'
];
const CHUNK_SIZE = 1000; // Characters per chunk

/**
 * Validates uploaded file
 */
function validateFile(file) {
  const errors = [];

  if (!file) {
    errors.push('No file provided');
    return errors;
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    errors.push(`File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`);
  }

  // Check file type
  if (!ALLOWED_TYPES.includes(file.type)) {
    errors.push(`File type ${file.type} is not allowed. Allowed types: PDF, DOC, DOCX, TXT`);
  }

  return errors;
}

/**
 * Splits text into chunks for vector embedding
 */
function splitTextIntoChunks(text, filename, chunkSize = CHUNK_SIZE) {
  const chunks = [];
  let currentChunk = '';
  let chunkIndex = 0;

  // Split by sentences (simple approach)
  const sentences = text.split(/[.!?]+\s+/);

  for (const sentence of sentences) {
    if ((currentChunk + sentence).length > chunkSize && currentChunk.length > 0) {
      chunks.push({
        text: currentChunk.trim(),
        metadata: {
          source: filename,
          chunkIndex: chunkIndex++,
        }
      });
      currentChunk = sentence;
    } else {
      currentChunk += (currentChunk.length > 0 ? '. ' : '') + sentence;
    }
  }

  // Add remaining chunk
  if (currentChunk.trim().length > 0) {
    chunks.push({
      text: currentChunk.trim(),
      metadata: {
        source: filename,
        chunkIndex: chunkIndex++,
      }
    });
  }

  return chunks;
}

/**
 * Extracts text from PDF file using pdf2json
 */
async function extractTextFromPDF(filepath) {
  return new Promise((resolve, reject) => {
    try {
      const PDFParser = require('pdf2json');
      const pdfParser = new PDFParser();

      let pageCount = 0;
      let fullText = '';

      pdfParser.on('pdfParser_dataReady', (pdfData) => {
        try {
          // Get page count
          pageCount = pdfData.Pages ? pdfData.Pages.length : 0;

          // Helper function to safely decode URI components
          const safeDecodeURIComponent = (str) => {
            try {
              return decodeURIComponent(str);
            } catch (e) {
              // If decoding fails, return the original string
              return str;
            }
          };

          // Extract text from all pages
          if (pdfData.Pages) {
            pdfData.Pages.forEach(page => {
              if (page.Texts) {
                page.Texts.forEach(text => {
                  if (text.R) {
                    text.R.forEach(r => {
                      if (r.T) {
                        fullText += safeDecodeURIComponent(r.T) + ' ';
                      }
                    });
                  }
                });
                fullText += '\n';
              }
            });
          }

          resolve({
            text: fullText.trim(),
            pageCount: pageCount,
            metadata: {},
          });
        } catch (err) {
          reject(new Error(`Failed to extract text: ${err.message}`));
        }
      });

      pdfParser.on('pdfParser_dataError', (error) => {
        console.error('PDF parsing error:', error);
        if (error.parserError && error.parserError.includes('password')) {
          reject(new Error('PDF is password-protected. Please upload an unprotected file.'));
        } else {
          reject(new Error(`Failed to parse PDF: ${error.parserError || error.message || 'Unknown error'}`));
        }
      });

      // Load and parse the PDF file
      pdfParser.loadPDF(filepath);

    } catch (error) {
      console.error('PDF parser initialization error:', error);
      reject(new Error(`Failed to initialize PDF parser: ${error.message}`));
    }
  });
}

/**
 * Extracts text from TXT file
 */
async function extractTextFromTXT(filepath) {
  const text = await readFile(filepath, 'utf-8');
  return {
    text,
    pageCount: 1,
    metadata: {},
  };
}

/**
 * Saves file to disk
 */
async function saveFile(file, chatbotId) {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Create upload directory if it doesn't exist
  const uploadDir = path.join(process.cwd(), 'public', 'uploads', chatbotId);
  if (!existsSync(uploadDir)) {
    await mkdir(uploadDir, { recursive: true });
  }

  // Generate unique filename
  const timestamp = Date.now();
  const filename = `${timestamp}-${file.name}`;
  const filepath = path.join(uploadDir, filename);

  // Save file
  await writeFile(filepath, buffer);

  return {
    filepath,
    url: `/uploads/${chatbotId}/${filename}`,
  };
}

/**
 * POST /api/chatbots/[chatbotId]/documents
 * Upload and process a document
 */
export async function POST(request, { params }) {
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

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file');

    // Validate file
    const validationErrors = validateFile(file);
    if (validationErrors.length > 0) {
      return NextResponse.json(
        { error: validationErrors.join(', ') },
        { status: 400 }
      );
    }

    // Save file to disk
    const { url, filepath } = await saveFile(file, chatbotId);

    // Extract text based on file type
    let extractedData;
    let wordCount = 0;

    console.log(`\n📄 Processing file: ${file.name} (${file.type})`);

    if (file.type === 'application/pdf') {
      extractedData = await extractTextFromPDF(filepath);
      console.log(`✅ PDF parsed successfully:`);
      console.log(`   - Pages: ${extractedData.pageCount}`);
      console.log(`   - Text length: ${extractedData.text.length} characters`);
      console.log(`   - First 200 chars: ${extractedData.text.substring(0, 200)}...`);
    } else if (file.type === 'text/plain') {
      extractedData = await extractTextFromTXT(filepath);
      console.log(`✅ TXT file parsed successfully:`);
      console.log(`   - Text length: ${extractedData.text.length} characters`);
      console.log(`   - First 200 chars: ${extractedData.text.substring(0, 200)}...`);
    } else {
      // For DOC/DOCX, you would need additional libraries like mammoth
      return NextResponse.json(
        { error: 'Document type not yet supported. Currently only PDF and TXT are supported.' },
        { status: 400 }
      );
    }

    // Count words
    wordCount = extractedData.text.split(/\s+/).filter(word => word.length > 0).length;
    console.log(`   - Word count: ${wordCount.toLocaleString()}`);

    // Create document record
    const document = await Document.create({
      chatbotId: new ObjectId(chatbotId),
      filename: file.name,
      type: file.type,
      url,
      pageCount: extractedData.pageCount,
      wordCount,
      status: 'processing',
    });

    console.log(`\n📊 Document record created: ${document._id}`);

    // Split text into chunks
    const textChunks = splitTextIntoChunks(extractedData.text, file.name);
    console.log(`\n✂️ Text split into ${textChunks.length} chunks`);

    // Log first chunk as example
    if (textChunks.length > 0) {
      console.log(`\n📝 Example chunk (first):`);
      console.log(`   - Text: ${textChunks[0].text.substring(0, 150)}...`);
      console.log(`   - Metadata:`, textChunks[0].metadata);
    }

    // Generate embeddings for each chunk
    console.log(`\n🔄 Generating embeddings for ${textChunks.length} chunks...`);
    const chunkRecords = [];

    for (let i = 0; i < textChunks.length; i++) {
      const chunk = textChunks[i];

      try {
        const embedding = await generateEmbedding(chunk.text);

        chunkRecords.push({
          chatbotId: new ObjectId(chatbotId),
          documentId: document._id,
          text: chunk.text,
          embedding: embedding,
          metadata: chunk.metadata,
        });

        // Log progress every 10 chunks
        if ((i + 1) % 10 === 0 || i === textChunks.length - 1) {
          console.log(`   ✓ Generated ${i + 1}/${textChunks.length} embeddings`);
        }
      } catch (error) {
        console.error(`   ❌ Error generating embedding for chunk ${i}:`, error.message);
        // Still add the chunk but with empty embedding
        chunkRecords.push({
          chatbotId: new ObjectId(chatbotId),
          documentId: document._id,
          text: chunk.text,
          embedding: [],
          metadata: chunk.metadata,
        });
      }
    }

    await Chunk.createMany(chunkRecords);
    console.log(`✅ ${chunkRecords.length} chunks saved to MongoDB with embeddings\n`);

    // Update document status to processed
    await Document.updateStatus(document._id, 'processed', {
      chunkCount: chunkRecords.length,
    });

    return NextResponse.json({
      success: true,
      document: {
        ...document,
        status: 'processed',
        chunkCount: chunkRecords.length,
      },
    }, { status: 201 });

  } catch (error) {
    console.error('Document upload error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to upload document' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/chatbots/[chatbotId]/documents
 * Get all documents for a chatbot
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

    // Get all documents for this chatbot
    const documents = await Document.findByChatbotId(chatbotId);

    return NextResponse.json({
      success: true,
      documents,
    });

  } catch (error) {
    console.error('Get documents error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch documents' },
      { status: 500 }
    );
  }
}
