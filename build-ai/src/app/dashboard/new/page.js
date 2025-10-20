'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function NewChatbotPage() {
  const [step, setStep] = useState(1);
  const [chatbotData, setChatbotData] = useState({
    name: '',
    description: '',
    dataSource: '',
    settings: {
      temperature: 0.7,
      maxTokens: 500,
      systemPrompt: ''
    }
  });

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
  };

  const handlePrevious = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleCreate = () => {
    // This will be implemented later with actual API call
    console.log('Creating chatbot:', chatbotData);
    alert('Chatbot creation will be implemented in the next phase!');
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
              {[1, 2, 3].map((stepNumber) => (
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
                  {stepNumber < 3 && (
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
                Step {step} of 3: {step === 1 ? 'Basic Information' : step === 2 ? 'Data Source' : 'Configuration'}
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
                <h2 className="text-2xl font-semibold mb-6">Choose Data Source</h2>
                <div className="grid gap-4">
                  {[
                    {
                      id: 'pdf',
                      title: 'PDF Documents',
                      description: 'Upload PDF files to train your chatbot',
                      icon: '📄'
                    },
                    {
                      id: 'website',
                      title: 'Website Scraping',
                      description: 'Scrape content from websites',
                      icon: '🌐'
                    },
                    {
                      id: 'mongodb',
                      title: 'MongoDB Database',
                      description: 'Connect to your MongoDB database',
                      icon: '🗄️'
                    }
                  ].map((source) => (
                    <div
                      key={source.id}
                      onClick={() => setChatbotData({...chatbotData, dataSource: source.id})}
                      className={`p-6 border rounded-lg cursor-pointer transition-colors ${
                        chatbotData.dataSource === source.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="flex items-start space-x-4">
                        <div className="text-3xl">{source.icon}</div>
                        <div>
                          <h3 className="text-lg font-medium mb-1">{source.title}</h3>
                          <p className="text-muted-foreground">{source.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {step === 3 && (
              <div>
                <h2 className="text-2xl font-semibold mb-6">Configuration</h2>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">System Prompt</label>
                    <textarea
                      value={chatbotData.settings.systemPrompt}
                      onChange={(e) => setChatbotData({
                        ...chatbotData,
                        settings: {...chatbotData.settings, systemPrompt: e.target.value}
                      })}
                      placeholder="You are a helpful assistant that..."
                      rows={4}
                      className="input resize-none"
                    />
                  </div>
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
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Max Response Length</label>
                      <input
                        type="number"
                        value={chatbotData.settings.maxTokens}
                        onChange={(e) => setChatbotData({
                          ...chatbotData,
                          settings: {...chatbotData.settings, maxTokens: parseInt(e.target.value)}
                        })}
                        className="input"
                        min="100"
                        max="2000"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8 pt-6 border-t border-border">
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
                    (step === 1 && (!chatbotData.name || !chatbotData.description)) ||
                    (step === 2 && !chatbotData.dataSource)
                  }
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={handleCreate}
                  className="btn-primary"
                >
                  Create Chatbot
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}