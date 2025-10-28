import { pipeline, env } from '@xenova/transformers';

// Configure to use local models (optional - remove if you want to download models)
// env.localModelPath = './models/';
// env.allowRemoteModels = true;

let embeddingPipeline = null;

/**
 * Initialize the embedding model
 * Uses thenlper/gte-large - a high-quality embedding model
 */
async function initEmbeddingModel() {
  if (!embeddingPipeline) {
    console.log('🔄 Loading embedding model (thenlper/gte-large)...');
    console.log('⚠️  First run will download the model (~300MB)');

    embeddingPipeline = await pipeline(
      'feature-extraction',
      'Xenova/gte-large'
    );

    console.log('✅ Embedding model loaded successfully');
  }
  return embeddingPipeline;
}

/**
 * Generate embedding for a single text
 * @param {string} text - The text to embed
 * @returns {Promise<number[]>} - The embedding vector (1024 dimensions)
 */
export async function generateEmbedding(text) {
  if (!text || typeof text !== 'string') {
    throw new Error('Text must be a non-empty string');
  }

  // Clean and truncate text if needed (model has max token limit)
  const cleanedText = text.trim().substring(0, 8192); // ~2048 tokens max

  const model = await initEmbeddingModel();

  // Generate embedding
  const output = await model(cleanedText, { pooling: 'mean', normalize: true });

  // Convert to regular array
  const embedding = Array.from(output.data);

  return embedding;
}

/**
 * Generate embeddings for multiple texts in batch
 * More efficient than calling generateEmbedding multiple times
 * @param {string[]} texts - Array of texts to embed
 * @param {object} options - Options for batch processing
 * @returns {Promise<number[][]>} - Array of embedding vectors
 */
export async function generateEmbeddingsBatch(texts, options = {}) {
  const { batchSize = 32, onProgress } = options;

  if (!Array.isArray(texts) || texts.length === 0) {
    throw new Error('texts must be a non-empty array');
  }

  const model = await initEmbeddingModel();
  const embeddings = [];

  // Process in batches
  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    const batchStart = i;
    const batchEnd = Math.min(i + batchSize, texts.length);

    if (onProgress) {
      onProgress({
        current: batchEnd,
        total: texts.length,
        batchSize: batch.length,
        progress: (batchEnd / texts.length) * 100
      });
    }

    console.log(`📊 Processing batch ${Math.floor(i / batchSize) + 1}: ${batchStart + 1}-${batchEnd} of ${texts.length}`);

    // Clean texts
    const cleanedBatch = batch.map(text =>
      (text || '').toString().trim().substring(0, 8192)
    );

    // Generate embeddings for batch
    const batchEmbeddings = await Promise.all(
      cleanedBatch.map(async (text) => {
        const output = await model(text, { pooling: 'mean', normalize: true });
        return Array.from(output.data);
      })
    );

    embeddings.push(...batchEmbeddings);
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
  const similarities = documents.map(doc => ({
    similarity: cosineSimilarity(queryEmbedding, doc.embedding),
    data: doc.data
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
    model: 'Xenova/gte-large (thenlper/gte-large)',
    provider: 'Hugging Face',
    dimensions: 1024,
    maxTokens: 512,
    description: 'General Text Embeddings (GTE) large model - high quality embeddings',
    cost: 'Free (open source)',
  };
}
