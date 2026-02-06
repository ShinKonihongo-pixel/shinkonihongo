// JLPT N5 Kanji seed data (~80 kanji)
// Format: compact objects for efficient storage

export interface KanjiSeed {
  c: string;     // character
  on: string;    // on'yomi (comma-separated katakana)
  kun: string;   // kun'yomi (comma-separated hiragana)
  hv: string;    // Hán Việt (Sino-Vietnamese reading, UPPERCASE)
  m: string;     // Vietnamese meaning
  s: number;     // stroke count
  r: string;     // radical characters (comma-separated)
}

export const N5_KANJI: KanjiSeed[] = [
  // Numbers
  { c: '一', on: 'イチ,イツ', kun: 'ひと,ひと.つ', hv: 'NHẤT', m: 'Một', s: 1, r: '一' },
  { c: '二', on: 'ニ,ジ', kun: 'ふた,ふた.つ', hv: 'NHỊ', m: 'Hai', s: 2, r: '二' },
  { c: '三', on: 'サン', kun: 'み,み.つ', hv: 'TAM', m: 'Ba', s: 3, r: '一' },
  { c: '四', on: 'シ', kun: 'よ,よ.つ,よっ.つ,よん', hv: 'TỨ', m: 'Bốn', s: 5, r: '囗' },
  { c: '五', on: 'ゴ', kun: 'いつ,いつ.つ', hv: 'NGŨ', m: 'Năm', s: 4, r: '二' },
  { c: '六', on: 'ロク', kun: 'む,む.つ,むっ.つ', hv: 'LỤC', m: 'Sáu', s: 4, r: '八' },
  { c: '七', on: 'シチ', kun: 'なな,なな.つ,なの', hv: 'THẤT', m: 'Bảy', s: 2, r: '一' },
  { c: '八', on: 'ハチ', kun: 'や,や.つ,やっ.つ,よう', hv: 'BÁT', m: 'Tám', s: 2, r: '八' },
  { c: '九', on: 'キュウ,ク', kun: 'ここの,ここの.つ', hv: 'CỬU', m: 'Chín', s: 2, r: '乙' },
  { c: '十', on: 'ジュウ,ジッ', kun: 'とお,と', hv: 'THẬP', m: 'Mười', s: 2, r: '十' },
  { c: '百', on: 'ヒャク', kun: 'もも', hv: 'BÁCH', m: 'Trăm', s: 6, r: '白' },
  { c: '千', on: 'セン', kun: 'ち', hv: 'THIÊN', m: 'Nghìn', s: 3, r: '十' },
  { c: '万', on: 'マン,バン', kun: 'よろず', hv: 'VẠN', m: 'Vạn, mười nghìn', s: 3, r: '一' },

  // Currency and time
  { c: '円', on: 'エン', kun: 'まる,まる.い', hv: 'VIÊN', m: 'Yên (tiền)', s: 4, r: '冂' },
  { c: '年', on: 'ネン', kun: 'とし', hv: 'NIÊN', m: 'Năm', s: 6, r: '干' },
  { c: '月', on: 'ゲツ,ガツ', kun: 'つき', hv: 'NGUYỆT', m: 'Tháng, mặt trăng', s: 4, r: '月' },
  { c: '日', on: 'ニチ,ジツ', kun: 'ひ,か', hv: 'NHẬT', m: 'Ngày, mặt trời', s: 4, r: '日' },
  { c: '時', on: 'ジ', kun: 'とき', hv: 'THÌ', m: 'Thời gian, giờ', s: 10, r: '日' },
  { c: '分', on: 'ブン,フン,ブ', kun: 'わ.ける,わ.かれる,わ.かる', hv: 'PHÂN', m: 'Phút, phần', s: 4, r: '刀' },
  { c: '半', on: 'ハン', kun: 'なか.ば', hv: 'BÁN', m: 'Nửa', s: 5, r: '十' },

  // Time expressions
  { c: '今', on: 'コン,キン', kun: 'いま', hv: 'KIM', m: 'Bây giờ', s: 4, r: '人' },
  { c: '先', on: 'セン', kun: 'さき,ま.ず', hv: 'TIÊN', m: 'Trước', s: 6, r: '儿' },
  { c: '来', on: 'ライ', kun: 'く.る,きた.る,きた.す', hv: 'LAI', m: 'Đến', s: 7, r: '木' },
  { c: '毎', on: 'マイ', kun: 'ごと', hv: 'MỖI', m: 'Mỗi', s: 6, r: '母' },
  { c: '何', on: 'カ', kun: 'なに,なん,なに', hv: 'HÀ', m: 'Gì, cái gì', s: 7, r: '人' },

  // People
  { c: '人', on: 'ジン,ニン', kun: 'ひと', hv: 'NHÂN', m: 'Người', s: 2, r: '人' },
  { c: '男', on: 'ダン,ナン', kun: 'おとこ', hv: 'NAM', m: 'Nam, đàn ông', s: 7, r: '田' },
  { c: '女', on: 'ジョ,ニョ', kun: 'おんな,め', hv: 'NỮ', m: 'Nữ, phụ nữ', s: 3, r: '女' },
  { c: '子', on: 'シ,ス', kun: 'こ', hv: 'TỬ', m: 'Con, trẻ em', s: 3, r: '子' },
  { c: '母', on: 'ボ', kun: 'はは', hv: 'MẪU', m: 'Mẹ', s: 5, r: '母' },
  { c: '父', on: 'フ', kun: 'ちち', hv: 'PHỤ', m: 'Cha', s: 4, r: '父' },
  { c: '友', on: 'ユウ', kun: 'とも', hv: 'HỮU', m: 'Bạn', s: 4, r: '又' },
  { c: '私', on: 'シ', kun: 'わたくし,わたし', hv: 'TƯ', m: 'Tôi', s: 7, r: '禾' },

  // Size and quantity
  { c: '大', on: 'ダイ,タイ', kun: 'おお,おお.きい', hv: 'ĐẠI', m: 'Lớn', s: 3, r: '大' },
  { c: '小', on: 'ショウ', kun: 'ちい.さい,こ,お', hv: 'TIỂU', m: 'Nhỏ', s: 3, r: '小' },
  { c: '高', on: 'コウ', kun: 'たか.い,たか.まる', hv: 'CAO', m: 'Cao', s: 10, r: '高' },
  { c: '安', on: 'アン', kun: 'やす.い', hv: 'AN', m: 'Rẻ, an toàn', s: 6, r: '宀' },
  { c: '新', on: 'シン', kun: 'あたら.しい,あら.た', hv: 'TÂN', m: 'Mới', s: 13, r: '斤' },
  { c: '古', on: 'コ', kun: 'ふる.い', hv: 'CỔ', m: 'Cũ', s: 5, r: '口' },
  { c: '長', on: 'チョウ', kun: 'なが.い', hv: 'TRƯỜNG', m: 'Dài', s: 8, r: '長' },
  { c: '多', on: 'タ', kun: 'おお.い', hv: 'ĐA', m: 'Nhiều', s: 6, r: '夕' },
  { c: '少', on: 'ショウ', kun: 'すく.ない,すこ.し', hv: 'THIỂU', m: 'Ít', s: 4, r: '小' },

  // Directions and positions
  { c: '上', on: 'ジョウ,ショウ', kun: 'うえ,あ.げる,のぼ.る', hv: 'THƯỢNG', m: 'Trên', s: 3, r: '一' },
  { c: '下', on: 'カ,ゲ', kun: 'した,さ.げる,くだ.る', hv: 'HẠ', m: 'Dưới', s: 3, r: '一' },
  { c: '中', on: 'チュウ,ジュウ', kun: 'なか', hv: 'TRUNG', m: 'Trong, giữa', s: 4, r: '丨' },
  { c: '外', on: 'ガイ,ゲ', kun: 'そと,ほか,はず.す', hv: 'NGOẠI', m: 'Ngoài', s: 5, r: '夕' },
  { c: '前', on: 'ゼン', kun: 'まえ', hv: 'TIỀN', m: 'Trước', s: 9, r: '刀' },
  { c: '後', on: 'ゴ,コウ', kun: 'うし.ろ,あと,のち', hv: 'HẬU', m: 'Sau', s: 9, r: '彳' },
  { c: '右', on: 'ウ,ユウ', kun: 'みぎ', hv: 'HỮU', m: 'Phải', s: 5, r: '口' },
  { c: '左', on: 'サ', kun: 'ひだり', hv: 'TẢ', m: 'Trái', s: 5, r: '工' },
  { c: '北', on: 'ホク', kun: 'きた', hv: 'BẮC', m: 'Bắc', s: 5, r: '匕' },
  { c: '南', on: 'ナン,ナ', kun: 'みなみ', hv: 'NAM', m: 'Nam', s: 9, r: '十' },
  { c: '東', on: 'トウ', kun: 'ひがし', hv: 'ĐÔNG', m: 'Đông', s: 8, r: '木' },
  { c: '西', on: 'セイ,サイ', kun: 'にし', hv: 'TÂY', m: 'Tây', s: 6, r: '襾' },

  // Body parts
  { c: '口', on: 'コウ,ク', kun: 'くち', hv: 'KHẨU', m: 'Miệng', s: 3, r: '口' },
  { c: '目', on: 'モク,ボク', kun: 'め', hv: 'MỤC', m: 'Mắt', s: 5, r: '目' },
  { c: '耳', on: 'ジ', kun: 'みみ', hv: 'NHĨ', m: 'Tai', s: 6, r: '耳' },
  { c: '手', on: 'シュ', kun: 'て', hv: 'THỦ', m: 'Tay', s: 4, r: '手' },
  { c: '足', on: 'ソク', kun: 'あし,た.りる', hv: 'TÚC', m: 'Chân', s: 7, r: '足' },
  { c: '体', on: 'タイ,テイ', kun: 'からだ', hv: 'THỂ', m: 'Thể, cơ thể', s: 7, r: '人' },
  { c: '力', on: 'リョク,リキ', kun: 'ちから', hv: 'LỰC', m: 'Sức, lực', s: 2, r: '力' },
  { c: '気', on: 'キ,ケ', kun: '', hv: 'KHÍ', m: 'Khí, tinh thần', s: 6, r: '气' },

  // Nature
  { c: '天', on: 'テン', kun: 'あめ,あま', hv: 'THIÊN', m: 'Trời', s: 4, r: '大' },
  { c: '雨', on: 'ウ', kun: 'あめ,あま', hv: 'VŨ', m: 'Mưa', s: 8, r: '雨' },
  { c: '花', on: 'カ', kun: 'はな', hv: 'HOA', m: 'Hoa', s: 7, r: '艸' },
  { c: '山', on: 'サン', kun: 'やま', hv: 'SƠN', m: 'Núi', s: 3, r: '山' },
  { c: '川', on: 'セン', kun: 'かわ', hv: 'XUYÊN', m: 'Sông', s: 3, r: '川' },
  { c: '田', on: 'デン', kun: 'た', hv: 'ĐIỀN', m: 'Ruộng', s: 5, r: '田' },
  { c: '土', on: 'ド,ト', kun: 'つち', hv: 'THỔ', m: 'Đất', s: 3, r: '土' },

  // Elements
  { c: '水', on: 'スイ', kun: 'みず', hv: 'THỦY', m: 'Nước', s: 4, r: '水' },
  { c: '火', on: 'カ', kun: 'ひ,ほ', hv: 'HỎA', m: 'Lửa', s: 4, r: '火' },
  { c: '金', on: 'キン,コン', kun: 'かね,かな', hv: 'KIM', m: 'Vàng, kim loại', s: 8, r: '金' },
  { c: '木', on: 'ボク,モク', kun: 'き,こ', hv: 'MỘC', m: 'Cây, gỗ', s: 4, r: '木' },
  { c: '本', on: 'ホン', kun: 'もと', hv: 'BỔN', m: 'Sách, gốc', s: 5, r: '木' },
  { c: '名', on: 'メイ,ミョウ', kun: 'な', hv: 'DANH', m: 'Tên', s: 6, r: '口' },

  // Actions - movement
  { c: '行', on: 'コウ,ギョウ', kun: 'い.く,ゆ.く,おこな.う', hv: 'HÀNH', m: 'Đi', s: 6, r: '行' },
  { c: '来', on: 'ライ', kun: 'く.る,きた.る', hv: 'LAI', m: 'Đến', s: 7, r: '木' },
  { c: '出', on: 'シュツ,スイ', kun: 'で.る,だ.す', hv: 'XUẤT', m: 'Ra', s: 5, r: '凵' },
  { c: '入', on: 'ニュウ', kun: 'い.る,はい.る', hv: 'NHẬP', m: 'Vào', s: 2, r: '入' },
  { c: '休', on: 'キュウ', kun: 'やす.む,やす.まる', hv: 'HƯU', m: 'Nghỉ', s: 6, r: '人' },

  // Actions - daily activities
  { c: '食', on: 'ショク,ジキ', kun: 'た.べる,く.う', hv: 'THỰC', m: 'Ăn', s: 9, r: '食' },
  { c: '飲', on: 'イン', kun: 'の.む', hv: 'ẨM', m: 'Uống', s: 12, r: '食' },
  { c: '見', on: 'ケン', kun: 'み.る,み.える', hv: 'KIẾN', m: 'Nhìn', s: 7, r: '見' },
  { c: '聞', on: 'ブン,モン', kun: 'き.く,き.こえる', hv: 'VĂN', m: 'Nghe', s: 14, r: '耳' },
  { c: '読', on: 'ドク,トク', kun: 'よ.む', hv: 'ĐỘC', m: 'Đọc', s: 14, r: '言' },
  { c: '書', on: 'ショ', kun: 'か.く', hv: 'THƯ', m: 'Viết', s: 10, r: '曰' },
  { c: '話', on: 'ワ', kun: 'はな.す,はなし', hv: 'THOẠI', m: 'Nói', s: 13, r: '言' },
  { c: '語', on: 'ゴ', kun: 'かた.る', hv: 'NGỮ', m: 'Ngôn ngữ', s: 14, r: '言' },

  // Places and institutions
  { c: '学', on: 'ガク', kun: 'まな.ぶ', hv: 'HỌC', m: 'Học', s: 8, r: '子' },
  { c: '校', on: 'コウ', kun: '', hv: 'HIỆU', m: 'Trường', s: 10, r: '木' },
  { c: '生', on: 'セイ,ショウ', kun: 'い.きる,う.まれる,なま', hv: 'SINH', m: 'Sinh, sống', s: 5, r: '生' },
  { c: '会', on: 'カイ,エ', kun: 'あ.う', hv: 'HỘI', m: 'Gặp, hội', s: 6, r: '人' },
  { c: '社', on: 'シャ', kun: 'やしろ', hv: 'XÃ', m: 'Công ty, xã', s: 7, r: '示' },
  { c: '店', on: 'テン', kun: 'みせ', hv: 'ĐIẾM', m: 'Cửa hàng', s: 8, r: '广' },
  { c: '駅', on: 'エキ', kun: '', hv: 'DỊCH', m: 'Ga', s: 14, r: '馬' },
  { c: '国', on: 'コク', kun: 'くに', hv: 'QUỐC', m: 'Nước, quốc gia', s: 8, r: '囗' },

  // Transportation
  { c: '電', on: 'デン', kun: '', hv: 'ĐIỆN', m: 'Điện', s: 13, r: '雨' },
  { c: '車', on: 'シャ', kun: 'くるま', hv: 'XA', m: 'Xe', s: 7, r: '車' },
  { c: '道', on: 'ドウ,トウ', kun: 'みち', hv: 'ĐẠO', m: 'Đường', s: 12, r: '辵' },
];
