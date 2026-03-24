// Session management: mode selection, topic/scenario, question selection, start/reset
import { useState, useCallback } from 'react';
import type { JLPTLevel, ConversationStyle, ConversationTopic, KaiwaContext, KaiwaScenario, KaiwaRole } from '../../../types/kaiwa';
import type { KaiwaDefaultQuestion } from '../../../types/kaiwa-question';
import type { KaiwaAdvancedTopic, KaiwaAdvancedQuestion } from '../../../types/kaiwa-advanced';
import type { CustomTopic, CustomTopicQuestion } from '../../../types/custom-topic';
import type { SessionMode, QuestionSelectorState } from './kaiwa-types';
import type { AppSettings } from '../../../hooks/use-settings';
import { getScenarioByTopic } from '../../../constants/kaiwa';

export interface UseKaiwaSessionReturn {
  level: JLPTLevel;
  style: ConversationStyle;
  topic: ConversationTopic;
  sessionMode: SessionMode;
  questionSelectorState: QuestionSelectorState;
  selectedDefaultQuestion: KaiwaDefaultQuestion | null;
  selectedAdvancedTopic: KaiwaAdvancedTopic | null;
  selectedAdvancedQuestion: KaiwaAdvancedQuestion | null;
  selectedCustomTopic: CustomTopic | null;
  selectedCustomQuestion: CustomTopicQuestion | null;
  selectedScenario: KaiwaScenario | null;
  userRole: string | null;
  setLevel: (v: JLPTLevel) => void;
  setStyle: (v: ConversationStyle) => void;
  setTopic: (v: ConversationTopic) => void;
  setSessionMode: (v: SessionMode) => void;
  setQuestionSelectorState: (v: QuestionSelectorState) => void;
  setSelectedDefaultQuestion: (v: KaiwaDefaultQuestion | null) => void;
  setSelectedAdvancedTopic: (v: KaiwaAdvancedTopic | null) => void;
  setSelectedAdvancedQuestion: (v: KaiwaAdvancedQuestion | null) => void;
  setSelectedCustomTopic: (v: CustomTopic | null) => void;
  setSelectedCustomQuestion: (v: CustomTopicQuestion | null) => void;
  setSelectedScenario: (v: KaiwaScenario | null) => void;
  setUserRole: (v: string | null) => void;
  handleTopicChange: (newTopic: ConversationTopic) => void;
  getContext: () => KaiwaContext;
  getUserRoleInfo: () => KaiwaRole | null;
  resetSessionSelection: () => void;
}

export function useKaiwaSession(settings: AppSettings): UseKaiwaSessionReturn {
  const [level, setLevel] = useState<JLPTLevel>(settings.kaiwaDefaultLevel);
  const [style, setStyle] = useState<ConversationStyle>(settings.kaiwaDefaultStyle);
  const [topic, setTopic] = useState<ConversationTopic>('free');

  const [sessionMode, setSessionMode] = useState<SessionMode>('default');
  const [questionSelectorState, setQuestionSelectorState] = useState<QuestionSelectorState>({ type: 'hidden' });
  const [selectedDefaultQuestion, setSelectedDefaultQuestion] = useState<KaiwaDefaultQuestion | null>(null);

  const [selectedAdvancedTopic, setSelectedAdvancedTopic] = useState<KaiwaAdvancedTopic | null>(null);
  const [selectedAdvancedQuestion, setSelectedAdvancedQuestion] = useState<KaiwaAdvancedQuestion | null>(null);

  const [selectedCustomTopic, setSelectedCustomTopic] = useState<CustomTopic | null>(null);
  const [selectedCustomQuestion, setSelectedCustomQuestion] = useState<CustomTopicQuestion | null>(null);

  const [selectedScenario, setSelectedScenario] = useState<KaiwaScenario | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

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

  const getContext = useCallback((): KaiwaContext => ({ level, style, topic }), [level, style, topic]);

  const getUserRoleInfo = useCallback((): KaiwaRole | null => {
    if (!selectedScenario || !userRole) return null;
    return selectedScenario.roles.find(r => r.id === userRole) || null;
  }, [selectedScenario, userRole]);

  const resetSessionSelection = useCallback(() => {
    setSelectedDefaultQuestion(null);
    setQuestionSelectorState({ type: 'hidden' });
    setSelectedScenario(null);
    setUserRole(null);
    setSelectedAdvancedTopic(null);
    setSelectedAdvancedQuestion(null);
    setSelectedCustomTopic(null);
    setSelectedCustomQuestion(null);
  }, []);

  return {
    level, style, topic, sessionMode,
    questionSelectorState, selectedDefaultQuestion,
    selectedAdvancedTopic, selectedAdvancedQuestion,
    selectedCustomTopic, selectedCustomQuestion,
    selectedScenario, userRole,
    setLevel, setStyle, setTopic, setSessionMode,
    setQuestionSelectorState, setSelectedDefaultQuestion,
    setSelectedAdvancedTopic, setSelectedAdvancedQuestion,
    setSelectedCustomTopic, setSelectedCustomQuestion,
    setSelectedScenario, setUserRole,
    handleTopicChange, getContext, getUserRoleInfo,
    resetSessionSelection,
  };
}
