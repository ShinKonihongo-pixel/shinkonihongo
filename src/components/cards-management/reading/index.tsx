// Reading Tab - Orchestrator

import { useState } from 'react';
import { BookOpen, Sparkles, ArrowLeft, Plus, FolderOpen } from 'lucide-react';
import { useGroq } from '../../../hooks/use-groq';
import { ConfirmModal } from '../../ui/confirm-modal';
import { ReadingRootView } from './reading-root-view';
import { ReadingLevelView } from './reading-level-view';
import { ReadingFolderView } from './reading-folder-view';
import { ReadingPassageView } from './reading-passage-view';
import { defaultAnswers } from './reading-tab-types';
import type { NavState, ReadingTabProps, PassageFormData } from './reading-tab-types';
import type { ReadingPassage, ReadingVocabulary } from '../../../types/reading';
import './reading.css';

export function ReadingTab({
  passages,
  onAddPassage,
  onUpdatePassage,
  onDeletePassage,
  onAddFolder,
  onUpdateFolder,
  onDeleteFolder,
  getFoldersByLevel,
  getPassagesByFolder,
  currentUser,
  isSuperAdmin,
}: ReadingTabProps) {
  const [navState, setNavState] = useState<NavState>({ type: 'root' });
  const [showForm, setShowForm] = useState(false);
  const [editingPassage, setEditingPassage] = useState<ReadingPassage | null>(null);
  const [addingFolder, setAddingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'passage' | 'folder'; id: string; name: string } | null>(null);

  // Furigana generation
  const { generateFurigana } = useGroq();
  const [generatingFurigana, setGeneratingFurigana] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<PassageFormData>({
    title: '',
    content: '',
    questions: [{ question: '', answers: [...defaultAnswers], explanation: '' }],
    vocabulary: [],
    jlptLevel: 'N5',
    folderId: undefined,
  });

  const canModify = (createdBy?: string) => isSuperAdmin || createdBy === currentUser.id;
  const getPassageCountByLevel = (level: string) => passages.filter(p => p.jlptLevel === level).length;
  const getPassageCountByFolder = (folderId: string) => passages.filter(p => p.folderId === folderId).length;

  const goBack = () => {
    if (navState.type === 'folder') setNavState({ type: 'level', level: navState.level });
    else if (navState.type === 'level') setNavState({ type: 'root' });
    setShowForm(false);
    setAddingFolder(false);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      questions: [{ question: '', answers: [...defaultAnswers], explanation: '' }],
      vocabulary: [],
      jlptLevel: navState.type === 'level' || navState.type === 'folder' ? navState.level : 'N5',
      folderId: navState.type === 'folder' ? navState.folderId : undefined,
    });
    setEditingPassage(null);
  };

  const handleEditPassage = (passage: ReadingPassage) => {
    setEditingPassage(passage);
    setFormData({
      title: passage.title,
      content: passage.content,
      questions: passage.questions.map(q => ({
        question: q.question,
        answers: [...q.answers],
        explanation: q.explanation,
      })),
      vocabulary: passage.vocabulary || [],
      jlptLevel: passage.jlptLevel,
      folderId: passage.folderId,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) {
      alert('Vui lòng nhập tiêu đề và nội dung!');
      return;
    }

    for (let i = 0; i < formData.questions.length; i++) {
      const q = formData.questions[i];
      if (!q.question.trim()) {
        alert(`Câu hỏi ${i + 1} chưa có nội dung!`);
        return;
      }
      const hasCorrect = q.answers.some(a => a.isCorrect && a.text.trim());
      if (!hasCorrect) {
        alert(`Câu hỏi ${i + 1} chưa có đáp án đúng!`);
        return;
      }
    }

    try {
      const validVocabulary = formData.vocabulary.filter(v => v.word.trim() && v.meaning.trim());

      if (editingPassage) {
        await onUpdatePassage(editingPassage.id, {
          title: formData.title,
          content: formData.content,
          questions: formData.questions.map((q, idx) => ({
            id: editingPassage.questions[idx]?.id || `q_${Date.now()}_${idx}`,
            ...q,
          })),
          vocabulary: validVocabulary,
          jlptLevel: formData.jlptLevel,
          folderId: formData.folderId,
        });
      } else {
        await onAddPassage({ ...formData, vocabulary: validVocabulary }, currentUser.id);
      }
      setShowForm(false);
      resetForm();
    } catch (error) {
      alert('Có lỗi xảy ra!');
      console.error(error);
    }
  };

  const handleAddFolder = async () => {
    if (!newFolderName.trim()) return;
    if (navState.type !== 'level') return;

    try {
      await onAddFolder(newFolderName.trim(), navState.level, currentUser.id);
      setNewFolderName('');
      setAddingFolder(false);
    } catch (error) {
      alert('Có lỗi xảy ra!');
      console.error(error);
    }
  };

  const handleUpdateFolder = async (id: string, name: string) => {
    try {
      await onUpdateFolder(id, { name });
    } catch (error) {
      alert('Có lỗi xảy ra!');
      console.error(error);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.type === 'passage') {
        await onDeletePassage(deleteTarget.id);
      } else {
        await onDeleteFolder(deleteTarget.id);
      }
      setDeleteTarget(null);
    } catch (error) {
      alert('Có lỗi xảy ra!');
      console.error(error);
    }
  };

  // Form handlers
  const addQuestion = () => {
    setFormData(prev => ({
      ...prev,
      questions: [...prev.questions, { question: '', answers: [...defaultAnswers], explanation: '' }],
    }));
  };

  const removeQuestion = (idx: number) => {
    if (formData.questions.length <= 1) return;
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== idx),
    }));
  };

  const updateQuestion = (idx: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) => i === idx ? { ...q, [field]: value } : q),
    }));
  };

  const updateAnswer = (qIdx: number, aIdx: number, text: string) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) => i === qIdx ? {
        ...q,
        answers: q.answers.map((a, j) => j === aIdx ? { ...a, text } : a),
      } : q),
    }));
  };

  const setCorrectAnswer = (qIdx: number, aIdx: number) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) => i === qIdx ? {
        ...q,
        answers: q.answers.map((a, j) => ({ ...a, isCorrect: j === aIdx })),
      } : q),
    }));
  };

  const addVocabulary = () => {
    setFormData(prev => ({
      ...prev,
      vocabulary: [...prev.vocabulary, { word: '', reading: '', meaning: '' }],
    }));
  };

  const removeVocabulary = (idx: number) => {
    setFormData(prev => ({
      ...prev,
      vocabulary: prev.vocabulary.filter((_, i) => i !== idx),
    }));
  };

  const updateVocabulary = (idx: number, field: keyof ReadingVocabulary, value: string) => {
    setFormData(prev => ({
      ...prev,
      vocabulary: prev.vocabulary.map((v, i) => i === idx ? { ...v, [field]: value } : v),
    }));
  };

  // Furigana handlers
  const handleGenerateFuriganaContent = async () => {
    if (!formData.content.trim() || generatingFurigana) return;
    setGeneratingFurigana('content');
    try {
      const result = await generateFurigana(formData.content);
      setFormData(prev => ({ ...prev, content: result }));
    } catch (err) {
      console.error('Furigana generation failed:', err);
    } finally {
      setGeneratingFurigana(null);
    }
  };

  const handleGenerateFuriganaQuestion = async (qIdx: number) => {
    const question = formData.questions[qIdx];
    if (!question.question.trim() || generatingFurigana) return;
    setGeneratingFurigana(`q-${qIdx}`);
    try {
      const result = await generateFurigana(question.question);
      updateQuestion(qIdx, 'question', result);
    } catch (err) {
      console.error('Furigana generation failed:', err);
    } finally {
      setGeneratingFurigana(null);
    }
  };

  const handleGenerateFuriganaAnswer = async (qIdx: number, aIdx: number) => {
    const answer = formData.questions[qIdx].answers[aIdx];
    if (!answer.text.trim() || generatingFurigana) return;
    setGeneratingFurigana(`a-${qIdx}-${aIdx}`);
    try {
      const result = await generateFurigana(answer.text);
      updateAnswer(qIdx, aIdx, result);
    } catch (err) {
      console.error('Furigana generation failed:', err);
    } finally {
      setGeneratingFurigana(null);
    }
  };

  const handleGenerateAllFurigana = async () => {
    if (generatingFurigana) return;
    setGeneratingFurigana('all');
    try {
      let newContent = formData.content;
      if (formData.content.trim()) {
        newContent = await generateFurigana(formData.content);
      }

      const newQuestions = await Promise.all(
        formData.questions.map(async (q) => {
          const newQuestion = q.question.trim() ? await generateFurigana(q.question) : q.question;
          const newAnswers = await Promise.all(
            q.answers.map(async (a) => ({
              ...a,
              text: a.text.trim() ? await generateFurigana(a.text) : a.text,
            }))
          );
          return { ...q, question: newQuestion, answers: newAnswers };
        })
      );

      setFormData(prev => ({ ...prev, content: newContent, questions: newQuestions }));
    } catch (err) {
      console.error('Furigana generation failed:', err);
    } finally {
      setGeneratingFurigana(null);
    }
  };

  const currentFolders = navState.type === 'level' ? getFoldersByLevel(navState.level) : [];
  const currentPassages = navState.type === 'folder' ? getPassagesByFolder(navState.folderId) : [];

  return (
    <div className="reading-tab-pro">
      {/* Premium Header */}
      <div className="rt-header">
        <div className="rt-header-content">
          <div className="rt-header-icon">
            <BookOpen size={24} />
            <Sparkles className="rt-sparkle" size={12} />
          </div>
          <div className="rt-header-text">
            <h2>Quản Lý Đọc Hiểu</h2>
            <p>
              {navState.type === 'root' && 'Chọn cấp độ JLPT'}
              {navState.type === 'level' && `Thư mục ${navState.level}`}
              {navState.type === 'folder' && `${navState.level} / ${navState.folderName}`}
            </p>
          </div>
        </div>
        {navState.type !== 'root' && (
          <button className="rt-back-btn" onClick={goBack}>
            <ArrowLeft size={18} />
            <span>Quay lại</span>
          </button>
        )}
      </div>

      {/* Actions */}
      {!showForm && !addingFolder && (
        <div className="rt-actions">
          {navState.type === 'folder' && (
            <button className="rt-btn rt-btn-primary" onClick={() => { resetForm(); setShowForm(true); }}>
              <Plus size={18} />
              <span>Tạo bài đọc</span>
            </button>
          )}
          {navState.type === 'level' && (
            <button className="rt-btn rt-btn-secondary" onClick={() => setAddingFolder(true)}>
              <FolderOpen size={18} />
              <span>Tạo thư mục</span>
            </button>
          )}
        </div>
      )}

      {/* Add folder form */}
      {addingFolder && (
        <div className="rt-add-folder">
          <div className="rt-folder-form">
            <FolderOpen size={20} className="rt-folder-icon" />
            <input
              type="text"
              placeholder="Nhập tên thư mục..."
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddFolder();
                if (e.key === 'Escape') { setAddingFolder(false); setNewFolderName(''); }
              }}
              autoFocus
            />
            <button className="rt-btn rt-btn-primary rt-btn-sm" onClick={handleAddFolder}>Lưu</button>
            <button className="rt-btn rt-btn-ghost rt-btn-sm" onClick={() => { setAddingFolder(false); setNewFolderName(''); }}>Hủy</button>
          </div>
        </div>
      )}

      {/* Passage form */}
      {showForm && (
        <ReadingPassageView
          editingPassage={editingPassage}
          formData={formData}
          generatingFurigana={generatingFurigana}
          onSubmit={handleSubmit}
          onCancel={() => { setShowForm(false); resetForm(); }}
          onUpdateFormData={(data) => setFormData(prev => ({ ...prev, ...data }))}
          onAddQuestion={addQuestion}
          onRemoveQuestion={removeQuestion}
          onUpdateQuestion={updateQuestion}
          onUpdateAnswer={updateAnswer}
          onSetCorrectAnswer={setCorrectAnswer}
          onAddVocabulary={addVocabulary}
          onRemoveVocabulary={removeVocabulary}
          onUpdateVocabulary={updateVocabulary}
          onGenerateFuriganaContent={handleGenerateFuriganaContent}
          onGenerateFuriganaQuestion={handleGenerateFuriganaQuestion}
          onGenerateFuriganaAnswer={handleGenerateFuriganaAnswer}
          onGenerateAllFurigana={handleGenerateAllFurigana}
        />
      )}

      {/* Content */}
      {!showForm && !addingFolder && (
        <>
          {navState.type === 'root' && (
            <ReadingRootView
              onSelectLevel={(level) => setNavState({ type: 'level', level })}
              getPassageCountByLevel={getPassageCountByLevel}
            />
          )}

          {navState.type === 'level' && (
            <ReadingLevelView
              level={navState.level}
              folders={currentFolders}
              onSelectFolder={(folderId, folderName) => setNavState({ type: 'folder', level: navState.level, folderId, folderName })}
              onAddFolder={() => setAddingFolder(true)}
              onEditFolder={handleUpdateFolder}
              onDeleteFolder={(id, name) => setDeleteTarget({ type: 'folder', id, name })}
              canModify={canModify}
              getPassageCountByFolder={getPassageCountByFolder}
            />
          )}

          {navState.type === 'folder' && (
            <ReadingFolderView
              level={navState.level}
              folderName={navState.folderName}
              passages={currentPassages}
              onAddPassage={() => { resetForm(); setShowForm(true); }}
              onEditPassage={handleEditPassage}
              onDeletePassage={(id, name) => setDeleteTarget({ type: 'passage', id, name })}
              canModify={canModify}
            />
          )}
        </>
      )}

      {/* Confirm delete modal */}
      <ConfirmModal
        isOpen={deleteTarget !== null}
        title={`Xác nhận xóa ${deleteTarget?.type === 'folder' ? 'thư mục' : 'bài đọc'}`}
        message={`Bạn có chắc muốn xóa "${deleteTarget?.name}"?${deleteTarget?.type === 'folder' ? ' Tất cả bài đọc trong thư mục cũng sẽ bị xóa.' : ''}`}
        confirmText="Xóa"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
