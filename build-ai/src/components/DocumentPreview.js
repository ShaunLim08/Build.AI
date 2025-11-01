'use client';

import { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Loader2, AlertCircle } from 'lucide-react';
import { Document, Page, pdfjs } from 'react-pdf';

// Configure PDF.js worker - must be done in useEffect to ensure client-side only
// This will be called in the component's useEffect

/**
 * DocumentPreview Component
 *
 * Displays a modal with document preview for PDF and TXT files
 *
 * @param {Object} document - Document object with url, filename, and type
 * @param {Function} onClose - Callback to close the modal
 */
export default function DocumentPreview({ document, onClose }) {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [textContent, setTextContent] = useState('');
  const [scale, setScale] = useState(1.0);

  const isPDF = document?.type === 'application/pdf';
  const isTXT = document?.type === 'text/plain';

  // Configure PDF.js worker on client side only
  useEffect(() => {
    if (typeof window !== 'undefined' && !pdfjs.GlobalWorkerOptions.workerSrc) {
      pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
    }
  }, []);

  // Load text file content
  useEffect(() => {
    if (!document) return;

    if (isTXT && document.url) {
      setLoading(true);
      setError(null);

      fetch(document.url)
        .then(response => {
          if (!response.ok) {
            throw new Error('Failed to load document');
          }
          return response.text();
        })
        .then(text => {
          setTextContent(text);
          setLoading(false);
        })
        .catch(err => {
          setError(err.message);
          setLoading(false);
        });
    } else if (isPDF) {
      setLoading(false);
    }
  }, [document, isTXT, isPDF]);

  // Handle PDF document load success
  function onDocumentLoadSuccess({ numPages }) {
    setNumPages(numPages);
    setLoading(false);
    setError(null);
  }

  // Handle PDF document load error
  function onDocumentLoadError(error) {
    console.error('Error loading PDF:', error);
    setError('Failed to load PDF document. The file may be corrupted or inaccessible.');
    setLoading(false);
  }

  // Navigate to previous page
  function goToPrevPage() {
    setPageNumber(prev => Math.max(prev - 1, 1));
  }

  // Navigate to next page
  function goToNextPage() {
    setPageNumber(prev => Math.min(prev + 1, numPages));
  }

  // Zoom in
  function zoomIn() {
    setScale(prev => Math.min(prev + 0.2, 2.0));
  }

  // Zoom out
  function zoomOut() {
    setScale(prev => Math.max(prev - 0.2, 0.5));
  }

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (typeof window !== 'undefined') {
      window.document.addEventListener('keydown', handleEscape);
      return () => window.document.removeEventListener('keydown', handleEscape);
    }
  }, [onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const originalOverflow = window.document.body.style.overflow;
      window.document.body.style.overflow = 'hidden';
      return () => {
        window.document.body.style.overflow = originalOverflow;
      };
    }
  }, []);

  if (!document) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="relative w-full h-full max-w-6xl max-h-screen m-4 bg-white rounded-lg shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gray-50 rounded-t-lg">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-gray-900 truncate">
              {document.filename}
            </h2>
            <p className="text-sm text-gray-500">
              {isPDF && numPages && `Page ${pageNumber} of ${numPages}`}
              {isTXT && 'Text Document'}
            </p>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2 ml-4">
            {isPDF && (
              <>
                {/* Zoom Controls */}
                <div className="flex items-center gap-1 border-r pr-2">
                  <button
                    onClick={zoomOut}
                    className="p-2 text-gray-600 hover:bg-gray-200 rounded transition"
                    title="Zoom Out"
                    disabled={scale <= 0.5}
                  >
                    <span className="text-lg">-</span>
                  </button>
                  <span className="text-sm text-gray-700 min-w-[3rem] text-center">
                    {Math.round(scale * 100)}%
                  </span>
                  <button
                    onClick={zoomIn}
                    className="p-2 text-gray-600 hover:bg-gray-200 rounded transition"
                    title="Zoom In"
                    disabled={scale >= 2.0}
                  >
                    <span className="text-lg">+</span>
                  </button>
                </div>

                {/* Page Navigation */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={goToPrevPage}
                    disabled={pageNumber <= 1}
                    className="p-2 text-gray-600 hover:bg-gray-200 rounded transition disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Previous Page"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={goToNextPage}
                    disabled={pageNumber >= numPages}
                    className="p-2 text-gray-600 hover:bg-gray-200 rounded transition disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Next Page"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </>
            )}

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 text-gray-600 hover:bg-gray-200 rounded transition ml-2"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4 bg-gray-100">
          {loading && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
                <p className="text-gray-600">Loading document...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center max-w-md">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Unable to load document
                </h3>
                <p className="text-gray-600">{error}</p>
              </div>
            </div>
          )}

          {!loading && !error && isPDF && (
            <div className="flex justify-center">
              <Document
                file={document.url}
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadError={onDocumentLoadError}
                loading={
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
                  </div>
                }
              >
                <Page
                  pageNumber={pageNumber}
                  scale={scale}
                  renderTextLayer={true}
                  renderAnnotationLayer={true}
                  className="shadow-lg"
                />
              </Document>
            </div>
          )}

          {!loading && !error && isTXT && (
            <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg">
              <div className="p-6">
                <pre className="whitespace-pre-wrap font-mono text-sm text-gray-800 leading-relaxed">
                  {textContent}
                </pre>
              </div>
            </div>
          )}

          {!loading && !error && !isPDF && !isTXT && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                <p className="text-gray-600">
                  Preview not available for this file type
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-3 border-t bg-gray-50 rounded-b-lg">
          <div className="text-sm text-gray-600">
            {document.pageCount && `${document.pageCount} page${document.pageCount > 1 ? 's' : ''}`}
            {document.wordCount && ` • ${document.wordCount.toLocaleString()} words`}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
