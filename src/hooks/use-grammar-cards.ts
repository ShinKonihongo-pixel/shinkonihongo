// Hook for grammar card CRUD operations with Firestore

import { useState, useCallback, useEffect } from 'react';
import type { GrammarCard, GrammarCardFormData, JLPTLevel } from '../types/flashcard';
import * as firestoreService from '../services/firestore';
import { handleError } from '../utils/error-handler';

export function useGrammarCards(levelFilter?: string) {
  const [grammarCards, setGrammarCards] = useState<GrammarCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Subscribe to real-time updates, filtered by level when provided
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    const unsubscribe = firestoreService.subscribeToGrammarCards((cards) => {
      setGrammarCards(cards);
      setLoading(false);
    }, levelFilter);

    return () => unsubscribe();
  }, [levelFilter]);

  // Add new grammar card
  const addGrammarCard = useCallback(async (data: GrammarCardFormData, createdBy?: string) => {
    try {
      const newCard = await firestoreService.addGrammarCard(data, createdBy);
      return newCard;
    } catch (err) {
      setError('Failed to add grammar card');
      handleError(err, { context: 'usegrammarUcards' });
      throw err;
    }
  }, []);

  // Update existing grammar card
  const updateGrammarCard = useCallback(async (id: string, data: Partial<GrammarCard>) => {
    try {
      await firestoreService.updateGrammarCard(id, data);
    } catch (err) {
      setError('Failed to update grammar card');
      handleError(err, { context: 'usegrammarUcards' });
      throw err;
    }
  }, []);

  // Delete grammar card
  const deleteGrammarCard = useCallback(async (id: string) => {
    try {
      await firestoreService.deleteGrammarCard(id);
    } catch (err) {
      setError('Failed to delete grammar card');
      handleError(err, { context: 'usegrammarUcards' });
      throw err;
    }
  }, []);

  // Get card by ID
  const getGrammarCard = useCallback((id: string) => {
    return grammarCards.find(card => card.id === id);
  }, [grammarCards]);

  // Filter by JLPT level
  const getGrammarCardsByLevel = useCallback((level: JLPTLevel | 'all') => {
    if (level === 'all') return grammarCards;
    return grammarCards.filter(card => card.jlptLevel === level);
  }, [grammarCards]);

  // Filter by lesson
  const getGrammarCardsByLesson = useCallback((lessonId: string) => {
    return grammarCards.filter(card => card.lessonId === lessonId);
  }, [grammarCards]);

  return {
    grammarCards,
    loading,
    error,
    addGrammarCard,
    updateGrammarCard,
    deleteGrammarCard,
    getGrammarCard,
    getGrammarCardsByLevel,
    getGrammarCardsByLesson,
  };
}
