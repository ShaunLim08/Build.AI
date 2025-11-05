'use client';

import { useState } from 'react';
import { Database, CheckCircle, AlertCircle, Loader2, X, Eye, EyeOff, RefreshCw } from 'lucide-react';

export default function MongoDBConnector({ chatbotId, onImportComplete, onImportError }) {
  const [step, setStep] = useState(1); // 1: connection, 2: collection, 3: preview, 4: import
  const [connectionString, setConnectionString] = useState('');
  const [databaseName, setDatabaseName] = useState('');
  const [collectionName, setCollectionName] = useState('');
  const [limit, setLimit] = useState(100);
  const [showConnectionString, setShowConnectionString] = useState(false);

  const [testStatus, setTestStatus] = useState(null); // null, 'testing', 'success', 'error'
  const [testResult, setTestResult] = useState(null);
  const [schema, setSchema] = useState(null);
  const [importStatus, setImportStatus] = useState(null); // null, 'importing', 'success', 'error'
  const [errorMessage, setErrorMessage] = useState('');
  const [result, setResult] = useState(null);

  const testConnection = async () => {
    setTestStatus('testing');
    setErrorMessage('');
    setTestResult(null);

    try {
      const response = await fetch(`/api/chatbots/${chatbotId}/mongodb/test`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          connectionString: connectionString.trim(),
          databaseName: databaseName.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Connection test failed');
      }

      if (!data.connectionSuccessful) {
        throw new Error(data.error || 'Connection failed');
      }

      setTestStatus('success');
      setTestResult(data);
      setStep(2);

    } catch (error) {
      setTestStatus('error');
      setErrorMessage(error.message);
    }
  };

  const loadSchema = async () => {
    if (!collectionName.trim()) return;

    try {
      const params = new URLSearchParams({
        connectionString: connectionString.trim(),
        databaseName: databaseName.trim(),
        collectionName: collectionName.trim(),
      });

      const response = await fetch(`/api/chatbots/${chatbotId}/mongodb/schema?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load schema');
      }

      setSchema(data);
      setStep(3);

    } catch (error) {
      setErrorMessage(error.message);
    }
  };

  const importData = async () => {
    setImportStatus('importing');
    setErrorMessage('');

    try {
      const response = await fetch(`/api/chatbots/${chatbotId}/mongodb`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          connectionString: connectionString.trim(),
          databaseName: databaseName.trim(),
          collectionName: collectionName.trim(),
          limit: parseInt(limit),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Import failed');
      }

      setImportStatus('success');
      setResult(data);

      if (onImportComplete) {
        onImportComplete(data);
      }

      // Reset after 3 seconds
      setTimeout(() => {
        resetForm();
      }, 3000);

    } catch (error) {
      setImportStatus('error');
      setErrorMessage(error.message);
      if (onImportError) {
        onImportError(error);
      }
    }
  };

  const resetForm = () => {
    setStep(1);
    setConnectionString('');
    setDatabaseName('');
    setCollectionName('');
    setLimit(100);
    setTestStatus(null);
    setTestResult(null);
    setSchema(null);
    setImportStatus(null);
    setErrorMessage('');
    setResult(null);
  };

  const goBack = () => {
    if (step > 1) {
      setStep(step - 1);
      setErrorMessage('');
    }
  };

  return (
    <div className="w-full">
      {/* Progress Steps */}
      <div className="mb-6">
        <div className="flex items-center justify-center space-x-2">
          {[1, 2, 3, 4].map((stepNum) => (
            <div key={stepNum} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= stepNum
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {stepNum}
              </div>
              {stepNum < 4 && (
                <div
                  className={`w-12 h-0.5 ${
                    step > stepNum ? 'bg-primary' : 'bg-muted'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
        <div className="text-center mt-2 text-sm text-muted-foreground">
          {step === 1 && 'Connection'}
          {step === 2 && 'Select Collection'}
          {step === 3 && 'Preview Data'}
          {step === 4 && 'Import'}
        </div>
      </div>

      {importStatus === 'success' ? (
        <div className="border-2 border-green-500 bg-green-50 rounded-lg p-6 text-center">
          <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-3" />
          <p className="text-sm font-medium text-green-700 mb-2">
            MongoDB data imported successfully!
          </p>
          <div className="text-xs text-green-600 space-y-1">
            <p>{result?.importData?.processedDocuments || 0} documents processed</p>
            <p>{result?.importData?.totalWords?.toLocaleString() || 0} words imported</p>
            <p>{result?.importData?.chunkCount || 0} chunks created</p>
          </div>
        </div>
      ) : importStatus === 'error' ? (
        <div className="border-2 border-red-500 bg-red-50 rounded-lg p-6">
          <div className="flex justify-between items-start mb-4">
            <AlertCircle className="h-12 w-12 text-red-500 flex-shrink-0" />
            <button
              onClick={resetForm}
              className="text-red-500 hover:text-red-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <p className="text-sm font-medium text-red-700 mb-2">
            Import failed
          </p>
          <p className="text-xs text-red-600 mb-4">{errorMessage}</p>
          <button
            onClick={resetForm}
            className="text-sm text-red-600 hover:text-red-800 underline"
          >
            Try again
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Step 1: Connection */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  MongoDB Connection String
                </label>
                <div className="relative">
                  <input
                    type={showConnectionString ? 'text' : 'password'}
                    value={connectionString}
                    onChange={(e) => setConnectionString(e.target.value)}
                    placeholder="mongodb+srv://username:password@cluster.mongodb.net"
                    className="input pr-10"
                    disabled={testStatus === 'testing'}
                  />
                  <button
                    onClick={() => setShowConnectionString(!showConnectionString)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    type="button"
                  >
                    {showConnectionString ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Your connection string (kept secure and not stored)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Database Name
                </label>
                <input
                  type="text"
                  value={databaseName}
                  onChange={(e) => setDatabaseName(e.target.value)}
                  placeholder="myDatabase"
                  className="input"
                  disabled={testStatus === 'testing'}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  The name of your MongoDB database
                </p>
              </div>

              {testStatus === 'error' && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-red-800">Connection failed</p>
                      <p className="text-xs text-red-600 mt-1">{errorMessage}</p>
                    </div>
                  </div>
                </div>
              )}

              {testStatus === 'success' && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-green-800">Connection successful!</p>
                      <p className="text-xs text-green-600 mt-1">
                        Found {testResult?.collectionsCount || 0} collections
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={testConnection}
                disabled={
                  !connectionString.trim() ||
                  !databaseName.trim() ||
                  testStatus === 'testing'
                }
                className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {testStatus === 'testing' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Testing Connection...
                  </>
                ) : (
                  <>
                    <Database className="w-4 h-4" />
                    Test Connection
                  </>
                )}
              </button>
            </div>
          )}

          {/* Step 2: Select Collection */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <p className="text-sm font-medium text-green-800">
                  ✓ Connected to {databaseName}
                </p>
                <p className="text-xs text-green-600 mt-1">
                  {testResult?.collectionsCount || 0} collections available
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Collection Name
                </label>
                {testResult?.collections && testResult.collections.length > 0 ? (
                  <select
                    value={collectionName}
                    onChange={(e) => setCollectionName(e.target.value)}
                    className="input"
                  >
                    <option value="">Select a collection...</option>
                    {testResult.collections.map((col) => (
                      <option key={col.name} value={col.name}>
                        {col.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={collectionName}
                    onChange={(e) => setCollectionName(e.target.value)}
                    placeholder="myCollection"
                    className="input"
                  />
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Select which collection to import data from
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Document Limit
                </label>
                <input
                  type="number"
                  value={limit}
                  onChange={(e) => setLimit(e.target.value)}
                  min="1"
                  max="10000"
                  className="input"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Maximum number of documents to import (1-10,000)
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={goBack}
                  className="btn-secondary flex-1"
                >
                  Back
                </button>
                <button
                  onClick={loadSchema}
                  disabled={!collectionName.trim()}
                  className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Preview Data
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Preview */}
          {step === 3 && schema && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm font-medium text-blue-800 mb-2">
                  Collection: {collectionName}
                </p>
                {schema.fields && schema.fields.length > 0 && (
                  <div>
                    <p className="text-xs text-blue-600 mb-2">Fields detected:</p>
                    <div className="text-xs text-blue-700 space-y-1 max-h-40 overflow-y-auto">
                      {schema.fields.slice(0, 10).map((field, i) => (
                        <div key={i} className="flex justify-between">
                          <span className="font-mono">{field.name}</span>
                          <span className="text-blue-500">{field.type}</span>
                        </div>
                      ))}
                      {schema.fields.length > 10 && (
                        <p className="text-blue-600 italic">
                          ... and {schema.fields.length - 10} more fields
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {schema.sampleText && (
                <div>
                  <p className="text-sm font-medium mb-2">Sample Document Preview:</p>
                  <div className="bg-muted rounded-lg p-4 max-h-60 overflow-y-auto">
                    <pre className="text-xs whitespace-pre-wrap font-mono">
                      {schema.sampleText.substring(0, 500)}
                      {schema.sampleText.length > 500 && '...'}
                    </pre>
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={goBack}
                  className="btn-secondary flex-1"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(4)}
                  className="btn-primary flex-1"
                >
                  Continue to Import
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Confirm Import */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm font-medium text-yellow-800 mb-2">
                  Ready to Import
                </p>
                <div className="text-xs text-yellow-700 space-y-1">
                  <p>• Database: {databaseName}</p>
                  <p>• Collection: {collectionName}</p>
                  <p>• Limit: {limit} documents</p>
                </div>
              </div>

              {importStatus === 'importing' && (
                <div className="border-2 border-primary bg-primary/5 rounded-lg p-6 text-center">
                  <Loader2 className="mx-auto h-12 w-12 text-primary animate-spin mb-3" />
                  <p className="text-sm font-medium text-primary">
                    Importing data from MongoDB...
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    This may take a few moments
                  </p>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={goBack}
                  disabled={importStatus === 'importing'}
                  className="btn-secondary flex-1 disabled:opacity-50"
                >
                  Back
                </button>
                <button
                  onClick={importData}
                  disabled={importStatus === 'importing'}
                  className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {importStatus === 'importing' ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Database className="w-4 h-4" />
                      Import Data
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
        <p className="text-xs text-blue-700">
          <strong>How it works:</strong> Connect to your external MongoDB database, select a collection,
          and import documents. Each document will be converted to text and chunked for your chatbot&apos;s knowledge base.
          Your connection string is never stored.
        </p>
      </div>
    </div>
  );
}
