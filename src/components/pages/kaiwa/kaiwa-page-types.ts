// Kaiwa page types - Local types for the kaiwa conversation page
// Extracted from kaiwa-page.tsx for better maintainability
// Note: KaiwaPageProps removed — KaiwaPage is now zero-prop (uses contexts internally)

// Session mode type - determines which question bank to use
export type SessionMode = 'default' | 'advanced' | 'custom' | 'speaking';

// Navigation state for question selector - handles multi-level navigation
export type QuestionSelectorState =
  | { type: 'hidden' }
  | { type: 'level' }
  | { type: 'topic'; level: JLPTLevel }
  | { type: 'list'; level: JLPTLevel; topic: ConversationTopic; folderId?: string; folderName?: string };
