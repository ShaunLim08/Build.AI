# Build.AI Chatbot Embedding Guide

Complete guide for embedding your Build.AI chatbot into websites, applications, and platforms.

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Embed Methods](#embed-methods)
   - [Widget Integration](#1-widget-integration)
   - [API Integration](#2-api-integration)
   - [iFrame Integration](#3-iframe-integration)
3. [Platform-Specific Guides](#platform-specific-guides)
4. [Customization Options](#customization-options)
5. [API Reference](#api-reference)
6. [Troubleshooting](#troubleshooting)

---

## Quick Start

The fastest way to embed your chatbot:

1. Go to your [Dashboard](https://build-ai-shaun.vercel.app/dashboard)
2. Click the **"Embed"** button on any chatbot
3. Copy the embed URL: `https://build-ai-shaun.vercel.app/embed/YOUR_CHATBOT_ID`
4. Paste it into your platform (Notion, Confluence, etc.)

---

## Embed Methods

### 1. Widget Integration

**Best for:** Websites where you want a floating chat button

The widget adds a floating chat button to your website that opens a chat interface when clicked. It's the most popular integration method.

#### Installation

**Option A: Simple Script Tag (Recommended)**

Add this code before the closing `</body>` tag:

```html
<!-- Build.AI Chatbot Widget -->
<script src="https://build-ai-shaun.vercel.app/widget.js"
  data-chatbot-id="YOUR_CHATBOT_ID"
  data-position="bottom-right"
  data-primary-color="#6366f1"
  data-bg-color="#0a0808"
  data-text-color="#ffffff"
  data-watermark="true">
</script>
```

**Option B: Programmatic Initialization**

For more control over initialization timing:

```html
<script src="https://build-ai-shaun.vercel.app/widget.js"></script>
<script>
  // Initialize when document is ready
  document.addEventListener('DOMContentLoaded', function() {
    new BuildAIChatbot({
      chatbotId: 'YOUR_CHATBOT_ID',
      position: 'bottom-right', // 'bottom-right', 'bottom-left', 'top-right', 'top-left'
      primaryColor: '#6366f1',
      backgroundColor: '#0a0808',
      textColor: '#ffffff',
      showWatermark: true,
      baseUrl: 'https://build-ai-shaun.vercel.app'
    });
  });
</script>
```

#### Widget Features

- **Floating Button:** Appears in the corner of your choice
- **Session Persistence:** Remembers conversations for 24 hours
- **Unread Badge:** Shows number of new messages
- **Mobile Responsive:** Fullscreen on mobile, windowed on desktop
- **Custom Styling:** Match your brand colors
- **Conversation History:** Users can continue previous conversations

#### Configuration Options

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `chatbotId` | string | *required* | Your chatbot ID from the dashboard |
| `position` | string | `'bottom-right'` | Button position: `bottom-right`, `bottom-left`, `top-right`, `top-left` |
| `primaryColor` | string | `'#6366f1'` | Main button and accent color (hex format) |
| `backgroundColor` | string | `'#0a0808'` | Chat background color (hex format) |
| `textColor` | string | `'#ffffff'` | Text color in the chat (hex format) |
| `showWatermark` | boolean | `true` | Display "Powered by Build.AI" footer |
| `baseUrl` | string | auto-detected | Override the API base URL |

#### Advanced Usage

**Conditionally Load Widget:**

```javascript
// Only show widget to logged-in users
if (user.isLoggedIn) {
  new BuildAIChatbot({
    chatbotId: 'YOUR_CHATBOT_ID',
    position: 'bottom-right'
  });
}
```

**Custom Event Handling:**

```javascript
// Access widget instance
const widget = new BuildAIChatbot({
  chatbotId: 'YOUR_CHATBOT_ID'
});

// Listen for widget events (if implemented)
widget.on('open', function() {
  console.log('Chat opened');
});

widget.on('message', function(data) {
  console.log('New message:', data);
});
```

---

### 2. API Integration

**Best for:** Mobile apps, custom UIs, backend integrations, chatbot platforms (Slack, Discord, etc.)

Direct API access gives you complete control over the chatbot experience.

#### Basic API Call

```javascript
const response = await fetch('https://build-ai-shaun.vercel.app/api/chatbots/YOUR_CHATBOT_ID/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    message: 'Hello, how can you help me?',
    sessionId: 'session_' + Date.now(),
    conversationHistory: []
  })
});

const data = await response.json();
console.log(data.response); // AI response text
console.log(data.metadata); // Retrieval metadata
```

#### Request Format

**Endpoint:** `POST /api/chatbots/{chatbotId}/chat`

**Headers:**
```json
{
  "Content-Type": "application/json"
}
```

**Body:**
```json
{
  "message": "User's question or message",
  "sessionId": "unique_session_identifier",
  "conversationHistory": [
    {
      "role": "user",
      "content": "Previous user message"
    },
    {
      "role": "assistant",
      "content": "Previous bot response"
    }
  ]
}
```

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `message` | string | Yes | The user's message/question |
| `sessionId` | string | Yes | Unique ID to track conversation (use same ID for conversation continuity) |
| `conversationHistory` | array | No | Previous messages in the conversation (for context) |

#### Response Format

```json
{
  "response": "The AI-generated response text",
  "conversationId": "conv_abc123",
  "metadata": {
    "sources": [
      {
        "filename": "document.pdf",
        "page": 5,
        "content": "Relevant text from the document..."
      }
    ],
    "confidence": 0.92,
    "retrievalScore": 0.87,
    "chunksRetrieved": 3
  }
}
```

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `response` | string | The chatbot's generated response |
| `conversationId` | string | Unique ID for this conversation |
| `metadata.sources` | array | Source documents used to generate the response |
| `metadata.confidence` | number | Confidence score (0-1) for the response quality |
| `metadata.retrievalScore` | number | RAG retrieval quality score (0-1) |
| `metadata.chunksRetrieved` | number | Number of document chunks used |

#### Example Implementations

**React/Next.js:**

```javascript
import { useState } from 'react';

export default function ChatComponent() {
  const [message, setMessage] = useState('');
  const [conversation, setConversation] = useState([]);
  const [sessionId] = useState('session_' + Date.now());

  const sendMessage = async () => {
    if (!message.trim()) return;

    // Add user message to UI
    const userMessage = { role: 'user', content: message };
    setConversation(prev => [...prev, userMessage]);

    try {
      const response = await fetch('/api/chatbots/YOUR_CHATBOT_ID/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          sessionId,
          conversationHistory: conversation
        })
      });

      const data = await response.json();

      // Add bot response to UI
      const botMessage = { role: 'assistant', content: data.response };
      setConversation(prev => [...prev, botMessage]);

      setMessage('');
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <div>
      <div className="messages">
        {conversation.map((msg, i) => (
          <div key={i} className={msg.role}>
            {msg.content}
          </div>
        ))}
      </div>
      <input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
      />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
}
```

**Python (for backend/automation):**

```python
import requests

def chat_with_bot(message, chatbot_id, session_id, history=[]):
    url = f'https://build-ai-shaun.vercel.app/api/chatbots/{chatbot_id}/chat'

    response = requests.post(url, json={
        'message': message,
        'sessionId': session_id,
        'conversationHistory': history
    })

    data = response.json()
    return data['response'], data['metadata']

# Usage
response_text, metadata = chat_with_bot(
    message="What is your return policy?",
    chatbot_id="YOUR_CHATBOT_ID",
    session_id="user_12345"
)

print(f"Bot: {response_text}")
print(f"Confidence: {metadata['confidence']}")
print(f"Sources: {len(metadata['sources'])} documents")
```

**Node.js:**

```javascript
const axios = require('axios');

async function chatWithBot(message, chatbotId, sessionId, history = []) {
  const response = await axios.post(
    `https://build-ai-shaun.vercel.app/api/chatbots/${chatbotId}/chat`,
    {
      message,
      sessionId,
      conversationHistory: history
    }
  );

  return response.data;
}

// Usage
const result = await chatWithBot(
  'What are your business hours?',
  'YOUR_CHATBOT_ID',
  'session_abc123'
);

console.log('Response:', result.response);
console.log('Confidence:', result.metadata.confidence);
```

#### Rate Limiting

**Current Limits:**
- **IP-based:** 60 requests per minute
- **Daily:** 10,000 requests per chatbot

**Handling Rate Limits:**

```javascript
const response = await fetch('/api/chatbots/YOUR_CHATBOT_ID/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message, sessionId })
});

if (response.status === 429) {
  console.error('Rate limit exceeded. Please wait before retrying.');
  // Implement exponential backoff
  await new Promise(resolve => setTimeout(resolve, 5000));
}
```

#### Use Cases for API Integration

- **Mobile Apps:** iOS, Android, React Native, Flutter
- **Custom Chat Interfaces:** Build your own UI with complete control
- **Chatbot Platforms:** Integrate into Slack, Discord, Telegram, WhatsApp
- **Backend Automation:** Automated responses, data processing
- **Voice Assistants:** Alexa, Google Assistant integrations
- **SMS/Text:** Twilio integration for text-based support

---

### 3. iFrame Integration

**Best for:** Quick embeds in Notion, Confluence, WordPress, or dedicated chat pages

The iFrame method embeds the full chatbot interface directly into your page.

#### Basic iFrame Code

```html
<iframe
  src="https://build-ai-shaun.vercel.app/embed/YOUR_CHATBOT_ID"
  width="400"
  height="600"
  frameborder="0"
  style="border-radius: 12px; box-shadow: 0 10px 40px rgba(0,0,0,0.2);"
  title="Build.AI Chatbot">
</iframe>
```

#### With Customization

```html
<iframe
  src="https://build-ai-shaun.vercel.app/embed/YOUR_CHATBOT_ID?bg=0a0808&text=ffffff&button=6366f1&watermark=true"
  width="400"
  height="600"
  frameborder="0"
  style="border-radius: 12px; box-shadow: 0 10px 40px rgba(0,0,0,0.2);"
  title="Build.AI Chatbot">
</iframe>
```

#### URL Parameters

| Parameter | Type | Example | Description |
|-----------|------|---------|-------------|
| `bg` | hex color (no #) | `0a0808` | Background color |
| `text` | hex color (no #) | `ffffff` | Text color |
| `button` | hex color (no #) | `6366f1` | Button/accent color |
| `watermark` | boolean | `true` or `false` | Show "Powered by Build.AI" |
| `sessionId` | string | `user_123` | Resume existing session |

#### Responsive iFrame

Make the iframe responsive on mobile:

```html
<div style="position: relative; width: 100%; max-width: 400px; height: 600px;">
  <iframe
    src="https://build-ai-shaun.vercel.app/embed/YOUR_CHATBOT_ID"
    style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none; border-radius: 12px;"
    title="Build.AI Chatbot">
  </iframe>
</div>
```

#### Full-Width Embed

For dedicated support pages:

```html
<div style="width: 100%; height: 100vh;">
  <iframe
    src="https://build-ai-shaun.vercel.app/embed/YOUR_CHATBOT_ID"
    style="width: 100%; height: 100%; border: none;"
    title="Build.AI Chatbot">
  </iframe>
</div>
```

---

## Platform-Specific Guides

### Notion

1. Type `/embed` in your Notion page
2. Paste the embed URL: `https://build-ai-shaun.vercel.app/embed/YOUR_CHATBOT_ID`
3. Press **Enter**
4. Resize the embed block as needed

**Pro Tip:** Create a dedicated "Support" page with the chatbot for your team.

### Confluence

1. Edit your Confluence page
2. Insert a **Macro** (type `/iframe` or search for "HTML")
3. Paste the full iframe code:
   ```html
   <iframe src="https://build-ai-shaun.vercel.app/embed/YOUR_CHATBOT_ID" width="400" height="600"></iframe>
   ```
4. Save the page

### WordPress

**Using HTML Block:**

1. Add a **Custom HTML** block
2. Paste the iframe code
3. Preview and publish

**Using Plugin (iframe plugin):**

1. Install an iframe plugin (e.g., "Advanced iFrame")
2. Add the embed URL
3. Configure dimensions and styling

### Webflow

1. Add an **Embed** element to your page
2. Paste the full iframe code or widget code
3. Publish your site

### Wix

1. Click **Add** > **Embed** > **Embed a Widget**
2. Select **HTML iframe**
3. Paste your iframe code
4. Adjust size and position

### Shopify

1. Edit your theme
2. Add a **Custom Liquid** section
3. Paste the widget code
4. The chatbot will appear on all pages

---

## Customization Options

### Color Schemes

Match your brand colors:

**Light Theme:**
```javascript
primaryColor: '#3b82f6',    // Blue
backgroundColor: '#ffffff',  // White
textColor: '#1f2937'        // Dark gray
```

**Dark Theme:**
```javascript
primaryColor: '#8b5cf6',    // Purple
backgroundColor: '#0a0808',  // Near black
textColor: '#ffffff'        // White
```

**Custom Brand:**
```javascript
primaryColor: '#your-brand-color',
backgroundColor: '#your-bg-color',
textColor: '#your-text-color'
```

### Position Options

Widget button position:

- `'bottom-right'` - Default, most common
- `'bottom-left'` - Alternative bottom position
- `'top-right'` - Good for apps with bottom navs
- `'top-left'` - Uncommon but available

### Session Management

**Persistent Sessions:**

Use consistent session IDs to maintain conversation history:

```javascript
// Generate or retrieve session ID
const sessionId = localStorage.getItem('chatbotSession') || 'session_' + Date.now();
localStorage.setItem('chatbotSession', sessionId);

// Use in API calls
fetch('/api/chatbots/YOUR_CHATBOT_ID/chat', {
  method: 'POST',
  body: JSON.stringify({
    message: userMessage,
    sessionId: sessionId  // Same ID preserves history
  })
});
```

**Session Expiry:**

Sessions are automatically cleaned up after 24 hours of inactivity.

---

## API Reference

### Chat Endpoint

**`POST /api/chatbots/{chatbotId}/chat`**

Send a message and receive a response.

**Request:**
```typescript
{
  message: string;           // Required: User's message
  sessionId: string;         // Required: Unique session identifier
  conversationHistory?: {    // Optional: Previous messages
    role: 'user' | 'assistant';
    content: string;
  }[];
}
```

**Response:**
```typescript
{
  response: string;          // AI-generated response
  conversationId: string;    // Conversation identifier
  metadata: {
    sources: {               // Source documents used
      filename: string;
      page: number;
      content: string;
    }[];
    confidence: number;      // Response quality (0-1)
    retrievalScore: number;  // RAG quality (0-1)
    chunksRetrieved: number; // Number of chunks used
  }
}
```

**Error Responses:**

| Status Code | Description |
|-------------|-------------|
| `400` | Bad Request - Missing required fields |
| `404` | Chatbot not found |
| `429` | Rate limit exceeded |
| `500` | Server error |

### API Keys (Coming Soon)

API key authentication for production usage:

```javascript
fetch('/api/chatbots/YOUR_CHATBOT_ID/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_API_KEY'
  },
  body: JSON.stringify({ message, sessionId })
});
```

**Benefits:**
- Higher rate limits
- Usage analytics
- Enhanced security
- Per-key tracking

---

## Troubleshooting

### Common Issues

#### 1. Widget Not Appearing

**Check:**
- Is the script tag before `</body>`?
- Is the `chatbotId` correct?
- Check browser console for errors
- Verify the script URL is accessible

**Solution:**
```html
<!-- Correct placement -->
<body>
  <!-- Your page content -->

  <script src="https://build-ai-shaun.vercel.app/widget.js"
    data-chatbot-id="YOUR_CHATBOT_ID">
  </script>
</body>
```

#### 2. CORS Errors

**Symptom:** "Access-Control-Allow-Origin" error in console

**Solution:** This shouldn't happen with Build.AI, but if it does:
- Use the widget.js instead of direct API calls from browser
- Or make API calls from your backend server

#### 3. iFrame Not Loading

**Check:**
- Is the embed URL correct?
- Does your site have Content Security Policy (CSP) blocking iframes?

**Solution for CSP:**
```html
<meta http-equiv="Content-Security-Policy"
      content="frame-src 'self' https://build-ai-shaun.vercel.app;">
```

#### 4. Slow Response Times

**Possible Causes:**
- Large knowledge base (many documents)
- Complex queries requiring more processing
- Rate limiting kicking in

**Solutions:**
- Optimize your documents (remove unnecessary content)
- Implement loading indicators
- Use streaming responses (if available)

#### 5. Incorrect or Irrelevant Responses

**Possible Causes:**
- Not enough relevant documents uploaded
- Poor document quality
- Question outside knowledge base

**Solutions:**
- Upload more relevant documents
- Improve document formatting
- Adjust chatbot system instructions
- Fine-tune temperature settings

### Debug Mode

Enable debug logging:

```javascript
new BuildAIChatbot({
  chatbotId: 'YOUR_CHATBOT_ID',
  debug: true  // Logs events to console
});
```

### Testing

**Test in Local Environment:**

```javascript
new BuildAIChatbot({
  chatbotId: 'YOUR_CHATBOT_ID',
  baseUrl: 'http://localhost:3000'  // For local testing
});
```

**Test Different Scenarios:**
1. New user (clear localStorage)
2. Returning user (existing session)
3. Mobile view (resize browser)
4. Different browsers (Chrome, Firefox, Safari)

---

## Best Practices

### 1. Document Organization

- Upload clear, well-formatted documents
- Use descriptive filenames
- Organize by topic or category
- Remove duplicate content

### 2. System Instructions

Customize your chatbot's behavior with good system instructions:

```
You are a helpful customer support assistant for [Your Company].

Guidelines:
- Be friendly and professional
- Answer based on the provided documents
- If unsure, admit it and offer to connect with human support
- Keep responses concise but informative
- Use bullet points for lists
```

### 3. User Experience

- **Loading States:** Show loading indicators while waiting for responses
- **Error Handling:** Gracefully handle errors with user-friendly messages
- **Mobile Optimization:** Test on mobile devices
- **Accessibility:** Ensure keyboard navigation works

### 4. Performance

- **Lazy Loading:** Load the widget only when needed
- **Caching:** Cache the widget.js file
- **Minimize Requests:** Reuse session IDs

### 5. Security

- **Validate Input:** Sanitize user messages on your backend
- **Rate Limiting:** Respect rate limits
- **API Keys:** Use API keys (when available) for production
- **HTTPS Only:** Always use HTTPS in production

---

## Support

Need help? Here's how to get support:

1. **Check this guide** for common solutions
2. **Dashboard:** Visit the embed page for your specific chatbot
3. **Test Page:** Use the "Test Chatbot" button to verify functionality
4. **Documentation:** Read the inline documentation on the embed page

---

## Changelog

**v1.0.0** - Initial Release
- Widget integration
- API integration
- iFrame integration
- Session management
- Color customization
- Position options

---

## Quick Reference Card

### Widget One-Liner
```html
<script src="https://build-ai-shaun.vercel.app/widget.js" data-chatbot-id="YOUR_ID"></script>
```

### API One-Liner
```javascript
fetch('https://build-ai-shaun.vercel.app/api/chatbots/YOUR_ID/chat', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({message:'Hi', sessionId:'s1'})})
```

### iFrame One-Liner
```html
<iframe src="https://build-ai-shaun.vercel.app/embed/YOUR_ID" width="400" height="600"></iframe>
```

---

**Built with Build.AI** - Turn your documents into intelligent chatbots
