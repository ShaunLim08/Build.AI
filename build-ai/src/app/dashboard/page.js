import Link from "next/link";

export default function DashboardPage() {
  // Mock data for demonstration
  const mockChatbots = [
    {
      id: "1",
      name: "Customer Support Bot",
      description: "Handles customer inquiries and support tickets",
      status: "active",
      createdAt: "2024-10-01",
      messageCount: 1250
    },
    {
      id: "2",
      name: "Product Documentation Bot",
      description: "Answers questions about product features and documentation",
      status: "training",
      createdAt: "2024-10-05",
      messageCount: 0
    },
    {
      id: "3",
      name: "FAQ Assistant",
      description: "Provides instant answers to frequently asked questions",
      status: "active",
      createdAt: "2024-09-28",
      messageCount: 890
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Main Content */}
      <main className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Your Chatbots</h1>
          <p className="text-muted-foreground">
            Manage and monitor your RAG-powered chatbots
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card p-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-1">Total Chatbots</h3>
            <p className="text-3xl font-bold">{mockChatbots.length}</p>
          </div>
          <div className="card p-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-1">Active Chatbots</h3>
            <p className="text-3xl font-bold text-success">
              {mockChatbots.filter(bot => bot.status === 'active').length}
            </p>
          </div>
          <div className="card p-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-1">Total Messages</h3>
            <p className="text-3xl font-bold">
              {mockChatbots.reduce((sum, bot) => sum + bot.messageCount, 0).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Chatbots List */}
        <div className="card">
          <div className="p-6 border-b border-border">
            <h2 className="text-xl font-semibold">All Chatbots</h2>
          </div>
          <div className="divide-y divide-border">
            {mockChatbots.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🤖</span>
                </div>
                <h3 className="text-lg font-medium mb-2">No chatbots yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first RAG chatbot to get started
                </p>
                <Link href="/dashboard/new" className="btn-primary">
                  Create Your First Chatbot
                </Link>
              </div>
            ) : (
              mockChatbots.map((chatbot) => (
                <div key={chatbot.id} className="p-6 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-medium">{chatbot.name}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          chatbot.status === 'active'
                            ? 'bg-success/10 text-success'
                            : 'bg-warning/10 text-warning'
                        }`}>
                          {chatbot.status}
                        </span>
                      </div>
                      <p className="text-muted-foreground mb-2">{chatbot.description}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>Created: {chatbot.createdAt}</span>
                        <span>Messages: {chatbot.messageCount.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Link
                        href={`/chat/${chatbot.id}`}
                        className="btn-secondary text-sm"
                      >
                        Test
                      </Link>
                      <Link
                        href={`/dashboard/${chatbot.id}/embed`}
                        className="btn-secondary text-sm"
                      >
                        Embed
                      </Link>
                      <button className="btn-secondary text-sm">
                        Settings
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}