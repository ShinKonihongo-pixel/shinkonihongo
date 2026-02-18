// Hook for vocabulary notebook CRUD with real-time Firestore sync

import { useState, useCallback, useEffect, useMemo } from 'react';
import type { VocabularyNotebook, Flashcard } from '../types/flashcard';
import * as firestoreService from '../services/firestore';

export function useVocabularyNotebooks(userId: string | undefined) {
  const [notebooks, setNotebooks] = useState<VocabularyNotebook[]>([]);
  const [loading, setLoading] = useState(true);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!userId) {
      setNotebooks([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsubscribe = firestoreService.subscribeToVocabularyNotebooks(userId, (data) => {
      setNotebooks(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [userId]);

  const createNotebook = useCallback(async (name: string, color: string, description?: string) => {
    if (!userId) return;
    await firestoreService.addVocabularyNotebook(userId, name, color, description);
  }, [userId]);

  const updateNotebook = useCallback(async (
    id: string,
    data: Partial<Pick<VocabularyNotebook, 'name' | 'description' | 'color'>>,
  ) => {
    await firestoreService.updateVocabularyNotebookDoc(id, data);
  }, []);

  const deleteNotebook = useCallback(async (id: string) => {
    await firestoreService.deleteVocabularyNotebookDoc(id);
  }, []);

  const addCardToNotebook = useCallback(async (notebookId: string, flashcardId: string) => {
    const nb = notebooks.find((n) => n.id === notebookId);
    if (!nb) return;
    await firestoreService.addFlashcardToNotebook(notebookId, flashcardId, nb.flashcardIds);
  }, [notebooks]);

  const removeCardFromNotebook = useCallback(async (notebookId: string, flashcardId: string) => {
    const nb = notebooks.find((n) => n.id === notebookId);
    if (!nb) return;
    await firestoreService.removeFlashcardFromNotebook(notebookId, flashcardId, nb.flashcardIds);
  }, [notebooks]);

  const getNotebookCards = useCallback((notebookId: string, allCards: Flashcard[]): Flashcard[] => {
    const nb = notebooks.find((n) => n.id === notebookId);
    if (!nb) return [];
    const idSet = new Set(nb.flashcardIds);
    return allCards.filter((c) => idSet.has(c.id));
  }, [notebooks]);

  const getNotebooksForCard = useCallback((flashcardId: string): VocabularyNotebook[] => {
    return notebooks.filter((nb) => nb.flashcardIds.includes(flashcardId));
  }, [notebooks]);

  const toggleCardInNotebook = useCallback(async (notebookId: string, flashcardId: string) => {
    const nb = notebooks.find((n) => n.id === notebookId);
    if (!nb) return;
    if (nb.flashcardIds.includes(flashcardId)) {
      await firestoreService.removeFlashcardFromNotebook(notebookId, flashcardId, nb.flashcardIds);
    } else {
      await firestoreService.addFlashcardToNotebook(notebookId, flashcardId, nb.flashcardIds);
    }
  }, [notebooks]);

  // Memoize notebook count to avoid unnecessary re-renders
  const notebookCount = useMemo(() => notebooks.length, [notebooks]);

  return {
    notebooks,
    loading,
    notebookCount,
    createNotebook,
    updateNotebook,
    deleteNotebook,
    addCardToNotebook,
    removeCardFromNotebook,
    getNotebookCards,
    getNotebooksForCard,
    toggleCardInNotebook,
  };
}
