// Golden Bell Setup - Game configuration before creating
// Allows host to set questions, time limits, and player count

import { useState } from 'react';
import { ArrowLeft, Bell, Users, Clock, HelpCircle, Layers, Play } from 'lucide-react';
import type { CreateGoldenBellData, QuestionCategory } from '../../types/golden-bell';
import { CATEGORY_INFO } from '../../types/golden-bell';
import type { JLPTLevel } from '../../types/flashcard';

interface GoldenBellSetupProps {
  onCreateGame: (data: CreateGoldenBellData) => void;
  onBack: () => void;
  loading: boolean;
}

const JLPT_LEVELS: JLPTLevel[] = ['N5', 'N4', 'N3', 'N2', 'N1'];
const ALL_CATEGORIES: QuestionCategory[] = ['vocabulary', 'kanji', 'grammar', 'culture'];

export function GoldenBellSetup({
  onCreateGame,
  onBack,
  loading,
}: GoldenBellSetupProps) {
  const [title, setTitle] = useState('Rung Chuông Vàng');
  const [jlptLevel, setJlptLevel] = useState<JLPTLevel>('N5');
  const [questionCount, setQuestionCount] = useState(20);
  const [timePerQuestion, setTimePerQuestion] = useState(15);
  const [maxPlayers, setMaxPlayers] = useState(20);
  const [categories, setCategories] = useState<QuestionCategory[]>(['vocabulary', 'kanji']);
  const [difficultyProgression, setDifficultyProgression] = useState(true);

  const toggleCategory = (cat: QuestionCategory) => {
    if (categories.includes(cat)) {
      if (categories.length > 1) {
        setCategories(categories.filter(c => c !== cat));
      }
    } else {
      setCategories([...categories, cat]);
    }
  };

  const handleCreate = () => {
    onCreateGame({
      title,
      jlptLevel,
      contentSource: 'flashcard',
      questionCount,
      timePerQuestion,
      maxPlayers,
      categories,
      difficultyProgression,
    });
  };

  return (
    <div className="golden-bell-setup">
      {/* Header */}
      <div className="setup-header">
        <button className="back-btn" onClick={onBack}>
          <ArrowLeft size={20} />
        </button>
        <div className="header-icon bell-icon">
          <Bell size={32} />
        </div>
        <h2>Tạo Phòng Mới</h2>
      </div>

      {/* Form */}
      <div className="setup-form">
        {/* Title */}
        <div className="form-group">
          <label>Tên phòng</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Nhập tên phòng..."
            maxLength={50}
          />
        </div>

        {/* JLPT Level */}
        <div className="form-group">
          <label>
            <Layers size={16} />
            Cấp độ JLPT
          </label>
          <div className="level-buttons">
            {JLPT_LEVELS.map(level => (
              <button
                key={level}
                className={`level-btn ${jlptLevel === level ? 'active' : ''}`}
                onClick={() => setJlptLevel(level)}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        {/* Categories */}
        <div className="form-group">
          <label>Loại câu hỏi</label>
          <div className="category-buttons">
            {ALL_CATEGORIES.map(cat => {
              const info = CATEGORY_INFO[cat];
              const isSelected = categories.includes(cat);
              return (
                <button
                  key={cat}
                  className={`category-btn ${isSelected ? 'active' : ''}`}
                  onClick={() => toggleCategory(cat)}
                  style={{ '--cat-color': info.color } as React.CSSProperties}
                >
                  <span className="cat-emoji">{info.emoji}</span>
                  <span>{info.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Question Count */}
        <div className="form-group">
          <label>
            <HelpCircle size={16} />
            Số câu hỏi: {questionCount}
          </label>
          <input
            type="range"
            min={10}
            max={50}
            step={5}
            value={questionCount}
            onChange={(e) => setQuestionCount(Number(e.target.value))}
          />
          <div className="range-labels">
            <span>10</span>
            <span>30</span>
            <span>50</span>
          </div>
        </div>

        {/* Time per Question */}
        <div className="form-group">
          <label>
            <Clock size={16} />
            Thời gian/câu: {timePerQuestion}s
          </label>
          <input
            type="range"
            min={10}
            max={30}
            step={5}
            value={timePerQuestion}
            onChange={(e) => setTimePerQuestion(Number(e.target.value))}
          />
          <div className="range-labels">
            <span>10s</span>
            <span>20s</span>
            <span>30s</span>
          </div>
        </div>

        {/* Max Players */}
        <div className="form-group">
          <label>
            <Users size={16} />
            Số người chơi tối đa: {maxPlayers}
          </label>
          <input
            type="range"
            min={10}
            max={100}
            step={10}
            value={maxPlayers}
            onChange={(e) => setMaxPlayers(Number(e.target.value))}
          />
          <div className="range-labels">
            <span>10</span>
            <span>50</span>
            <span>100</span>
          </div>
        </div>

        {/* Difficulty Progression */}
        <div className="form-group checkbox-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={difficultyProgression}
              onChange={(e) => setDifficultyProgression(e.target.checked)}
            />
            <span className="checkbox-text">
              Tăng độ khó dần (Dễ → Khó)
            </span>
          </label>
        </div>

        {/* Create Button */}
        <button
          className="create-btn"
          onClick={handleCreate}
          disabled={loading || !title.trim()}
        >
          {loading ? (
            <>Đang tạo...</>
          ) : (
            <>
              <Play size={20} />
              Tạo Phòng
            </>
          )}
        </button>
      </div>
    </div>
  );
}
