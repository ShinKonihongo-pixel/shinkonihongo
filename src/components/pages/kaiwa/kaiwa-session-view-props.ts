// Props interface for KaiwaSessionView

import type { RefObject } from 'react';
import type {
  KaiwaMessage,
  JLPTLevel,
  ConversationStyle,
  ConversationTopic,
  PronunciationResult,
  AnswerTemplate,
  SuggestedAnswer,
  KaiwaRole,
  KaiwaEvaluation,
} from '../../../types/kaiwa';
import type { MicMode } from '../../kaiwa/kaiwa-input-area';
import type { SessionMode } from './kaiwa-page-types';
import type { KaiwaAdvancedTopic } from '../../../types/kaiwa-advanced';
import type { CustomTopic } from '../../../types/custom-topic';
import type { AppSettings } from '../../../hooks/use-settings';
import type { useSpeech } from '../../../hooks/use-speech';
import type { useGroq } from '../../../hooks/use-groq';

export interface KaiwaSessionViewProps {
  // State
  messages: KaiwaMessage[];
  level: JLPTLevel;
  style: ConversationStyle;
  topic: ConversationTopic;
  conversationStats: { exchanges: number; duration: number };
  savedSentences: string[];
  showSavedPanel: boolean;
  slowMode: boolean;
  showFurigana: boolean;
  fontSize: number;
  speakingMessageId: string | null;
  speakingMode: 'normal' | 'slow' | null;
  isAiLoading: boolean;
  inputText: string;
  showSuggestionTabs: boolean;
  activeSuggestionTab: 'template' | 'answers' | 'questions' | null;
  answerTemplate: AnswerTemplate | null;
  suggestedAnswers: SuggestedAnswer[];
  suggestedQuestions: string[];
  isPracticeMode: boolean;
  selectedSuggestion: SuggestedAnswer | null;
  pronunciationResult: PronunciationResult | null;
  autoSendCountdown: number | null;
  analysisText: string | null;
  analysisResult: string | null;
  isAnalyzing: boolean;
  showEvaluationModal: boolean;
  evaluation: KaiwaEvaluation | null;
  isEvaluating: boolean;
  micMode: MicMode;
  showReadingPracticeModal: boolean;
  textToRead: string;
  selectedAdvancedTopic: KaiwaAdvancedTopic | null;
  selectedCustomTopic: CustomTopic | null;
  sessionMode: SessionMode;

  // Refs
  messagesEndRef: RefObject<HTMLDivElement>;
  inputRef: RefObject<HTMLInputElement>;

  // Hooks
  speech: ReturnType<typeof useSpeech>;
  groq: ReturnType<typeof useGroq>;

  // Settings
  settings: AppSettings;

  // Setters
  setInputText: (text: string) => void;
  setSlowMode: (slow: boolean) => void;
  setShowFurigana: (show: boolean) => void;
  setFontSize: (size: number) => void;
  setShowSavedPanel: (show: boolean) => void;
  setSavedSentences: React.Dispatch<React.SetStateAction<string[]>>;
  setShowSuggestionTabs: (show: boolean) => void;
  setActiveSuggestionTab: (tab: 'template' | 'answers' | 'questions' | null) => void;
  setAnalysisText: (text: string | null) => void;
  setAnalysisResult: (result: string | null) => void;
  setMicMode: (mode: MicMode) => void;
  setShowReadingPracticeModal: (show: boolean) => void;
  setTextToRead: (text: string) => void;
  setPronunciationAttempts: React.Dispatch<React.SetStateAction<number>>;
  setTotalAccuracy: React.Dispatch<React.SetStateAction<number>>;

  // Handlers
  handleStart: () => void;
  handleEnd: (skipEvaluation?: boolean) => void;
  handleSend: (text: string) => void;
  handleSpeak: (messageId: string, text: string, mode: 'normal' | 'slow') => void;
  handleAnalyze: (text: string) => void;
  handleQuickTranslate: (text: string) => Promise<string>;
  handleSaveSentence: (text: string) => void;
  handleSelectHint: (hint: { word: string; meaning: string }) => void;
  handleSuggestedAnswer: (answer: string) => void;
  handleSuggestedQuestion: (question: string) => void;
  handleMicClick: () => void;
  handleCancelPractice: () => void;
  handleRetryPractice: () => void;
  handleAcceptPronunciation: () => void;
  handleEvaluationClose: () => void;

  // Computed
  getSpeechRate: () => number;
  getUserRoleInfo: () => KaiwaRole | null;
}
