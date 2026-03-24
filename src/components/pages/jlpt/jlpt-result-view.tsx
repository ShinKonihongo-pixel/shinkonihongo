// JLPT Result View - Detailed assessment, performance breakdown, and review
import { useMemo, useCallback } from 'react';
import { CheckCircle, XCircle, Settings, RotateCcw, TrendingUp, AlertTriangle, Star, Target, BookOpen, Award, Lightbulb } from 'lucide-react';
import type { JLPTQuestion, QuestionCategory } from '../../../types/jlpt-question';
import type { PracticeResult, CategoryPerformance, WeakAreaData } from './jlpt-types';
import { QUESTION_CATEGORIES, getAssessmentLevel } from './jlpt-constants';
import { ANSWER_OPTIONS } from '../../../constants/answer-options';

export interface JLPTResultViewProps {
  // Question data
  practiceQuestions: JLPTQuestion[];
  results: PracticeResult[];

  // Weak areas tracking
  weakAreas: WeakAreaData[];
  trackWeakAreas: boolean;

  // Settings
  showExplanation: boolean;
  showLevelAssessment: boolean;

  // Actions
  onRestartPractice: () => void;
  onResetPractice: () => void;
}

export function JLPTResultView({
  practiceQuestions,
  results,
  weakAreas,
  trackWeakAreas,
  showExplanation,
  showLevelAssessment,
  onRestartPractice,
  onResetPractice,
}: JLPTResultViewProps) {
  const getCategoryLabel = (category: QuestionCategory) =>
    QUESTION_CATEGORIES.find(c => c.value === category)?.label || category;

  const getCategoryIcon = (category: QuestionCategory) =>
    QUESTION_CATEGORIES.find(c => c.value === category)?.icon || '?';

  // Stats calculation (memoized for performance)
  const { correctCount, totalCount, accuracy, avgTimePerQuestion } = useMemo(() => {
    const correct = results.filter(r => r.isCorrect).length;
    const total = results.length;
    const acc = total > 0 ? Math.round((correct / total) * 100) : 0;
    const avgTime = total > 0
      ? Math.round(results.reduce((sum, r) => sum + r.timeSpent, 0) / total / 1000)
      : 0;
    return { correctCount: correct, totalCount: total, accuracy: acc, avgTimePerQuestion: avgTime };
  }, [results]);

  // Calculate category performance
  const categoryPerformance = useMemo((): CategoryPerformance[] => {
    const perfMap: Record<QuestionCategory, { correct: number; total: number; totalTime: number }> = {
      vocabulary: { correct: 0, total: 0, totalTime: 0 },
      grammar: { correct: 0, total: 0, totalTime: 0 },
      reading: { correct: 0, total: 0, totalTime: 0 },
      listening: { correct: 0, total: 0, totalTime: 0 },
    };

    results.forEach(r => {
      perfMap[r.category].total++;
      perfMap[r.category].totalTime += r.timeSpent;
      if (r.isCorrect) perfMap[r.category].correct++;
    });

    return Object.entries(perfMap)
      .filter(([, data]) => data.total > 0)
      .map(([cat, data]) => ({
        category: cat as QuestionCategory,
        correct: data.correct,
        total: data.total,
        percentage: Math.round((data.correct / data.total) * 100),
        avgTime: Math.round(data.totalTime / data.total / 1000),
      }));
  }, [results]);

  // Generate personalized advice
  const generateAdvice = useCallback((): { strengths: string[]; weaknesses: string[]; recommendations: string[] } => {
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const recommendations: string[] = [];

    const overallAccuracy = results.length > 0
      ? Math.round((results.filter(r => r.isCorrect).length / results.length) * 100)
      : 0;

    // Analyze category performance
    categoryPerformance.forEach(perf => {
      const catLabel = getCategoryLabel(perf.category);
      if (perf.percentage >= 80) {
        strengths.push(`${catLabel}: Nắm vững (${perf.percentage}%)`);
      } else if (perf.percentage < 50) {
        weaknesses.push(`${catLabel}: Cần cải thiện (${perf.percentage}%)`);
      }
    });

    // Generate recommendations based on weaknesses
    const weakCats = categoryPerformance.filter(p => p.percentage < 60);
    if (weakCats.length > 0) {
      weakCats.forEach(wc => {
        switch (wc.category) {
          case 'vocabulary':
            recommendations.push('📖 Ôn lại từ vựng qua flashcard mỗi ngày');
            recommendations.push('🎯 Học theo chủ đề để nhớ từ dễ hơn');
            break;
          case 'grammar':
            recommendations.push('📝 Luyện viết câu với mẫu ngữ pháp mới');
            recommendations.push('🔄 Làm bài tập ngữ pháp đa dạng hơn');
            break;
          case 'reading':
            recommendations.push('📰 Đọc văn bản ngắn tiếng Nhật mỗi ngày');
            recommendations.push('⏱️ Luyện đọc nhanh và tìm ý chính');
            break;
          case 'listening':
            recommendations.push('🎧 Nghe podcast/video tiếng Nhật hàng ngày');
            recommendations.push('🗣️ Shadowing - nghe và lặp lại theo');
            break;
        }
      });
    }

    // Overall recommendations
    if (overallAccuracy >= 80) {
      recommendations.push('🌟 Sẵn sàng thử thách cấp độ cao hơn!');
    } else if (overallAccuracy >= 60) {
      recommendations.push('💪 Tiếp tục luyện tập đều đặn, bạn đang tiến bộ!');
    } else {
      recommendations.push('📚 Nên ôn lại kiến thức cơ bản trước khi làm bài thi');
      recommendations.push('⏰ Dành thời gian học mỗi ngày, không nên học dồn');
    }

    // Deduplicate recommendations
    const uniqueRecs = [...new Set(recommendations)];

    return { strengths, weaknesses, recommendations: uniqueRecs.slice(0, 5) };
  }, [results, categoryPerformance]);

  // Historical weak areas summary (from all sessions, not just current)
  const historicalWeakAreas = useMemo(() => {
    if (!trackWeakAreas || weakAreas.length === 0) return [];
    return weakAreas
      .filter(a => a.totalCount >= 3) // Only show areas with enough data
      .map(a => ({
        ...a,
        errorRate: Math.round((a.wrongCount / a.totalCount) * 100),
      }))
      .sort((a, b) => b.errorRate - a.errorRate)
      .slice(0, 5); // Top 5 weak areas
  }, [weakAreas, trackWeakAreas]);

  const assessmentLevel = getAssessmentLevel(accuracy);
  const advice = generateAdvice();

  return (
    <div className="jlpt-page">
      <div className="jlpt-container">
        <div className="jlpt-practice-result">
          {/* Header with badge */}
          <div className="result-header">
            <h2>Kết quả luyện tập</h2>
            <span className="result-badge" style={{ backgroundColor: assessmentLevel.color }}>
              {assessmentLevel.emoji} {assessmentLevel.label}
            </span>
          </div>

          {/* Main Stats */}
          <div className="result-stats">
            <div className="stat-item correct">
              <CheckCircle size={24} />
              <span className="stat-value">{correctCount}</span>
              <span className="stat-label">Đúng</span>
            </div>
            <div className="stat-item wrong">
              <XCircle size={24} />
              <span className="stat-value">{totalCount - correctCount}</span>
              <span className="stat-label">Sai</span>
            </div>
            <div className="stat-item accuracy">
              <Target size={24} />
              <span className="stat-value">{accuracy}%</span>
              <span className="stat-label">Độ chính xác</span>
            </div>
            <div className="stat-item time">
              <TrendingUp size={24} />
              <span className="stat-value">{avgTimePerQuestion}s</span>
              <span className="stat-label">TB/câu</span>
            </div>
          </div>

          {/* Level Assessment Section */}
          {showLevelAssessment && (
            <div className="level-assessment">
              <h3><Award size={20} /> Đánh giá trình độ</h3>

              {/* Category Breakdown */}
              <div className="category-breakdown">
                <h4>Phân tích theo từng phần</h4>
                <div className="breakdown-grid">
                  {categoryPerformance.map(perf => {
                    const catLevel = getAssessmentLevel(perf.percentage);
                    return (
                      <div key={perf.category} className="breakdown-item">
                        <div className="breakdown-header">
                          <span className="breakdown-icon">{getCategoryIcon(perf.category)}</span>
                          <span className="breakdown-name">{getCategoryLabel(perf.category)}</span>
                        </div>
                        <div className="breakdown-bar">
                          <div
                            className="breakdown-fill"
                            style={{
                              width: `${perf.percentage}%`,
                              backgroundColor: catLevel.color,
                            }}
                          />
                        </div>
                        <div className="breakdown-stats">
                          <span>{perf.correct}/{perf.total}</span>
                          <span className="breakdown-percent">{perf.percentage}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Strengths & Weaknesses */}
              <div className="assessment-feedback">
                {advice.strengths.length > 0 && (
                  <div className="feedback-section strengths">
                    <h4><Star size={18} /> Điểm mạnh</h4>
                    <ul>
                      {advice.strengths.map((s, i) => <li key={i}>{s}</li>)}
                    </ul>
                  </div>
                )}

                {advice.weaknesses.length > 0 && (
                  <div className="feedback-section weaknesses">
                    <h4><AlertTriangle size={18} /> Cần cải thiện</h4>
                    <ul>
                      {advice.weaknesses.map((w, i) => <li key={i}>{w}</li>)}
                    </ul>
                  </div>
                )}

                <div className="feedback-section recommendations">
                  <h4><Lightbulb size={18} /> Lời khuyên</h4>
                  <ul>
                    {advice.recommendations.map((r, i) => <li key={i}>{r}</li>)}
                  </ul>
                </div>
              </div>

              {/* Historical Weak Areas */}
              {historicalWeakAreas.length > 0 && (
                <div className="historical-weak-areas">
                  <h4><Target size={18} /> Các điểm yếu cần tập trung (tích lũy)</h4>
                  <div className="weak-areas-list">
                    {historicalWeakAreas.map((area, idx) => (
                      <div key={`${area.level}-${area.category}`} className="weak-area-item">
                        <span className="weak-rank">#{idx + 1}</span>
                        <span className="weak-info">
                          <span className="weak-level">{area.level}</span>
                          <span className="weak-category">{getCategoryLabel(area.category)}</span>
                        </span>
                        <span className="weak-stats">
                          {area.wrongCount}/{area.totalCount} sai ({area.errorRate}%)
                        </span>
                      </div>
                    ))}
                  </div>
                  <p className="weak-hint">Chế độ "Ưu tiên điểm yếu" sẽ tập trung vào các phần này</p>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="result-actions">
            <button className="btn btn-primary" onClick={onRestartPractice}>
              <RotateCcw size={18} />
              Luyện tập lại
            </button>
            <button className="btn btn-secondary" onClick={onResetPractice}>
              <Settings size={18} />
              Thiết lập mới
            </button>
          </div>

          {/* Detailed Review */}
          <div className="result-review">
            <h3><BookOpen size={20} /> Chi tiết kết quả</h3>
            {practiceQuestions.map((question, idx) => {
              const result = results[idx];
              return (
                <div key={question.id} className={`review-item ${result?.isCorrect ? 'correct' : 'wrong'}`}>
                  <div className="review-header">
                    <div className="review-meta">
                      <span className="review-number">Câu {idx + 1}</span>
                      <span className="review-level">{question.level}</span>
                      <span className="review-category">{getCategoryLabel(question.category)}</span>
                    </div>
                    <span className={`review-status ${result?.isCorrect ? 'correct' : 'wrong'}`}>
                      {result?.isCorrect ? '✓ Đúng' : '✗ Sai'}
                    </span>
                  </div>
                  <p className="review-question">{question.question}</p>
                  <div className="review-answers">
                    {question.answers.map((answer, aIdx) => (
                      <div
                        key={aIdx}
                        className={`review-answer ${answer.isCorrect ? 'correct' : ''} ${result?.selectedAnswer === aIdx && !answer.isCorrect ? 'selected-wrong' : ''}`}
                      >
                        <span className="option-label-badge" style={{ background: ANSWER_OPTIONS[aIdx].color }}>{ANSWER_OPTIONS[aIdx].label}</span>
                        <span>{answer.text}</span>
                        {answer.isCorrect && <span className="correct-mark">✓</span>}
                        {result?.selectedAnswer === aIdx && !answer.isCorrect && <span className="wrong-mark">✗</span>}
                      </div>
                    ))}
                  </div>
                  {showExplanation && question.explanation && (
                    <div className="review-explanation">
                      <strong>Giải thích:</strong> {question.explanation}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
