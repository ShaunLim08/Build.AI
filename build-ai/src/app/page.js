import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10">
      {/* Header */}
      <header className="container py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">B</span>
            </div>
            <span className="text-xl font-bold">Build.AI</span>
          </div>
          <Link
            href="/dashboard"
            className="btn-primary"
          >
            Get Started
          </Link>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="container py-20">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Build Custom RAG Chatbots
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Create intelligent chatbots using Retrieval Augmented Generation. Upload PDFs, scrape websites,
            or connect MongoDB datasets. Embed anywhere with our widget or API.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <Link href="/dashboard" className="btn-primary text-lg px-8 py-3">
              Start Building
            </Link>
            <Link href="/chat/demo" className="btn-secondary text-lg px-8 py-3">
              Try Demo
            </Link>
          </div>

          {/* Feature Grid */}
          <div className="grid md:grid-cols-3 gap-8 mt-16">
            <div className="card p-6 text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-primary text-xl">📄</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">PDF Integration</h3>
              <p className="text-muted-foreground">Upload and process PDF documents to train your chatbot on your specific content.</p>
            </div>

            <div className="card p-6 text-center">
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-accent text-xl">🌐</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Website Scraping</h3>
              <p className="text-muted-foreground">Automatically extract and index content from websites to enhance your chatbot's knowledge.</p>
            </div>

            <div className="card p-6 text-center">
              <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-success text-xl">🗄️</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">MongoDB Connection</h3>
              <p className="text-muted-foreground">Connect your MongoDB databases to create chatbots with real-time data access.</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="container py-8 border-t border-border">
        <div className="text-center text-muted-foreground">
          <p>&copy; 2024 Build.AI. Create intelligent chatbots with ease.</p>
        </div>
      </footer>
    </div>
  );
}
