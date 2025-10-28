# Web Scraping Feature Guide

## Overview

The web scraping feature allows you to extract content from websites and add it to your chatbot's knowledge base. It uses intelligent content extraction to remove navigation, ads, and other non-essential elements.

## Features

### 1. **Smart Content Extraction**
- Uses Mozilla Readability for article-style content
- Falls back to Cheerio for other page types
- Automatically removes navigation, headers, footers, ads, and scripts
- Extracts clean, readable text

### 2. **URL Validation**
- Validates URL format
- Blocks local/private network addresses (security)
- Automatically adds HTTPS if missing
- Sanitizes URLs before processing

### 3. **Multiple URL Support**
- Scrape single URLs
- Batch scrape up to 10 URLs at once
- Continues on error (doesn't stop entire batch on single failure)

### 4. **Timeout & Error Handling**
- 30-second timeout per request
- Handles various error scenarios:
  - Invalid URLs
  - Network failures
  - Content too large (5MB limit)
  - Non-HTML content
  - Protected/paywalled content

### 5. **Content Processing**
- Automatically chunks scraped content
- Word count and metadata extraction
- Stores URL, title, author, site name
- Creates searchable chunks for RAG

## API Endpoints

### Scrape URL(s)
**POST** `/api/chatbots/[chatbotId]/scrape`

**Single URL:**
```json
{
  "url": "https://example.com/article"
}
```

**Multiple URLs:**
```json
{
  "urls": [
    "https://example.com/page1",
    "https://example.com/page2"
  ]
}
```

**Response (Single):**
```json
{
  "success": true,
  "document": {
    "_id": "...",
    "filename": "Article Title",
    "type": "text/html",
    "url": "https://example.com/article",
    "wordCount": 1500,
    "status": "processed",
    "chunkCount": 3
  },
  "scrapedData": {
    "title": "Article Title",
    "url": "https://example.com/article",
    "wordCount": 1500,
    "chunkCount": 3
  }
}
```

**Response (Multiple):**
```json
{
  "success": true,
  "summary": {
    "totalRequested": 5,
    "successCount": 4,
    "errorCount": 1,
    "documentsCreated": 4
  },
  "documents": [...],
  "errors": [
    {
      "url": "https://failed-site.com",
      "error": "Request timeout"
    }
  ]
}
```

### Validate URL
**GET** `/api/chatbots/[chatbotId]/scrape/validate?url=https://example.com`

**Response:**
```json
{
  "valid": true,
  "errors": [],
  "sanitizedUrl": "https://example.com/"
}
```

## Usage Examples

### 1. **Scraping Documentation Sites**
Perfect for technical documentation, knowledge bases, and help articles.

```
Example URLs:
- https://docs.example.com/getting-started
- https://support.example.com/faq
```

### 2. **Scraping Blog Posts**
Extract content from blog posts and articles.

```
Example URLs:
- https://blog.example.com/how-to-guide
- https://medium.com/@author/article-title
```

### 3. **Scraping Product Pages**
Get product descriptions and specifications.

```
Example URLs:
- https://shop.example.com/products/item-123
```

## Best Practices

### ✅ Works Well With:
- Blog posts and articles
- Documentation pages
- News articles
- Product descriptions
- Knowledge base articles
- FAQ pages

### ⚠️ May Not Work Well With:
- Single-page applications (SPAs)
- Content behind login walls
- Dynamic content loaded by JavaScript
- Sites with aggressive anti-scraping measures
- PDFs (use file upload instead)

## Technical Details

### Libraries Used
- **cheerio**: HTML parsing and DOM manipulation
- **jsdom**: DOM implementation for Node.js
- **@mozilla/readability**: Intelligent article extraction

### Content Extraction Process
1. Fetch HTML with proper headers
2. Try Mozilla Readability first (best for articles)
3. Fall back to Cheerio extraction if needed
4. Remove unwanted elements (nav, ads, scripts)
5. Clean and normalize text
6. Extract metadata (title, author, site name)
7. Split into chunks for RAG
8. Save to database

### Security Measures
- Blocks localhost and private IPs
- File protocol blocked
- Content size limits (5MB)
- Request timeouts (30 seconds)
- URL validation and sanitization

## Error Messages

| Error | Meaning | Solution |
|-------|---------|----------|
| "Invalid URL format" | URL cannot be parsed | Check URL syntax |
| "Cannot scrape local or private network addresses" | Security restriction | Use public URLs only |
| "Request timeout" | Site took too long to respond | Try again or use different URL |
| "Content too large" | Page exceeds 5MB | Contact support for exceptions |
| "Expected HTML content but got..." | Not an HTML page | Use file upload for PDFs/docs |
| "Extracted content is too short" | Couldn't extract meaningful content | Site may use JavaScript rendering |

## UI Components

### WebScraper Component
Located at: `src/components/WebScraper.js`

**Features:**
- Single/Multiple URL modes
- Real-time validation
- Progress indicators
- Error handling
- Success feedback

**Usage:**
```jsx
import WebScraper from '@/components/WebScraper';

<WebScraper
  chatbotId={chatbot._id}
  onScrapeComplete={(data) => console.log('Success:', data)}
  onScrapeError={(error) => console.log('Error:', error)}
/>
```

## Limitations

1. **JavaScript-rendered content**: Sites that load content dynamically may not work well
2. **Rate limiting**: Some sites may block repeated requests
3. **Paywalled content**: Cannot access content behind login walls
4. **Anti-scraping measures**: Some sites actively block scrapers
5. **Batch limit**: Maximum 10 URLs per request

## Future Enhancements

- [ ] Headless browser for JavaScript-rendered sites
- [ ] Scheduled re-scraping for content updates
- [ ] Sitemap import for bulk scraping
- [ ] Custom CSS selectors for specific sites
- [ ] Proxy support for rate-limited sites
- [ ] Screenshot capture for visual reference

## Testing Recommendations

### Good Test URLs:
- Wikipedia articles
- GitHub README files
- Blog posts on Medium, Dev.to
- Public documentation sites
- News articles from major outlets

### Example Test:
```
URL: https://en.wikipedia.org/wiki/Artificial_intelligence
Expected: ~5000+ words, well-formatted content
```

## Support

For issues or questions about web scraping:
1. Check the error message
2. Verify URL is publicly accessible
3. Try a different URL from the same site
4. Contact support with specific URL and error

---

**Note**: Always respect website terms of service and robots.txt when scraping content.
