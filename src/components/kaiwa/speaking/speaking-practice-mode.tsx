// Main container component for Speaking Practice mode

import { useState, useCallback, useEffect } from 'react';
import type { JLPTLevel } from '../../../types/kaiwa';
import type { SpeakingTopicId, SpeakingSessionSummary } from '../../../types/speaking-practice';
import { useSpeakingPractice } from '../../../hooks/use-speaking-practice';
import { useSpeech } from '../../../hooks/use-speech';
import { SpeakingTopicSelector } from './speaking-topic-selector';
import { SpeakingDialogueView } from './speaking-dialogue-view';
import { SpeakingEvaluationCard } from './speaking-evaluation-card';
import { AlertCircle } from 'lucide-react';

type SpeakingPracticePhase = 'selection' | 'practice' | 'complete';

interface SpeakingPracticeModeProps {
  defaultLevel: JLPTLevel;
  voiceGender: 'male' | 'female';
  voiceRate: number;
  showFurigana: boolean;
  onClose: () => void;
}

export function SpeakingPracticeMode({
  defaultLevel,
  voiceGender,
  voiceRate,
  showFurigana,
  onClose,
}: SpeakingPracticeModeProps) {
  // State
  const [phase, setPhase] = useState<SpeakingPracticePhase>('selection');
  const [selectedTopic, setSelectedTopic] = useState<SpeakingTopicId | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<JLPTLevel>(defaultLevel);
  const [sessionSummary, setSessionSummary] = useState<SpeakingSessionSummary | null>(null);
  const [localShowFurigana] = useState(showFurigana);

  // Hooks
  const speakingPractice = useSpeakingPractice();
  const speech = useSpeech({ voiceGender, voiceRate });

  // Handle start practice
  const handleStart = useCallback(async () => {
    if (!selectedTopic) return;

    const dialogue = await speakingPractice.generateDialogue(selectedTopic, selectedLevel);
    if (dialogue) {
      setPhase('practice');
    }
  }, [selectedTopic, selectedLevel, speakingPractice]);

  // Handle complete session
  const handleComplete = useCallback(() => {
    const summary = speakingPractice.completeSession();
    if (summary) {
      setSessionSummary(summary);
      setPhase('complete');
    }
  }, [speakingPractice]);

  // Handle restart same topic
  const handleRestart = useCallback(async () => {
    if (!selectedTopic) return;

    speakingPractice.resetSession();
    const dialogue = await speakingPractice.generateDialogue(selectedTopic, selectedLevel);
    if (dialogue) {
      setSessionSummary(null);
      setPhase('practice');
    }
  }, [selectedTopic, selectedLevel, speakingPractice]);

  // Handle new topic selection
  const handleNewTopic = useCallback(() => {
    speakingPractice.resetSession();
    setSessionSummary(null);
    setSelectedTopic(null);
    setPhase('selection');
  }, [speakingPractice]);

  // Handle close from dialogue view
  const handleCloseDialogue = useCallback(() => {
    speech.stopSpeaking();
    if (speech.isListening) {
      speech.stopListening();
    }

    // Ask for confirmation if in progress
    if (phase === 'practice') {
      const confirmed = window.confirm('Bạn có muốn kết thúc buổi luyện tập?');
      if (confirmed) {
        handleComplete();
      }
    } else {
      onClose();
    }
  }, [phase, speech, handleComplete, onClose]);

  // Handle evaluate with recording tracking
  const handleEvaluate = useCallback((lineIndex: number, spokenText: string) => {
    speakingPractice.startRecording(lineIndex);
    return speakingPractice.evaluateLine(lineIndex, spokenText);
  }, [speakingPractice]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      speech.stopSpeaking();
      if (speech.isListening) {
        speech.stopListening();
      }
    };
  }, [speech]);

  // Render error state
  if (speakingPractice.error) {
    return (
      <div className="speaking-practice-mode">
        <div className="speaking-error">
          <AlertCircle size={48} />
          <h3>Có lỗi xảy ra</h3>
          <p>{speakingPractice.error}</p>
          <div className="error-actions">
            <button className="btn btn-secondary" onClick={() => speakingPractice.clearError()}>
              Thử lại
            </button>
            <button className="btn btn-outline" onClick={onClose}>
              Đóng
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render based on phase
  return (
    <div className="speaking-practice-mode">
      {/* Topic selection */}
      {phase === 'selection' && (
        <SpeakingTopicSelector
          selectedTopic={selectedTopic}
          selectedLevel={selectedLevel}
          progress={speakingPractice.progress}
          onSelectTopic={setSelectedTopic}
          onSelectLevel={setSelectedLevel}
          onStart={handleStart}
          isLoading={speakingPractice.isLoading}
        />
      )}

      {/* Practice dialogue */}
      {phase === 'practice' && speakingPractice.dialogue && (
        <SpeakingDialogueView
          dialogue={speakingPractice.dialogue}
          showFurigana={localShowFurigana}
          voiceRate={voiceRate}
          onSpeak={speech.speak}
          onStopSpeaking={speech.stopSpeaking}
          isSpeaking={speech.isSpeaking}
          isListening={speech.isListening}
          transcript={speech.transcript}
          interimTranscript={speech.interimTranscript}
          onStartListening={speech.startListening}
          onStopListening={speech.stopListening}
          onEvaluate={handleEvaluate}
          onComplete={handleComplete}
          onClose={handleCloseDialogue}
        />
      )}

      {/* Session complete */}
      {phase === 'complete' && sessionSummary && (
        <SpeakingEvaluationCard
          summary={sessionSummary}
          onRestart={handleRestart}
          onNewTopic={handleNewTopic}
          onClose={onClose}
        />
      )}

      {/* Browser support warning */}
      {!speech.recognitionSupported && phase === 'selection' && (
        <div className="speaking-browser-warning">
          <AlertCircle size={16} />
          <span>Trình duyệt không hỗ trợ nhận dạng giọng nói. Vui lòng dùng Chrome.</span>
        </div>
      )}
    </div>
  );
}
