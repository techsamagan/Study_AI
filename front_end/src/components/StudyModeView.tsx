import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, RotateCw, Check, X, Trophy, Target, Loader2 } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { apiClient, type Flashcard as FlashcardType } from '../services/api';

export function StudyModeView() {
  const [flashcards, setFlashcards] = useState<FlashcardType[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [masteredCards, setMasteredCards] = useState<number[]>([]);
  const [needsPracticeCards, setNeedsPracticeCards] = useState<number[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    loadFlashcards();
  }, []);

  const loadFlashcards = async () => {
    try {
      setLoading(true);
      setError('');
      const cards = await apiClient.getFlashcards();
      if (!cards || cards.length === 0) {
        setFlashcards([]);
        setIsComplete(false);
        setCurrentIndex(0);
        return;
      }
      setFlashcards(cards);
      setCurrentIndex(0);
      setIsFlipped(false);
      setMasteredCards([]);
      setNeedsPracticeCards([]);
      setIsComplete(false);
    } catch (err: any) {
      setError(err.message || 'Failed to load flashcards for study mode');
    } finally {
      setLoading(false);
    }
  };

  const currentCard = flashcards[currentIndex];
  const totalCards = flashcards.length;
  const progress = totalCards > 0 ? ((currentIndex + 1) / totalCards) * 100 : 0;

  const handleNext = () => {
    if (currentIndex < totalCards - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
    } else {
      setIsComplete(true);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsFlipped(false);
    }
  };

  const handleMastered = () => {
    if (!currentCard) return;

    if (!masteredCards.includes(currentCard.id)) {
      setMasteredCards([...masteredCards, currentCard.id]);
    }

    apiClient.reviewFlashcard(currentCard.id, 100).catch(() => {
      // Ignore review errors for now
    });

    handleNext();
  };

  const handleNeedsPractice = () => {
    if (!currentCard) return;

    if (!needsPracticeCards.includes(currentCard.id)) {
      setNeedsPracticeCards([...needsPracticeCards, currentCard.id]);
    }

    apiClient.reviewFlashcard(currentCard.id, Math.max(currentCard.mastery_level - 10, 0)).catch(() => {
      // Ignore review errors for now
    });

    handleNext();
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setMasteredCards([]);
    setNeedsPracticeCards([]);
    setIsComplete(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (!loading && (!flashcards || flashcards.length === 0)) {
    return (
      <div className="space-y-6">
        <Card className="p-8 text-center">
          <h2 className="mb-3">No flashcards available yet</h2>
          <p className="text-muted-foreground mb-6">
            Create flashcards or generate them from a document to start a study session.
          </p>
          <Button onClick={loadFlashcards} className="gradient-blue-purple text-white border-0">
            Refresh
          </Button>
        </Card>
      </div>
    );
  }

  if (!currentCard) {
    return null;
  }

  if (isComplete) {
    const masteryPercentage = totalCards > 0 ? Math.round((masteredCards.length / totalCards) * 100) : 0;

    return (
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-2xl mx-auto"
        >
          <Card className="p-12 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="w-24 h-24 rounded-full gradient-blue-purple flex items-center justify-center mx-auto mb-6"
            >
              <Trophy className="w-12 h-12 text-white" />
            </motion.div>
            <h1 className="mb-4">Study Session Complete!</h1>
            <p className="text-muted-foreground mb-8">
              Great job! You've completed this study session.
            </p>

            <div className="grid grid-cols-2 gap-4 mb-8">
              <Card className="p-6 bg-green-50 border-green-200">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Check className="w-5 h-5 text-green-600" />
                  <h3 className="text-green-900">Mastered</h3>
                </div>
                <p className="text-green-700">{masteredCards.length} cards</p>
              </Card>
              <Card className="p-6 bg-orange-50 border-orange-200">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Target className="w-5 h-5 text-orange-600" />
                  <h4 className="text-orange-900">Needs Practice</h4>
                </div>
                <p className="text-orange-700">{needsPracticeCards.length} cards</p>
              </Card>
            </div>

            <div className="mb-8">
              <div className="flex items-center justify-between mb-2">
                <span className="text-muted-foreground">Mastery Rate</span>
                <span className="gradient-text">{masteryPercentage}%</span>
              </div>
              <Progress value={masteryPercentage} className="h-3" />
            </div>

            <div className="flex gap-3 justify-center">
              <Button onClick={handleRestart} className="gradient-blue-purple text-white border-0">
                <RotateCw className="w-4 h-4 mr-2" />
                Study Again
              </Button>
              <Button variant="outline">Review Mistakes</Button>
            </div>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>Study Mode</h1>
          <p className="text-muted-foreground mt-1">
            Card {currentIndex + 1} of {totalCards}
          </p>
        </div>
        <Button variant="outline" onClick={handleRestart}>
          <RotateCw className="w-4 h-4 mr-2" />
          Restart
        </Button>
      </div>

      <div className="mb-4">
        <Progress value={progress} className="h-2" />
      </div>

      <div className="max-w-3xl mx-auto">
        <div className="perspective-1000">
          <motion.div
            className="relative h-[400px]"
            onClick={() => setIsFlipped(!isFlipped)}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={isFlipped ? 'answer' : 'question'}
                initial={{ rotateY: 90, opacity: 0 }}
                animate={{ rotateY: 0, opacity: 1 }}
                exit={{ rotateY: -90, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0"
              >
                <Card className="h-full p-12 flex flex-col justify-center items-center cursor-pointer hover:shadow-lg transition-shadow">
                  <Badge variant="secondary" className="mb-6 bg-purple-50 text-purple-700">
                    {currentCard.category}
                  </Badge>
                  <div className="text-center">
                    {!isFlipped ? (
                      <>
                        <p className="text-muted-foreground mb-4">Question</p>
                        <h2 className="mb-6">{currentCard.question}</h2>
                        <p className="text-muted-foreground">Click to reveal answer</p>
                      </>
                    ) : (
                      <>
                        <p className="text-muted-foreground mb-4">Answer</p>
                        <p className="text-foreground">{currentCard.answer}</p>
                      </>
                    )}
                  </div>
                </Card>
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </div>

        <div className="flex items-center justify-between mt-8">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentIndex === 0}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>

          {isFlipped && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-3"
            >
              <Button
                variant="outline"
                onClick={handleNeedsPractice}
                className="border-orange-300 text-orange-700 hover:bg-orange-50"
              >
                <X className="w-4 h-4 mr-2" />
                Needs Practice
              </Button>
              <Button
                onClick={handleMastered}
                className="bg-green-600 text-white hover:bg-green-700"
              >
                <Check className="w-4 h-4 mr-2" />
                Mastered
              </Button>
            </motion.div>
          )}

          <Button
            variant="outline"
            onClick={handleNext}
          >
            Next
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>

        <div className="flex items-center justify-center gap-2 mt-6">
          {flashcards.map((_, index) => (
            <motion.div
              key={index}
              className={`h-2 rounded-full transition-all ${
                index === currentIndex
                  ? 'w-8 gradient-blue-purple'
                  : index < currentIndex
                  ? 'w-2 bg-purple-300'
                  : 'w-2 bg-gray-200'
              }`}
              whileHover={{ scale: 1.2 }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
