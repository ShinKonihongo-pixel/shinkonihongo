// UI state: font size, furigana, panels, tabs, analysis
import { useState, useEffect } from 'react';
import type { AppSettings } from '../../../hooks/use-settings';
import { useGroq } from '../../../hooks/use-groq';

export interface UseKaiwaUiReturn {
  slowMode: boolean;
  showFurigana: boolean;
  showSuggestionTabs: boolean;
  activeSuggestionTab: 'template' | 'answers' | 'questions' | null;
  fontSize: number;
  showSavedPanel: boolean;
  analysisText: string | null;
  analysisResult: string | null;
  isAnalyzing: boolean;
  showEvaluationModal: boolean;
  setSlowMode: (v: boolean) => void;
  setShowFurigana: (v: boolean) => void;
  setShowSuggestionTabs: (v: boolean) => void;
  setActiveSuggestionTab: (v: 'template' | 'answers' | 'questions' | null) => void;
  setFontSize: (v: number) => void;
  setShowSavedPanel: (v: boolean) => void;
  setAnalysisText: (v: string | null) => void;
  setAnalysisResult: (v: string | null) => void;
  setShowEvaluationModal: (v: boolean) => void;
  handleAnalyze: (text: string) => Promise<void>;
}

interface UseKaiwaUiParams {
  settings: AppSettings;
  groq: ReturnType<typeof useGroq>;
}

export function useKaiwaUi({ settings, groq }: UseKaiwaUiParams): UseKaiwaUiReturn {
  const [slowMode, setSlowMode] = useState(false);
  const [showFurigana, setShowFurigana] = useState(settings.kaiwaShowFurigana);
  const [showSuggestionTabs, setShowSuggestionTabs] = useState(true);
  const [activeSuggestionTab, setActiveSuggestionTab] = useState<'template' | 'answers' | 'questions' | null>(null);
  const [fontSize, setFontSize] = useState(() => {
    const saved = localStorage.getItem('kaiwaFontSize');
    return saved ? parseInt(saved, 10) : 16;
  });
  const [showSavedPanel, setShowSavedPanel] = useState(false);
  const [analysisText, setAnalysisText] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showEvaluationModal, setShowEvaluationModal] = useState(false);

  // Persist font size
  useEffect(() => {
    localStorage.setItem('kaiwaFontSize', fontSize.toString());
  }, [fontSize]);

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

  return {
    slowMode, showFurigana, showSuggestionTabs, activeSuggestionTab,
    fontSize, showSavedPanel, analysisText, analysisResult, isAnalyzing, showEvaluationModal,
    setSlowMode, setShowFurigana, setShowSuggestionTabs, setActiveSuggestionTab,
    setFontSize, setShowSavedPanel, setAnalysisText, setAnalysisResult, setShowEvaluationModal,
    handleAnalyze,
  };
}
