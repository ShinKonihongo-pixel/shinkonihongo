// Firestore service for user achievement persistence

import {
  db,
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  type Unsubscribe,
} from './collections';
import type { UserAchievementData, UserAchievementProgress, AchievementTier } from '../../types/achievements';

const COLLECTION = 'userAchievements';

// Default empty achievement data
function createDefaultData(userId: string): UserAchievementData {
  return {
    userId,
    achievements: {},
    updatedAt: new Date().toISOString(),
  };
}

// Get user achievements (creates default doc if missing)
export async function getUserAchievements(userId: string): Promise<UserAchievementData> {
  const ref = doc(db, COLLECTION, userId);
  const snap = await getDoc(ref);
  if (snap.exists()) return snap.data() as UserAchievementData;
  const defaultData = createDefaultData(userId);
  await setDoc(ref, defaultData);
  return defaultData;
}

// Subscribe to real-time updates
export function subscribeUserAchievements(
  userId: string,
  callback: (data: UserAchievementData) => void
): Unsubscribe {
  const ref = doc(db, COLLECTION, userId);
  return onSnapshot(ref, (snap) => {
    if (snap.exists()) {
      callback(snap.data() as UserAchievementData);
    } else {
      const defaultData = createDefaultData(userId);
      setDoc(ref, defaultData);
      callback(defaultData);
    }
  });
}

// Batch update multiple achievements at once
export async function batchUpdateAchievements(
  userId: string,
  updates: Array<{
    achievementId: string;
    newValue: number;
    newlyUnlockedTier?: AchievementTier;
  }>
): Promise<void> {
  const ref = doc(db, COLLECTION, userId);
  const snap = await getDoc(ref);
  const data: UserAchievementData = snap.exists()
    ? (snap.data() as UserAchievementData)
    : createDefaultData(userId);

  for (const update of updates) {
    const existing: UserAchievementProgress = data.achievements[update.achievementId] || {
      achievementId: update.achievementId,
      currentValue: 0,
      unlockedTiers: [],
    };

    existing.currentValue = update.newValue;
    if (update.newlyUnlockedTier && !existing.unlockedTiers.includes(update.newlyUnlockedTier)) {
      existing.unlockedTiers.push(update.newlyUnlockedTier);
      existing.lastUnlockedAt = new Date().toISOString();
    }
    data.achievements[update.achievementId] = existing;
  }

  data.updatedAt = new Date().toISOString();
  await setDoc(ref, data, { merge: true });
}
