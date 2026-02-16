// Listening Tab Orchestrator - State management and view routing
import { useState, useRef } from 'react';
import { ListeningRootView } from './listening-root-view';
import { ListeningLevelView } from './listening-level-view';
import { ListeningLessonView } from './listening-lesson-view';
import { ListeningAudioView } from './listening-audio-view';
import { LESSON_TYPES } from './listening-tab-types';
import type { ListeningTabProps, NavState } from './listening-tab-types';
import type { JLPTLevel } from '../../../types/flashcard';
import type { ListeningLessonType, ListeningAudio, ListeningFolder } from '../../../types/listening';

export function ListeningTab({
  audios,
  onAddAudio,
  onAddTextAudio,
  onUpdateAudio,
  onDeleteAudio,
  onAddFolder,
  onUpdateFolder,
  onDeleteFolder,
  getFoldersByLevelLessonAndType,
  getAudiosByFolder,
  getAudioUrl,
}: ListeningTabProps) {
  // Navigation state
  const [navState, setNavState] = useState<NavState>({ type: 'root' });
  
  // Folder state
  const [showAddFolder, setShowAddFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [editingFolder, setEditingFolder] = useState<{ id: string; name: string } | null>(null);

  // Audio state
  const [editingAudio, setEditingAudio] = useState<{
    id: string; title: string; textContent: string; description: string;
    ttsMode?: 'single' | 'kaiwa'; kaiwaLines?: { speaker: string; text: string }[];
  } | null>(null);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);

  // Audio form state
  const [audioTitle, setAudioTitle] = useState('');
  const [audioDescription, setAudioDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // TTS form state
  const [showAddAudio, setShowAddAudio] = useState(false);
  const [showTextToSpeech, setShowTextToSpeech] = useState(false);
  const [ttsTitle, setTtsTitle] = useState('');
  const [ttsText, setTtsText] = useState('');
  const [ttsDescription, setTtsDescription] = useState('');
  const [ttsPreviewing, setTtsPreviewing] = useState(false);
  const [ttsMode, setTtsMode] = useState<'single' | 'kaiwa'>('single');

  // Kaiwa state
  const [showCharacterModal, setShowCharacterModal] = useState(false);
  const [kaiwaLines, setKaiwaLines] = useState<{ speaker: string; text: string }[]>([{ speaker: '', text: '' }]);

  // Furigana generation
  const [generatingFurigana, setGeneratingFurigana] = useState<'title' | 'desc' | 'ttsText' | null>(null);

  // Count helpers
  const getCountByLevel = (level: JLPTLevel) => {
    return audios.filter(a => a.jlptLevel === level).length;
  };

  const getCountByLesson = (level: JLPTLevel, lessonNumber: number) => {
    const folders = LESSON_TYPES.reduce((acc, lt) => {
      const f = getFoldersByLevelLessonAndType(level, lessonNumber, lt.value);
      return [...acc, ...f];
    }, [] as ListeningFolder[]);
    return folders.reduce((sum, f) => sum + getAudiosByFolder(f.id).length, 0);
  };

  const getCountByLessonType = (level: JLPTLevel, lessonNumber: number, lessonType: ListeningLessonType) => {
    const typeFolders = getFoldersByLevelLessonAndType(level, lessonNumber, lessonType);
    return typeFolders.reduce((sum, f) => sum + getAudiosByFolder(f.id).length, 0);
  };

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

  // Get audios for lesson type
  const getAudiosForLessonType = (level: JLPTLevel, lessonNumber: number, lessonType: ListeningLessonType): ListeningAudio[] => {
    const typeFolders = getFoldersByLevelLessonAndType(level, lessonNumber, lessonType);
    return typeFolders.flatMap(f => getAudiosByFolder(f.id));
  };

  // Render appropriate view based on navState
  if (navState.type === 'root') {
    return (
      <ListeningRootView
        onSelectLevel={goToLevel}
        getCountByLevel={getCountByLevel}
        audioRef={audioRef}
        onAudioEnded={() => setPlayingAudioId(null)}
      />
    );
  }

  if (navState.type === 'level') {
    return (
      <ListeningLevelView
        level={navState.level}
        onBack={goBack}
        onSelectLesson={goToLesson}
        getCountByLesson={getCountByLesson}
        audioRef={audioRef}
        onAudioEnded={() => setPlayingAudioId(null)}
      />
    );
  }

  if (navState.type === 'lesson') {
    return (
      <ListeningLessonView
        level={navState.level}
        lessonNumber={navState.lessonNumber}
        onBack={goBack}
        onSelectLessonType={goToLessonType}
        getCountByLessonType={getCountByLessonType}
        audioRef={audioRef}
        onAudioEnded={() => setPlayingAudioId(null)}
      />
    );
  }

  // navState.type === 'lessonType'
  const typeFolders = getFoldersByLevelLessonAndType(navState.level, navState.lessonNumber, navState.lessonType);
  const allAudios = getAudiosForLessonType(navState.level, navState.lessonNumber, navState.lessonType);

  return (
    <ListeningAudioView
      level={navState.level}
      lessonNumber={navState.lessonNumber}
      lessonType={navState.lessonType}
      onBack={goBack}
      typeFolders={typeFolders}
      allAudios={allAudios}
      getAudiosByFolder={getAudiosByFolder}
      onAddFolder={onAddFolder}
      onUpdateFolder={onUpdateFolder}
      onDeleteFolder={onDeleteFolder}
      onAddAudio={onAddAudio}
      onAddTextAudio={onAddTextAudio}
      onUpdateAudio={onUpdateAudio}
      onDeleteAudio={onDeleteAudio}
      getAudioUrl={getAudioUrl}
      getFoldersByLevelLessonAndType={getFoldersByLevelLessonAndType}
      showAddFolder={showAddFolder}
      setShowAddFolder={setShowAddFolder}
      showAddAudio={showAddAudio}
      setShowAddAudio={setShowAddAudio}
      newFolderName={newFolderName}
      setNewFolderName={setNewFolderName}
      editingFolder={editingFolder}
      setEditingFolder={setEditingFolder}
      editingAudio={editingAudio}
      setEditingAudio={setEditingAudio}
      playingAudioId={playingAudioId}
      setPlayingAudioId={setPlayingAudioId}
      audioTitle={audioTitle}
      setAudioTitle={setAudioTitle}
      audioDescription={audioDescription}
      setAudioDescription={setAudioDescription}
      selectedFile={selectedFile}
      setSelectedFile={setSelectedFile}
      fileInputRef={fileInputRef}
      audioRef={audioRef}
      showTextToSpeech={showTextToSpeech}
      setShowTextToSpeech={setShowTextToSpeech}
      ttsTitle={ttsTitle}
      setTtsTitle={setTtsTitle}
      ttsText={ttsText}
      setTtsText={setTtsText}
      ttsDescription={ttsDescription}
      setTtsDescription={setTtsDescription}
      ttsPreviewing={ttsPreviewing}
      setTtsPreviewing={setTtsPreviewing}
      ttsMode={ttsMode}
      setTtsMode={setTtsMode}
      showCharacterModal={showCharacterModal}
      setShowCharacterModal={setShowCharacterModal}
      kaiwaLines={kaiwaLines}
      setKaiwaLines={setKaiwaLines}
      generatingFurigana={generatingFurigana}
      setGeneratingFurigana={setGeneratingFurigana}
    />
  );
}
