// Timer management hook
import { useRef, useEffect } from 'react';

export function useTimers() {
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const questionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const botTimerRef = useRef<NodeJS.Timeout | null>(null);
  const botTimer2Ref = useRef<NodeJS.Timeout | null>(null);
  const botAnswerTimersRef = useRef<NodeJS.Timeout[]>([]);

  // Clear timers on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (questionTimerRef.current) clearTimeout(questionTimerRef.current);
      if (botTimerRef.current) clearTimeout(botTimerRef.current);
      if (botTimer2Ref.current) clearTimeout(botTimer2Ref.current);
      botAnswerTimersRef.current.forEach(t => clearTimeout(t));
    };
  }, []);

  return {
    timerRef,
    questionTimerRef,
    botTimerRef,
    botTimer2Ref,
    botAnswerTimersRef,
  };
}
