// Audio list with playback and inline edit for ListeningAudioView
import React from 'react';
import {
  Trash2, Edit2, Save, X, Music, Play, Pause, Type, Users, Wand2, Loader2, Plus
} from 'lucide-react';
import { FuriganaText } from '../../common/furigana-text';
import { hasFurigana } from '../../../lib/furigana-utils';
import { getPresetForCharacter } from '../../../hooks/use-kaiwa-characters';
import type { ListeningAudio } from '../../../types/listening';
import type { EditingAudio } from './listening-audio-view-types';
import type { JLPTLevel } from '../../../types/flashcard';

interface KaiwaCharacter {
  id: string;
  name: string;
}

interface ListeningAudioListProps {
  allAudios: ListeningAudio[];
  playingAudioId: string | null;
  editingAudio: EditingAudio | null;
  setEditingAudio: (audio: EditingAudio | null) => void;
  kaiwaCharacters: KaiwaCharacter[];
  generatingFurigana: 'title' | 'desc' | 'ttsText' | null;
  level: JLPTLevel;
  levelGradient: string;
  onTogglePlay: (audio: ListeningAudio) => void;
  onUpdateTtsAudio: () => void;
  onDeleteAudio: (id: string) => void;
  onGenerateFuriganaEditText: () => void;
}

export function ListeningAudioList({
  allAudios,
  playingAudioId,
  editingAudio,
  setEditingAudio,
  kaiwaCharacters,
  generatingFurigana,
  levelGradient,
  onTogglePlay,
  onUpdateTtsAudio,
  onDeleteAudio,
  onGenerateFuriganaEditText,
}: ListeningAudioListProps) {
  if (allAudios.length === 0) {
    return (
      <div className="audio-list">
        <div className="empty-state">
          <div className="empty-icon">
            <Music size={48} strokeWidth={1} />
          </div>
          <p>Chưa có file nghe nào</p>
          <span className="empty-hint">Nhấn "Tạo từ text" để thêm nội dung mới</span>
        </div>
      </div>
    );
  }

  return (
    <div className="audio-list">
      {allAudios.map((audio, idx) => (
        <div
          key={audio.id}
          className={`audio-item ${editingAudio?.id === audio.id ? 'editing' : ''}`}
          style={{ '--item-delay': `${idx * 0.05}s` } as React.CSSProperties}
        >
          {editingAudio?.id === audio.id ? (
            <AudioEditForm
              editingAudio={editingAudio}
              setEditingAudio={setEditingAudio}
              kaiwaCharacters={kaiwaCharacters}
              generatingFurigana={generatingFurigana}
              onSave={onUpdateTtsAudio}
              onGenerateFuriganaEditText={onGenerateFuriganaEditText}
            />
          ) : (
            <AudioDisplayRow
              audio={audio}
              playingAudioId={playingAudioId}
              levelGradient={levelGradient}
              onTogglePlay={onTogglePlay}
              onEdit={() => setEditingAudio({
                id: audio.id,
                title: audio.title,
                textContent: audio.textContent || '',
                description: audio.description || '',
                ttsMode: audio.ttsMode,
                kaiwaLines: audio.kaiwaLines ? [...audio.kaiwaLines] : undefined,
              })}
              onDelete={() => onDeleteAudio(audio.id)}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// --- AudioEditForm ---

interface AudioEditFormProps {
  editingAudio: EditingAudio;
  setEditingAudio: (audio: EditingAudio | null) => void;
  kaiwaCharacters: KaiwaCharacter[];
  generatingFurigana: 'title' | 'desc' | 'ttsText' | null;
  onSave: () => void;
  onGenerateFuriganaEditText: () => void;
}

function AudioEditForm({
  editingAudio,
  setEditingAudio,
  kaiwaCharacters,
  generatingFurigana,
  onSave,
  onGenerateFuriganaEditText,
}: AudioEditFormProps) {
  return (
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
                {kaiwaCharacters.map(c => {
                  const p = getPresetForCharacter(c);
                  return <option key={c.id} value={c.name}>{p?.emoji || '👤'} {c.name}</option>;
                })}
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
                <button
                  className="btn-cancel"
                  onClick={() => {
                    const updated = editingAudio.kaiwaLines!.filter((_, i) => i !== idx);
                    setEditingAudio({ ...editingAudio, kaiwaLines: updated });
                  }}
                  style={{ padding: '0.4rem' }}
                >
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
        <div className="form-row">
          <label className="label-with-furigana">
            <span>Nội dung:</span>
            <button
              type="button"
              className="furigana-btn"
              onClick={onGenerateFuriganaEditText}
              disabled={!!generatingFurigana || !editingAudio.textContent.trim()}
            >
              {generatingFurigana === 'ttsText'
                ? <Loader2 size={14} className="spin-icon" />
                : <Wand2 size={14} />}
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
        <button className="btn-cancel" onClick={() => setEditingAudio(null)}>
          <X size={16} /> Huỷ
        </button>
        <button className="btn-save" onClick={onSave} disabled={!editingAudio.title.trim()}>
          <Save size={16} /> Lưu
        </button>
      </div>
    </div>
  );
}

// --- AudioDisplayRow ---

interface AudioDisplayRowProps {
  audio: ListeningAudio;
  playingAudioId: string | null;
  levelGradient: string;
  onTogglePlay: (audio: ListeningAudio) => void;
  onEdit: () => void;
  onDelete: () => void;
}

function AudioDisplayRow({
  audio,
  playingAudioId,
  levelGradient,
  onTogglePlay,
  onEdit,
  onDelete,
}: AudioDisplayRowProps) {
  const isPlaying = playingAudioId === audio.id;

  const playIcon = isPlaying
    ? <Pause size={20} />
    : audio.isTextToSpeech
      ? (audio.ttsMode === 'kaiwa' ? <Users size={20} /> : <Type size={20} />)
      : <Play size={20} />;

  const playGradient = audio.isTextToSpeech
    ? 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)'
    : levelGradient;

  return (
    <>
      <button
        className={`play-btn ${isPlaying ? 'playing' : ''}`}
        onClick={() => onTogglePlay(audio)}
        style={{ '--level-gradient': playGradient } as React.CSSProperties}
      >
        {playIcon}
      </button>

      <div className="audio-info">
        <span className="audio-title">
          {audio.isTextToSpeech && (
            audio.ttsMode === 'kaiwa'
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
          <button onClick={onEdit}><Edit2 size={16} /></button>
        )}
        <button className="delete-btn" onClick={onDelete}><Trash2 size={16} /></button>
      </div>
    </>
  );
}
