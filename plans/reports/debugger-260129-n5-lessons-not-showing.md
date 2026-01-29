# Debug Report: N5 Lessons Not Appearing in Lesson Selection

**Date:** 2026-01-29
**Issue:** N5 shows "5 templates available" but lesson list empty when selecting
**Severity:** High - Blocks user study flow

---

## Executive Summary

User reports N5 shows 5 available templates at level selection, but no lessons appear in lesson selection view. Root cause identified: mismatch between flashcard data structure and lesson structure, or empty lesson collection in Firestore.

**Recommended Solution Priority:**
1. Verify Firestore lessons collection populated for N5
2. Check flashcards have valid lessonId references
3. Audit filtered lesson logic (VIP/locked filtering)

---

## Technical Analysis

### Data Flow Architecture

```
1. Level Selection Screen
   ├─ Counts flashcards by jlptLevel
   └─ Shows "X templates available" (X = flashcard count)

2. Lesson Selection Screen
   ├─ Calls getLessonsByLevel(level)
   ├─ Filters lessons by parentId === null (root lessons only)
   ├─ For each lesson:
   │  ├─ Gets child lessons via getChildLessons(parentId)
   │  ├─ Creates lessonIds array [parentId, ...childIds]
   │  └─ Counts flashcards where lessonId IN lessonIds
   └─ Displays lessons with card counts
```

### Issue Locations

#### 1. Level Lesson Selector Component
**File:** `/src/components/study/level-lesson-selector.tsx`

**Lines 51-57:** Gets parent lessons only
```typescript
const levelLessons = useMemo(() => {
  if (!selectedLevel) return [];
  const allLessons = getLessonsByLevel(selectedLevel);
  // Only show parent lessons (no parentId or parentId is null)
  return allLessons.filter(l => !l.parentId);
}, [selectedLevel, getLessonsByLevel]);
```

**Lines 60-72:** Counts cards per lesson
```typescript
const cardsPerLesson = useMemo(() => {
  const counts: Record<string, number> = {};
  levelLessons.forEach(lesson => {
    const childLessons = getChildLessons(lesson.id);
    const lessonIds = [lesson.id, ...childLessons.map(l => l.id)];
    if (type === 'vocabulary') {
      counts[lesson.id] = (cards as Flashcard[]).filter(c => lessonIds.includes(c.lessonId)).length;
    } else {
      counts[lesson.id] = (cards as GrammarCard[]).filter(c => lessonIds.includes(c.lessonId)).length;
    }
  });
  return counts;
}, [levelLessons, cards, getChildLessons, type]);
```

**Lines 200-227:** Renders lessons (empty if no lessons or all disabled)
```typescript
{levelLessons.length === 0 ? (
  <div className="empty-lessons">
    <p>Không có bài học nào cho cấp độ này</p>
  </div>
) : (
  levelLessons.map(lesson => {
    const isSelected = selectedLessons.includes(lesson.id);
    const cardCount = cardsPerLesson[lesson.id] || 0;
    return (
      <button
        disabled={cardCount === 0}
        // ... renders lesson with count
      >
```

#### 2. Lessons Hook
**File:** `/src/hooks/use-lessons.ts`

**Lines 97-101:** Gets root lessons by level
```typescript
const getLessonsByLevel = useCallback((level: JLPTLevel) => {
  return lessons
    .filter(l => l.jlptLevel === level && l.parentId === null)
    .sort((a, b) => a.order - b.order);
}, [lessons]);
```

**Lines 12-20:** Subscribes to Firestore lessons collection
```typescript
useEffect(() => {
  setLoading(true);
  const unsubscribe = firestoreService.subscribeToLessons((lessonsData) => {
    setLessons(lessonsData);
    setLoading(false);
  });
  return () => unsubscribe();
}, []);
```

#### 3. Filtered Lessons (VIP/Hidden Filtering)
**File:** `/src/App.tsx`

**Lines 259-270:** Filters lessons based on user permissions
```typescript
const filteredGetLessonsByLevel = useMemo(() => {
  return (level: JLPTLevel): Lesson[] => {
    const lessonList = getLessonsByLevel(level);
    return lessonList.filter(l => {
      // Filter hidden lessons - only show to creator or super_admin
      if (l.isHidden && !canSeeHiddenLesson(l)) return false;
      // Filter locked lessons - only show to VIP/admin
      if (l.isLocked && !canAccessLocked) return false;
      return true;
    });
  };
}, [getLessonsByLevel, canAccessLocked, isSuperAdmin, currentUser?.id]);
```

#### 4. Firestore Service
**File:** `/src/services/firestore.ts`

**Lines 194-199:** Subscribes to lessons collection
```typescript
export function subscribeToLessons(callback: (lessons: Lesson[]) => void): Unsubscribe {
  return onSnapshot(collection(db, COLLECTIONS.LESSONS), (snapshot) => {
    const lessons = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Lesson));
    callback(lessons);
  });
}
```

### Seed Script Reference
**File:** `/src/scripts/seed-n5-lessons.ts`

N5 structure defined as:
- Bài 2-25 (lessons 2 through 25)
- Each lesson has 5 child folders:
  - Từ vựng (Vocabulary)
  - Kanji
  - Ngữ pháp (Grammar)
  - Đọc hiểu (Reading)
  - Mở rộng (Extended)

---

## Root Cause Hypotheses

### Hypothesis 1: Lessons Collection Empty (Most Likely)
**Evidence:**
- Level screen shows flashcards exist (5 cards)
- Seed script exists but may not have run
- No explicit check if seed ran on app init

**Validation:**
- Check Firestore console for `lessons` collection
- Run: `seedN5Lessons(userId)` from admin panel

### Hypothesis 2: Flashcards Reference Non-Existent Lessons
**Evidence:**
- Flashcards exist with N5 level
- But their `lessonId` field may point to deleted/missing lessons
- Card count logic depends on matching lessonIds

**Validation:**
- Query flashcards to check lessonId values
- Verify lessonIds exist in lessons collection

### Hypothesis 3: VIP/Lock Filtering Too Aggressive
**Evidence:**
- Filtered lessons logic in App.tsx
- User may not have VIP/admin role
- All N5 lessons might be marked as locked/hidden

**Validation:**
- Check current user role
- Check N5 lessons for isLocked/isHidden flags
- Test with admin/VIP account

### Hypothesis 4: Parent-Child Relationship Broken
**Evidence:**
- getLessonsByLevel filters by `parentId === null`
- If all lessons have parentId set, none qualify as "root"
- Would explain empty levelLessons array

**Validation:**
- Query lessons where jlptLevel='N5' AND parentId is null
- Check if any exist

---

## Immediate Actions Required

### 1. Database Verification
Check Firestore via console or admin panel:

```javascript
// Count N5 parent lessons
db.collection('lessons')
  .where('jlptLevel', '==', 'N5')
  .where('parentId', '==', null)
  .get()
  .then(snap => console.log('N5 parent lessons:', snap.size))

// Count N5 flashcards
db.collection('flashcards')
  .where('jlptLevel', '==', 'N5')
  .get()
  .then(snap => console.log('N5 flashcards:', snap.size))

// Check flashcard lessonIds
db.collection('flashcards')
  .where('jlptLevel', '==', 'N5')
  .limit(5)
  .get()
  .then(snap => snap.docs.forEach(doc =>
    console.log('lessonId:', doc.data().lessonId)
  ))
```

### 2. Seed Lessons If Missing
From admin panel (cards page), flashcards tab:

1. Click "Seed N5 Lessons" button
2. Should create Bài 2-25 structure
3. Verify lessons appear in lesson selector

### 3. Check User Permissions
If user is not VIP/admin:
- All locked lessons will be hidden
- Check if N5 lessons have isLocked=true
- Temporarily disable filtering to test

### 4. Verify Flashcard Data Integrity
- Ensure flashcards have valid lessonId field
- LessonIds should match existing lesson documents
- Update orphaned cards to valid lessons

---

## Long-Term Recommendations

### 1. Add Debug Info to UI
Show diagnostic information when lessons empty:

```typescript
{levelLessons.length === 0 ? (
  <div className="empty-lessons">
    <p>Không có bài học nào cho cấp độ này</p>
    {process.env.NODE_ENV === 'development' && (
      <div style={{fontSize: '12px', color: '#666', marginTop: '8px'}}>
        <div>Total lessons loaded: {lessons.length}</div>
        <div>Flashcards count: {cards.filter(c => c.jlptLevel === selectedLevel).length}</div>
        <div>User role: {currentUser?.role}</div>
      </div>
    )}
  </div>
) : (
```

### 2. Improve Data Validation
Add checks in seed script and admin tools:
- Prevent deleting lessons with flashcards
- Warn when flashcards reference missing lessons
- Auto-repair orphaned flashcard lessonIds

### 3. Better Error Messaging
If lessons exist but all disabled (0 cards):

```typescript
const allLessonsHaveZeroCards = levelLessons.length > 0 &&
  levelLessons.every(l => cardsPerLesson[l.id] === 0);

if (allLessonsHaveZeroCards) {
  return <div>Các bài học chưa có từ vựng. Vui lòng thêm từ vựng trong trang quản lý.</div>
}
```

### 4. Onboarding Automation
Auto-seed lessons on first app launch:
- Check if lessons collection empty
- Auto-run seed scripts for all levels
- Show progress indicator

---

## Supporting Evidence

### File Structure
```
src/
├── components/
│   └── study/
│       └── level-lesson-selector.tsx (renders lesson list)
├── hooks/
│   └── use-lessons.ts (provides getLessonsByLevel)
├── services/
│   └── firestore.ts (subscribeToLessons)
├── scripts/
│   └── seed-n5-lessons.ts (seeding tool)
└── types/
    └── flashcard.ts (Lesson, Flashcard interfaces)
```

### Data Model
```typescript
interface Lesson {
  id: string;
  name: string;           // "Bài 1", "Từ vựng", etc.
  jlptLevel: JLPTLevel;   // "N5"
  parentId: string | null; // null for root, else parent lesson id
  order: number;
  isLocked: boolean;
  isHidden: boolean;
  createdBy?: string;
}

interface Flashcard {
  id: string;
  vocabulary: string;
  // ... other fields
  jlptLevel: JLPTLevel;
  lessonId: string;  // MUST reference existing Lesson.id
}
```

---

## Unresolved Questions

1. Has seed script ever been executed for this database?
2. What is current user's role (affects filtering)?
3. Are there any console errors in browser DevTools?
4. Does issue occur for all users or specific accounts?
5. Does same issue affect N4/N3/N2/N1 or only N5?
6. When were the 5 N5 flashcards created? Do they have lessonIds?
7. Is Firebase connection stable (check offline indicator)?

---

## Next Steps

1. **User:** Check browser console for errors
2. **User:** Verify internet/Firebase connection
3. **User:** Try with admin/VIP account to rule out permission issues
4. **Dev:** Add logging to getLessonsByLevel to see what it returns
5. **Dev:** Run seed script from admin panel
6. **Dev:** Query Firestore to verify lessons exist
7. **Dev:** Check flashcard lessonIds match existing lessons
