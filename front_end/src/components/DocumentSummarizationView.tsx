import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Upload, FileText, Sparkles, Copy, Check, Download, Loader2 } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { apiClient, type Document, type Summary } from '../services/api';

export function DocumentSummarizationView() {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [document, setDocument] = useState<Document | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    // Validate file type
    const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword', 'text/plain'];
    if (!validTypes.includes(file.type) && !file.name.endsWith('.pdf') && !file.name.endsWith('.docx') && !file.name.endsWith('.doc') && !file.name.endsWith('.txt')) {
      setError('Invalid file type. Please upload PDF, DOCX, or TXT files.');
      return;
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size exceeds 10MB limit.');
      return;
    }

    setError('');
    setIsUploading(true);
    setSummary(null);

    try {
      const title = file.name.replace(/\.[^/.]+$/, '');
      const uploadedDoc = await apiClient.uploadDocument(file, title);
      setDocument(uploadedDoc);
      
      // Automatically generate summary
      setIsProcessing(true);
      const generatedSummary = await apiClient.generateSummary(uploadedDoc.id);
      setSummary(generatedSummary);
      setIsProcessing(false);
    } catch (err: any) {
      setError(err.message || 'Failed to upload document. Please try again.');
      setIsProcessing(false);
    } finally {
      setIsUploading(false);
    }
  };

  const handleGenerateSummary = async () => {
    if (!document) return;

    setIsProcessing(true);
    setError('');

    try {
      const generatedSummary = await apiClient.generateSummary(document.id);
      setSummary(generatedSummary);
    } catch (err: any) {
      setError(err.message || 'Failed to generate summary. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopy = () => {
    if (summary) {
      navigator.clipboard.writeText(summary.full_summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      <div>
        <h1>Document Summarization</h1>
        <p className="text-muted-foreground mt-1">
          Upload documents and get AI-powered summaries
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="mb-4">Upload Document</h3>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.doc,.txt"
              onChange={handleFileSelect}
              className="hidden"
            />
            <motion.div
              className={`border-2 border-dashed rounded-xl p-8 transition-colors cursor-pointer ${
                isDragging
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-border hover:border-purple-300 hover:bg-purple-50/50'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-lg gradient-blue-purple flex items-center justify-center mb-4">
                  <Upload className="w-6 h-6 text-white" />
                </div>
                <h4>Drop your document here</h4>
                <p className="text-muted-foreground mt-2">
                  or click to browse files
                </p>
                <p className="text-muted-foreground mt-4">
                  Supports PDF, DOCX, TXT up to 10MB
                </p>
              </div>
            </motion.div>
          </Card>

          <AnimatePresence>
            {(isUploading || isProcessing) && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <Card className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                      <Loader2 className="w-5 h-5 text-purple-600 animate-spin" />
                    </div>
                    <div>
                      <h4>{isUploading ? 'Uploading document...' : 'Processing document...'}</h4>
                      <p className="text-muted-foreground mt-1">
                        {isUploading ? 'Please wait' : 'Analyzing content with AI'}
                      </p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {document && !isProcessing && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="p-6">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <h4>{document.title}</h4>
                    <p className="text-muted-foreground mt-1">
                      {document.pages ? `${document.pages} pages` : ''} • {formatFileSize(document.file_size)}
                    </p>
                  </div>
                  <Badge className="gradient-blue-purple text-white border-0">
                    <Sparkles className="w-3 h-3 mr-1" />
                    {summary ? 'Processed' : 'Uploaded'}
                  </Badge>
                </div>
                {!summary && (
                  <Button
                    onClick={handleGenerateSummary}
                    className="w-full gradient-blue-purple text-white border-0"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Summary
                  </Button>
                )}
              </Card>
            </motion.div>
          )}
        </div>

        <div className="space-y-6">
          <AnimatePresence>
            {summary && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3>Summary</h3>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCopy}
                      >
                        {copied ? (
                          <Check className="w-4 h-4 mr-2" />
                        ) : (
                          <Copy className="w-4 h-4 mr-2" />
                        )}
                        {copied ? 'Copied' : 'Copy'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const blob = new Blob([summary.full_summary], { type: 'text/plain' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `${document?.title || 'summary'}.txt`;
                          a.click();
                          URL.revokeObjectURL(url);
                        }}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Export
                      </Button>
                    </div>
                  </div>

                  <Tabs defaultValue="summary" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="summary">Full Summary</TabsTrigger>
                      <TabsTrigger value="keypoints">Key Points</TabsTrigger>
                    </TabsList>
                    <TabsContent value="summary" className="mt-4">
                      <div className="prose prose-sm max-w-none">
                        <p className="text-foreground whitespace-pre-line">
                          {summary.full_summary}
                        </p>
                      </div>
                    </TabsContent>
                    <TabsContent value="keypoints" className="mt-4">
                      <div className="space-y-3">
                        {summary.key_points.map((point, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="flex items-start gap-3 p-3 rounded-lg bg-accent hover:bg-accent/80 transition-colors"
                          >
                            <div className="w-6 h-6 rounded-full gradient-blue-purple flex items-center justify-center flex-shrink-0 text-white">
                              {index + 1}
                            </div>
                            <p className="text-foreground flex-1">{point}</p>
                          </motion.div>
                        ))}
                      </div>
                    </TabsContent>
                  </Tabs>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {!summary && !isProcessing && !isUploading && (
            <Card className="p-12 flex flex-col items-center justify-center text-center border-dashed">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center mb-4">
                <Sparkles className="w-8 h-8 text-purple-600" />
              </div>
              <h3>AI-Powered Summaries</h3>
              <p className="text-muted-foreground mt-2 max-w-sm">
                Upload a document to get started. Our AI will analyze and generate comprehensive summaries in seconds.
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
