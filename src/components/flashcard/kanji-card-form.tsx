// Form for creating/editing kanji cards
import { useState, useCallback } from 'react';
import { Plus, Trash2, Sparkles, RefreshCw } from 'lucide-react';
import type { KanjiCardFormData, KanjiCard, KanjiSampleWord } from '../../types/kanji';
import type { JLPTLevel } from '../../types/flashcard';
import { getSeedByCharacter } from '../../data/kanji-seed';
import { JLPT_LEVELS_WITH_BT } from '../../constants/jlpt';
import { LEVEL_COLORS } from '../../constants/themes';

interface KanjiCardFormProps {
  onSubmit: (data: KanjiCardFormData) => void;
  onCancel: () => void;
  initialData?: KanjiCard;
  fixedLevel?: JLPTLevel | null;
  fixedLessonId?: string | null;
}
const emptySampleWord: KanjiSampleWord = { word: '', reading: '', meaning: '' };

export function KanjiCardForm({ onSubmit, onCancel, initialData, fixedLevel, fixedLessonId }: KanjiCardFormProps) {
  const [character, setCharacter] = useState(initialData?.character || '');
  const [onYomi, setOnYomi] = useState(initialData?.onYomi?.join(', ') || '');
  const [kunYomi, setKunYomi] = useState(initialData?.kunYomi?.join(', ') || '');
  const [sinoVietnamese, setSinoVietnamese] = useState(initialData?.sinoVietnamese || '');
  const [meaning, setMeaning] = useState(initialData?.meaning || '');
  const [mnemonic, setMnemonic] = useState(initialData?.mnemonic || '');
  const [strokeCount, setStrokeCount] = useState(initialData?.strokeCount || 1);
  const [radicals, setRadicals] = useState(initialData?.radicals?.join(', ') || '');
  const [sampleWords, setSampleWords] = useState<KanjiSampleWord[]>(initialData?.sampleWords?.length ? initialData.sampleWords : [{ ...emptySampleWord }]);
  const [jlptLevel, setJlptLevel] = useState<JLPTLevel>(fixedLevel || initialData?.jlptLevel || 'N5');
  // Pool of alternative words for swapping (populated on auto-fill)
  const [wordPool, setWordPool] = useState<KanjiSampleWord[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!character.trim() || !meaning.trim()) return;
    const data: KanjiCardFormData = {
      character: character.trim(),
      onYomi: onYomi.split(/[,、]/).map(s => s.trim()).filter(Boolean),
      kunYomi: kunYomi.split(/[,、]/).map(s => s.trim()).filter(Boolean),
      sinoVietnamese: sinoVietnamese.trim(),
      meaning: meaning.trim(),
      mnemonic: mnemonic.trim(),
      strokeCount,
      radicals: radicals.split(/[,、]/).map(s => s.trim()).filter(Boolean),
      jlptLevel: fixedLevel || jlptLevel,
      lessonId: fixedLessonId || '',
      sampleWords: sampleWords.filter(sw => sw.word.trim()),
    };
    onSubmit(data);
  };

  const updateSampleWord = (index: number, field: keyof KanjiSampleWord, value: string) => {
    const updated = [...sampleWords];
    updated[index] = { ...updated[index], [field]: value };
    setSampleWords(updated);
  };

  // Auto-fill sample words + mnemonic from seed data
  const handleAutoFill = useCallback(() => {
    if (!character.trim()) return;
    const seed = getSeedByCharacter(character.trim());
    if (!seed) { alert('Không tìm thấy dữ liệu mẫu cho chữ này'); return; }
    if (seed.sampleWords.length > 0) setSampleWords(seed.sampleWords);
    if (seed.mnemonic && !mnemonic.trim()) setMnemonic(seed.mnemonic);
    setWordPool(seed.extraWords);
  }, [character, mnemonic]);

  // Swap a sample word at index with next available from seed pool
  // Auto-loads pool on first swap if not yet loaded
  const handleSwapWord = useCallback((index: number) => {
    let pool = wordPool;
    // Lazy-load pool if empty and character exists
    if (pool.length === 0 && character.trim()) {
      const seed = getSeedByCharacter(character.trim());
      if (!seed || seed.extraWords.length === 0) return;
      pool = seed.extraWords;
    }
    if (pool.length === 0) return;
    const currentWord = sampleWords[index];
    const replacement = pool[0];
    const updated = [...sampleWords];
    updated[index] = replacement;
    setSampleWords(updated);
    const newPool = pool.slice(1);
    if (currentWord.word.trim()) newPool.push(currentWord);
    setWordPool(newPool);
  }, [sampleWords, wordPool, character]);

  return (
    <form onSubmit={handleSubmit} className="grammar-card-form" style={{ '--form-accent': LEVEL_COLORS[fixedLevel || jlptLevel] } as React.CSSProperties}>
      <div className="form-header"><h3>{initialData ? 'Sửa thẻ Kanji' : 'Tạo thẻ Kanji mới'}</h3></div>
      <div className="form-body">
        <div className="form-row">
          <div className="form-group" style={{ flex: 1 }}>
            <label>Chữ Kanji *</label>
            <input type="text" value={character} onChange={e => setCharacter(e.target.value)} placeholder="漢" className="input" maxLength={1} style={{ fontSize: '2rem', textAlign: 'center', fontFamily: 'serif' }} required />
          </div>
          <div className="form-group" style={{ flex: 1 }}>
            <label>Số nét</label>
            <input type="number" value={strokeCount} onChange={e => setStrokeCount(parseInt(e.target.value) || 1)} className="input" min={1} max={30} />
          </div>
          {!fixedLevel && (
            <div className="form-group" style={{ flex: 1 }}>
              <label>JLPT Level</label>
              <select value={jlptLevel} onChange={e => setJlptLevel(e.target.value as JLPTLevel)} className="input">{JLPT_LEVELS_WITH_BT.map(l => <option key={l} value={l}>{l}</option>)}</select>
            </div>
          )}
        </div>
        <div className="form-row">
          <div className="form-group" style={{ flex: 1 }}><label>Âm On (音読み)</label><input type="text" value={onYomi} onChange={e => setOnYomi(e.target.value)} placeholder="カン" className="input" /></div>
          <div className="form-group" style={{ flex: 1 }}><label>Âm Kun (訓読み)</label><input type="text" value={kunYomi} onChange={e => setKunYomi(e.target.value)} placeholder="やま" className="input" /></div>
        </div>
        <div className="form-row">
          <div className="form-group" style={{ flex: 1 }}><label>Hán Việt *</label><input type="text" value={sinoVietnamese} onChange={e => setSinoVietnamese(e.target.value)} placeholder="SƠN" className="input" required /></div>
          <div className="form-group" style={{ flex: 2 }}><label>Nghĩa *</label><input type="text" value={meaning} onChange={e => setMeaning(e.target.value)} placeholder="Núi" className="input" required /></div>
        </div>
        <div className="form-group"><label>Mẹo nhớ</label><textarea value={mnemonic} onChange={e => setMnemonic(e.target.value)} placeholder="Cách nhớ chữ kanji này..." className="input" rows={2} /></div>
        <div className="form-group"><label>Bộ thủ liên quan</label><input type="text" value={radicals} onChange={e => setRadicals(e.target.value)} placeholder="山, 口" className="input" /></div>
        <div className="form-group">
          <label>Từ mẫu</label>
          {sampleWords.map((sw, i) => (
            <div key={i} className="example-row" style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <input type="text" value={sw.word} onChange={e => updateSampleWord(i, 'word', e.target.value)} placeholder="漢字" className="input" style={{ flex: 1 }} />
              <input type="text" value={sw.reading} onChange={e => updateSampleWord(i, 'reading', e.target.value)} placeholder="かんじ" className="input" style={{ flex: 1 }} />
              <input type="text" value={sw.meaning} onChange={e => updateSampleWord(i, 'meaning', e.target.value)} placeholder="Chữ Hán" className="input" style={{ flex: 1 }} />
              <button type="button" className="btn btn-icon kanji-swap-btn" title="Đổi từ khác" onClick={() => handleSwapWord(i)}><RefreshCw size={14} /></button>
              <button type="button" className="btn btn-icon" onClick={() => sampleWords.length > 1 && setSampleWords(sampleWords.filter((_, j) => j !== i))} disabled={sampleWords.length <= 1}><Trash2 size={16} /></button>
            </div>
          ))}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setSampleWords([...sampleWords, { ...emptySampleWord }])}><Plus size={14} /> Thêm từ mẫu</button>
            <button type="button" className="btn btn-sm kanji-auto-fill-btn" onClick={handleAutoFill} disabled={!character.trim()}><Sparkles size={14} /> Tự động điền</button>
          </div>
        </div>
      </div>
      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>Huỷ</button>
        <button type="submit" className="btn btn-primary" disabled={!character.trim() || !meaning.trim()}>{initialData ? 'Cập nhật' : 'Tạo thẻ'}</button>
      </div>
    </form>
  );
}
