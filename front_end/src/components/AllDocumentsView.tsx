import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { FileText, Loader2, X, Download } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { apiClient, type Document } from '../services/api';
import mammoth from 'mammoth';

export function AllDocumentsView() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [docxHtml, setDocxHtml] = useState<string>('');
  const [convertingDocx, setConvertingDocx] = useState(false);

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
    setDocxHtml('');
    
    // If it's a DOCX file, convert it to HTML
    const ext = getFileExtension(doc.file);
    if (ext === 'docx' || ext === 'doc') {
      await convertDocxToHtml(doc);
    }
  };

  const convertDocxToHtml = async (doc: Document) => {
    try {
      setConvertingDocx(true);
      setError('');
      
      // Fetch the DOCX file as arraybuffer
      const response = await fetch(doc.file);
      const arrayBuffer = await response.arrayBuffer();
      
      // Convert to HTML using mammoth
      const result = await mammoth.convertToHtml({ arrayBuffer });
      setDocxHtml(result.value);
      
      // Log any messages/warnings from mammoth
      if (result.messages.length > 0) {
        console.log('Mammoth conversion messages:', result.messages);
      }
    } catch (err: any) {
      console.error('Error converting DOCX:', err);
      setError('Failed to convert document for preview');
    } finally {
      setConvertingDocx(false);
    }
  };

  const handleDownload = (doc: Document) => {
    const link = document.createElement('a');
    link.href = doc.file;
    link.download = doc.title;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getFileExtension = (filename: string) => {
    return filename.split('.').pop()?.toLowerCase() || '';
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
        <DialogContent className="max-w-5xl h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between pr-8">
              <span className="truncate">{selectedDocument?.title}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => selectedDocument && handleDownload(selectedDocument)}
                className="ml-2"
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-auto">
            {selectedDocument && (() => {
              const ext = getFileExtension(selectedDocument.file);
              
              // Show loading state while converting DOCX
              if (convertingDocx) {
                return (
                  <div className="flex flex-col items-center justify-center h-full">
                    <Loader2 className="w-12 h-12 animate-spin text-purple-600 mb-4" />
                    <p className="text-muted-foreground">Converting document...</p>
                  </div>
                );
              }
              
              // Show PDF in iframe
              if (ext === 'pdf') {
                return (
                  <iframe
                    src={selectedDocument.file}
                    className="w-full h-full border rounded"
                    title={selectedDocument.title}
                  />
                );
              }
              
              // Show converted DOCX as HTML
              if ((ext === 'docx' || ext === 'doc') && docxHtml) {
                return (
                  <div 
                    className="p-8 prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: docxHtml }}
                  />
                );
              }
              
              // Fallback: preview not available
              return (
                <div className="flex flex-col items-center justify-center h-full text-center p-8">
                  <FileText className="w-16 h-16 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Preview not available</h3>
                  <p className="text-muted-foreground mb-4">
                    This file type cannot be previewed in the browser.
                  </p>
                  <Button onClick={() => selectedDocument && handleDownload(selectedDocument)}>
                    <Download className="w-4 h-4 mr-2" />
                    Download to view
                  </Button>
                </div>
              );
            })()}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

