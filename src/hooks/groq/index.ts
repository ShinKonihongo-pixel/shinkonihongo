// Main export for Groq integration hooks

import { useApiKey } from './use-api-key';
import { useConversation } from './use-conversation';
import { useAnalysis } from './use-analysis';
import { useEvaluation } from './use-evaluation';

export * from './constants';
export * from './system-prompt';
export * from './response-parser';

interface UseGroqOptions {
  apiKey?: string;
}

export function useGroq(options: UseGroqOptions = {}) {
  const { getApiKey } = useApiKey(options);

  const conversation = useConversation({ getApiKey });
  const analysis = useAnalysis({ getApiKey });
  const evaluation = useEvaluation({ getApiKey });

  return {
    // Conversation methods
    sendMessage: conversation.sendMessage,
    startConversation: conversation.startConversation,
    clearConversation: conversation.clearConversation,

    // Analysis methods
    analyzeJapaneseSentence: analysis.analyzeJapaneseSentence,
    generateFurigana: analysis.generateFurigana,
    quickTranslate: analysis.quickTranslate,

    // Evaluation methods
    evaluateConversation: evaluation.evaluateConversation,

    // State from conversation and evaluation
    isLoading: conversation.isLoading || evaluation.isLoading,
    error: conversation.error || evaluation.error,
    clearError: conversation.clearError,
  };
}
