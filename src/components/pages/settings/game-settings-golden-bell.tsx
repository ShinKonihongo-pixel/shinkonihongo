import { useState, useCallback } from 'react';
import { Bell, Plus, Pencil, Trash2, Save, X, Bot } from 'lucide-react';
import { useCustomQuestions } from '../../../hooks/golden-bell/use-custom-questions';
import type { CustomGoldenBellQuestion, QuestionCategory, QuestionDifficulty } from '../../../types/golden-bell';
import { CATEGORY_INFO, DIFFICULTY_INFO } from '../../../types/golden-bell';

interface QuestionFormData {
  questionText: string;
  options: string[];
  correctIndex: number;
  category: QuestionCategory;
  difficulty: QuestionDifficulty;
  timeLimit: number;
  explanation: string;
}

const EMPTY_FORM: QuestionFormData = {
  questionText: '',
  options: ['', '', '', ''],
  correctIndex: 0,
  category: 'vocabulary',
  difficulty: 'medium',
  timeLimit: 15,
  explanation: '',
};

export function GameSettingsGoldenBell() {
  const { questions, loading, createQuestion, updateQuestion, deleteQuestion } = useCustomQuestions();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<QuestionFormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [botAutoJoin, setBotAutoJoin] = useState(() => localStorage.getItem('gb_bot_auto_join') !== 'false');

  const handleBotToggle = useCallback(() => {
    setBotAutoJoin(prev => {
      const next = !prev;
      localStorage.setItem('gb_bot_auto_join', String(next));
      return next;
    });
  }, []);

  const resetForm = useCallback(() => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowForm(false);
  }, []);

  const handleEdit = useCallback((q: CustomGoldenBellQuestion) => {
    setForm({
      questionText: q.questionText,
      options: [...q.options],
      correctIndex: q.correctIndex,
      category: q.category,
      difficulty: q.difficulty,
      timeLimit: q.timeLimit,
      explanation: q.explanation || '',
    });
    setEditingId(q.id);
    setShowForm(true);
  }, []);

  const handleSave = useCallback(async () => {
    if (!form.questionText.trim() || form.options.some(o => !o.trim())) return;
    setSaving(true);
    try {
      if (editingId) {
        await updateQuestion(editingId, {
          questionText: form.questionText.trim(),
          options: form.options.map(o => o.trim()),
          correctIndex: form.correctIndex,
          category: form.category,
          difficulty: form.difficulty,
          timeLimit: form.timeLimit,
          explanation: form.explanation.trim() || undefined,
        });
      } else {
        await createQuestion({
          questionText: form.questionText.trim(),
          options: form.options.map(o => o.trim()),
          correctIndex: form.correctIndex,
          category: form.category,
          difficulty: form.difficulty,
          timeLimit: form.timeLimit,
          explanation: form.explanation.trim() || undefined,
          createdBy: 'admin',
          createdAt: new Date().toISOString(),
        });
      }
      resetForm();
    } catch (err) {
      console.error('Failed to save question:', err);
    } finally {
      setSaving(false);
    }
  }, [form, editingId, createQuestion, updateQuestion, resetForm]);

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm('Xoá câu hỏi này?')) return;
    await deleteQuestion(id);
  }, [deleteQuestion]);

  const updateOption = useCallback((index: number, value: string) => {
    setForm(prev => {
      const options = [...prev.options];
      options[index] = value;
      return { ...prev, options };
    });
  }, []);

  const LABELS = ['A', 'B', 'C', 'D'];

  return (
    <div className="gb-settings-section">
      <div className="gb-settings-header">
        <Bell size={20} />
        <h3>Rung Chuông Vàng - Câu hỏi tùy chỉnh</h3>
        <span className="gb-settings-count">{questions.length} câu</span>
      </div>

      {/* Bot auto-join settings */}
      <div className="gb-bot-settings">
        <div className="gb-bot-toggle-row">
          <div className="gb-bot-toggle-info">
            <Bot size={18} />
            <div>
              <span className="gb-bot-toggle-label">Tự động thêm Bot</span>
              <span className="gb-bot-toggle-desc">
                Bot sẽ tự động vào phòng khi tạo game (chế độ đơn: 1 bot sau 15s, thêm 1-5 bot trong 30s tiếp)
              </span>
            </div>
          </div>
          <button
            type="button"
            className={`rm-toggle-btn ${botAutoJoin ? 'active' : ''}`}
            onClick={handleBotToggle}
          />
        </div>
      </div>

      <div className="gb-settings-divider" />

      {loading && <p className="gb-settings-loading">Đang tải...</p>}

      {/* Question list */}
      {!loading && questions.length > 0 && (
        <div className="gb-question-list">
          {questions.map(q => (
            <div key={q.id} className="gb-question-item">
              <div className="gb-question-item-content">
                <span className="gb-question-item-cat">
                  {CATEGORY_INFO[q.category].emoji}
                </span>
                <span className="gb-question-item-text">{q.questionText}</span>
                <span className="gb-question-item-diff" style={{ color: DIFFICULTY_INFO[q.difficulty].color }}>
                  {DIFFICULTY_INFO[q.difficulty].emoji}
                </span>
              </div>
              <div className="gb-question-item-actions">
                <button onClick={() => handleEdit(q)} title="Sửa"><Pencil size={14} /></button>
                <button onClick={() => handleDelete(q.id)} title="Xoá" className="danger"><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && questions.length === 0 && !showForm && (
        <p className="gb-settings-empty">Chưa có câu hỏi tùy chỉnh nào.</p>
      )}

      {/* Add button */}
      {!showForm && (
        <button className="gb-add-question-btn" onClick={() => { setForm(EMPTY_FORM); setShowForm(true); }}>
          <Plus size={16} /> Thêm câu hỏi
        </button>
      )}

      {/* Add/Edit form */}
      {showForm && (
        <div className="gb-question-form">
          <h4>{editingId ? 'Sửa câu hỏi' : 'Thêm câu hỏi mới'}</h4>

          <label>Câu hỏi</label>
          <textarea
            value={form.questionText}
            onChange={e => setForm(prev => ({ ...prev, questionText: e.target.value }))}
            placeholder="Nhập nội dung câu hỏi..."
            rows={2}
          />

          <label>Đáp án</label>
          <div className="gb-form-options">
            {form.options.map((opt, i) => (
              <div key={i} className="gb-form-option-row">
                <label className={`gb-form-radio ${form.correctIndex === i ? 'correct' : ''}`}>
                  <input
                    type="radio"
                    name="correctIndex"
                    checked={form.correctIndex === i}
                    onChange={() => setForm(prev => ({ ...prev, correctIndex: i }))}
                  />
                  {LABELS[i]}
                </label>
                <input
                  type="text"
                  value={opt}
                  onChange={e => updateOption(i, e.target.value)}
                  placeholder={`Đáp án ${LABELS[i]}`}
                />
              </div>
            ))}
          </div>

          <div className="gb-form-row">
            <div className="gb-form-field">
              <label>Thể loại</label>
              <select
                value={form.category}
                onChange={e => setForm(prev => ({ ...prev, category: e.target.value as QuestionCategory }))}
              >
                {Object.entries(CATEGORY_INFO).map(([key, info]) => (
                  <option key={key} value={key}>{info.emoji} {info.name}</option>
                ))}
              </select>
            </div>
            <div className="gb-form-field">
              <label>Độ khó</label>
              <select
                value={form.difficulty}
                onChange={e => setForm(prev => ({ ...prev, difficulty: e.target.value as QuestionDifficulty }))}
              >
                {Object.entries(DIFFICULTY_INFO).map(([key, info]) => (
                  <option key={key} value={key}>{info.emoji} {info.name}</option>
                ))}
              </select>
            </div>
            <div className="gb-form-field">
              <label>Thời gian (s)</label>
              <input
                type="number"
                value={form.timeLimit}
                onChange={e => setForm(prev => ({ ...prev, timeLimit: Number(e.target.value) || 15 }))}
                min={5}
                max={60}
              />
            </div>
          </div>

          <label>Giải thích (tùy chọn)</label>
          <textarea
            value={form.explanation}
            onChange={e => setForm(prev => ({ ...prev, explanation: e.target.value }))}
            placeholder="Giải thích đáp án..."
            rows={2}
          />

          <div className="gb-form-actions">
            <button className="gb-form-save-btn" onClick={handleSave} disabled={saving}>
              <Save size={14} /> {saving ? 'Đang lưu...' : 'Lưu'}
            </button>
            <button className="gb-form-cancel-btn" onClick={resetForm}>
              <X size={14} /> Huỷ
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
