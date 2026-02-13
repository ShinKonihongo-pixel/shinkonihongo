// Audio list view with TTS forms and audio management
import React from 'react';
import {
  Trash2, Edit2, Save, X, ChevronLeft, Upload, Music,
  FolderPlus, Play, Pause, Type, Users, Settings, Wand2,
  Loader2, Volume2, Square, Plus
} from 'lucide-react';
import { LEVEL_THEMES } from '../../../constants/themes';
import { LESSON_TYPES, LESSON_TYPE_THEMES } from './listening-tab-types';
import { useGroq } from '../../../hooks/use-groq';
import { removeFurigana, hasFurigana } from '../../../lib/furigana-utils';
import { FuriganaText } from '../../common/furigana-text';
import { useKaiwaCharacters, createUtteranceForCharacter, getPresetForCharacter } from '../../../hooks/use-kaiwa-characters';
import { KaiwaCharacterModal } from '../kaiwa-character-modal';
import type { JLPTLevel } from '../../../types/flashcard';
import type { ListeningAudio, ListeningFolder, ListeningLessonType, KaiwaLine, TtsMode } from '../../../types/listening';

interface ListeningAudioViewProps {
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
  editingAudio: { id: string; title: string; textContent: string; description: string; ttsMode?: TtsMode; kaiwaLines?: KaiwaLine[] } | null;
  setEditingAudio: (audio: { id: string; title: string; textContent: string; description: string; ttsMode?: TtsMode; kaiwaLines?: KaiwaLine[] } | null) => void;
  playingAudioId: string | null;
  setPlayingAudioId: (id: string | null) => void;
  audioTitle: string;
  setAudioTitle: (title: string) => void;
  audioDescription: string;
  setAudioDescription: (desc: string) => void;
  selectedFile: File | null;
  setSelectedFile: (file: File | null) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  audioRef: React.RefObject<HTMLAudioElement>;
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
  sharedStyles: string;
}

export function ListeningAudioView({
  level,
  lessonNumber,
  lessonType,
  onBack,
  typeFolders,
  allAudios,
  getAudiosByFolder,
  onAddFolder,
  onUpdateFolder,
  onDeleteFolder,
  onAddAudio,
  onAddTextAudio,
  onUpdateAudio,
  onDeleteAudio,
  getAudioUrl,
  getFoldersByLevelLessonAndType,
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
  playingAudioId,
  setPlayingAudioId,
  audioTitle,
  setAudioTitle,
  audioDescription,
  setAudioDescription,
  selectedFile,
  setSelectedFile,
  fileInputRef,
  audioRef,
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
  showCharacterModal,
  setShowCharacterModal,
  kaiwaLines,
  setKaiwaLines,
  generatingFurigana,
  setGeneratingFurigana,
  sharedStyles,
}: ListeningAudioViewProps) {
  const theme = LEVEL_THEMES[level];
  const typeTheme = LESSON_TYPE_THEMES[lessonType];
  const typeLabel = LESSON_TYPES.find(t => t.value === lessonType)?.label || '';

  // Kaiwa character system
  const { characters: kaiwaCharacters, jaVoices, addCharacter, updateCharacter, deleteCharacter, getCharacterByName } = useKaiwaCharacters();

  // Furigana generation
  const { generateFurigana } = useGroq();

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

  const handleGenerateFuriganaTtsText = async () => {
    if (!ttsText.trim() || generatingFurigana) return;
    setGeneratingFurigana('ttsText');
    try {
      const result = await generateFurigana(ttsText);
      setTtsText(result);
    } catch (err) {
      console.error('Furigana generation failed:', err);
    } finally {
      setGeneratingFurigana(null);
    }
  };

  const handleGenerateFuriganaEditText = async () => {
    if (!editingAudio || !editingAudio.textContent.trim() || generatingFurigana) return;
    setGeneratingFurigana('ttsText');
    try {
      const result = await generateFurigana(editingAudio.textContent);
      setEditingAudio({ ...editingAudio, textContent: result });
    } catch (err) {
      console.error('Furigana generation failed:', err);
    } finally {
      setGeneratingFurigana(null);
    }
  };

  // Folder handlers
  const handleAddFolder = async () => {
    if (!newFolderName.trim()) return;
    await onAddFolder(newFolderName.trim(), level, lessonType, lessonNumber);
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
    if (!audioTitle.trim() || !selectedFile) return;
    // Get the first folder for this level+lesson+type, or create one
    const folders = getFoldersByLevelLessonAndType(level, lessonNumber, lessonType);
    let folderId: string;
    if (folders.length > 0) {
      folderId = folders[0].id;
    } else {
      // Auto-create a folder
      await onAddFolder(`Bài ${lessonNumber} - ${typeLabel}`, level, lessonType, lessonNumber);
      // Re-fetch after creation
      const newFolders = getFoldersByLevelLessonAndType(level, lessonNumber, lessonType);
      folderId = newFolders.length > 0 ? newFolders[0].id : '';
      if (!folderId) return;
    }

    await onAddAudio({
      title: audioTitle.trim(),
      description: audioDescription.trim(),
      jlptLevel: level,
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

  const handleUpdateTtsAudio = async () => {
    if (!editingAudio || !editingAudio.title.trim()) return;
    if (editingAudio.ttsMode === 'kaiwa' && editingAudio.kaiwaLines) {
      const validLines = editingAudio.kaiwaLines.filter(l => l.text.trim());
      const textContent = validLines.map(l => `${l.speaker}：${l.text}`).join('\n');
      await onUpdateAudio(editingAudio.id, {
        title: editingAudio.title.trim(),
        textContent,
        description: editingAudio.description.trim(),
        kaiwaLines: validLines,
      });
    } else {
      await onUpdateAudio(editingAudio.id, {
        title: editingAudio.title.trim(),
        textContent: editingAudio.textContent.trim(),
        description: editingAudio.description.trim(),
      });
    }
    setEditingAudio(null);
  };

  // TTS handlers
  const handlePreviewTts = () => {
    if (ttsPreviewing) {
      speechSynthesis.cancel();
      setTtsPreviewing(false);
      return;
    }
    setTtsPreviewing(true);

    if (ttsMode === 'kaiwa') {
      const validLines = kaiwaLines.filter(l => l.text.trim());
      if (validLines.length === 0) { setTtsPreviewing(false); return; }
      let idx = 0;
      const speakNext = () => {
        if (idx >= validLines.length) { setTtsPreviewing(false); return; }
        const line = validLines[idx++];
        const character = getCharacterByName(line.speaker);
        const utterance = createUtteranceForCharacter(removeFurigana(line.text), character, 0.9);
        utterance.onend = speakNext;
        utterance.onerror = () => setTtsPreviewing(false);
        speechSynthesis.speak(utterance);
      };
      speakNext();
    } else {
      if (!ttsText.trim()) { setTtsPreviewing(false); return; }
      const plainText = removeFurigana(ttsText);
      const utterance = new SpeechSynthesisUtterance(plainText);
      utterance.lang = 'ja-JP';
      utterance.rate = 0.9;
      utterance.onend = () => setTtsPreviewing(false);
      utterance.onerror = () => setTtsPreviewing(false);
      speechSynthesis.speak(utterance);
    }
  };

  const handleAddTextAudio = async () => {
    if (!ttsTitle.trim()) return;
    if (ttsMode === 'single' && !ttsText.trim()) return;
    if (ttsMode === 'kaiwa' && kaiwaLines.every(l => !l.text.trim())) return;

    const folders = getFoldersByLevelLessonAndType(level, lessonNumber, lessonType);
    let folderId: string;
    if (folders.length > 0) {
      folderId = folders[0].id;
    } else {
      await onAddFolder(`Bài ${lessonNumber} - ${typeLabel}`, level, lessonType, lessonNumber);
      const newFolders = getFoldersByLevelLessonAndType(level, lessonNumber, lessonType);
      folderId = newFolders.length > 0 ? newFolders[0].id : '';
      if (!folderId) return;
    }

    const validLines = kaiwaLines.filter(l => l.text.trim());
    const textContent = ttsMode === 'kaiwa'
      ? validLines.map(l => `${l.speaker}：${l.text}`).join('\n')
      : ttsText.trim();

    await onAddTextAudio({
      title: ttsTitle.trim(),
      description: ttsDescription.trim(),
      textContent,
      jlptLevel: level,
      folderId,
      ttsMode,
      kaiwaLines: ttsMode === 'kaiwa' ? validLines : undefined,
    });

    // Reset form
    setTtsTitle('');
    setTtsText('');
    setTtsDescription('');
    setKaiwaLines([{ speaker: kaiwaCharacters[0]?.name || '', text: '' }]);
    setShowTextToSpeech(false);
  };

  const togglePlayAudio = async (audio: ListeningAudio) => {
    if (playingAudioId === audio.id) {
      if (audio.isTextToSpeech) {
        speechSynthesis.cancel();
      } else {
        audioRef.current?.pause();
      }
      setPlayingAudioId(null);
    } else {
      if (audio.isTextToSpeech) {
        speechSynthesis.cancel();
        setPlayingAudioId(audio.id);

        if (audio.ttsMode === 'kaiwa' && audio.kaiwaLines?.length) {
          let idx = 0;
          const speakNext = () => {
            if (idx >= audio.kaiwaLines!.length) { setPlayingAudioId(null); return; }
            const line = audio.kaiwaLines![idx++];
            const character = getCharacterByName(line.speaker);
            const utterance = createUtteranceForCharacter(removeFurigana(line.text), character, 0.9);
            utterance.onend = speakNext;
            utterance.onerror = () => setPlayingAudioId(null);
            speechSynthesis.speak(utterance);
          };
          speakNext();
        } else if (audio.textContent) {
          const utterance = new SpeechSynthesisUtterance(removeFurigana(audio.textContent));
          utterance.lang = 'ja-JP';
          utterance.rate = 0.9;
          utterance.onend = () => setPlayingAudioId(null);
          utterance.onerror = () => setPlayingAudioId(null);
          speechSynthesis.speak(utterance);
        }
      } else {
        const url = await getAudioUrl(audio);
        if (url && audioRef.current) {
          audioRef.current.src = url;
          audioRef.current.play();
          setPlayingAudioId(audio.id);
        }
      }
    }
  };

  return (
    <div className="listening-tab">
      <div className="nav-header">
        <button className="back-btn" onClick={onBack}>
          <ChevronLeft size={18} /> Bài {lessonNumber}
        </button>
        <span className="current-level" style={{ background: theme.gradient }}>
          {level}
        </span>
        <span className="current-type" style={{ background: typeTheme.gradient }}>
          {typeLabel}
        </span>
        <h3>{allAudios.length} file</h3>
        {/* TODO: Re-enable when Firebase Storage CORS is fixed */}
        {/* <button className="add-btn" onClick={() => { setShowAddAudio(true); setShowTextToSpeech(false); }}>
          <Upload size={18} /> Tải file
        </button> */}
        <button className="add-btn" onClick={() => { setShowTextToSpeech(true); setShowAddAudio(false); }} style={{ background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)' }}>
          <Type size={18} /> Tạo từ text
        </button>
      </div>

      {/* TTS form */}
      {showTextToSpeech && (
        <div className="upload-form">
          <div className="form-row">
            <label>Tiêu đề:</label>
            <input
              type="text"
              placeholder="Nhập tiêu đề..."
              value={ttsTitle}
              onChange={e => setTtsTitle(e.target.value)}
            />
          </div>

          {/* Mode toggle: Câu đơn / Kaiwa */}
          <div className="tts-mode-toggle">
            <button
              className={`mode-btn ${ttsMode === 'single' ? 'active' : ''}`}
              onClick={() => setTtsMode('single')}
            >
              <Type size={16} /> Câu đơn
            </button>
            <button
              className={`mode-btn ${ttsMode === 'kaiwa' ? 'active' : ''}`}
              onClick={() => setTtsMode('kaiwa')}
            >
              <Users size={16} /> Kaiwa
            </button>
          </div>

          {/* Single mode */}
          {ttsMode === 'single' && (
            <div className="form-row">
              <label className="label-with-furigana">
                <span>Nội dung tiếng Nhật:</span>
                <button
                  type="button"
                  className="furigana-btn"
                  onClick={handleGenerateFuriganaTtsText}
                  disabled={!!generatingFurigana || !ttsText.trim()}
                  title="Tạo furigana cho mỗi chữ kanji"
                >
                  {generatingFurigana === 'ttsText' ? <Loader2 size={14} className="spin-icon" /> : <Wand2 size={14} />}
                  <span>Furigana</span>
                </button>
              </label>
              <textarea
                placeholder="Nhập nội dung tiếng Nhật để đọc..."
                value={ttsText}
                onChange={e => setTtsText(e.target.value)}
                rows={4}
              />
              {hasFurigana(ttsText) && (
                <div className="furigana-preview">
                  <FuriganaText text={ttsText} showFurigana={true} />
                </div>
              )}
            </div>
          )}

          {/* Kaiwa mode */}
          {ttsMode === 'kaiwa' && (
            <>
              {/* Character management */}
              <div className="kaiwa-characters">
                <label>Nhân vật:</label>
                <div className="character-list">
                  {kaiwaCharacters.map(char => {
                    const preset = getPresetForCharacter(char);
                    return (
                      <span key={char.id} className="character-tag">
                        {preset?.emoji || '👤'} {char.name}
                      </span>
                    );
                  })}
                  <button
                    className="add-btn"
                    onClick={() => setShowCharacterModal(true)}
                    style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                  >
                    <Settings size={14} /> Cài đặt
                  </button>
                </div>
              </div>

              {/* Dialogue lines */}
              <div className="kaiwa-lines">
                <label>Hội thoại:</label>
                {kaiwaLines.map((line, idx) => (
                  <div key={idx} className="kaiwa-line">
                    <select
                      value={line.speaker}
                      onChange={e => {
                        const updated = [...kaiwaLines];
                        updated[idx] = { ...updated[idx], speaker: e.target.value };
                        setKaiwaLines(updated);
                      }}
                      className="speaker-select"
                    >
                      {kaiwaCharacters.map(c => { const p = getPresetForCharacter(c); return <option key={c.id} value={c.name}>{p?.emoji || '👤'} {c.name}</option>; })}
                    </select>
                    <input
                      type="text"
                      placeholder="Nội dung câu nói..."
                      value={line.text}
                      onChange={e => {
                        const updated = [...kaiwaLines];
                        updated[idx] = { ...updated[idx], text: e.target.value };
                        setKaiwaLines(updated);
                      }}
                    />
                    {kaiwaLines.length > 1 && (
                      <button className="btn-cancel" onClick={() => setKaiwaLines(kaiwaLines.filter((_, i) => i !== idx))} style={{ padding: '0.4rem' }}>
                        <X size={14} />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  className="add-btn"
                  onClick={() => setKaiwaLines([...kaiwaLines, { speaker: kaiwaCharacters[0]?.name || '', text: '' }])}
                  style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', alignSelf: 'flex-start' }}
                >
                  <Plus size={14} /> Thêm câu
                </button>
              </div>
            </>
          )}

          <div className="form-row">
            <label>Mô tả (tuỳ chọn):</label>
            <textarea
              placeholder="Mô tả hoặc bản dịch..."
              value={ttsDescription}
              onChange={e => setTtsDescription(e.target.value)}
              rows={2}
            />
          </div>
          <div className="form-actions">
            <button className="btn-cancel" onClick={() => {
              setShowTextToSpeech(false);
              setTtsTitle('');
              setTtsText('');
              setTtsDescription('');
              setKaiwaLines([{ speaker: kaiwaCharacters[0]?.name || '', text: '' }]);
              speechSynthesis.cancel();
              setTtsPreviewing(false);
            }}><X size={16} /> Huỷ</button>
            <button
              className="btn-save"
              onClick={handlePreviewTts}
              style={{ background: ttsPreviewing ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' : 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)' }}
              disabled={ttsMode === 'single' ? !ttsText.trim() : kaiwaLines.every(l => !l.text.trim())}
            >
              {ttsPreviewing ? <><Square size={16} /> Dừng</> : <><Volume2 size={16} /> Nghe thử</>}
            </button>
            <button className="btn-save" onClick={handleAddTextAudio} disabled={!ttsTitle.trim() || (ttsMode === 'single' ? !ttsText.trim() : kaiwaLines.every(l => !l.text.trim()))}>
              <Save size={16} /> Lưu
            </button>
          </div>
        </div>
      )}

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
            <span className="empty-hint">Nhấn "Tạo từ text" để thêm nội dung mới</span>
          </div>
        ) : (
          allAudios.map((audio, idx) => (
            <div
              key={audio.id}
              className={`audio-item ${editingAudio?.id === audio.id ? 'editing' : ''}`}
              style={{ '--item-delay': `${idx * 0.05}s` } as React.CSSProperties}
            >
              {editingAudio?.id === audio.id ? (
                /* Inline edit form for TTS entries */
                <div className="audio-edit-form">
                  <div className="form-row">
                    <label>Tiêu đề:</label>
                    <input
                      type="text"
                      value={editingAudio.title}
                      onChange={e => setEditingAudio({ ...editingAudio, title: e.target.value })}
                      autoFocus
                    />
                  </div>

                  {/* Kaiwa edit: line-by-line editor */}
                  {editingAudio.ttsMode === 'kaiwa' && editingAudio.kaiwaLines ? (
                    <div className="kaiwa-lines">
                      <label>Hội thoại:</label>
                      {editingAudio.kaiwaLines.map((line, idx) => (
                        <div key={idx} className="kaiwa-line">
                          <select
                            value={line.speaker}
                            onChange={e => {
                              const updated = [...editingAudio.kaiwaLines!];
                              updated[idx] = { ...updated[idx], speaker: e.target.value };
                              setEditingAudio({ ...editingAudio, kaiwaLines: updated });
                            }}
                            className="speaker-select"
                          >
                            {kaiwaCharacters.map(c => { const p = getPresetForCharacter(c); return <option key={c.id} value={c.name}>{p?.emoji || '👤'} {c.name}</option>; })}
                          </select>
                          <input
                            type="text"
                            placeholder="Nội dung câu nói..."
                            value={line.text}
                            onChange={e => {
                              const updated = [...editingAudio.kaiwaLines!];
                              updated[idx] = { ...updated[idx], text: e.target.value };
                              setEditingAudio({ ...editingAudio, kaiwaLines: updated });
                            }}
                          />
                          {editingAudio.kaiwaLines!.length > 1 && (
                            <button className="btn-cancel" onClick={() => {
                              const updated = editingAudio.kaiwaLines!.filter((_, i) => i !== idx);
                              setEditingAudio({ ...editingAudio, kaiwaLines: updated });
                            }} style={{ padding: '0.4rem' }}>
                              <X size={14} />
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        className="add-btn"
                        onClick={() => setEditingAudio({
                          ...editingAudio,
                          kaiwaLines: [...editingAudio.kaiwaLines!, { speaker: kaiwaCharacters[0]?.name || '', text: '' }],
                        })}
                        style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', alignSelf: 'flex-start' }}
                      >
                        <Plus size={14} /> Thêm câu
                      </button>
                    </div>
                  ) : (
                    /* Single text edit */
                    <div className="form-row">
                      <label className="label-with-furigana">
                        <span>Nội dung:</span>
                        <button
                          type="button"
                          className="furigana-btn"
                          onClick={handleGenerateFuriganaEditText}
                          disabled={!!generatingFurigana || !editingAudio.textContent.trim()}
                        >
                          {generatingFurigana === 'ttsText' ? <Loader2 size={14} className="spin-icon" /> : <Wand2 size={14} />}
                          <span>Furigana</span>
                        </button>
                      </label>
                      <textarea
                        value={editingAudio.textContent}
                        onChange={e => setEditingAudio({ ...editingAudio, textContent: e.target.value })}
                        rows={3}
                      />
                      {hasFurigana(editingAudio.textContent) && (
                        <div className="furigana-preview">
                          <FuriganaText text={editingAudio.textContent} showFurigana={true} />
                        </div>
                      )}
                    </div>
                  )}

                  <div className="form-row">
                    <label>Mô tả:</label>
                    <textarea
                      value={editingAudio.description}
                      onChange={e => setEditingAudio({ ...editingAudio, description: e.target.value })}
                      rows={2}
                      placeholder="Mô tả hoặc bản dịch..."
                    />
                  </div>
                  <div className="form-actions">
                    <button className="btn-cancel" onClick={() => setEditingAudio(null)}><X size={16} /> Huỷ</button>
                    <button className="btn-save" onClick={handleUpdateTtsAudio} disabled={!editingAudio.title.trim()}>
                      <Save size={16} /> Lưu
                    </button>
                  </div>
                </div>
              ) : (
                /* Normal display mode */
                <>
                  <button
                    className={`play-btn ${playingAudioId === audio.id ? 'playing' : ''}`}
                    onClick={() => togglePlayAudio(audio)}
                    style={{ '--level-gradient': audio.isTextToSpeech ? 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)' : theme.gradient } as React.CSSProperties}
                  >
                    {playingAudioId === audio.id ? <Pause size={20} /> : audio.isTextToSpeech ? (audio.ttsMode === 'kaiwa' ? <Users size={20} /> : <Type size={20} />) : <Play size={20} />}
                  </button>
                  <div className="audio-info">
                    <span className="audio-title">
                      {audio.isTextToSpeech && (audio.ttsMode === 'kaiwa'
                        ? <Users size={14} style={{ marginRight: 4, verticalAlign: 'middle', opacity: 0.6 }} />
                        : <Type size={14} style={{ marginRight: 4, verticalAlign: 'middle', opacity: 0.6 }} />
                      )}
                      {audio.title}
                    </span>
                    {audio.isTextToSpeech && audio.ttsMode === 'kaiwa' && audio.kaiwaLines?.length ? (
                      <div className="kaiwa-preview-lines">
                        {audio.kaiwaLines.slice(0, 3).map((line, i) => (
                          <span key={i} className="kaiwa-preview-line">
                            <strong>{line.speaker}：</strong>
                            <FuriganaText text={line.text} showFurigana={true} />
                          </span>
                        ))}
                        {audio.kaiwaLines.length > 3 && (
                          <span className="kaiwa-preview-more">...+{audio.kaiwaLines.length - 3} câu</span>
                        )}
                      </div>
                    ) : audio.isTextToSpeech && audio.textContent ? (
                      <span className="audio-text-content">
                        <FuriganaText text={audio.textContent} showFurigana={true} />
                      </span>
                    ) : null}
                    {audio.description && <span className="audio-desc">{audio.description}</span>}
                  </div>
                  <div className="audio-actions">
                    {audio.isTextToSpeech && (
                      <button onClick={() => setEditingAudio({
                        id: audio.id,
                        title: audio.title,
                        textContent: audio.textContent || '',
                        description: audio.description || '',
                        ttsMode: audio.ttsMode,
                        kaiwaLines: audio.kaiwaLines ? [...audio.kaiwaLines] : undefined,
                      })}><Edit2 size={16} /></button>
                    )}
                    <button className="delete-btn" onClick={() => handleDeleteAudio(audio.id)}><Trash2 size={16} /></button>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>

      {/* Character management modal */}
      {showCharacterModal && (
        <KaiwaCharacterModal
          characters={kaiwaCharacters}
          jaVoices={jaVoices}
          onAdd={addCharacter}
          onUpdate={updateCharacter}
          onDelete={deleteCharacter}
          onClose={() => setShowCharacterModal(false)}
        />
      )}

      <audio ref={audioRef} onEnded={() => setPlayingAudioId(null)} />
      <style>{sharedStyles}</style>
    </div>
  );
}
