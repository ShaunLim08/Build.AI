'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Bot, User, Headphones, Star, Heart, Brain, Rocket, Shield, Lightbulb, MessageSquare, Book, BarChart, Settings, HelpCircle, Phone } from 'lucide-react';
import FileUploader from '@/components/FileUploader';
import WebScraper from '@/components/WebScraper';
import MongoDBConnector from '@/components/MongoDBConnector';
import ChatInterface from '@/components/ChatInterface';

export default function NewChatbotPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [chatbotData, setChatbotData] = useState({
    name: '',
    description: '',
    category: 'general',
    avatar: {
      icon: 'bot',
      color: 'purple'
    },
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
  const [selectedTemplate, setSelectedTemplate] = useState('custom');
  const [toneStyle, setToneStyle] = useState('professional');

  const categories = [
    { value: 'general', label: 'General Purpose', icon: '🤖' },
    { value: 'customer-service', label: 'Customer Service', icon: '💬' },
    { value: 'ecommerce', label: 'E-commerce', icon: '🛒' },
    { value: 'education', label: 'Education', icon: '📚' },
    { value: 'healthcare', label: 'Healthcare', icon: '🏥' },
    { value: 'finance', label: 'Finance', icon: '💰' },
    { value: 'hr', label: 'Human Resources', icon: '👥' },
    { value: 'marketing', label: 'Marketing', icon: '📢' },
    { value: 'technical', label: 'Technical Support', icon: '🔧' },
    { value: 'other', label: 'Other', icon: '⚡' }
  ];

  const avatarIcons = [
    'bot', 'user', 'support', 'star', 'heart', 'brain', 'rocket', 'shield',
    'lightbulb', 'message', 'book', 'chart', 'settings', 'help', 'phone'
  ];

  const avatarColors = [
    { name: 'purple', class: 'from-purple-500 to-blue-500' },
    { name: 'blue', class: 'from-blue-500 to-cyan-500' },
    { name: 'green', class: 'from-green-500 to-emerald-500' },
    { name: 'orange', class: 'from-orange-500 to-red-500' },
    { name: 'pink', class: 'from-pink-500 to-rose-500' },
    { name: 'indigo', class: 'from-indigo-500 to-purple-500' },
    { name: 'teal', class: 'from-teal-500 to-green-500' },
    { name: 'yellow', class: 'from-yellow-500 to-orange-500' }
  ];

  const instructionTemplates = {
    custom: {
      name: 'Custom',
      instruction: ''
    },
    customerSupport: {
      name: 'Customer Support',
      instruction: 'You are a helpful customer support assistant. Your role is to assist customers with their inquiries, resolve issues promptly, and provide accurate information about products and services. Always be polite, empathetic, and solution-oriented. If you cannot resolve an issue, guide the customer on how to escalate it.'
    },
    faq: {
      name: 'FAQ Assistant',
      instruction: 'You are an FAQ assistant that provides clear, concise answers to frequently asked questions. Base your responses on the provided documentation and knowledge base. If a question is not covered in your knowledge base, politely inform the user and suggest alternative resources or contacts.'
    },
    sales: {
      name: 'Sales Assistant',
      instruction: 'You are a knowledgeable sales assistant. Your goal is to help customers find the right products or services that meet their needs. Provide detailed product information, highlight key features and benefits, answer questions about pricing and availability, and guide customers through the purchasing process. Be persuasive yet honest.'
    },
    technical: {
      name: 'Technical Support',
      instruction: 'You are a technical support specialist. Help users troubleshoot technical issues by asking clarifying questions, providing step-by-step solutions, and explaining technical concepts in an easy-to-understand manner. Always verify that the solution worked and offer additional help if needed.'
    },
    educational: {
      name: 'Educational Tutor',
      instruction: 'You are an educational tutor. Your role is to help students learn and understand concepts clearly. Explain topics in a simple, engaging way, provide examples, and encourage questions. Adapt your explanations to the student\'s level of understanding and use the Socratic method when appropriate to promote critical thinking.'
    },
    general: {
      name: 'General Knowledge',
      instruction: 'You are a helpful assistant that answers questions based on the provided documents. Be concise, accurate, and friendly in your responses. If you don\'t know something or if it\'s not in the provided context, acknowledge this honestly and suggest where the user might find the information.'
    }
  };

  const toneStyles = {
    professional: 'Maintain a professional and formal tone. Be respectful, clear, and business-appropriate.',
    casual: 'Use a friendly and conversational tone. Be approachable and personable while remaining helpful.',
    friendly: 'Be warm, enthusiastic, and supportive. Make users feel welcomed and valued.',
    technical: 'Use precise technical language. Be detailed and specific, assuming the user has technical knowledge.',
    concise: 'Be brief and to the point. Provide essential information without unnecessary elaboration.'
  };

  const handleNext = () => {
    if (step < 4) setStep(step + 1);
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
          category: chatbotData.category,
          avatar: chatbotData.avatar,
          systemInstruction: chatbotData.systemInstruction || 'You are a helpful assistant that answers questions based on the provided documents.',
          settings: chatbotData.settings,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create chatbot');
      }

      setCreatedChatbot(data.chatbot);
      setStep(5); // Move to test & deploy step
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

  const handleTemplateChange = (templateKey) => {
    setSelectedTemplate(templateKey);
    if (templateKey !== 'custom') {
      const template = instructionTemplates[templateKey];
      setChatbotData({
        ...chatbotData,
        systemInstruction: template.instruction
      });
    }
  };

  const handleToneChange = (tone) => {
    setToneStyle(tone);
    // Append tone instruction to existing instruction
    const baseInstruction = chatbotData.systemInstruction || '';
    const toneInstruction = toneStyles[tone];

    if (baseInstruction && !baseInstruction.includes(toneInstruction)) {
      setChatbotData({
        ...chatbotData,
        systemInstruction: `${baseInstruction}\n\nTone: ${toneInstruction}`
      });
    }
  };

  const getAvatarIcon = (iconName) => {
    const iconMap = {
      bot: Bot,
      user: User,
      support: Headphones,
      star: Star,
      heart: Heart,
      brain: Brain,
      rocket: Rocket,
      shield: Shield,
      lightbulb: Lightbulb,
      message: MessageSquare,
      book: Book,
      chart: BarChart,
      settings: Settings,
      help: HelpCircle,
      phone: Phone
    };
    return iconMap[iconName] || Bot;
  };

  const getAvatarColorClass = (colorName) => {
    const color = avatarColors.find(c => c.name === colorName);
    return color ? color.class : 'from-purple-500 to-blue-500';
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
            <div className="flex items-center justify-center space-x-2">
              {[1, 2, 3, 4, 5].map((stepNumber) => (
                <div key={stepNumber} className="flex items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-medium text-sm ${
                      step >= stepNumber
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {stepNumber}
                  </div>
                  {stepNumber < 5 && (
                    <div
                      className={`w-12 h-1 mx-1 ${
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
                Step {step} of 5: {
                  step === 1 ? 'Basic Information' :
                  step === 2 ? 'System Instructions' :
                  step === 3 ? 'Document Upload' :
                  step === 4 ? 'Configuration' :
                  'Test & Deploy'
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
                  {/* Avatar Preview and Selection */}
                  <div>
                    <label className="block text-sm font-medium mb-3">Chatbot Avatar</label>
                    <div className="flex items-start gap-6">
                      {/* Avatar Preview */}
                      <div className={`w-24 h-24 bg-gradient-to-br ${getAvatarColorClass(chatbotData.avatar.color)} rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg`}>
                        {(() => {
                          const IconComponent = getAvatarIcon(chatbotData.avatar.icon);
                          return <IconComponent className="w-12 h-12 text-white" />;
                        })()}
                      </div>

                      {/* Icon and Color Selectors */}
                      <div className="flex-1 space-y-4">
                        {/* Icon Picker */}
                        <div>
                          <label className="block text-xs font-medium text-muted-foreground mb-2">Select Icon</label>
                          <div className="grid grid-cols-5 gap-2">
                            {avatarIcons.map((iconName) => {
                              const IconComponent = getAvatarIcon(iconName);
                              return (
                                <button
                                  key={iconName}
                                  type="button"
                                  onClick={() => setChatbotData({...chatbotData, avatar: {...chatbotData.avatar, icon: iconName}})}
                                  className={`p-3 rounded-lg border-2 transition-all ${
                                    chatbotData.avatar.icon === iconName
                                      ? 'border-primary bg-primary/10'
                                      : 'border-border hover:border-muted-foreground/50'
                                  }`}
                                >
                                  <IconComponent className="w-5 h-5 mx-auto" />
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Color Picker */}
                        <div>
                          <label className="block text-xs font-medium text-muted-foreground mb-2">Select Color</label>
                          <div className="grid grid-cols-8 gap-2">
                            {avatarColors.map((color) => (
                              <button
                                key={color.name}
                                type="button"
                                onClick={() => setChatbotData({...chatbotData, avatar: {...chatbotData.avatar, color: color.name}})}
                                className={`w-10 h-10 rounded-lg bg-gradient-to-br ${color.class} transition-all ${
                                  chatbotData.avatar.color === color.name
                                    ? 'ring-2 ring-primary ring-offset-2'
                                    : 'hover:scale-110'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Chatbot Name */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Chatbot Name *</label>
                    <input
                      type="text"
                      value={chatbotData.name}
                      onChange={(e) => setChatbotData({...chatbotData, name: e.target.value})}
                      placeholder="e.g., Customer Support Bot"
                      className="input"
                      required
                    />
                  </div>

                  {/* Category Selection */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Category / Use Case *</label>
                    <select
                      value={chatbotData.category}
                      onChange={(e) => setChatbotData({...chatbotData, category: e.target.value})}
                      className="input"
                      required
                    >
                      {categories.map((cat) => (
                        <option key={cat.value} value={cat.value}>
                          {cat.icon} {cat.label}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-muted-foreground mt-2">
                      Select the primary use case for your chatbot
                    </p>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Description *</label>
                    <textarea
                      value={chatbotData.description}
                      onChange={(e) => setChatbotData({...chatbotData, description: e.target.value})}
                      placeholder="Describe what your chatbot will do and how it will help users..."
                      rows={4}
                      className="input resize-none"
                      required
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      Provide a clear description of your chatbot's purpose and capabilities
                    </p>
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div>
                <h2 className="text-2xl font-semibold mb-6">System Instructions</h2>
                <div className="space-y-6">
                  {/* Template Selection */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Choose a Template</label>
                    <select
                      value={selectedTemplate}
                      onChange={(e) => handleTemplateChange(e.target.value)}
                      className="input"
                    >
                      {Object.entries(instructionTemplates).map(([key, template]) => (
                        <option key={key} value={key}>
                          {template.name}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-muted-foreground mt-2">
                      Select a pre-built template or choose "Custom" to write your own
                    </p>
                  </div>

                  {/* Tone/Style Selector */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Response Tone</label>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                      {Object.entries(toneStyles).map(([key, description]) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => handleToneChange(key)}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            toneStyle === key
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted text-muted-foreground hover:bg-muted/80'
                          }`}
                        >
                          {key.charAt(0).toUpperCase() + key.slice(1)}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {toneStyles[toneStyle]}
                    </p>
                  </div>

                  {/* System Prompt Textarea */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      System Prompt
                      <span className="text-xs text-muted-foreground font-normal ml-2">
                        ({chatbotData.systemInstruction.length} characters)
                      </span>
                    </label>
                    <textarea
                      value={chatbotData.systemInstruction}
                      onChange={(e) => {
                        setChatbotData({...chatbotData, systemInstruction: e.target.value});
                        if (e.target.value) setSelectedTemplate('custom');
                      }}
                      placeholder="You are a helpful assistant that answers questions based on the provided documents. Be concise and accurate."
                      rows={8}
                      className="input resize-none font-mono text-sm"
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      This defines how your chatbot will behave and respond to users. You can edit the template or write your own.
                    </p>
                  </div>

                  {/* Tips and Examples */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-blue-900 mb-2">Tips for Writing Effective Instructions:</h3>
                    <ul className="text-xs text-blue-800 space-y-1 ml-4 list-disc">
                      <li>Be specific about the chatbot's role and purpose</li>
                      <li>Define the tone and style of responses (formal, casual, technical, etc.)</li>
                      <li>Mention how to handle unknown questions or edge cases</li>
                      <li>Include any specific guidelines or constraints</li>
                      <li>Reference the knowledge source (e.g., "based on provided documents")</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div>
                <h2 className="text-2xl font-semibold mb-6">Document Upload Options</h2>
                <div className="space-y-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                      You can upload documents in the next step. Here are the available options:
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="border border-border rounded-lg p-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-3">
                        <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                      </div>
                      <h3 className="font-semibold mb-2">Upload Files</h3>
                      <p className="text-sm text-muted-foreground">
                        Upload PDF or TXT files to train your chatbot on custom documents.
                      </p>
                    </div>

                    <div className="border border-border rounded-lg p-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-3">
                        <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                        </svg>
                      </div>
                      <h3 className="font-semibold mb-2">Scrape Websites</h3>
                      <p className="text-sm text-muted-foreground">
                        Scrape content from websites to add web-based knowledge.
                      </p>
                    </div>

                    <div className="border border-border rounded-lg p-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-3">
                        <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                        </svg>
                      </div>
                      <h3 className="font-semibold mb-2">MongoDB Import</h3>
                      <p className="text-sm text-muted-foreground">
                        Import data directly from a MongoDB database.
                      </p>
                    </div>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-sm text-yellow-800">
                      <strong>Note:</strong> You can skip document upload and add content later from your dashboard.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {step === 4 && (
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

            {step === 5 && createdChatbot && (
              <div>
                <h2 className="text-2xl font-semibold mb-6">Test & Deploy Your Chatbot</h2>
                <div className="space-y-6">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-sm font-medium text-green-800 mb-1">
                      ✓ Chatbot "{createdChatbot.name}" created successfully!
                    </p>
                    <p className="text-xs text-green-600">
                      Test your chatbot below with some sample questions. You can add documents later from your dashboard.
                    </p>
                  </div>

                  {/* Sample Questions */}
                  <div className="border border-border rounded-lg p-4 bg-muted/30">
                    <h3 className="text-sm font-semibold mb-3">Try These Sample Questions:</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {[
                        "What can you help me with?",
                        "Tell me about your capabilities",
                        "How do you work?",
                        "What kind of questions can I ask?"
                      ].map((question, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            // This will be handled by the ChatInterface if we pass it as a prop
                            // For now, just show the question
                          }}
                          className="text-left px-3 py-2 rounded-lg bg-background border border-border hover:bg-muted/50 transition-colors text-sm"
                        >
                          {question}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Chat Interface */}
                  <div className="border border-border rounded-lg overflow-hidden">
                    <div className="bg-muted/50 px-4 py-2 border-b border-border">
                      <h3 className="text-sm font-semibold">Test Chat</h3>
                    </div>
                    <div className="h-96">
                      <ChatInterface
                        chatbotId={createdChatbot._id}
                        chatbotName={createdChatbot.name}
                      />
                    </div>
                  </div>

                  {/* Next Steps */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-blue-900 mb-2">Next Steps:</h3>
                    <ul className="text-xs text-blue-800 space-y-1 ml-4 list-disc">
                      <li>Upload documents to enhance your chatbot's knowledge</li>
                      <li>Configure additional settings from the dashboard</li>
                      <li>Get the embed code to add your chatbot to your website</li>
                      <li>Monitor conversations and improve responses</li>
                    </ul>
                  </div>
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
              {step === 5 ? (
                <>
                  <Link
                    href={`/dashboard/${createdChatbot._id}`}
                    className="btn-secondary"
                  >
                    Add Documents
                  </Link>
                  <button
                    onClick={handleFinish}
                    className="btn-primary"
                  >
                    Complete Setup
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
                  {step < 4 ? (
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
                        'Create Chatbot & Continue'
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