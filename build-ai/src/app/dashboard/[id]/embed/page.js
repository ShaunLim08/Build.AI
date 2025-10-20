'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function EmbedPage({ params }) {
  const [activeTab, setActiveTab] = useState('widget');
  const [copied, setCopied] = useState(false);

  const chatbotId = params.id;
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

  const widgetCode = `<!-- Build.AI Chatbot Widget -->
<div id="buildai-chatbot-${chatbotId}"></div>
<script src="${baseUrl}/widget.js"></script>
<script>
  BuildAI.init({
    chatbotId: '${chatbotId}',
    containerId: 'buildai-chatbot-${chatbotId}',
    theme: 'light', // 'light' or 'dark'
    position: 'bottom-right', // 'bottom-right', 'bottom-left', 'inline'
    primaryColor: '#3b82f6'
  });
</script>`;

  const apiExample = `// API Integration Example
const response = await fetch('${baseUrl}/api/chat/${chatbotId}', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_API_KEY'
  },
  body: JSON.stringify({
    message: 'Hello, how can you help me?',
    sessionId: 'unique-session-id' // Optional
  })
});

const data = await response.json();
console.log(data.response);`;

  const iframeCode = `<!-- Iframe Embed -->
<iframe
  src="${baseUrl}/chat/${chatbotId}?embed=true"
  width="400"
  height="600"
  frameborder="0"
  style="border-radius: 10px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);"
  title="Build.AI Chatbot">
</iframe>`;

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const tabs = [
    { id: 'widget', label: 'Widget', code: widgetCode },
    { id: 'api', label: 'API', code: apiExample },
    { id: 'iframe', label: 'iFrame', code: iframeCode }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="container py-4">
          <nav className="flex items-center justify-between">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <Image
                src="/buildai.png"
                alt="Build.AI Logo"
                width={32}
                height={32}
                className="w-8 h-8"
              />
              <span className="text-xl font-bold">Build.AI</span>
            </Link>
            <Link href="/dashboard" className="btn-secondary">
              Back to Dashboard
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Embed Your Chatbot</h1>
            <p className="text-muted-foreground">
              Choose how you want to integrate your chatbot into your website or application.
            </p>
          </div>

          {/* Chatbot Info */}
          <div className="card p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Chatbot Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-sm font-medium text-muted-foreground">Chatbot ID</span>
                <p className="font-mono text-sm bg-muted p-2 rounded mt-1">{chatbotId}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-muted-foreground">Status</span>
                <p className="text-sm mt-1">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-success/10 text-success">
                    Active
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Integration Options */}
          <div className="card">
            <div className="border-b border-border">
              <nav className="flex">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-6 py-4 font-medium border-b-2 transition-colors ${
                      activeTab === tab.id
                        ? 'border-primary text-primary'
                        : 'border-transparent text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            <div className="p-6">
              {activeTab === 'widget' && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">JavaScript Widget</h3>
                  <p className="text-muted-foreground mb-4">
                    Add this code to your website to display a floating chatbot widget.
                    The widget will appear in the bottom-right corner of your page.
                  </p>
                </div>
              )}

              {activeTab === 'api' && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">REST API</h3>
                  <p className="text-muted-foreground mb-4">
                    Integrate the chatbot directly into your application using our REST API.
                    Perfect for custom implementations and mobile apps.
                  </p>
                </div>
              )}

              {activeTab === 'iframe' && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">iFrame Embed</h3>
                  <p className="text-muted-foreground mb-4">
                    Embed the chatbot as an iframe in your website. Simple integration
                    with full control over size and positioning.
                  </p>
                </div>
              )}

              {/* Code Block */}
              <div className="relative">
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                  <code>{tabs.find(tab => tab.id === activeTab)?.code}</code>
                </pre>
                <button
                  onClick={() => copyToClipboard(tabs.find(tab => tab.id === activeTab)?.code)}
                  className="absolute top-4 right-4 btn-secondary text-xs"
                >
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>

              {/* Additional Options */}
              <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                <h4 className="font-medium mb-2">Customization Options</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Customize colors and themes to match your brand</li>
                  <li>• Set custom welcome messages and bot personality</li>
                  <li>• Configure widget position and behavior</li>
                  <li>• Enable/disable features like file uploads and voice input</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Testing Section */}
          <div className="card mt-8 p-6">
            <h3 className="text-lg font-semibold mb-3">Test Your Integration</h3>
            <p className="text-muted-foreground mb-4">
              Test your chatbot before deploying it to your website.
            </p>
            <div className="flex gap-3">
              <Link
                href={`/chat/${chatbotId}`}
                className="btn-primary"
              >
                Test Chatbot
              </Link>
              <button className="btn-secondary">
                Generate API Key
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}