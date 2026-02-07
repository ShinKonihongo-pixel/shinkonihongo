// Hook for flashcard CRUD operations with Firestore

import { useState, useCallback, useEffect } from 'react';
import type { Flashcard, FlashcardFormData, JLPTLevel } from '../types/flashcard';
import * as firestoreService from '../services/firestore';
import { extractKanjiCharacters, generateKanjiCharacterAnalysis } from '../services/kanji-analysis-ai-service';

export function useFlashcards() {
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Subscribe to real-time updates
  useEffect(() => {
    setLoading(true);
    const unsubscribe = firestoreService.subscribeToFlashcards((flashcards) => {
      setCards(flashcards);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Add new flashcard
  const addCard = useCallback(async (data: FlashcardFormData, createdBy?: string) => {
    try {
      const newCard = await firestoreService.addFlashcard(data, createdBy);

      // Background: generate Kanji analysis for new characters (fire-and-forget)
      const kanjiText = data.kanji || data.vocabulary;
      const chars = extractKanjiCharacters(kanjiText);
      if (chars.length > 0) {
        (async () => {
          try {
            const existing = await firestoreService.getMultipleKanjiAnalysis(chars);
            const existingChars = new Set(existing.map((a) => a.character));
            const missing = chars.filter((c) => !existingChars.has(c));
            if (missing.length > 0) {
              const generated = await generateKanjiCharacterAnalysis(missing);
              await firestoreService.saveMultipleKanjiAnalysis(generated);
            }
          } catch (err) {
            console.error('Background kanji analysis error:', err);
          }
        })();
      }

      return newCard;
    } catch (err) {
      setError('Failed to add flashcard');
      console.error('Error adding flashcard:', err);
      throw err;
    }
  }, []);

  // Update existing flashcard
  const updateCard = useCallback(async (id: string, data: Partial<Flashcard>) => {
    try {
      await firestoreService.updateFlashcard(id, data);
    } catch (err) {
      setError('Failed to update flashcard');
      console.error('Error updating flashcard:', err);
      throw err;
    }
  }, []);

  // Delete flashcard
  const deleteCard = useCallback(async (id: string) => {
    try {
      await firestoreService.deleteFlashcard(id);
    } catch (err) {
      setError('Failed to delete flashcard');
      console.error('Error deleting flashcard:', err);
      throw err;
    }
  }, []);

  // Get card by ID
  const getCard = useCallback((id: string) => {
    return cards.find(card => card.id === id);
  }, [cards]);

  // Filter by JLPT level
  const getCardsByLevel = useCallback((level: JLPTLevel | 'all') => {
    if (level === 'all') return cards;
    return cards.filter(card => card.jlptLevel === level);
  }, [cards]);

  // Get stats by level
  const getStatsByLevel = useCallback(() => {
    const stats: Record<JLPTLevel, number> = { BT: 0, N5: 0, N4: 0, N3: 0, N2: 0, N1: 0 };
    cards.forEach(card => {
      stats[card.jlptLevel]++;
    });
    return stats;
  }, [cards]);

  return {
    cards,
    loading,
    error,
    addCard,
    updateCard,
    deleteCard,
    getCard,
    getCardsByLevel,
    getStatsByLevel,
  };
}
