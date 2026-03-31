// Handler logic for ListeningAudioView, extracted to keep the view lean
import React from 'react';
import { removeFurigana } from '../../../lib/furigana-utils';
import { createUtteranceForCharacter } from '../../../hooks/use-kaiwa-characters';
import type { ListeningAudio, ListeningLessonType, KaiwaLine, TtsMode, KaiwaCharacter } from '../../../types/listening';
import type { JLPTLevel } from '../../../types/flashcard';
import type { EditingAudio } from './listening-audio-view-types';

interface UseListeningAudioHandlersParams {
  level: JLPTLevel;
  lessonNumber: number;
  lessonType: ListeningLessonType;
  typeLabel: string;
  kaiwaCharacters: KaiwaCharacter[];
  getCharacterByName: (name: string) => KaiwaCharacter | undefined;
  generateFurigana: (text: string) => Promise<string>;

  // Upload form state
  audioTitle: string; setAudioTitle: (v: string) => void;
  audioDescription: string; setAudioDescription: (v: string) => void;
  selectedFile: File | null; setSelectedFile: (f: File | null) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;

  // TTS form state
  ttsTitle: string; setTtsTitle: (v: string) => void;
  ttsText: string; setTtsText: (v: string) => void;
  ttsDescription: string; setTtsDescription: (v: string) => void;
  ttsMode: TtsMode;
  ttsPreviewing: boolean; setTtsPreviewing: (v: boolean) => void;
  kaiwaLines: KaiwaLine[]; setKaiwaLines: (lines: KaiwaLine[]) => void;

  // Editing state
  editingAudio: EditingAudio | null;
  setEditingAudio: (audio: EditingAudio | null) => void;
  editingFolder: { id: string; name: string } | null;
  setEditingFolder: (f: { id: string; name: string } | null) => void;

  // Folder add state
  newFolderName: string; setNewFolderName: (v: string) => void;
  setShowAddFolder: (v: boolean) => void;
  setShowAddAudio: (v: boolean) => void;
  setShowTextToSpeech: (v: boolean) => void;

  // Playing state
  playingAudioId: string | null; setPlayingAudioId: (id: string | null) => void;
  audioRef: React.RefObject<HTMLAudioElement | null>;

  // Furigana generating state
  generatingFurigana: 'title' | 'desc' | 'ttsText' | null;
  setGeneratingFurigana: (f: 'title' | 'desc' | 'ttsText' | null) => void;

  // Operations
  onAddFolder: (name: string, level: JLPTLevel, lessonType: ListeningLessonType, lessonNumber?: number) => Promise<void>;
  onUpdateFolder: (id: string, data: { name: string }) => Promise<void>;
  onDeleteFolder: (id: string) => Promise<void>;
  onAddAudio: (data: Omit<ListeningAudio, 'id' | 'createdAt' | 'createdBy'>, file: File) => Promise<void>;
  onAddTextAudio: (data: { title: string; description: string; textContent: string; jlptLevel: JLPTLevel; folderId: string; ttsMode?: TtsMode; kaiwaLines?: KaiwaLine[] }) => Promise<void>;
  onUpdateAudio: (id: string, data: Partial<ListeningAudio>) => Promise<void>;
  onDeleteAudio: (id: string) => Promise<void>;
  getAudioUrl: (audio: ListeningAudio) => Promise<string | null>;
  getFoldersByLevelLessonAndType: (level: JLPTLevel, lessonNumber: number, lessonType: ListeningLessonType) => Array<{ id: string }>;
}

export function useListeningAudioHandlers({
  level, lessonNumber, lessonType, typeLabel,
  kaiwaCharacters, getCharacterByName, generateFurigana,
  audioTitle, setAudioTitle,
  audioDescription, setAudioDescription,
  selectedFile, setSelectedFile, fileInputRef,
  ttsTitle, setTtsTitle, ttsText, setTtsText, ttsDescription, setTtsDescription,
  ttsMode, ttsPreviewing, setTtsPreviewing, kaiwaLines, setKaiwaLines,
  editingAudio, setEditingAudio,
  editingFolder, setEditingFolder,
  newFolderName, setNewFolderName,
  setShowAddFolder, setShowAddAudio, setShowTextToSpeech,
  playingAudioId, setPlayingAudioId, audioRef,
  generatingFurigana, setGeneratingFurigana,
  onAddFolder, onUpdateFolder, onDeleteFolder,
  onAddAudio, onAddTextAudio, onUpdateAudio, onDeleteAudio,
  getAudioUrl, getFoldersByLevelLessonAndType,
}: UseListeningAudioHandlersParams) {

  // --- Furigana ---
  const makeFuriganaHandler = (
    field: 'title' | 'desc' | 'ttsText',
    getter: () => string,
    setter: (v: string) => void,
  ) => async () => {
    if (!getter().trim() || generatingFurigana) return;
    setGeneratingFurigana(field);
    try { setter(await generateFurigana(getter())); }
    catch (err) { console.error('Furigana generation failed:', err); }
    finally { setGeneratingFurigana(null); }
  };

  const handleGenerateFuriganaTitle = makeFuriganaHandler('title', () => audioTitle, setAudioTitle);
  const handleGenerateFuriganaDesc = makeFuriganaHandler('desc', () => audioDescription, setAudioDescription);
  const handleGenerateFuriganaTtsText = makeFuriganaHandler('ttsText', () => ttsText, setTtsText);

  const handleGenerateFuriganaEditText = async () => {
    if (!editingAudio || !editingAudio.textContent.trim() || generatingFurigana) return;
    setGeneratingFurigana('ttsText');
    try { setEditingAudio({ ...editingAudio, textContent: await generateFurigana(editingAudio.textContent) }); }
    catch (err) { console.error('Furigana generation failed:', err); }
    finally { setGeneratingFurigana(null); }
  };

  // --- Folder ---
  const ensureFolderId = async (): Promise<string> => {
    const folders = getFoldersByLevelLessonAndType(level, lessonNumber, lessonType);
    if (folders.length > 0) return folders[0].id;
    await onAddFolder(`Bài ${lessonNumber} - ${typeLabel}`, level, lessonType, lessonNumber);
    const fresh = getFoldersByLevelLessonAndType(level, lessonNumber, lessonType);
    return fresh.length > 0 ? fresh[0].id : '';
  };

  const handleAddFolder = async () => {
    if (!newFolderName.trim()) return;
    await onAddFolder(newFolderName.trim(), level, lessonType, lessonNumber);
    setNewFolderName(''); setShowAddFolder(false);
  };

  const handleUpdateFolder = async () => {
    if (!editingFolder || !editingFolder.name.trim()) return;
    await onUpdateFolder(editingFolder.id, { name: editingFolder.name.trim() });
    setEditingFolder(null);
  };

  const handleDeleteFolder = async (id: string) => {
    if (!confirm('Xóa thư mục này và tất cả nội dung bên trong?')) return;
    await onDeleteFolder(id);
  };

  // --- Audio upload ---
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { setSelectedFile(file); if (!audioTitle) setAudioTitle(file.name.replace(/\.[^/.]+$/, '')); }
  };

  const handleAddAudio = async () => {
    if (!audioTitle.trim() || !selectedFile) return;
    const folderId = await ensureFolderId();
    if (!folderId) return;
    await onAddAudio({ title: audioTitle.trim(), description: audioDescription.trim(), jlptLevel: level, folderId, audioUrl: '', duration: 0 }, selectedFile);
    setAudioTitle(''); setAudioDescription(''); setSelectedFile(null); setShowAddAudio(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDeleteAudio = async (id: string) => {
    if (!confirm('Xóa file nghe này?')) return;
    await onDeleteAudio(id);
  };

  const handleUpdateTtsAudio = async () => {
    if (!editingAudio || !editingAudio.title.trim()) return;
    if (editingAudio.ttsMode === 'kaiwa' && editingAudio.kaiwaLines) {
      const validLines = editingAudio.kaiwaLines.filter(l => l.text.trim());
      await onUpdateAudio(editingAudio.id, { title: editingAudio.title.trim(), textContent: validLines.map(l => `${l.speaker}：${l.text}`).join('\n'), description: editingAudio.description.trim(), kaiwaLines: validLines });
    } else {
      await onUpdateAudio(editingAudio.id, { title: editingAudio.title.trim(), textContent: editingAudio.textContent.trim(), description: editingAudio.description.trim() });
    }
    setEditingAudio(null);
  };

  // --- TTS ---
  const handlePreviewTts = () => {
    if (ttsPreviewing) { speechSynthesis.cancel(); setTtsPreviewing(false); return; }
    setTtsPreviewing(true);
    if (ttsMode === 'kaiwa') {
      const validLines = kaiwaLines.filter(l => l.text.trim());
      if (validLines.length === 0) { setTtsPreviewing(false); return; }
      let idx = 0;
      const speakNext = () => {
        if (idx >= validLines.length) { setTtsPreviewing(false); return; }
        const line = validLines[idx++];
        const utterance = createUtteranceForCharacter(removeFurigana(line.text), getCharacterByName(line.speaker), 0.9);
        utterance.onend = speakNext; utterance.onerror = () => setTtsPreviewing(false);
        speechSynthesis.speak(utterance);
      };
      speakNext();
    } else {
      if (!ttsText.trim()) { setTtsPreviewing(false); return; }
      const utterance = new SpeechSynthesisUtterance(removeFurigana(ttsText));
      utterance.lang = 'ja-JP'; utterance.rate = 0.9;
      utterance.onend = () => setTtsPreviewing(false); utterance.onerror = () => setTtsPreviewing(false);
      speechSynthesis.speak(utterance);
    }
  };

  const handleAddTextAudio = async () => {
    if (!ttsTitle.trim()) return;
    if (ttsMode === 'single' && !ttsText.trim()) return;
    if (ttsMode === 'kaiwa' && kaiwaLines.every(l => !l.text.trim())) return;
    const folderId = await ensureFolderId();
    if (!folderId) return;
    const validLines = kaiwaLines.filter(l => l.text.trim());
    await onAddTextAudio({ title: ttsTitle.trim(), description: ttsDescription.trim(), textContent: ttsMode === 'kaiwa' ? validLines.map(l => `${l.speaker}：${l.text}`).join('\n') : ttsText.trim(), jlptLevel: level, folderId, ttsMode, kaiwaLines: ttsMode === 'kaiwa' ? validLines : undefined });
    setTtsTitle(''); setTtsText(''); setTtsDescription('');
    setKaiwaLines([{ speaker: kaiwaCharacters[0]?.name || '', text: '' }]);
    setShowTextToSpeech(false);
  };

  const handleCancelTts = () => {
    setShowTextToSpeech(false); setTtsTitle(''); setTtsText(''); setTtsDescription('');
    setKaiwaLines([{ speaker: kaiwaCharacters[0]?.name || '', text: '' }]);
    speechSynthesis.cancel(); setTtsPreviewing(false);
  };

  const handleCancelUpload = () => {
    setShowAddAudio(false); setSelectedFile(null); setAudioTitle(''); setAudioDescription('');
  };

  // --- Playback ---
  const togglePlayAudio = async (audio: ListeningAudio) => {
    if (playingAudioId === audio.id) {
      if (audio.isTextToSpeech) speechSynthesis.cancel(); else audioRef.current?.pause();
      setPlayingAudioId(null);
    } else {
      if (audio.isTextToSpeech) {
        speechSynthesis.cancel(); setPlayingAudioId(audio.id);
        if (audio.ttsMode === 'kaiwa' && audio.kaiwaLines?.length) {
          let idx = 0;
          const speakNext = () => {
            if (idx >= audio.kaiwaLines!.length) { setPlayingAudioId(null); return; }
            const line = audio.kaiwaLines![idx++];
            const utterance = createUtteranceForCharacter(removeFurigana(line.text), getCharacterByName(line.speaker), 0.9);
            utterance.onend = speakNext; utterance.onerror = () => setPlayingAudioId(null);
            speechSynthesis.speak(utterance);
          };
          speakNext();
        } else if (audio.textContent) {
          const utterance = new SpeechSynthesisUtterance(removeFurigana(audio.textContent));
          utterance.lang = 'ja-JP'; utterance.rate = 0.9;
          utterance.onend = () => setPlayingAudioId(null); utterance.onerror = () => setPlayingAudioId(null);
          speechSynthesis.speak(utterance);
        }
      } else {
        const url = await getAudioUrl(audio);
        if (url && audioRef.current) { audioRef.current.src = url; audioRef.current.play(); setPlayingAudioId(audio.id); }
      }
    }
  };

  return {
    handleGenerateFuriganaTitle,
    handleGenerateFuriganaDesc,
    handleGenerateFuriganaTtsText,
    handleGenerateFuriganaEditText,
    handleAddFolder,
    handleUpdateFolder,
    handleDeleteFolder,
    handleFileSelect,
    handleAddAudio,
    handleDeleteAudio,
    handleUpdateTtsAudio,
    handlePreviewTts,
    handleAddTextAudio,
    handleCancelTts,
    handleCancelUpload,
    togglePlayAudio,
  };
}
