/* eslint-disable react-hooks/preserve-manual-memoization */
// Test bank panel - manage test templates with folder navigation
// Structure: Level → Folder → Tests/Assignments
// Supports import from Flashcard and JLPT questions

import { useState, useMemo } from 'react';
import type { TestTemplate, TestFolder, TestType, TestQuestion, QuestionType, DifficultyLevel } from '../../types/classroom';
import { DEFAULT_QUESTION_POINTS } from '../../types/classroom';
import type { TestTemplateFormData } from '../../services/classroom-firestore';
import type { Flashcard, JLPTLevel } from '../../types/flashcard';
import type { JLPTQuestion } from '../../types/jlpt-question';
import {
  Plus, Edit2, Trash2, FileText, ClipboardList, Clock,
  ChevronDown, ChevronUp, FolderOpen, ArrowLeft, Import,
  BookOpen, FileQuestion, X, Shuffle, Zap
} from 'lucide-react';

const JLPT_LEVELS: JLPTLevel[] = ['N5', 'N4', 'N3', 'N2', 'N1'];

const DIFFICULTY_OPTIONS: { value: DifficultyLevel; label: string; color: string }[] = [
  { value: 'easy', label: 'Dễ', color: '#27ae60' },
  { value: 'medium', label: 'Trung bình', color: '#f39c12' },
  { value: 'hard', label: 'Khó', color: '#e74c3c' },
];

interface TestBankPanelProps {
  templates: TestTemplate[];
  folders: TestFolder[];
  loading: boolean;
  onCreate: (data: TestTemplateFormData) => Promise<TestTemplate | null>;
  onUpdate: (id: string, data: Partial<TestTemplateFormData>) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
  onCreateFolder: (name: string, level: string, type: TestType) => Promise<TestFolder | null>;
  onUpdateFolder: (id: string, data: { name: string }) => Promise<boolean>;
  onDeleteFolder: (id: string) => Promise<boolean>;
  getFoldersByLevelAndType: (level: string, type: TestType) => TestFolder[];
  getTemplatesByFolder: (folderId: string) => TestTemplate[];
  // For import
  flashcards?: Flashcard[];
  jlptQuestions?: JLPTQuestion[];
  currentUserId: string;
}

// Navigation state type
type NavState =
  | { type: 'root' }
  | { type: 'level'; level: string }
  | { type: 'folder'; level: string; folderId: string; folderName: string };

// Question editor component
function QuestionEditor({
  questions,
  onChange,
}: {
  questions: TestQuestion[];
  onChange: (questions: TestQuestion[]) => void;
}) {
  const addQuestion = () => {
    const newQuestion: TestQuestion = {
      id: `q_${Date.now()}`,
      questionType: 'multiple_choice',
      question: '',
      options: ['', '', '', ''],
      correctAnswer: 0,
      points: DEFAULT_QUESTION_POINTS,
      difficulty: 'medium',
    };
    onChange([...questions, newQuestion]);
  };

  const updateQuestion = (index: number, updates: Partial<TestQuestion>) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], ...updates };
    onChange(updated);
  };

  const removeQuestion = (index: number) => {
    onChange(questions.filter((_, i) => i !== index));
  };

  return (
    <div className="question-editor">
      <div className="question-list">
        {questions.map((q, idx) => (
          <div key={q.id} className="question-item">
            <div className="question-header">
              <span className="question-number">Câu {idx + 1}</span>
              <select
                value={q.questionType}
                onChange={(e) => updateQuestion(idx, { questionType: e.target.value as QuestionType })}
                className="question-type-select"
              >
                <option value="multiple_choice">Trắc nghiệm</option>
                <option value="text">Tự luận</option>
                <option value="true_false">Đúng/Sai</option>
              </select>
              <select
                value={q.difficulty || 'medium'}
                onChange={(e) => updateQuestion(idx, { difficulty: e.target.value as DifficultyLevel })}
                className="question-difficulty-select"
                style={{
                  backgroundColor: DIFFICULTY_OPTIONS.find(d => d.value === (q.difficulty || 'medium'))?.color + '20',
                  borderColor: DIFFICULTY_OPTIONS.find(d => d.value === (q.difficulty || 'medium'))?.color
                }}
              >
                {DIFFICULTY_OPTIONS.map(d => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
              <input
                type="number"
                value={q.points}
                onChange={(e) => updateQuestion(idx, { points: parseInt(e.target.value) || DEFAULT_QUESTION_POINTS })}
                className="question-points"
                min={1}
                title="Điểm"
              />
              <span className="points-label">đ</span>
              <button
                type="button"
                className="btn btn-sm btn-icon danger"
                onClick={() => removeQuestion(idx)}
              >
                <Trash2 size={14} />
              </button>
            </div>

            <textarea
              value={q.question}
              onChange={(e) => updateQuestion(idx, { question: e.target.value })}
              placeholder="Nội dung câu hỏi..."
              className="question-text"
              rows={2}
            />

            {q.questionType === 'multiple_choice' && q.options && (
              <div className="question-options">
                {q.options.map((opt, optIdx) => (
                  <div key={optIdx} className="option-row">
                    <input
                      type="radio"
                      name={`correct_${q.id}`}
                      checked={q.correctAnswer === optIdx}
                      onChange={() => updateQuestion(idx, { correctAnswer: optIdx })}
                    />
                    <input
                      type="text"
                      value={opt}
                      onChange={(e) => {
                        const newOptions = [...(q.options || [])];
                        newOptions[optIdx] = e.target.value;
                        updateQuestion(idx, { options: newOptions });
                      }}
                      placeholder={`Đáp án ${String.fromCharCode(65 + optIdx)}`}
                      className="option-input"
                    />
                  </div>
                ))}
              </div>
            )}

            {q.questionType === 'true_false' && (
              <div className="true-false-options">
                <label>
                  <input
                    type="radio"
                    name={`tf_${q.id}`}
                    checked={q.correctAnswer === 'true'}
                    onChange={() => updateQuestion(idx, { correctAnswer: 'true' })}
                  />
                  Đúng
                </label>
                <label>
                  <input
                    type="radio"
                    name={`tf_${q.id}`}
                    checked={q.correctAnswer === 'false'}
                    onChange={() => updateQuestion(idx, { correctAnswer: 'false' })}
                  />
                  Sai
                </label>
              </div>
            )}
          </div>
        ))}
      </div>

      <button type="button" className="btn btn-secondary add-question-btn" onClick={addQuestion}>
        <Plus size={16} />
        Thêm câu hỏi
      </button>
    </div>
  );
}

export function TestBankPanel({
  templates,
  folders,
  loading,
  onCreate,
  onUpdate,
  onDelete,
  onCreateFolder,
  onUpdateFolder,
  onDeleteFolder,
  getTemplatesByFolder,
  flashcards = [],
  jlptQuestions = [],
}: TestBankPanelProps) {
  // Active tab: tests or assignments
  const [activeTab] = useState<TestType>('test');

  // Navigation state
  const [navState, setNavState] = useState<NavState>({ type: 'root' });

  // Form states
  const [showForm, setShowForm] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<TestTemplate | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Folder states
  const [addingFolder, setAddingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editingFolderName, setEditingFolderName] = useState('');
  const [deleteFolderConfirm, setDeleteFolderConfirm] = useState<string | null>(null);

  // Form data
  const [formData, setFormData] = useState<TestTemplateFormData>({
    title: '',
    description: '',
    type: 'test',
    folderId: undefined,
    questions: [],
    timeLimit: 30,
    tags: [],
    level: '',
    sourceType: 'custom',
  });
  const [tagInput, setTagInput] = useState('');

  // Import state
  const [importSource, setImportSource] = useState<'flashcard' | 'jlpt'>('flashcard');
  const [selectedImportItems, setSelectedImportItems] = useState<string[]>([]);
  const [importLevel, setImportLevel] = useState<string>('N5');
  const [importDifficulty, setImportDifficulty] = useState<DifficultyLevel>('medium');

  // Auto-generate state
  const [showAutoGenerate, setShowAutoGenerate] = useState(false);
  const [autoGenLevel, setAutoGenLevel] = useState<string>('N5');
  const [autoGenQuestionCount, setAutoGenQuestionCount] = useState(10);
  const [autoGenTotalPoints, setAutoGenTotalPoints] = useState(200);
  const [autoGenDifficulty, setAutoGenDifficulty] = useState<DifficultyLevel | 'mixed'>('mixed');

  // Multi-source selection with percentages
  const [sourcesEnabled, setSourcesEnabled] = useState({
    flashcard: true,
    jlpt: false,
    testbank: false,
  });
  const [sourceMixPct, setSourceMixPct] = useState({
    flashcard: 100,
    jlpt: 0,
    testbank: 0,
  });

  // Adjustable mixed difficulty percentages
  const [mixedEasyPct, setMixedEasyPct] = useState(30);
  const [mixedMediumPct, setMixedMediumPct] = useState(50);
  const [mixedHardPct, setMixedHardPct] = useState(20);

  // Quick presets for difficulty mix
  const difficultyPresets = [
    { name: 'Cân bằng', easy: 30, medium: 50, hard: 20 },
    { name: 'Dễ hơn', easy: 50, medium: 40, hard: 10 },
    { name: 'Khó hơn', easy: 10, medium: 40, hard: 50 },
    { name: 'Chỉ TB', easy: 0, medium: 100, hard: 0 },
  ];

  // Source mix presets
  const sourceMixPresets = [
    { name: 'Chỉ Flashcard', flashcard: 100, jlpt: 0, testbank: 0 },
    { name: 'Chỉ JLPT', flashcard: 0, jlpt: 100, testbank: 0 },
    { name: 'Mix FC+JLPT', flashcard: 50, jlpt: 50, testbank: 0 },
    { name: 'Tất cả', flashcard: 40, jlpt: 40, testbank: 20 },
  ];

  // Toggle source and auto-adjust percentages
  const toggleSource = (source: 'flashcard' | 'jlpt' | 'testbank') => {
    const newEnabled = { ...sourcesEnabled, [source]: !sourcesEnabled[source] };
    setSourcesEnabled(newEnabled);

    // Count enabled sources and redistribute percentages
    const enabledSources = Object.entries(newEnabled).filter(([_, v]) => v).map(([k]) => k);
    if (enabledSources.length > 0) {
      const pctEach = Math.floor(100 / enabledSources.length);
      const remainder = 100 - (pctEach * enabledSources.length);
      const newPct = { flashcard: 0, jlpt: 0, testbank: 0 };
      enabledSources.forEach((s, idx) => {
        newPct[s as keyof typeof newPct] = pctEach + (idx === 0 ? remainder : 0);
      });
      setSourceMixPct(newPct);
    }
  };

  // Update source percentage and auto-balance others
  const updateSourcePct = (source: 'flashcard' | 'jlpt' | 'testbank', value: number) => {
    const enabledSources = Object.entries(sourcesEnabled).filter(([_, v]) => v).map(([k]) => k);
    if (enabledSources.length <= 1) {
      setSourceMixPct({ ...sourceMixPct, [source]: 100 });
      return;
    }

    const remaining = 100 - value;
    const otherSources = enabledSources.filter(s => s !== source);
    const currentOthersTotal = otherSources.reduce((sum, s) => sum + sourceMixPct[s as keyof typeof sourceMixPct], 0);

    const newPct = { ...sourceMixPct, [source]: value };
    otherSources.forEach(s => {
      const ratio = currentOthersTotal > 0 ? sourceMixPct[s as keyof typeof sourceMixPct] / currentOthersTotal : 1 / otherSources.length;
      newPct[s as keyof typeof newPct] = Math.round(remaining * ratio);
    });

    // Fix rounding
    const total = Object.values(newPct).reduce((a, b) => a + b, 0);
    if (total !== 100 && otherSources.length > 0) {
      newPct[otherSources[0] as keyof typeof newPct] += 100 - total;
    }

    setSourceMixPct(newPct);
  };

  // Current folder's templates (show all types)
  const currentTemplates = useMemo(() => {
    if (navState.type === 'folder') {
      return getTemplatesByFolder(navState.folderId);
    }
    return [];
  }, [navState, getTemplatesByFolder]);

  // Breadcrumb
  const breadcrumb = useMemo(() => {
    const crumbs = ['Ngân hàng đề'];
    if (navState.type === 'level' || navState.type === 'folder') {
      crumbs.push(navState.level);
    }
    if (navState.type === 'folder') {
      crumbs.push(navState.folderName);
    }
    return crumbs;
  }, [navState]);

  // Count templates by level (all types)
  const getTemplateCountByLevel = (level: string): number => {
    return templates.filter(t => t.level === level).length;
  };

  // Go back navigation
  const goBack = () => {
    if (navState.type === 'folder') {
      setNavState({ type: 'level', level: navState.level });
    } else if (navState.type === 'level') {
      setNavState({ type: 'root' });
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      type: activeTab,
      folderId: navState.type === 'folder' ? navState.folderId : undefined,
      questions: [],
      timeLimit: activeTab === 'test' ? 30 : undefined,
      tags: [],
      level: navState.type === 'folder' || navState.type === 'level' ? navState.level : '',
      sourceType: 'custom',
    });
    setTagInput('');
    setShowForm(false);
    setEditingTemplate(null);
  };

  // Open edit form
  const openEdit = (template: TestTemplate) => {
    setFormData({
      title: template.title,
      description: template.description || '',
      type: template.type,
      folderId: template.folderId,
      questions: template.questions,
      timeLimit: template.timeLimit,
      tags: template.tags || [],
      level: template.level || '',
      sourceType: template.sourceType || 'custom',
    });
    setEditingTemplate(template);
    setShowForm(true);
  };

  // Add tag
  const addTag = () => {
    if (tagInput.trim() && !formData.tags?.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), tagInput.trim()],
      }));
      setTagInput('');
    }
  };

  // Remove tag
  const removeTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags?.filter(t => t !== tag) || [],
    }));
  };

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || formData.questions.length === 0) return;

    setSaving(true);

    if (editingTemplate) {
      const success = await onUpdate(editingTemplate.id, formData);
      if (success) resetForm();
    } else {
      const result = await onCreate(formData);
      if (result) resetForm();
    }

    setSaving(false);
  };

  // Handle delete template
  const handleDelete = async (id: string) => {
    setSaving(true);
    const success = await onDelete(id);
    if (success) setDeleteConfirm(null);
    setSaving(false);
  };

  // Handle add folder (type is now just for compatibility, folders hold all types)
  const handleAddFolder = async () => {
    if (!newFolderName.trim() || navState.type !== 'level') return;
    setSaving(true);
    await onCreateFolder(newFolderName.trim(), navState.level, 'test');
    setNewFolderName('');
    setAddingFolder(false);
    setSaving(false);
  };

  // Handle update folder
  const handleUpdateFolder = async (folderId: string) => {
    if (!editingFolderName.trim()) return;
    setSaving(true);
    await onUpdateFolder(folderId, { name: editingFolderName.trim() });
    setEditingFolderId(null);
    setEditingFolderName('');
    setSaving(false);
  };

  // Handle delete folder
  const handleDeleteFolder = async (folderId: string) => {
    setSaving(true);
    await onDeleteFolder(folderId);
    setDeleteFolderConfirm(null);
    setSaving(false);
  };

  // Convert flashcard to question
  // Convert flashcard to question with default points and difficulty
  const flashcardToQuestion = (card: Flashcard, difficulty: DifficultyLevel = 'medium'): TestQuestion => ({
    id: `fc_${card.id}`,
    questionType: 'text',
    question: `${card.vocabulary} の意味は？${card.kanji ? ` (${card.kanji})` : ''}`,
    correctAnswer: card.meaning,
    points: DEFAULT_QUESTION_POINTS,
    difficulty,
    explanation: card.sinoVietnamese ? `Hán Việt: ${card.sinoVietnamese}` : undefined,
  });

  // Convert JLPT question to TestQuestion with default points and difficulty
  const jlptToQuestion = (jq: JLPTQuestion, difficulty: DifficultyLevel = 'medium'): TestQuestion => ({
    id: `jlpt_${jq.id}`,
    questionType: 'multiple_choice',
    question: jq.question,
    options: jq.answers.map(a => a.text),
    correctAnswer: jq.answers.findIndex(a => a.isCorrect),
    points: DEFAULT_QUESTION_POINTS,
    difficulty,
    explanation: jq.explanation,
  });

  // Handle import with selected difficulty
  const handleImport = () => {
    if (selectedImportItems.length === 0) return;

    let newQuestions: TestQuestion[] = [];

    if (importSource === 'flashcard') {
      const selectedCards = flashcards.filter(f => selectedImportItems.includes(f.id));
      newQuestions = selectedCards.map(card => flashcardToQuestion(card, importDifficulty));
    } else {
      const selectedJlpt = jlptQuestions.filter(j => selectedImportItems.includes(j.id));
      newQuestions = selectedJlpt.map(q => jlptToQuestion(q, importDifficulty));
    }

    setFormData(prev => ({
      ...prev,
      questions: [...prev.questions, ...newQuestions],
      sourceType: importSource,
    }));

    setSelectedImportItems([]);
    setShowImportModal(false);
  };

  // Auto-generate test with random questions from multiple sources
  const handleAutoGenerate = () => {
    const targetCount = autoGenQuestionCount;
    const targetPoints = autoGenTotalPoints;
    const pointsPerQuestion = Math.round(targetPoints / targetCount);

    // Get enabled sources
    const enabledSources = Object.entries(sourcesEnabled)
      .filter(([_, enabled]) => enabled)
      .map(([source]) => source as 'flashcard' | 'jlpt' | 'testbank');

    if (enabledSources.length === 0) {
      alert('Vui lòng chọn ít nhất một nguồn câu hỏi!');
      return;
    }

    // Calculate how many questions from each source
    const questionCountPerSource: Record<string, number> = {};
    let totalAllocated = 0;
    enabledSources.forEach((source, idx) => {
      if (idx === enabledSources.length - 1) {
        // Last source gets remainder
        questionCountPerSource[source] = targetCount - totalAllocated;
      } else {
        const count = Math.round((sourceMixPct[source] / 100) * targetCount);
        questionCountPerSource[source] = count;
        totalAllocated += count;
      }
    });

    // Collect questions from each source
    const allQuestions: TestQuestion[] = [];
    const levelFlashcards = flashcards.filter(f => f.jlptLevel === autoGenLevel);
    const levelJlptQuestions = jlptQuestions.filter(j => j.level === autoGenLevel);
    const levelTestBankQuestions = templates
      .filter(t => t.level === autoGenLevel)
      .flatMap(t => t.questions);

    enabledSources.forEach(source => {
      const countNeeded = questionCountPerSource[source];
      let sourceItems: TestQuestion[] = [];

      if (source === 'flashcard') {
        const shuffled = [...levelFlashcards].sort(() => Math.random() - 0.5);
        sourceItems = shuffled.slice(0, countNeeded).map(card => {
          const difficulty = getDifficulty();
          return { ...flashcardToQuestion(card, difficulty), points: pointsPerQuestion };
        });
      } else if (source === 'jlpt') {
        const shuffled = [...levelJlptQuestions].sort(() => Math.random() - 0.5);
        sourceItems = shuffled.slice(0, countNeeded).map(q => {
          const difficulty = getDifficulty();
          return { ...jlptToQuestion(q, difficulty), points: pointsPerQuestion };
        });
      } else if (source === 'testbank') {
        const shuffled = [...levelTestBankQuestions].sort(() => Math.random() - 0.5);
        sourceItems = shuffled.slice(0, countNeeded).map(q => ({
          ...q,
          id: `tb_${q.id}_${Date.now()}_${Math.random().toString(36).slice(2)}`,
          difficulty: q.difficulty || getDifficulty(),
          points: pointsPerQuestion,
        }));
      }

      allQuestions.push(...sourceItems);
    });

    // Helper to get difficulty
    function getDifficulty(): DifficultyLevel {
      if (autoGenDifficulty === 'mixed') {
        const rand = Math.random() * 100;
        if (rand < mixedEasyPct) return 'easy';
        if (rand < mixedEasyPct + mixedMediumPct) return 'medium';
        return 'hard';
      }
      return autoGenDifficulty;
    }

    // Shuffle all questions to mix sources
    const shuffledAll = allQuestions.sort(() => Math.random() - 0.5);

    // Adjust last question to match total points exactly
    if (shuffledAll.length > 0) {
      const currentTotal = shuffledAll.slice(0, -1).reduce((sum, q) => sum + q.points, 0);
      shuffledAll[shuffledAll.length - 1].points = targetPoints - currentTotal;
    }

    // Determine primary source type for metadata
    const primarySource = enabledSources.reduce((max, source) =>
      sourceMixPct[source] > sourceMixPct[max] ? source : max
    , enabledSources[0]);

    setFormData(prev => ({
      ...prev,
      questions: shuffledAll,
      sourceType: primarySource === 'testbank' ? 'custom' : primarySource,
    }));

    setShowAutoGenerate(false);
  };

  // Filtered items for import
  const filteredFlashcards = flashcards.filter(f => f.jlptLevel === importLevel);
  const filteredJlptQuestions = jlptQuestions.filter(j => j.level === importLevel);

  // Get all questions from test bank templates (current type: test or assignment)
  const testBankQuestions = useMemo(() => {
    return templates
      .filter(t => t.level === autoGenLevel)
      .flatMap(t => t.questions);
  }, [templates, autoGenLevel]);

  // Count per source for auto-generate
  const sourceQuestionCounts = useMemo(() => ({
    flashcard: flashcards.filter(f => f.jlptLevel === autoGenLevel).length,
    jlpt: jlptQuestions.filter(j => j.level === autoGenLevel).length,
    testbank: testBankQuestions.length,
  }), [flashcards, jlptQuestions, testBankQuestions, autoGenLevel]);

  // Total available items count for auto-generate (sum of enabled sources)
  const autoGenAvailableCount = useMemo(() => {
    return Object.entries(sourcesEnabled)
      .filter(([_, enabled]) => enabled)
      .reduce((sum, [source]) => sum + sourceQuestionCounts[source as keyof typeof sourceQuestionCounts], 0);
  }, [sourcesEnabled, sourceQuestionCounts]);

  // Calculate total points
  const totalPoints = formData.questions.reduce((sum, q) => sum + q.points, 0);

  if (loading) {
    return <div className="loading-state">Đang tải...</div>;
  }

  return (
    <div className="test-bank-panel">
      {/* Header */}
      <div className="test-bank-header">
        <h3 className="panel-title">Ngân hàng đề kiểm tra</h3>
      </div>

      {/* Breadcrumb */}
      <div className="breadcrumb">
        {breadcrumb.map((crumb, idx) => (
          <span key={idx}>
            {idx > 0 && ' / '}
            <span
              className={idx === breadcrumb.length - 1 ? 'current' : 'clickable'}
              onClick={() => {
                if (idx === 0) setNavState({ type: 'root' });
                else if (idx === 1 && navState.type === 'folder') {
                  setNavState({ type: 'level', level: navState.level });
                }
              }}
            >
              {crumb}
            </span>
          </span>
        ))}
      </div>

      {/* Back button */}
      {navState.type !== 'root' && (
        <button className="btn btn-back" onClick={goBack}>
          <ArrowLeft size={16} />
          Quay lại
        </button>
      )}

      {/* Actions */}
      {!addingFolder && navState.type !== 'root' && (
        <div className="folder-actions">
          {navState.type === 'folder' && (
            <button
              className="btn btn-primary"
              onClick={() => {
                setFormData(prev => ({ ...prev, type: 'test' }));
                setShowForm(true);
              }}
            >
              <Plus size={16} />
              Tạo bài kiểm tra
            </button>
          )}
          {navState.type === 'level' && (
            <button className="btn btn-secondary" onClick={() => setAddingFolder(true)}>
              <Plus size={16} />
              Tạo thư mục
            </button>
          )}
        </div>
      )}

      {/* Add folder inline */}
      {addingFolder && (
        <div className="add-folder-inline">
          <input
            type="text"
            className="folder-input"
            placeholder="Tên thư mục..."
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddFolder();
              if (e.key === 'Escape') { setAddingFolder(false); setNewFolderName(''); }
            }}
            autoFocus
          />
          <button className="btn btn-primary btn-sm" onClick={handleAddFolder} disabled={saving}>Lưu</button>
          <button className="btn btn-secondary btn-sm" onClick={() => { setAddingFolder(false); setNewFolderName(''); }}>Hủy</button>
        </div>
      )}

      {/* Content */}
      <div className="test-bank-content">
        {/* Root: show levels */}
        {navState.type === 'root' && (
          <div className="folder-list">
            {JLPT_LEVELS.map(level => (
              <div
                key={level}
                className="folder-item"
                onClick={() => setNavState({ type: 'level', level })}
              >
                <span className="folder-icon">📁</span>
                <span className="folder-name">{level}</span>
                <span className="folder-count">({getTemplateCountByLevel(level)} bài)</span>
              </div>
            ))}
          </div>
        )}

        {/* Level: show folders */}
        {navState.type === 'level' && (
          <div className="folder-list">
            {folders.filter(f => f.level === navState.level).map(folder => (
              <div key={folder.id} className="folder-item-wrapper">
                {editingFolderId === folder.id ? (
                  <div className="edit-folder-inline">
                    <input
                      type="text"
                      value={editingFolderName}
                      onChange={(e) => setEditingFolderName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleUpdateFolder(folder.id);
                        if (e.key === 'Escape') { setEditingFolderId(null); setEditingFolderName(''); }
                      }}
                      autoFocus
                    />
                    <button className="btn btn-sm btn-primary" onClick={() => handleUpdateFolder(folder.id)}>Lưu</button>
                    <button className="btn btn-sm" onClick={() => { setEditingFolderId(null); setEditingFolderName(''); }}>Hủy</button>
                  </div>
                ) : (
                  <div
                    className="folder-item"
                    onClick={() => setNavState({ type: 'folder', level: navState.level, folderId: folder.id, folderName: folder.name })}
                  >
                    <FolderOpen size={20} className="folder-icon-svg" />
                    <span className="folder-name">{folder.name}</span>
                    <span className="folder-count">({getTemplatesByFolder(folder.id).length} bài)</span>
                    <div className="folder-actions-inline" onClick={e => e.stopPropagation()}>
                      <button
                        className="btn btn-sm btn-icon"
                        onClick={() => { setEditingFolderId(folder.id); setEditingFolderName(folder.name); }}
                        title="Sửa tên"
                      >
                        <Edit2 size={14} />
                      </button>
                      {deleteFolderConfirm === folder.id ? (
                        <>
                          <button className="btn btn-sm btn-danger" onClick={() => handleDeleteFolder(folder.id)} disabled={saving}>Xóa</button>
                          <button className="btn btn-sm" onClick={() => setDeleteFolderConfirm(null)}>Hủy</button>
                        </>
                      ) : (
                        <button
                          className="btn btn-sm btn-icon danger"
                          onClick={() => setDeleteFolderConfirm(folder.id)}
                          title="Xóa"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
            {folders.filter(f => f.level === navState.level).length === 0 && (
              <p className="empty-message">Chưa có thư mục nào. Nhấn "+ Tạo thư mục" để thêm.</p>
            )}
          </div>
        )}

        {/* Folder: show templates */}
        {navState.type === 'folder' && (
          <div className="template-list">
            {currentTemplates.length === 0 ? (
              <div className="empty-state">
                <p>Chưa có bài kiểm tra/bài tập nào</p>
                <p className="hint">Sử dụng nút ở góc trên để thêm mới</p>
              </div>
            ) : (
              currentTemplates.map(template => (
                <div key={template.id} className="template-card">
                  <div
                    className="template-header"
                    onClick={() => setExpandedId(expandedId === template.id ? null : template.id)}
                  >
                    <div className="template-icon">
                      {template.type === 'test' ? <FileText size={20} /> : <ClipboardList size={20} />}
                    </div>
                    <div className="template-info">
                      <h4 className="template-title">{template.title}</h4>
                      <div className="template-meta">
                        <span className="question-count">{template.questions.length} câu</span>
                        <span className="points-total">{template.totalPoints} điểm</span>
                        {template.timeLimit && (
                          <span className="time-limit">
                            <Clock size={12} />
                            {template.timeLimit} phút
                          </span>
                        )}
                        {template.sourceType && template.sourceType !== 'custom' && (
                          <span className="source-badge">{template.sourceType === 'flashcard' ? 'Flashcard' : 'JLPT'}</span>
                        )}
                      </div>
                    </div>
                    <div className="template-actions">
                      <button
                        className="btn btn-sm btn-icon"
                        onClick={(e) => { e.stopPropagation(); openEdit(template); }}
                        title="Chỉnh sửa"
                      >
                        <Edit2 size={14} />
                      </button>
                      {deleteConfirm === template.id ? (
                        <>
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={(e) => { e.stopPropagation(); handleDelete(template.id); }}
                            disabled={saving}
                          >
                            Xóa
                          </button>
                          <button
                            className="btn btn-sm btn-secondary"
                            onClick={(e) => { e.stopPropagation(); setDeleteConfirm(null); }}
                          >
                            Hủy
                          </button>
                        </>
                      ) : (
                        <button
                          className="btn btn-sm btn-icon danger"
                          onClick={(e) => { e.stopPropagation(); setDeleteConfirm(template.id); }}
                          title="Xóa"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                      {expandedId === template.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                  </div>

                  {/* Expanded view */}
                  {expandedId === template.id && (
                    <div className="template-detail">
                      {template.description && (
                        <p className="template-description">{template.description}</p>
                      )}
                      <div className="questions-preview">
                        <h5>Danh sách câu hỏi:</h5>
                        {template.questions.map((q, idx) => (
                          <div key={q.id} className="question-preview">
                            <span className="q-number">{idx + 1}.</span>
                            <span className="q-text">{q.question}</span>
                            <span className="q-points">{q.points}đ</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Create/Edit Form Modal */}
      {showForm && (
        <div className="test-form-overlay">
          <form className="test-template-form" onSubmit={handleSubmit}>
            <div className="form-header">
              <h4>{editingTemplate ? 'Chỉnh sửa' : 'Tạo mới'} {formData.type === 'test' ? 'bài kiểm tra' : 'bài tập'}</h4>
              <button type="button" className="btn-close" onClick={resetForm}>×</button>
            </div>

            <div className="form-body">
              {/* Basic info */}
              <div className="form-row">
                <div className="form-group">
                  <label>Tiêu đề <span className="required">*</span></label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Tên bài..."
                    required
                  />
                </div>
                {formData.type === 'test' && (
                  <div className="form-group">
                    <label>Thời gian (phút)</label>
                    <input
                      type="number"
                      value={formData.timeLimit || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, timeLimit: parseInt(e.target.value) || undefined }))}
                      placeholder="30"
                      min={1}
                    />
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>Mô tả</label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Mô tả..."
                  rows={2}
                />
              </div>

              {/* Tags */}
              <div className="form-group">
                <label>Tags</label>
                <div className="tags-input">
                  <div className="tags-list">
                    {formData.tags?.map(tag => (
                      <span key={tag} className="tag-item">
                        {tag}
                        <button type="button" onClick={() => removeTag(tag)}>×</button>
                      </span>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    placeholder="Thêm tag..."
                  />
                  <button type="button" className="btn btn-sm" onClick={addTag}>+</button>
                </div>
              </div>

              {/* Import buttons */}
              <div className="import-buttons">
                <span className="import-label">Nhập câu hỏi từ:</span>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => { setImportSource('flashcard'); setShowImportModal(true); }}
                >
                  <BookOpen size={14} />
                  Flashcard
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => { setImportSource('jlpt'); setShowImportModal(true); }}
                >
                  <FileQuestion size={14} />
                  JLPT
                </button>
                <span className="import-divider">|</span>
                <button
                  type="button"
                  className="btn btn-accent btn-sm"
                  onClick={() => setShowAutoGenerate(true)}
                >
                  <Shuffle size={14} />
                  Tự động tạo
                </button>
              </div>

              {/* Questions */}
              <div className="form-group">
                <label>Câu hỏi <span className="required">*</span> ({formData.questions.length} câu - {totalPoints} điểm)</label>
                <QuestionEditor
                  questions={formData.questions}
                  onChange={(questions) => setFormData(prev => ({ ...prev, questions }))}
                />
              </div>
            </div>

            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={resetForm} disabled={saving}>
                Hủy
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving || !formData.title || formData.questions.length === 0}
              >
                {saving ? 'Đang lưu...' : editingTemplate ? 'Cập nhật' : 'Tạo mới'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="modal-overlay">
          <div className="import-modal">
            <div className="modal-header">
              <h4>Nhập từ {importSource === 'flashcard' ? 'Flashcard' : 'JLPT'}</h4>
              <button className="btn-close" onClick={() => { setShowImportModal(false); setSelectedImportItems([]); }}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              {/* Level and difficulty filter */}
              <div className="import-filter-row">
                <div className="import-filter">
                  <label>Cấp độ:</label>
                  <select value={importLevel} onChange={(e) => setImportLevel(e.target.value)}>
                    {JLPT_LEVELS.map(level => (
                      <option key={level} value={level}>{level}</option>
                    ))}
                  </select>
                </div>
                <div className="import-filter">
                  <label>Độ khó:</label>
                  <select
                    value={importDifficulty}
                    onChange={(e) => setImportDifficulty(e.target.value as DifficultyLevel)}
                    className="difficulty-select"
                    style={{
                      backgroundColor: DIFFICULTY_OPTIONS.find(d => d.value === importDifficulty)?.color + '20',
                      borderColor: DIFFICULTY_OPTIONS.find(d => d.value === importDifficulty)?.color
                    }}
                  >
                    {DIFFICULTY_OPTIONS.map(d => (
                      <option key={d.value} value={d.value}>{d.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Item list */}
              <div className="import-list">
                {importSource === 'flashcard' ? (
                  filteredFlashcards.length === 0 ? (
                    <p className="empty-text">Không có flashcard nào ở cấp độ {importLevel}</p>
                  ) : (
                    filteredFlashcards.slice(0, 50).map(card => (
                      <label key={card.id} className="import-item">
                        <input
                          type="checkbox"
                          checked={selectedImportItems.includes(card.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedImportItems(prev => [...prev, card.id]);
                            } else {
                              setSelectedImportItems(prev => prev.filter(id => id !== card.id));
                            }
                          }}
                        />
                        <span className="item-text">
                          <strong>{card.vocabulary}</strong>
                          {card.kanji && <span className="kanji">({card.kanji})</span>}
                          <span className="meaning">{card.meaning}</span>
                        </span>
                      </label>
                    ))
                  )
                ) : (
                  filteredJlptQuestions.length === 0 ? (
                    <p className="empty-text">Không có câu hỏi JLPT nào ở cấp độ {importLevel}</p>
                  ) : (
                    filteredJlptQuestions.slice(0, 50).map(q => (
                      <label key={q.id} className="import-item">
                        <input
                          type="checkbox"
                          checked={selectedImportItems.includes(q.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedImportItems(prev => [...prev, q.id]);
                            } else {
                              setSelectedImportItems(prev => prev.filter(id => id !== q.id));
                            }
                          }}
                        />
                        <span className="item-text">
                          <span className="question-text">{q.question}</span>
                        </span>
                      </label>
                    ))
                  )
                )}
              </div>
            </div>

            <div className="modal-footer">
              <span className="selected-count">Đã chọn: {selectedImportItems.length}</span>
              <button className="btn btn-secondary" onClick={() => { setShowImportModal(false); setSelectedImportItems([]); }}>
                Hủy
              </button>
              <button
                className="btn btn-primary"
                onClick={handleImport}
                disabled={selectedImportItems.length === 0}
              >
                <Import size={16} />
                Nhập ({selectedImportItems.length})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Auto-Generate Modal - Pro Version */}
      {showAutoGenerate && (
        <div className="modal-overlay">
          <div className="auto-generate-modal pro">
            <div className="modal-header">
              <h4><Zap size={20} /> Tự động tạo {activeTab === 'test' ? 'bài kiểm tra' : 'bài tập'}</h4>
              <button className="btn-close" onClick={() => setShowAutoGenerate(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              {/* Source & Level Section */}
              <div className="auto-gen-section">
                <h5 className="section-title">📚 Nguồn câu hỏi</h5>
                <div className="source-mode">
                  <label className={`checkbox-card ${sourcesEnabled.flashcard ? 'checked' : ''}`} style={{ borderColor: sourcesEnabled.flashcard ? '#e74c3c' : undefined }}>
                    <input
                      type="checkbox"
                      checked={sourcesEnabled.flashcard}
                      onChange={() => toggleSource('flashcard')}
                    />
                    <span className="checkbox-content">
                      <BookOpen size={18} />
                      <span>Flashcard</span>
                      <small>{sourceQuestionCounts.flashcard}</small>
                    </span>
                  </label>
                  <label className={`checkbox-card ${sourcesEnabled.jlpt ? 'checked' : ''}`} style={{ borderColor: sourcesEnabled.jlpt ? '#9b59b6' : undefined }}>
                    <input
                      type="checkbox"
                      checked={sourcesEnabled.jlpt}
                      onChange={() => toggleSource('jlpt')}
                    />
                    <span className="checkbox-content">
                      <FileQuestion size={18} />
                      <span>JLPT</span>
                      <small>{sourceQuestionCounts.jlpt}</small>
                    </span>
                  </label>
                  <label className={`checkbox-card ${sourcesEnabled.testbank ? 'checked' : ''}`} style={{ borderColor: sourcesEnabled.testbank ? '#3498db' : undefined }}>
                    <input
                      type="checkbox"
                      checked={sourcesEnabled.testbank}
                      onChange={() => toggleSource('testbank')}
                    />
                    <span className="checkbox-content">
                      <ClipboardList size={18} />
                      <span>Ngân hàng</span>
                      <small>{sourceQuestionCounts.testbank}</small>
                    </span>
                  </label>
                </div>

                {/* Source mix config - shown when multiple sources selected */}
                {Object.values(sourcesEnabled).filter(Boolean).length > 1 && (
                  <div className="mixed-config source-mix-config">
                    <div className="preset-buttons">
                      {sourceMixPresets.filter(p => {
                        // Only show presets that match current enabled sources
                        const matchFlashcard = (p.flashcard > 0) === sourcesEnabled.flashcard || !sourcesEnabled.flashcard;
                        const matchJlpt = (p.jlpt > 0) === sourcesEnabled.jlpt || !sourcesEnabled.jlpt;
                        const matchTestbank = (p.testbank > 0) === sourcesEnabled.testbank || !sourcesEnabled.testbank;
                        return matchFlashcard && matchJlpt && matchTestbank;
                      }).slice(0, 4).map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          className={`preset-btn ${
                            sourceMixPct.flashcard === preset.flashcard &&
                            sourceMixPct.jlpt === preset.jlpt &&
                            sourceMixPct.testbank === preset.testbank ? 'active' : ''
                          }`}
                          onClick={() => setSourceMixPct(preset)}
                        >
                          {preset.name}
                        </button>
                      ))}
                    </div>

                    <div className="source-sliders">
                      {sourcesEnabled.flashcard && (
                        <div className="slider-row">
                          <span className="slider-label" style={{ color: '#e74c3c' }}>FC</span>
                          <input
                            type="range"
                            min={0}
                            max={100}
                            value={sourceMixPct.flashcard}
                            onChange={(e) => updateSourcePct('flashcard', parseInt(e.target.value))}
                            className="slider source-flashcard"
                          />
                          <span className="slider-value">{sourceMixPct.flashcard}%</span>
                        </div>
                      )}
                      {sourcesEnabled.jlpt && (
                        <div className="slider-row">
                          <span className="slider-label" style={{ color: '#9b59b6' }}>JLPT</span>
                          <input
                            type="range"
                            min={0}
                            max={100}
                            value={sourceMixPct.jlpt}
                            onChange={(e) => updateSourcePct('jlpt', parseInt(e.target.value))}
                            className="slider source-jlpt"
                          />
                          <span className="slider-value">{sourceMixPct.jlpt}%</span>
                        </div>
                      )}
                      {sourcesEnabled.testbank && (
                        <div className="slider-row">
                          <span className="slider-label" style={{ color: '#3498db' }}>NHĐ</span>
                          <input
                            type="range"
                            min={0}
                            max={100}
                            value={sourceMixPct.testbank}
                            onChange={(e) => updateSourcePct('testbank', parseInt(e.target.value))}
                            className="slider source-testbank"
                          />
                          <span className="slider-value">{sourceMixPct.testbank}%</span>
                        </div>
                      )}
                    </div>

                    {/* Distribution bar */}
                    <div className="distribution-bar">
                      {sourcesEnabled.flashcard && <div className="bar-segment source-flashcard" style={{ width: `${sourceMixPct.flashcard}%` }} title={`Flashcard: ${sourceMixPct.flashcard}%`} />}
                      {sourcesEnabled.jlpt && <div className="bar-segment source-jlpt" style={{ width: `${sourceMixPct.jlpt}%` }} title={`JLPT: ${sourceMixPct.jlpt}%`} />}
                      {sourcesEnabled.testbank && <div className="bar-segment source-testbank" style={{ width: `${sourceMixPct.testbank}%` }} title={`Ngân hàng: ${sourceMixPct.testbank}%`} />}
                    </div>
                  </div>
                )}

                <div className="level-selector">
                  <label>Cấp độ:</label>
                  <div className="level-chips">
                    {JLPT_LEVELS.map(level => (
                      <button
                        key={level}
                        type="button"
                        className={`level-chip ${autoGenLevel === level ? 'active' : ''}`}
                        onClick={() => setAutoGenLevel(level)}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Difficulty Section */}
              <div className="auto-gen-section">
                <h5 className="section-title">🎯 Độ khó</h5>
                <div className="difficulty-mode">
                  <label className="radio-card">
                    <input
                      type="radio"
                      name="diffMode"
                      checked={autoGenDifficulty === 'mixed'}
                      onChange={() => setAutoGenDifficulty('mixed')}
                    />
                    <span className="radio-content">
                      <Shuffle size={18} />
                      <span>Hỗn hợp</span>
                    </span>
                  </label>
                  {DIFFICULTY_OPTIONS.map(d => (
                    <label key={d.value} className="radio-card" style={{ borderColor: autoGenDifficulty === d.value ? d.color : undefined }}>
                      <input
                        type="radio"
                        name="diffMode"
                        checked={autoGenDifficulty === d.value}
                        onChange={() => setAutoGenDifficulty(d.value)}
                      />
                      <span className="radio-content" style={{ color: autoGenDifficulty === d.value ? d.color : undefined }}>
                        <span>{d.label}</span>
                      </span>
                    </label>
                  ))}
                </div>

                {/* Mixed difficulty sliders */}
                {autoGenDifficulty === 'mixed' && (
                  <div className="mixed-config">
                    <div className="preset-buttons">
                      {difficultyPresets.map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          className={`preset-btn ${mixedEasyPct === preset.easy && mixedMediumPct === preset.medium ? 'active' : ''}`}
                          onClick={() => {
                            setMixedEasyPct(preset.easy);
                            setMixedMediumPct(preset.medium);
                            setMixedHardPct(preset.hard);
                          }}
                        >
                          {preset.name}
                        </button>
                      ))}
                    </div>

                    <div className="difficulty-sliders">
                      <div className="slider-row">
                        <span className="slider-label" style={{ color: '#27ae60' }}>Dễ</span>
                        <input
                          type="range"
                          min={0}
                          max={100}
                          value={mixedEasyPct}
                          onChange={(e) => {
                            const val = parseInt(e.target.value);
                            setMixedEasyPct(val);
                            // Auto-adjust others
                            const remaining = 100 - val;
                            const ratio = mixedMediumPct / (mixedMediumPct + mixedHardPct || 1);
                            setMixedMediumPct(Math.round(remaining * ratio));
                            setMixedHardPct(remaining - Math.round(remaining * ratio));
                          }}
                          className="slider easy"
                        />
                        <span className="slider-value">{mixedEasyPct}%</span>
                      </div>
                      <div className="slider-row">
                        <span className="slider-label" style={{ color: '#f39c12' }}>TB</span>
                        <input
                          type="range"
                          min={0}
                          max={100}
                          value={mixedMediumPct}
                          onChange={(e) => {
                            const val = parseInt(e.target.value);
                            setMixedMediumPct(val);
                            const remaining = 100 - val;
                            const ratio = mixedEasyPct / (mixedEasyPct + mixedHardPct || 1);
                            setMixedEasyPct(Math.round(remaining * ratio));
                            setMixedHardPct(remaining - Math.round(remaining * ratio));
                          }}
                          className="slider medium"
                        />
                        <span className="slider-value">{mixedMediumPct}%</span>
                      </div>
                      <div className="slider-row">
                        <span className="slider-label" style={{ color: '#e74c3c' }}>Khó</span>
                        <input
                          type="range"
                          min={0}
                          max={100}
                          value={mixedHardPct}
                          onChange={(e) => {
                            const val = parseInt(e.target.value);
                            setMixedHardPct(val);
                            const remaining = 100 - val;
                            const ratio = mixedEasyPct / (mixedEasyPct + mixedMediumPct || 1);
                            setMixedEasyPct(Math.round(remaining * ratio));
                            setMixedMediumPct(remaining - Math.round(remaining * ratio));
                          }}
                          className="slider hard"
                        />
                        <span className="slider-value">{mixedHardPct}%</span>
                      </div>
                    </div>

                    {/* Visual distribution bar */}
                    <div className="distribution-bar">
                      <div className="bar-segment easy" style={{ width: `${mixedEasyPct}%` }} title={`Dễ: ${mixedEasyPct}%`} />
                      <div className="bar-segment medium" style={{ width: `${mixedMediumPct}%` }} title={`TB: ${mixedMediumPct}%`} />
                      <div className="bar-segment hard" style={{ width: `${mixedHardPct}%` }} title={`Khó: ${mixedHardPct}%`} />
                    </div>
                  </div>
                )}
              </div>

              {/* Questions & Points Section */}
              <div className="auto-gen-section">
                <h5 className="section-title">📊 Cấu hình</h5>
                <div className="config-grid">
                  <div className="config-item">
                    <label>Số câu hỏi</label>
                    <div className="stepper">
                      <button type="button" onClick={() => setAutoGenQuestionCount(Math.max(1, autoGenQuestionCount - 5))}>−5</button>
                      <input
                        type="number"
                        value={autoGenQuestionCount}
                        onChange={(e) => setAutoGenQuestionCount(Math.max(1, Math.min(autoGenAvailableCount, parseInt(e.target.value) || 10)))}
                        min={1}
                        max={autoGenAvailableCount}
                      />
                      <button type="button" onClick={() => setAutoGenQuestionCount(Math.min(autoGenAvailableCount, autoGenQuestionCount + 5))}>+5</button>
                    </div>
                    <small>Tối đa: {autoGenAvailableCount}</small>
                  </div>

                  <div className="config-item">
                    <label>Tổng điểm</label>
                    <div className="stepper">
                      <button type="button" onClick={() => setAutoGenTotalPoints(Math.max(10, autoGenTotalPoints - 50))}>−50</button>
                      <input
                        type="number"
                        value={autoGenTotalPoints}
                        onChange={(e) => setAutoGenTotalPoints(Math.max(10, parseInt(e.target.value) || 200))}
                        min={10}
                        step={10}
                      />
                      <button type="button" onClick={() => setAutoGenTotalPoints(autoGenTotalPoints + 50)}>+50</button>
                    </div>
                    <small>~{Math.round(autoGenTotalPoints / autoGenQuestionCount)} đ/câu</small>
                  </div>
                </div>
              </div>

              {/* Preview Section */}
              <div className="auto-gen-preview-section">
                <div className="preview-card">
                  <div className="preview-header">
                    <Zap size={18} />
                    <span>Xem trước</span>
                  </div>
                  <div className="preview-stats">
                    <div className="stat">
                      <span className="stat-value">{autoGenQuestionCount}</span>
                      <span className="stat-label">câu hỏi</span>
                    </div>
                    <div className="stat">
                      <span className="stat-value">{autoGenTotalPoints}</span>
                      <span className="stat-label">điểm</span>
                    </div>
                    <div className="stat">
                      <span className="stat-value">~{Math.round(autoGenTotalPoints / autoGenQuestionCount)}</span>
                      <span className="stat-label">đ/câu</span>
                    </div>
                  </div>

                  {/* Source distribution preview */}
                  {Object.values(sourcesEnabled).filter(Boolean).length > 1 && (
                    <div className="preview-source-mix">
                      <span className="mix-label">Nguồn:</span>
                      {sourcesEnabled.flashcard && (
                        <span className="source-chip flashcard">
                          ~{Math.round(autoGenQuestionCount * sourceMixPct.flashcard / 100)} FC
                        </span>
                      )}
                      {sourcesEnabled.jlpt && (
                        <span className="source-chip jlpt">
                          ~{Math.round(autoGenQuestionCount * sourceMixPct.jlpt / 100)} JLPT
                        </span>
                      )}
                      {sourcesEnabled.testbank && (
                        <span className="source-chip testbank">
                          ~{Math.round(autoGenQuestionCount * sourceMixPct.testbank / 100)} NHĐ
                        </span>
                      )}
                    </div>
                  )}

                  {autoGenDifficulty === 'mixed' && (
                    <div className="preview-distribution">
                      <span style={{ color: '#27ae60' }}>~{Math.round(autoGenQuestionCount * mixedEasyPct / 100)} dễ</span>
                      <span style={{ color: '#f39c12' }}>~{Math.round(autoGenQuestionCount * mixedMediumPct / 100)} TB</span>
                      <span style={{ color: '#e74c3c' }}>~{Math.round(autoGenQuestionCount * mixedHardPct / 100)} khó</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Warning if not enough questions */}
              {autoGenAvailableCount < autoGenQuestionCount && (
                <div className="auto-gen-warning">
                  ⚠️ Không đủ câu hỏi! Cần {autoGenQuestionCount} câu nhưng chỉ có {autoGenAvailableCount} câu ở {autoGenLevel}.
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowAutoGenerate(false)}>
                Hủy
              </button>
              <button
                className="btn btn-accent btn-generate"
                onClick={handleAutoGenerate}
                disabled={autoGenAvailableCount < autoGenQuestionCount}
              >
                <Shuffle size={18} />
                Tạo {autoGenQuestionCount} câu ngẫu nhiên
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
