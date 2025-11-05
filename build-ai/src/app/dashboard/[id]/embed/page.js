'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Copy, Eye, EyeOff, Trash2, Key } from 'lucide-react';

export default function EmbedPage({ params }) {
  const [activeTab, setActiveTab] = useState('widget');
  const [copied, setCopied] = useState(false);
  const [chatbotId, setChatbotId] = useState(null);

  // API Key management
  const [apiKeys, setApiKeys] = useState([]);
  const [loadingKeys, setLoadingKeys] = useState(false);
  const [generatingKey, setGeneratingKey] = useState(false);
  const [newApiKey, setNewApiKey] = useState(null); // Newly generated key (shown once)
  const [showKeyModal, setShowKeyModal] = useState(false);

  // Widget customization
  const [widgetConfig, setWidgetConfig] = useState({
    position: 'bottom-right',
    primaryColor: '#6366f1',
    backgroundColor: '#0a0808',
    textColor: '#ffffff',
    watermark: true,
  });

  // Initialize chatbotId
  useEffect(() => {
    params.then(resolvedParams => {
      setChatbotId(resolvedParams.id);
    });
  }, [params]);

  // Fetch API keys
  const fetchApiKeys = useCallback(async () => {
    if (!chatbotId) return;
    try {
      setLoadingKeys(true);
      const response = await fetch(`/api/chatbots/${chatbotId}/api-keys`);
      const data = await response.json();
      if (data.success) {
        setApiKeys(data.apiKeys || []);
      }
    } catch (error) {
      console.error('Error fetching API keys:', error);
    } finally {
      setLoadingKeys(false);
    }
  }, [chatbotId]);

  // Fetch API keys on mount
  useEffect(() => {
    fetchApiKeys();
  }, [fetchApiKeys]);

  if (!chatbotId) {
    return <div>Loading...</div>;
  }

  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

  // Generate new API key
  const handleGenerateApiKey = async () => {
    try {
      setGeneratingKey(true);
      const response = await fetch(`/api/chatbots/${chatbotId}/api-keys`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `API Key ${new Date().toLocaleDateString()}`,
          environment: 'production',
        }),
      });

      const data = await response.json();

      if (data.success) {
        setNewApiKey(data.apiKey);
        setShowKeyModal(true);
        await fetchApiKeys(); // Refresh list
      } else {
        alert(data.error || 'Failed to generate API key');
      }
    } catch (error) {
      console.error('Error generating API key:', error);
      alert('Failed to generate API key');
    } finally {
      setGeneratingKey(false);
    }
  };

  // Revoke API key
  const handleRevokeApiKey = async (keyId) => {
    if (!confirm('Are you sure you want to revoke this API key? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/chatbots/${chatbotId}/api-keys/${keyId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        await fetchApiKeys(); // Refresh list
      } else {
        alert(data.error || 'Failed to revoke API key');
      }
    } catch (error) {
      console.error('Error revoking API key:', error);
      alert('Failed to revoke API key');
    }
  };

  // Copy API key to clipboard
  const copyApiKey = (key) => {
    navigator.clipboard.writeText(key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const widgetCode = `<!-- Build.AI Chatbot Widget -->
<script src="${baseUrl}/widget.js"
  data-chatbot-id="${chatbotId}"
  data-position="${widgetConfig.position}"
  data-primary-color="${widgetConfig.primaryColor}"
  data-bg-color="${widgetConfig.backgroundColor}"
  data-text-color="${widgetConfig.textColor}"
  data-watermark="${widgetConfig.watermark}">
</script>

<!-- Or initialize programmatically: -->
<script src="${baseUrl}/widget.js"></script>
<script>
  new BuildAIChatbot({
    chatbotId: '${chatbotId}',
    position: '${widgetConfig.position}', // 'bottom-right', 'bottom-left', 'top-right', 'top-left'
    primaryColor: '${widgetConfig.primaryColor}',
    backgroundColor: '${widgetConfig.backgroundColor}',
    textColor: '${widgetConfig.textColor}',
    showWatermark: ${widgetConfig.watermark},
    baseUrl: '${baseUrl}'
  });
</script>`;

  const apiExample = `// API Integration Example
const response = await fetch('${baseUrl}/api/chatbots/${chatbotId}/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    message: 'Hello, how can you help me?',
    sessionId: 'session_' + Date.now(), // Unique session ID
    conversationHistory: [] // Optional: previous messages
  })
});

const data = await response.json();
console.log(data.response); // AI response
console.log(data.metadata); // Retrieval metadata, sources, quality scores`;

  const iframeCode = `<!-- Iframe Embed -->
<iframe
  src="${baseUrl}/embed/${chatbotId}?bg=${widgetConfig.backgroundColor.replace('#', '')}&text=${widgetConfig.textColor.replace('#', '')}&button=${widgetConfig.primaryColor.replace('#', '')}&watermark=${widgetConfig.watermark}"
  width="400"
  height="600"
  frameborder="0"
  style="border-radius: 12px; box-shadow: 0 10px 40px rgba(0,0,0,0.2);"
  title="Build.AI Chatbot">
</iframe>

<!-- Customization Parameters:
  - bg: Background color (hex without #)
  - text: Text color (hex without #)
  - button: Primary button color (hex without #)
  - watermark: Show "Powered by Build.AI" (true/false)
-->`;

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

          {/* Live Preview & Customization */}
          <div className="card p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Widget Customization</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Customize the appearance and position of your chatbot widget.
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Customization Controls */}
              <div className="space-y-4">
                {/* Position */}
                <div>
                  <label className="block text-sm font-medium mb-2">Position</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['bottom-right', 'bottom-left', 'top-right', 'top-left'].map((pos) => (
                      <button
                        key={pos}
                        onClick={() => setWidgetConfig({ ...widgetConfig, position: pos })}
                        className={`px-4 py-2 rounded-lg border text-sm transition-colors ${
                          widgetConfig.position === pos
                            ? 'border-primary bg-primary/10 text-primary font-medium'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        {pos.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Primary Color */}
                <div>
                  <label className="block text-sm font-medium mb-2">Primary Color</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={widgetConfig.primaryColor}
                      onChange={(e) => setWidgetConfig({ ...widgetConfig, primaryColor: e.target.value })}
                      className="w-12 h-10 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={widgetConfig.primaryColor}
                      onChange={(e) => setWidgetConfig({ ...widgetConfig, primaryColor: e.target.value })}
                      className="flex-1 input"
                      placeholder="#6366f1"
                    />
                  </div>
                </div>

                {/* Background Color */}
                <div>
                  <label className="block text-sm font-medium mb-2">Background Color</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={widgetConfig.backgroundColor}
                      onChange={(e) => setWidgetConfig({ ...widgetConfig, backgroundColor: e.target.value })}
                      className="w-12 h-10 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={widgetConfig.backgroundColor}
                      onChange={(e) => setWidgetConfig({ ...widgetConfig, backgroundColor: e.target.value })}
                      className="flex-1 input"
                      placeholder="#0a0808"
                    />
                  </div>
                </div>

                {/* Text Color */}
                <div>
                  <label className="block text-sm font-medium mb-2">Text Color</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={widgetConfig.textColor}
                      onChange={(e) => setWidgetConfig({ ...widgetConfig, textColor: e.target.value })}
                      className="w-12 h-10 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={widgetConfig.textColor}
                      onChange={(e) => setWidgetConfig({ ...widgetConfig, textColor: e.target.value })}
                      className="flex-1 input"
                      placeholder="#ffffff"
                    />
                  </div>
                </div>

                {/* Watermark */}
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <p className="text-sm font-medium">Show Watermark</p>
                    <p className="text-xs text-muted-foreground">Display &quot;Powered by Build.AI&quot;</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={widgetConfig.watermark}
                      onChange={(e) => setWidgetConfig({ ...widgetConfig, watermark: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
              </div>

              {/* Live Preview */}
              <div className="bg-muted rounded-lg p-6 relative min-h-[400px]">
                <p className="text-sm font-medium mb-4 text-center">Live Preview</p>
                <div className="bg-background rounded-lg h-[350px] relative overflow-hidden border border-border">
                  {/* Mock website content */}
                  <div className="p-6 text-sm text-muted-foreground">
                    <div className="h-4 bg-muted rounded mb-2 w-3/4"></div>
                    <div className="h-4 bg-muted rounded mb-2 w-full"></div>
                    <div className="h-4 bg-muted rounded mb-4 w-5/6"></div>
                    <div className="h-20 bg-muted rounded mb-4"></div>
                    <div className="h-4 bg-muted rounded mb-2 w-2/3"></div>
                    <div className="h-4 bg-muted rounded mb-2 w-full"></div>
                  </div>

                  {/* Widget Button Preview */}
                  <div
                    className="absolute w-12 h-12 rounded-full shadow-lg flex items-center justify-center cursor-pointer transition-transform hover:scale-110"
                    style={{
                      backgroundColor: widgetConfig.primaryColor,
                      ...(widgetConfig.position.includes('right') ? { right: '20px' } : { left: '20px' }),
                      ...(widgetConfig.position.includes('bottom') ? { bottom: '20px' } : { top: '20px' }),
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    </svg>
                  </div>
                </div>
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

          {/* API Keys Section */}
          <div className="card mt-8 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold mb-1">API Keys</h3>
                <p className="text-sm text-muted-foreground">
                  Manage API keys for programmatic access to your chatbot.
                </p>
              </div>
              <button
                onClick={handleGenerateApiKey}
                disabled={generatingKey}
                className="btn-primary flex items-center gap-2"
              >
                <Key className="w-4 h-4" />
                {generatingKey ? 'Generating...' : 'Generate API Key'}
              </button>
            </div>

            {/* API Keys List */}
            {loadingKeys ? (
              <div className="text-center py-4 text-muted-foreground">Loading API keys...</div>
            ) : apiKeys.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Key className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No API keys generated yet.</p>
                <p className="text-sm mt-1">Click &quot;Generate API Key&quot; to create one.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {apiKeys.map((key) => (
                  <div key={key._id} className="bg-muted p-4 rounded-lg flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-mono text-sm font-medium">{key.key}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Created {new Date(key.createdAt).toLocaleDateString()} •
                        {key.usage?.totalRequests || 0} requests •
                        {key.isActive ? (
                          <span className="text-success"> Active</span>
                        ) : (
                          <span className="text-muted-foreground"> Inactive</span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleRevokeApiKey(key._id)}
                      className="btn-secondary text-xs flex items-center gap-1 hover:bg-destructive hover:text-white transition-colors"
                      title="Revoke API Key"
                    >
                      <Trash2 className="w-3 h-3" />
                      Revoke
                    </button>
                  </div>
                ))}
              </div>
            )}
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
            </div>
          </div>

          {/* API Key Modal */}
          {showKeyModal && newApiKey && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowKeyModal(false)}>
              <div className="card p-6 max-w-lg w-full mx-4" onClick={(e) => e.stopPropagation()}>
                <h3 className="text-xl font-semibold mb-3">API Key Generated</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Copy this API key now. For security reasons, you won&apos;t be able to see it again.
                </p>

                <div className="bg-muted p-4 rounded-lg mb-4">
                  <div className="font-mono text-sm break-all">{newApiKey.key}</div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => copyApiKey(newApiKey.key)}
                    className="btn-primary flex-1 flex items-center justify-center gap-2"
                  >
                    <Copy className="w-4 h-4" />
                    {copied ? 'Copied!' : 'Copy to Clipboard'}
                  </button>
                  <button
                    onClick={() => {
                      setShowKeyModal(false);
                      setNewApiKey(null);
                    }}
                    className="btn-secondary"
                  >
                    Close
                  </button>
                </div>

                <div className="mt-4 text-xs text-muted-foreground">
                  <p className="font-medium mb-2">Key Details:</p>
                  <ul className="space-y-1">
                    <li>• Rate Limit: {newApiKey.rateLimit?.requestsPerMinute || 60} requests/minute</li>
                    <li>• Daily Limit: {newApiKey.rateLimit?.requestsPerDay || 10000} requests/day</li>
                    <li>• Environment: {newApiKey.environment || 'production'}</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}