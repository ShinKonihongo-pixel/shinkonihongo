// Hook for kanji card CRUD operations with Firestore

import { useState, useCallback, useEffect } from 'react';
import type { KanjiCard, KanjiCardFormData } from '../types/kanji';
import type { JLPTLevel } from '../types/flashcard';
import * as firestoreService from '../services/firestore';
import { getKanjiSeedForLevel, getKanjiSeedCount } from '../data/kanji-seed';

export function useKanjiCards(levelFilter?: string) {
  const [kanjiCards, setKanjiCards] = useState<KanjiCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Subscribe to real-time updates, filtered by level when provided
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    const unsubscribe = firestoreService.subscribeToKanjiCards((cards) => {
      setKanjiCards(cards);
      setLoading(false);
    }, levelFilter);
    return () => unsubscribe();
  }, [levelFilter]);

  const addKanjiCard = useCallback(async (data: KanjiCardFormData, createdBy?: string) => {
    try {
      return await firestoreService.addKanjiCard(data, createdBy);
    } catch (err) {
      setError('Failed to add kanji card');
      console.error('Error adding kanji card:', err);
      throw err;
    }
  }, []);

  const updateKanjiCard = useCallback(async (id: string, data: Partial<KanjiCard>) => {
    try {
      await firestoreService.updateKanjiCard(id, data);
    } catch (err) {
      setError('Failed to update kanji card');
      console.error('Error updating kanji card:', err);
      throw err;
    }
  }, []);

  const deleteKanjiCard = useCallback(async (id: string) => {
    try {
      await firestoreService.deleteKanjiCard(id);
    } catch (err) {
      setError('Failed to delete kanji card');
      console.error('Error deleting kanji card:', err);
      throw err;
    }
  }, []);

  const getKanjiCardsByLevel = useCallback((level: JLPTLevel | 'all') => {
    if (level === 'all') return kanjiCards;
    return kanjiCards.filter(card => card.jlptLevel === level);
  }, [kanjiCards]);

  const getKanjiCardsByLesson = useCallback((lessonId: string) => {
    return kanjiCards.filter(card => card.lessonId === lessonId);
  }, [kanjiCards]);

  // Seed kanji cards for a level using built-in seed data
  const seedKanjiCards = useCallback(async (
    level: JLPTLevel,
    lessonIds: string[],
    createdBy: string,
  ): Promise<number> => {
    const existingChars = new Set(
      kanjiCards.filter(c => c.jlptLevel === level).map(c => c.character)
    );
    const seedData = getKanjiSeedForLevel(level, lessonIds);
    let count = 0;
    for (const data of seedData) {
      if (existingChars.has(data.character)) continue;
      await firestoreService.addKanjiCard(data, createdBy);
      count++;
    }
    return count;
  }, [kanjiCards]);

  // Update existing kanji cards with mnemonic + sampleWords from seed data
  const refreshKanjiFromSeed = useCallback(async (
    level: JLPTLevel,
    lessonIds: string[],
  ): Promise<number> => {
    const existingCards = kanjiCards.filter(c => c.jlptLevel === level);
    const seedData = getKanjiSeedForLevel(level, lessonIds);
    // Build lookup: character → seed data
    const seedMap = new Map(seedData.map(s => [s.character, s]));
    let count = 0;
    for (const card of existingCards) {
      const seed = seedMap.get(card.character);
      if (!seed) continue;
      // Only update if card is missing mnemonic or sampleWords
      const needsMnemonic = !card.mnemonic && seed.mnemonic;
      const needsWords = (!card.sampleWords || card.sampleWords.length === 0) && seed.sampleWords.length > 0;
      if (!needsMnemonic && !needsWords) continue;
      const updates: Partial<KanjiCard> = {};
      if (needsMnemonic) updates.mnemonic = seed.mnemonic;
      if (needsWords) updates.sampleWords = seed.sampleWords;
      await firestoreService.updateKanjiCard(card.id, updates);
      count++;
    }
    return count;
  }, [kanjiCards]);

  return {
    kanjiCards,
    loading,
    error,
    addKanjiCard,
    updateKanjiCard,
    deleteKanjiCard,
    getKanjiCardsByLevel,
    getKanjiCardsByLesson,
    seedKanjiCards,
    refreshKanjiFromSeed,
    getKanjiSeedCount,
  };
}
