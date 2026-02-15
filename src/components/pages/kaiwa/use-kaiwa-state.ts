// Custom hook for Kaiwa page state management
// Extracted from kaiwa-page.tsx - contains all state, effects, and handlers

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type { KaiwaMessage, KaiwaContext, JLPTLevel, ConversationStyle, ConversationTopic, PronunciationResult, AnswerTemplate, SuggestedAnswer, KaiwaScenario, KaiwaRole, KaiwaEvaluation, KaiwaMetrics, VocabularyHint } from '../../../types/kaiwa';
import type { KaiwaDefaultQuestion, KaiwaFolder } from '../../../types/kaiwa-question';
import type { KaiwaAdvancedTopic, KaiwaAdvancedQuestion } from '../../../types/kaiwa-advanced';
import type { CustomTopic, CustomTopicQuestion } from '../../../types/custom-topic';
import type { SessionMode, QuestionSelectorState, KaiwaPageProps } from './kaiwa-types';
import type { MicMode } from '../../kaiwa/kaiwa-input-area';
import { useSpeech, comparePronunciation } from '../../../hooks/use-speech';
import { useGroq } from '../../../hooks/use-groq';
import { useGroqAdvanced } from '../../../hooks/use-groq-advanced';
import { getScenarioByTopic } from '../../../constants/kaiwa';
import { removeFurigana } from '../../../lib/furigana-utils';

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
  // Conversation state
  const [messages, setMessages] = useState<KaiwaMessage[]>([]);
  const [answerTemplate, setAnswerTemplate] = useState<AnswerTemplate | null>(null);
  const [suggestedAnswers, setSuggestedAnswers] = useState<SuggestedAnswer[]>([]);
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);
  const [inputText, setInputText] = useState('');
  const [isStarted, setIsStarted] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [savedSentences, setSavedSentences] = useState<string[]>([]);

  // Pronunciation practice state
  const [selectedSuggestion, setSelectedSuggestion] = useState<SuggestedAnswer | null>(null);
  const [pronunciationResult, setPronunciationResult] = useState<PronunciationResult | null>(null);
  const [isPracticeMode, setIsPracticeMode] = useState(false);

  // Context state
  const [level, setLevel] = useState<JLPTLevel>(settings.kaiwaDefaultLevel);
  const [style, setStyle] = useState<ConversationStyle>(settings.kaiwaDefaultStyle);
  const [topic, setTopic] = useState<ConversationTopic>('free');

  // UI state
  const [slowMode, setSlowMode] = useState(false);
  const [showFurigana, setShowFurigana] = useState(settings.kaiwaShowFurigana);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [speakingMode, setSpeakingMode] = useState<'normal' | 'slow' | null>(null);
  const [showSuggestionTabs, setShowSuggestionTabs] = useState(true);
  const [activeSuggestionTab, setActiveSuggestionTab] = useState<'template' | 'answers' | 'questions' | null>(null);
  const [fontSize, setFontSize] = useState(() => {
    const saved = localStorage.getItem('kaiwaFontSize');
    return saved ? parseInt(saved, 10) : 16;
  });
  const [showSavedPanel, setShowSavedPanel] = useState(false);

  // Default question selector state
  const [questionSelectorState, setQuestionSelectorState] = useState<QuestionSelectorState>({ type: 'hidden' });
  const [selectedDefaultQuestion, setSelectedDefaultQuestion] = useState<KaiwaDefaultQuestion | null>(null);

  // Advanced session state
  const [sessionMode, setSessionMode] = useState<SessionMode>('default');
  const [selectedAdvancedTopic, setSelectedAdvancedTopic] = useState<KaiwaAdvancedTopic | null>(null);
  const [selectedAdvancedQuestion, setSelectedAdvancedQuestion] = useState<KaiwaAdvancedQuestion | null>(null);

  // Custom topic session state
  const [selectedCustomTopic, setSelectedCustomTopic] = useState<CustomTopic | null>(null);
  const [selectedCustomQuestion, setSelectedCustomQuestion] = useState<CustomTopicQuestion | null>(null);

  // Analysis state
  const [analysisText, setAnalysisText] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Role switching state
  const [selectedScenario, setSelectedScenario] = useState<KaiwaScenario | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  // Evaluation state
  const [evaluation, setEvaluation] = useState<KaiwaEvaluation | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [showEvaluationModal, setShowEvaluationModal] = useState(false);

  // Mic mode state
  const [micMode, setMicMode] = useState<MicMode>('immediate');
  const [showReadingPracticeModal, setShowReadingPracticeModal] = useState(false);
  const [textToRead, setTextToRead] = useState<string>('');

  // Metrics tracking
  const [pronunciationAttempts, setPronunciationAttempts] = useState(0);
  const [totalAccuracy, setTotalAccuracy] = useState(0);

  // Auto-send state
  const [autoSendCountdown, setAutoSendCountdown] = useState<number | null>(null);
  const autoSendTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Computed stats
  const conversationStats = useMemo(() => {
    const userMessages = messages.filter(m => m.role === 'user').length;
    const duration = startTime ? Math.floor((Date.now() - startTime.getTime()) / 60000) : 0;
    return { exchanges: userMessages, duration };
  }, [messages, startTime]);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastSpokenMessageIdRef = useRef<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Hooks
  const speech = useSpeech({
    voiceGender: settings.kaiwaVoiceGender,
    voiceRate: settings.kaiwaVoiceRate,
  });
  const groq = useGroq();
  const groqAdvanced = useGroqAdvanced();

  // Combined loading state
  const isAiLoading = groq.isLoading || groqAdvanced.isLoading;

  // Get current speech rate
  const getSpeechRate = useCallback(() => slowMode ? 0.6 : settings.kaiwaVoiceRate, [slowMode, settings.kaiwaVoiceRate]);

  // Build context
  const getContext = useCallback((): KaiwaContext => ({ level, style, topic }), [level, style, topic]);

  // Handle topic change
  const handleTopicChange = useCallback((newTopic: ConversationTopic) => {
    setTopic(newTopic);
    const scenario = getScenarioByTopic(newTopic);
    if (scenario) {
      setSelectedScenario(scenario);
      setUserRole(scenario.defaultUserRole);
    } else {
      setSelectedScenario(null);
      setUserRole(null);
    }
  }, []);

  // Get user role info
  const getUserRoleInfo = useCallback((): KaiwaRole | null => {
    if (!selectedScenario || !userRole) return null;
    return selectedScenario.roles.find(r => r.id === userRole) || null;
  }, [selectedScenario, userRole]);

  // Build metrics for evaluation
  const buildMetrics = useCallback((): KaiwaMetrics => {
    const userMessages = messages.filter(m => m.role === 'user');
    const avgAccuracy = pronunciationAttempts > 0 ? Math.round(totalAccuracy / pronunciationAttempts) : 0;
    return {
      totalExchanges: userMessages.length,
      durationMinutes: startTime ? Math.floor((Date.now() - startTime.getTime()) / 60000) : 0,
      avgPronunciationAccuracy: avgAccuracy,
      pronunciationAttempts,
      wordsUsed: new Set(userMessages.flatMap(m => removeFurigana(m.content).split(/[\s。、！？]/)).filter(Boolean)),
      grammarPatterns: [],
    };
  }, [messages, pronunciationAttempts, totalAccuracy, startTime]);

  // Helper function to get questions for custom topic
  const getCustomQuestionsForTopic = useCallback((): CustomTopicQuestion[] => {
    if (!selectedCustomTopic) return [];
    if (getCustomTopicQuestionsByTopic) {
      return getCustomTopicQuestionsByTopic(selectedCustomTopic.id);
    }
    return customTopicQuestions.filter(q => q.topicId === selectedCustomTopic.id);
  }, [selectedCustomTopic, getCustomTopicQuestionsByTopic, customTopicQuestions]);

  // Start conversation
  const handleStart = useCallback(async () => {
    setIsStarted(true);
    setStartTime(new Date());
    setMessages([]);
    setAnswerTemplate(null);
    setSuggestedQuestions([]);
    setSavedSentences([]);
    setPronunciationAttempts(0);
    setTotalAccuracy(0);
    setEvaluation(null);
    groq.clearConversation();
    groqAdvanced.clearConversation();

    const contextToUse = getContext();
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

    // Handle advanced session mode
    if (sessionMode === 'advanced' && selectedAdvancedTopic) {
      contextToUse.level = selectedAdvancedTopic.level;
      contextToUse.style = selectedAdvancedTopic.style;
      contextToUse.topic = 'free';

      const specificQuestion = selectedAdvancedQuestion ? {
        id: selectedAdvancedQuestion.id,
        questionJa: selectedAdvancedQuestion.questionJa,
        questionVi: selectedAdvancedQuestion.questionVi,
        level: selectedAdvancedTopic.level,
      } : undefined;

      const response = await groqAdvanced.startAdvancedConversation(
        selectedAdvancedTopic,
        contextToUse,
        specificQuestion
      );

      if (response) {
        const assistantMessage: KaiwaMessage = {
          id: `msg-${Date.now()}`,
          role: 'assistant',
          content: response.text,
          timestamp: new Date().toISOString(),
        };
        setMessages([assistantMessage]);
        if (response.answerTemplate) {
          setAnswerTemplate(response.answerTemplate);
        }
        if (response.suggestions) {
          setSuggestedAnswers(response.suggestions);
        }
        if (response.suggestedQuestions) {
          setSuggestedQuestions(response.suggestedQuestions);
        }
      }
      return;
    } else if (sessionMode === 'custom' && selectedCustomTopic) {
      contextToUse.topic = 'free';

      const customContext = {
        topicName: selectedCustomTopic.name,
        topicDescription: selectedCustomTopic.description,
        vocabulary: [],
      };

      if (selectedCustomQuestion) {
        questionData = {
          questionJa: selectedCustomQuestion.questionJa,
          questionVi: selectedCustomQuestion.questionVi,
          situationContext: selectedCustomQuestion.situationContext,
          suggestedAnswers: selectedCustomQuestion.suggestedAnswers,
          advancedTopicContext: customContext,
        };
      } else {
        const topicQuestions = getCustomQuestionsForTopic();
        const randomQuestion = topicQuestions.length > 0
          ? topicQuestions[Math.floor(Math.random() * topicQuestions.length)]
          : null;

        if (randomQuestion) {
          questionData = {
            questionJa: randomQuestion.questionJa,
            questionVi: randomQuestion.questionVi,
            situationContext: randomQuestion.situationContext,
            suggestedAnswers: randomQuestion.suggestedAnswers,
            advancedTopicContext: customContext,
          };
        } else {
          questionData = {
            questionJa: '',
            advancedTopicContext: customContext,
          };
        }
      }
    } else if (selectedDefaultQuestion) {
      contextToUse.level = selectedDefaultQuestion.level;
      contextToUse.style = selectedDefaultQuestion.style;
      contextToUse.topic = selectedDefaultQuestion.topic;
      questionData = {
        questionJa: selectedDefaultQuestion.questionJa,
        questionVi: selectedDefaultQuestion.questionVi,
        situationContext: selectedDefaultQuestion.situationContext,
        suggestedAnswers: selectedDefaultQuestion.suggestedAnswers,
      };
    }

    const response = await groq.startConversation(contextToUse, questionData);
    if (response) {
      const assistantMessage: KaiwaMessage = {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: response.text,
        timestamp: new Date().toISOString(),
      };
      setMessages([assistantMessage]);
      if (response.answerTemplate) {
        setAnswerTemplate(response.answerTemplate);
      }
      if (response.suggestions) {
        setSuggestedAnswers(response.suggestions);
      }
      if (response.suggestedQuestions) {
        setSuggestedQuestions(response.suggestedQuestions);
      }
    }
  }, [
    sessionMode, selectedAdvancedTopic, selectedAdvancedQuestion, selectedCustomTopic,
    selectedCustomQuestion, selectedDefaultQuestion, getContext, groq, groqAdvanced,
    getCustomQuestionsForTopic
  ]);

  // Send user message
  const handleSend = useCallback(async (text: string) => {
    const isAdvancedMode = sessionMode === 'advanced' && selectedAdvancedTopic;
    if (!text.trim() || isAiLoading) return;

    const userMessage: KaiwaMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: text.trim(),
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setAnswerTemplate(null);
    setSuggestedAnswers([]);
    setSuggestedQuestions([]);
    setActiveSuggestionTab(null);

    const response = isAdvancedMode
      ? await groqAdvanced.sendMessage(text.trim(), getContext(), selectedAdvancedTopic)
      : await groq.sendMessage(text.trim(), getContext());

    if (response) {
      const assistantMessage: KaiwaMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: response.text,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, assistantMessage]);
      if (response.answerTemplate) {
        setAnswerTemplate(response.answerTemplate);
      }
      if (response.suggestions) {
        setSuggestedAnswers(response.suggestions);
      }
      if (response.suggestedQuestions) {
        setSuggestedQuestions(response.suggestedQuestions);
      }
    }
  }, [sessionMode, selectedAdvancedTopic, isAiLoading, getContext, groq, groqAdvanced]);

  // Reset conversation state
  const resetConversation = useCallback(() => {
    setIsStarted(false);
    setStartTime(null);
    setMessages([]);
    setAnswerTemplate(null);
    setSuggestedAnswers([]);
    setSuggestedQuestions([]);
    setSavedSentences([]);
    setIsPracticeMode(false);
    setSelectedSuggestion(null);
    setPronunciationResult(null);
    setActiveSuggestionTab(null);
    setSelectedDefaultQuestion(null);
    setQuestionSelectorState({ type: 'hidden' });
    setSelectedScenario(null);
    setUserRole(null);
    setEvaluation(null);
    setShowEvaluationModal(false);
    setPronunciationAttempts(0);
    setTotalAccuracy(0);
    setSelectedAdvancedTopic(null);
    setSelectedAdvancedQuestion(null);
    setSelectedCustomTopic(null);
    setSelectedCustomQuestion(null);
    speech.stopSpeaking();
    groq.clearConversation();
    groqAdvanced.clearConversation();
  }, [speech, groq, groqAdvanced]);

  // Handle mic button
  const handleMicClick = useCallback(() => {
    if (speech.isListening) {
      speech.stopListening();
    } else {
      speech.startListening();
    }
  }, [speech]);

  // End conversation with optional evaluation
  const handleEnd = useCallback(async (skipEvaluation = false) => {
    if (autoSendTimerRef.current) {
      clearInterval(autoSendTimerRef.current);
      autoSendTimerRef.current = null;
    }
    setAutoSendCountdown(null);

    if (!skipEvaluation && messages.length >= 4) {
      setIsEvaluating(true);
      setShowEvaluationModal(true);
      const metrics = buildMetrics();
      const result = await groq.evaluateConversation(messages, getContext(), metrics);
      setEvaluation(result);
      setIsEvaluating(false);
      return;
    }

    resetConversation();
  }, [messages, buildMetrics, getContext, groq, resetConversation]);

  // Handle evaluation modal close
  const handleEvaluationClose = useCallback(() => {
    setShowEvaluationModal(false);
    resetConversation();
  }, [resetConversation]);

  // Save sentence to favorites
  const handleSaveSentence = useCallback((text: string) => {
    if (!savedSentences.includes(text)) {
      setSavedSentences(prev => [...prev, text]);
    }
  }, [savedSentences]);

  // Quick translate function
  const handleQuickTranslate = useCallback(async (text: string): Promise<string> => {
    return groq.quickTranslate(text);
  }, [groq]);

  // Handle vocabulary hint selection
  const handleSelectHint = useCallback((hint: VocabularyHint) => {
    if (answerTemplate) {
      const cleanWord = removeFurigana(hint.word);

      if (inputText.trim()) {
        const blankMarkers = ['①', '②', '③', '④', '⑤'];
        let filled = false;
        let newText = inputText;

        for (const marker of blankMarkers) {
          if (newText.includes(marker)) {
            newText = newText.replace(marker, cleanWord);
            filled = true;
            break;
          }
        }

        if (!filled && newText.includes('...')) {
          newText = newText.replace('...', cleanWord);
        }

        setInputText(newText);
      } else {
        const cleanPattern = removeFurigana(answerTemplate.pattern);
        let filledText = cleanPattern;
        const blankMarkers = ['①', '②', '③', '④', '⑤', '...'];

        for (const marker of blankMarkers) {
          if (filledText.includes(marker)) {
            filledText = filledText.replace(marker, cleanWord);
            break;
          }
        }

        setInputText(filledText);
      }
    }
  }, [answerTemplate, inputText]);

  // Handle suggested answer click
  const handleSuggestedAnswer = useCallback((answer: string) => {
    const cleanAnswer = removeFurigana(answer.replace(/【[^】]+】/g, '').trim());
    setInputText(cleanAnswer);
  }, []);

  // Handle suggested question click
  const handleSuggestedQuestion = useCallback((question: string) => {
    const cleanQuestion = removeFurigana(question.replace(/【[^】]+】/g, '').trim());
    if (inputText.trim()) {
      setInputText(prev => prev.trim() + ' ' + cleanQuestion);
    } else {
      setInputText(cleanQuestion);
    }
  }, [inputText]);

  // Speak message with tracking
  const handleSpeak = useCallback((messageId: string, text: string, mode: 'normal' | 'slow') => {
    if (speakingMessageId === messageId && speakingMode === mode && speech.isSpeaking) {
      speech.stopSpeaking();
      setSpeakingMessageId(null);
      setSpeakingMode(null);
    } else {
      if (speech.isSpeaking) speech.stopSpeaking();
      speech.speak(text, { rate: mode === 'slow' ? 0.6 : getSpeechRate() });
      setSpeakingMessageId(messageId);
      setSpeakingMode(mode);
    }
  }, [speakingMessageId, speakingMode, speech, getSpeechRate]);

  // Analyze sentence
  const handleAnalyze = useCallback(async (text: string) => {
    setAnalysisText(text);
    setAnalysisResult(null);
    setIsAnalyzing(true);
    try {
      const result = await groq.analyzeJapaneseSentence(text);
      setAnalysisResult(result);
    } catch {
      setAnalysisResult('Có lỗi xảy ra khi phân tích câu.');
    } finally {
      setIsAnalyzing(false);
    }
  }, [groq]);

  // Practice mode handlers
  const handleCancelPractice = useCallback(() => {
    if (autoSendTimerRef.current) {
      clearInterval(autoSendTimerRef.current);
      autoSendTimerRef.current = null;
    }
    setAutoSendCountdown(null);
    setIsPracticeMode(false);
    setSelectedSuggestion(null);
    setPronunciationResult(null);
  }, []);

  const handleRetryPractice = useCallback(() => {
    if (autoSendTimerRef.current) {
      clearInterval(autoSendTimerRef.current);
      autoSendTimerRef.current = null;
    }
    setAutoSendCountdown(null);
    setPronunciationResult(null);
    speech.resetTranscript();
  }, [speech]);

  const handleAcceptPronunciation = useCallback(() => {
    if (autoSendTimerRef.current) {
      clearInterval(autoSendTimerRef.current);
      autoSendTimerRef.current = null;
    }
    setAutoSendCountdown(null);

    if (pronunciationResult) {
      setPronunciationAttempts(prev => prev + 1);
      setTotalAccuracy(prev => prev + pronunciationResult.accuracy);
    }

    if (selectedSuggestion) handleSend(selectedSuggestion.text);
    setIsPracticeMode(false);
    setSelectedSuggestion(null);
    setPronunciationResult(null);
  }, [pronunciationResult, selectedSuggestion, handleSend]);

  // Helper functions for question selector
  const getQuestionsForSelector = useCallback((): KaiwaDefaultQuestion[] => {
    if (questionSelectorState.type !== 'list') return [];
    if (questionSelectorState.folderId && getQuestionsByFolder) {
      return getQuestionsByFolder(questionSelectorState.folderId);
    }
    if (getQuestionsByLevelAndTopic) {
      return getQuestionsByLevelAndTopic(questionSelectorState.level, questionSelectorState.topic);
    }
    return [];
  }, [questionSelectorState, getQuestionsByFolder, getQuestionsByLevelAndTopic]);

  const getFoldersForSelector = useCallback((): KaiwaFolder[] => {
    if (questionSelectorState.type !== 'list') return [];
    if (getFoldersByLevelAndTopic) {
      return getFoldersByLevelAndTopic(questionSelectorState.level, questionSelectorState.topic);
    }
    return [];
  }, [questionSelectorState, getFoldersByLevelAndTopic]);

  const getAdvancedQuestionsForTopic = useCallback((): KaiwaAdvancedQuestion[] => {
    if (!selectedAdvancedTopic) return [];
    if (getAdvancedQuestionsByTopic) {
      return getAdvancedQuestionsByTopic(selectedAdvancedTopic.id);
    }
    return advancedQuestions.filter(q => q.topicId === selectedAdvancedTopic.id);
  }, [selectedAdvancedTopic, getAdvancedQuestionsByTopic, advancedQuestions]);

  // Update voice when settings change
  useEffect(() => {
    speech.setVoiceByGender(settings.kaiwaVoiceGender);
  }, [settings.kaiwaVoiceGender, speech]);

  // Scroll to bottom and focus input when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    if (!isAiLoading) {
      inputRef.current?.focus();
    }
  }, [messages, isAiLoading]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && speech.isSpeaking) {
        speech.stopSpeaking();
        setSpeakingMessageId(null);
        setSpeakingMode(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [speech]);

  // Save font size to localStorage
  useEffect(() => {
    localStorage.setItem('kaiwaFontSize', fontSize.toString());
  }, [fontSize]);

  // Auto-speak assistant messages
  useEffect(() => {
    if (settings.kaiwaAutoSpeak && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === 'assistant' && lastMessage.id !== lastSpokenMessageIdRef.current) {
        lastSpokenMessageIdRef.current = lastMessage.id;
        speech.speak(removeFurigana(lastMessage.content), { rate: getSpeechRate() });
      }
    }
  }, [messages, settings.kaiwaAutoSpeak, getSpeechRate, speech]);

  // Reset speaking state when speech ends
  useEffect(() => {
    if (!speech.isSpeaking && speakingMessageId) {
      setSpeakingMessageId(null);
      setSpeakingMode(null);
    }
  }, [speech.isSpeaking, speakingMessageId]);

  // Handle voice input complete
  useEffect(() => {
    if (speech.transcript && !speech.isListening) {
      if (isPracticeMode && selectedSuggestion) {
        const result = comparePronunciation(speech.transcript, selectedSuggestion.text);
        setPronunciationResult(result);
      } else {
        handleSend(speech.transcript);
      }
      speech.resetTranscript();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speech, isPracticeMode, selectedSuggestion]);

  // Handle auto-send for pronunciation practice
  useEffect(() => {
    if (
      settings.kaiwaSendMode === 'auto' &&
      pronunciationResult &&
      pronunciationResult.accuracy >= settings.kaiwaAutoSendThreshold &&
      !autoSendTimerRef.current
    ) {
      const totalMs = settings.kaiwaAutoSendDelay * 1000;
      let remaining = totalMs;
      setAutoSendCountdown(settings.kaiwaAutoSendDelay);

      autoSendTimerRef.current = setInterval(() => {
        remaining -= 100;
        if (remaining <= 0) {
          clearInterval(autoSendTimerRef.current!);
          autoSendTimerRef.current = null;
          setAutoSendCountdown(null);
          handleAcceptPronunciation();
        } else {
          setAutoSendCountdown(Math.ceil(remaining / 1000));
        }
      }, 100);
    }

    return () => {
      if (autoSendTimerRef.current) {
        clearInterval(autoSendTimerRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pronunciationResult, settings.kaiwaSendMode, settings.kaiwaAutoSendThreshold, settings.kaiwaAutoSendDelay]);

  return {
    // State
    messages,
    answerTemplate,
    suggestedAnswers,
    suggestedQuestions,
    inputText,
    isStarted,
    startTime,
    savedSentences,
    selectedSuggestion,
    pronunciationResult,
    isPracticeMode,
    level,
    style,
    topic,
    slowMode,
    showFurigana,
    speakingMessageId,
    speakingMode,
    showSuggestionTabs,
    activeSuggestionTab,
    fontSize,
    showSavedPanel,
    questionSelectorState,
    selectedDefaultQuestion,
    sessionMode,
    selectedAdvancedTopic,
    selectedAdvancedQuestion,
    selectedCustomTopic,
    selectedCustomQuestion,
    analysisText,
    analysisResult,
    isAnalyzing,
    selectedScenario,
    userRole,
    evaluation,
    isEvaluating,
    showEvaluationModal,
    micMode,
    showReadingPracticeModal,
    textToRead,
    pronunciationAttempts,
    totalAccuracy,
    autoSendCountdown,
    conversationStats,
    isAiLoading,

    // Refs
    messagesEndRef,
    inputRef,

    // Hooks
    speech,
    groq,

    // Setters
    setInputText,
    setMessages,
    setSlowMode,
    setShowFurigana,
    setShowSuggestionTabs,
    setActiveSuggestionTab,
    setFontSize,
    setShowSavedPanel,
    setQuestionSelectorState,
    setSelectedDefaultQuestion,
    setLevel,
    setStyle,
    setTopic,
    setSessionMode,
    setSelectedAdvancedTopic,
    setSelectedAdvancedQuestion,
    setSelectedCustomTopic,
    setSelectedCustomQuestion,
    setSavedSentences,
    setAnalysisText,
    setAnalysisResult,
    setUserRole,
    setMicMode,
    setShowReadingPracticeModal,
    setTextToRead,
    setPronunciationAttempts,
    setTotalAccuracy,

    // Handlers
    handleStart,
    handleSend,
    handleEnd,
    handleMicClick,
    handleEvaluationClose,
    handleSaveSentence,
    handleQuickTranslate,
    handleSelectHint,
    handleSuggestedAnswer,
    handleSuggestedQuestion,
    handleSpeak,
    handleAnalyze,
    handleCancelPractice,
    handleRetryPractice,
    handleAcceptPronunciation,
    handleTopicChange,

    // Computed
    getSpeechRate,
    getContext,
    getUserRoleInfo,
    getQuestionsForSelector,
    getFoldersForSelector,
    getAdvancedQuestionsForTopic,
    getCustomQuestionsForTopic,
  };
}
