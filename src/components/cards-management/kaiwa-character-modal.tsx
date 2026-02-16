// Modal for managing kaiwa characters and their TTS voice presets
// 10 voice types: adult, youth, children, elderly (male/female each)
// Device voice dropdown shows each browser voice × 10 presets for max variety

import { useState } from 'react';
import { X, Plus, Play, Trash2, Save, User, Volume2 } from 'lucide-react';
import { removeFurigana } from '../../lib/furigana-utils';
import { VOICE_PRESETS, getPresetForCharacter, createUtteranceForCharacter } from '../../hooks/use-kaiwa-characters';
import type { KaiwaCharacter, KaiwaGender } from '../../types/listening';
import type { VoicePreset } from '../../hooks/use-kaiwa-characters';
import './kaiwa-character-modal.css';

interface KaiwaCharacterModalProps {
  characters: KaiwaCharacter[];
  jaVoices: SpeechSynthesisVoice[];
  onAdd: (name: string, gender: KaiwaGender, voiceURI: string, pitch?: number, rate?: number, presetId?: string) => void;
  onUpdate: (id: string, data: Partial<KaiwaCharacter>) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}


export function KaiwaCharacterModal({
  characters,
  jaVoices,
  onAdd,
  onUpdate,
  onDelete,
  onClose,
}: KaiwaCharacterModalProps) {
  const [newName, setNewName] = useState('');
  const [newPresetId, setNewPresetId] = useState('adult-male');
  const [newVoiceURI, setNewVoiceURI] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const selectedPreset = VOICE_PRESETS.find(p => p.id === newPresetId) || VOICE_PRESETS[0];


  const handleAdd = () => {
    if (!newName.trim()) return;
    onAdd(newName.trim(), selectedPreset.gender, newVoiceURI, selectedPreset.pitch, selectedPreset.rate, selectedPreset.id);
    setNewName('');
    setNewPresetId('adult-male');
    setNewVoiceURI('');
  };

  // Preview with preset pitch/rate
  const previewPreset = (preset: VoicePreset, voiceURI?: string) => {
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance('こんにちは、はじめまして。');
    utterance.lang = 'ja-JP';
    utterance.rate = 0.9 * preset.rate;
    utterance.pitch = preset.pitch;
    if (voiceURI) {
      const voice = jaVoices.find(v => v.voiceURI === voiceURI);
      if (voice) utterance.voice = voice;
    }
    speechSynthesis.speak(utterance);
  };

  // Preview character with full voice settings
  const previewCharacter = (char: KaiwaCharacter) => {
    speechSynthesis.cancel();
    const text = removeFurigana(`${char.name}です。よろしくお願いします。`);
    const utterance = createUtteranceForCharacter(text, char, 0.9);
    speechSynthesis.speak(utterance);
  };

  // Apply preset to character (from preset grid)
  const applyPreset = (charId: string, preset: VoicePreset) => {
    onUpdate(charId, {
      gender: preset.gender,
      pitch: preset.pitch,
      rate: preset.rate,
      presetId: preset.id,
    });
  };

  // Simple voice dropdown: only real Japanese device voices
  const renderVoiceDropdown = (value: string, onChange: (val: string) => void) => (
    <select value={value} onChange={e => onChange(e.target.value)} className="voice-select">
      <option value="">Giọng mặc định</option>
      {jaVoices.map(v => (
        <option key={v.voiceURI} value={v.voiceURI}>
          {v.name} {v.localService ? '(local)' : '(online)'}
        </option>
      ))}
    </select>
  );

  return (
    <div className="kaiwa-modal-overlay" onClick={onClose}>
      <div className="kaiwa-modal" onClick={e => e.stopPropagation()}>
        <div className="kaiwa-modal-header">
          <h3><User size={20} /> Quản lí nhân vật</h3>
          <button className="modal-close" onClick={onClose}><X size={20} /></button>
        </div>

        {/* Voice info */}
        <div className="voice-info">
          {jaVoices.length} giọng tiếng Nhật · 10 kiểu giọng
        </div>

        {/* Character list */}
        <div className="character-grid">
          {characters.map(char => {
            const charPreset = getPresetForCharacter(char);
            return (
              <div key={char.id} className="character-card" style={{ borderLeftColor: charPreset?.color?.replace('linear-gradient(135deg, ', '').split(' ')[0] || 'rgba(255,255,255,0.2)' }}>
                {editingId === char.id ? (
                  /* Editing mode */
                  <div className="char-edit-form">
                    <input
                      type="text"
                      value={char.name}
                      onChange={e => onUpdate(char.id, { name: e.target.value })}
                      className="char-name-input"
                      autoFocus
                    />
                    <label className="preset-label">Kiểu giọng:</label>
                    <div className="preset-grid">
                      {VOICE_PRESETS.map(p => (
                        <button
                          key={p.id}
                          className={`preset-card ${char.presetId === p.id ? 'active' : ''}`}
                          style={char.presetId === p.id ? { background: p.color, borderColor: 'transparent' } : undefined}
                          onClick={() => applyPreset(char.id, p)}
                        >
                          <span className="preset-emoji">{p.emoji}</span>
                          <span className="preset-name">{p.label}</span>
                        </button>
                      ))}
                    </div>
                    <label className="preset-label">Giọng thiết bị:</label>
                    {renderVoiceDropdown(
                      char.voiceURI || '',
                      val => onUpdate(char.id, { voiceURI: val })
                    )}
                    <div className="char-edit-actions">
                      <button className="btn-preview" onClick={() => previewCharacter(char)}>
                        <Volume2 size={14} /> Nghe
                      </button>
                      <button className="btn-done" onClick={() => setEditingId(null)}>
                        <Save size={14} /> Xong
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Display mode */
                  <>
                    <div className="char-avatar">
                      {charPreset?.emoji || '👤'}
                    </div>
                    <div className="char-info">
                      <span className="char-name">{char.name}</span>
                      <span className="char-voice">
                        {charPreset?.label || 'Tùy chỉnh'}
                        {char.voiceURI ? ` · ${jaVoices.find(v => v.voiceURI === char.voiceURI)?.name || 'Custom'}` : ''}
                      </span>
                    </div>
                    <div className="char-actions">
                      <button onClick={() => previewCharacter(char)} title="Nghe thử">
                        <Play size={14} />
                      </button>
                      <button onClick={() => setEditingId(char.id)} title="Sửa">
                        <Save size={14} />
                      </button>
                      <button onClick={() => { if (confirm(`Xóa ${char.name}?`)) onDelete(char.id); }} title="Xóa" className="delete">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* Add new character */}
        <div className="add-character-form">
          <h4><Plus size={16} /> Thêm nhân vật</h4>
          <div className="add-row">
            <input
              type="text"
              placeholder="Tên nhân vật..."
              value={newName}
              onChange={e => setNewName(e.target.value)}
              className="char-name-input"
              style={{ flex: 1 }}
            />
          </div>
          <label className="preset-label">Kiểu giọng:</label>
          <div className="preset-grid">
            {VOICE_PRESETS.map(p => (
              <button
                key={p.id}
                className={`preset-card ${newPresetId === p.id ? 'active' : ''}`}
                style={newPresetId === p.id ? { background: p.color, borderColor: 'transparent' } : undefined}
                onClick={() => setNewPresetId(p.id)}
              >
                <span className="preset-emoji">{p.emoji}</span>
                <span className="preset-name">{p.label}</span>
              </button>
            ))}
          </div>
          <label className="preset-label">Giọng thiết bị:</label>
          <div className="add-row">
            {renderVoiceDropdown(
              newVoiceURI,
              val => setNewVoiceURI(val)
            )}
            <button className="btn-preview" onClick={() => previewPreset(selectedPreset, newVoiceURI)} title="Nghe thử">
              <Volume2 size={16} />
            </button>
            <button className="btn-add" onClick={handleAdd} disabled={!newName.trim()}>
              <Plus size={16} /> Thêm
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
