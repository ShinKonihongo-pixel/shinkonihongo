// Kaiwa Questions Management Tab - Professional Kaiwa conversation management system
// Features: Question management, document import, topic categorization, practice settings, challenge mode

import { useState, useMemo, useRef } from 'react';
import { CONVERSATION_TOPICS, CONVERSATION_STYLES } from '../../constants/kaiwa';
import { ConfirmModal } from '../ui/confirm-modal';
import type { KaiwaTabProps, KaiwaNavState, KaiwaDefaultQuestion, KaiwaFolder, KaiwaQuestionFormData, ConversationStyle } from './cards-management-types';
import { KAIWA_LEVELS } from './cards-management-types';
import { MessageSquare, FolderOpen, Upload, Settings, Trophy, Clock, Mic, FileText, Plus, Search, Filter, ChevronRight, ChevronLeft, Edit2, Trash2, BookOpen, Target, Zap, Award, TrendingUp, BarChart3 } from 'lucide-react';

// Kaiwa management sub-tabs
type KaiwaSubTab = 'overview' | 'questions' | 'import' | 'settings' | 'challenges' | 'rewards';

// Practice settings type
interface KaiwaPracticeSettings {
  aiResponseDelay: number; // seconds
  userResponseTime: number; // seconds, 0 = unlimited
  autoSuggestions: boolean;
  voiceEnabled: boolean;
  furiganaDefault: boolean;
  slowModeDefault: boolean;
}

// Challenge configuration
interface KaiwaChallenge {
  id: string;
  name: string;
  description: string;
  level: string;
  topics: string[];
  questionCount: number;
  timeLimit: number; // minutes, 0 = unlimited
  minAccuracy: number; // percentage required to pass
  rewardPoints: number;
  badge?: string;
  isActive: boolean;
}

// Reward badge definition
interface KaiwaBadge {
  id: string;
  name: string;
  icon: string;
  description: string;
  requirement: string;
  pointsRequired?: number;
  conversationsRequired?: number;
  accuracyRequired?: number;
}

// Default practice settings
const DEFAULT_SETTINGS: KaiwaPracticeSettings = {
  aiResponseDelay: 1,
  userResponseTime: 0,
  autoSuggestions: true,
  voiceEnabled: true,
  furiganaDefault: true,
  slowModeDefault: false,
};

// Preset badges
const KAIWA_BADGES: KaiwaBadge[] = [
  { id: 'first_chat', name: 'Người mới bắt đầu', icon: '🌱', description: 'Hoàn thành cuộc hội thoại đầu tiên', requirement: '1 cuộc hội thoại', conversationsRequired: 1 },
  { id: 'ten_chats', name: 'Người chăm chỉ', icon: '📚', description: 'Hoàn thành 10 cuộc hội thoại', requirement: '10 cuộc hội thoại', conversationsRequired: 10 },
  { id: 'fifty_chats', name: 'Người kiên trì', icon: '💪', description: 'Hoàn thành 50 cuộc hội thoại', requirement: '50 cuộc hội thoại', conversationsRequired: 50 },
  { id: 'perfect_accuracy', name: 'Phát âm chuẩn', icon: '🎯', description: 'Đạt 100% độ chính xác phát âm', requirement: '100% accuracy', accuracyRequired: 100 },
  { id: 'all_topics', name: 'Đa chủ đề', icon: '🌈', description: 'Luyện tập tất cả chủ đề', requirement: 'Tất cả topics' },
  { id: 'n5_master', name: 'N5 Master', icon: '⭐', description: 'Hoàn thành tất cả câu hỏi N5', requirement: 'Hoàn thành N5' },
  { id: 'n4_master', name: 'N4 Master', icon: '⭐⭐', description: 'Hoàn thành tất cả câu hỏi N4', requirement: 'Hoàn thành N4' },
  { id: 'n3_master', name: 'N3 Master', icon: '⭐⭐⭐', description: 'Hoàn thành tất cả câu hỏi N3', requirement: 'Hoàn thành N3' },
  { id: 'speed_demon', name: 'Nhanh như chớp', icon: '⚡', description: 'Trả lời trong 5 giây', requirement: '< 5 giây' },
  { id: 'streak_7', name: 'Streak 7 ngày', icon: '🔥', description: 'Luyện tập 7 ngày liên tiếp', requirement: '7 ngày liên tiếp' },
];

export function KaiwaTab({
  questions,
  folders: _folders,
  onAddQuestion,
  onUpdateQuestion,
  onDeleteQuestion,
  onAddFolder,
  onUpdateFolder,
  onDeleteFolder,
  getFoldersByLevelAndTopic,
  getQuestionsByFolder,
  currentUser,
  isSuperAdmin,
}: KaiwaTabProps) {
  // Main tab state
  const [activeSubTab, setActiveSubTab] = useState<KaiwaSubTab>('overview');

  // Navigation state for questions
  const [navState, setNavState] = useState<KaiwaNavState>({ type: 'root' });
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [filterTopic, setFilterTopic] = useState<string>('all');

  // Form states
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [formData, setFormData] = useState<KaiwaQuestionFormData>({
    level: 'N5',
    topic: 'greetings',
    questionJa: '',
    questionVi: '',
    situationContext: '',
    suggestedAnswers: ['', ''],
    style: 'polite'
  });

  // Folder states
  const [isAddingFolder, setIsAddingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editingFolderName, setEditingFolderName] = useState('');

  // Delete confirmation states
  const [deleteFolderTarget, setDeleteFolderTarget] = useState<KaiwaFolder | null>(null);
  const [deleteQuestionTarget, setDeleteQuestionTarget] = useState<KaiwaDefaultQuestion | null>(null);

  // Import states
  const [importText, setImportText] = useState('');
  const [isProcessingImport, setIsProcessingImport] = useState(false);
  const [importResults, setImportResults] = useState<{ questions: KaiwaQuestionFormData[]; errors: string[] } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Settings state
  const [practiceSettings, setPracticeSettings] = useState<KaiwaPracticeSettings>(DEFAULT_SETTINGS);

  // Challenge state
  const [challenges] = useState<KaiwaChallenge[]>([]);
  const [isAddingChallenge, setIsAddingChallenge] = useState(false);

  // Permission helpers
  const canModifyQuestion = (q: KaiwaDefaultQuestion) => isSuperAdmin || q.createdBy === currentUser.id;
  const canModifyFolder = (f: KaiwaFolder) => isSuperAdmin || f.createdBy === currentUser.id;

  // Stats calculations
  const stats = useMemo(() => {
    const byLevel: Record<string, number> = {};
    const byTopic: Record<string, number> = {};
    const byStyle: Record<string, number> = {};

    KAIWA_LEVELS.forEach(l => byLevel[l] = 0);
    CONVERSATION_TOPICS.forEach(t => byTopic[t.value] = 0);
    CONVERSATION_STYLES.forEach(s => byStyle[s.value] = 0);

    questions.forEach(q => {
      byLevel[q.level] = (byLevel[q.level] || 0) + 1;
      byTopic[q.topic] = (byTopic[q.topic] || 0) + 1;
      byStyle[q.style] = (byStyle[q.style] || 0) + 1;
    });

    return { total: questions.length, byLevel, byTopic, byStyle };
  }, [questions]);

  // Filter questions
  const filteredQuestions = useMemo(() => {
    let result = questions;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(q =>
        q.questionJa.toLowerCase().includes(query) ||
        (q.questionVi && q.questionVi.toLowerCase().includes(query)) ||
        (q.situationContext && q.situationContext.toLowerCase().includes(query))
      );
    }

    if (filterLevel !== 'all') {
      result = result.filter(q => q.level === filterLevel);
    }

    if (filterTopic !== 'all') {
      result = result.filter(q => q.topic === filterTopic);
    }

    return result;
  }, [questions, searchQuery, filterLevel, filterTopic]);

  // Navigation helpers
  const getQuestionCountByLevel = (level: string) => questions.filter(q => q.level === level).length;
  const getQuestionCountByTopic = (level: string, topic: string) => questions.filter(q => q.level === level && q.topic === topic).length;
  const getQuestionCountByFolder = (folderId: string) => questions.filter(q => q.folderId === folderId).length;

  const getQuestionsForCurrentView = (): KaiwaDefaultQuestion[] => {
    if (navState.type === 'folder' && getQuestionsByFolder) return getQuestionsByFolder(navState.folderId);
    if (navState.type === 'topic' && getFoldersByLevelAndTopic) {
      const folders = getFoldersByLevelAndTopic(navState.level, navState.topic);
      if (folders.length === 0) return questions.filter(q => q.level === navState.level && q.topic === navState.topic && !q.folderId);
    }
    return [];
  };

  const getFoldersForCurrentView = (): KaiwaFolder[] => {
    if (navState.type !== 'topic' || !getFoldersByLevelAndTopic) return [];
    return getFoldersByLevelAndTopic(navState.level, navState.topic);
  };

  const topicHasFolders = () => navState.type === 'topic' && getFoldersByLevelAndTopic && getFoldersByLevelAndTopic(navState.level, navState.topic).length > 0;

  const getBreadcrumb = (): string[] => {
    const crumbs: string[] = ['Tất cả'];
    if (navState.type === 'level') crumbs.push(navState.level);
    if (navState.type === 'topic') crumbs.push(navState.level, navState.topicLabel);
    if (navState.type === 'folder') crumbs.push(navState.level, navState.topicLabel, navState.folderName);
    return crumbs;
  };

  const goBack = () => {
    if (navState.type === 'level') setNavState({ type: 'root' });
    else if (navState.type === 'topic') setNavState({ type: 'level', level: navState.level });
    else if (navState.type === 'folder') setNavState({ type: 'topic', level: navState.level, topic: navState.topic, topicLabel: navState.topicLabel });
    setIsAddingQuestion(false);
    setEditingQuestionId(null);
  };

  const resetForm = () => setFormData({
    level: 'N5',
    topic: 'greetings',
    questionJa: '',
    questionVi: '',
    situationContext: '',
    suggestedAnswers: ['', ''],
    style: 'polite'
  });

  // Folder handlers
  const handleAddFolder = async () => {
    if (!newFolderName.trim() || navState.type !== 'topic' || !onAddFolder) return;
    await onAddFolder(newFolderName.trim(), navState.level, navState.topic, currentUser.id);
    setNewFolderName('');
    setIsAddingFolder(false);
  };

  const handleUpdateFolder = async (id: string) => {
    if (editingFolderName.trim() && onUpdateFolder) {
      await onUpdateFolder(id, { name: editingFolderName.trim() });
      setEditingFolderId(null);
      setEditingFolderName('');
    }
  };

  // Question handlers
  const handleAddQuestion = async () => {
    if (!formData.questionJa.trim() || !onAddQuestion) return;
    const data = { ...formData };
    if (navState.type === 'topic') {
      data.level = navState.level;
      data.topic = navState.topic;
    } else if (navState.type === 'folder') {
      data.level = navState.level;
      data.topic = navState.topic;
      data.folderId = navState.folderId;
    }
    data.suggestedAnswers = data.suggestedAnswers?.filter(a => a.trim()) || [];
    await onAddQuestion(data, currentUser.id);
    resetForm();
    setIsAddingQuestion(false);
  };

  const handleEditQuestion = (q: KaiwaDefaultQuestion) => {
    setEditingQuestionId(q.id);
    setFormData({
      level: q.level,
      topic: q.topic,
      folderId: q.folderId,
      questionJa: q.questionJa,
      questionVi: q.questionVi || '',
      situationContext: q.situationContext || '',
      suggestedAnswers: q.suggestedAnswers?.length ? [...q.suggestedAnswers] : ['', ''],
      style: q.style
    });
  };

  const handleUpdateQuestion = async () => {
    if (!editingQuestionId || !onUpdateQuestion) return;
    const data = { ...formData };
    data.suggestedAnswers = data.suggestedAnswers?.filter(a => a.trim()) || [];
    await onUpdateQuestion(editingQuestionId, data);
    resetForm();
    setEditingQuestionId(null);
  };

  const handleSuggestedAnswerChange = (idx: number, value: string) => {
    const newAnswers = [...(formData.suggestedAnswers || ['', ''])];
    newAnswers[idx] = value;
    setFormData({ ...formData, suggestedAnswers: newAnswers });
  };

  // Import handlers
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingImport(true);

    try {
      if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
        const text = await file.text();
        setImportText(text);
        processImportText(text);
      } else {
        // For PDF/images, show placeholder message
        setImportResults({
          questions: [],
          errors: ['Tính năng OCR cho PDF/ảnh đang được phát triển. Hiện tại hỗ trợ file .txt']
        });
      }
    } catch (error) {
      setImportResults({
        questions: [],
        errors: ['Lỗi đọc file: ' + (error instanceof Error ? error.message : 'Unknown error')]
      });
    } finally {
      setIsProcessingImport(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const processImportText = (text: string) => {
    const lines = text.split('\n').filter(line => line.trim());
    const parsedQuestions: KaiwaQuestionFormData[] = [];
    const errors: string[] = [];

    // Simple format: each line is "Japanese|Vietnamese|context"
    lines.forEach((line, idx) => {
      const parts = line.split('|').map(p => p.trim());
      if (parts.length >= 1 && parts[0]) {
        parsedQuestions.push({
          level: filterLevel !== 'all' ? filterLevel as 'N5' | 'N4' | 'N3' | 'N2' | 'N1' : 'N5',
          topic: filterTopic !== 'all' ? filterTopic as typeof formData.topic : 'greetings',
          questionJa: parts[0],
          questionVi: parts[1] || '',
          situationContext: parts[2] || '',
          suggestedAnswers: parts.slice(3).filter(Boolean),
          style: 'polite'
        });
      } else {
        errors.push(`Dòng ${idx + 1}: Không có nội dung câu hỏi`);
      }
    });

    setImportResults({ questions: parsedQuestions, errors });
  };

  const handleImportConfirm = async () => {
    if (!importResults?.questions.length || !onAddQuestion) return;

    setIsProcessingImport(true);
    try {
      for (const q of importResults.questions) {
        await onAddQuestion(q, currentUser.id);
      }
      setImportResults(null);
      setImportText('');
      setActiveSubTab('questions');
    } catch (error) {
      setImportResults({
        ...importResults,
        errors: [...importResults.errors, 'Lỗi import: ' + (error instanceof Error ? error.message : 'Unknown')]
      });
    } finally {
      setIsProcessingImport(false);
    }
  };

  // Settings handlers
  const handleSettingChange = <K extends keyof KaiwaPracticeSettings>(key: K, value: KaiwaPracticeSettings[K]) => {
    setPracticeSettings(prev => ({ ...prev, [key]: value }));
  };

  // Render question item
  const renderQuestionItem = (question: KaiwaDefaultQuestion) => (
    <div key={question.id} className="kaiwa-question-item">
      <div className="kaiwa-question-content">
        <div className="kaiwa-question-ja">{question.questionJa}</div>
        {question.questionVi && <div className="kaiwa-question-vi">{question.questionVi}</div>}
        <div className="kaiwa-question-meta">
          <span className="meta-badge level">{question.level}</span>
          <span className="meta-badge style">
            {question.style === 'casual' ? 'タメ口' : question.style === 'polite' ? 'です/ます' : '敬語'}
          </span>
          {question.situationContext && <span className="meta-context">{question.situationContext}</span>}
        </div>
        {question.suggestedAnswers && question.suggestedAnswers.length > 0 && (
          <div className="kaiwa-suggested-answers">
            <span className="answers-label">Gợi ý:</span>
            {question.suggestedAnswers.map((answer, idx) => (
              <span key={idx} className="answer-item">{answer}</span>
            ))}
          </div>
        )}
      </div>
      {canModifyQuestion(question) && (
        <div className="kaiwa-question-actions">
          <button className="btn-icon" onClick={() => handleEditQuestion(question)} title="Sửa">
            <Edit2 size={16} />
          </button>
          <button className="btn-icon danger" onClick={() => setDeleteQuestionTarget(question)} title="Xóa">
            <Trash2 size={16} />
          </button>
        </div>
      )}
    </div>
  );

  // Render question form
  const renderQuestionForm = () => (
    <div className="kaiwa-question-form">
      <div className="form-header">
        <h3>{editingQuestionId ? 'Sửa câu hỏi' : 'Thêm câu hỏi mới'}</h3>
      </div>

      <div className="form-grid">
        <div className="form-group full">
          <label>Câu hỏi (tiếng Nhật) <span className="required">*</span></label>
          <textarea
            value={formData.questionJa}
            onChange={(e) => setFormData({ ...formData, questionJa: e.target.value })}
            placeholder="Nhập câu hỏi tiếng Nhật..."
            rows={2}
          />
        </div>

        <div className="form-group full">
          <label>Dịch nghĩa (tiếng Việt)</label>
          <input
            type="text"
            value={formData.questionVi}
            onChange={(e) => setFormData({ ...formData, questionVi: e.target.value })}
            placeholder="Nhập dịch nghĩa..."
          />
        </div>

        <div className="form-group">
          <label>Cấp độ</label>
          <select
            value={formData.level}
            onChange={(e) => setFormData({ ...formData, level: e.target.value as typeof formData.level })}
            disabled={navState.type !== 'root'}
          >
            {KAIWA_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>

        <div className="form-group">
          <label>Chủ đề</label>
          <select
            value={formData.topic}
            onChange={(e) => setFormData({ ...formData, topic: e.target.value as typeof formData.topic })}
            disabled={navState.type !== 'root'}
          >
            {CONVERSATION_TOPICS.filter(t => t.value !== 'free').map(t => (
              <option key={t.value} value={t.value}>{t.icon} {t.label}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Phong cách nói</label>
          <select
            value={formData.style}
            onChange={(e) => setFormData({ ...formData, style: e.target.value as ConversationStyle })}
          >
            {CONVERSATION_STYLES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>

        <div className="form-group">
          <label>Ngữ cảnh tình huống</label>
          <input
            type="text"
            value={formData.situationContext}
            onChange={(e) => setFormData({ ...formData, situationContext: e.target.value })}
            placeholder="Mô tả tình huống..."
          />
        </div>

        <div className="form-group full">
          <label>Gợi ý trả lời</label>
          <div className="suggested-answers-list">
            {(formData.suggestedAnswers || []).map((answer, idx) => (
              <div key={idx} className="suggested-answer-row">
                <input
                  type="text"
                  value={answer}
                  onChange={(e) => handleSuggestedAnswerChange(idx, e.target.value)}
                  placeholder={`Gợi ý ${idx + 1}...`}
                />
                <button
                  type="button"
                  className="btn-icon danger"
                  onClick={() => setFormData({
                    ...formData,
                    suggestedAnswers: (formData.suggestedAnswers || []).filter((_, i) => i !== idx)
                  })}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            <button
              type="button"
              className="btn btn-secondary btn-small"
              onClick={() => setFormData({
                ...formData,
                suggestedAnswers: [...(formData.suggestedAnswers || []), '']
              })}
            >
              <Plus size={14} /> Thêm gợi ý
            </button>
          </div>
        </div>
      </div>

      <div className="form-actions">
        <button className="btn btn-primary" onClick={editingQuestionId ? handleUpdateQuestion : handleAddQuestion}>
          {editingQuestionId ? 'Cập nhật' : 'Thêm câu hỏi'}
        </button>
        <button className="btn btn-secondary" onClick={() => {
          resetForm();
          setIsAddingQuestion(false);
          setEditingQuestionId(null);
        }}>
          Hủy
        </button>
      </div>
    </div>
  );

  return (
    <div className="kaiwa-management">
      {/* Sub-tab Navigation */}
      <div className="kaiwa-subtabs">
        <button
          className={`subtab ${activeSubTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('overview')}
        >
          <BarChart3 size={18} />
          <span>Tổng quan</span>
        </button>
        <button
          className={`subtab ${activeSubTab === 'questions' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('questions')}
        >
          <MessageSquare size={18} />
          <span>Câu hỏi</span>
        </button>
        <button
          className={`subtab ${activeSubTab === 'import' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('import')}
        >
          <Upload size={18} />
          <span>Import</span>
        </button>
        <button
          className={`subtab ${activeSubTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('settings')}
        >
          <Settings size={18} />
          <span>Cài đặt</span>
        </button>
        <button
          className={`subtab ${activeSubTab === 'challenges' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('challenges')}
        >
          <Target size={18} />
          <span>Thử thách</span>
        </button>
        <button
          className={`subtab ${activeSubTab === 'rewards' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('rewards')}
        >
          <Trophy size={18} />
          <span>Phần thưởng</span>
        </button>
      </div>

      {/* Overview Tab */}
      {activeSubTab === 'overview' && (
        <div className="kaiwa-overview">
          {/* Stats Cards */}
          <div className="stats-grid">
            <div className="stat-card primary">
              <div className="stat-icon"><MessageSquare size={24} /></div>
              <div className="stat-content">
                <div className="stat-value">{stats.total}</div>
                <div className="stat-label">Tổng câu hỏi</div>
              </div>
            </div>
            <div className="stat-card success">
              <div className="stat-icon"><FolderOpen size={24} /></div>
              <div className="stat-content">
                <div className="stat-value">{_folders?.length || 0}</div>
                <div className="stat-label">Thư mục</div>
              </div>
            </div>
            <div className="stat-card warning">
              <div className="stat-icon"><BookOpen size={24} /></div>
              <div className="stat-content">
                <div className="stat-value">{CONVERSATION_TOPICS.filter(t => t.value !== 'free').length}</div>
                <div className="stat-label">Chủ đề</div>
              </div>
            </div>
            <div className="stat-card info">
              <div className="stat-icon"><Target size={24} /></div>
              <div className="stat-content">
                <div className="stat-value">{challenges.filter(c => c.isActive).length}</div>
                <div className="stat-label">Thử thách</div>
              </div>
            </div>
          </div>

          {/* By Level Chart */}
          <div className="overview-section">
            <h3>Phân bố theo cấp độ</h3>
            <div className="level-bars">
              {KAIWA_LEVELS.map(level => {
                const count = stats.byLevel[level] || 0;
                const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0;
                return (
                  <div key={level} className="level-bar-item">
                    <div className="level-bar-label">
                      <span className="level-name">{level}</span>
                      <span className="level-count">{count} câu</span>
                    </div>
                    <div className="level-bar-track">
                      <div
                        className={`level-bar-fill level-${level.toLowerCase()}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* By Topic Grid */}
          <div className="overview-section">
            <h3>Phân bố theo chủ đề</h3>
            <div className="topic-stats-grid">
              {CONVERSATION_TOPICS.filter(t => t.value !== 'free').map(topic => (
                <div key={topic.value} className="topic-stat-card">
                  <span className="topic-icon">{topic.icon}</span>
                  <span className="topic-name">{topic.label}</span>
                  <span className="topic-count">{stats.byTopic[topic.value] || 0}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="overview-section">
            <h3>Thao tác nhanh</h3>
            <div className="quick-actions">
              <button className="quick-action-btn" onClick={() => setActiveSubTab('questions')}>
                <Plus size={20} />
                <span>Thêm câu hỏi</span>
              </button>
              <button className="quick-action-btn" onClick={() => setActiveSubTab('import')}>
                <Upload size={20} />
                <span>Import câu hỏi</span>
              </button>
              <button className="quick-action-btn" onClick={() => setActiveSubTab('challenges')}>
                <Target size={20} />
                <span>Tạo thử thách</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Questions Tab */}
      {activeSubTab === 'questions' && (
        <div className="kaiwa-questions-tab">
          {/* Search & Filter Bar */}
          <div className="questions-toolbar">
            <div className="search-box">
              <Search size={18} />
              <input
                type="text"
                placeholder="Tìm kiếm câu hỏi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="filter-group">
              <Filter size={18} />
              <select value={filterLevel} onChange={(e) => setFilterLevel(e.target.value)}>
                <option value="all">Tất cả cấp độ</option>
                {KAIWA_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
              <select value={filterTopic} onChange={(e) => setFilterTopic(e.target.value)}>
                <option value="all">Tất cả chủ đề</option>
                {CONVERSATION_TOPICS.filter(t => t.value !== 'free').map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Breadcrumb */}
          <div className="breadcrumb">
            {getBreadcrumb().map((crumb, idx) => (
              <span key={idx}>
                {idx > 0 && <ChevronRight size={14} />}
                <span
                  className={idx === getBreadcrumb().length - 1 ? 'current' : 'clickable'}
                  onClick={() => idx === 0 && setNavState({ type: 'root' })}
                >
                  {crumb}
                </span>
              </span>
            ))}
          </div>

          {navState.type !== 'root' && (
            <button className="btn btn-back" onClick={goBack}>
              <ChevronLeft size={16} /> Quay lại
            </button>
          )}

          {/* Root Level - Show all levels */}
          {navState.type === 'root' && !searchQuery && filterLevel === 'all' && filterTopic === 'all' && (
            <div className="level-grid">
              {KAIWA_LEVELS.map(level => (
                <div
                  key={level}
                  className={`level-card level-${level.toLowerCase()}`}
                  onClick={() => setNavState({ type: 'level', level })}
                >
                  <span className="level-badge">{level}</span>
                  <span className="level-count">{getQuestionCountByLevel(level)} câu hỏi</span>
                  <ChevronRight size={20} className="level-arrow" />
                </div>
              ))}
            </div>
          )}

          {/* Level View - Show topics */}
          {navState.type === 'level' && (
            <div className="category-grid">
              {CONVERSATION_TOPICS.filter(t => t.value !== 'free').map(topic => (
                <div
                  key={topic.value}
                  className="category-card"
                  onClick={() => setNavState({
                    type: 'topic',
                    level: navState.level,
                    topic: topic.value,
                    topicLabel: topic.label
                  })}
                >
                  <span className="category-icon">{topic.icon}</span>
                  <span className="category-name">{topic.label}</span>
                  <span className="category-count">{getQuestionCountByTopic(navState.level, topic.value)} câu</span>
                </div>
              ))}
            </div>
          )}

          {/* Topic View - Show folders and questions */}
          {navState.type === 'topic' && (
            <div className="folder-view">
              <div className="folder-actions">
                <button className="btn btn-secondary" onClick={() => setIsAddingFolder(true)}>
                  <FolderOpen size={16} /> Tạo thư mục
                </button>
                {!topicHasFolders() && (
                  <button className="btn btn-primary" onClick={() => setIsAddingQuestion(true)}>
                    <Plus size={16} /> Tạo câu hỏi
                  </button>
                )}
              </div>

              {isAddingFolder && (
                <div className="add-folder-inline">
                  <input
                    type="text"
                    placeholder="Tên thư mục..."
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddFolder();
                      if (e.key === 'Escape') { setIsAddingFolder(false); setNewFolderName(''); }
                    }}
                    autoFocus
                  />
                  <button className="btn btn-primary btn-small" onClick={handleAddFolder}>Thêm</button>
                  <button className="btn btn-secondary btn-small" onClick={() => {
                    setIsAddingFolder(false);
                    setNewFolderName('');
                  }}>Hủy</button>
                </div>
              )}

              {getFoldersForCurrentView().length > 0 && (
                <div className="folder-list">
                  {getFoldersForCurrentView().map(folder => (
                    <div key={folder.id} className="folder-item">
                      {editingFolderId === folder.id ? (
                        <div className="folder-edit">
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
                          <button className="btn btn-primary btn-small" onClick={() => handleUpdateFolder(folder.id)}>Lưu</button>
                          <button className="btn btn-secondary btn-small" onClick={() => {
                            setEditingFolderId(null);
                            setEditingFolderName('');
                          }}>Hủy</button>
                        </div>
                      ) : (
                        <>
                          <div
                            className="folder-info"
                            onClick={() => setNavState({
                              type: 'folder',
                              level: navState.level,
                              topic: navState.topic,
                              topicLabel: navState.topicLabel,
                              folderId: folder.id,
                              folderName: folder.name
                            })}
                          >
                            <FolderOpen size={18} className="folder-icon" />
                            <span className="folder-name">{folder.name}</span>
                            <span className="folder-count">{getQuestionCountByFolder(folder.id)} câu</span>
                            <ChevronRight size={16} />
                          </div>
                          {canModifyFolder(folder) && (
                            <div className="folder-actions-inline">
                              <button
                                className="btn-icon"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingFolderId(folder.id);
                                  setEditingFolderName(folder.name);
                                }}
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                className="btn-icon danger"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteFolderTarget(folder);
                                }}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {!topicHasFolders() && getQuestionsForCurrentView().length > 0 && (
                <div className="kaiwa-questions-list">
                  {getQuestionsForCurrentView().map(renderQuestionItem)}
                </div>
              )}
            </div>
          )}

          {/* Folder View - Show questions in folder */}
          {navState.type === 'folder' && (
            <div className="folder-view">
              <div className="folder-actions">
                <button className="btn btn-primary" onClick={() => setIsAddingQuestion(true)}>
                  <Plus size={16} /> Tạo câu hỏi
                </button>
              </div>
              <div className="kaiwa-questions-list">
                {getQuestionsForCurrentView().map(renderQuestionItem)}
              </div>
              {getQuestionsForCurrentView().length === 0 && (
                <div className="empty-state">
                  <MessageSquare size={48} />
                  <p>Chưa có câu hỏi nào trong thư mục này</p>
                </div>
              )}
            </div>
          )}

          {/* Filtered Results */}
          {(searchQuery || filterLevel !== 'all' || filterTopic !== 'all') && navState.type === 'root' && (
            <div className="filtered-results">
              <p className="results-count">Tìm thấy {filteredQuestions.length} câu hỏi</p>
              <div className="kaiwa-questions-list">
                {filteredQuestions.map(renderQuestionItem)}
              </div>
            </div>
          )}

          {/* Question Form Modal */}
          {(isAddingQuestion || editingQuestionId) && renderQuestionForm()}
        </div>
      )}

      {/* Import Tab */}
      {activeSubTab === 'import' && (
        <div className="kaiwa-import-tab">
          <div className="import-header">
            <h3><Upload size={24} /> Import Câu Hỏi</h3>
            <p>Nhập nhiều câu hỏi cùng lúc từ file hoặc paste trực tiếp</p>
          </div>

          <div className="import-options">
            {/* File Upload */}
            <div className="import-option">
              <div className="option-header">
                <FileText size={20} />
                <span>Upload File</span>
              </div>
              <p>Hỗ trợ: .txt (mỗi dòng là một câu hỏi)</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.pdf,.doc,.docx,image/*"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
              <button
                className="btn btn-secondary"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessingImport}
              >
                <Upload size={16} /> Chọn file
              </button>
            </div>

            {/* Text Input */}
            <div className="import-option">
              <div className="option-header">
                <MessageSquare size={20} />
                <span>Nhập trực tiếp</span>
              </div>
              <p>Format: CâuHỏiJP | DịchVN | NgữCảnh | GợiÝ1 | GợiÝ2...</p>
              <textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder={`Ví dụ:\nお名前は何ですか | Tên bạn là gì? | Gặp người mới | 私は山田です | 田中と申します\n何時ですか | Mấy giờ rồi? | Hỏi giờ`}
                rows={6}
              />
              <button
                className="btn btn-primary"
                onClick={() => processImportText(importText)}
                disabled={!importText.trim() || isProcessingImport}
              >
                Xử lý
              </button>
            </div>
          </div>

          {/* Import Preview */}
          {importResults && (
            <div className="import-preview">
              <h4>Kết quả xử lý</h4>

              {importResults.errors.length > 0 && (
                <div className="import-errors">
                  {importResults.errors.map((err, idx) => (
                    <div key={idx} className="error-item">⚠️ {err}</div>
                  ))}
                </div>
              )}

              {importResults.questions.length > 0 && (
                <>
                  <div className="preview-list">
                    {importResults.questions.slice(0, 10).map((q, idx) => (
                      <div key={idx} className="preview-item">
                        <div className="preview-ja">{q.questionJa}</div>
                        {q.questionVi && <div className="preview-vi">{q.questionVi}</div>}
                      </div>
                    ))}
                    {importResults.questions.length > 10 && (
                      <p className="preview-more">...và {importResults.questions.length - 10} câu hỏi khác</p>
                    )}
                  </div>

                  <div className="import-actions">
                    <button
                      className="btn btn-primary"
                      onClick={handleImportConfirm}
                      disabled={isProcessingImport}
                    >
                      Import {importResults.questions.length} câu hỏi
                    </button>
                    <button
                      className="btn btn-secondary"
                      onClick={() => { setImportResults(null); setImportText(''); }}
                    >
                      Hủy
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Settings Tab */}
      {activeSubTab === 'settings' && (
        <div className="kaiwa-settings-tab">
          <div className="settings-header">
            <h3><Settings size={24} /> Cài Đặt Luyện Tập</h3>
            <p>Tùy chỉnh trải nghiệm luyện hội thoại</p>
          </div>

          <div className="settings-grid">
            {/* AI Response Timing */}
            <div className="setting-card">
              <div className="setting-header">
                <Clock size={20} />
                <span>Thời gian AI phản hồi</span>
              </div>
              <p className="setting-desc">Độ trễ trước khi AI trả lời (giây)</p>
              <div className="setting-control">
                <input
                  type="range"
                  min="0"
                  max="5"
                  step="0.5"
                  value={practiceSettings.aiResponseDelay}
                  onChange={(e) => handleSettingChange('aiResponseDelay', Number(e.target.value))}
                />
                <span className="setting-value">{practiceSettings.aiResponseDelay}s</span>
              </div>
            </div>

            {/* User Response Time */}
            <div className="setting-card">
              <div className="setting-header">
                <Clock size={20} />
                <span>Giới hạn thời gian trả lời</span>
              </div>
              <p className="setting-desc">Thời gian tối đa cho người dùng (0 = không giới hạn)</p>
              <div className="setting-control">
                <input
                  type="range"
                  min="0"
                  max="120"
                  step="10"
                  value={practiceSettings.userResponseTime}
                  onChange={(e) => handleSettingChange('userResponseTime', Number(e.target.value))}
                />
                <span className="setting-value">
                  {practiceSettings.userResponseTime === 0 ? '∞' : `${practiceSettings.userResponseTime}s`}
                </span>
              </div>
            </div>

            {/* Toggle Settings */}
            <div className="setting-card">
              <div className="setting-header">
                <Zap size={20} />
                <span>Gợi ý tự động</span>
              </div>
              <p className="setting-desc">Hiển thị câu trả lời gợi ý</p>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={practiceSettings.autoSuggestions}
                  onChange={(e) => handleSettingChange('autoSuggestions', e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="setting-card">
              <div className="setting-header">
                <Mic size={20} />
                <span>Giọng nói</span>
              </div>
              <p className="setting-desc">Bật/tắt tính năng đọc</p>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={practiceSettings.voiceEnabled}
                  onChange={(e) => handleSettingChange('voiceEnabled', e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="setting-card">
              <div className="setting-header">
                <BookOpen size={20} />
                <span>Furigana mặc định</span>
              </div>
              <p className="setting-desc">Hiển thị cách đọc kanji</p>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={practiceSettings.furiganaDefault}
                  onChange={(e) => handleSettingChange('furiganaDefault', e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="setting-card">
              <div className="setting-header">
                <TrendingUp size={20} />
                <span>Chế độ chậm mặc định</span>
              </div>
              <p className="setting-desc">Phát âm chậm hơn bình thường</p>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={practiceSettings.slowModeDefault}
                  onChange={(e) => handleSettingChange('slowModeDefault', e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Challenges Tab */}
      {activeSubTab === 'challenges' && (
        <div className="kaiwa-challenges-tab">
          <div className="challenges-header">
            <h3><Target size={24} /> Quản Lý Thử Thách</h3>
            <button className="btn btn-primary" onClick={() => setIsAddingChallenge(true)}>
              <Plus size={16} /> Tạo thử thách
            </button>
          </div>

          {challenges.length === 0 ? (
            <div className="empty-state">
              <Target size={48} />
              <p>Chưa có thử thách nào</p>
              <p className="sub">Tạo thử thách để tăng động lực học tập</p>
            </div>
          ) : (
            <div className="challenges-list">
              {challenges.map(challenge => (
                <div key={challenge.id} className={`challenge-card ${challenge.isActive ? 'active' : 'inactive'}`}>
                  <div className="challenge-header">
                    <h4>{challenge.name}</h4>
                    <span className={`status ${challenge.isActive ? 'active' : ''}`}>
                      {challenge.isActive ? 'Đang hoạt động' : 'Tạm dừng'}
                    </span>
                  </div>
                  <p className="challenge-desc">{challenge.description}</p>
                  <div className="challenge-meta">
                    <span><Award size={14} /> {challenge.rewardPoints} điểm</span>
                    <span><MessageSquare size={14} /> {challenge.questionCount} câu</span>
                    {challenge.timeLimit > 0 && <span><Clock size={14} /> {challenge.timeLimit} phút</span>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Challenge Form Placeholder */}
          {isAddingChallenge && (
            <div className="challenge-form">
              <h4>Tạo thử thách mới</h4>
              <p className="form-note">Tính năng đang được phát triển...</p>
              <button className="btn btn-secondary" onClick={() => setIsAddingChallenge(false)}>Đóng</button>
            </div>
          )}
        </div>
      )}

      {/* Rewards Tab */}
      {activeSubTab === 'rewards' && (
        <div className="kaiwa-rewards-tab">
          <div className="rewards-header">
            <h3><Trophy size={24} /> Hệ Thống Phần Thưởng</h3>
            <p>Huy hiệu và điểm thưởng cho người học</p>
          </div>

          <div className="badges-grid">
            {KAIWA_BADGES.map(badge => (
              <div key={badge.id} className="badge-card">
                <div className="badge-icon">{badge.icon}</div>
                <div className="badge-info">
                  <h4>{badge.name}</h4>
                  <p>{badge.description}</p>
                  <span className="badge-requirement">{badge.requirement}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="rewards-note">
            <Award size={20} />
            <p>Huy hiệu sẽ tự động được cấp khi người học đạt điều kiện</p>
          </div>
        </div>
      )}

      {/* Confirm Modals */}
      <ConfirmModal
        isOpen={deleteFolderTarget !== null}
        title="Xác nhận xóa thư mục"
        message={`Xóa thư mục "${deleteFolderTarget?.name || ''}"? Tất cả câu hỏi bên trong cũng sẽ bị xóa.`}
        confirmText="Xóa"
        onConfirm={async () => {
          if (deleteFolderTarget && onDeleteFolder) {
            await onDeleteFolder(deleteFolderTarget.id);
            setDeleteFolderTarget(null);
          }
        }}
        onCancel={() => setDeleteFolderTarget(null)}
      />

      <ConfirmModal
        isOpen={deleteQuestionTarget !== null}
        title="Xác nhận xóa câu hỏi"
        message="Bạn có chắc muốn xóa câu hỏi này?"
        confirmText="Xóa"
        onConfirm={async () => {
          if (deleteQuestionTarget && onDeleteQuestion) {
            await onDeleteQuestion(deleteQuestionTarget.id);
            setDeleteQuestionTarget(null);
          }
        }}
        onCancel={() => setDeleteQuestionTarget(null)}
      />
    </div>
  );
}
