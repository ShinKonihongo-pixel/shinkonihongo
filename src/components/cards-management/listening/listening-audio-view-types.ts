// Shared types for ListeningAudioView sub-components
import React from 'react';
import type { JLPTLevel } from '../../../types/flashcard';
import type { ListeningAudio, ListeningFolder, ListeningLessonType, KaiwaLine, TtsMode } from '../../../types/listening';

export interface EditingAudio {
  id: string;
  title: string;
  textContent: string;
  description: string;
  ttsMode?: TtsMode;
  kaiwaLines?: KaiwaLine[];
}

export interface ListeningAudioViewProps {
  level: JLPTLevel;
  lessonNumber: number;
  lessonType: ListeningLessonType;
  onBack: () => void;

  // Data
  typeFolders: ListeningFolder[];
  allAudios: ListeningAudio[];
  getAudiosByFolder: (folderId: string) => ListeningAudio[];

  // Folder operations
  onAddFolder: (name: string, level: JLPTLevel, lessonType: ListeningLessonType, lessonNumber?: number) => Promise<void>;
  onUpdateFolder: (id: string, data: Partial<ListeningFolder>) => Promise<void>;
  onDeleteFolder: (id: string) => Promise<void>;

  // Audio operations
  onAddAudio: (data: Omit<ListeningAudio, 'id' | 'createdAt' | 'createdBy'>, file: File) => Promise<void>;
  onAddTextAudio: (data: { title: string; description: string; textContent: string; jlptLevel: JLPTLevel; folderId: string; ttsMode?: TtsMode; kaiwaLines?: KaiwaLine[] }) => Promise<void>;
  onUpdateAudio: (id: string, data: Partial<ListeningAudio>) => Promise<void>;
  onDeleteAudio: (id: string) => Promise<void>;
  getAudioUrl: (audio: ListeningAudio) => Promise<string | null>;
  getFoldersByLevelLessonAndType: (level: JLPTLevel, lessonNumber: number, lessonType: ListeningLessonType) => ListeningFolder[];

  // State from hook
  showAddFolder: boolean;
  setShowAddFolder: (show: boolean) => void;
  showAddAudio: boolean;
  setShowAddAudio: (show: boolean) => void;
  newFolderName: string;
  setNewFolderName: (name: string) => void;
  editingFolder: { id: string; name: string } | null;
  setEditingFolder: (folder: { id: string; name: string } | null) => void;
  editingAudio: EditingAudio | null;
  setEditingAudio: (audio: EditingAudio | null) => void;
  playingAudioId: string | null;
  setPlayingAudioId: (id: string | null) => void;
  audioTitle: string;
  setAudioTitle: (title: string) => void;
  audioDescription: string;
  setAudioDescription: (desc: string) => void;
  selectedFile: File | null;
  setSelectedFile: (file: File | null) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  audioRef: React.RefObject<HTMLAudioElement | null>;
  showTextToSpeech: boolean;
  setShowTextToSpeech: (show: boolean) => void;
  ttsTitle: string;
  setTtsTitle: (title: string) => void;
  ttsText: string;
  setTtsText: (text: string) => void;
  ttsDescription: string;
  setTtsDescription: (desc: string) => void;
  ttsPreviewing: boolean;
  setTtsPreviewing: (previewing: boolean) => void;
  ttsMode: TtsMode;
  setTtsMode: (mode: TtsMode) => void;
  showCharacterModal: boolean;
  setShowCharacterModal: (show: boolean) => void;
  kaiwaLines: KaiwaLine[];
  setKaiwaLines: (lines: KaiwaLine[]) => void;
  generatingFurigana: 'title' | 'desc' | 'ttsText' | null;
  setGeneratingFurigana: (field: 'title' | 'desc' | 'ttsText' | null) => void;
}
