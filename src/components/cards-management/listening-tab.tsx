// Listening Tab - Manage listening practice content by JLPT level, lesson number, and type
// Nav: root → level → lesson (Bài) → type (Loại) → audio
// Premium dark glassmorphism design

import { useState, useRef } from 'react';
import {
  Trash2, Edit2, Save, X, ChevronRight, ChevronLeft,
  Upload, Music, FolderPlus, Play, Pause, Headphones, Sparkles,
  BookOpen, MessageCircle, FileText, Layers, Wand2, Loader2
} from 'lucide-react';
import { useGroq } from '../../hooks/use-groq';
import { LevelGrid } from './level-grid';
import { LISTENING_LESSONS } from '../../hooks/use-listening';
import type { JLPTLevel } from '../../types/flashcard';
import type { CurrentUser } from '../../types/user';
import type { ListeningAudio, ListeningFolder, ListeningLessonType } from '../../types/listening';

const JLPT_LEVELS: JLPTLevel[] = ['N5', 'N4', 'N3', 'N2', 'N1'];
void JLPT_LEVELS;

// Lesson type configurations with new Japanese labels
const LESSON_TYPES: { value: ListeningLessonType; label: string; icon: typeof BookOpen }[] = [
  { value: 'practice', label: '練習', icon: BookOpen },
  { value: 'conversation', label: '会話', icon: MessageCircle },
  { value: 'reading', label: '読解', icon: FileText },
  { value: 'other', label: 'その他', icon: Layers },
];

// Level theme configurations
const LEVEL_THEMES: Record<JLPTLevel, { gradient: string; glow: string; border: string }> = {
  BT: { gradient: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)', glow: 'rgba(139, 92, 246, 0.4)', border: 'rgba(139, 92, 246, 0.3)' },
  N5: { gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', glow: 'rgba(16, 185, 129, 0.4)', border: 'rgba(16, 185, 129, 0.3)' },
  N4: { gradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', glow: 'rgba(59, 130, 246, 0.4)', border: 'rgba(59, 130, 246, 0.3)' },
  N3: { gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)', glow: 'rgba(139, 92, 246, 0.4)', border: 'rgba(139, 92, 246, 0.3)' },
  N2: { gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', glow: 'rgba(245, 158, 11, 0.4)', border: 'rgba(245, 158, 11, 0.3)' },
  N1: { gradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', glow: 'rgba(239, 68, 68, 0.4)', border: 'rgba(239, 68, 68, 0.3)' },
};

// Lesson type theme configurations
const LESSON_TYPE_THEMES: Record<ListeningLessonType, { gradient: string; glow: string }> = {
  practice: { gradient: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)', glow: 'rgba(34, 197, 94, 0.4)' },
  conversation: { gradient: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)', glow: 'rgba(236, 72, 153, 0.4)' },
  reading: { gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', glow: 'rgba(245, 158, 11, 0.4)' },
  other: { gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)', glow: 'rgba(139, 92, 246, 0.4)' },
};

type NavState =
  | { type: 'root' }
  | { type: 'level'; level: JLPTLevel }
  | { type: 'lesson'; level: JLPTLevel; lessonNumber: number }
  | { type: 'lessonType'; level: JLPTLevel; lessonNumber: number; lessonType: ListeningLessonType };

interface ListeningTabProps {
  audios: ListeningAudio[];
  folders: ListeningFolder[];
  onAddAudio: (data: Omit<ListeningAudio, 'id' | 'createdAt' | 'createdBy'>, file: File) => Promise<void>;
  onUpdateAudio: (id: string, data: Partial<ListeningAudio>) => Promise<void>;
  onDeleteAudio: (id: string) => Promise<void>;
  onAddFolder: (name: string, level: JLPTLevel, lessonType: ListeningLessonType, lessonNumber?: number) => Promise<void>;
  onUpdateFolder: (id: string, data: Partial<ListeningFolder>) => Promise<void>;
  onDeleteFolder: (id: string) => Promise<void>;
  getFoldersByLevel: (level: JLPTLevel) => ListeningFolder[];
  getFoldersByLevelAndType: (level: JLPTLevel, lessonType: ListeningLessonType) => ListeningFolder[];
  getFoldersByLevelLessonAndType: (level: JLPTLevel, lessonNumber: number, lessonType: ListeningLessonType) => ListeningFolder[];
  getAudiosByFolder: (folderId: string) => ListeningAudio[];
  getAudioUrl: (audio: ListeningAudio) => Promise<string | null>;
  currentUser: CurrentUser;
  isSuperAdmin: boolean;
}

export function ListeningTab({
  audios,
  onAddAudio,
  onDeleteAudio,
  onAddFolder,
  onUpdateFolder,
  onDeleteFolder,
  getFoldersByLevelLessonAndType,
  getAudiosByFolder,
  getAudioUrl,
}: ListeningTabProps) {
  const [navState, setNavState] = useState<NavState>({ type: 'root' });
  const [showAddFolder, setShowAddFolder] = useState(false);
  const [showAddAudio, setShowAddAudio] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [editingFolder, setEditingFolder] = useState<{ id: string; name: string } | null>(null);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);

  // Audio form state
  const [audioTitle, setAudioTitle] = useState('');
  const [audioDescription, setAudioDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Furigana generation
  const { generateFurigana } = useGroq();
  const [generatingFurigana, setGeneratingFurigana] = useState<'title' | 'desc' | null>(null);

  const handleGenerateFuriganaTitle = async () => {
    if (!audioTitle.trim() || generatingFurigana) return;
    setGeneratingFurigana('title');
    try {
      const result = await generateFurigana(audioTitle);
      setAudioTitle(result);
    } catch (err) {
      console.error('Furigana generation failed:', err);
    } finally {
      setGeneratingFurigana(null);
    }
  };

  const handleGenerateFuriganaDesc = async () => {
    if (!audioDescription.trim() || generatingFurigana) return;
    setGeneratingFurigana('desc');
    try {
      const result = await generateFurigana(audioDescription);
      setAudioDescription(result);
    } catch (err) {
      console.error('Furigana generation failed:', err);
    } finally {
      setGeneratingFurigana(null);
    }
  };

  // Get count by level
  const getCountByLevel = (level: JLPTLevel) => {
    return audios.filter(a => a.jlptLevel === level).length;
  };

  // Get audio count for a lesson number
  const getCountByLesson = (level: JLPTLevel, lessonNumber: number) => {
    const folders = getFoldersByLevelLessonAndType
      ? LESSON_TYPES.reduce((acc, lt) => {
          const f = getFoldersByLevelLessonAndType(level, lessonNumber, lt.value);
          return [...acc, ...f];
        }, [] as ListeningFolder[])
      : [];
    return folders.reduce((sum, f) => sum + getAudiosByFolder(f.id).length, 0);
  };

  // Get audio count for a lesson type within a lesson
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

  // Folder handlers
  const handleAddFolder = async () => {
    if (!newFolderName.trim() || navState.type !== 'lessonType') return;
    await onAddFolder(newFolderName.trim(), navState.level, navState.lessonType, navState.lessonNumber);
    setNewFolderName('');
    setShowAddFolder(false);
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

  // Audio handlers
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (!audioTitle) {
        setAudioTitle(file.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const handleAddAudio = async () => {
    if (!audioTitle.trim() || !selectedFile || navState.type !== 'lessonType') return;
    // Get the first folder for this level+lesson+type, or create one
    const typeFolders = getFoldersByLevelLessonAndType(navState.level, navState.lessonNumber, navState.lessonType);
    let folderId: string;
    if (typeFolders.length > 0) {
      folderId = typeFolders[0].id;
    } else {
      // Auto-create a folder
      const typeLabel = LESSON_TYPES.find(t => t.value === navState.lessonType)?.label || navState.lessonType;
      await onAddFolder(`Bài ${navState.lessonNumber} - ${typeLabel}`, navState.level, navState.lessonType, navState.lessonNumber);
      // Re-fetch after creation - use a temporary ID approach
      const newFolders = getFoldersByLevelLessonAndType(navState.level, navState.lessonNumber, navState.lessonType);
      folderId = newFolders.length > 0 ? newFolders[0].id : '';
      if (!folderId) return; // Safety check
    }

    await onAddAudio({
      title: audioTitle.trim(),
      description: audioDescription.trim(),
      jlptLevel: navState.level,
      folderId,
      audioUrl: '',
      duration: 0,
    }, selectedFile);

    setAudioTitle('');
    setAudioDescription('');
    setSelectedFile(null);
    setShowAddAudio(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDeleteAudio = async (id: string) => {
    if (!confirm('Xóa file nghe này?')) return;
    await onDeleteAudio(id);
  };

  const togglePlayAudio = async (audio: ListeningAudio) => {
    if (playingAudioId === audio.id) {
      audioRef.current?.pause();
      setPlayingAudioId(null);
    } else {
      const url = await getAudioUrl(audio);
      if (url && audioRef.current) {
        audioRef.current.src = url;
        audioRef.current.play();
        setPlayingAudioId(audio.id);
      }
    }
  };

  // Get lesson numbers for current level
  const getLessonNumbers = (level: JLPTLevel): number[] => {
    const config = LISTENING_LESSONS[level];
    if (!config) return [];
    const numbers: number[] = [];
    for (let i = config.start; i <= config.end; i++) {
      numbers.push(i);
    }
    return numbers;
  };

  // Get all audios for a lesson type (across all folders)
  const getAudiosForLessonType = (level: JLPTLevel, lessonNumber: number, lessonType: ListeningLessonType): ListeningAudio[] => {
    const typeFolders = getFoldersByLevelLessonAndType(level, lessonNumber, lessonType);
    return typeFolders.flatMap(f => getAudiosByFolder(f.id));
  };

  // ========== STYLES (shared across all views) ==========
  const sharedStyles = `
    .listening-tab {
      background: linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%);
      min-height: 100%;
      padding: 1.5rem;
    }

    .premium-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
      padding: 1rem 1.25rem;
      background: rgba(255, 255, 255, 0.03);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 16px;
    }

    .header-content {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .header-icon {
      position: relative;
      width: 48px;
      height: 48px;
      background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%);
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      box-shadow: 0 8px 32px rgba(139, 92, 246, 0.3);
    }

    .sparkle {
      position: absolute;
      color: #fbbf24;
      animation: sparkle 2s ease-in-out infinite;
    }

    .sparkle-1 { top: -3px; right: -3px; animation-delay: 0s; }
    .sparkle-2 { bottom: -2px; left: -2px; animation-delay: 0.5s; }

    @keyframes sparkle {
      0%, 100% { opacity: 0; transform: scale(0.5) rotate(0deg); }
      50% { opacity: 1; transform: scale(1) rotate(180deg); }
    }

    .header-text h3 {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 700;
      background: linear-gradient(135deg, #fff 0%, #c4b5fd 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .header-text p {
      margin: 0.25rem 0 0;
      font-size: 0.85rem;
      color: rgba(255, 255, 255, 0.5);
    }

    .nav-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
    }

    .nav-header h3 {
      flex: 1;
      font-size: 1.1rem;
      font-weight: 600;
      margin: 0;
      color: white;
    }

    .current-level, .current-type {
      padding: 0.35rem 0.75rem;
      border-radius: 8px;
      font-weight: 700;
      font-size: 0.85rem;
      color: white;
    }

    .back-btn, .add-btn {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.5rem 1rem;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 10px;
      font-size: 0.85rem;
      cursor: pointer;
      transition: all 0.3s ease;
      color: rgba(255, 255, 255, 0.8);
    }

    .back-btn:hover, .add-btn:hover {
      background: rgba(255, 255, 255, 0.12);
      border-color: rgba(255, 255, 255, 0.2);
      color: white;
    }

    .add-btn {
      background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%);
      border-color: transparent;
      color: white;
    }

    .add-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(139, 92, 246, 0.4);
    }

    @keyframes cardAppear {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }

    @keyframes itemAppear {
      from { opacity: 0; transform: translateX(-10px); }
      to { opacity: 1; transform: translateX(0); }
    }

    @keyframes slideDown {
      from { opacity: 0; transform: translateY(-10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes pulse {
      0%, 100% { transform: scale(1); opacity: 0.5; }
      50% { transform: scale(1.05); opacity: 0.7; }
    }

    .card-shine {
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
      transition: transform 0.6s ease;
      pointer-events: none;
    }

    /* Lesson Grid */
    .lesson-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
      gap: 0.75rem;
    }

    .lesson-card {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.35rem;
      padding: 1rem 0.5rem;
      background: rgba(255, 255, 255, 0.03);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      animation: cardAppear 0.5s ease backwards;
      animation-delay: var(--card-delay);
      overflow: hidden;
    }

    .lesson-card:hover {
      transform: translateY(-3px);
      border-color: rgba(255, 255, 255, 0.2);
      box-shadow: 0 12px 30px rgba(0, 0, 0, 0.3), 0 0 30px var(--level-glow, rgba(139, 92, 246, 0.2));
    }

    .lesson-card:hover .card-shine {
      transform: translateX(100%);
    }

    .lesson-number {
      font-size: 1.2rem;
      font-weight: 700;
      background: var(--level-gradient);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .lesson-label {
      font-size: 0.7rem;
      color: rgba(255, 255, 255, 0.5);
      font-weight: 500;
    }

    .lesson-count {
      font-size: 0.7rem;
      color: rgba(255, 255, 255, 0.4);
    }

    /* Lesson Type Grid */
    .lesson-type-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 1rem;
    }

    .lesson-type-card {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.75rem;
      padding: 1.5rem;
      background: rgba(255, 255, 255, 0.03);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 16px;
      cursor: pointer;
      transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      animation: cardAppear 0.5s ease backwards;
      animation-delay: var(--card-delay);
      overflow: hidden;
    }

    .lesson-type-card:hover {
      transform: translateY(-4px);
      border-color: rgba(255, 255, 255, 0.2);
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3), 0 0 40px var(--type-glow);
    }

    .lesson-type-card:hover .card-shine {
      transform: translateX(100%);
    }

    .lesson-type-card:hover .type-arrow {
      color: white;
      transform: translateY(-50%) translateX(3px);
    }

    .type-icon {
      width: 56px;
      height: 56px;
      background: var(--type-gradient);
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      box-shadow: 0 8px 24px var(--type-glow);
    }

    .type-name {
      font-size: 1.1rem;
      font-weight: 600;
      color: white;
    }

    .type-count {
      font-size: 0.85rem;
      color: rgba(255, 255, 255, 0.5);
    }

    .type-arrow {
      position: absolute;
      right: 1rem;
      top: 50%;
      transform: translateY(-50%);
      color: rgba(255, 255, 255, 0.3);
      transition: all 0.3s ease;
    }

    /* Folder & Audio list styles */
    .add-form, .edit-form {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 1rem;
      padding: 1rem;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 12px;
      animation: slideDown 0.3s ease;
    }

    .add-form input, .edit-form input {
      flex: 1;
      padding: 0.6rem 1rem;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      font-size: 0.9rem;
      color: white;
    }

    .add-form input::placeholder, .edit-form input::placeholder {
      color: rgba(255, 255, 255, 0.4);
    }

    .add-form input:focus, .edit-form input:focus {
      outline: none;
      border-color: rgba(139, 92, 246, 0.5);
    }

    .btn-save, .btn-cancel {
      padding: 0.6rem;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .btn-save {
      background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
      color: white;
    }

    .btn-save:hover { transform: scale(1.05); }

    .btn-cancel {
      background: rgba(255, 255, 255, 0.1);
      color: rgba(255, 255, 255, 0.7);
    }

    .btn-cancel:hover { background: rgba(255, 255, 255, 0.15); }

    .folder-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      margin-bottom: 1.5rem;
    }

    .folder-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 12px;
      overflow: hidden;
      animation: itemAppear 0.3s ease backwards;
      animation-delay: var(--item-delay);
      transition: all 0.3s ease;
    }

    .folder-item:hover {
      background: rgba(255, 255, 255, 0.05);
      border-color: rgba(255, 255, 255, 0.12);
    }

    .folder-btn {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
      background: none;
      border: none;
      cursor: pointer;
      text-align: left;
      transition: all 0.2s;
      color: rgba(255, 255, 255, 0.8);
      font-size: 0.9rem;
    }

    .folder-btn:hover { color: white; }
    .folder-btn svg:first-child { color: #8b5cf6; }

    .folder-name { flex: 1; font-weight: 500; color: inherit; }

    .folder-count {
      font-size: 0.75rem;
      color: rgba(255, 255, 255, 0.5);
      background: rgba(255, 255, 255, 0.08);
      padding: 0.25rem 0.6rem;
      border-radius: 10px;
    }

    .folder-actions {
      display: flex;
      gap: 0.25rem;
      padding-right: 0.75rem;
    }

    .folder-actions button {
      padding: 0.5rem;
      background: none;
      border: none;
      cursor: pointer;
      color: rgba(255, 255, 255, 0.4);
      border-radius: 8px;
      transition: all 0.2s;
    }

    .folder-actions button:hover {
      background: rgba(255, 255, 255, 0.1);
      color: white;
    }

    .folder-actions .delete-btn:hover {
      background: rgba(239, 68, 68, 0.2);
      color: #f87171;
    }

    /* Audio list */
    .audio-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .audio-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.875rem 1rem;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 12px;
      animation: itemAppear 0.3s ease backwards;
      animation-delay: var(--item-delay);
      transition: all 0.3s ease;
    }

    .audio-item:hover {
      background: rgba(255, 255, 255, 0.05);
      border-color: rgba(255, 255, 255, 0.12);
    }

    .play-btn {
      width: 44px;
      height: 44px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 50%;
      cursor: pointer;
      transition: all 0.3s ease;
      color: rgba(255, 255, 255, 0.7);
      flex-shrink: 0;
    }

    .play-btn:hover {
      background: var(--level-gradient);
      border-color: transparent;
      color: white;
      transform: scale(1.05);
    }

    .play-btn.playing {
      background: var(--level-gradient);
      border-color: transparent;
      color: white;
      animation: playPulse 1.5s ease-in-out infinite;
    }

    @keyframes playPulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.05); }
    }

    .audio-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
      min-width: 0;
    }

    .audio-title {
      font-weight: 500;
      color: white;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .audio-desc {
      font-size: 0.8rem;
      color: rgba(255, 255, 255, 0.5);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .audio-actions button {
      padding: 0.5rem;
      background: none;
      border: none;
      cursor: pointer;
      color: rgba(255, 255, 255, 0.4);
      border-radius: 8px;
      transition: all 0.2s;
    }

    .audio-actions .delete-btn:hover {
      background: rgba(239, 68, 68, 0.2);
      color: #f87171;
    }

    /* Upload form */
    .upload-form {
      margin-bottom: 1.5rem;
      padding: 1.25rem;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 16px;
      animation: slideDown 0.3s ease;
    }

    .form-row {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
      margin-bottom: 1rem;
    }

    .form-row label {
      font-size: 0.85rem;
      font-weight: 500;
      color: rgba(255, 255, 255, 0.7);
    }

    .label-with-furigana {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .furigana-btn {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.35rem 0.65rem;
      background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%);
      color: white;
      border: none;
      border-radius: 6px;
      font-size: 0.7rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }

    .furigana-btn:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4);
    }

    .furigana-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .spin-icon {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    .file-input-wrapper { position: relative; }

    .form-row input[type="file"] {
      padding: 0.6rem;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 10px;
      color: rgba(255, 255, 255, 0.8);
      width: 100%;
    }

    .form-row input[type="text"], .form-row textarea {
      padding: 0.7rem 1rem;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 10px;
      font-size: 0.9rem;
      color: white;
      resize: none;
    }

    .form-row input::placeholder, .form-row textarea::placeholder {
      color: rgba(255, 255, 255, 0.4);
    }

    .form-row input:focus, .form-row textarea:focus {
      outline: none;
      border-color: rgba(139, 92, 246, 0.5);
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;
    }

    .form-actions .btn-save, .form-actions .btn-cancel {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.6rem 1rem;
      border-radius: 10px;
      font-size: 0.85rem;
      cursor: pointer;
      transition: all 0.2s;
      border: none;
    }

    .form-actions .btn-save {
      background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
      color: white;
    }

    .form-actions .btn-save:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(34, 197, 94, 0.4);
    }

    .form-actions .btn-cancel {
      background: rgba(255, 255, 255, 0.08);
      color: rgba(255, 255, 255, 0.7);
    }

    .form-actions .btn-cancel:hover {
      background: rgba(255, 255, 255, 0.12);
    }

    /* Empty state */
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.75rem;
      padding: 4rem 2rem;
      color: rgba(255, 255, 255, 0.5);
      text-align: center;
      animation: fadeIn 0.5s ease;
    }

    .empty-icon {
      width: 80px;
      height: 80px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 20px;
      animation: pulse 3s ease-in-out infinite;
    }

    .empty-state p {
      margin: 0;
      font-size: 1rem;
      color: rgba(255, 255, 255, 0.7);
    }

    .empty-hint {
      font-size: 0.85rem;
      color: rgba(255, 255, 255, 0.4);
    }

    /* Section title for folders within lesson type */
    .section-title {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 0.75rem;
    }

    .section-title h4 {
      margin: 0;
      font-size: 0.95rem;
      font-weight: 600;
      color: rgba(255, 255, 255, 0.7);
    }
  `;

  // ========== ROOT VIEW ==========
  if (navState.type === 'root') {
    return (
      <div className="listening-tab">
        <div className="premium-header">
          <div className="header-content">
            <div className="header-icon">
              <Headphones size={24} />
              <Sparkles className="sparkle sparkle-1" size={10} />
              <Sparkles className="sparkle sparkle-2" size={8} />
            </div>
            <div className="header-text">
              <h3>Quản lí Nghe Hiểu</h3>
              <p>Chọn cấp độ để quản lí nội dung luyện nghe</p>
            </div>
          </div>
        </div>

        <LevelGrid
          onSelectLevel={goToLevel}
          getCount={getCountByLevel}
          countLabel="file"
        />

        <audio ref={audioRef} onEnded={() => setPlayingAudioId(null)} />
        <style>{sharedStyles}</style>
      </div>
    );
  }

  // ========== LEVEL VIEW - Lesson Grid (Bài) ==========
  if (navState.type === 'level') {
    const theme = LEVEL_THEMES[navState.level];
    const lessonNumbers = getLessonNumbers(navState.level);

    return (
      <div className="listening-tab">
        <div className="nav-header">
          <button className="back-btn" onClick={goBack}>
            <ChevronLeft size={18} /> Quay lại
          </button>
          <span className="current-level" style={{ background: theme.gradient }}>
            {navState.level}
          </span>
          <h3>Chọn bài học</h3>
        </div>

        {lessonNumbers.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <Music size={48} strokeWidth={1} />
            </div>
            <p>Chưa có bài học cho cấp độ này</p>
            <span className="empty-hint">N3, N2, N1 sẽ được thêm sau</span>
          </div>
        ) : (
          <div className="lesson-grid">
            {lessonNumbers.map((num, idx) => {
              const count = getCountByLesson(navState.level, num);
              return (
                <button
                  key={num}
                  className="lesson-card"
                  onClick={() => goToLesson(num)}
                  style={{
                    '--card-delay': `${Math.min(idx * 0.03, 0.5)}s`,
                    '--level-gradient': theme.gradient,
                    '--level-glow': theme.glow,
                  } as React.CSSProperties}
                >
                  <span className="lesson-number">{num}</span>
                  <span className="lesson-label">Bài</span>
                  {count > 0 && <span className="lesson-count">{count} file</span>}
                  <div className="card-shine" />
                </button>
              );
            })}
          </div>
        )}

        <audio ref={audioRef} onEnded={() => setPlayingAudioId(null)} />
        <style>{sharedStyles}</style>
      </div>
    );
  }

  // ========== LESSON VIEW - Type Selection (Loại) ==========
  if (navState.type === 'lesson') {
    const theme = LEVEL_THEMES[navState.level];

    return (
      <div className="listening-tab">
        <div className="nav-header">
          <button className="back-btn" onClick={goBack}>
            <ChevronLeft size={18} /> {navState.level}
          </button>
          <span className="current-level" style={{ background: theme.gradient }}>
            Bài {navState.lessonNumber}
          </span>
          <h3>Chọn loại</h3>
        </div>

        <div className="lesson-type-grid">
          {LESSON_TYPES.map((type, idx) => {
            const typeTheme = LESSON_TYPE_THEMES[type.value];
            const count = getCountByLessonType(navState.level, navState.lessonNumber, type.value);
            const Icon = type.icon;
            return (
              <button
                key={type.value}
                className="lesson-type-card"
                onClick={() => goToLessonType(type.value)}
                style={{
                  '--card-delay': `${idx * 0.1}s`,
                  '--type-gradient': typeTheme.gradient,
                  '--type-glow': typeTheme.glow,
                } as React.CSSProperties}
              >
                <div className="type-icon">
                  <Icon size={24} />
                </div>
                <span className="type-name">{type.label}</span>
                <span className="type-count">{count} file</span>
                <ChevronRight size={18} className="type-arrow" />
                <div className="card-shine" />
              </button>
            );
          })}
        </div>

        <audio ref={audioRef} onEnded={() => setPlayingAudioId(null)} />
        <style>{sharedStyles}</style>
      </div>
    );
  }

  // ========== LESSON TYPE VIEW - Audio list + folders + upload ==========
  const theme = LEVEL_THEMES[navState.level];
  const typeTheme = LESSON_TYPE_THEMES[navState.lessonType];
  const typeLabel = LESSON_TYPES.find(t => t.value === navState.lessonType)?.label || '';
  const typeFolders = getFoldersByLevelLessonAndType(navState.level, navState.lessonNumber, navState.lessonType);
  const allAudios = getAudiosForLessonType(navState.level, navState.lessonNumber, navState.lessonType);

  return (
    <div className="listening-tab">
      <div className="nav-header">
        <button className="back-btn" onClick={goBack}>
          <ChevronLeft size={18} /> Bài {navState.lessonNumber}
        </button>
        <span className="current-level" style={{ background: theme.gradient }}>
          {navState.level}
        </span>
        <span className="current-type" style={{ background: typeTheme.gradient }}>
          {typeLabel}
        </span>
        <h3>{allAudios.length} file</h3>
        <button className="add-btn" onClick={() => setShowAddAudio(true)}>
          <Upload size={18} /> Tải file
        </button>
      </div>

      {/* Upload form */}
      {showAddAudio && (
        <div className="upload-form">
          <div className="form-row">
            <label>File nghe:</label>
            <div className="file-input-wrapper">
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                onChange={handleFileSelect}
              />
            </div>
          </div>
          {selectedFile && (
            <>
              <div className="form-row">
                <label className="label-with-furigana">
                  <span>Tiêu đề:</span>
                  <button
                    type="button"
                    className="furigana-btn"
                    onClick={handleGenerateFuriganaTitle}
                    disabled={!!generatingFurigana || !audioTitle.trim()}
                    title="Tạo furigana"
                  >
                    {generatingFurigana === 'title' ? <Loader2 size={14} className="spin-icon" /> : <Wand2 size={14} />}
                    <span>Furigana</span>
                  </button>
                </label>
                <input
                  type="text"
                  placeholder="Nhập tiêu đề..."
                  value={audioTitle}
                  onChange={e => setAudioTitle(e.target.value)}
                />
              </div>
              <div className="form-row">
                <label className="label-with-furigana">
                  <span>Mô tả:</span>
                  <button
                    type="button"
                    className="furigana-btn"
                    onClick={handleGenerateFuriganaDesc}
                    disabled={!!generatingFurigana || !audioDescription.trim()}
                    title="Tạo furigana"
                  >
                    {generatingFurigana === 'desc' ? <Loader2 size={14} className="spin-icon" /> : <Wand2 size={14} />}
                    <span>Furigana</span>
                  </button>
                </label>
                <textarea
                  placeholder="Mô tả (tuỳ chọn)..."
                  value={audioDescription}
                  onChange={e => setAudioDescription(e.target.value)}
                  rows={2}
                />
              </div>
              <div className="form-actions">
                <button className="btn-cancel" onClick={() => {
                  setShowAddAudio(false);
                  setSelectedFile(null);
                  setAudioTitle('');
                  setAudioDescription('');
                }}><X size={16} /> Huỷ</button>
                <button className="btn-save" onClick={handleAddAudio}>
                  <Upload size={16} /> Tải lên
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Folder management */}
      <div className="section-title">
        <h4>Thư mục</h4>
        <button className="add-btn" onClick={() => setShowAddFolder(true)} style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}>
          <FolderPlus size={14} /> Thêm
        </button>
      </div>

      {showAddFolder && (
        <div className="add-form">
          <input
            type="text"
            placeholder="Tên thư mục mới..."
            value={newFolderName}
            onChange={e => setNewFolderName(e.target.value)}
            autoFocus
          />
          <button className="btn-save" onClick={handleAddFolder}><Save size={16} /></button>
          <button className="btn-cancel" onClick={() => { setShowAddFolder(false); setNewFolderName(''); }}><X size={16} /></button>
        </div>
      )}

      {typeFolders.length > 0 && (
        <div className="folder-list">
          {typeFolders.map((folder, idx) => (
            <div
              key={folder.id}
              className="folder-item"
              style={{ '--item-delay': `${idx * 0.05}s` } as React.CSSProperties}
            >
              {editingFolder?.id === folder.id ? (
                <div className="edit-form">
                  <input
                    type="text"
                    value={editingFolder.name}
                    onChange={e => setEditingFolder({ ...editingFolder, name: e.target.value })}
                    autoFocus
                  />
                  <button className="btn-save" onClick={handleUpdateFolder}><Save size={16} /></button>
                  <button className="btn-cancel" onClick={() => setEditingFolder(null)}><X size={16} /></button>
                </div>
              ) : (
                <>
                  <div className="folder-btn">
                    <span className="folder-name">{folder.name}</span>
                    <span className="folder-count">{getAudiosByFolder(folder.id).length}</span>
                  </div>
                  <div className="folder-actions">
                    <button onClick={() => setEditingFolder({ id: folder.id, name: folder.name })}><Edit2 size={16} /></button>
                    <button className="delete-btn" onClick={() => handleDeleteFolder(folder.id)}><Trash2 size={16} /></button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Audio list */}
      <div className="audio-list">
        {allAudios.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <Music size={48} strokeWidth={1} />
            </div>
            <p>Chưa có file nghe nào</p>
            <span className="empty-hint">Nhấn "Tải file" để thêm nội dung mới</span>
          </div>
        ) : (
          allAudios.map((audio, idx) => (
            <div
              key={audio.id}
              className="audio-item"
              style={{ '--item-delay': `${idx * 0.05}s` } as React.CSSProperties}
            >
              <button
                className={`play-btn ${playingAudioId === audio.id ? 'playing' : ''}`}
                onClick={() => togglePlayAudio(audio)}
                style={{ '--level-gradient': theme.gradient } as React.CSSProperties}
              >
                {playingAudioId === audio.id ? <Pause size={20} /> : <Play size={20} />}
              </button>
              <div className="audio-info">
                <span className="audio-title">{audio.title}</span>
                {audio.description && <span className="audio-desc">{audio.description}</span>}
              </div>
              <div className="audio-actions">
                <button className="delete-btn" onClick={() => handleDeleteAudio(audio.id)}><Trash2 size={16} /></button>
              </div>
            </div>
          ))
        )}
      </div>

      <audio ref={audioRef} onEnded={() => setPlayingAudioId(null)} />
      <style>{sharedStyles}</style>
    </div>
  );
}
