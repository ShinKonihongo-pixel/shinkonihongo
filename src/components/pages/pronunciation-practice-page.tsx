// Pronunciation practice — dual mode: Free dictation + Practice comparison
// Supports Google Cloud STT (primary) + Web Speech API (fallback)

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  Mic, MicOff, Volume2, SkipForward, RotateCcw, History, Trophy,
  MessageSquare, Target, Loader2,
} from 'lucide-react';
import { useSpeechRecognition, scorePronunciation } from '../../hooks/use-speech-recognition';
import type { RecognitionMode } from '../../hooks/use-speech-recognition';
import './pronunciation-practice-page.css';

// Practice sentences by level
const SENTENCES: Record<string, Array<{ jp: string; reading: string; meaning: string }>> = {
  N5: [
    { jp: 'おはようございます', reading: 'ohayou gozaimasu', meaning: 'Xin chào buổi sáng' },
    { jp: 'ありがとうございます', reading: 'arigatou gozaimasu', meaning: 'Cảm ơn' },
    { jp: 'すみません', reading: 'sumimasen', meaning: 'Xin lỗi' },
    { jp: 'これはいくらですか', reading: 'kore wa ikura desu ka', meaning: 'Cái này giá bao nhiêu?' },
    { jp: 'お名前は何ですか', reading: 'onamae wa nan desu ka', meaning: 'Tên bạn là gì?' },
    { jp: '日本語を勉強しています', reading: 'nihongo wo benkyou shiteimasu', meaning: 'Tôi đang học tiếng Nhật' },
    { jp: 'トイレはどこですか', reading: 'toire wa doko desu ka', meaning: 'Nhà vệ sinh ở đâu?' },
    { jp: '天気がいいですね', reading: 'tenki ga ii desu ne', meaning: 'Thời tiết đẹp nhỉ' },
    { jp: 'はじめまして', reading: 'hajimemashite', meaning: 'Rất vui được gặp bạn' },
    { jp: '私は学生です', reading: 'watashi wa gakusei desu', meaning: 'Tôi là học sinh' },
    { jp: 'お水をください', reading: 'omizu wo kudasai', meaning: 'Cho tôi nước' },
    { jp: '何時ですか', reading: 'nanji desu ka', meaning: 'Mấy giờ rồi?' },
    { jp: 'どこから来ましたか', reading: 'doko kara kimashita ka', meaning: 'Bạn đến từ đâu?' },
    { jp: 'ベトナムから来ました', reading: 'betonamu kara kimashita', meaning: 'Tôi đến từ Việt Nam' },
    { jp: 'よろしくお願いします', reading: 'yoroshiku onegaishimasu', meaning: 'Mong được chỉ giáo' },
  ],
  N4: [
    { jp: '日本に行ったことがあります', reading: 'nihon ni itta koto ga arimasu', meaning: 'Tôi đã từng đi Nhật' },
    { jp: '映画を見ながら食べました', reading: 'eiga wo minagara tabemashita', meaning: 'Vừa xem phim vừa ăn' },
    { jp: '明日雨が降るかもしれません', reading: 'ashita ame ga furu kamoshiremasen', meaning: 'Ngày mai có thể mưa' },
    { jp: '電車に乗る前に切符を買います', reading: 'densha ni noru mae ni kippu wo kaimasu', meaning: 'Mua vé trước khi lên tàu' },
    { jp: 'もっと練習したほうがいいです', reading: 'motto renshuu shita hou ga ii desu', meaning: 'Nên luyện tập thêm' },
    { jp: '窓を開けてもいいですか', reading: 'mado wo aketemo ii desu ka', meaning: 'Mở cửa sổ được không?' },
    { jp: '先生に聞いたほうがいいですよ', reading: 'sensei ni kiita hou ga ii desu yo', meaning: 'Nên hỏi thầy giáo đi' },
    { jp: '日本の料理はおいしいと思います', reading: 'nihon no ryouri wa oishii to omoimasu', meaning: 'Tôi nghĩ đồ ăn Nhật ngon' },
    { jp: '漢字を覚えるのは大変です', reading: 'kanji wo oboeru no wa taihen desu', meaning: 'Nhớ Kanji thật khó' },
    { jp: '友達と一緒に遊びに行きたいです', reading: 'tomodachi to issho ni asobi ni ikitai desu', meaning: 'Muốn đi chơi với bạn' },
  ],
  N3: [
    { jp: '彼は約束を守らないことが多い', reading: 'kare wa yakusoku wo mamoranai koto ga ooi', meaning: 'Anh ấy thường không giữ lời hứa' },
    { jp: 'この仕事は大変ですがやりがいがあります', reading: 'kono shigoto wa taihen desu ga yarigai ga arimasu', meaning: 'Công việc này khó nhưng đáng làm' },
    { jp: '日本語が上手になるように毎日練習しています', reading: 'nihongo ga jouzu ni naru you ni mainichi renshuu shiteimasu', meaning: 'Luyện tập mỗi ngày để giỏi tiếng Nhật' },
    { jp: 'このレストランは予約しないと入れません', reading: 'kono resutoran wa yoyaku shinai to hairemasen', meaning: 'Nhà hàng này không đặt trước thì không vào được' },
    { jp: '最近忙しくて全然寝ていません', reading: 'saikin isogashikute zenzen nete imasen', meaning: 'Gần đây bận quá không ngủ được' },
    { jp: '日本に来てからもう三年になります', reading: 'nihon ni kite kara mou san nen ni narimasu', meaning: 'Đến Nhật đã 3 năm rồi' },
  ],
  N2: [
    { jp: '彼女の話を聞くたびに感動させられる', reading: 'kanojo no hanashi wo kiku tabi ni kandou saserareru', meaning: 'Mỗi lần nghe cô ấy kể đều cảm động' },
    { jp: '環境問題について真剣に考えるべきだ', reading: 'kankyou mondai ni tsuite shinken ni kangaeru beki da', meaning: 'Nên nghiêm túc suy nghĩ về vấn đề môi trường' },
    { jp: 'いくら説明しても理解してもらえなかった', reading: 'ikura setsumei shitemo rikai shite moraenakatta', meaning: 'Dù giải thích thế nào cũng không được hiểu' },
    { jp: '日本の文化に触れることで新しい発見がある', reading: 'nihon no bunka ni fureru koto de atarashii hakken ga aru', meaning: 'Tiếp xúc văn hóa Nhật có nhiều khám phá mới' },
  ],
};

interface ScoreEntry { score: number; sentence: string; timestamp: number; }

// TTS helper
function speakJapanese(text: string, rate: number = 0.8) {
  speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'ja-JP';
  utterance.rate = rate;
  const voices = speechSynthesis.getVoices();
  const jpVoice = voices.find(v => v.lang === 'ja-JP' && v.localService) ||
                  voices.find(v => v.lang === 'ja-JP') ||
                  voices.find(v => v.lang.startsWith('ja'));
  if (jpVoice) utterance.voice = jpVoice;
  speechSynthesis.speak(utterance);
}

export function PronunciationPracticePage() {
  const speech = useSpeechRecognition();
  const [mode, setMode] = useState<RecognitionMode>('practice');
  const [level, setLevel] = useState<string>('N5');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [result, setResult] = useState<{ score: number; feedback: string; bestMatch: string } | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [sessionScores, setSessionScores] = useState<ScoreEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [freeText, setFreeText] = useState(''); // Free mode accumulated text
  const hasScored = useRef(false);

  const sentences = SENTENCES[level] || SENTENCES.N5;
  const current = sentences[currentIndex % sentences.length];

  // Auto-score in practice mode when transcript arrives
  useEffect(() => {
    if (!speech.transcript) return;

    if (mode === 'practice' && !hasScored.current) {
      hasScored.current = true;
      const scored = scorePronunciation(current.jp, speech.transcript, speech.alternatives);
      setResult(scored);
      setAttempts(a => a + 1);
      if (scored.score > bestScore) setBestScore(scored.score);
      setSessionScores(prev => [...prev, { score: scored.score, sentence: current.jp, timestamp: Date.now() }]);
    }

    if (mode === 'free') {
      setFreeText(prev => prev + (prev ? '\n' : '') + speech.transcript);
    }
  }, [speech.transcript, speech.alternatives, current.jp, bestScore, mode]);

  const handleRecord = useCallback(() => {
    if (speech.isListening) {
      speech.stopListening();
    } else {
      setResult(null);
      hasScored.current = false;
      speech.reset();
      speech.startListening('ja-JP');
    }
  }, [speech]);

  const handleRetry = useCallback(() => {
    setResult(null);
    hasScored.current = false;
    speech.reset();
    speech.startListening('ja-JP');
  }, [speech]);

  const nextSentence = useCallback(() => {
    setCurrentIndex(i => i + 1);
    setResult(null);
    setAttempts(0);
    setBestScore(0);
    hasScored.current = false;
    speech.reset();
  }, [speech]);

  const changeMode = useCallback((m: RecognitionMode) => {
    setMode(m);
    setResult(null);
    setFreeText('');
    hasScored.current = false;
    speech.reset();
  }, [speech]);

  const sessionAvg = sessionScores.length > 0
    ? Math.round(sessionScores.reduce((s, e) => s + e.score, 0) / sessionScores.length)
    : 0;

  if (!speech.isSupported) {
    return (
      <div className="pp">
        <div className="pp-unsupported">
          Trình duyệt không hỗ trợ nhận diện giọng nói.<br />
          Vui lòng sử dụng Chrome hoặc Edge.
        </div>
      </div>
    );
  }

  const scoreClass = result ? (result.score >= 80 ? 'excellent' : result.score >= 50 ? 'good' : 'poor') : '';
  const isWorking = speech.isListening || speech.isProcessing;

  return (
    <div className="pp">
      <div className="pp-header">
        <h1 className="pp-title">Luyện Phát Âm</h1>
        <p className="pp-subtitle">
          {speech.activeEngine === 'google' ? 'Google Cloud Speech-to-Text' : 'Web Speech API'}
        </p>
      </div>

      {/* Mode selector */}
      <div className="pp-mode-selector">
        <button
          className={`pp-mode-btn ${mode === 'practice' ? 'active' : ''}`}
          onClick={() => changeMode('practice')}
        >
          <Target size={14} /> Luyện tập
        </button>
        <button
          className={`pp-mode-btn ${mode === 'free' ? 'active' : ''}`}
          onClick={() => changeMode('free')}
        >
          <MessageSquare size={14} /> Tự do
        </button>
      </div>

      {/* ========= PRACTICE MODE ========= */}
      {mode === 'practice' && (
        <>
          {/* Session stats */}
          {sessionScores.length > 0 && (
            <div className="pp-session-stats">
              <span className="pp-stat"><Trophy size={12} /> TB: {sessionAvg}%</span>
              <span className="pp-stat">{sessionScores.length} câu</span>
              <button className="pp-history-btn" onClick={() => setShowHistory(!showHistory)}>
                <History size={12} /> {showHistory ? 'Ẩn' : 'Lịch sử'}
              </button>
            </div>
          )}

          {showHistory && sessionScores.length > 0 && (
            <div className="pp-history">
              {sessionScores.slice(-10).reverse().map((entry, i) => (
                <div key={i} className="pp-history-item">
                  <span className={`pp-history-score ${entry.score >= 80 ? 'excellent' : entry.score >= 50 ? 'good' : 'poor'}`}>
                    {entry.score}%
                  </span>
                  <span className="pp-history-text">{entry.sentence}</span>
                </div>
              ))}
            </div>
          )}

          {/* Level selector */}
          <div className="pp-levels">
            {Object.keys(SENTENCES).map(l => (
              <button
                key={l}
                className={`pp-level-btn ${level === l ? 'active' : ''}`}
                onClick={() => { setLevel(l); setCurrentIndex(0); setResult(null); speech.reset(); hasScored.current = false; }}
              >
                {l} ({SENTENCES[l].length})
              </button>
            ))}
          </div>

          <div className="pp-card">
            <div className="pp-card-progress">{currentIndex % sentences.length + 1} / {sentences.length}</div>
            <div className="pp-sentence">{current.jp}</div>
            <div className="pp-reading">{current.reading}</div>
            <div className="pp-meaning">{current.meaning}</div>

            <div className="pp-listen-row">
              <button className="pp-listen-btn" onClick={() => speakJapanese(current.jp)}>
                <Volume2 size={16} /> Nghe mẫu
              </button>
              <button className="pp-listen-btn pp-listen-slow" onClick={() => speakJapanese(current.jp, 0.5)}>
                🐢 Chậm
              </button>
            </div>

            {/* Interim / processing */}
            {speech.isListening && speech.interimTranscript && (
              <div className="pp-interim">{speech.interimTranscript}</div>
            )}
            {speech.isProcessing && (
              <div className="pp-processing">
                <Loader2 size={16} className="pp-spinner" /> Đang phân tích...
              </div>
            )}
            {speech.isListening && speech.activeEngine === 'google' && (
              <div className="pp-duration">🎙 {speech.recordingDuration}s</div>
            )}

            {/* Record button */}
            <button
              className={`pp-record-btn ${isWorking ? 'recording' : ''}`}
              onClick={handleRecord}
              disabled={speech.isProcessing}
            >
              {speech.isProcessing ? <Loader2 size={28} className="pp-spinner" /> :
               isWorking ? <MicOff size={28} /> : <Mic size={28} />}
            </button>
            <span className="pp-record-label">
              {speech.isProcessing ? 'Đang xử lý...' :
               isWorking ? 'Đang nghe... Nhấn để dừng' : 'Nhấn để nói'}
            </span>

            {speech.error && <div className="pp-error">{speech.error}</div>}

            {result && (
              <div className="pp-result">
                <div className="pp-result-header">
                  <span className={`pp-score ${scoreClass}`}>{result.score}%</span>
                  <span className="pp-feedback">{result.feedback}</span>
                </div>
                {speech.confidence > 0 && (
                  <div className="pp-confidence">Độ tin cậy: {Math.round(speech.confidence * 100)}%</div>
                )}
                <div className="pp-spoken-label">Bạn nói:</div>
                <div className="pp-spoken">{result.bestMatch}</div>
                {attempts > 0 && <div className="pp-attempts">Lần thử: {attempts} | Cao nhất: {bestScore}%</div>}
              </div>
            )}

            <div className="pp-actions">
              {result && (
                <button className="pp-retry-btn" onClick={handleRetry}>
                  <RotateCcw size={14} /> Thử lại
                </button>
              )}
              <button className="pp-next-btn" onClick={nextSentence}>
                <SkipForward size={14} /> Câu tiếp
              </button>
            </div>
          </div>
        </>
      )}

      {/* ========= FREE MODE ========= */}
      {mode === 'free' && (
        <div className="pp-card">
          <div className="pp-free-header">
            <MessageSquare size={20} className="pp-free-icon" />
            <div>
              <div className="pp-free-title">Chế độ Tự do</div>
              <div className="pp-free-desc">Nói bất kỳ điều gì bằng tiếng Nhật — hệ thống sẽ chuyển thành văn bản (Hiragana, Katakana, Kanji)</div>
            </div>
          </div>

          {/* Interim / processing */}
          {speech.isListening && speech.interimTranscript && (
            <div className="pp-interim">{speech.interimTranscript}</div>
          )}
          {speech.isProcessing && (
            <div className="pp-processing">
              <Loader2 size={16} className="pp-spinner" /> Đang phân tích...
            </div>
          )}
          {speech.isListening && speech.activeEngine === 'google' && (
            <div className="pp-duration">🎙 {speech.recordingDuration}s</div>
          )}

          {/* Record button */}
          <button
            className={`pp-record-btn ${isWorking ? 'recording' : ''}`}
            onClick={handleRecord}
            disabled={speech.isProcessing}
          >
            {speech.isProcessing ? <Loader2 size={28} className="pp-spinner" /> :
             isWorking ? <MicOff size={28} /> : <Mic size={28} />}
          </button>
          <span className="pp-record-label">
            {speech.isProcessing ? 'Đang xử lý...' :
             isWorking ? 'Đang nghe... Nhấn để dừng' : 'Nhấn để nói tiếng Nhật'}
          </span>

          {speech.error && <div className="pp-error">{speech.error}</div>}

          {/* Transcription result */}
          {freeText && (
            <div className="pp-free-result">
              <div className="pp-spoken-label">Kết quả nhận diện:</div>
              <div className="pp-free-text">{freeText}</div>
              {speech.confidence > 0 && (
                <div className="pp-confidence">Độ tin cậy: {Math.round(speech.confidence * 100)}%</div>
              )}
              {/* Listen back button */}
              <button className="pp-listen-btn" onClick={() => speakJapanese(freeText.split('\n').pop() || '', 0.8)} style={{ marginTop: '0.5rem' }}>
                <Volume2 size={14} /> Nghe lại
              </button>
            </div>
          )}

          {/* Clear button */}
          {freeText && (
            <button className="pp-clear-btn" onClick={() => { setFreeText(''); speech.reset(); }}>
              Xóa tất cả
            </button>
          )}
        </div>
      )}
    </div>
  );
}
