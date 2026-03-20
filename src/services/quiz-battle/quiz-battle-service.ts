import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  runTransaction,
  onSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '../../lib/firebase';

type JLPTLevel = 'N5' | 'N4' | 'N3' | 'N2' | 'N1';

interface QuizBattleLevelStats {
  totalMatches: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number;
  currentStreak: number;
  bestStreak: number;
}

interface QuizBattleRating {
  odinhId: string;
  displayName: string;
  avatar: string;
  ratings: Record<JLPTLevel, number>;
  stats: Record<JLPTLevel, QuizBattleLevelStats>;
  createdAt: string;
  updatedAt: string;
}

const COLLECTION = 'quiz_battle_ratings';
const LEVELS: JLPTLevel[] = ['N5', 'N4', 'N3', 'N2', 'N1'];

const defaultStats = (): QuizBattleLevelStats => ({
  totalMatches: 0, wins: 0, losses: 0, draws: 0,
  winRate: 0, currentStreak: 0, bestStreak: 0,
});

const defaultRating = (odinhId: string, displayName: string, avatar: string): QuizBattleRating => {
  const now = new Date().toISOString();
  return {
    odinhId, displayName, avatar,
    ratings: { N5: 1000, N4: 1000, N3: 1000, N2: 1000, N1: 1000 },
    stats: Object.fromEntries(LEVELS.map(l => [l, defaultStats()])) as Record<JLPTLevel, QuizBattleLevelStats>,
    createdAt: now,
    updatedAt: now,
  };
};

export async function getOrCreateRating(
  userId: string, displayName: string, avatar: string
): Promise<QuizBattleRating> {
  const ref = doc(db, COLLECTION, userId);
  const snap = await getDoc(ref);
  if (snap.exists()) return snap.data() as QuizBattleRating;

  const rating = defaultRating(userId, displayName, avatar);
  await setDoc(ref, rating, { merge: true });
  return rating;
}

export async function updateRatingAfterMatch(
  winnerId: string,
  loserId: string,
  level: JLPTLevel,
  winnerRatingChange: number,
  loserRatingChange: number,
  isDraw: boolean
): Promise<void> {
  const winnerRef = doc(db, COLLECTION, winnerId);
  const loserRef = doc(db, COLLECTION, loserId);

  await runTransaction(db, async (tx) => {
    const [winnerSnap, loserSnap] = await Promise.all([tx.get(winnerRef), tx.get(loserRef)]);
    const now = new Date().toISOString();

    const applyUpdate = (
      data: QuizBattleRating,
      ratingDelta: number,
      outcome: 'win' | 'loss' | 'draw'
    ): Partial<QuizBattleRating> => {
      const stats = { ...data.stats[level] };
      stats.totalMatches++;
      if (outcome === 'win') { stats.wins++; stats.currentStreak++; stats.bestStreak = Math.max(stats.bestStreak, stats.currentStreak); }
      else if (outcome === 'loss') { stats.losses++; stats.currentStreak = 0; }
      else { stats.draws++; stats.currentStreak = 0; }
      stats.winRate = stats.totalMatches > 0 ? Math.round((stats.wins / stats.totalMatches) * 100) : 0;

      return {
        ratings: { ...data.ratings, [level]: data.ratings[level] + ratingDelta },
        stats: { ...data.stats, [level]: stats },
        updatedAt: now,
      };
    };

    const winnerData = winnerSnap.exists() ? winnerSnap.data() as QuizBattleRating : defaultRating(winnerId, '', '');
    const loserData = loserSnap.exists() ? loserSnap.data() as QuizBattleRating : defaultRating(loserId, '', '');

    tx.set(winnerRef, { ...winnerData, ...applyUpdate(winnerData, winnerRatingChange, isDraw ? 'draw' : 'win') });
    tx.set(loserRef, { ...loserData, ...applyUpdate(loserData, loserRatingChange, isDraw ? 'draw' : 'loss') });
  });
}

export async function getLeaderboard(level: JLPTLevel, limitCount = 50): Promise<QuizBattleRating[]> {
  const snap = await getDocs(collection(db, COLLECTION));
  return snap.docs
    .map(d => d.data() as QuizBattleRating)
    .sort((a, b) => (b.ratings[level] ?? 1000) - (a.ratings[level] ?? 1000))
    .slice(0, limitCount);
}

export function subscribeToLeaderboard(
  level: JLPTLevel,
  limitCount: number,
  callback: (players: QuizBattleRating[]) => void
): Unsubscribe {
  return onSnapshot(collection(db, COLLECTION), (snap) => {
    const sorted = snap.docs
      .map(d => d.data() as QuizBattleRating)
      .sort((a, b) => (b.ratings[level] ?? 1000) - (a.ratings[level] ?? 1000))
      .slice(0, limitCount);
    callback(sorted);
  });
}
