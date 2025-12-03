import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Plus, Sparkles, FileText, Trash2, Edit2, Save, Loader2, AlertTriangle } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { apiClient, type Flashcard, type Document } from '../services/api';

export function FlashcardCreationView() {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingCard, setEditingCard] = useState<{ question: string; answer: string; category: string } | null>(null);
  const [newCard, setNewCard] = useState({ question: '', answer: '', category: 'General' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<number | null>(null);
  const [generating, setGenerating] = useState(false);
  const [numCards, setNumCards] = useState(10);
  const [deletingAll, setDeletingAll] = useState(false);

  const categories = ['General', 'Fundamentals', 'Concepts', 'Algorithms', 'Practice'];

  useEffect(() => {
    loadFlashcards();
    loadDocuments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory]);

  const loadFlashcards = async () => {
    try {
      setLoading(true);
      setError('');
      const params: any = {};
      if (selectedCategory !== 'all') {
        params.category = selectedCategory;
      }
      const data = await apiClient.getFlashcards(params);
      setFlashcards(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Error loading flashcards:', err);
      setError(err.message || 'Failed to load flashcards');
      setFlashcards([]);
    } finally {
      setLoading(false);
    }
  };

  const loadDocuments = async () => {
    try {
      const data = await apiClient.getDocuments();
      setDocuments(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Failed to load documents:', err);
      setDocuments([]);
    }
  };

  const handleAddCard = async () => {
    if (!newCard.question || !newCard.answer) return;

    try {
      setSaving(true);
      setError('');
      const created = await apiClient.createFlashcard({
        question: newCard.question,
        answer: newCard.answer,
        category: newCard.category,
      });
      setFlashcards([created, ...flashcards]);
      setNewCard({ question: '', answer: '', category: 'General' });
    } catch (err: any) {
      setError(err.message || 'Failed to create flashcard');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateCard = async () => {
    if (!editingId || !editingCard) return;

    try {
      setSaving(true);
      setError('');
      const updated = await apiClient.updateFlashcard(editingId, editingCard);
      setFlashcards(flashcards.map(card => card.id === editingId ? updated : card));
      setEditingId(null);
      setEditingCard(null);
    } catch (err: any) {
      setError(err.message || 'Failed to update flashcard');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCard = async (id: number) => {
    if (!confirm('Are you sure you want to delete this flashcard?')) return;

    try {
      await apiClient.deleteFlashcard(id);
      setFlashcards(flashcards.filter((card) => card.id !== id));
    } catch (err: any) {
      setError(err.message || 'Failed to delete flashcard');
    }
  };

  const handleStartEdit = (card: Flashcard) => {
    setEditingId(card.id);
    setEditingCard({
      question: card.question,
      answer: card.answer,
      category: card.category,
    });
  };

  const handleGenerateFromDocument = async () => {
    if (!selectedDocument) return;

    try {
      setGenerating(true);
      setError('');
      const generated = await apiClient.generateFlashcards(selectedDocument, numCards);
      setFlashcards([...generated, ...flashcards]);
      setShowGenerateDialog(false);
      setSelectedDocument(null);
    } catch (err: any) {
      setError(err.message || 'Failed to generate flashcards');
    } finally {
      setGenerating(false);
    }
  };

  const handleDeleteAll = async () => {
    if (!confirm(`Are you sure you want to delete ALL ${flashcards.length} flashcards? This action cannot be undone!`)) {
      return;
    }

    try {
      setDeletingAll(true);
      setError('');
      const result = await apiClient.deleteAllFlashcards();
      setFlashcards([]);
      alert(result.message);
    } catch (err: any) {
      setError(err.message || 'Failed to delete flashcards');
    } finally {
      setDeletingAll(false);
    }
  };

  const filteredFlashcards = selectedCategory === 'all'
    ? flashcards
    : flashcards.filter(card => card.category === selectedCategory);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>Flashcard Creation</h1>
          <p className="text-muted-foreground mt-1">
            Create and manage your study flashcards
          </p>
        </div>
        <Button
          className="gradient-blue-purple text-white border-0"
          onClick={() => setShowGenerateDialog(true)}
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Generate from Document
        </Button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="mb-4">Create New Flashcard</h3>
            <div className="space-y-4">
              <div>
                <label className="block mb-2">Category</label>
                <Select
                  value={newCard.category}
                  onValueChange={(value) => setNewCard({ ...newCard, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block mb-2">Question</label>
                <Textarea
                  placeholder="Enter your question..."
                  value={newCard.question}
                  onChange={(e) => setNewCard({ ...newCard, question: e.target.value })}
                  rows={3}
                  className="resize-none"
                />
              </div>
              <div>
                <label className="block mb-2">Answer</label>
                <Textarea
                  placeholder="Enter the answer..."
                  value={newCard.answer}
                  onChange={(e) => setNewCard({ ...newCard, answer: e.target.value })}
                  rows={4}
                  className="resize-none"
                />
              </div>
              <Button
                onClick={handleAddCard}
                className="w-full gradient-blue-purple text-white border-0"
                disabled={!newCard.question || !newCard.answer || saving}
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Flashcard
                  </>
                )}
              </Button>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-blue-50 to-purple-50 border-purple-200">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg gradient-blue-purple flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4>AI Generation</h4>
                <p className="text-muted-foreground mt-1">
                  Upload a document to automatically generate flashcards based on key concepts and important information.
                </p>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3>Your Flashcards ({filteredFlashcards.length})</h3>
            <div className="flex gap-2">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {flashcards.length > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDeleteAll}
                  disabled={deletingAll}
                >
                  {deletingAll ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete All
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-3">
            {filteredFlashcards.map((card, index) => (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="p-4 hover:shadow-md transition-shadow group">
                  <div className="flex items-start justify-between mb-3">
                    <Badge variant="secondary" className="bg-purple-50 text-purple-700">
                      {card.category}
                    </Badge>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleStartEdit(card)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => handleDeleteCard(card.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-muted-foreground mb-1">Question</p>
                      <p className="text-foreground">{card.question}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1">Answer</p>
                      <p className="text-foreground">{card.answer}</p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          {filteredFlashcards.length === 0 && (
            <Card className="p-12 flex flex-col items-center justify-center text-center border-dashed">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center mb-4">
                <FileText className="w-8 h-8 text-purple-600" />
              </div>
              <h4>No flashcards yet</h4>
              <p className="text-muted-foreground mt-2">
                Create your first flashcard to get started
              </p>
            </Card>
          )}
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editingId !== null} onOpenChange={(open) => !open && setEditingId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Flashcard</DialogTitle>
            <DialogDescription>
              Update the flashcard question and answer
            </DialogDescription>
          </DialogHeader>
          {editingCard && (
            <div className="space-y-4 mt-4">
              <div>
                <label className="block mb-2">Category</label>
                <Select
                  value={editingCard.category}
                  onValueChange={(value) => setEditingCard({ ...editingCard, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block mb-2">Question</label>
                <Textarea
                  value={editingCard.question}
                  onChange={(e) => setEditingCard({ ...editingCard, question: e.target.value })}
                  rows={3}
                  className="resize-none"
                />
              </div>
              <div>
                <label className="block mb-2">Answer</label>
                <Textarea
                  value={editingCard.answer}
                  onChange={(e) => setEditingCard({ ...editingCard, answer: e.target.value })}
                  rows={4}
                  className="resize-none"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setEditingId(null)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdateCard}
                  disabled={saving || !editingCard.question || !editingCard.answer}
                  className="gradient-blue-purple text-white border-0"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Generate Dialog */}
      <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate Flashcards from Document</DialogTitle>
            <DialogDescription>
              Select a document to generate flashcards automatically
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="block mb-2">Select Document</label>
              <Select
                value={selectedDocument?.toString() || ''}
                onValueChange={(value) => setSelectedDocument(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a document" />
                </SelectTrigger>
                <SelectContent>
                  {documents.map((doc) => (
                    <SelectItem key={doc.id} value={doc.id.toString()}>
                      {doc.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block mb-2">Number of Flashcards</label>
              <Input
                type="number"
                min="1"
                max="50"
                value={numCards}
                onChange={(e) => setNumCards(parseInt(e.target.value) || 10)}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowGenerateDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleGenerateFromDocument}
                disabled={!selectedDocument || generating}
                className="gradient-blue-purple text-white border-0"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
