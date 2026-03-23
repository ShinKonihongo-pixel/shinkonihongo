// Pronunciation practice — speak Japanese sentences and get scored

import { useState, useCallback } from 'react';
import { Mic, MicOff, Volume2, SkipForward } from 'lucide-react';
import { useSpeechRecognition, scorePronunciation } from '../../hooks/use-speech-recognition';
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
  ],
  N4: [
    { jp: '日本に行ったことがあります', reading: 'nihon ni itta koto ga arimasu', meaning: 'Tôi đã từng đi Nhật' },
    { jp: '映画を見ながら食べました', reading: 'eiga wo minagara tabemashita', meaning: 'Vừa xem phim vừa ăn' },
    { jp: '明日雨が降るかもしれません', reading: 'ashita ame ga furu kamoshiremasen', meaning: 'Ngày mai có thể mưa' },
    { jp: '電車に乗る前に切符を買います', reading: 'densha ni noru mae ni kippu wo kaimasu', meaning: 'Mua vé trước khi lên tàu' },
    { jp: 'もっと練習したほうがいいです', reading: 'motto renshuu shita hou ga ii desu', meaning: 'Nên luyện tập thêm' },
  ],
  N3: [
    { jp: '彼は約束を守らないことが多い', reading: 'kare wa yakusoku wo mamoranai koto ga ooi', meaning: 'Anh ấy thường không giữ lời hứa' },
    { jp: 'この仕事は大変ですが、やりがいがあります', reading: 'kono shigoto wa taihen desu ga, yarigai ga arimasu', meaning: 'Công việc này khó nhưng đáng làm' },
    { jp: '日本語が上手になるように毎日練習しています', reading: 'nihongo ga jouzu ni naru you ni mainichi renshuu shiteimasu', meaning: 'Luyện tập mỗi ngày để giỏi tiếng Nhật' },
  ],
};

export function PronunciationPracticePage() {
  const speech = useSpeechRecognition();
  const [level, setLevel] = useState<string>('N5');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [result, setResult] = useState<{ score: number; feedback: string } | null>(null);

  const sentences = SENTENCES[level] || SENTENCES.N5;
  const current = sentences[currentIndex % sentences.length];

  const handleRecord = useCallback(() => {
    if (speech.isListening) {
      speech.stopListening();
    } else {
      setResult(null);
      speech.reset();
      speech.startListening('ja-JP');
    }
  }, [speech]);

  // Auto-score when transcript arrives
  if (speech.transcript && !result) {
    const scored = scorePronunciation(current.jp, speech.transcript);
    setResult(scored);
  }

  const handleListen = () => {
    const utterance = new SpeechSynthesisUtterance(current.jp);
    utterance.lang = 'ja-JP';
    utterance.rate = 0.8;
    speechSynthesis.speak(utterance);
  };

  const nextSentence = () => {
    setCurrentIndex(i => i + 1);
    setResult(null);
    speech.reset();
  };

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

  return (
    <div className="pp">
      <div className="pp-header">
        <h1 className="pp-title">Luyện Phát Âm</h1>
        <p className="pp-subtitle">Nghe → Nói → Kiểm tra phát âm</p>
      </div>

      {/* Level selector */}
      <div className="pp-levels">
        {Object.keys(SENTENCES).map(l => (
          <button
            key={l}
            className={`pp-level-btn ${level === l ? 'active' : ''}`}
            onClick={() => { setLevel(l); setCurrentIndex(0); setResult(null); speech.reset(); }}
          >
            {l}
          </button>
        ))}
      </div>

      <div className="pp-card">
        {/* Sentence to practice */}
        <div className="pp-sentence">{current.jp}</div>
        <div className="pp-reading">{current.reading}</div>
        <div className="pp-meaning">{current.meaning}</div>

        {/* Listen button */}
        <button className="pp-listen-btn" onClick={handleListen}>
          <Volume2 size={16} /> Nghe mẫu
        </button>

        {/* Record button */}
        <button
          className={`pp-record-btn ${speech.isListening ? 'recording' : ''}`}
          onClick={handleRecord}
        >
          {speech.isListening ? <MicOff size={28} /> : <Mic size={28} />}
        </button>
        <span className="pp-record-label">
          {speech.isListening ? 'Đang nghe... Nhấn để dừng' : 'Nhấn để nói'}
        </span>

        {/* Error */}
        {speech.error && <div style={{ color: '#f87171', fontSize: '0.8rem' }}>{speech.error}</div>}

        {/* Result */}
        {result && (
          <div className="pp-result">
            <div className="pp-result-header">
              <span className={`pp-score ${scoreClass}`}>{result.score}%</span>
              <span className="pp-feedback">{result.feedback}</span>
            </div>
            <div className="pp-spoken-label">Bạn nói:</div>
            <div className="pp-spoken">{speech.transcript}</div>
          </div>
        )}

        {/* Next */}
        <button className="pp-next-btn" onClick={nextSentence}>
          <SkipForward size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
          Câu tiếp theo
        </button>
      </div>
    </div>
  );
}
