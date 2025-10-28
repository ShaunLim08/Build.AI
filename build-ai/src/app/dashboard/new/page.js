'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import FileUploader from '@/components/FileUploader';
import WebScraper from '@/components/WebScraper';
import MongoDBConnector from '@/components/MongoDBConnector';

export default function NewChatbotPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [chatbotData, setChatbotData] = useState({
    name: '',
    description: '',
    systemInstruction: '',
    settings: {
      temperature: 0.7,
      maxTokens: 2000,
      responseStyle: 'balanced'
    }
  });
  const [createdChatbot, setCreatedChatbot] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploadMode, setUploadMode] = useState('files'); // 'files', 'scrape', or 'mongodb'

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
  };

  const handlePrevious = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleCreate = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/chatbots', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: chatbotData.name,
          description: chatbotData.description,
          systemInstruction: chatbotData.systemInstruction || 'You are a helpful assistant that answers questions based on the provided documents.',
          settings: chatbotData.settings,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create chatbot');
      }

      setCreatedChatbot(data.chatbot);
      setStep(4); // Move to upload step
    } catch (err) {
      console.error('Error creating chatbot:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadComplete = (document) => {
    console.log('Document uploaded:', document);
    // You can show a success message or update state here
  };

  const handleSkipUpload = () => {
    router.push('/dashboard');
  };

  const handleFinish = () => {
    router.push(`/dashboard/${createdChatbot._id}`);
  };

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
        <div className="max-w-3xl mx-auto">
          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-center space-x-4">
              {[1, 2, 3, 4].map((stepNumber) => (
                <div key={stepNumber} className="flex items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-medium ${
                      step >= stepNumber
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {stepNumber}
                  </div>
                  {stepNumber < 4 && (
                    <div
                      className={`w-16 h-1 mx-2 ${
                        step > stepNumber ? 'bg-primary' : 'bg-muted'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="text-center mt-4">
              <h1 className="text-3xl font-bold mb-2">Create New Chatbot</h1>
              <p className="text-muted-foreground">
                Step {step} of 4: {
                  step === 1 ? 'Basic Information' :
                  step === 2 ? 'System Instructions' :
                  step === 3 ? 'Configuration' :
                  'Upload Documents'
                }
              </p>
            </div>
          </div>

          {/* Step Content */}
          <div className="card p-8">
            {step === 1 && (
              <div>
                <h2 className="text-2xl font-semibold mb-6">Basic Information</h2>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Chatbot Name</label>
                    <input
                      type="text"
                      value={chatbotData.name}
                      onChange={(e) => setChatbotData({...chatbotData, name: e.target.value})}
                      placeholder="e.g., Customer Support Bot"
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Description</label>
                    <textarea
                      value={chatbotData.description}
                      onChange={(e) => setChatbotData({...chatbotData, description: e.target.value})}
                      placeholder="Describe what your chatbot will do..."
                      rows={4}
                      className="input resize-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div>
                <h2 className="text-2xl font-semibold mb-6">System Instructions</h2>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">System Prompt</label>
                    <textarea
                      value={chatbotData.systemInstruction}
                      onChange={(e) => setChatbotData({...chatbotData, systemInstruction: e.target.value})}
                      placeholder="You are a helpful assistant that answers questions based on the provided documents. Be concise and accurate."
                      rows={6}
                      className="input resize-none"
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      This defines how your chatbot will behave and respond to users.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div>
                <h2 className="text-2xl font-semibold mb-6">Configuration</h2>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Response Creativity (Temperature): {chatbotData.settings.temperature}
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={chatbotData.settings.temperature}
                        onChange={(e) => setChatbotData({
                          ...chatbotData,
                          settings: {...chatbotData.settings, temperature: parseFloat(e.target.value)}
                        })}
                        className="w-full"
                      />
                      <p className="text-xs text-muted-foreground mt-2">
                        Lower values = more focused, Higher values = more creative
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Max Response Length (Tokens)</label>
                      <input
                        type="number"
                        value={chatbotData.settings.maxTokens}
                        onChange={(e) => setChatbotData({
                          ...chatbotData,
                          settings: {...chatbotData.settings, maxTokens: parseInt(e.target.value)}
                        })}
                        className="input"
                        min="100"
                        max="4000"
                      />
                      <p className="text-xs text-muted-foreground mt-2">
                        Maximum length of chatbot responses (100-4000)
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 4 && createdChatbot && (
              <div>
                <h2 className="text-2xl font-semibold mb-6">Add Content to Your Chatbot</h2>
                <div className="space-y-6">
                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <p className="text-sm text-red-800">{error}</p>
                    </div>
                  )}

                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                    <p className="text-sm font-medium text-green-800 mb-1">
                      ✓ Chatbot "{createdChatbot.name}" created successfully!
                    </p>
                    <p className="text-xs text-green-600">
                      Now add content by uploading files or scraping websites.
                    </p>
                  </div>

                  {/* Mode Toggle */}
                  <div className="grid grid-cols-3 gap-2 mb-6">
                    <button
                      onClick={() => setUploadMode('files')}
                      className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                        uploadMode === 'files'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      }`}
                    >
                      Upload Files
                    </button>
                    <button
                      onClick={() => setUploadMode('scrape')}
                      className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                        uploadMode === 'scrape'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      }`}
                    >
                      Scrape Web
                    </button>
                    <button
                      onClick={() => setUploadMode('mongodb')}
                      className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                        uploadMode === 'mongodb'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      }`}
                    >
                      MongoDB
                    </button>
                  </div>

                  {uploadMode === 'files' && (
                    <FileUploader
                      chatbotId={createdChatbot._id}
                      onUploadComplete={handleUploadComplete}
                    />
                  )}

                  {uploadMode === 'scrape' && (
                    <WebScraper
                      chatbotId={createdChatbot._id}
                      onScrapeComplete={handleUploadComplete}
                    />
                  )}

                  {uploadMode === 'mongodb' && (
                    <MongoDBConnector
                      chatbotId={createdChatbot._id}
                      onImportComplete={handleUploadComplete}
                    />
                  )}
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            {error && step < 4 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-6">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <div className="flex justify-between mt-8 pt-6 border-t border-border">
              {step === 4 ? (
                <>
                  <button
                    onClick={handleSkipUpload}
                    className="btn-secondary"
                  >
                    Skip for Now
                  </button>
                  <button
                    onClick={handleFinish}
                    className="btn-primary"
                  >
                    Go to Dashboard
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handlePrevious}
                    disabled={step === 1}
                    className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  {step < 3 ? (
                    <button
                      onClick={handleNext}
                      disabled={
                        (step === 1 && (!chatbotData.name || !chatbotData.description))
                      }
                      className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  ) : (
                    <button
                      onClick={handleCreate}
                      disabled={loading}
                      className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <span className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          Creating...
                        </span>
                      ) : (
                        'Create Chatbot'
                      )}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}