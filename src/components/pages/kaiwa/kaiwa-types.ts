// Type definitions for Kaiwa page components
// Extracted from kaiwa-page.tsx
// Note: KaiwaPageProps removed — KaiwaPage is zero-prop (Phase 3 migration)

import type { JLPTLevel, ConversationTopic } from '../../../types/kaiwa';

// Session mode type
export type SessionMode = 'default' | 'advanced' | 'custom' | 'speaking';

// Navigation state for question selector
export type QuestionSelectorState =
  | { type: 'hidden' }
  | { type: 'level' }
  | { type: 'topic'; level: JLPTLevel }
  | { type: 'list'; level: JLPTLevel; topic: ConversationTopic; folderId?: string; folderName?: string };
