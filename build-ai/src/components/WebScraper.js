'use client';

import { useCallback, useState } from 'react';
import { Globe, CheckCircle, AlertCircle, Loader2, X, Plus, Trash2 } from 'lucide-react';

export default function WebScraper({ chatbotId, onScrapeComplete, onScrapeError }) {
  const [mode, setMode] = useState('single'); // 'single' or 'multiple'
  const [url, setUrl] = useState('');
  const [urls, setUrls] = useState(['']);
  const [scrapeStatus, setScrapeStatus] = useState(null); // null, 'scraping', 'success', 'error'
  const [errorMessage, setErrorMessage] = useState('');
  const [progress, setProgress] = useState(null);
  const [results, setResults] = useState(null);

  const addUrlField = () => {
    setUrls([...urls, '']);
  };

  const removeUrlField = (index) => {
    setUrls(urls.filter((_, i) => i !== index));
  };

  const updateUrl = (index, value) => {
    const newUrls = [...urls];
    newUrls[index] = value;
    setUrls(newUrls);
  };

  const scrapeUrl = useCallback(async () => {
    setScrapeStatus('scraping');
    setErrorMessage('');
    setProgress(null);
    setResults(null);

    const urlsToScrape = mode === 'single' ? [url] : urls.filter(u => u.trim());

    if (urlsToScrape.length === 0) {
      setScrapeStatus('error');
      setErrorMessage('Please enter at least one URL');
      return;
    }

    try {
      const response = await fetch(`/api/chatbots/${chatbotId}/scrape`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(
          mode === 'single'
            ? { url: url.trim() }
            : { urls: urls.filter(u => u.trim()) }
        ),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Scraping failed');
      }

      setScrapeStatus('success');
      setResults(data);

      if (onScrapeComplete) {
        onScrapeComplete(data);
      }

      // Reset form after 3 seconds
      setTimeout(() => {
        setScrapeStatus(null);
        setUrl('');
        setUrls(['']);
        setResults(null);
      }, 3000);

    } catch (error) {
      setScrapeStatus('error');
      setErrorMessage(error.message);
      if (onScrapeError) {
        onScrapeError(error);
      }
    }
  }, [chatbotId, mode, url, urls, onScrapeComplete, onScrapeError]);

  const resetScraper = () => {
    setScrapeStatus(null);
    setUrl('');
    setUrls(['']);
    setErrorMessage('');
    setProgress(null);
    setResults(null);
  };

  return (
    <div className="w-full">
      {/* Mode Toggle */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setMode('single')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            mode === 'single'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          Single URL
        </button>
        <button
          onClick={() => setMode('multiple')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            mode === 'multiple'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          Multiple URLs
        </button>
      </div>

      {scrapeStatus !== 'success' && scrapeStatus !== 'error' && (
        <div className="space-y-4">
          {mode === 'single' ? (
            <div>
              <label className="block text-sm font-medium mb-2">Website URL</label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/article"
                disabled={scrapeStatus === 'scraping'}
                className="input"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Enter the URL of a webpage to scrape and add to your chatbot&apos;s knowledge base
              </p>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium">Website URLs</label>
                <button
                  onClick={addUrlField}
                  disabled={scrapeStatus === 'scraping' || urls.length >= 10}
                  className="text-sm text-primary hover:text-primary/80 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  Add URL
                </button>
              </div>
              <div className="space-y-2">
                {urls.map((urlValue, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="url"
                      value={urlValue}
                      onChange={(e) => updateUrl(index, e.target.value)}
                      placeholder={`https://example.com/page-${index + 1}`}
                      disabled={scrapeStatus === 'scraping'}
                      className="input flex-1"
                    />
                    {urls.length > 1 && (
                      <button
                        onClick={() => removeUrlField(index)}
                        disabled={scrapeStatus === 'scraping'}
                        className="text-muted-foreground hover:text-error transition-colors disabled:opacity-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Add up to 10 URLs to scrape at once (max 10)
              </p>
            </div>
          )}

          {scrapeStatus === 'scraping' && (
            <div className="border-2 border-primary bg-primary/5 rounded-lg p-6 text-center">
              <Loader2 className="mx-auto h-12 w-12 text-primary animate-spin mb-3" />
              <p className="text-sm font-medium text-primary">
                Scraping website{mode === 'multiple' ? 's' : ''}...
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                This may take a few moments
              </p>
            </div>
          )}

          <button
            onClick={scrapeUrl}
            disabled={
              scrapeStatus === 'scraping' ||
              (mode === 'single' && !url.trim()) ||
              (mode === 'multiple' && urls.filter(u => u.trim()).length === 0)
            }
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Globe className="w-4 h-4" />
            {scrapeStatus === 'scraping' ? 'Scraping...' : `Scrape ${mode === 'multiple' ? 'URLs' : 'URL'}`}
          </button>
        </div>
      )}

      {scrapeStatus === 'success' && results && (
        <div className="border-2 border-green-500 bg-green-50 rounded-lg p-6 text-center">
          <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-3" />
          <p className="text-sm font-medium text-green-700 mb-2">
            Scraping successful!
          </p>
          {mode === 'single' ? (
            <div className="text-xs text-green-600 space-y-1">
              <p className="font-medium">{results.scrapedData?.title || 'Untitled'}</p>
              <p>{results.scrapedData?.wordCount?.toLocaleString() || 0} words scraped</p>
              <p>{results.scrapedData?.chunkCount || 0} chunks created</p>
            </div>
          ) : (
            <div className="text-xs text-green-600 space-y-1">
              <p>{results.summary?.successCount || 0} of {results.summary?.totalRequested || 0} URLs scraped successfully</p>
              <p>{results.summary?.documentsCreated || 0} documents created</p>
              {results.summary?.errorCount > 0 && (
                <p className="text-orange-600">
                  {results.summary.errorCount} URL{results.summary.errorCount > 1 ? 's' : ''} failed
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {scrapeStatus === 'error' && (
        <div className="border-2 border-red-500 bg-red-50 rounded-lg p-6">
          <div className="flex justify-between items-start mb-4">
            <AlertCircle className="h-12 w-12 text-red-500 flex-shrink-0" />
            <button
              onClick={resetScraper}
              className="text-red-500 hover:text-red-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <p className="text-sm font-medium text-red-700 mb-2">
            Scraping failed
          </p>
          <p className="text-xs text-red-600 mb-4">{errorMessage}</p>
          <button
            onClick={resetScraper}
            className="text-sm text-red-600 hover:text-red-800 underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
        <p className="text-xs text-blue-700">
          <strong>How it works:</strong> Enter a URL and we&apos;ll extract the main content (removing navigation, ads, etc.),
          then chunk it for your chatbot&apos;s knowledge base. Works best with article pages and documentation sites.
        </p>
      </div>
    </div>
  );
}
