'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { LogoCarousel } from '@/components/ui/logo-carousel';
import {
  FileText,
  Globe,
  Database,
  Zap,
  Code2,
  ArrowRight,
  Sparkles,
  Brain,
  Lock,
} from 'lucide-react';
import { useEffect, useRef } from 'react';

export default function Home() {
  const heroRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-in');
          }
        });
      },
      { threshold: 0.1 }
    );

    const elements = document.querySelectorAll('.fade-in-up');
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  // Technology logos data
  const techLogos = [
    {
      name: 'Google Gemini',
      src: '/gemini.png',
      width: 180,
      height: 60,
    },
    {
      name: 'MongoDB',
      src: '/mongodb.png',
      width: 160,
      height: 60,
    },
    {
      name: 'Next.js',
      src: '/nextjs.png',
      width: 140,
      height: 60,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section ref={heroRef} className="container mx-auto px-4 py-24 md:py-32">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex justify-center mb-8 fade-in-up">
            <Image
              src="/buildai.png"
              alt="Build.AI Logo"
              width={200}
              height={200}
              className="w-40 h-40 md:w-48 md:h-48 lg:w-56 lg:h-56"
            />
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-sm font-medium mb-6 fade-in-up [animation-delay:50ms]">
            <Sparkles className="w-4 h-4" />
            <span>AI • RAG Technology</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold mb-6 text-balance leading-tight fade-in-up [animation-delay:100ms]">
            Build intelligent chatbots with your data
          </h1>
          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto text-balance leading-relaxed fade-in-up [animation-delay:200ms]">
            Create intelligent AI chatbots powered by Google Gemini and RAG
            technology. Train on your PDFs, websites, and MongoDB databases to
            deliver accurate, context-aware responses.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center fade-in-up [animation-delay:300ms]">
            <Button size="lg" asChild className="text-base px-8">
              <Link href="/dashboard">
                Try Demo
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="text-base px-8 bg-transparent"
            >
              <Link href="https://github.com/ShaunLim08/Build.AI" target="_blank">
                View on GitHub
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Technology Stack */}
      <section id="technology" className="border-y border-border bg-muted/30">
        <div className="container mx-auto px-4 py-16">
          <p className="text-center text-sm text-muted-foreground mb-8">
            Powered by cutting-edge AI technologies
          </p>
          <LogoCarousel logos={techLogos} speed="slow" pauseOnHover={true} />
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-4 py-24 md:py-32">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">Core Features</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Powerful RAG-based chatbot capabilities for your custom data sources
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card className="p-8 hover:shadow-lg transition-all hover:-translate-y-1 group">
            <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
              <FileText className="w-6 h-6 text-accent" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Document Processing</h3>
            <p className="text-muted-foreground leading-relaxed">
              Upload PDFs and text documents. Content is automatically extracted,
              intelligently chunked, and embedded using Gemini&apos;s text-embedding
              model for precise semantic retrieval.
            </p>
          </Card>
          <Card className="p-8 hover:shadow-lg transition-all hover:-translate-y-1 group">
            <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
              <Globe className="w-6 h-6 text-accent" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Website Scraping</h3>
            <p className="text-muted-foreground leading-relaxed">
              Scrape single or multiple URLs with intelligent content extraction.
              Supports article pages, documentation sites, and knowledge bases.
              Automatically processed into your chatbot&apos;s knowledge.
            </p>
          </Card>
          <Card className="p-8 hover:shadow-lg transition-all hover:-translate-y-1 group">
            <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
              <Database className="w-6 h-6 text-accent" />
            </div>
            <h3 className="text-xl font-semibold mb-3">MongoDB Data Import</h3>
            <p className="text-muted-foreground leading-relaxed">
              Connect to external MongoDB databases and import collections
              directly. Preview schemas, test connections, and bulk import
              documents as knowledge sources.
            </p>
          </Card>
          <Card className="p-8 hover:shadow-lg transition-all hover:-translate-y-1 group">
            <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
              <Brain className="w-6 h-6 text-accent" />
            </div>
            <h3 className="text-xl font-semibold mb-3">RAG Architecture</h3>
            <p className="text-muted-foreground leading-relaxed">
              Retrieval-Augmented Generation powered by Google&apos;s Gemini AI.
              Combines semantic vector search with advanced language models for
              accurate, context-aware responses.
            </p>
          </Card>
          <Card className="p-8 hover:shadow-lg transition-all hover:-translate-y-1 group">
            <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
              <Code2 className="w-6 h-6 text-accent" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Embeddable Widget</h3>
            <p className="text-muted-foreground leading-relaxed">
              Deploy your chatbot anywhere with a simple embed code. Fully
              customizable interface that matches your brand and design.
            </p>
          </Card>
          <Card className="p-8 hover:shadow-lg transition-all hover:-translate-y-1 group">
            <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
              <Lock className="w-6 h-6 text-accent" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Secure & Private</h3>
            <p className="text-muted-foreground leading-relaxed">
              Your data stays secure with encrypted storage and processing.
              Built with privacy-first principles and best practices.
            </p>
          </Card>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-muted/30 py-24 md:py-32">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              How It Works
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Simple three-step process to create your custom AI chatbot
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-accent">
                1
              </div>
              <h3 className="text-xl font-semibold mb-3">Upload Your Data</h3>
              <p className="text-muted-foreground leading-relaxed">
                Upload PDFs, provide website URLs, or connect your MongoDB
                database as the knowledge source.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-accent">
                2
              </div>
              <h3 className="text-xl font-semibold mb-3">Process & Train</h3>
              <p className="text-muted-foreground leading-relaxed">
                Content is automatically chunked and converted into vector
                embeddings using Gemini, then stored in MongoDB for lightning-fast
                semantic search.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-accent">
                3
              </div>
              <h3 className="text-xl font-semibold mb-3">Deploy & Chat</h3>
              <p className="text-muted-foreground leading-relaxed">
                Embed your chatbot on any website and start having intelligent
                conversations with your data.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="bg-foreground text-background py-24 md:py-32">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-balance">
            Ready to explore the demo?
          </h2>
          <p className="text-xl text-background/80 mb-10 max-w-2xl mx-auto text-balance leading-relaxed">
            Experience how RAG technology can transform your data into
            intelligent conversations. Try the live demo now.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              size="lg"
              variant="secondary"
              asChild
              className="text-base px-8"
            >
              <Link href="/dashboard">
                Try Demo
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="text-base px-8 bg-transparent text-background border-background/20 hover:bg-background/10 hover:text-background"
            >
              <Link href="https://github.com/ShaunLim08/Build.AI" target="_blank">
                View Source Code
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/30">
        <div className="container mx-auto px-4 py-12">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/buildai.png"
                alt="Build.AI Logo"
                width={32}
                height={32}
                className="w-8 h-8"
              />
              <span className="text-xl font-semibold">Build.AI</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              AI Chatbot Builder with RAG
            </p>
            <div className="flex items-center gap-6">
              <Link
                href="https://github.com/ShaunLim08/Build.AI"
                target="_blank"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <span className="sr-only">GitHub</span>
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    fillRule="evenodd"
                    d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                    clipRule="evenodd"
                  />
                </svg>
              </Link>
              <Link
                href="https://www.linkedin.com/in/shaunlim08/"
                target="_blank"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <span className="sr-only">LinkedIn</span>
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
