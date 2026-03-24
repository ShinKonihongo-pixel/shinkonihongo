// Kaiwa page state — composes sub-hooks into one public API
import { useState, useEffect, useCallback, useRef } from 'react';
import type { KaiwaMessage, KaiwaMetrics, KaiwaEvaluation } from '../../../types/kaiwa';
import type { KaiwaDefaultQuestion, KaiwaFolder } from '../../../types/kaiwa-question';
import type { KaiwaAdvancedQuestion } from '../../../types/kaiwa-advanced';
import type { CustomTopicQuestion } from '../../../types/custom-topic';
import type { KaiwaPageProps } from './kaiwa-types';
import { useGroq } from '../../../hooks/use-groq';
import { useGroqAdvanced } from '../../../hooks/use-groq-advanced';
import { removeFurigana } from '../../../lib/furigana-utils';
import { useKaiwaSession } from './use-kaiwa-session';
import { useKaiwaMessages } from './use-kaiwa-messages';
import { useKaiwaAudio } from './use-kaiwa-audio';
import { useKaiwaUi } from './use-kaiwa-ui';

export function useKaiwaState({
  settings,
  defaultQuestions: _defaultQuestions = [],
  getFoldersByLevelAndTopic,
  getQuestionsByFolder,
  getQuestionsByLevelAndTopic,
  advancedTopics: _advancedTopics = [],
  advancedQuestions = [],
  getAdvancedQuestionsByTopic,
  customTopics: _customTopics = [],
  customTopicQuestions = [],
  getCustomTopicQuestionsByTopic,
}: KaiwaPageProps) {
  const groq = useGroq();
  const groqAdvanced = useGroqAdvanced();
  const isAiLoading = groq.isLoading || groqAdvanced.isLoading;

  // ── UI sub-hook (needs groq for analyzeJapaneseSentence) ──────────────────
  const ui = useKaiwaUi({ settings, groq });

  // ── Session sub-hook ──────────────────────────────────────────────────────
  const session = useKaiwaSession(settings);

  // ── Messages sub-hook (needs session context + groq hooks) ────────────────
  const msgs = useKaiwaMessages({
    sessionMode: session.sessionMode,
    selectedAdvancedTopic: session.selectedAdvancedTopic,
    isAiLoading,
    getContext: session.getContext,
    groq,
    groqAdvanced,
    setActiveSuggestionTab: ui.setActiveSuggestionTab,
  });

  // ── Audio sub-hook ────────────────────────────────────────────────────────
  const audio = useKaiwaAudio({
    settings,
    slowMode: ui.slowMode,
    handleSend: msgs.handleSend,
    onVoiceTranscript: (transcript) => msgs.handleSend(transcript),
  });

  // ── Evaluation state (lives here because handleEnd wires it all together) ──
  const [evaluation, setEvaluation] = useState<KaiwaEvaluation | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);

  // ── Refs shared across effects ────────────────────────────────────────────
  const lastSpokenMessageIdRef = useRef<string | null>(null);

  // ── Computed helpers that depend on both props and session state ──────────
  const getCustomQuestionsForTopic = useCallback((): CustomTopicQuestion[] => {
    if (!session.selectedCustomTopic) return [];
    if (getCustomTopicQuestionsByTopic) {
      return getCustomTopicQuestionsByTopic(session.selectedCustomTopic.id);
    }
    return customTopicQuestions.filter(q => q.topicId === session.selectedCustomTopic!.id);
  }, [session.selectedCustomTopic, getCustomTopicQuestionsByTopic, customTopicQuestions]);

  const getQuestionsForSelector = useCallback((): KaiwaDefaultQuestion[] => {
    if (session.questionSelectorState.type !== 'list') return [];
    if (session.questionSelectorState.folderId && getQuestionsByFolder) {
      return getQuestionsByFolder(session.questionSelectorState.folderId);
    }
    if (getQuestionsByLevelAndTopic) {
      return getQuestionsByLevelAndTopic(session.questionSelectorState.level, session.questionSelectorState.topic);
    }
    return [];
  }, [session.questionSelectorState, getQuestionsByFolder, getQuestionsByLevelAndTopic]);

  const getFoldersForSelector = useCallback((): KaiwaFolder[] => {
    if (session.questionSelectorState.type !== 'list') return [];
    if (getFoldersByLevelAndTopic) {
      return getFoldersByLevelAndTopic(session.questionSelectorState.level, session.questionSelectorState.topic);
    }
    return [];
  }, [session.questionSelectorState, getFoldersByLevelAndTopic]);

  const getAdvancedQuestionsForTopic = useCallback((): KaiwaAdvancedQuestion[] => {
    if (!session.selectedAdvancedTopic) return [];
    if (getAdvancedQuestionsByTopic) {
      return getAdvancedQuestionsByTopic(session.selectedAdvancedTopic.id);
    }
    return advancedQuestions.filter(q => q.topicId === session.selectedAdvancedTopic!.id);
  }, [session.selectedAdvancedTopic, getAdvancedQuestionsByTopic, advancedQuestions]);

  // ── Build metrics for evaluation ──────────────────────────────────────────
  const buildMetrics = useCallback((): KaiwaMetrics => {
    const userMessages = msgs.messages.filter((m: KaiwaMessage) => m.role === 'user');
    const avgAccuracy = audio.pronunciationAttempts > 0
      ? Math.round(audio.totalAccuracy / audio.pronunciationAttempts)
      : 0;
    return {
      totalExchanges: userMessages.length,
      durationMinutes: msgs.startTime
        ? Math.floor((Date.now() - msgs.startTime.getTime()) / 60000)
        : 0,
      avgPronunciationAccuracy: avgAccuracy,
      pronunciationAttempts: audio.pronunciationAttempts,
      wordsUsed: new Set(userMessages.flatMap(m => removeFurigana(m.content).split(/[\s。、！？]/)).filter(Boolean)),
      grammarPatterns: [],
    };
  }, [msgs.messages, msgs.startTime, audio.pronunciationAttempts, audio.totalAccuracy]);

  // ── Reset everything ──────────────────────────────────────────────────────
  const resetConversation = useCallback(() => {
    msgs.resetMessages();
    ui.setShowEvaluationModal(false);
    setEvaluation(null);
    setIsEvaluating(false);
    audio.setIsPracticeMode(false);
    audio.setSelectedSuggestion(null);
    audio.setPronunciationResult(null);
    audio.setPronunciationAttempts(() => 0);
    audio.setTotalAccuracy(() => 0);
    ui.setActiveSuggestionTab(null);
    session.resetSessionSelection();
    audio.speech.stopSpeaking();
    groq.clearConversation();
    groqAdvanced.clearConversation();
  }, [msgs, ui, audio, session, groq, groqAdvanced]);

  // ── Start conversation ────────────────────────────────────────────────────
  const handleStart = useCallback(async () => {
    msgs.setIsStarted(true);
    msgs.setStartTime(new Date());
    msgs.setMessages([]);
    msgs.setAnswerTemplate(null);
    msgs.setSuggestedQuestions([]);
    msgs.setSavedSentences(() => []);
    audio.setPronunciationAttempts(() => 0);
    audio.setTotalAccuracy(() => 0);
    groq.clearConversation();
    groqAdvanced.clearConversation();

    const contextToUse = session.getContext();
    let questionData: {
      questionJa: string;
      questionVi?: string;
      situationContext?: string;
      suggestedAnswers?: string[];
      advancedTopicContext?: {
        topicName: string;
        topicDescription: string;
        vocabulary: { word: string; reading?: string; meaning: string }[];
      };
    } | undefined;

    if (session.sessionMode === 'advanced' && session.selectedAdvancedTopic) {
      contextToUse.level = session.selectedAdvancedTopic.level;
      contextToUse.style = session.selectedAdvancedTopic.style;
      contextToUse.topic = 'free';

      const specificQuestion = session.selectedAdvancedQuestion ? {
        id: session.selectedAdvancedQuestion.id,
        questionJa: session.selectedAdvancedQuestion.questionJa,
        questionVi: session.selectedAdvancedQuestion.questionVi,
        level: session.selectedAdvancedTopic.level,
      } : undefined;

      const response = await groqAdvanced.startAdvancedConversation(
        session.selectedAdvancedTopic, contextToUse, specificQuestion
      );
      if (response) {
        msgs.setMessages([{
          id: `msg-${Date.now()}`, role: 'assistant',
          content: response.text, timestamp: new Date().toISOString(),
        }]);
        if (response.answerTemplate) msgs.setAnswerTemplate(response.answerTemplate);
        if (response.suggestions) msgs.setSuggestedAnswers(response.suggestions);
        if (response.suggestedQuestions) msgs.setSuggestedQuestions(response.suggestedQuestions);
      }
      return;
    }

    if (session.sessionMode === 'custom' && session.selectedCustomTopic) {
      contextToUse.topic = 'free';
      const customContext = {
        topicName: session.selectedCustomTopic.name,
        topicDescription: session.selectedCustomTopic.description,
        vocabulary: [],
      };

      if (session.selectedCustomQuestion) {
        questionData = {
          questionJa: session.selectedCustomQuestion.questionJa,
          questionVi: session.selectedCustomQuestion.questionVi,
          situationContext: session.selectedCustomQuestion.situationContext,
          suggestedAnswers: session.selectedCustomQuestion.suggestedAnswers,
          advancedTopicContext: customContext,
        };
      } else {
        const topicQuestions = getCustomQuestionsForTopic();
        const randomQ = topicQuestions.length > 0
          ? topicQuestions[Math.floor(Math.random() * topicQuestions.length)]
          : null;
        questionData = randomQ ? {
          questionJa: randomQ.questionJa,
          questionVi: randomQ.questionVi,
          situationContext: randomQ.situationContext,
          suggestedAnswers: randomQ.suggestedAnswers,
          advancedTopicContext: customContext,
        } : { questionJa: '', advancedTopicContext: customContext };
      }
    } else if (session.selectedDefaultQuestion) {
      contextToUse.level = session.selectedDefaultQuestion.level;
      contextToUse.style = session.selectedDefaultQuestion.style;
      contextToUse.topic = session.selectedDefaultQuestion.topic;
      questionData = {
        questionJa: session.selectedDefaultQuestion.questionJa,
        questionVi: session.selectedDefaultQuestion.questionVi,
        situationContext: session.selectedDefaultQuestion.situationContext,
        suggestedAnswers: session.selectedDefaultQuestion.suggestedAnswers,
      };
    }

    const response = await groq.startConversation(contextToUse, questionData);
    if (response) {
      msgs.setMessages([{
        id: `msg-${Date.now()}`, role: 'assistant',
        content: response.text, timestamp: new Date().toISOString(),
      }]);
      if (response.answerTemplate) msgs.setAnswerTemplate(response.answerTemplate);
      if (response.suggestions) msgs.setSuggestedAnswers(response.suggestions);
      if (response.suggestedQuestions) msgs.setSuggestedQuestions(response.suggestedQuestions);
    }
  }, [
    session, msgs, audio, groq, groqAdvanced, getCustomQuestionsForTopic,
  ]);

  // ── End conversation ──────────────────────────────────────────────────────
  const handleEnd = useCallback(async (skipEvaluation = false) => {
    if (!skipEvaluation && msgs.messages.length >= 4) {
      setIsEvaluating(true);
      ui.setShowEvaluationModal(true);
      const metrics = buildMetrics();
      const result = await groq.evaluateConversation(msgs.messages, session.getContext(), metrics);
      setEvaluation(result ?? null);
      setIsEvaluating(false);
      return;
    }
    resetConversation();
  }, [msgs.messages, buildMetrics, session, groq, ui, resetConversation]);

  const handleEvaluationClose = useCallback(() => {
    ui.setShowEvaluationModal(false);
    resetConversation();
  }, [ui, resetConversation]);

  // ── Effects ───────────────────────────────────────────────────────────────

  // Scroll to bottom + focus input on new messages
  useEffect(() => {
    msgs.messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    if (!isAiLoading) {
      msgs.inputRef.current?.focus();
    }
  }, [msgs.messages, isAiLoading, msgs.messagesEndRef, msgs.inputRef]);

  // Keyboard shortcut: Escape to stop speaking
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && audio.speech.isSpeaking) {
        audio.speech.stopSpeaking();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [audio.speech]);

  // Auto-speak assistant messages
  useEffect(() => {
    if (settings.kaiwaAutoSpeak && msgs.messages.length > 0) {
      const last = msgs.messages[msgs.messages.length - 1];
      if (last.role === 'assistant' && last.id !== lastSpokenMessageIdRef.current) {
        lastSpokenMessageIdRef.current = last.id;
        audio.speech.speak(removeFurigana(last.content), { rate: audio.getSpeechRate() });
      }
    }
  }, [msgs.messages, settings.kaiwaAutoSpeak, audio]);

  // ── Compose the same public API as before ─────────────────────────────────
  return {
    // State
    messages: msgs.messages,
    answerTemplate: msgs.answerTemplate,
    suggestedAnswers: msgs.suggestedAnswers,
    suggestedQuestions: msgs.suggestedQuestions,
    inputText: msgs.inputText,
    isStarted: msgs.isStarted,
    startTime: msgs.startTime,
    savedSentences: msgs.savedSentences,
    selectedSuggestion: audio.selectedSuggestion,
    pronunciationResult: audio.pronunciationResult,
    isPracticeMode: audio.isPracticeMode,
    level: session.level,
    style: session.style,
    topic: session.topic,
    slowMode: ui.slowMode,
    showFurigana: ui.showFurigana,
    speakingMessageId: audio.speakingMessageId,
    speakingMode: audio.speakingMode,
    showSuggestionTabs: ui.showSuggestionTabs,
    activeSuggestionTab: ui.activeSuggestionTab,
    fontSize: ui.fontSize,
    showSavedPanel: ui.showSavedPanel,
    questionSelectorState: session.questionSelectorState,
    selectedDefaultQuestion: session.selectedDefaultQuestion,
    sessionMode: session.sessionMode,
    selectedAdvancedTopic: session.selectedAdvancedTopic,
    selectedAdvancedQuestion: session.selectedAdvancedQuestion,
    selectedCustomTopic: session.selectedCustomTopic,
    selectedCustomQuestion: session.selectedCustomQuestion,
    analysisText: ui.analysisText,
    analysisResult: ui.analysisResult,
    isAnalyzing: ui.isAnalyzing,
    selectedScenario: session.selectedScenario,
    userRole: session.userRole,
    evaluation,
    isEvaluating,
    showEvaluationModal: ui.showEvaluationModal,
    micMode: audio.micMode,
    showReadingPracticeModal: audio.showReadingPracticeModal,
    textToRead: audio.textToRead,
    pronunciationAttempts: audio.pronunciationAttempts,
    totalAccuracy: audio.totalAccuracy,
    autoSendCountdown: audio.autoSendCountdown,
    conversationStats: msgs.conversationStats,
    isAiLoading,

    // Refs
    messagesEndRef: msgs.messagesEndRef,
    inputRef: msgs.inputRef,

    // Hooks
    speech: audio.speech,
    groq,

    // Setters
    setInputText: msgs.setInputText,
    setMessages: msgs.setMessages,
    setSlowMode: ui.setSlowMode,
    setShowFurigana: ui.setShowFurigana,
    setShowSuggestionTabs: ui.setShowSuggestionTabs,
    setActiveSuggestionTab: ui.setActiveSuggestionTab,
    setFontSize: ui.setFontSize,
    setShowSavedPanel: ui.setShowSavedPanel,
    setQuestionSelectorState: session.setQuestionSelectorState,
    setSelectedDefaultQuestion: session.setSelectedDefaultQuestion,
    setLevel: session.setLevel,
    setStyle: session.setStyle,
    setTopic: session.setTopic,
    setSessionMode: session.setSessionMode,
    setSelectedAdvancedTopic: session.setSelectedAdvancedTopic,
    setSelectedAdvancedQuestion: session.setSelectedAdvancedQuestion,
    setSelectedCustomTopic: session.setSelectedCustomTopic,
    setSelectedCustomQuestion: session.setSelectedCustomQuestion,
    setSavedSentences: msgs.setSavedSentences,
    setAnalysisText: ui.setAnalysisText,
    setAnalysisResult: ui.setAnalysisResult,
    setUserRole: session.setUserRole,
    setMicMode: audio.setMicMode,
    setShowReadingPracticeModal: audio.setShowReadingPracticeModal,
    setTextToRead: audio.setTextToRead,
    setPronunciationAttempts: audio.setPronunciationAttempts,
    setTotalAccuracy: audio.setTotalAccuracy,

    // Handlers
    handleStart,
    handleSend: msgs.handleSend,
    handleEnd,
    handleMicClick: audio.handleMicClick,
    handleEvaluationClose,
    handleSaveSentence: msgs.handleSaveSentence,
    handleQuickTranslate: msgs.handleQuickTranslate,
    handleSelectHint: msgs.handleSelectHint,
    handleSuggestedAnswer: msgs.handleSuggestedAnswer,
    handleSuggestedQuestion: msgs.handleSuggestedQuestion,
    handleSpeak: audio.handleSpeak,
    handleAnalyze: ui.handleAnalyze,
    handleCancelPractice: audio.handleCancelPractice,
    handleRetryPractice: audio.handleRetryPractice,
    handleAcceptPronunciation: audio.handleAcceptPronunciation,
    handleTopicChange: session.handleTopicChange,

    // Computed
    getSpeechRate: audio.getSpeechRate,
    getContext: session.getContext,
    getUserRoleInfo: session.getUserRoleInfo,
    getQuestionsForSelector,
    getFoldersForSelector,
    getAdvancedQuestionsForTopic,
    getCustomQuestionsForTopic,
  };
}
