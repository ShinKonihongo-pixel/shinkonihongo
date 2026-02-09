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
    const timer = timerRef.current;
    const questionTimer = questionTimerRef.current;
    const botTimer = botTimerRef.current;
    const botTimer2 = botTimer2Ref.current;
    const botAnswerTimers = botAnswerTimersRef.current;
    return () => {
      if (timer) clearTimeout(timer);
      if (questionTimer) clearTimeout(questionTimer);
      if (botTimer) clearTimeout(botTimer);
      if (botTimer2) clearTimeout(botTimer2);
      botAnswerTimers.forEach(t => clearTimeout(t));
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
