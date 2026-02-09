// One-time migration: Move all N5 cards to N5 → Bài 1 → Kanji
// Note: This handles legacy data that may have subCategoryId field

import type { Category, Flashcard } from '../types/flashcard';

// Legacy flashcard type that may have subCategoryId
interface LegacyFlashcard extends Flashcard {
  subCategoryId?: string;
  categoryId?: string;
}
import { generateId } from './storage';

const MIGRATION_KEY = 'migration-n5-bai1-kanji-done';
const CATEGORIES_KEY = 'flashcard-categories';
const FLASHCARDS_KEY = 'japanese-flashcards';

export function migrateN5ToKanji(): void {
  // Check if migration already done
  if (localStorage.getItem(MIGRATION_KEY)) {
    return;
  }

  // Get current data
  const categoriesJson = localStorage.getItem(CATEGORIES_KEY);
  const flashcardsJson = localStorage.getItem(FLASHCARDS_KEY);

  const categories: Category[] = categoriesJson ? JSON.parse(categoriesJson) : [];
  const flashcards: LegacyFlashcard[] = flashcardsJson ? JSON.parse(flashcardsJson) : [];

  // Check if there are any N5 cards to migrate (legacy cards without subCategoryId)
  const n5Cards = flashcards.filter(c => c.jlptLevel === 'N5' && !c.subCategoryId);
  if (n5Cards.length === 0) {
    localStorage.setItem(MIGRATION_KEY, 'true');
    return;
  }

  // Step 1: Create or find "Bài 1" category under N5
  let bai1Category = categories.find(
    c => c.jlptLevel === 'N5' && c.parentId === null && c.name === 'Bài 1'
  );

  if (!bai1Category) {
    bai1Category = {
      id: generateId(),
      name: 'Bài 1',
      jlptLevel: 'N5',
      parentId: null,
      order: 1,
      isLocked: false,
      isHidden: false,
    };
    categories.push(bai1Category);
  }

  // Step 2: Create or find "Kanji" subcategory under "Bài 1"
  let kanjiSubCategory = categories.find(
    c => c.parentId === bai1Category!.id && c.name === 'Kanji'
  );

  if (!kanjiSubCategory) {
    kanjiSubCategory = {
      id: generateId(),
      name: 'Kanji',
      jlptLevel: 'N5',
      parentId: bai1Category.id,
      order: 1,
      isLocked: false,
      isHidden: false,
    };
    categories.push(kanjiSubCategory);
  }

  // Save categories
  localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));

  // Step 3: Update all N5 cards to use Bài 1 → Kanji
  const updatedFlashcards = flashcards.map(card => {
    if (card.jlptLevel === 'N5' && !card.subCategoryId) {
      return {
        ...card,
        categoryId: bai1Category!.id,
        subCategoryId: kanjiSubCategory!.id,
      };
    }
    return card;
  });

  localStorage.setItem(FLASHCARDS_KEY, JSON.stringify(updatedFlashcards));
  localStorage.setItem(MIGRATION_KEY, 'true');

  console.log(`Migration complete: ${n5Cards.length} N5 cards moved to N5 → Bài 1 → Kanji`);
}
