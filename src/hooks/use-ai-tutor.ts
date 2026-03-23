// Hook for AI Tutor chat — manages conversation state with Claude API

import { useState, useCallback, useRef } from 'react';
import { sendMessage, buildTutorSystemPrompt, type ClaudeMessage } from '../services/claude-api';

const STORAGE_KEY = 'shinko_ai_tutor_history';
const MAX_MESSAGES = 50;

export interface TutorMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

// Load from localStorage
function loadHistory(): TutorMessage[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const msgs = JSON.parse(raw) as TutorMessage[];
    return msgs.slice(-MAX_MESSAGES);
  } catch { return []; }
}

// Save to localStorage
function saveHistory(messages: TutorMessage[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-MAX_MESSAGES)));
}

export function useAiTutor(userJlptLevel?: string) {
  const [messages, setMessages] = useState<TutorMessage[]>(loadHistory);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const systemPrompt = buildTutorSystemPrompt(userJlptLevel);

  const sendUserMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMsg: TutorMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => {
      const updated = [...prev, userMsg];
      saveHistory(updated);
      return updated;
    });
    setIsLoading(true);
    setError(null);

    // Build conversation for API (last 10 messages for context)
    const recentMessages: ClaudeMessage[] = [
      ...messages.slice(-10).map(m => ({ role: m.role, content: m.content })),
      { role: 'user' as const, content: text.trim() },
    ];

    try {
      abortRef.current = new AbortController();
      const reply = await sendMessage(recentMessages, systemPrompt, abortRef.current.signal);

      const assistantMsg: TutorMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: reply,
        timestamp: new Date().toISOString(),
      };

      setMessages(prev => {
        const updated = [...prev, assistantMsg];
        saveHistory(updated);
        return updated;
      });
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return;
      const errorMsg = err instanceof Error ? err.message : 'Lỗi kết nối';
      setError(errorMsg);
    } finally {
      setIsLoading(false);
      abortRef.current = null;
    }
  }, [isLoading, messages, systemPrompt]);

  const clearHistory = useCallback(() => {
    setMessages([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const cancelRequest = useCallback(() => {
    abortRef.current?.abort();
    setIsLoading(false);
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage: sendUserMessage,
    clearHistory,
    cancelRequest,
  };
}
