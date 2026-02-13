// State management hook for Listening Tab
import { useState, useRef } from 'react';
import type { NavState } from './listening-tab-types';
import type { JLPTLevel } from '../../../types/flashcard';
import type { ListeningLessonType, KaiwaLine, TtsMode } from '../../../types/listening';

export function useListeningTabState() {
  const [navState, setNavState] = useState<NavState>({ type: 'root' });
  const [showAddFolder, setShowAddFolder] = useState(false);
  const [showAddAudio, setShowAddAudio] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [editingFolder, setEditingFolder] = useState<{ id: string; name: string } | null>(null);

  // Editing TTS audio state (supports both single and kaiwa modes)
  const [editingAudio, setEditingAudio] = useState<{
    id: string; title: string; textContent: string; description: string;
    ttsMode?: TtsMode; kaiwaLines?: KaiwaLine[];
  } | null>(null);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);

  // Audio form state
  const [audioTitle, setAudioTitle] = useState('');
  const [audioDescription, setAudioDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // TTS form state
  const [showTextToSpeech, setShowTextToSpeech] = useState(false);
  const [ttsTitle, setTtsTitle] = useState('');
  const [ttsText, setTtsText] = useState('');
  const [ttsDescription, setTtsDescription] = useState('');
  const [ttsPreviewing, setTtsPreviewing] = useState(false);
  const [ttsMode, setTtsMode] = useState<TtsMode>('single');

  // Kaiwa character system
  const [showCharacterModal, setShowCharacterModal] = useState(false);
  const [kaiwaLines, setKaiwaLines] = useState<KaiwaLine[]>([{ speaker: '', text: '' }]);

  // Furigana generation
  const [generatingFurigana, setGeneratingFurigana] = useState<'title' | 'desc' | 'ttsText' | null>(null);

  // Navigation handlers
  const goToLevel = (level: JLPTLevel) => {
    setNavState({ type: 'level', level });
  };

  const goToLesson = (lessonNumber: number) => {
    if (navState.type !== 'level') return;
    setNavState({ type: 'lesson', level: navState.level, lessonNumber });
  };

  const goToLessonType = (lessonType: ListeningLessonType) => {
    if (navState.type !== 'lesson') return;
    setNavState({ type: 'lessonType', level: navState.level, lessonNumber: navState.lessonNumber, lessonType });
  };

  const goBack = () => {
    if (navState.type === 'lessonType') {
      setNavState({ type: 'lesson', level: navState.level, lessonNumber: navState.lessonNumber });
    } else if (navState.type === 'lesson') {
      setNavState({ type: 'level', level: navState.level });
    } else if (navState.type === 'level') {
      setNavState({ type: 'root' });
    }
    setShowAddFolder(false);
    setShowAddAudio(false);
  };

  return {
    // Navigation state
    navState,
    setNavState,
    goToLevel,
    goToLesson,
    goToLessonType,
    goBack,

    // Form states
    showAddFolder,
    setShowAddFolder,
    showAddAudio,
    setShowAddAudio,
    newFolderName,
    setNewFolderName,
    editingFolder,
    setEditingFolder,
    editingAudio,
    setEditingAudio,

    // Playback state
    playingAudioId,
    setPlayingAudioId,
    audioRef,

    // Audio form
    audioTitle,
    setAudioTitle,
    audioDescription,
    setAudioDescription,
    selectedFile,
    setSelectedFile,
    fileInputRef,

    // TTS form
    showTextToSpeech,
    setShowTextToSpeech,
    ttsTitle,
    setTtsTitle,
    ttsText,
    setTtsText,
    ttsDescription,
    setTtsDescription,
    ttsPreviewing,
    setTtsPreviewing,
    ttsMode,
    setTtsMode,

    // Kaiwa
    showCharacterModal,
    setShowCharacterModal,
    kaiwaLines,
    setKaiwaLines,

    // Furigana
    generatingFurigana,
    setGeneratingFurigana,
  };
}
