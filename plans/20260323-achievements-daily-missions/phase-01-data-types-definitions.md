# Phase 01: Data Types & Definitions

## Goal
Define all TypeScript types, the static achievement catalog, and mission template pool.

---

## File 1: `src/types/achievements.ts`

### Types to define

```ts
// Achievement tier levels
type AchievementTier = 'bronze' | 'silver' | 'gold';

// Achievement categories
type AchievementCategory = 'learning' | 'streak' | 'games' | 'social' | 'mastery' | 'special';

// Single tier definition within an achievement
interface AchievementTierDef {
  tier: AchievementTier;
  threshold: number;       // e.g., 50 words for bronze
  xpReward: number;        // XP granted on unlock
}

// Static achievement definition (from catalog)
interface AchievementDef {
  id: string;              // e.g., 'words_learned'
  category: AchievementCategory;
  nameVi: string;          // Vietnamese display name
  nameJp: string;          // Japanese display name
  description: string;     // Vietnamese description template
  icon: string;            // Lucide icon name
  tiers: AchievementTierDef[];
  statKey: string;         // Key to look up in user stats/progress
}

// User's progress on a specific achievement (persisted in Firestore)
interface UserAchievementProgress {
  achievementId: string;
  currentValue: number;    // Current progress count
  unlockedTiers: AchievementTier[];  // Which tiers unlocked
  lastUnlockedAt?: string; // ISO timestamp of last unlock
}

// Full user achievement document in Firestore
interface UserAchievementData {
  userId: string;
  achievements: UserAchievementProgress[];
  updatedAt: string;       // ISO timestamp
}

// Mission types (what activity the mission requires)
type MissionType =
  | 'study_words'
  | 'review_cards'
  | 'play_game'
  | 'read_passage'
  | 'grammar_study'
  | 'listening'
  | 'kanji_study'
  | 'jlpt_practice';

// Single mission template (from pool)
interface MissionTemplate {
  type: MissionType;
  titleTemplate: string;   // e.g., "Hoc {target} tu moi" (Vietnamese)
  descriptionVi: string;
  icon: string;            // Lucide icon name
  xpReward: number;        // Base XP reward
  targetRange: { min: number; max: number };  // Target scaled per difficulty
}

// Active daily mission instance (generated from template)
interface DailyMission {
  id: string;              // Generated unique ID for today
  type: MissionType;
  title: string;           // Resolved from template
  description: string;
  icon: string;
  target: number;          // Specific target for today
  progress: number;        // Current progress
  xpReward: number;
  isCompleted: boolean;
  completedAt?: string;    // ISO timestamp
}

// Full daily mission state (localStorage)
interface DailyMissionState {
  date: string;            // YYYY-MM-DD
  missions: DailyMission[];
  allCompleted: boolean;
  bonusXpClaimed: boolean; // Bonus for completing all missions
  bonusXp: number;         // e.g., 50 XP
}

// Toast item for achievement unlock notification
interface AchievementToastItem {
  id: string;              // Unique toast ID
  achievementId: string;
  tier: AchievementTier;
  nameVi: string;
  icon: string;
  xpReward: number;
  timestamp: number;
}
```

---

## File 2: `src/data/achievement-definitions.ts`

Static catalog of ~20 achievements. Export as `ACHIEVEMENT_DEFINITIONS: AchievementDef[]`.

### Achievement Catalog

| ID | Category | Name (Vi) | Icon | Bronze | Silver | Gold |
|----|----------|-----------|------|--------|--------|------|
| `words_learned` | learning | Nha Tu Vung | BookOpen | 50 | 200 | 1000 |
| `cards_studied` | learning | Hoc Sinh Cham Chi | Layers | 100 | 500 | 2000 |
| `study_sessions` | learning | Nguoi Hoc Kien Tri | GraduationCap | 10 | 50 | 200 |
| `study_time_hours` | learning | Ong Thay Thoi Gian | Clock | 5h | 25h | 100h |
| `streak_days` | streak | Ngon Lua Bat Diet | Flame | 7 | 30 | 100 |
| `games_played` | games | Game Thu | Gamepad2 | 10 | 50 | 200 |
| `games_won` | games | Nha Vo Dich | Trophy | 5 | 25 | 100 |
| `gold_medals` | games | Huy Chuong Vang | Medal | 3 | 15 | 50 |
| `elo_reached` | games | Kiemsi ELO | Swords | 1200 | 1500 | 1800 |
| `friends_added` | social | Nguoi Giao Tiep | Users | 3 | 10 | 25 |
| `badges_sent` | social | Nguoi Trao Tang | Gift | 5 | 20 | 50 |
| `badges_received` | social | Duoc Yeu Men | Heart | 5 | 20 | 50 |
| `jlpt_n5_mastery` | mastery | N5 Master | Award | 50% | 75% | 95% |
| `jlpt_n4_mastery` | mastery | N4 Master | Award | 50% | 75% | 95% |
| `jlpt_n3_mastery` | mastery | N3 Master | Award | 50% | 75% | 95% |
| `jlpt_n2_mastery` | mastery | N2 Master | Award | 50% | 75% | 95% |
| `jlpt_n1_mastery` | mastery | N1 Master | Award | 50% | 75% | 95% |
| `all_modes_tried` | special | Nguoi Kham Pha | Compass | 3 | 5 | 6 |
| `kanji_learned` | learning | Nha Han Tu | BookOpen | 20 | 100 | 500 |
| `jlpt_questions` | learning | Luyen Thi JLPT | FileCheck | 50 | 200 | 1000 |

### Stat Key Mapping
Each achievement's `statKey` maps to a value derived from:
- `UserStats` fields: `totalCardsStudied`, `totalStudySessions`, `totalStudyTime`, `totalGamesPlayed`, `totalGameWins`, `goldMedals`
- `StreakInfo.currentStreak` / `longestStreak`
- `friendsWithUsers.length`, `badgeStats.totalSent`, `badgeStats.totalReceived`
- `LevelProgress[level].masteryPercent`
- Custom counters (modes tried, kanji learned, JLPT questions)

---

## File 3: `src/data/mission-templates.ts`

Export as `MISSION_TEMPLATES: MissionTemplate[]`.

| Type | Title Template | XP | Target Range |
|------|---------------|-----|-------------|
| `study_words` | "Hoc {target} tu moi" | 20 | 5-15 |
| `review_cards` | "On tap {target} the" | 15 | 10-30 |
| `play_game` | "Choi {target} tro choi" | 25 | 1-3 |
| `read_passage` | "Doc {target} bai doc" | 20 | 1-2 |
| `grammar_study` | "Hoc {target} mau ngu phap" | 20 | 3-8 |
| `listening` | "Nghe {target} bai nghe" | 20 | 1-3 |
| `kanji_study` | "Hoc {target} Kanji moi" | 20 | 3-10 |
| `jlpt_practice` | "Lam {target} cau JLPT" | 25 | 5-20 |

### Constants
- `DAILY_MISSION_COUNT = 4` -- missions generated per day
- `ALL_COMPLETE_BONUS_XP = 50` -- bonus for completing all 4
- Mission generation: seeded random from `hashCode(date + userId) % templatePool.length`, pick 4 non-duplicate types

---

## Acceptance Criteria
- [ ] All types compile with no errors
- [ ] Achievement definitions cover all categories
- [ ] Mission templates cover all study modes in the app
- [ ] Stat key mapping documented for each achievement
- [ ] No runtime dependencies (pure data files)
