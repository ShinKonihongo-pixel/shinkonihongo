// API key management hook

import { useCallback } from 'react';

interface UseApiKeyOptions {
  apiKey?: string;
}

export function useApiKey(options: UseApiKeyOptions = {}) {
  const getApiKey = useCallback(() => {
    return options.apiKey || import.meta.env.VITE_GROQ_API_KEY;
  }, [options.apiKey]);

  return { getApiKey };
}
