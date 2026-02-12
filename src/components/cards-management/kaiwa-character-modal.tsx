// Modal for managing kaiwa characters and their TTS voice presets
// 10 voice types: adult, youth, children, elderly (male/female each)
// Device voice dropdown shows each browser voice × 10 presets for max variety

import { useState } from 'react';
import { X, Plus, Play, Trash2, Save, User, Volume2 } from 'lucide-react';
import { removeFurigana } from '../../lib/furigana-utils';
import { VOICE_PRESETS, getPresetForCharacter, createUtteranceForCharacter } from '../../hooks/use-kaiwa-characters';
import type { KaiwaCharacter, KaiwaGender } from '../../types/listening';
import type { VoicePreset } from '../../hooks/use-kaiwa-characters';

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

        <style>{modalStyles}</style>
      </div>
    </div>
  );
}

const modalStyles = `
  .kaiwa-modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(8px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 1rem;
    animation: fadeIn 0.2s ease;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  .kaiwa-modal {
    width: 100%;
    max-width: 560px;
    max-height: 90vh;
    overflow-y: auto;
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 20px;
    padding: 1.5rem;
    animation: slideUp 0.3s ease;
  }

  @keyframes slideUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .kaiwa-modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1rem;
  }

  .kaiwa-modal-header h3 {
    margin: 0;
    font-size: 1.15rem;
    font-weight: 700;
    color: white;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .modal-close {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(255, 255, 255, 0.05);
    color: rgba(255, 255, 255, 0.6);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  }

  .modal-close:hover {
    background: rgba(255, 255, 255, 0.1);
    color: white;
  }

  .voice-info {
    font-size: 0.8rem;
    color: rgba(255, 255, 255, 0.4);
    margin-bottom: 1rem;
    padding: 0.5rem 0.75rem;
    background: rgba(255, 255, 255, 0.03);
    border-radius: 8px;
  }

  /* Character grid */
  .character-grid {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-bottom: 1.25rem;
  }

  .character-card {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-left: 3px solid rgba(255, 255, 255, 0.2);
    border-radius: 12px;
    transition: all 0.2s;
  }

  .char-avatar {
    font-size: 1.5rem;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .char-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
    min-width: 0;
  }

  .char-name {
    font-weight: 600;
    color: white;
    font-size: 0.9rem;
  }

  .char-voice {
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.4);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .char-actions {
    display: flex;
    gap: 0.25rem;
    flex-shrink: 0;
  }

  .char-actions button {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    border: none;
    background: rgba(255, 255, 255, 0.05);
    color: rgba(255, 255, 255, 0.5);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  }

  .char-actions button:hover {
    background: rgba(255, 255, 255, 0.1);
    color: white;
  }

  .char-actions button.delete:hover {
    background: rgba(239, 68, 68, 0.2);
    color: #f87171;
  }

  /* Edit form inside card */
  .char-edit-form {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .char-name-input {
    padding: 0.5rem 0.75rem;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 8px;
    color: white;
    font-size: 0.9rem;
  }

  .char-name-input::placeholder { color: rgba(255, 255, 255, 0.4); }
  .char-name-input:focus { outline: none; border-color: rgba(6, 182, 212, 0.5); }

  /* Voice preset picker grid */
  .preset-label {
    font-size: 0.8rem;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.5);
    margin-bottom: 0.25rem;
    display: block;
  }

  .preset-grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 0.3rem;
    margin-bottom: 0.5rem;
  }

  .preset-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.15rem;
    padding: 0.4rem 0.2rem;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
    color: rgba(255, 255, 255, 0.6);
  }

  .preset-card:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.2);
    color: white;
    transform: translateY(-1px);
  }

  .preset-card.active {
    border-color: transparent;
    color: white;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }

  .preset-emoji {
    font-size: 1.1rem;
    line-height: 1;
  }

  .preset-name {
    font-size: 0.6rem;
    font-weight: 500;
    text-align: center;
    line-height: 1.2;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
  }

  .voice-select {
    width: 100%;
    padding: 0.5rem 0.75rem;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    color: rgba(255, 255, 255, 0.8);
    font-size: 0.8rem;
    cursor: pointer;
  }

  .voice-select:focus { outline: none; border-color: rgba(6, 182, 212, 0.5); }
  .voice-select option { background: #1a1a2e; color: white; }
  .voice-select optgroup { color: rgba(255, 255, 255, 0.5); font-style: normal; font-size: 0.75rem; }

  .char-edit-actions {
    display: flex;
    gap: 0.35rem;
    justify-content: flex-end;
  }

  .btn-preview {
    padding: 0.4rem 0.65rem;
    background: rgba(6, 182, 212, 0.15);
    border: 1px solid rgba(6, 182, 212, 0.3);
    border-radius: 8px;
    color: #06b6d4;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.8rem;
    transition: all 0.2s;
  }

  .btn-preview:hover {
    background: rgba(6, 182, 212, 0.25);
  }

  .btn-done {
    padding: 0.4rem 0.75rem;
    background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
    border: none;
    border-radius: 8px;
    color: white;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.8rem;
  }

  /* Add character form */
  .add-character-form {
    padding: 1rem;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 12px;
  }

  .add-character-form h4 {
    margin: 0 0 0.75rem;
    font-size: 0.9rem;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.7);
    display: flex;
    align-items: center;
    gap: 0.35rem;
  }

  .add-row {
    display: flex;
    gap: 0.4rem;
    margin-bottom: 0.5rem;
    align-items: center;
  }

  .add-row .voice-select { flex: 1; }

  .btn-add {
    padding: 0.5rem 0.85rem;
    background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%);
    border: none;
    border-radius: 8px;
    color: white;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.8rem;
    font-weight: 500;
    transition: all 0.2s;
    white-space: nowrap;
  }

  .btn-add:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3); }
  .btn-add:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

  @media (max-width: 480px) {
    .preset-grid { grid-template-columns: repeat(5, 1fr); gap: 0.2rem; }
    .preset-card { padding: 0.3rem 0.15rem; }
    .preset-emoji { font-size: 1rem; }
    .preset-name { font-size: 0.55rem; }
  }
`;
