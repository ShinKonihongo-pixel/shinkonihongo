// Japanese verb conjugation data for training

export type ConjugationType =
  | 'te-form'      // て形
  | 'ta-form'      // た形
  | 'nai-form'     // ない形
  | 'masu-form'    // ます形
  | 'potential'    // 可能形
  | 'passive'      // 受身形
  | 'causative'    // 使役形
  | 'volitional'   // 意向形
  | 'imperative'   // 命令形
  | 'conditional'; // 条件形（ば）

export type VerbGroup = 'ichidan' | 'godan' | 'irregular';

export interface VerbEntry {
  dictionary: string;  // 辞書形
  reading: string;     // hiragana reading
  meaning: string;     // Vietnamese meaning
  group: VerbGroup;
  conjugations: Record<ConjugationType, string>;
}

export const CONJUGATION_TYPES: Array<{ type: ConjugationType; nameJp: string; nameVi: string; level: string }> = [
  { type: 'masu-form', nameJp: 'ます形', nameVi: 'Thể lịch sự', level: 'N5' },
  { type: 'te-form', nameJp: 'て形', nameVi: 'Thể て', level: 'N5' },
  { type: 'ta-form', nameJp: 'た形', nameVi: 'Thể quá khứ', level: 'N5' },
  { type: 'nai-form', nameJp: 'ない形', nameVi: 'Thể phủ định', level: 'N5' },
  { type: 'potential', nameJp: '可能形', nameVi: 'Thể khả năng', level: 'N4' },
  { type: 'passive', nameJp: '受身形', nameVi: 'Thể bị động', level: 'N4' },
  { type: 'causative', nameJp: '使役形', nameVi: 'Thể sai khiến', level: 'N3' },
  { type: 'volitional', nameJp: '意向形', nameVi: 'Thể ý chí', level: 'N4' },
  { type: 'imperative', nameJp: '命令形', nameVi: 'Thể mệnh lệnh', level: 'N3' },
  { type: 'conditional', nameJp: '条件形', nameVi: 'Thể điều kiện', level: 'N4' },
];

// Core verb set for training (25 verbs covering all groups)
export const VERB_DATA: VerbEntry[] = [
  // Ichidan (る verbs)
  { dictionary: '食べる', reading: 'たべる', meaning: 'ăn', group: 'ichidan', conjugations: { 'te-form': '食べて', 'ta-form': '食べた', 'nai-form': '食べない', 'masu-form': '食べます', potential: '食べられる', passive: '食べられる', causative: '食べさせる', volitional: '食べよう', imperative: '食べろ', conditional: '食べれば' } },
  { dictionary: '見る', reading: 'みる', meaning: 'xem', group: 'ichidan', conjugations: { 'te-form': '見て', 'ta-form': '見た', 'nai-form': '見ない', 'masu-form': '見ます', potential: '見られる', passive: '見られる', causative: '見させる', volitional: '見よう', imperative: '見ろ', conditional: '見れば' } },
  { dictionary: '起きる', reading: 'おきる', meaning: 'thức dậy', group: 'ichidan', conjugations: { 'te-form': '起きて', 'ta-form': '起きた', 'nai-form': '起きない', 'masu-form': '起きます', potential: '起きられる', passive: '起きられる', causative: '起きさせる', volitional: '起きよう', imperative: '起きろ', conditional: '起きれば' } },
  { dictionary: '寝る', reading: 'ねる', meaning: 'ngủ', group: 'ichidan', conjugations: { 'te-form': '寝て', 'ta-form': '寝た', 'nai-form': '寝ない', 'masu-form': '寝ます', potential: '寝られる', passive: '寝られる', causative: '寝させる', volitional: '寝よう', imperative: '寝ろ', conditional: '寝れば' } },
  { dictionary: '出る', reading: 'でる', meaning: 'ra ngoài', group: 'ichidan', conjugations: { 'te-form': '出て', 'ta-form': '出た', 'nai-form': '出ない', 'masu-form': '出ます', potential: '出られる', passive: '出られる', causative: '出させる', volitional: '出よう', imperative: '出ろ', conditional: '出れば' } },

  // Godan (う verbs)
  { dictionary: '書く', reading: 'かく', meaning: 'viết', group: 'godan', conjugations: { 'te-form': '書いて', 'ta-form': '書いた', 'nai-form': '書かない', 'masu-form': '書きます', potential: '書ける', passive: '書かれる', causative: '書かせる', volitional: '書こう', imperative: '書け', conditional: '書けば' } },
  { dictionary: '読む', reading: 'よむ', meaning: 'đọc', group: 'godan', conjugations: { 'te-form': '読んで', 'ta-form': '読んだ', 'nai-form': '読まない', 'masu-form': '読みます', potential: '読める', passive: '読まれる', causative: '読ませる', volitional: '読もう', imperative: '読め', conditional: '読めば' } },
  { dictionary: '飲む', reading: 'のむ', meaning: 'uống', group: 'godan', conjugations: { 'te-form': '飲んで', 'ta-form': '飲んだ', 'nai-form': '飲まない', 'masu-form': '飲みます', potential: '飲める', passive: '飲まれる', causative: '飲ませる', volitional: '飲もう', imperative: '飲め', conditional: '飲めば' } },
  { dictionary: '行く', reading: 'いく', meaning: 'đi', group: 'godan', conjugations: { 'te-form': '行って', 'ta-form': '行った', 'nai-form': '行かない', 'masu-form': '行きます', potential: '行ける', passive: '行かれる', causative: '行かせる', volitional: '行こう', imperative: '行け', conditional: '行けば' } },
  { dictionary: '話す', reading: 'はなす', meaning: 'nói', group: 'godan', conjugations: { 'te-form': '話して', 'ta-form': '話した', 'nai-form': '話さない', 'masu-form': '話します', potential: '話せる', passive: '話される', causative: '話させる', volitional: '話そう', imperative: '話せ', conditional: '話せば' } },
  { dictionary: '待つ', reading: 'まつ', meaning: 'đợi', group: 'godan', conjugations: { 'te-form': '待って', 'ta-form': '待った', 'nai-form': '待たない', 'masu-form': '待ちます', potential: '待てる', passive: '待たれる', causative: '待たせる', volitional: '待とう', imperative: '待て', conditional: '待てば' } },
  { dictionary: '買う', reading: 'かう', meaning: 'mua', group: 'godan', conjugations: { 'te-form': '買って', 'ta-form': '買った', 'nai-form': '買わない', 'masu-form': '買います', potential: '買える', passive: '買われる', causative: '買わせる', volitional: '買おう', imperative: '買え', conditional: '買えば' } },
  { dictionary: '帰る', reading: 'かえる', meaning: 'về nhà', group: 'godan', conjugations: { 'te-form': '帰って', 'ta-form': '帰った', 'nai-form': '帰らない', 'masu-form': '帰ります', potential: '帰れる', passive: '帰られる', causative: '帰らせる', volitional: '帰ろう', imperative: '帰れ', conditional: '帰れば' } },
  { dictionary: '遊ぶ', reading: 'あそぶ', meaning: 'chơi', group: 'godan', conjugations: { 'te-form': '遊んで', 'ta-form': '遊んだ', 'nai-form': '遊ばない', 'masu-form': '遊びます', potential: '遊べる', passive: '遊ばれる', causative: '遊ばせる', volitional: '遊ぼう', imperative: '遊べ', conditional: '遊べば' } },
  { dictionary: '死ぬ', reading: 'しぬ', meaning: 'chết', group: 'godan', conjugations: { 'te-form': '死んで', 'ta-form': '死んだ', 'nai-form': '死なない', 'masu-form': '死にます', potential: '死ねる', passive: '死なれる', causative: '死なせる', volitional: '死のう', imperative: '死ね', conditional: '死ねば' } },

  // Irregular
  { dictionary: 'する', reading: 'する', meaning: 'làm', group: 'irregular', conjugations: { 'te-form': 'して', 'ta-form': 'した', 'nai-form': 'しない', 'masu-form': 'します', potential: 'できる', passive: 'される', causative: 'させる', volitional: 'しよう', imperative: 'しろ', conditional: 'すれば' } },
  { dictionary: '来る', reading: 'くる', meaning: 'đến', group: 'irregular', conjugations: { 'te-form': '来て', 'ta-form': '来た', 'nai-form': '来ない', 'masu-form': '来ます', potential: '来られる', passive: '来られる', causative: '来させる', volitional: '来よう', imperative: '来い', conditional: '来れば' } },
];
