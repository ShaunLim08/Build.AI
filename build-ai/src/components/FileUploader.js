'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2, X } from 'lucide-react';

export default function FileUploader({ chatbotId, onUploadComplete, onUploadError }) {
  const [uploadStatus, setUploadStatus] = useState(null); // null, 'uploading', 'success', 'error'
  const [uploadedFile, setUploadedFile] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);

  const uploadFile = useCallback(async (file) => {
    setUploadStatus('uploading');
    setUploadedFile(file);
    setErrorMessage('');
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);

      // Simulate progress (since we can't track actual upload progress easily in Next.js)
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      const response = await fetch(`/api/chatbots/${chatbotId}/documents`, {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      setUploadStatus('success');
      if (onUploadComplete) {
        onUploadComplete(data.document);
      }

      // Auto-reset after 3 seconds
      setTimeout(() => {
        setUploadStatus(null);
        setUploadedFile(null);
        setUploadProgress(0);
      }, 3000);

    } catch (error) {
      setUploadStatus('error');
      setErrorMessage(error.message);
      setUploadProgress(0);
      if (onUploadError) {
        onUploadError(error);
      }
    }
  }, [chatbotId, onUploadComplete, onUploadError]);

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      uploadFile(acceptedFiles[0]);
    }
  }, [uploadFile]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
    },
    maxFiles: 1,
    disabled: uploadStatus === 'uploading',
  });

  const resetUpload = () => {
    setUploadStatus(null);
    setUploadedFile(null);
    setErrorMessage('');
    setUploadProgress(0);
  };

  return (
    <div className="w-full">
      {!uploadStatus || uploadStatus === 'uploading' ? (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
            ${uploadStatus === 'uploading' ? 'opacity-50 cursor-not-allowed' : ''}
            ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}`}
        >
          <input {...getInputProps()} />
          {uploadStatus === 'uploading' ? (
            <div className="space-y-4">
              <Loader2 className="mx-auto h-12 w-12 text-blue-500 animate-spin" />
              <div>
                <p className="text-sm font-medium text-gray-700">Uploading {uploadedFile?.name}...</p>
                <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">{uploadProgress}% complete</p>
              </div>
            </div>
          ) : (
            <>
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-sm text-gray-600">
                {isDragActive ? 'Drop files here...' : 'Drag & drop files, or click to select'}
              </p>
              <p className="text-xs text-gray-500 mt-1">PDF and TXT supported (Max 10MB)</p>
            </>
          )}
        </div>
      ) : uploadStatus === 'success' ? (
        <div className="border-2 border-green-500 bg-green-50 rounded-lg p-8 text-center">
          <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
          <p className="mt-2 text-sm font-medium text-green-700">
            Upload successful!
          </p>
          <p className="text-xs text-gray-600 mt-1">{uploadedFile?.name}</p>
        </div>
      ) : (
        <div className="border-2 border-red-500 bg-red-50 rounded-lg p-8 text-center">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
            </div>
            <button
              onClick={resetUpload}
              className="text-red-500 hover:text-red-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <p className="mt-2 text-sm font-medium text-red-700">
            Upload failed
          </p>
          <p className="text-xs text-red-600 mt-1">{errorMessage}</p>
          <button
            onClick={resetUpload}
            className="mt-4 text-sm text-red-600 hover:text-red-800 underline"
          >
            Try again
          </button>
        </div>
      )}
    </div>
  );
}