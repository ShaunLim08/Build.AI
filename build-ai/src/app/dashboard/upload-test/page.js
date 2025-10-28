'use client';

import { useState, useEffect } from 'react';
import FileUploader from '@/components/FileUploader';
import { Card } from '@/components/ui/card';
import { Loader2, FileText, AlertCircle } from 'lucide-react';

export default function UploadTestPage() {
  const [uploadedDocuments, setUploadedDocuments] = useState([]);
  const [chatbotId, setChatbotId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDocument, setSelectedDocument] = useState(null);

  // Initialize chatbot on page load
  useEffect(() => {
    initializeChatbot();
  }, []);

  const initializeChatbot = async () => {
    try {
      setLoading(true);
      setError(null);

      // First, try to get existing chatbots
      const listResponse = await fetch('/api/chatbots');

      if (!listResponse.ok) {
        throw new Error('Failed to fetch chatbots');
      }

      const listData = await listResponse.json();

      if (listData.chatbots && listData.chatbots.length > 0) {
        // Use the first chatbot
        setChatbotId(listData.chatbots[0]._id);
        console.log('Using existing chatbot:', listData.chatbots[0]._id);
      } else {
        // Create a new test chatbot
        const createResponse = await fetch('/api/chatbots', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: 'PDF Upload Test Bot',
            description: 'A test chatbot for PDF upload functionality',
            systemInstruction: 'You are a helpful assistant.',
          }),
        });

        if (!createResponse.ok) {
          throw new Error('Failed to create chatbot');
        }

        const createData = await createResponse.json();
        setChatbotId(createData.chatbot._id);
        console.log('Created new chatbot:', createData.chatbot._id);
      }
    } catch (err) {
      console.error('Initialization error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadComplete = async (document) => {
    console.log('Upload complete:', document);
    setUploadedDocuments((prev) => [...prev, document]);

    // Automatically select the uploaded document to show details
    setSelectedDocument(document);

    // Fetch chunks to show parsed content
    await fetchDocumentChunks(document._id);
  };

  const handleUploadError = (error) => {
    console.error('Upload error:', error);
    setError(error.message);
  };

  const fetchDocumentChunks = async (documentId) => {
    try {
      const response = await fetch(`/api/documents/${documentId}/chunks`);
      if (response.ok) {
        const data = await response.json();
        console.log('Document chunks:', data.chunks);
      }
    } catch (err) {
      console.error('Failed to fetch chunks:', err);
    }
  };

  const viewDocumentDetails = async (doc) => {
    setSelectedDocument(doc);
    if (chatbotId) {
      // Fetch fresh document data
      try {
        const response = await fetch(`/api/chatbots/${chatbotId}/documents`);
        if (response.ok) {
          const data = await response.json();
          const fullDoc = data.documents.find(d => d._id === doc._id);
          if (fullDoc) {
            setSelectedDocument(fullDoc);
          }
        }
      } catch (err) {
        console.error('Failed to fetch document details:', err);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">Initializing chatbot...</p>
        </div>
      </div>
    );
  }

  if (error && !chatbotId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="p-6 max-w-md">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-center mb-2">Initialization Error</h2>
          <p className="text-gray-600 text-center mb-4">{error}</p>
          <button
            onClick={initializeChatbot}
            className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
          >
            Try Again
          </button>
          <p className="text-sm text-gray-500 mt-4 text-center">
            Make sure you are logged in. Visit <a href="/login" className="text-blue-500 underline">/login</a>
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">PDF Upload Test</h1>
          <p className="mt-2 text-gray-600">
            Test the PDF upload functionality for your chatbot
          </p>
          {chatbotId && (
            <p className="mt-1 text-sm text-gray-500">
              Using chatbot ID: <code className="bg-gray-200 px-2 py-1 rounded">{chatbotId}</code>
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upload Section */}
          <div>
            <Card className="p-6 mb-8">
              <h2 className="text-lg font-semibold mb-4">Upload Document</h2>
              {chatbotId ? (
                <FileUploader
                  chatbotId={chatbotId}
                  onUploadComplete={handleUploadComplete}
                  onUploadError={handleUploadError}
                />
              ) : (
                <div className="text-center text-gray-500 py-8">
                  Waiting for chatbot initialization...
                </div>
              )}
            </Card>

            {uploadedDocuments.length > 0 && (
              <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4">Uploaded Documents</h2>
                <div className="space-y-3">
                  {uploadedDocuments.map((doc, index) => (
                    <button
                      key={index}
                      onClick={() => viewDocumentDetails(doc)}
                      className="w-full border border-gray-200 rounded-lg p-4 bg-white hover:bg-gray-50 text-left transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <FileText className="h-5 w-5 text-blue-500 mt-1 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 truncate">{doc.filename}</h3>
                          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600">
                            <span>Pages: {doc.pageCount}</span>
                            <span>Words: {doc.wordCount?.toLocaleString()}</span>
                            <span className="text-green-600 font-medium">{doc.status}</span>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </Card>
            )}
          </div>

          {/* Document Details Section */}
          <div>
            {selectedDocument ? (
              <Card className="p-6 sticky top-4">
                <h2 className="text-lg font-semibold mb-4">Document Details</h2>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Filename</label>
                    <p className="text-gray-900">{selectedDocument.filename}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Type</label>
                    <p className="text-gray-900">{selectedDocument.type}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Pages</label>
                      <p className="text-gray-900">{selectedDocument.pageCount}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Words</label>
                      <p className="text-gray-900">{selectedDocument.wordCount?.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Chunks</label>
                      <p className="text-gray-900">{selectedDocument.chunkCount || 0}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Status</label>
                      <p className="text-green-600 font-medium">{selectedDocument.status}</p>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Upload Date</label>
                    <p className="text-gray-900">
                      {new Date(selectedDocument.uploadedAt).toLocaleString()}
                    </p>
                  </div>
                  {selectedDocument.processedAt && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">Processed Date</label>
                      <p className="text-gray-900">
                        {new Date(selectedDocument.processedAt).toLocaleString()}
                      </p>
                    </div>
                  )}
                  <div className="pt-4 border-t">
                    <p className="text-sm text-gray-600">
                      Document ID: <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">{selectedDocument._id}</code>
                    </p>
                  </div>
                </div>
              </Card>
            ) : (
              <Card className="p-6 sticky top-4">
                <div className="text-center text-gray-500 py-12">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Upload a document to see details</p>
                </div>
              </Card>
            )}
          </div>
        </div>

        <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">How to Check Parsing Output</h3>
          <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
            <li>Upload a PDF or TXT file using the upload area above</li>
            <li>Check the browser console (F12) to see detailed parsing output</li>
            <li>View document metadata in the &ldquo;Document Details&rdquo; panel</li>
            <li>The chunks created from the document are stored in MongoDB</li>
          </ol>

          <div className="mt-4 p-4 bg-white rounded border border-blue-200">
            <p className="text-sm font-medium text-gray-900 mb-2">Debug Information:</p>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Open browser DevTools Console (F12) to see parsing logs</li>
              <li>• Check the Network tab to see API responses</li>
              <li>• Document chunks are logged with their text content</li>
              <li>• MongoDB collections: documents, chunks, chatbots</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
