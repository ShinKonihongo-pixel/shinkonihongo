# Vocabulary Flashcard Difficulty Management - Codebase Scout Report

**Date:** 2026-02-09  
**Topic:** Vocabulary flashcard difficulty storage, management, and user interactions

---

## Executive Summary

Vocabulary flashcard difficulty in this app is managed through a multi-layered system:
1. **Data Model:** `DifficultyLevel` type with 5 states (super_hard, hard, medium, easy, unset)
2. **Storage:** Each flashcard stores both current difficulty and original difficulty (for reset tracking)
3. **Management:** Difficulty can be set during card creation and reset via management tab UI
4. **Study Session:** Difficulty is changeable during practice/study using inline action buttons
5. **Reset Feature:** Full reset capability that reverts both difficulty and memorization status

---

## 1. Data Model for Flashcard Difficulty

### Type Definitions
**File:** `/Users/admin/Documents/名称未設定フォルダ/src/types/flashcard.ts`

```typescript
// Memorization and difficulty system
export type MemorizationStatus = 'memorized' | 'not_memorized' | 'unset';
export type DifficultyLevel = 'super_hard' | 'hard' | 'medium' | 'easy' | 'unset';

// Flashcard interface
export interface Flashcard {
  id: string;
  vocabulary: string;
  kanji: string;
  sinoVietnamese: string;
  meaning: string;
  english?: string;
  examples: string[];
  jlptLevel: JLPTLevel;
  lessonId: string;
  
  // Spaced Repetition (SM-2) fields
  easeFactor: number;
  interval: number;
  repetitions: number;
  nextReviewDate: string;
  createdAt: string;
  createdBy?: string;
  
  // Memorization tracking
  memorizationStatus: MemorizationStatus;
  difficultyLevel: DifficultyLevel;
  originalDifficultyLevel?: DifficultyLevel; // Difficulty at creation (for reset)
}

// Form data for creating/editing
export interface FlashcardFormData {
  vocabulary: string;
  kanji: string;
  sinoVietnamese: string;
  meaning: string;
  english?: string;
  examples: string[];
  jlptLevel: JLPTLevel;
  lessonId: string;
  difficultyLevel?: DifficultyLevel; // Optional - defaults to 'unset' if not provided
}
```

**Key Points:**
- `difficultyLevel` - current difficulty (can change during study)
- `originalDifficultyLevel` - difficulty at card creation (used for reset comparison)
- Both fields support 5 levels: super_hard, hard, medium, easy, unset
- `unset` is the default for new cards

---

## 2. Difficulty Storage & Creation

### Flashcard Service
**File:** `/Users/admin/Documents/名称未設定フォルダ/src/services/firestore/flashcard-service.ts`

```typescript
export async function addFlashcard(data: FlashcardFormData, createdBy?: string): Promise<Flashcard> {
  const defaultValues = getDefaultSM2Values();
  const initialDifficulty = data.difficultyLevel || defaultValues.difficultyLevel;
  
  const newCard: Omit<Flashcard, 'id'> = {
    ...data,
    ...defaultValues,
    difficultyLevel: initialDifficulty,
    originalDifficultyLevel: initialDifficulty, // Store original on creation
    createdAt: getTodayISO(),
    createdBy,
  };
  
  const docRef = await addDoc(collection(db, COLLECTIONS.FLASHCARDS), newCard);
  return { id: docRef.id, ...newCard } as Flashcard;
}

export async function updateFlashcard(id: string, data: Partial<Flashcard>): Promise<void> {
  const docRef = doc(db, COLLECTIONS.FLASHCARDS, id);
  await updateDoc(docRef, data);
}
```

**Initial Values:**
```typescript
// From spaced-repetition.ts
export function getDefaultSM2Values() {
  return {
    easeFactor: 2.5,
    interval: 0,
    repetitions: 0,
    nextReviewDate: getTodayISO(),
    memorizationStatus: 'unset',
    difficultyLevel: 'unset', // Default difficulty
  };
}
```

---

## 3. Difficulty Management Tab (Cards Page)

### Where Difficulty Can Be Set: Creation Form
**File:** `/Users/admin/Documents/名称未設定フォルダ/src/components/flashcard/flashcard-form.tsx`

```typescript
const DIFFICULTY_OPTIONS: { value: DifficultyLevel; label: string; color: string }[] = [
  { value: 'easy', label: 'Dễ', color: '#22c55e' },
  { value: 'medium', label: 'Trung bình', color: '#f59e0b' },
  { value: 'hard', label: 'Khó', color: '#ef4444' },
  { value: 'super_hard', label: 'Siêu khó', color: '#7c3aed' },
];

// Form state
const [formData, setFormData] = useState<FlashcardFormData>({
  // ... other fields
  difficultyLevel: 'medium', // Default in form
});

// Difficulty selector UI
<div className="form-group">
  <label>Độ khó</label>
  <div className="difficulty-selector">
    {DIFFICULTY_OPTIONS.map(opt => (
      <button
        type="button"
        className={`difficulty-btn ${formData.difficultyLevel === opt.value ? 'active' : ''}`}
        onClick={() => setFormData(prev => ({ ...prev, difficultyLevel: opt.value }))}
      >
        {opt.label}
      </button>
    ))}
  </div>
</div>
```

**Location:** Vocabulary Tab → Create Card Form  
**UI:** 4 color-coded difficulty buttons (Easy/Medium/Hard/Super Hard)

---

## 4. Reset Difficulty Feature

### Reset Modal Component
**File:** `/Users/admin/Documents/名称未設定フォルダ/src/components/ui/reset-card-modal.tsx`

```typescript
interface ResetCardModalProps {
  isOpen: boolean;
  card: Flashcard | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ResetCardModal({ isOpen, card, onConfirm, onCancel }: ResetCardModalProps) {
  // Check if card has changes worth resetting
  const hasChanges = card.memorizationStatus !== 'unset' ||
                     card.difficultyLevel !== (card.originalDifficultyLevel || 'unset');

  return (
    <div className="reset-modal">
      <h3>Reset thẻ về mặc định?</h3>
      
      {/* Card preview */}
      <div className="reset-card-preview">
        <div>{card.kanji || card.vocabulary}</div>
        <div>{card.vocabulary}</div>
        <div>{card.meaning}</div>
      </div>

      {/* Show what will be reset */}
      {hasChanges && (
        <ul className="reset-modal-changes">
          {card.memorizationStatus !== 'unset' && (
            <li>
              <span>Trạng thái:</span>
              <span>{card.memorizationStatus === 'memorized' ? 'Đã thuộc' : 'Chưa thuộc'}</span>
              <span>→</span>
              <span>Chưa đánh giá</span>
            </li>
          )}
          {card.difficultyLevel !== (card.originalDifficultyLevel || 'unset') && (
            <li>
              <span>Độ khó:</span>
              <span>{getDifficultyLabel(card.difficultyLevel)}</span>
              <span>→</span>
              <span>{getDifficultyLabel(card.originalDifficultyLevel || 'unset')}</span>
            </li>
          )}
        </ul>
      )}

      <button onClick={onConfirm} disabled={!hasChanges}>
        Reset thẻ
      </button>
    </div>
  );
}
```

**What Gets Reset:**
- `memorizationStatus` → 'unset'
- `difficultyLevel` → `originalDifficultyLevel` (reverts to creation difficulty)

### Flashcard List (Reset Button Location)
**File:** `/Users/admin/Documents/名称未設定フォルダ/src/components/flashcard/flashcard-list.tsx`

```typescript
// Check if card can be reset
const canResetCard = (card: Flashcard) => {
  return card.memorizationStatus !== 'unset' ||
         card.difficultyLevel !== (card.originalDifficultyLevel || 'unset');
};

// Render card item with reset button
const renderCardItem = (card: Flashcard) => {
  return (
    <div key={card.id} className="card-item">
      <div className="mini-card">
        {/* Card display */}
      </div>
      <div className="card-item-actions">
        {onReset && canResetCard(card) && (
          <button className="btn-icon btn-reset" onClick={() => setResetTarget(card)}>
            <RotateCcw size={16} /> {/* Reset icon */}
          </button>
        )}
        {/* Edit/Delete buttons */}
      </div>
    </div>
  );
};

// Reset confirmation modal
<ResetCardModal
  isOpen={resetTarget !== null}
  card={resetTarget}
  onConfirm={handleResetConfirm}
  onCancel={() => setResetTarget(null)}
/>
```

**UI Flow:**
1. User navigates to Vocabulary Tab → selects lesson
2. Cards displayed in grid or by-difficulty view
3. Reset button (↻ icon) appears if card has changes
4. Click → confirmation modal → confirm → resets to original

---

## 5. Study Session Difficulty Management

### Study Session Page
**File:** `/Users/admin/Documents/名称未設定フォルダ/src/components/pages/study-page.tsx`

```typescript
export function StudyPage({
  cards,
  getLessonsByLevel,
  getChildLessons,
  updateCard,
  // ... other props
}) {
  // Filter cards by difficulty
  const [filterDifficulty, setFilterDifficulty] = useState<DifficultyLevel | 'all'>('all');

  const {
    currentCard,
    // ... other hooks
    setDifficultyLevel, // Hook to update difficulty during study
  } = useStudySession({
    cards: filteredCards,
    updateCard,
    filterDifficulty, // Can filter by difficulty during study
  });

  return (
    <StudySession
      currentCard={currentCard}
      onSetDifficulty={setDifficultyLevel} // Pass setter to study session
      // ... other props
    />
  );
}
```

### Study Session Hook
**File:** `/Users/admin/Documents/名称未設定フォルダ/src/hooks/use-study-session.ts`

```typescript
// Set difficulty level for current card
const setDifficultyLevel = useCallback((level: DifficultyLevel) => {
  if (!currentCard) return;

  const update: Partial<Flashcard> = { difficultyLevel: level };
  
  // Save original difficulty on first study change
  // This allows reset to show what it was before study
  if (!currentCard.originalDifficultyLevel) {
    update.originalDifficultyLevel = currentCard.difficultyLevel;
  }
  
  updateCard(currentCard.id, update);
}, [currentCard, updateCard]);
```

### Action Buttons During Study
**File:** `/Users/admin/Documents/名称未設定フォルダ/src/components/study/session/action-buttons.tsx`

```typescript
interface ActionButtonsProps {
  currentCard: Flashcard;
  onSetMemorization: (status: MemorizationStatus) => void;
  onSetDifficulty: (level: DifficultyLevel) => void;
  settings: AppSettings;
  clickCount: number;
  isMobile: boolean;
}

export function ActionButtons({
  currentCard,
  onSetMemorization,
  onSetDifficulty,
  // ...
}) {
  const handleDifficultyClick = (level: DifficultyLevel) => {
    // Toggle: click same difficulty = unset
    if (currentCard.difficultyLevel === level) {
      onSetDifficulty('unset');
    } else {
      onSetDifficulty(level);
    }
  };

  return (
    <div className="action-buttons-inline">
      {/* Memorization buttons */}
      <span className="action-separator">|</span>
      
      {/* Difficulty buttons */}
      <div className="action-group">
        <span>Độ khó:</span>
        <button
          className={`diff-btn super-hard ${currentCard.difficultyLevel === 'super_hard' ? 'active' : ''}`}
          onClick={() => handleDifficultyClick('super_hard')}
        >
          💀
        </button>
        <button
          className={`diff-btn hard ${currentCard.difficultyLevel === 'hard' ? 'active' : ''}`}
          onClick={() => handleDifficultyClick('hard')}
        >
          Khó
        </button>
        <button
          className={`diff-btn medium ${currentCard.difficultyLevel === 'medium' ? 'active' : ''}`}
          onClick={() => handleDifficultyClick('medium')}
        >
          Vừa
        </button>
        <button
          className={`diff-btn easy ${currentCard.difficultyLevel === 'easy' ? 'active' : ''}`}
          onClick={() => handleDifficultyClick('easy')}
        >
          Dễ
        </button>
      </div>
    </div>
  );
}
```

**UI Flow During Study:**
1. User clicks on study card
2. Action buttons appear at bottom
3. Difficulty section shows 4 buttons: 💀 (super_hard), Khó (hard), Vừa (medium), Dễ (easy)
4. Click button to set difficulty (active state shows current)
5. Click same button again to unset (toggle behavior)
6. Changes immediately saved to card

---

## 6. Difficulty Display & Filtering

### Card List View Modes
**File:** `/Users/admin/Documents/名称未設定フォルダ/src/components/flashcard/flashcard-list.tsx`

```typescript
// Difficulty config with colors and labels
const DIFFICULTY_CONFIG: Record<DifficultyLevel, { label: string; color: string; bgColor: string }> = {
  super_hard: { label: '🔥 Siêu Khó', color: '#DC2626', bgColor: 'rgba(220, 38, 38, 0.08)' },
  hard: { label: '😰 Khó', color: '#EA580C', bgColor: 'rgba(234, 88, 12, 0.08)' },
  medium: { label: '🤔 Trung Bình', color: '#CA8A04', bgColor: 'rgba(202, 138, 4, 0.08)' },
  easy: { label: '😊 Dễ', color: '#16A34A', bgColor: 'rgba(22, 163, 74, 0.08)' },
  unset: { label: '❓ Chưa đánh giá', color: '#6B7280', bgColor: 'rgba(107, 114, 128, 0.08)' },
};

// Two view modes:
// 1. Grid view - shows all cards in grid with colored borders
// 2. By-difficulty view - groups cards by difficulty level with colored sections

{viewMode === 'by-difficulty' ? (
  <div className="cards-by-difficulty">
    {DIFFICULTY_ORDER.map(level => {
      const levelCards = cardsByDifficulty[level];
      if (levelCards.length === 0) return null;
      
      const config = DIFFICULTY_CONFIG[level];
      return (
        <div key={level} className="difficulty-section" style={{ backgroundColor: config.bgColor }}>
          <div className="difficulty-section-header">
            <span className="difficulty-label">{config.label}</span>
            <span className="difficulty-count">{levelCards.length} thẻ</span>
          </div>
          <div className="cards-grid">
            {levelCards.map(card => renderCardItem(card, true))}
          </div>
        </div>
      );
    })}
  </div>
) : null}
```

**Display Features:**
- Grid view: colored borders on each card
- By-difficulty view: cards grouped in colored sections
- Each level has emoji, Vietnamese label, and color coding
- Count shown per difficulty level

---

## 7. Difficulty Flow Diagram

```
┌─ New Card Creation ─┐
│                     │
│ Set Difficulty:     │
│ • easy (🎯)         │ → originalDifficultyLevel = user choice
│ • medium (default)  │ → difficultyLevel = user choice
│ • hard              │
│ • super_hard        │
│ • unset (none)      │
│                     │
└────────────┬────────┘
             │
    ┌────────▼─────────┐
    │                  │
    │  Management Tab  │ ◄─── Reset Button
    │  (Vocabulary)    │      (if difficultyLevel ≠ originalDifficultyLevel)
    │                  │
    │ View modes:      │
    │ • Grid           │
    │ • By-Difficulty  │
    │                  │
    └────────┬─────────┘
             │
    ┌────────▼──────────┐
    │                   │
    │  Study Session    │ ◄─── Change Difficulty on the fly
    │  (Practice)       │      (Action buttons below card)
    │                   │
    │ Can:              │
    │ • Change          │ → difficultyLevel updated
    │ • Filter by level │ → originalDifficultyLevel preserved
    │                   │
    └────────┬──────────┘
             │
    ┌────────▼───────────┐
    │                    │
    │  Reset (Optional)  │
    │  Management Tab    │
    │                    │
    │ Reset action:      │
    │ difficultyLevel →  │
    │ originalDifficulty │
    │                    │
    └────────────────────┘
```

---

## 8. Key Component Files

| File | Purpose | Difficulty Relevance |
|------|---------|----------------------|
| `/src/types/flashcard.ts` | Type definitions | Defines DifficultyLevel, MemorizationStatus |
| `/src/services/firestore/flashcard-service.ts` | Firestore CRUD | Stores/updates difficulty in DB |
| `/src/components/flashcard/flashcard-form.tsx` | Card creation form | Set initial difficulty (4 buttons) |
| `/src/components/flashcard/flashcard-list.tsx` | Card list display | Grid/by-difficulty view, reset button |
| `/src/components/ui/reset-card-modal.tsx` | Reset confirmation | Shows changes, confirms reset |
| `/src/components/study/session/action-buttons.tsx` | Study UI | Difficulty buttons (4 + toggle) |
| `/src/hooks/use-study-session.ts` | Study state logic | setDifficultyLevel hook |
| `/src/components/pages/study-page.tsx` | Study page controller | Difficulty filtering, session management |

---

## 9. Data Update Flow

### Creation Path
```
User creates card with difficulty
    ↓
FlashcardForm sets difficultyLevel
    ↓
onSubmit → onAddCard()
    ↓
flashcard-service.addFlashcard()
    ↓
Sets:
  - difficultyLevel: user choice (or 'medium' default)
  - originalDifficultyLevel: user choice (or 'medium' default)
    ↓
Firestore stores both values
```

### Study Path
```
Study session loads cards
    ↓
User clicks difficulty button
    ↓
action-buttons.handleDifficultyClick()
    ↓
onSetDifficulty() called
    ↓
use-study-session.setDifficultyLevel()
    ↓
updateCard(currentCard.id, { difficultyLevel: level })
    ↓
flashcard-service.updateFlashcard()
    ↓
Firestore updates (preserves originalDifficultyLevel)
```

### Reset Path
```
Management tab: card with changes
    ↓
User clicks reset button (↻)
    ↓
ResetCardModal shown
    ↓
User confirms
    ↓
onResetCard() called
    ↓
updateCard(card.id, {
  difficultyLevel: card.originalDifficultyLevel,
  memorizationStatus: 'unset'
})
    ↓
Firestore updates both fields
```

---

## 10. Summary: Difficulty Management Points

1. **Storage:** Two separate fields track original vs current difficulty
2. **Creation:** Set via 4-button selector (easy/medium/hard/super_hard) + unset option
3. **Management:** 
   - View in grid or by-difficulty grouping
   - Reset button (↻) appears if changed from original
4. **Study:**
   - 4 difficulty buttons appear below card
   - Toggle behavior: click same button = unset
   - Changes immediately persist
5. **Reset:**
   - Reverts difficultyLevel to originalDifficultyLevel
   - Also resets memorizationStatus to 'unset'
   - Shows preview of changes in modal

---

## Unresolved Questions

None identified. Difficulty system is fully implemented and documented.

