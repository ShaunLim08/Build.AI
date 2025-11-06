/**
 * Embeddings using Google's Gemini API
 * Fast, serverless-friendly, and free!
 */

const GEMINI_EMBEDDING_API =
  'https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent';

function getApiKey() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not set');
  }
  return apiKey;
}

/**
 * Generate embedding for a single text using Google's Gemini API
 * @param {string} text - The text to embed
 * @returns {Promise<number[]>} - The embedding vector (768 dimensions)
 */
export async function generateEmbedding(text) {
  if (!text || typeof text !== 'string') {
    throw new Error('Text must be a non-empty string');
  }

  const apiKey = getApiKey();
  const cleanedText = text.trim();

  try {
    const response = await fetch(`${GEMINI_EMBEDDING_API}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'models/text-embedding-004',
        content: {
          parts: [{ text: cleanedText }],
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Gemini Embedding API error: ${response.status} ${errorText}`
      );
    }

    const data = await response.json();

    if (!data.embedding || !data.embedding.values) {
      throw new Error('Invalid response from Gemini Embedding API');
    }

    return data.embedding.values;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
}

/**
 * Generate embeddings for multiple texts in batch
 * More efficient than calling generateEmbedding multiple times
 * @param {string[]} texts - Array of texts to embed
 * @param {object} options - Options for batch processing
 * @returns {Promise<number[][]>} - Array of embedding vectors
 */
export async function generateEmbeddingsBatch(texts, options = {}) {
  const { batchSize = 10, onProgress } = options;

  if (!Array.isArray(texts) || texts.length === 0) {
    throw new Error('texts must be a non-empty array');
  }

  const embeddings = [];

  // Process in batches to avoid rate limits
  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    const batchEnd = Math.min(i + batchSize, texts.length);

    if (onProgress) {
      onProgress({
        current: batchEnd,
        total: texts.length,
        batchSize: batch.length,
        progress: (batchEnd / texts.length) * 100,
      });
    }

    console.log(
      `📊 Processing batch ${Math.floor(i / batchSize) + 1}: ${
        i + 1
      }-${batchEnd} of ${texts.length}`
    );

    // Generate embeddings for batch in parallel
    const batchEmbeddings = await Promise.all(
      batch.map((text) => generateEmbedding(text))
    );

    embeddings.push(...batchEmbeddings);

    // Small delay to avoid rate limiting
    if (i + batchSize < texts.length) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  return embeddings;
}

/**
 * Calculate cosine similarity between two embeddings
 * @param {number[]} embedding1 - First embedding vector
 * @param {number[]} embedding2 - Second embedding vector
 * @returns {number} - Similarity score (0 to 1, higher is more similar)
 */
export function cosineSimilarity(embedding1, embedding2) {
  if (!embedding1 || !embedding2 || embedding1.length !== embedding2.length) {
    throw new Error('Embeddings must be non-null arrays of the same length');
  }

  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;

  for (let i = 0; i < embedding1.length; i++) {
    dotProduct += embedding1[i] * embedding2[i];
    norm1 += embedding1[i] * embedding1[i];
    norm2 += embedding2[i] * embedding2[i];
  }

  const magnitude = Math.sqrt(norm1) * Math.sqrt(norm2);

  if (magnitude === 0) {
    return 0;
  }

  return dotProduct / magnitude;
}

/**
 * Find most similar embeddings using cosine similarity
 * @param {number[]} queryEmbedding - The query embedding
 * @param {Array<{embedding: number[], data: any}>} documents - Array of documents with embeddings
 * @param {number} topK - Number of results to return
 * @returns {Array<{similarity: number, data: any}>} - Top K most similar documents
 */
export function findSimilar(queryEmbedding, documents, topK = 5) {
  if (!queryEmbedding || !Array.isArray(documents)) {
    throw new Error('Invalid input parameters');
  }

  // Calculate similarities
  const similarities = documents.map((doc) => ({
    similarity: cosineSimilarity(queryEmbedding, doc.embedding),
    data: doc.data,
  }));

  // Sort by similarity (highest first) and return top K
  return similarities
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topK);
}

/**
 * Get embedding model info
 */
export function getModelInfo() {
  return {
    model: 'text-embedding-004',
    provider: 'Google Gemini',
    dimensions: 768,
    maxTokens: 2048,
    description: "Google's text embedding model - fast and accurate",
    cost: 'Free tier available',
  };
}
