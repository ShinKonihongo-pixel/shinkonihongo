// Message handling: conversation messages, suggestions, answer template, saved sentences
import { useState, useRef, useCallback, useMemo } from 'react';
import type { KaiwaMessage, AnswerTemplate, SuggestedAnswer, KaiwaContext } from '../../../types/kaiwa';
import type { KaiwaAdvancedTopic } from '../../../types/kaiwa-advanced';
import { useGroq } from '../../../hooks/use-groq';
import { useGroqAdvanced } from '../../../hooks/use-groq-advanced';
import type { SessionMode } from './kaiwa-types';
import { removeFurigana } from '../../../lib/furigana-utils';

export interface UseKaiwaMessagesReturn {
  messages: KaiwaMessage[];
  answerTemplate: AnswerTemplate | null;
  suggestedAnswers: SuggestedAnswer[];
  suggestedQuestions: string[];
  inputText: string;
  isStarted: boolean;
  startTime: Date | null;
  savedSentences: string[];
  conversationStats: { exchanges: number; duration: number };
  messagesEndRef: React.RefObject<HTMLDivElement>;
  inputRef: React.RefObject<HTMLInputElement>;
  setMessages: React.Dispatch<React.SetStateAction<KaiwaMessage[]>>;
  setInputText: (v: string) => void;
  setAnswerTemplate: (v: AnswerTemplate | null) => void;
  setSuggestedAnswers: (v: SuggestedAnswer[]) => void;
  setSuggestedQuestions: (v: string[]) => void;
  setSavedSentences: React.Dispatch<React.SetStateAction<string[]>>;
  setIsStarted: (v: boolean) => void;
  setStartTime: (v: Date | null) => void;
  handleSend: (text: string) => Promise<void>;
  handleSaveSentence: (text: string) => void;
  handleSuggestedAnswer: (answer: string) => void;
  handleSuggestedQuestion: (question: string) => void;
  handleSelectHint: (hint: { word: string }) => void;
  handleQuickTranslate: (text: string) => Promise<string>;
  resetMessages: () => void;
}

interface UseKaiwaMessagesParams {
  sessionMode: SessionMode;
  selectedAdvancedTopic: KaiwaAdvancedTopic | null;
  isAiLoading: boolean;
  getContext: () => KaiwaContext;
  groq: ReturnType<typeof useGroq>;
  groqAdvanced: ReturnType<typeof useGroqAdvanced>;
  setActiveSuggestionTab: (v: 'template' | 'answers' | 'questions' | null) => void;
}

export function useKaiwaMessages({
  sessionMode,
  selectedAdvancedTopic,
  isAiLoading,
  getContext,
  groq,
  groqAdvanced,
  setActiveSuggestionTab,
}: UseKaiwaMessagesParams): UseKaiwaMessagesReturn {
  const [messages, setMessages] = useState<KaiwaMessage[]>([]);
  const [answerTemplate, setAnswerTemplate] = useState<AnswerTemplate | null>(null);
  const [suggestedAnswers, setSuggestedAnswers] = useState<SuggestedAnswer[]>([]);
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);
  const [inputText, setInputText] = useState('');
  const [isStarted, setIsStarted] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [savedSentences, setSavedSentences] = useState<string[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const conversationStats = useMemo(() => {
    const userMessages = messages.filter(m => m.role === 'user').length;
    const duration = startTime ? Math.floor((Date.now() - startTime.getTime()) / 60000) : 0;
    return { exchanges: userMessages, duration };
  }, [messages, startTime]);

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
      if (response.answerTemplate) setAnswerTemplate(response.answerTemplate);
      if (response.suggestions) setSuggestedAnswers(response.suggestions);
      if (response.suggestedQuestions) setSuggestedQuestions(response.suggestedQuestions);
    }
  }, [sessionMode, selectedAdvancedTopic, isAiLoading, getContext, groq, groqAdvanced, setActiveSuggestionTab]);

  const handleSaveSentence = useCallback((text: string) => {
    setSavedSentences(prev => prev.includes(text) ? prev : [...prev, text]);
  }, []);

  const handleSuggestedAnswer = useCallback((answer: string) => {
    const cleanAnswer = removeFurigana(answer.replace(/【[^】]+】/g, '').trim());
    setInputText(cleanAnswer);
  }, []);

  const handleSuggestedQuestion = useCallback((question: string) => {
    const cleanQuestion = removeFurigana(question.replace(/【[^】]+】/g, '').trim());
    setInputText(prev => prev.trim() ? prev.trim() + ' ' + cleanQuestion : cleanQuestion);
  }, []);

  const handleSelectHint = useCallback((hint: { word: string }) => {
    const cleanWord = removeFurigana(hint.word);
    setInputText(prev => {
      if (!answerTemplate) return prev;
      const blankMarkers = ['①', '②', '③', '④', '⑤'];

      if (prev.trim()) {
        let newText = prev;
        for (const marker of blankMarkers) {
          if (newText.includes(marker)) return newText.replace(marker, cleanWord);
        }
        if (newText.includes('...')) return newText.replace('...', cleanWord);
        return prev;
      } else {
        const cleanPattern = removeFurigana(answerTemplate.pattern);
        let filledText = cleanPattern;
        for (const marker of [...blankMarkers, '...']) {
          if (filledText.includes(marker)) return filledText.replace(marker, cleanWord);
        }
        return filledText;
      }
    });
  }, [answerTemplate]);

  const handleQuickTranslate = useCallback(async (text: string): Promise<string> => {
    return groq.quickTranslate(text);
  }, [groq]);

  const resetMessages = useCallback(() => {
    setIsStarted(false);
    setStartTime(null);
    setMessages([]);
    setAnswerTemplate(null);
    setSuggestedAnswers([]);
    setSuggestedQuestions([]);
    setSavedSentences([]);
  }, []);

  return {
    messages, answerTemplate, suggestedAnswers, suggestedQuestions,
    inputText, isStarted, startTime, savedSentences, conversationStats,
    messagesEndRef, inputRef,
    setMessages, setInputText, setAnswerTemplate, setSuggestedAnswers,
    setSuggestedQuestions, setSavedSentences, setIsStarted, setStartTime,
    handleSend, handleSaveSentence, handleSuggestedAnswer, handleSuggestedQuestion,
    handleSelectHint, handleQuickTranslate, resetMessages,
  };
}
