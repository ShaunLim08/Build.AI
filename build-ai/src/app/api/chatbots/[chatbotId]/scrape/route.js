import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { Document } from '@/models/Document';
import { Chunk } from '@/models/Chunk';
import { Chatbot } from '@/models/Chatbot';
import { scrapeUrl, scrapeMultipleUrls, validateUrl } from '@/lib/webScraper';
import { ObjectId } from 'mongodb';
import { generateEmbedding } from '@/lib/embeddings';

export const runtime = 'nodejs';

// Configuration
const CHUNK_SIZE = 1000; // Characters per chunk

/**
 * Splits text into chunks for vector embedding
 */
function splitTextIntoChunks(text, source, chunkSize = CHUNK_SIZE) {
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
          source,
          chunkIndex: chunkIndex++,
          type: 'web',
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
        source,
        chunkIndex: chunkIndex++,
        type: 'web',
      }
    });
  }

  return chunks;
}

/**
 * POST /api/chatbots/[chatbotId]/scrape
 * Scrape one or more URLs and add to chatbot knowledge base
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

    // Parse request body
    const body = await request.json();
    const { url, urls } = body;

    // Validate input
    if (!url && (!urls || !Array.isArray(urls) || urls.length === 0)) {
      return NextResponse.json(
        { error: 'Either "url" (string) or "urls" (array) is required' },
        { status: 400 }
      );
    }

    // Handle single URL
    if (url) {
      console.log(`\n📄 Processing single URL for chatbot: ${chatbot.name}`);

      // Validate URL
      const validation = validateUrl(url);
      if (!validation.valid) {
        return NextResponse.json(
          { error: `Invalid URL: ${validation.errors.join(', ')}` },
          { status: 400 }
        );
      }

      // Scrape URL
      let scrapedData;
      try {
        scrapedData = await scrapeUrl(url);
      } catch (error) {
        console.error('Scraping error:', error);
        return NextResponse.json(
          { error: error.message || 'Failed to scrape URL' },
          { status: 400 }
        );
      }

      // Create document record
      const document = await Document.create({
        chatbotId: new ObjectId(chatbotId),
        filename: scrapedData.title || 'Untitled',
        type: 'text/html',
        url: scrapedData.url,
        pageCount: 1,
        wordCount: scrapedData.wordCount,
        status: 'processing',
        metadata: {
          siteName: scrapedData.siteName,
          author: scrapedData.author,
          excerpt: scrapedData.excerpt,
          scrapedAt: scrapedData.scrapedAt,
        },
      });

      console.log(`\n📊 Document record created: ${document._id}`);

      // Split content into chunks
      const textChunks = splitTextIntoChunks(
        scrapedData.content,
        scrapedData.title || scrapedData.url
      );
      console.log(`\n✂️ Text split into ${textChunks.length} chunks`);

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
        scrapedData: {
          title: scrapedData.title,
          url: scrapedData.url,
          wordCount: scrapedData.wordCount,
          chunkCount: chunkRecords.length,
        },
      }, { status: 201 });
    }

    // Handle multiple URLs
    if (urls && Array.isArray(urls)) {
      console.log(`\n📄 Processing ${urls.length} URLs for chatbot: ${chatbot.name}`);

      // Limit number of URLs
      if (urls.length > 10) {
        return NextResponse.json(
          { error: 'Maximum 10 URLs allowed per request' },
          { status: 400 }
        );
      }

      // Validate all URLs first
      const validationResults = urls.map(url => ({
        url,
        validation: validateUrl(url),
      }));

      const invalidUrls = validationResults.filter(r => !r.validation.valid);
      if (invalidUrls.length > 0) {
        return NextResponse.json(
          {
            error: 'Some URLs are invalid',
            invalidUrls: invalidUrls.map(r => ({
              url: r.url,
              errors: r.validation.errors,
            })),
          },
          { status: 400 }
        );
      }

      // Scrape all URLs
      const scrapeResults = await scrapeMultipleUrls(urls, { continueOnError: true });

      // Process successful scrapes
      const documents = [];
      for (const result of scrapeResults.results) {
        if (result.success) {
          try {
            const scrapedData = result.data;

            // Create document record
            const document = await Document.create({
              chatbotId: new ObjectId(chatbotId),
              filename: scrapedData.title || 'Untitled',
              type: 'text/html',
              url: scrapedData.url,
              pageCount: 1,
              wordCount: scrapedData.wordCount,
              status: 'processing',
              metadata: {
                siteName: scrapedData.siteName,
                author: scrapedData.author,
                excerpt: scrapedData.excerpt,
                scrapedAt: scrapedData.scrapedAt,
              },
            });

            // Split content into chunks
            const textChunks = splitTextIntoChunks(
              scrapedData.content,
              scrapedData.title || scrapedData.url
            );

            // Generate embeddings for each chunk
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
              } catch (error) {
                console.error(`Error generating embedding for chunk ${i}:`, error.message);
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

            // Update document status
            await Document.updateStatus(document._id, 'processed', {
              chunkCount: chunkRecords.length,
            });

            documents.push({
              ...document,
              status: 'processed',
              chunkCount: chunkRecords.length,
            });
          } catch (error) {
            console.error(`Failed to process scraped content from ${result.url}:`, error);
          }
        }
      }

      return NextResponse.json({
        success: true,
        summary: {
          totalRequested: urls.length,
          successCount: scrapeResults.successCount,
          errorCount: scrapeResults.errorCount,
          documentsCreated: documents.length,
        },
        documents,
        errors: scrapeResults.errors,
      }, { status: 201 });
    }

  } catch (error) {
    console.error('Web scraping error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to scrape URL(s)' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/chatbots/[chatbotId]/scrape/validate
 * Validate a URL without scraping
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

    // Get URL from query params
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');

    if (!url) {
      return NextResponse.json(
        { error: 'URL parameter is required' },
        { status: 400 }
      );
    }

    // Validate URL
    const validation = validateUrl(url);

    return NextResponse.json({
      valid: validation.valid,
      errors: validation.errors,
      sanitizedUrl: validation.sanitizedUrl,
    });

  } catch (error) {
    console.error('URL validation error:', error);
    return NextResponse.json(
      { error: 'Failed to validate URL' },
      { status: 500 }
    );
  }
}
