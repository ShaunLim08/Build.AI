/**
 * Gemini API Integration
 *
 * This module provides functions to interact with Google's Gemini API
 * for chat completion and text generation.
 */

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

/**
 * Get Gemini API key from environment
 */
function getApiKey() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not set');
  }
  return apiKey;
}

/**
 * Convert chat messages to Gemini format
 * Gemini v1 API doesn't support systemInstruction, so we prepend it to the first user message
 * @param {Array} messages - Array of message objects
 * @returns {Object} - Gemini-formatted request
 */
function convertMessagesToGeminiFormat(messages) {
  // Extract system message if present
  let systemMessage = null;
  const contentMessages = [];

  for (const message of messages) {
    if (message.role === 'system') {
      systemMessage = message.content;
    } else if (message.role === 'user') {
      contentMessages.push({
        role: 'user',
        parts: [{ text: message.content }],
      });
    } else if (message.role === 'assistant' || message.role === 'model') {
      contentMessages.push({
        role: 'model',
        parts: [{ text: message.content }],
      });
    }
  }

  // If there's a system message and user messages, prepend system message to first user message
  if (systemMessage && contentMessages.length > 0 && contentMessages[0].role === 'user') {
    const firstUserMessage = contentMessages[0].parts[0].text;
    contentMessages[0].parts[0].text = `${systemMessage}\n\n${firstUserMessage}`;
  }

  return {
    contents: contentMessages,
  };
}

/**
 * Generate chat completion using Gemini API
 * @param {Array} messages - Array of chat messages
 * @param {Object} options - Generation options
 * @returns {Promise<Object>} - Generation response
 */
export async function generateChatCompletion(messages, options = {}) {
  const {
    model = 'gemini-2.0-flash-exp', // Default to latest Gemini 2.0
    temperature = 0.7,
    maxTokens = 2048,
    topP = 0.95,
    topK = 40,
  } = options;

  const apiKey = getApiKey();

  // Normalize model name for API compatibility
  const normalizedModel = normalizeModelName(model);

  // Convert messages to Gemini format
  const geminiRequest = convertMessagesToGeminiFormat(messages);

  // Build request body
  const requestBody = {
    ...geminiRequest,
    generationConfig: {
      temperature,
      maxOutputTokens: maxTokens,
      topP,
      topK,
    },
  };

  console.log('🤖 Calling Gemini API...');
  console.log(`   Model: ${model} → ${normalizedModel}`);
  console.log(`   Messages: ${messages.length}`);

  // Make API request - using x-goog-api-key header as per official docs
  const url = `${GEMINI_API_URL}/${normalizedModel}:generateContent`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ Gemini API error:', errorText);
    throw new Error(`Gemini API error: ${response.status} ${errorText}`);
  }

  const data = await response.json();

  // Extract the generated text
  if (!data.candidates || data.candidates.length === 0) {
    throw new Error('No response generated from Gemini');
  }

  const candidate = data.candidates[0];
  const generatedText = candidate.content.parts[0].text;

  console.log('✅ Response generated');
  console.log(`   Tokens: ~${Math.ceil(generatedText.length / 4)}`);

  return {
    text: generatedText,
    finishReason: candidate.finishReason,
    safetyRatings: candidate.safetyRatings,
    model: model,
    usage: {
      promptTokens: data.usageMetadata?.promptTokenCount || 0,
      completionTokens: data.usageMetadata?.candidatesTokenCount || 0,
      totalTokens: data.usageMetadata?.totalTokenCount || 0,
    },
  };
}

/**
 * Stream chat completion using Gemini API
 * @param {Array} messages - Array of chat messages
 * @param {Object} options - Generation options
 * @param {Function} onChunk - Callback for each streamed chunk
 * @returns {Promise<Object>} - Complete generation response
 */
export async function streamChatCompletion(messages, options = {}, onChunk) {
  const {
    model = 'gemini-2.0-flash-exp',
    temperature = 0.7,
    maxTokens = 2048,
    topP = 0.95,
    topK = 40,
  } = options;

  const apiKey = getApiKey();

  // Normalize model name for API compatibility
  const normalizedModel = normalizeModelName(model);

  // Convert messages to Gemini format
  const geminiRequest = convertMessagesToGeminiFormat(messages);

  // Build request body
  const requestBody = {
    ...geminiRequest,
    generationConfig: {
      temperature,
      maxOutputTokens: maxTokens,
      topP,
      topK,
    },
  };

  console.log('🤖 Streaming from Gemini API...');
  console.log(`   Model: ${model} → ${normalizedModel}`);

  // Make streaming API request - using x-goog-api-key header as per official docs
  const url = `${GEMINI_API_URL}/${normalizedModel}:streamGenerateContent?alt=sse`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ Gemini streaming API error:', errorText);
    throw new Error(`Gemini API error: ${response.status} ${errorText}`);
  }

  // Process the stream
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let fullText = '';
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Keep the last incomplete line in buffer

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const jsonStr = line.slice(6); // Remove 'data: ' prefix
          if (jsonStr.trim() === '') continue;

          try {
            const data = JSON.parse(jsonStr);

            if (data.candidates && data.candidates[0]) {
              const candidate = data.candidates[0];
              if (candidate.content && candidate.content.parts && candidate.content.parts[0]) {
                const chunkText = candidate.content.parts[0].text || '';
                fullText += chunkText;

                // Call the callback with the chunk
                if (onChunk && chunkText) {
                  onChunk(chunkText);
                }
              }
            }
          } catch (parseError) {
            console.warn('Failed to parse SSE data:', parseError);
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  console.log('✅ Streaming complete');
  console.log(`   Total length: ${fullText.length} characters`);

  return {
    text: fullText,
    model: model,
  };
}

/**
 * Simple text generation (non-chat)
 * @param {string} prompt - Text prompt
 * @param {Object} options - Generation options
 * @returns {Promise<string>} - Generated text
 */
export async function generateText(prompt, options = {}) {
  const messages = [
    {
      role: 'user',
      content: prompt,
    },
  ];

  const result = await generateChatCompletion(messages, options);
  return result.text;
}

/**
 * Get available Gemini models
 */
export function getAvailableModels() {
  return [
    {
      id: 'gemini-2.5-flash',
      name: 'Gemini 2.5 Flash',
      description: 'Latest stable model - recommended',
      contextWindow: 1000000, // 1M tokens
      recommended: true,
    },
    {
      id: 'gemini-2.0-flash-exp',
      name: 'Gemini 2.0 Flash (Experimental)',
      description: 'Experimental model with enhanced capabilities',
      contextWindow: 1000000, // 1M tokens
    },
    {
      id: 'gemini-1.5-pro-latest',
      name: 'Gemini 1.5 Pro (Legacy)',
      description: 'Older model - use Gemini 2.5 instead',
      contextWindow: 2000000, // 2M tokens
    },
    {
      id: 'gemini-1.5-flash-latest',
      name: 'Gemini 1.5 Flash (Legacy)',
      description: 'Older model - use Gemini 2.5 instead',
      contextWindow: 1000000, // 1M tokens
    },
  ];
}

/**
 * Normalize model name for API compatibility
 */
function normalizeModelName(model) {
  // Map common model names to their API equivalents
  const modelMap = {
    // Shortcuts
    'gemini-flash': 'gemini-2.5-flash',
    'gemini-pro': 'gemini-2.5-pro',
    // Legacy mappings
    'gemini-1.5-flash': 'gemini-1.5-flash-latest',
    'gemini-1.5-pro': 'gemini-1.5-pro-latest',
    'gemini-2.0-flash': 'gemini-2.0-flash-exp',
  };

  return modelMap[model] || model;
}
