import * as cheerio from 'cheerio';

/**
 * Configuration
 */
const MAX_CONTENT_LENGTH = 5000000; // 5MB
const REQUEST_TIMEOUT = 30000; // 30 seconds
const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

/**
 * Validates and sanitizes a URL
 */
export function validateUrl(url) {
  const errors = [];

  if (!url || typeof url !== 'string') {
    errors.push('URL is required');
    return { valid: false, errors, sanitizedUrl: null };
  }

  // Remove whitespace
  url = url.trim();

  // Add protocol if missing
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }

  // Try to parse URL
  let parsedUrl;
  try {
    parsedUrl = new URL(url);
  } catch (error) {
    errors.push('Invalid URL format');
    return { valid: false, errors, sanitizedUrl: null };
  }

  // Check protocol
  if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
    errors.push('Only HTTP and HTTPS protocols are allowed');
  }

  // Check for localhost/private IPs (security)
  const hostname = parsedUrl.hostname.toLowerCase();
  const blockedHosts = ['localhost', '127.0.0.1', '0.0.0.0', '::1'];

  if (
    blockedHosts.includes(hostname) ||
    hostname.startsWith('192.168.') ||
    hostname.startsWith('10.') ||
    hostname.startsWith('172.')
  ) {
    errors.push('Cannot scrape local or private network addresses');
  }

  // Check for file:// or other dangerous protocols
  if (parsedUrl.protocol === 'file:') {
    errors.push('File protocol is not allowed');
  }

  return {
    valid: errors.length === 0,
    errors,
    sanitizedUrl: errors.length === 0 ? parsedUrl.href : null,
  };
}

/**
 * Fetches HTML content from a URL with timeout
 */
async function fetchHtml(url) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': USER_AGENT,
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        DNT: '1',
        Connection: 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
      signal: controller.signal,
      redirect: 'follow',
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    // Check content type
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('text/html')) {
      throw new Error(`Expected HTML content but got ${contentType}`);
    }

    // Check content length
    const contentLength = response.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > MAX_CONTENT_LENGTH) {
      throw new Error(
        `Content too large: ${contentLength} bytes (max ${MAX_CONTENT_LENGTH})`
      );
    }

    const html = await response.text();

    // Double-check actual content length
    if (html.length > MAX_CONTENT_LENGTH) {
      throw new Error(
        `Content too large: ${html.length} bytes (max ${MAX_CONTENT_LENGTH})`
      );
    }

    return {
      html,
      finalUrl: response.url,
      contentType,
    };
  } catch (error) {
    clearTimeout(timeoutId);

    if (error.name === 'AbortError') {
      throw new Error(
        `Request timeout after ${REQUEST_TIMEOUT / 1000} seconds`
      );
    }

    throw error;
  }
}

/**
 * Content extraction using Cheerio
 * Reliable and works in all serverless environments
 */
function extractWithCheerio(html, url) {
  try {
    const $ = cheerio.load(html);

    // Remove unwanted elements
    $('script').remove();
    $('style').remove();
    $('nav').remove();
    $('header').remove();
    $('footer').remove();
    $('iframe').remove();
    $('noscript').remove();
    $('aside').remove();
    $('.advertisement').remove();
    $('.ads').remove();
    $('.ad').remove();
    $('.social-share').remove();
    $('.comments').remove();
    $('.cookie-banner').remove();
    $('.popup').remove();
    $('.modal').remove();

    // Extract title
    let title = $('title').text().trim();
    if (!title) {
      title = $('h1').first().text().trim();
    }
    if (!title) {
      title = $('meta[property="og:title"]').attr('content') || '';
    }

    // Extract main content
    let content = '';

    // Try to find main content area
    const mainSelectors = [
      'main',
      'article',
      '[role="main"]',
      '.main-content',
      '.content',
      '#content',
      '.post-content',
      '.article-content',
      '.entry-content',
      'body',
    ];

    for (const selector of mainSelectors) {
      const element = $(selector).first();
      if (element.length > 0) {
        content = element.text().trim();
        if (content.length > 200) {
          break;
        }
      }
    }

    // If no good content found, get all paragraph text
    if (!content || content.length < 200) {
      content = $('p')
        .map((i, el) => $(el).text().trim())
        .get()
        .filter((text) => text.length > 20)
        .join('\n\n');
    }

    // Extract metadata
    const description =
      $('meta[name="description"]').attr('content') ||
      $('meta[property="og:description"]').attr('content') ||
      '';

    const siteName =
      $('meta[property="og:site_name"]').attr('content') ||
      new URL(url).hostname;

    return {
      title: title || 'Untitled',
      content: content || '',
      excerpt: description.substring(0, 200),
      byline: '',
      length: content.length,
      siteName,
    };
  } catch (error) {
    console.error('Cheerio extraction failed:', error);
    throw new Error('Failed to extract content from HTML');
  }
}

/**
 * Cleans and normalizes extracted text
 */
function cleanText(text) {
  if (!text) return '';

  // Normalize whitespace
  text = text.replace(/\s+/g, ' ');

  // Remove excessive line breaks
  text = text.replace(/\n{3,}/g, '\n\n');

  // Trim
  text = text.trim();

  return text;
}

/**
 * Main scraping function
 * Attempts to extract clean content from a URL
 */
export async function scrapeUrl(url) {
  console.log(`\n🌐 Starting web scrape: ${url}`);

  // Validate URL
  const validation = validateUrl(url);
  if (!validation.valid) {
    throw new Error(`Invalid URL: ${validation.errors.join(', ')}`);
  }

  const sanitizedUrl = validation.sanitizedUrl;
  console.log(`✓ URL validated: ${sanitizedUrl}`);

  // Fetch HTML
  console.log('📥 Fetching HTML...');
  const { html, finalUrl, contentType } = await fetchHtml(sanitizedUrl);
  console.log(`✓ Fetched ${html.length} bytes from ${finalUrl}`);

  // Extract content with Cheerio (serverless-friendly)
  console.log('🔍 Extracting content with Cheerio...');
  const extracted = extractWithCheerio(html, finalUrl);

  if (!extracted || !extracted.content) {
    throw new Error('Failed to extract content from webpage');
  }

  // Clean content
  extracted.content = cleanText(extracted.content);
  extracted.title = cleanText(extracted.title);

  // Validate extracted content
  if (extracted.content.length < 50) {
    throw new Error('Extracted content is too short (minimum 50 characters)');
  }

  // Count words
  const wordCount = extracted.content
    .split(/\s+/)
    .filter((word) => word.length > 0).length;

  console.log(`✓ Extraction successful:`);
  console.log(`   - Title: ${extracted.title}`);
  console.log(`   - Content length: ${extracted.content.length} characters`);
  console.log(`   - Word count: ${wordCount}`);
  console.log(`   - Site: ${extracted.siteName}`);

  return {
    url: finalUrl,
    title: extracted.title,
    content: extracted.content,
    excerpt: extracted.excerpt,
    author: extracted.byline,
    wordCount,
    siteName: extracted.siteName,
    scrapedAt: new Date(),
  };
}

/**
 * Scrapes multiple URLs with error handling
 */
export async function scrapeMultipleUrls(urls, options = {}) {
  const { onProgress, continueOnError = true } = options;

  const results = [];
  const errors = [];

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];

    try {
      if (onProgress) {
        onProgress({
          current: i + 1,
          total: urls.length,
          url,
          status: 'scraping',
        });
      }

      const result = await scrapeUrl(url);
      results.push({ success: true, url, data: result });

      if (onProgress) {
        onProgress({
          current: i + 1,
          total: urls.length,
          url,
          status: 'success',
        });
      }
    } catch (error) {
      console.error(`Failed to scrape ${url}:`, error.message);
      errors.push({ url, error: error.message });
      results.push({ success: false, url, error: error.message });

      if (onProgress) {
        onProgress({
          current: i + 1,
          total: urls.length,
          url,
          status: 'error',
          error: error.message,
        });
      }

      if (!continueOnError) {
        break;
      }
    }

    // Add delay between requests to be respectful
    if (i < urls.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  return {
    results,
    errors,
    totalProcessed: results.length,
    successCount: results.filter((r) => r.success).length,
    errorCount: errors.length,
  };
}
