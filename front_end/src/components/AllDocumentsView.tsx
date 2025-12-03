import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { FileText, Loader2 } from 'lucide-react';
import { Card } from './ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { apiClient, type Document, type Summary } from '../services/api';

export function AllDocumentsView() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [selectedSummary, setSelectedSummary] = useState<Summary | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await apiClient.getDocuments();
      setDocuments(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleDocumentClick = async (doc: Document) => {
    setSelectedDocument(doc);
    setSelectedSummary(null);
    setLoadingSummary(true);
    setError('');
    
    try {
      // Fetch all summaries and find the one for this document
      const summaries = await apiClient.getSummaries();
      const summary = summaries.find(s => s.document.id === doc.id);
      setSelectedSummary(summary || null);
    } catch (err: any) {
      console.error('Failed to load summary:', err);
      setError('Failed to load summary');
    } finally {
      setLoadingSummary(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-12 h-12 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div>
          <h1>All Documents</h1>
          <p className="text-muted-foreground mt-1">
            {documents.length} document{documents.length !== 1 ? 's' : ''} total
          </p>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
            {error}
          </div>
        )}

        {documents.length === 0 ? (
          <Card className="p-12 flex flex-col items-center justify-center text-center border-dashed">
            <FileText className="w-16 h-16 text-muted-foreground mb-4" />
            <h3>No documents yet</h3>
            <p className="text-muted-foreground mt-2">
              Upload your first document to get started
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {documents.map((doc, index) => (
              <motion.div
                key={doc.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card 
                  className="p-4 hover:shadow-md transition-all cursor-pointer"
                  onClick={() => handleDocumentClick(doc)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-5 h-5 text-purple-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate">{doc.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {formatFileSize(doc.file_size)}
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Document Viewer Modal */}
      <Dialog open={!!selectedDocument} onOpenChange={() => setSelectedDocument(null)}>
        <DialogContent 
          className="p-0 flex flex-col"
          style={{
            width: '95vw',
            maxWidth: '1400px',
            height: '92vh',
          }}
        >
          <DialogHeader className="px-10 pt-8 pb-6 border-b border-gray-200">
            <DialogTitle className="text-2xl font-semibold">
              {selectedDocument?.title}
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto overflow-x-hidden bg-gray-50">
            {loadingSummary ? (
              <div className="flex flex-col items-center justify-center min-h-[400px]">
                <Loader2 className="w-12 h-12 animate-spin text-purple-600 mb-4" />
                <p className="text-muted-foreground">Loading summary...</p>
              </div>
            ) : selectedSummary ? (
              <div className="max-w-5xl mx-auto px-12 py-10">
                <p className="text-gray-800 leading-[1.8] text-lg whitespace-pre-wrap">
                  {selectedSummary.full_summary}
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center mb-4">
                  <FileText className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-gray-900">No summary available</h3>
                <p className="text-muted-foreground max-w-sm">
                  This document hasn't been summarized yet. Generate a summary to see AI-powered insights.
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

