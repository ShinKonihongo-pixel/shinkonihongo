// AI service for generating per-character Kanji analysis using Groq
// Radicals: static decomposition data takes priority, AI-generated as fallback

import type { KanjiCharacterAnalysis } from '../types/flashcard';
import { getSeedRadicals } from '../utils/radical-kanji-index';
import { RADICAL_MAP } from '../data/radicals';

const GROQ_API_URL = import.meta.env.VITE_GROQ_PROXY_URL || 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.3-70b-versatile';

// Common sub-components that appear in kanji decomposition
// Not official Kangxi radicals but frequently used as building blocks
const VALID_COMPONENTS = new Set([
  // Common sub-components (not Kangxi radicals but frequent building blocks)
  '也', '乍', '寺', '青', '其', '占', '令', '包', '交', '兆', '各', '合',
  '旦', '央', '奇', '免', '吏', '巷', '采', '与', '付', '申', '甫', '苗',
  '利', '告', '者', '直', '重', '軍', '朋', '侖', '冓', '延', '叟', '甬',
  '壮', '完', '介', '化', '可', '古', '台', '由', '甲', '世', '去', '正',
  '半', '主', '未', '末', '本', '失', '充', '冬', '平', '氷', '永', '求',
  '兄', '光', '先', '全', '共', '再', '冊', '列', '印', '向', '回', '因',
  '団', '困', '圧', '在', '地', '均', '坊', '坂', '孝', '存', '安', '守',
  '寸', '尺', '局', '屋', '居', '届', '岩', '帰', '庁', '弁', '式', '当',
  '形', '役', '志', '忘', '応', '快', '念', '怒', '思', '急', '性', '怪',
  '拝', '拾', '持', '指', '挙', '捨', '授', '採', '探', '接', '換', '放',
  '政', '改', '教', '散', '数', '断', '方', '族', '旅', '既', '映', '昇',
  '昔', '昼', '時', '晩', '暑', '暗', '暮', '曜', '替', '朝', '札', '条',
  '来', '染', '柱', '査', '栄', '格', '極', '様', '横', '機', '次', '欲',
  '止', '武', '殿', '毎', '比', '氷', '決', '沈', '油', '治', '法', '波',
  '注', '泳', '活', '流', '浅', '浮', '深', '減', '済', '渡', '準', '演',
  '潔', '濃', '然', '照', '熱', '版', '犯', '現', '理', '環', '産', '略',
  '番', '発', '登', '皇', '盗', '盛', '監', '相', '省', '看', '真', '眠',
  '確', '祝', '禁', '福', '秀', '私', '秋', '科', '章', '競', '等', '答',
  '筆', '算', '管', '築', '精', '約', '級', '経', '結', '統', '続', '総',
  '編', '練', '義', '習', '翌', '聖', '職', '肩', '胸', '脂', '能', '航',
  // Additional compound components used in decomposition
  '昜', '甬', '胡', '旨', '束', '关', '昔', '更', '云', '巠', '哥', '夬',
  '吏', '売', '単', '巽', '呈', '亟', '兌', '炎', '朿', '喬', '袁', '啇',
  '咸', '堇', '弗', '壬', '帀', '斉', '曽', '或', '术', '義', '忍', '侖',
  '是', '彦', '丙', '开', '乂', '周', '象', '度', '意', '道', '首',
]);

/** Validate AI-generated radicals — allow Kangxi radicals, variants, and common components */
function validateRadicals(radicals: string[], character: string): string[] {
  const seen = new Set<string>();
  return radicals.filter(r => {
    if (!r || r.length !== 1) return false;
    // Deduplicate
    if (seen.has(r)) return false;
    seen.add(r);
    // Don't include the character itself as its own radical (unless it's truly a radical)
    if (r === character && !RADICAL_MAP[r]) return false;
    // Known radical or variant
    if (RADICAL_MAP[r]) return true;
    // Known sub-component
    if (VALID_COMPONENTS.has(r)) return true;
    // Allow any CJK character as a component (AI may produce rare but valid ones)
    const cp = r.codePointAt(0) || 0;
    if (cp >= 0x4E00 && cp <= 0x9FFF) return true; // CJK Unified
    if (cp >= 0x2F00 && cp <= 0x2FDF) return true; // Kangxi Radicals block
    if (cp >= 0x2E80 && cp <= 0x2EFF) return true; // CJK Radicals Supplement
    // Reject truly unknown characters
    console.warn(`Filtered invalid radical "${r}" for ${character}`);
    return false;
  });
}

function getApiKey(): string | null {
  if (import.meta.env.VITE_GROQ_PROXY_URL) return 'proxy';
  return import.meta.env.VITE_GROQ_API_KEY || null;
}

// Extract individual Kanji characters from text
export function extractKanjiCharacters(text: string): string[] {
  const matches = text.match(/[一-龯々]/g);
  return matches ? [...new Set(matches)] : [];
}

// Generate analysis for multiple Kanji characters in a single AI call
export async function generateKanjiCharacterAnalysis(
  characters: string[]
): Promise<KanjiCharacterAnalysis[]> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('Chưa cấu hình VITE_GROQ_API_KEY');
  }

  if (characters.length === 0) return [];

  // Batch large requests to avoid quality degradation
  if (characters.length > 8) {
    const mid = Math.ceil(characters.length / 2);
    const [batch1, batch2] = await Promise.all([
      generateKanjiCharacterAnalysis(characters.slice(0, mid)),
      generateKanjiCharacterAnalysis(characters.slice(mid)),
    ]);
    return [...batch1, ...batch2];
  }

  const charList = characters.join(', ');

  const systemPrompt = `Bạn là chuyên gia phân tích cấu tạo chữ Kanji. Nhiệm vụ: phân tích ĐẦY ĐỦ TẤT CẢ thành phần cấu tạo nên mỗi chữ Kanji.

QUAN TRỌNG NHẤT — PHẢI LIỆT KÊ ĐẦY ĐỦ, KHÔNG ĐƯỢC BỎ SÓT:
❌ 作→["亻"] ← SAI (thiếu phần phải)
✅ 作→["亻","乍"] ← ĐÚNG (trái + phải)
❌ 地→["土"] ← SAI (thiếu 也)
✅ 地→["土","也"] ← ĐÚNG
❌ 試→["言"] ← SAI (thiếu 式)
✅ 試→["言","式"] ← ĐÚNG
❌ 送→["辶"] ← SAI (thiếu phần trong)
✅ 送→["辶","关"] ← ĐÚNG

MỨC ĐỘ PHÂN TÍCH — cấp trung gian, KHÔNG quá chi tiết:
✅ 持→["扌","寺"] ← tốt (nhận ra 寺 là 1 khối)
❌ 持→["扌","土","寸"] ← quá chi tiết (tách 寺 thành 土+寸 không cần thiết)
✅ 運→["辶","軍"] ← tốt (軍 là 1 khối)
❌ 運→["辶","冖","車"] ← quá chi tiết
✅ 想→["相","心"] ← tốt (相 là 1 khối bên trên)
✅ 読→["言","売"] ← tốt (売 là 1 khối)
❌ 読→["言","士","冖","儿"] ← quá chi tiết (tách 売 ra không cần)

BIẾN THỂ VỊ TRÍ — BẮT BUỘC dùng đúng dạng:
Bên trái: 亻(人) 氵(水) 扌(手) 忄(心) 犭(犬) 礻(示) 衤(衣) 飠(食)
Bên phải: 刂(刀) 阝(邑)
Bên cạnh: 阝(阜khi ở trái)
Phía trên: 艹(艸)
Phía dưới: 灬(火) 辶(辵)

QUY TẮC:
1. Mỗi chữ tách thành 2-4 thành phần CHÍNH — KHÔNG tách quá nhỏ
2. Nếu chữ CHÍNH NÓ là bộ thủ (人, 口, 木, 心...) → radicals = [chính nó]
3. PHẢI dùng biến thể khi ở vị trí đặc biệt (亻 không phải 人 khi bên trái)
4. Phân biệt: 日≠目≠月, 土≠士, 人≠入≠八, 未≠末

PHÂN BIỆT CẤU TRÚC:
- Trái-phải: 休["亻","木"] 持["扌","寺"] 情["忄","青"]
- Trên-dưới: 思["田","心"] 安["宀","女"] 花["艹","化"]
- Trong-ngoài: 国["囗","玉"] 回["囗","口"] 園["囗","袁"]
- Bao quanh: 道["辶","首"] 近["辶","斤"] 返["辶","反"]

JSON array thuần (không markdown):
[{"character":"字","onYomi":["カタカナ"],"kunYomi":["ひらがな"],"sinoVietnamese":"HÁN VIỆT","radicals":["bộ1","bộ2"],"mnemonic":"mẹo nhớ","sampleWords":[{"word":"từ","reading":"đọc","meaning":"nghĩa"}]}]`;

  const prompt = `Phân tích thành phần cấu tạo cho: ${charList}

VÍ DỤ CHUẨN (mỗi chữ 2-4 thành phần chính):
Trái-phải: 作["亻","乍"] 地["土","也"] 持["扌","寺"] 情["忄","青"] 神["礻","申"]
  海["氵","毎"] 猫["犭","苗"] 話["言","舌"] 読["言","売"] 銀["金","艮"]
  他["亻","也"] 便["亻","更"] 試["言","式"] 軽["車","巠"] 別["口","刂"]
Trên-dưới: 思["田","心"] 安["宀","女"] 花["艹","化"] 食["食"] 想["相","心"]
  意["音","心"] 着["羊","目"] 登["癶","豆"] 家["宀","豕"] 答["竹","合"]
Bao quanh: 道["辶","首"] 送["辶","关"] 速["辶","束"] 運["辶","軍"] 返["辶","反"]
  国["囗","玉"] 開["門","廾"] 聞["門","耳"] 園["囗","袁"]
Bộ thủ đơn: 人["人"] 口["口"] 木["木"] 心["心"] 食["食"] 言["言"]

NHẮC LẠI:
- Mỗi chữ PHẢI có đủ 2-4 thành phần (trừ bộ thủ đơn)
- PHẢI dùng biến thể: 亻氵扌忄犭礻衤飠刂灬阝艹辶
- onYomi: katakana | kunYomi: hiragana (dấu chấm phân okurigana)
- sinoVietnamese: IN HOA
- mnemonic: tiếng Việt, ngắn gọn
- sampleWords: 3 từ phổ biến nhất

JSON array:`;

  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey !== 'proxy' && { 'Authorization': `Bearer ${apiKey}` }),
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt },
        ],
        temperature: 0.05,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content;

    if (!text) {
      throw new Error('Không nhận được phản hồi');
    }

    // Strip markdown code fences and extract JSON array
    const cleaned = text
      .replace(/```(?:json|JSON)?\s*/g, '')  // opening fence
      .replace(/```/g, '')                    // closing fence
      .trim();

    // Try to find the outermost JSON array
    const startIdx = cleaned.indexOf('[');
    const endIdx = cleaned.lastIndexOf(']');
    if (startIdx === -1 || endIdx === -1 || endIdx <= startIdx) {
      console.error('AI response (no JSON array found):', cleaned.substring(0, 200));
      throw new Error('Không tìm thấy JSON array trong phản hồi');
    }

    const jsonStr = cleaned.substring(startIdx, endIdx + 1);

    let parsed: Array<{
      character: string;
      onYomi: string[];
      kunYomi: string[];
      sinoVietnamese: string;
      radicals?: string[];
      mnemonic: string;
      sampleWords: Array<{ word: string; reading: string; meaning: string }>;
    }>;

    try {
      parsed = JSON.parse(jsonStr);
    } catch (parseErr) {
      console.error('JSON parse failed. Raw text (first 300 chars):', jsonStr.substring(0, 300));
      // Attempt fix: remove trailing commas before ] or }
      const fixed = jsonStr
        .replace(/,\s*([}\]])/g, '$1')    // trailing commas
        .replace(/'/g, '"');               // single quotes → double quotes
      parsed = JSON.parse(fixed);
    }

    const now = new Date().toISOString();
    return parsed.map((item) => {
      // Choose best radical decomposition: static map vs AI-generated
      // Strategy: prefer whichever provides MORE components (= more thorough)
      // Exception: kanji that IS a radical → always [itself]
      const staticRadicals = getSeedRadicals(item.character);
      const rawAiRadicals = (item.radicals || []).filter(r => typeof r === 'string' && r.trim());
      const aiRadicals = validateRadicals(rawAiRadicals, item.character);

      const isKanjiARadical = !!RADICAL_MAP[item.character];

      const bestRadicals = (() => {
        // No static data → use AI
        if (!staticRadicals || staticRadicals.length === 0) return aiRadicals;
        // Kanji IS a radical itself (人, 口, 木...) → [itself]
        if (isKanjiARadical && staticRadicals.length === 1) return staticRadicals;
        // AI produced nothing valid → use static
        if (aiRadicals.length === 0) return staticRadicals;
        // Static is equally or more thorough → trust static (manually curated)
        if (staticRadicals.length >= aiRadicals.length) return staticRadicals;
        // AI has MORE components → AI is more thorough, use it
        return aiRadicals;
      })();

      return {
        id: item.character,
        character: item.character,
        onYomi: item.onYomi || [],
        kunYomi: item.kunYomi || [],
        sinoVietnamese: (item.sinoVietnamese || '').toUpperCase(),
        mnemonic: item.mnemonic || '',
        radicals: bestRadicals.length > 0 ? bestRadicals : [],
        sampleWords: (item.sampleWords || []).map((sw) => ({
          word: sw.word || '',
          reading: sw.reading || '',
          meaning: sw.meaning || '',
        })),
        createdAt: now,
      };
    });
  } catch (error) {
    console.error('generateKanjiCharacterAnalysis error:', error);
    throw error;
  }
}
