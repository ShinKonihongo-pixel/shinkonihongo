// API key management hook
// When using proxy (VITE_GROQ_PROXY_URL), returns 'proxy' as a sentinel value
// to indicate that no Authorization header is needed (key is on the proxy server)

import { useCallback } from 'react';

interface UseApiKeyOptions {
  apiKey?: string;
}

export function useApiKey(options: UseApiKeyOptions = {}) {
  const getApiKey = useCallback(() => {
    // If explicit key provided (e.g., for testing), use it
    if (options.apiKey) return options.apiKey;
    // If proxy is configured, return sentinel — no client-side key needed
    if (import.meta.env.VITE_GROQ_PROXY_URL) return 'proxy';
    // Fallback to direct key (INSECURE — only for local dev without proxy)
    return import.meta.env.VITE_GROQ_API_KEY;
  }, [options.apiKey]);

  return { getApiKey };
}
