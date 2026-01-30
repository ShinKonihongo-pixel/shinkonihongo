// Kaiwa (Japanese conversation) practice page with AI assistant

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type { KaiwaMessage, KaiwaContext, JLPTLevel, ConversationStyle, ConversationTopic, PronunciationResult, AnswerTemplate, SuggestedAnswer, KaiwaScenario, KaiwaRole, KaiwaEvaluation, KaiwaMetrics } from '../../types/kaiwa';
import type { KaiwaDefaultQuestion, KaiwaFolder } from '../../types/kaiwa-question';
import type { KaiwaAdvancedTopic, KaiwaAdvancedQuestion } from '../../types/kaiwa-advanced';
import type { CustomTopic, CustomTopicQuestion } from '../../types/custom-topic';
import type { KaiwaPageProps, SessionMode, QuestionSelectorState } from './kaiwa/kaiwa-page-types';
import { useSpeech, comparePronunciation } from '../../hooks/use-speech';
import { useGroq } from '../../hooks/use-groq';
import { useGroqAdvanced } from '../../hooks/use-groq-advanced';
import { JLPT_LEVELS, CONVERSATION_STYLES, CONVERSATION_TOPICS, getStyleDisplay, getScenarioByTopic } from '../../constants/kaiwa';
import { KaiwaMessageItem, KaiwaPracticeModal, KaiwaAnalysisModal, KaiwaAnswerTemplate, KaiwaEvaluationModal } from '../kaiwa';
import type { VocabularyHint } from '../../types/kaiwa';
import { removeFurigana } from '../../lib/furigana-utils';
import { FuriganaText } from '../common/furigana-text';
import {
  Sparkles,
  MessagesSquare,
  CircleHelp,
  Mic,
  Volume2,
  Copy,
  Trash2,
  X,
  Send,
  Gauge,
  Bookmark,
  RefreshCw,
  Clock,
  ChevronRight,
  Folder,
  FileText,
  ArrowLeft,
  ListChecks,
  Users,
  Zap,
  Award,
  Star,
  BookOpen,
  MessageCircle,
} from 'lucide-react';

export function KaiwaPage({
  settings,
  defaultQuestions = [],
  kaiwaFolders: _kaiwaFolders = [],
  getFoldersByLevelAndTopic,
  getQuestionsByFolder,
  getQuestionsByLevelAndTopic,
  advancedTopics = [],
  advancedQuestions = [],
  getAdvancedQuestionsByTopic,
  customTopics = [],
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

  // Combined loading state for both AI hooks
  const isAiLoading = groq.isLoading || groqAdvanced.isLoading;

  // Get current speech rate
  const getSpeechRate = useCallback(() => slowMode ? 0.6 : settings.kaiwaVoiceRate, [slowMode, settings.kaiwaVoiceRate]);

  // Build context
  const getContext = useCallback((): KaiwaContext => ({ level, style, topic }), [level, style, topic]);

  // Handle topic change - detect if scenario exists
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

  // Get AI role info (opposite of user) - may be used for role display
  const _getAiRoleInfo = useCallback((): KaiwaRole | null => {
    if (!selectedScenario || !userRole) return null;
    return selectedScenario.roles.find(r => r.id !== userRole) || null;
  }, [selectedScenario, userRole]);
  // Suppress unused warning - reserved for future use
  void _getAiRoleInfo;

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

  // Update voice when settings change
  useEffect(() => {
    speech.setVoiceByGender(settings.kaiwaVoiceGender);
  }, [settings.kaiwaVoiceGender, speech.setVoiceByGender]);

  // Scroll to bottom and focus input when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    // Auto-focus input after AI responds
    if (!isAiLoading) {
      inputRef.current?.focus();
    }
  }, [messages, isAiLoading]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape to stop speaking
      if (e.key === 'Escape' && speech.isSpeaking) {
        speech.stopSpeaking();
        setSpeakingMessageId(null);
        setSpeakingMode(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [speech.isSpeaking, speech.stopSpeaking]);

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
  }, [speech.transcript, speech.isListening, isPracticeMode, selectedSuggestion]);

  // Start conversation
  const handleStart = async () => {
    setIsStarted(true);
    setStartTime(new Date());
    setMessages([]);
    setAnswerTemplate(null);
    setSuggestedQuestions([]);
    setSavedSentences([]);
    // Reset metrics
    setPronunciationAttempts(0);
    setTotalAccuracy(0);
    setEvaluation(null);
    groq.clearConversation();
    groqAdvanced.clearConversation();

    // If a default question is selected, use its context
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

    // Handle advanced session mode - Use specialized AI teacher
    if (sessionMode === 'advanced' && selectedAdvancedTopic) {
      contextToUse.level = selectedAdvancedTopic.level;
      contextToUse.style = selectedAdvancedTopic.style;
      contextToUse.topic = 'free';

      // Use the specialized advanced AI for better teaching
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
      return; // Exit early - handled by advanced hook
    } else if (sessionMode === 'custom' && selectedCustomTopic) {
      // Custom topic mode
      contextToUse.topic = 'free'; // Custom topics are custom

      // Build custom topic context for AI
      const customContext = {
        topicName: selectedCustomTopic.name,
        topicDescription: selectedCustomTopic.description,
        vocabulary: [], // Custom topics don't have vocabulary yet
      };

      // If a specific question is selected, use it
      if (selectedCustomQuestion) {
        questionData = {
          questionJa: selectedCustomQuestion.questionJa,
          questionVi: selectedCustomQuestion.questionVi,
          situationContext: selectedCustomQuestion.situationContext,
          suggestedAnswers: selectedCustomQuestion.suggestedAnswers,
          advancedTopicContext: customContext,
        };
      } else {
        // Get a random question from the topic
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
          // No questions, just use topic context
          questionData = {
            questionJa: '',
            advancedTopicContext: customContext,
          };
        }
      }
    } else if (selectedDefaultQuestion) {
      // Default question mode
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

    // Start conversation with optional question data
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
  };

  // Send user message
  const handleSend = async (text: string) => {
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

    // Use advanced AI for advanced topics
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
  };

  // Handle mic button
  const handleMicClick = () => {
    speech.isListening ? speech.stopListening() : speech.startListening();
  };

  // End conversation with optional evaluation
  const handleEnd = async (skipEvaluation = false) => {
    // Cancel any auto-send timer
    if (autoSendTimerRef.current) {
      clearInterval(autoSendTimerRef.current);
      autoSendTimerRef.current = null;
    }
    setAutoSendCountdown(null);

    // Trigger evaluation if enough exchanges
    if (!skipEvaluation && messages.length >= 4) {
      setIsEvaluating(true);
      setShowEvaluationModal(true);
      const metrics = buildMetrics();
      const result = await groq.evaluateConversation(messages, getContext(), metrics);
      setEvaluation(result);
      setIsEvaluating(false);
      return; // Don't reset yet, let modal close trigger it
    }

    // Reset everything
    resetConversation();
  };

  // Reset conversation state
  const resetConversation = () => {
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
    // Reset advanced session state
    setSelectedAdvancedTopic(null);
    setSelectedAdvancedQuestion(null);
    // Reset custom topic state
    setSelectedCustomTopic(null);
    setSelectedCustomQuestion(null);
    speech.stopSpeaking();
    groq.clearConversation();
    groqAdvanced.clearConversation();
  };

  // Handle evaluation modal close
  const handleEvaluationClose = () => {
    setShowEvaluationModal(false);
    resetConversation();
  };

  // Save sentence to favorites
  const handleSaveSentence = (text: string) => {
    if (!savedSentences.includes(text)) {
      setSavedSentences(prev => [...prev, text]);
    }
  };

  // Quick translate function
  const handleQuickTranslate = async (text: string): Promise<string> => {
    return groq.quickTranslate(text);
  };

  // Handle vocabulary hint selection - fill template pattern with selected word
  const handleSelectHint = (hint: VocabularyHint) => {
    if (answerTemplate) {
      const cleanWord = removeFurigana(hint.word);

      // If input already has content, find next unfilled blank and replace
      if (inputText.trim()) {
        // Check for numbered blanks ①②③ first
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

        // If no numbered blank, try ... placeholder
        if (!filled && newText.includes('...')) {
          newText = newText.replace('...', cleanWord);
        }

        setInputText(newText);
      } else {
        // Start fresh with template pattern
        const cleanPattern = removeFurigana(answerTemplate.pattern);
        // Replace first blank (①, ②, ③ or ...)
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
  };

  // Handle suggested answer click - fill input
  const handleSuggestedAnswer = (answer: string) => {
    // Remove strategy labels like 【直接＋理由】 and furigana
    const cleanAnswer = removeFurigana(answer.replace(/【[^】]+】/g, '').trim());
    setInputText(cleanAnswer);
  };

  // Handle suggested question click - append to input if has content, otherwise replace
  const handleSuggestedQuestion = (question: string) => {
    // Remove strategy labels and furigana
    const cleanQuestion = removeFurigana(question.replace(/【[^】]+】/g, '').trim());
    if (inputText.trim()) {
      // Append to existing input
      setInputText(prev => prev.trim() + ' ' + cleanQuestion);
    } else {
      setInputText(cleanQuestion);
    }
  };

  // Speak message with tracking
  const handleSpeak = (messageId: string, text: string, mode: 'normal' | 'slow') => {
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
  };

  // Analyze sentence
  const handleAnalyze = async (text: string) => {
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
  };

  // Practice mode handlers
  const handleCancelPractice = () => {
    // Cancel auto-send timer
    if (autoSendTimerRef.current) {
      clearInterval(autoSendTimerRef.current);
      autoSendTimerRef.current = null;
    }
    setAutoSendCountdown(null);
    setIsPracticeMode(false);
    setSelectedSuggestion(null);
    setPronunciationResult(null);
  };

  const handleRetryPractice = () => {
    // Cancel auto-send timer
    if (autoSendTimerRef.current) {
      clearInterval(autoSendTimerRef.current);
      autoSendTimerRef.current = null;
    }
    setAutoSendCountdown(null);
    setPronunciationResult(null);
    speech.resetTranscript();
  };

  const handleAcceptPronunciation = () => {
    // Cancel auto-send timer
    if (autoSendTimerRef.current) {
      clearInterval(autoSendTimerRef.current);
      autoSendTimerRef.current = null;
    }
    setAutoSendCountdown(null);

    // Track metrics
    if (pronunciationResult) {
      setPronunciationAttempts(prev => prev + 1);
      setTotalAccuracy(prev => prev + pronunciationResult.accuracy);
    }

    if (selectedSuggestion) handleSend(selectedSuggestion.text);
    setIsPracticeMode(false);
    setSelectedSuggestion(null);
    setPronunciationResult(null);
  };

  // Handle auto-send for pronunciation practice
  useEffect(() => {
    if (
      settings.kaiwaSendMode === 'auto' &&
      pronunciationResult &&
      pronunciationResult.accuracy >= settings.kaiwaAutoSendThreshold &&
      !autoSendTimerRef.current
    ) {
      // Start countdown
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
  }, [pronunciationResult, settings.kaiwaSendMode, settings.kaiwaAutoSendThreshold, settings.kaiwaAutoSendDelay]);

  // Helper function to get questions for current selector state
  const getQuestionsForSelector = (): KaiwaDefaultQuestion[] => {
    if (questionSelectorState.type !== 'list') return [];
    if (questionSelectorState.folderId && getQuestionsByFolder) {
      return getQuestionsByFolder(questionSelectorState.folderId);
    }
    if (getQuestionsByLevelAndTopic) {
      return getQuestionsByLevelAndTopic(questionSelectorState.level, questionSelectorState.topic);
    }
    return [];
  };

  // Helper function to get questions for selected advanced topic
  const getAdvancedQuestionsForTopic = (): KaiwaAdvancedQuestion[] => {
    if (!selectedAdvancedTopic) return [];
    if (getAdvancedQuestionsByTopic) {
      return getAdvancedQuestionsByTopic(selectedAdvancedTopic.id);
    }
    return advancedQuestions.filter(q => q.topicId === selectedAdvancedTopic.id);
  };

  // Helper function to get questions for selected custom topic
  const getCustomQuestionsForTopic = (): CustomTopicQuestion[] => {
    if (!selectedCustomTopic) return [];
    if (getCustomTopicQuestionsByTopic) {
      return getCustomTopicQuestionsByTopic(selectedCustomTopic.id);
    }
    return customTopicQuestions.filter(q => q.topicId === selectedCustomTopic.id);
  };

  // Helper function to get folders for current selector state
  const getFoldersForSelector = (): KaiwaFolder[] => {
    if (questionSelectorState.type !== 'list') return [];
    if (getFoldersByLevelAndTopic) {
      return getFoldersByLevelAndTopic(questionSelectorState.level, questionSelectorState.topic);
    }
    return [];
  };

  // Render start screen
  if (!isStarted) {
    // Check if there are any default questions
    const hasDefaultQuestions = defaultQuestions.length > 0;

    return (
      <div className="kaiwa-page kaiwa-page-start">
        <div className="kaiwa-container">
        <div className="kaiwa-start-screen">
          <h2>会話練習 - Luyện Hội Thoại</h2>
          <p className="kaiwa-description">
            Luyện tập hội thoại tiếng Nhật với trợ lý AI. Bạn có thể nói hoặc gõ để trả lời.
          </p>

          {/* Session Mode Selector */}
          {(advancedTopics.length > 0 || customTopics.length > 0) && (
            <div className="kaiwa-session-mode-selector">
              <button
                className={`session-mode-btn ${sessionMode === 'default' ? 'active' : ''}`}
                onClick={() => {
                  setSessionMode('default');
                  setSelectedAdvancedTopic(null);
                  setSelectedAdvancedQuestion(null);
                  setSelectedCustomTopic(null);
                  setSelectedCustomQuestion(null);
                }}
              >
                <MessagesSquare size={18} />
                <span>Hội thoại cơ bản</span>
              </button>
              {advancedTopics.length > 0 && (
                <button
                  className={`session-mode-btn ${sessionMode === 'advanced' ? 'active' : ''}`}
                  onClick={() => {
                    setSessionMode('advanced');
                    setSelectedDefaultQuestion(null);
                    setQuestionSelectorState({ type: 'hidden' });
                    setSelectedCustomTopic(null);
                    setSelectedCustomQuestion(null);
                  }}
                >
                  <Star size={18} />
                  <span>Session nâng cao</span>
                </button>
              )}
              {customTopics.length > 0 && (
                <button
                  className={`session-mode-btn ${sessionMode === 'custom' ? 'active' : ''}`}
                  onClick={() => {
                    setSessionMode('custom');
                    setSelectedDefaultQuestion(null);
                    setQuestionSelectorState({ type: 'hidden' });
                    setSelectedAdvancedTopic(null);
                    setSelectedAdvancedQuestion(null);
                  }}
                >
                  <BookOpen size={18} />
                  <span>Chủ đề mở rộng</span>
                </button>
              )}
            </div>
          )}

          {/* Advanced Session - Topic Selector */}
          {sessionMode === 'advanced' && advancedTopics.length > 0 && (
            <div className="kaiwa-advanced-session">
              <div className="advanced-session-header">
                <h3><Star size={18} /> Chọn chủ đề nâng cao</h3>
                {selectedAdvancedTopic && (
                  <button
                    className="kaiwa-clear-selection-btn"
                    onClick={() => {
                      setSelectedAdvancedTopic(null);
                      setSelectedAdvancedQuestion(null);
                    }}
                  >
                    <X size={14} /> Bỏ chọn
                  </button>
                )}
              </div>

              {/* Topics Grid */}
              {!selectedAdvancedTopic && (
                <div className="advanced-topics-grid">
                  {advancedTopics.map(topic => (
                    <button
                      key={topic.id}
                      className="advanced-topic-card"
                      style={{ '--topic-color': topic.color } as React.CSSProperties}
                      onClick={() => setSelectedAdvancedTopic(topic)}
                    >
                      <span className="topic-icon" style={{ backgroundColor: `${topic.color}20` }}>
                        {topic.icon}
                      </span>
                      <div className="topic-info">
                        <span className="topic-name">{topic.name}</span>
                        <span className="topic-meta">
                          <span className="topic-level">{topic.level}</span>
                          <span className="topic-count">
                            <MessageCircle size={12} /> {topic.questionCount || 0}
                          </span>
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Selected Topic Preview */}
              {selectedAdvancedTopic && (
                <div className="advanced-topic-selected" style={{ '--topic-color': selectedAdvancedTopic.color } as React.CSSProperties}>
                  <div className="selected-topic-header">
                    <span className="topic-icon" style={{ backgroundColor: `${selectedAdvancedTopic.color}20` }}>
                      {selectedAdvancedTopic.icon}
                    </span>
                    <div className="topic-details">
                      <h4>{selectedAdvancedTopic.name}</h4>
                      <p>{selectedAdvancedTopic.description}</p>
                      <div className="topic-badges">
                        <span className="badge">{selectedAdvancedTopic.level}</span>
                        <span className="badge">{CONVERSATION_STYLES.find(s => s.value === selectedAdvancedTopic.style)?.label}</span>
                      </div>
                    </div>
                  </div>

                  {/* Topic Vocabulary Preview */}
                  {selectedAdvancedTopic.vocabulary && selectedAdvancedTopic.vocabulary.length > 0 && (
                    <div className="topic-vocab-preview">
                      <h5><BookOpen size={14} /> Từ vựng ({selectedAdvancedTopic.vocabulary.length})</h5>
                      <div className="vocab-chips">
                        {selectedAdvancedTopic.vocabulary.slice(0, 8).map(vocab => (
                          <span key={vocab.id} className="vocab-chip">
                            {vocab.word}
                            <span className="vocab-meaning">{vocab.meaning}</span>
                          </span>
                        ))}
                        {selectedAdvancedTopic.vocabulary.length > 8 && (
                          <span className="vocab-chip more">+{selectedAdvancedTopic.vocabulary.length - 8}</span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Question Selector */}
                  {getAdvancedQuestionsForTopic().length > 0 && (
                    <div className="topic-questions-selector">
                      <h5><MessageCircle size={14} /> Chọn câu hỏi (hoặc để ngẫu nhiên)</h5>
                      <div className="questions-list">
                        {getAdvancedQuestionsForTopic().map((q, idx) => (
                          <button
                            key={q.id}
                            className={`question-item ${selectedAdvancedQuestion?.id === q.id ? 'selected' : ''}`}
                            onClick={() => setSelectedAdvancedQuestion(
                              selectedAdvancedQuestion?.id === q.id ? null : q
                            )}
                          >
                            <span className="question-num">{idx + 1}</span>
                            <div className="question-text">
                              <span className="ja">{q.questionJa}</span>
                              {q.questionVi && <span className="vi">{q.questionVi}</span>}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Custom Topics Session Selector */}
          {sessionMode === 'custom' && customTopics.length > 0 && (
            <div className="kaiwa-custom-session">
              <div className="custom-session-header">
                <h3><BookOpen size={18} /> Chọn chủ đề mở rộng</h3>
              </div>

              {/* Custom Topics Grid - Always visible, shows selection state */}
              <div className="custom-topics-grid">
                {customTopics.map(topic => (
                  <button
                    key={topic.id}
                    className={`custom-topic-card ${selectedCustomTopic?.id === topic.id ? 'selected' : ''}`}
                    style={{ '--topic-color': topic.color } as React.CSSProperties}
                    onClick={() => setSelectedCustomTopic(
                      selectedCustomTopic?.id === topic.id ? null : topic
                    )}
                  >
                    <span className="topic-icon" style={{ backgroundColor: `${topic.color}20` }}>
                      {topic.icon}
                    </span>
                    <div className="topic-info">
                      <span className="topic-name">{topic.name}</span>
                      <span className="topic-meta">
                        <span className="topic-count">
                          <MessageCircle size={12} /> {topic.questionCount || 0}
                        </span>
                      </span>
                    </div>
                  </button>
                ))}
              </div>

              {/* Start Conversation Button - Centered, only active when topic selected */}
              <div className="custom-start-section">
                <button
                  className={`kaiwa-start-btn ${selectedCustomTopic ? 'active' : 'disabled'}`}
                  disabled={!selectedCustomTopic}
                  onClick={() => {
                    if (selectedCustomTopic) {
                      // Pick a random question from the topic if available
                      const topicQuestions = getCustomQuestionsForTopic();
                      if (topicQuestions.length > 0) {
                        const randomQuestion = topicQuestions[Math.floor(Math.random() * topicQuestions.length)];
                        setSelectedCustomQuestion(randomQuestion);
                      }
                      handleStart();
                    }
                  }}
                >
                  <MessagesSquare size={20} />
                  Bắt đầu hội thoại
                </button>
                {selectedCustomTopic && (
                  <p className="start-hint">
                    AI sẽ ngẫu nhiên chọn câu hỏi hoặc sử dụng nguồn từ vựng để luyện giao tiếp
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Default question selector section */}
          {sessionMode === 'default' && hasDefaultQuestions && (
            <div className="kaiwa-question-selector-section">
              <div className="kaiwa-selector-header">
                <button
                  className={`kaiwa-mode-btn ${questionSelectorState.type !== 'hidden' ? 'active' : ''}`}
                  onClick={() => setQuestionSelectorState(
                    questionSelectorState.type === 'hidden' ? { type: 'level' } : { type: 'hidden' }
                  )}
                >
                  <ListChecks size={18} />
                  {questionSelectorState.type === 'hidden' ? 'Chọn câu hỏi mặc định' : 'Ẩn danh sách'}
                </button>
                {selectedDefaultQuestion && (
                  <button
                    className="kaiwa-clear-selection-btn"
                    onClick={() => {
                      setSelectedDefaultQuestion(null);
                      setQuestionSelectorState({ type: 'hidden' });
                    }}
                  >
                    <X size={14} /> Bỏ chọn
                  </button>
                )}
              </div>

              {/* Selected question preview */}
              {selectedDefaultQuestion && (
                <div className="kaiwa-selected-question-preview">
                  <div className="selected-question-badges">
                    <span className="badge">{selectedDefaultQuestion.level}</span>
                    <span className="badge">{CONVERSATION_TOPICS.find(t => t.value === selectedDefaultQuestion.topic)?.label}</span>
                    <span className="badge">{CONVERSATION_STYLES.find(s => s.value === selectedDefaultQuestion.style)?.label}</span>
                  </div>
                  <p className="selected-question-text">{selectedDefaultQuestion.questionJa}</p>
                  {selectedDefaultQuestion.questionVi && (
                    <p className="selected-question-vi">{selectedDefaultQuestion.questionVi}</p>
                  )}
                  {selectedDefaultQuestion.situationContext && (
                    <p className="selected-question-context">📍 {selectedDefaultQuestion.situationContext}</p>
                  )}
                </div>
              )}

              {/* Question selector navigation */}
              {questionSelectorState.type !== 'hidden' && (
                <div className="kaiwa-question-selector">
                  {/* Breadcrumb */}
                  <div className="selector-breadcrumb">
                    {questionSelectorState.type === 'level' && (
                      <span>Chọn cấp độ</span>
                    )}
                    {questionSelectorState.type === 'topic' && (
                      <>
                        <button onClick={() => setQuestionSelectorState({ type: 'level' })}>
                          <ArrowLeft size={14} />
                        </button>
                        <span>{questionSelectorState.level}</span>
                        <ChevronRight size={14} />
                        <span>Chọn chủ đề</span>
                      </>
                    )}
                    {questionSelectorState.type === 'list' && (
                      <>
                        <button onClick={() => setQuestionSelectorState({ type: 'topic', level: questionSelectorState.level })}>
                          <ArrowLeft size={14} />
                        </button>
                        <span>{questionSelectorState.level}</span>
                        <ChevronRight size={14} />
                        <span>{CONVERSATION_TOPICS.find(t => t.value === questionSelectorState.topic)?.label}</span>
                        {questionSelectorState.folderName && (
                          <>
                            <ChevronRight size={14} />
                            <span>{questionSelectorState.folderName}</span>
                          </>
                        )}
                      </>
                    )}
                  </div>

                  {/* Level selection */}
                  {questionSelectorState.type === 'level' && (
                    <div className="selector-grid levels">
                      {JLPT_LEVELS.map(l => (
                        <button
                          key={l.value}
                          className="selector-item level"
                          onClick={() => setQuestionSelectorState({ type: 'topic', level: l.value })}
                        >
                          {l.label}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Topic selection */}
                  {questionSelectorState.type === 'topic' && (
                    <div className="selector-grid topics">
                      {CONVERSATION_TOPICS.filter(t => t.value !== 'free').map(t => (
                        <button
                          key={t.value}
                          className="selector-item topic"
                          onClick={() => setQuestionSelectorState({
                            type: 'list',
                            level: questionSelectorState.level,
                            topic: t.value,
                          })}
                        >
                          <span className="topic-icon">{t.icon}</span>
                          <span className="topic-label">{t.label}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Question list */}
                  {questionSelectorState.type === 'list' && (
                    <div className="selector-question-list">
                      {/* Show folders if not inside a folder */}
                      {!questionSelectorState.folderId && getFoldersForSelector().length > 0 && (
                        <div className="selector-folders">
                          {getFoldersForSelector().map(folder => (
                            <button
                              key={folder.id}
                              className="selector-folder-btn"
                              onClick={() => setQuestionSelectorState({
                                ...questionSelectorState,
                                folderId: folder.id,
                                folderName: folder.name,
                              })}
                            >
                              <Folder size={16} />
                              <span>{folder.name}</span>
                              <ChevronRight size={14} />
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Show questions */}
                      <div className="selector-questions">
                        {getQuestionsForSelector().map(q => (
                          <button
                            key={q.id}
                            className={`selector-question-btn ${selectedDefaultQuestion?.id === q.id ? 'selected' : ''}`}
                            onClick={() => {
                              setSelectedDefaultQuestion(q);
                              setLevel(q.level);
                              setStyle(q.style);
                              setTopic(q.topic);
                              setQuestionSelectorState({ type: 'hidden' });
                            }}
                          >
                            <FileText size={14} />
                            <div className="question-content">
                              <span className="question-ja">{q.questionJa}</span>
                              {q.questionVi && <span className="question-vi">{q.questionVi}</span>}
                            </div>
                          </button>
                        ))}
                        {getQuestionsForSelector().length === 0 && (
                          <p className="no-questions">Chưa có câu hỏi nào trong mục này</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Free conversation setup (only show if no default question selected and not in advanced/custom mode) */}
          {!selectedDefaultQuestion && sessionMode !== 'advanced' && sessionMode !== 'custom' && (
            <div className="kaiwa-setup">
              <div className="kaiwa-setup-row">
                <div className="kaiwa-setup-item">
                  <label>Cấp độ JLPT</label>
                  <select value={level} onChange={e => setLevel(e.target.value as JLPTLevel)}>
                    {JLPT_LEVELS.map(l => (
                      <option key={l.value} value={l.value}>{l.label}</option>
                    ))}
                  </select>
                </div>

                <div className="kaiwa-setup-item">
                  <label>Phong cách nói</label>
                  <select value={style} onChange={e => setStyle(e.target.value as ConversationStyle)}>
                    {CONVERSATION_STYLES.map(s => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="kaiwa-setup-item kaiwa-topic-section">
                <label>Chủ đề hội thoại</label>
                <div className="kaiwa-topic-grid">
                  {CONVERSATION_TOPICS.map(t => (
                    <button
                      key={t.value}
                      className={`kaiwa-topic-btn ${topic === t.value ? 'active' : ''}`}
                      onClick={() => handleTopicChange(t.value)}
                    >
                      <span className="topic-icon">{t.icon}</span>
                      <span className="topic-label">{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Role Selector - shows when scenario topic is selected */}
              {selectedScenario && (
                <div className="kaiwa-setup-item kaiwa-role-section">
                  <label>
                    <Users size={16} />
                    Chọn vai trò của bạn
                  </label>
                  <div className="kaiwa-role-grid">
                    {selectedScenario.roles.map(role => (
                      <button
                        key={role.id}
                        className={`kaiwa-role-btn ${userRole === role.id ? 'active' : ''}`}
                        onClick={() => setUserRole(role.id)}
                      >
                        <span className="role-emoji">{role.emoji}</span>
                        <span className="role-name">{role.name}</span>
                        <span className="role-name-vi">{role.nameVi}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Options row - hide in custom mode */}
          {sessionMode !== 'custom' && (
            <div className="kaiwa-setup-item kaiwa-options-row">
              <label>
                <input
                  type="checkbox"
                  checked={slowMode}
                  onChange={e => setSlowMode(e.target.checked)}
                />
                Chế độ chậm (luyện nghe)
              </label>
              <span className="kaiwa-voice-info">
                Giọng: {settings.kaiwaVoiceGender === 'female' ? 'Nữ' : 'Nam'}
              </span>
            </div>
          )}

          {!speech.recognitionSupported && (
            <p className="kaiwa-warning">
              Trình duyệt không hỗ trợ nhận dạng giọng nói. Vui lòng dùng Chrome.
            </p>
          )}

          {/* Start button - hide in custom mode (has its own button) */}
          {sessionMode !== 'custom' && (
            <button
              className="btn btn-primary btn-large"
              onClick={handleStart}
              disabled={sessionMode === 'advanced' && !selectedAdvancedTopic}
            >
              {sessionMode === 'advanced' && selectedAdvancedTopic
                ? `Bắt đầu: ${selectedAdvancedTopic.name}`
                : selectedDefaultQuestion
                  ? 'Bắt đầu với câu hỏi đã chọn'
                  : 'Bắt đầu hội thoại'}
            </button>
          )}
        </div>
        </div>
      </div>
    );
  }

  // Get current topic info
  const currentTopic = CONVERSATION_TOPICS.find(t => t.value === topic);

  // Render conversation screen
  return (
    <div className="kaiwa-page">
      <div className="kaiwa-container">
      <div className="kaiwa-header">
        <div className="kaiwa-header-left">
          <h2>会話練習</h2>
          <div className="kaiwa-info">
            <span className="kaiwa-badge">{level}</span>
            <span className="kaiwa-badge">{getStyleDisplay(style)}</span>
            {selectedAdvancedTopic ? (
              <span className="kaiwa-badge topic advanced" style={{ borderColor: selectedAdvancedTopic.color }}>
                {selectedAdvancedTopic.icon} {selectedAdvancedTopic.name}
              </span>
            ) : selectedCustomTopic ? (
              <span className="kaiwa-badge topic custom" style={{ borderColor: selectedCustomTopic.color }}>
                {selectedCustomTopic.icon} {selectedCustomTopic.name}
              </span>
            ) : (
              <span className="kaiwa-badge topic">{currentTopic?.icon} {currentTopic?.label.split(' ')[0]}</span>
            )}
            {getUserRoleInfo() && (
              <span className="kaiwa-badge role">
                {getUserRoleInfo()?.emoji} {getUserRoleInfo()?.nameVi}
              </span>
            )}
          </div>
        </div>
        <div className="kaiwa-header-center">
          <div className="kaiwa-stats">
            <span className="kaiwa-stat" title="Số lượt trao đổi"><MessagesSquare size={14} /> {conversationStats.exchanges}</span>
            <span className="kaiwa-stat" title="Thời gian"><Clock size={14} /> {conversationStats.duration}m</span>
            {savedSentences.length > 0 && (
              <button
                className={`kaiwa-stat saved ${showSavedPanel ? 'active' : ''}`}
                onClick={() => setShowSavedPanel(!showSavedPanel)}
                title="Xem câu đã lưu"
              >
                <Bookmark size={14} /> {savedSentences.length}
              </button>
            )}
          </div>
        </div>
        <div className="kaiwa-header-right">
          <button
            className="kaiwa-restart-btn"
            onClick={() => handleStart()}
            disabled={isAiLoading}
            title="Bắt đầu lại từ đầu"
          >
            <RefreshCw size={14} /> Lại từ đầu
          </button>
          <button
            className={`kaiwa-send-mode-btn ${settings.kaiwaSendMode === 'auto' ? 'active' : ''}`}
            onClick={() => {
              // Toggle send mode (only in settings page, but show status here)
            }}
            title={settings.kaiwaSendMode === 'auto' ? 'Chế độ tự động gửi' : 'Chế độ gửi thủ công'}
          >
            <Zap size={14} /> {settings.kaiwaSendMode === 'auto' ? 'Auto' : 'Manual'}
          </button>
          <button
            className={`kaiwa-slow-btn ${slowMode ? 'active' : ''}`}
            onClick={() => setSlowMode(!slowMode)}
            title={slowMode ? 'Tắt chế độ chậm' : 'Bật chế độ chậm'}
          >
            <Gauge size={14} /> {slowMode ? 'Chậm' : 'Thường'}
          </button>
          <button
            className={`kaiwa-furigana-btn ${showFurigana ? 'active' : ''}`}
            onClick={() => setShowFurigana(!showFurigana)}
            title={showFurigana ? 'Ẩn furigana' : 'Hiện furigana'}
          >
            あ {showFurigana ? 'ON' : 'OFF'}
          </button>
          <div className="kaiwa-fontsize-control">
            <button
              className="kaiwa-fontsize-btn"
              onClick={() => setFontSize(prev => Math.max(12, prev - 2))}
              title="Giảm cỡ chữ"
            >
              A-
            </button>
            <span className="kaiwa-fontsize-value">{fontSize}</span>
            <button
              className="kaiwa-fontsize-btn"
              onClick={() => setFontSize(prev => Math.min(28, prev + 2))}
              title="Tăng cỡ chữ"
            >
              A+
            </button>
          </div>
          {messages.length >= 4 && (
            <button
              className="kaiwa-eval-btn"
              onClick={() => handleEnd(false)}
              disabled={isAiLoading || isEvaluating}
              title="Đánh giá và kết thúc"
            >
              <Award size={14} /> Đánh giá
            </button>
          )}
          <button className="btn btn-danger btn-small kaiwa-end-btn" onClick={() => handleEnd(true)}>
            Kết thúc
          </button>
        </div>
      </div>

      <div className="kaiwa-messages">
        {messages.map(msg => (
          <KaiwaMessageItem
            key={msg.id}
            message={msg}
            speakingMessageId={speakingMessageId}
            speakingMode={speakingMode}
            showFurigana={showFurigana}
            fontSize={fontSize}
            onSpeak={handleSpeak}
            onAnalyze={handleAnalyze}
            onTranslate={handleQuickTranslate}
            onSaveSentence={handleSaveSentence}
          />
        ))}

        {isAiLoading && (
          <div className="kaiwa-message assistant">
            <div className="kaiwa-message-avatar">🤖</div>
            <div className="kaiwa-message-content">
              <div className="kaiwa-typing">
                <span></span><span></span><span></span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Pronunciation Practice Modal */}
      {isPracticeMode && selectedSuggestion && (
        <>
          <KaiwaPracticeModal
            suggestion={selectedSuggestion}
            result={pronunciationResult}
            isListening={speech.isListening}
            isSpeaking={speech.isSpeaking}
            interimTranscript={speech.interimTranscript}
            onMicClick={handleMicClick}
            onListen={() => speech.speak(selectedSuggestion.text, { rate: settings.kaiwaVoiceRate })}
            onRetry={handleRetryPractice}
            onAccept={handleAcceptPronunciation}
            onClose={handleCancelPractice}
          />
          {/* Auto-send countdown overlay */}
          {autoSendCountdown !== null && autoSendCountdown > 0 && (
            <div className="kaiwa-auto-send-countdown">
              <Zap size={18} />
              <span>Tự động gửi trong</span>
              <span className="countdown-number">{autoSendCountdown}</span>
              <span>giây</span>
            </div>
          )}
        </>
      )}

      {/* Analysis Modal */}
      {analysisText && (
        <KaiwaAnalysisModal
          text={analysisText}
          result={analysisResult}
          isLoading={isAnalyzing}
          onClose={() => { setAnalysisText(null); setAnalysisResult(null); }}
        />
      )}

      {/* Evaluation Modal */}
      {showEvaluationModal && (
        <KaiwaEvaluationModal
          evaluation={evaluation}
          isLoading={isEvaluating}
          onClose={handleEvaluationClose}
        />
      )}

      {/* Saved Sentences Panel */}
      {showSavedPanel && savedSentences.length > 0 && (
        <div className="kaiwa-saved-panel">
          <div className="kaiwa-saved-header">
            <h3><Bookmark size={16} /> Câu đã lưu ({savedSentences.length})</h3>
            <button className="kaiwa-saved-close" onClick={() => setShowSavedPanel(false)}><X size={16} /></button>
          </div>
          <div className="kaiwa-saved-list">
            {savedSentences.map((sentence, idx) => (
              <div key={idx} className="kaiwa-saved-item">
                <p className="kaiwa-saved-text" style={{ fontSize: `${fontSize}px` }}>
                  <FuriganaText text={sentence} showFurigana={showFurigana} />
                </p>
                <div className="kaiwa-saved-actions">
                  <button
                    className="kaiwa-saved-btn"
                    onClick={() => speech.speak(removeFurigana(sentence), { rate: getSpeechRate() })}
                    title="Nghe"
                  >
                    <Volume2 size={14} />
                  </button>
                  <button
                    className="kaiwa-saved-btn"
                    onClick={() => {
                      navigator.clipboard.writeText(removeFurigana(sentence));
                    }}
                    title="Sao chép"
                  >
                    <Copy size={14} />
                  </button>
                  <button
                    className="kaiwa-saved-btn delete"
                    onClick={() => setSavedSentences(prev => prev.filter((_, i) => i !== idx))}
                    title="Xóa"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bottom section: tabs + input */}
      <div className="kaiwa-bottom-section">
        {/* Suggestion tabs - controlled by button in input area */}
        {!isPracticeMode && showSuggestionTabs && (answerTemplate || suggestedAnswers.length > 0 || suggestedQuestions.length > 0) && (
          <div className="kaiwa-suggestion-tabs">
            <div className="kaiwa-tabs-row">
                {answerTemplate && (
                  <button
                    className={`kaiwa-tab-btn ${activeSuggestionTab === 'template' ? 'active' : ''}`}
                    onClick={() => setActiveSuggestionTab(activeSuggestionTab === 'template' ? null : 'template')}
                  >
                    <span className="tab-icon"><Sparkles size={16} /></span>
                    <span className="tab-label">Gợi ý trả lời</span>
                  </button>
                )}
                {suggestedAnswers.length > 0 && (
                  <button
                    className={`kaiwa-tab-btn ${activeSuggestionTab === 'answers' ? 'active' : ''}`}
                    onClick={() => setActiveSuggestionTab(activeSuggestionTab === 'answers' ? null : 'answers')}
                  >
                    <span className="tab-icon"><MessagesSquare size={16} /></span>
                    <span className="tab-label">Câu trả lời mẫu</span>
                  </button>
                )}
                {suggestedQuestions.length > 0 && (
                  <button
                    className={`kaiwa-tab-btn ${activeSuggestionTab === 'questions' ? 'active' : ''}`}
                    onClick={() => setActiveSuggestionTab(activeSuggestionTab === 'questions' ? null : 'questions')}
                  >
                    <span className="tab-icon"><CircleHelp size={16} /></span>
                    <span className="tab-label">Gợi ý câu hỏi</span>
                  </button>
                )}
              </div>

            {/* Tab content - only show when tabs are visible */}
            {showSuggestionTabs && (
              <>
                {activeSuggestionTab === 'template' && answerTemplate && (
                  <div className="kaiwa-tab-content">
                    <KaiwaAnswerTemplate
                      template={answerTemplate}
                      showFurigana={showFurigana}
                      onSelectHint={handleSelectHint}
                    />
                  </div>
                )}

                {activeSuggestionTab === 'answers' && suggestedAnswers.length > 0 && (
                  <div className="kaiwa-tab-content">
                    <div className="kaiwa-suggestions-list">
                      {suggestedAnswers.map((suggestion) => (
                        <button
                          key={suggestion.id}
                          className={`kaiwa-suggestion-btn ${inputText.includes(removeFurigana(suggestion.text.replace(/【[^】]+】/g, '').trim()).substring(0, 20)) ? 'selected' : ''}`}
                          onClick={() => handleSuggestedAnswer(suggestion.text)}
                          disabled={isAiLoading}
                        >
                          <FuriganaText text={suggestion.text} showFurigana={showFurigana} />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {activeSuggestionTab === 'questions' && suggestedQuestions.length > 0 && (
                  <div className="kaiwa-tab-content">
                    <div className="kaiwa-questions-list">
                      {suggestedQuestions.map((question, idx) => (
                        <button
                          key={idx}
                          className="kaiwa-question-btn"
                          onClick={() => handleSuggestedQuestion(question)}
                          disabled={isAiLoading}
                        >
                          <FuriganaText text={question} showFurigana={showFurigana} />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Error display */}
        {(groq.error || speech.error) && (
          <div className="kaiwa-error">
            {groq.error || speech.error}
            <button onClick={() => { groq.clearError(); speech.clearError(); }}><X size={16} /></button>
          </div>
        )}

        {/* Input controls */}
        <div className="kaiwa-controls">
          <button
            className={`kaiwa-quick-toggle ${showSuggestionTabs ? 'active' : ''}`}
            onClick={() => setShowSuggestionTabs(!showSuggestionTabs)}
            title="Gợi ý"
            disabled={!answerTemplate && suggestedAnswers.length === 0 && suggestedQuestions.length === 0}
          >
            <Sparkles size={18} />
          </button>

          {speech.recognitionSupported && (
            <button
              className={`kaiwa-mic-btn ${speech.isListening ? 'listening' : ''}`}
              onClick={handleMicClick}
              disabled={isAiLoading}
            >
              <Mic size={18} />
            </button>
          )}

          <div className="kaiwa-input-wrapper">
            {speech.isListening && speech.interimTranscript && (
              <div className="kaiwa-interim">{speech.interimTranscript}</div>
            )}
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend(inputText)}
              placeholder="Nhập hoặc nói tiếng Nhật..."
              disabled={isAiLoading || speech.isListening}
            />
          </div>

          <button
            className="kaiwa-send-btn"
            onClick={() => handleSend(inputText)}
            disabled={!inputText.trim() || isAiLoading}
          >
            <Send size={18} />
          </button>
        </div>

        {/* Voice status */}
        {(speech.isListening || speech.isSpeaking) && (
          <div className="kaiwa-status">
            {speech.isListening && <span className="status-listening"><Mic size={14} /> Đang nghe...</span>}
            {speech.isSpeaking && <span className="status-speaking"><Volume2 size={14} /> Đang nói...</span>}
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
