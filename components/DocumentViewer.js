'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getDocumentFromFirestore, createDocumentDownloadLink } from '@/lib/firestoreStorage';
import { Button } from '@/components/ui';
import { 
  Eye, 
  Download, 
  FileText, 
  Image as ImageIcon, 
  X, 
  AlertCircle,
  Loader 
} from 'lucide-react';
import Image from 'next/image';

export default function DocumentViewer({ documentId, fileName, onClose, className = '' }) {
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadDocument = async () => {
      if (!documentId) {
        setError('No document ID provided');
        setLoading(false);
        return;
      }

      try {
        const result = await getDocumentFromFirestore(documentId);
        
        if (result.success) {
          setDocument(result.document);
        } else {
          setError(result.error || 'Failed to load document');
        }
      } catch (err) {
        setError('Error loading document');
        console.error('Document loading error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadDocument();
  }, [documentId]);

  const handleDownload = () => {
    if (document && document.base64Data) {
      createDocumentDownloadLink(
        document.base64Data,
        document.mimeType,
        document.fileName
      );
    }
  };

  const isImage = document?.mimeType?.startsWith('image/');
  const isPDF = document?.mimeType === 'application/pdf';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className={`fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 ${className}`}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          className="bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b-0">
            <div className="flex items-center space-x-3">
              {isImage ? (
                <ImageIcon className="w-6 h-6 text-blue-400" />
              ) : (
                <FileText className="w-6 h-6 text-blue-400" />
              )}
              <div>
                <h3 className="text-lg font-semibold text-white">
                  {fileName || document?.fileName || 'Document'}
                </h3>
                {document && (
                  <p className="text-sm text-gray-400">
                    {document.mimeType} • {(document.fileSize / 1024).toFixed(1)} KB
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {document && (
                <Button
                  onClick={handleDownload}
                  variant="outline"
                  size="sm"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              )}
              
              <Button
                onClick={onClose}
                variant="ghost"
                size="sm"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 max-h-[calc(90vh-100px)] overflow-auto">
            {loading && (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Loader className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-400" />
                  <p className="text-gray-400">Loading document...</p>
                </div>
              </div>
            )}

            {error && (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-400" />
                  <p className="text-red-400 mb-2">Failed to load document</p>
                  <p className="text-gray-400 text-sm">{error}</p>
                </div>
              </div>
            )}

            {document && !loading && !error && (
              <div className="space-y-4">
                {/* Document Info */}
                <div className="bg-gray-700/50 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">File Name:</span>
                      <p className="text-white font-medium">{document.fileName}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">File Size:</span>
                      <p className="text-white font-medium">
                        {(document.fileSize / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-400">Type:</span>
                      <p className="text-white font-medium">{document.mimeType}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">Uploaded:</span>
                      <p className="text-white font-medium">
                        {new Date(document.uploadedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Document Preview */}
                <div className="bg-gray-900 rounded-lg p-4">
                  {isImage && (
                    <div className="text-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={document.blobUrl}
                        alt={document.fileName || 'Document preview'}
                        className="max-w-full max-h-96 mx-auto rounded-lg shadow-lg"
                        style={{ objectFit: 'contain' }}
                      />
                    </div>
                  )}

                  {isPDF && (
                    <div className="text-center">
                      <iframe
                        src={document.blobUrl}
                        className="w-full h-96 rounded-lg border-0"
                        title="PDF Document"
                      />
                      <p className="text-gray-400 text-sm mt-2">
                        PDF preview. Use download button to view full document.
                      </p>
                    </div>
                  )}

                  {!isImage && !isPDF && (
                    <div className="text-center py-8">
                      <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                      <p className="text-gray-300 mb-2">
                        Preview not available for this file type
                      </p>
                      <p className="text-gray-400 text-sm">
                        Use the download button to view the file
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// Simple document link component for tables
export function DocumentLink({ documentId, fileName, className = '' }) {
  const [showViewer, setShowViewer] = useState(false);

  if (!documentId) {
    return (
      <span className="text-gray-500 text-sm">No document</span>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowViewer(true)}
        className={`inline-flex items-center text-blue-400 hover:text-blue-300 transition-colors ${className}`}
      >
        <Eye className="w-4 h-4 mr-1" />
        {fileName || 'View Document'}
      </button>

      {showViewer && (
        <DocumentViewer
          documentId={documentId}
          fileName={fileName}
          onClose={() => setShowViewer(false)}
        />
      )}
    </>
  );
}
