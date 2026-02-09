// Hook for grammar card CRUD operations with Firestore

import { useState, useCallback, useEffect } from 'react';
import type { GrammarCard, GrammarCardFormData, JLPTLevel } from '../types/flashcard';
import * as firestoreService from '../services/firestore';

export function useGrammarCards() {
  const [grammarCards, setGrammarCards] = useState<GrammarCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Subscribe to real-time updates
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    const unsubscribe = firestoreService.subscribeToGrammarCards((cards) => {
      setGrammarCards(cards);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Add new grammar card
  const addGrammarCard = useCallback(async (data: GrammarCardFormData, createdBy?: string) => {
    try {
      const newCard = await firestoreService.addGrammarCard(data, createdBy);
      return newCard;
    } catch (err) {
      setError('Failed to add grammar card');
      console.error('Error adding grammar card:', err);
      throw err;
    }
  }, []);

  // Update existing grammar card
  const updateGrammarCard = useCallback(async (id: string, data: Partial<GrammarCard>) => {
    try {
      await firestoreService.updateGrammarCard(id, data);
    } catch (err) {
      setError('Failed to update grammar card');
      console.error('Error updating grammar card:', err);
      throw err;
    }
  }, []);

  // Delete grammar card
  const deleteGrammarCard = useCallback(async (id: string) => {
    try {
      await firestoreService.deleteGrammarCard(id);
    } catch (err) {
      setError('Failed to delete grammar card');
      console.error('Error deleting grammar card:', err);
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
