// Guided learning path — structured curriculum per JLPT level

export interface PathStep {
  id: string;
  type: 'vocabulary' | 'grammar' | 'kanji' | 'reading' | 'listening' | 'exercise' | 'game' | 'jlpt';
  title: string;
  titleJp: string;
  description: string;
  page: string; // navigation target
  estimatedMinutes: number;
}

export interface LevelPath {
  level: string; // N5, N4, etc.
  steps: PathStep[];
}

// N5 Learning Path
const N5_PATH: PathStep[] = [
  { id: 'n5-vocab-1', type: 'vocabulary', title: 'Từ vựng cơ bản 1', titleJp: '基本語彙①', description: 'Học 20 từ vựng đầu tiên', page: 'study', estimatedMinutes: 10 },
  { id: 'n5-grammar-1', type: 'grammar', title: 'Ngữ pháp: です/ます', titleJp: '文法：です・ます', description: 'Học cấu trúc câu cơ bản', page: 'grammar-study', estimatedMinutes: 15 },
  { id: 'n5-kanji-1', type: 'kanji', title: 'Kanji: Số đếm', titleJp: '漢字：数字', description: 'Học 10 chữ Kanji số đếm', page: 'kanji-study', estimatedMinutes: 15 },
  { id: 'n5-listen-1', type: 'listening', title: 'Nghe hiểu: Chào hỏi', titleJp: '聴解：挨拶', description: 'Luyện nghe chào hỏi cơ bản', page: 'listening', estimatedMinutes: 10 },
  { id: 'n5-game-1', type: 'game', title: 'Ôn tập qua game', titleJp: 'ゲーム復習', description: 'Chơi Quiz để ôn từ vựng', page: 'game-hub', estimatedMinutes: 5 },
  { id: 'n5-vocab-2', type: 'vocabulary', title: 'Từ vựng cơ bản 2', titleJp: '基本語彙②', description: 'Học thêm 20 từ vựng', page: 'study', estimatedMinutes: 10 },
  { id: 'n5-grammar-2', type: 'grammar', title: 'Ngữ pháp: Trợ từ は/が/を', titleJp: '文法：助詞', description: 'Học cách dùng trợ từ', page: 'grammar-study', estimatedMinutes: 15 },
  { id: 'n5-reading-1', type: 'reading', title: 'Đọc hiểu: Tự giới thiệu', titleJp: '読解：自己紹介', description: 'Đọc bài tự giới thiệu đơn giản', page: 'reading', estimatedMinutes: 10 },
  { id: 'n5-kanji-2', type: 'kanji', title: 'Kanji: Ngày tháng', titleJp: '漢字：日月', description: 'Học Kanji về ngày, tháng', page: 'kanji-study', estimatedMinutes: 15 },
  { id: 'n5-exercise-1', type: 'exercise', title: 'Bài tập tổng hợp 1', titleJp: '総合練習①', description: 'Kiểm tra kiến thức đã học', page: 'exercises', estimatedMinutes: 10 },
  { id: 'n5-vocab-3', type: 'vocabulary', title: 'Từ vựng: Gia đình', titleJp: '語彙：家族', description: 'Từ vựng về gia đình', page: 'study', estimatedMinutes: 10 },
  { id: 'n5-grammar-3', type: 'grammar', title: 'Ngữ pháp: て form', titleJp: '文法：て形', description: 'Học cách chia て form', page: 'grammar-study', estimatedMinutes: 20 },
  { id: 'n5-listen-2', type: 'listening', title: 'Nghe hiểu: Mua sắm', titleJp: '聴解：買い物', description: 'Luyện nghe hội thoại mua sắm', page: 'listening', estimatedMinutes: 10 },
  { id: 'n5-game-2', type: 'game', title: 'Quiz Battle', titleJp: 'クイズバトル', description: 'Đấu trí với người khác', page: 'game-hub', estimatedMinutes: 10 },
  { id: 'n5-jlpt-1', type: 'jlpt', title: 'Mock test N5 (phần 1)', titleJp: 'N5模試①', description: 'Làm thử đề JLPT N5', page: 'jlpt', estimatedMinutes: 20 },
  { id: 'n5-vocab-4', type: 'vocabulary', title: 'Từ vựng: Đồ ăn', titleJp: '語彙：食べ物', description: 'Từ vựng về đồ ăn uống', page: 'study', estimatedMinutes: 10 },
  { id: 'n5-grammar-4', type: 'grammar', title: 'Ngữ pháp: た form', titleJp: '文法：た形', description: 'Học thì quá khứ', page: 'grammar-study', estimatedMinutes: 15 },
  { id: 'n5-kanji-3', type: 'kanji', title: 'Kanji: Tự nhiên', titleJp: '漢字：自然', description: 'Kanji về tự nhiên (山, 川, 木)', page: 'kanji-study', estimatedMinutes: 15 },
  { id: 'n5-reading-2', type: 'reading', title: 'Đọc hiểu: Email đơn giản', titleJp: '読解：メール', description: 'Đọc email tiếng Nhật đơn giản', page: 'reading', estimatedMinutes: 10 },
  { id: 'n5-exercise-2', type: 'exercise', title: 'Bài tập tổng hợp 2', titleJp: '総合練習②', description: 'Kiểm tra giữa kỳ N5', page: 'exercises', estimatedMinutes: 15 },
];

const N4_PATH: PathStep[] = [
  { id: 'n4-vocab-1', type: 'vocabulary', title: 'Từ vựng N4 cơ bản', titleJp: 'N4基本語彙', description: 'Mở rộng vốn từ N4', page: 'study', estimatedMinutes: 15 },
  { id: 'n4-grammar-1', type: 'grammar', title: 'Ngữ pháp: ～たら/～ば', titleJp: '文法：条件', description: 'Học câu điều kiện', page: 'grammar-study', estimatedMinutes: 20 },
  { id: 'n4-kanji-1', type: 'kanji', title: 'Kanji N4: 200 chữ', titleJp: 'N4漢字', description: 'Bắt đầu kanji N4', page: 'kanji-study', estimatedMinutes: 15 },
  { id: 'n4-listen-1', type: 'listening', title: 'Nghe hiểu N4', titleJp: 'N4聴解', description: 'Hội thoại trung cấp', page: 'listening', estimatedMinutes: 15 },
  { id: 'n4-reading-1', type: 'reading', title: 'Đọc hiểu N4', titleJp: 'N4読解', description: 'Đoạn văn trung cấp', page: 'reading', estimatedMinutes: 15 },
  { id: 'n4-game-1', type: 'game', title: 'Ôn tập N4 qua game', titleJp: 'N4ゲーム', description: 'Game với nội dung N4', page: 'game-hub', estimatedMinutes: 10 },
  { id: 'n4-exercise-1', type: 'exercise', title: 'Bài tập N4', titleJp: 'N4練習', description: 'Bài tập tổng hợp N4', page: 'exercises', estimatedMinutes: 15 },
  { id: 'n4-jlpt-1', type: 'jlpt', title: 'Mock test N4', titleJp: 'N4模試', description: 'Đề thi thử N4', page: 'jlpt', estimatedMinutes: 25 },
];

const N3_PATH: PathStep[] = [
  { id: 'n3-vocab-1', type: 'vocabulary', title: 'Từ vựng N3', titleJp: 'N3語彙', description: 'Từ vựng trung cấp', page: 'study', estimatedMinutes: 15 },
  { id: 'n3-grammar-1', type: 'grammar', title: 'Ngữ pháp N3', titleJp: 'N3文法', description: 'Ngữ pháp trung cấp', page: 'grammar-study', estimatedMinutes: 20 },
  { id: 'n3-kanji-1', type: 'kanji', title: 'Kanji N3', titleJp: 'N3漢字', description: '350+ chữ Kanji', page: 'kanji-study', estimatedMinutes: 20 },
  { id: 'n3-listen-1', type: 'listening', title: 'Nghe N3', titleJp: 'N3聴解', description: 'Nghe hiểu nâng cao', page: 'listening', estimatedMinutes: 15 },
  { id: 'n3-reading-1', type: 'reading', title: 'Đọc N3', titleJp: 'N3読解', description: 'Bài đọc dài hơn', page: 'reading', estimatedMinutes: 20 },
  { id: 'n3-jlpt-1', type: 'jlpt', title: 'Mock test N3', titleJp: 'N3模試', description: 'Đề thi thử N3', page: 'jlpt', estimatedMinutes: 30 },
];

const N2_PATH: PathStep[] = [
  { id: 'n2-vocab-1', type: 'vocabulary', title: 'Từ vựng N2', titleJp: 'N2語彙', description: 'Từ vựng nâng cao', page: 'study', estimatedMinutes: 20 },
  { id: 'n2-grammar-1', type: 'grammar', title: 'Ngữ pháp N2', titleJp: 'N2文法', description: 'Ngữ pháp nâng cao', page: 'grammar-study', estimatedMinutes: 25 },
  { id: 'n2-kanji-1', type: 'kanji', title: 'Kanji N2', titleJp: 'N2漢字', description: '1000+ chữ Kanji', page: 'kanji-study', estimatedMinutes: 25 },
  { id: 'n2-reading-1', type: 'reading', title: 'Đọc N2', titleJp: 'N2読解', description: 'Bài đọc phức tạp', page: 'reading', estimatedMinutes: 25 },
  { id: 'n2-jlpt-1', type: 'jlpt', title: 'Mock test N2', titleJp: 'N2模試', description: 'Đề thi thử N2', page: 'jlpt', estimatedMinutes: 35 },
];

const N1_PATH: PathStep[] = [
  { id: 'n1-vocab-1', type: 'vocabulary', title: 'Từ vựng N1', titleJp: 'N1語彙', description: 'Từ vựng chuyên sâu', page: 'study', estimatedMinutes: 25 },
  { id: 'n1-grammar-1', type: 'grammar', title: 'Ngữ pháp N1', titleJp: 'N1文法', description: 'Ngữ pháp chuyên sâu', page: 'grammar-study', estimatedMinutes: 30 },
  { id: 'n1-kanji-1', type: 'kanji', title: 'Kanji N1', titleJp: 'N1漢字', description: '2000+ chữ Kanji', page: 'kanji-study', estimatedMinutes: 30 },
  { id: 'n1-reading-1', type: 'reading', title: 'Đọc N1', titleJp: 'N1読解', description: 'Bài đọc chuyên ngành', page: 'reading', estimatedMinutes: 30 },
  { id: 'n1-jlpt-1', type: 'jlpt', title: 'Mock test N1', titleJp: 'N1模試', description: 'Đề thi thử N1', page: 'jlpt', estimatedMinutes: 40 },
];

export const LEARNING_PATHS: Record<string, PathStep[]> = {
  N5: N5_PATH,
  N4: N4_PATH,
  N3: N3_PATH,
  N2: N2_PATH,
  N1: N1_PATH,
};

// Step type display info
export const STEP_TYPE_INFO: Record<PathStep['type'], { icon: string; color: string }> = {
  vocabulary: { icon: 'BookOpen', color: '#3b82f6' },
  grammar: { icon: 'FileText', color: '#8b5cf6' },
  kanji: { icon: 'BookOpen', color: '#f59e0b' },
  reading: { icon: 'BookOpenCheck', color: '#22c55e' },
  listening: { icon: 'Headphones', color: '#06b6d4' },
  exercise: { icon: 'ClipboardList', color: '#f59e0b' },
  game: { icon: 'Gamepad2', color: '#ec4899' },
  jlpt: { icon: 'Award', color: '#22c55e' },
};
