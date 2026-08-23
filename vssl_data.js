/**
 * VSSL — Vietnamese Sign Speed Language
 * Core Data Layer: Phonetic → Hand Gesture Mapping
 *
 * Triết lý thiết kế:
 *   Tay Trái  → Phụ Âm Đầu (31 ký hiệu)
 *   Tay Phải  → Vần       (60 ký hiệu = 12 hình × 5 biến thể)
 *   Quỹ đạo  → Thanh Điệu (6 hướng)
 */

// ─── THANH ĐIỆU → TRAJECTORY ─────────────────────────────────────────────────
export const TONE_SIGNS = [
  { tone: 0, name: 'Ngang',  label: 'Bằng',  arrow: '→',  dx: 1,   dy: 0,    color: '#60a5fa', desc: 'Di thẳng sang phải' },
  { tone: 1, name: 'Sắc',   label: 'Sắc',   arrow: '↗',  dx: 0.7, dy: -0.7, color: '#34d399', desc: 'Chéo lên phải' },
  { tone: 2, name: 'Huyền', label: 'Huyền', arrow: '↘',  dx: 0.7, dy: 0.7,  color: '#f87171', desc: 'Chéo xuống phải' },
  { tone: 3, name: 'Hỏi',   label: 'Hỏi',   arrow: '↗⊣', dx: 0.7, dy: -0.7, color: '#c084fc', desc: 'Lên rồi dừng đột ngột' },
  { tone: 4, name: 'Ngã',   label: 'Ngã',   arrow: '∿',  dx: 1,   dy: 0,    color: '#fb923c', desc: 'Sóng ngang lắc lư' },
  { tone: 5, name: 'Nặng',  label: 'Nặng',  arrow: '↓',  dx: 0,   dy: 1,    color: '#94a3b8', desc: 'Thẳng xuống' },
];

// ─── PHỤ ÂM ĐẦU → HAND SHAPE (TAY TRÁI) ─────────────────────────────────────
// shape: mã hình bàn tay
// fingers: mảng [ngón cái, trỏ, giữa, áp út, út] — 1=duỗi, 0=gập
// orient: hướng lòng bàn tay ('up'=ngửa, 'down'=úp, 'in'=vào người, 'out'=ra ngoài)
// note: gợi nhớ ngắn

export const CONSONANT_SIGNS = {
  // Index 0 — Phụ âm rỗng (không có phụ âm đầu)
  '': {
    name: 'Rỗng', label: '∅',
    fingers: [0,0,0,0,0], orient: 'in',
    color: '#64748b', emoji: '✊',
    note: 'Nắm đấm — không có phụ âm đầu',
    svgPath: 'fist'
  },

  // ─── NHÓM BASE (HH 0-23) ───
  'c': {
    name: 'C/K', label: 'c',
    fingers: [1,1,0,0,0], orient: 'out',
    color: '#ef4444', emoji: '🤌',
    note: 'Ngón cái+trỏ tạo hình chữ C',
    svgPath: 'c_shape'
  },
  'đ': {
    name: 'Đ', label: 'đ',
    fingers: [0,1,0,0,0], orient: 'down',
    color: '#f97316', emoji: '👇',
    note: 'Ngón trỏ chỉ xuống, cổ tay xoay ngang',
    svgPath: 'd_down'
  },
  'g': {
    name: 'G/GH', label: 'g',
    fingers: [1,1,0,0,0], orient: 'in',
    color: '#eab308', emoji: '🤙',
    note: 'Ngón cái+trỏ tạo hình súng G',
    svgPath: 'gun_g'
  },
  'gh': {
    name: 'GH', label: 'gh',
    fingers: [1,1,0,0,0], orient: 'in',
    color: '#ca8a04', emoji: '🤙',
    note: 'Giống G nhưng cổ tay hơi ngả',
    svgPath: 'gun_g_tilt'
  },
  'gi': {
    name: 'GI', label: 'gi',
    fingers: [1,1,0,0,0], orient: 'out',
    color: '#84cc16', emoji: '🤙',
    note: 'G + vẫy nhẹ (gi-wave)',
    svgPath: 'gun_g_wave'
  },
  'k': {
    name: 'K', label: 'k',
    fingers: [1,1,0,0,0], orient: 'out',
    color: '#22c55e', emoji: '🤌',
    note: 'C-shape — đồng âm với C',
    svgPath: 'c_shape'
  },
  'kh': {
    name: 'KH', label: 'kh',
    fingers: [1,1,1,0,0], orient: 'out',
    color: '#10b981', emoji: '🤙',
    note: 'K + búng ngón giữa (kh-flick)',
    svgPath: 'k_flick'
  },
  'h': {
    name: 'H', label: 'h',
    fingers: [0,1,1,0,0], orient: 'up',
    color: '#06b6d4', emoji: '✌️',
    note: 'Ngón trỏ+giữa — Peace/Victory sign',
    svgPath: 'peace_v'
  },
  'v': {
    name: 'V', label: 'v',
    fingers: [0,1,1,0,0], orient: 'down',
    color: '#3b82f6', emoji: '✌️',
    note: 'V ngược — peace úp xuống',
    svgPath: 'v_down'
  },
  'd': {
    name: 'D', label: 'd',
    fingers: [0,1,0,0,0], orient: 'up',
    color: '#6366f1', emoji: '☝️',
    note: 'Ngón trỏ chỉ thẳng lên',
    svgPath: 'index_up'
  },
  'm': {
    name: 'M', label: 'm',
    fingers: [0,1,1,1,0], orient: 'up',
    color: '#8b5cf6', emoji: '🤟',
    note: '3 ngón (trỏ+giữa+áp út) — M 3 nhánh',
    svgPath: 'm_3finger'
  },
  'ch': {
    name: 'CH', label: 'ch',
    fingers: [0,1,1,0,0], orient: 'in',
    color: '#a855f7', emoji: '✂️',
    note: '2 ngón chạm đầu nhau — CH snap',
    svgPath: 'ch_snap'
  },
  'r': {
    name: 'R', label: 'r',
    fingers: [0,1,0,0,0], orient: 'out',
    color: '#ec4899', emoji: '🪝',
    note: 'Ngón trỏ cong uốn — R curl',
    svgPath: 'r_curl'
  },
  's': {
    name: 'S', label: 's',
    fingers: [1,1,1,0,0], orient: 'in',
    color: '#f43f5e', emoji: '🐍',
    note: 'Cái+trỏ+giữa cong như chữ S',
    svgPath: 's_snake'
  },
  'n': {
    name: 'N', label: 'n',
    fingers: [0,1,1,0,0], orient: 'in',
    color: '#ef4444', emoji: '🖖',
    note: '2 ngón song song nằm ngang — N-bar',
    svgPath: 'n_bar'
  },
  'b': {
    name: 'B', label: 'b',
    fingers: [1,0,0,0,0], orient: 'up',
    color: '#f97316', emoji: '👍',
    note: 'Ngón cái duỗi lên — Thumbs up Big B',
    svgPath: 'thumbs_up'
  },
  'l': {
    name: 'L', label: 'l',
    fingers: [1,1,0,0,0], orient: 'up',
    color: '#eab308', emoji: '👌',
    note: 'Cái+trỏ tạo chữ L rõ ràng',
    svgPath: 'l_shape'
  },
  // index 17 — ch2 (second ch slot in data)
  '_ch2': {
    name: 'CH₂', label: 'ch',
    fingers: [0,1,1,0,0], orient: 'up',
    color: '#a855f7', emoji: '✂️',
    note: 'CH biến thể — ngón trỏ+giữa hướng lên',
    svgPath: 'ch_up'
  },
  // index 18 — s2
  '_s2': {
    name: 'S₂', label: 's',
    fingers: [1,1,1,0,0], orient: 'up',
    color: '#f43f5e', emoji: '🐍',
    note: 'S biến thể — ngón hướng lên',
    svgPath: 's_up'
  },
  // index 20 — ng
  'ng': {
    name: 'NG', label: 'ng',
    fingers: [0,1,1,1,1], orient: 'up',
    color: '#22c55e', emoji: '🖐️',
    note: '4 ngón duỗi ngang — NG spread',
    svgPath: 'ng_spread'
  },
  'nh': {
    name: 'NH', label: 'nh',
    fingers: [0,1,1,0,0], orient: 'up',
    color: '#06b6d4', emoji: '☝️☝️',
    note: '2 ngón song song hướng lên — NH double',
    svgPath: 'nh_double'
  },
  // index 22 — l2
  '_l2': {
    name: 'L₂', label: 'l',
    fingers: [1,1,0,0,0], orient: 'down',
    color: '#eab308', emoji: '👌',
    note: 'L biến thể — hướng xuống',
    svgPath: 'l_down'
  },
  'ngh': {
    name: 'NGH', label: 'ngh',
    fingers: [0,1,1,1,1], orient: 'in',
    color: '#22c55e', emoji: '🖐️',
    note: 'NGH = NG biến thể — lòng bàn tay vào trong',
    svgPath: 'ng_in'
  },

  // ─── NHÓM EXTRA (cExtraIdx 0-6) ───
  'p': {
    name: 'P', label: 'p',
    fingers: [1,1,1,1,1], orient: 'up',
    color: '#84cc16', emoji: '🖐️',
    note: '5 ngón xòe ngửa — Open Palm P',
    svgPath: 'open_palm'
  },
  'ph': {
    name: 'PH', label: 'ph',
    fingers: [1,1,1,1,1], orient: 'out',
    color: '#10b981', emoji: '🖐️',
    note: 'Palm xòe rộng ra ngoài — PH fan',
    svgPath: 'ph_fan'
  },
  'qu': {
    name: 'QU', label: 'qu',
    fingers: [1,1,0,0,0], orient: 'up',
    color: '#3b82f6', emoji: '👌',
    note: 'Cái+trỏ tạo vòng O — Q ring',
    svgPath: 'q_ring'
  },
  't': {
    name: 'T', label: 't',
    fingers: [1,1,0,0,0], orient: 'in',
    color: '#6366f1', emoji: '✝️',
    note: 'Ngón cái ngang trên trỏ — T cross',
    svgPath: 't_cross'
  },
  'th': {
    name: 'TH', label: 'th',
    fingers: [1,1,1,0,0], orient: 'in',
    color: '#8b5cf6', emoji: '✝️',
    note: 'T + ngón giữa duỗi thêm — TH two',
    svgPath: 'th_two'
  },
  'tr': {
    name: 'TR', label: 'tr',
    fingers: [0,1,1,0,0], orient: 'out',
    color: '#ec4899', emoji: '🤞',
    note: 'Ngón trỏ+giữa bắt chéo — TR twist',
    svgPath: 'tr_cross'
  },
  'x': {
    name: 'X', label: 'x',
    fingers: [0,1,0,0,1], orient: 'up',
    color: '#f43f5e', emoji: '🤘',
    note: 'Trỏ+út duỗi, 2 giữa gập — X rock',
    svgPath: 'x_rock'
  },
};

// Mapping từ HH index → consonant key
export const CONSONANT_BASE_KEYS = [
  'c', 'đ', 'g', 'gh', 'gi', 'k', 'kh',
  'h', 'v', 'd', 'm', 'ch', 'r', 's', 'n', 'b', 'l',
  '_ch2', '_s2', '', 'ng', 'nh', '_l2', 'ngh'
];
export const CONSONANT_EXTRA_KEYS = ['p', 'ph', 'qu', 't', 'th', 'tr', 'x'];

// ─── VẦN → HAND SHAPE (TAY PHẢI) ─────────────────────────────────────────────
// 12 hình cơ bản (base shapes) × 5 biến thể (modifiers) = 60 slots
// modifier: 0=natural, 1=tilt-in(vần n/m/ng), 2=tilt-out(vần t/c/p), 3=raised(B2), 4=lowered(B3)

export const RHYME_BASE_SHAPES = [
  // Shape 0 — A-Open: 5 ngón xòe ngửa
  { id: 'A', name: 'A-Open', emoji: '🖐️',
    fingers: [1,1,1,1,1], orient: 'up',
    color: '#ef4444',
    desc: '5 ngón xòe, lòng bàn tay ngửa' },

  // Shape 1 — B-Flat: 4 ngón sát nhau ngang
  { id: 'B', name: 'B-Flat', emoji: '🤚',
    fingers: [0,1,1,1,1], orient: 'up',
    color: '#f97316',
    desc: '4 ngón khép, ngón cái gập vào' },

  // Shape 2 — C-Curve: bàn tay cong hình C
  { id: 'C', name: 'C-Curve', emoji: '🤌',
    fingers: [1,1,0,0,0], orient: 'out',
    color: '#eab308',
    desc: 'Bàn tay cong hình chữ C' },

  // Shape 3 — D-Ring: cái+trỏ tạo vòng, 3 còn lại duỗi
  { id: 'D', name: 'D-Ring', emoji: '👌',
    fingers: [1,1,1,1,1], orient: 'up',
    color: '#84cc16',
    desc: 'Cái+trỏ tạo vòng tròn, 3 ngón còn lại duỗi' },

  // Shape 4 — E-Extended: trỏ+giữa+áp út duỗi
  { id: 'E', name: 'E-Ext', emoji: '🤟',
    fingers: [0,1,1,1,0], orient: 'up',
    color: '#22c55e',
    desc: 'Ngón trỏ, giữa, áp út duỗi thẳng' },

  // Shape 5 — F-Pinch: cái+trỏ túm, 3 còn duỗi
  { id: 'F', name: 'F-Pinch', emoji: '🤌',
    fingers: [1,1,0,1,1], orient: 'up',
    color: '#06b6d4',
    desc: 'Cái+trỏ túm lại, 3 ngón còn duỗi' },

  // Shape 6 — G-Cup: 4 ngón cong như cầm cốc
  { id: 'G', name: 'G-Cup', emoji: '🫙',
    fingers: [0,1,1,1,1], orient: 'in',
    color: '#3b82f6',
    desc: '4 ngón cong nhẹ như cầm cốc, cái ẩn' },

  // Shape 7 — H-Hook: cái+trỏ ngang, hình kẹp
  { id: 'H', name: 'H-Hook', emoji: '🤙',
    fingers: [1,1,0,0,1], orient: 'out',
    color: '#6366f1',
    desc: 'Ngón cái+trỏ ngang, út duỗi — hình H' },

  // Shape 8 — I-Index: chỉ ngón trỏ thẳng đứng
  { id: 'I', name: 'I-Index', emoji: '☝️',
    fingers: [0,1,0,0,0], orient: 'up',
    color: '#8b5cf6',
    desc: 'Chỉ ngón trỏ thẳng đứng' },

  // Shape 9 — J-Hook: ngón trỏ cong xuống như móc J
  { id: 'J', name: 'J-Hook', emoji: '🪝',
    fingers: [0,1,0,0,0], orient: 'down',
    color: '#a855f7',
    desc: 'Ngón trỏ cong xuống hình móc J' },

  // Shape 10 — K-Angle: trỏ+giữa+cái tạo hình K
  { id: 'K', name: 'K-Angle', emoji: '✌️',
    fingers: [1,1,1,0,0], orient: 'in',
    color: '#ec4899',
    desc: 'Ngón cái, trỏ, giữa tạo hình góc K' },

  // Shape 11 — L-Lock: cái+trỏ tạo L thẳng góc
  { id: 'L', name: 'L-Lock', emoji: '🤙',
    fingers: [1,1,0,0,0], orient: 'up',
    color: '#f43f5e',
    desc: 'Ngón cái ngang, trỏ thẳng đứng — hình L' },
];

// 5 biến thể cổ tay (Wrist Modifiers)
export const RHYME_MODIFIERS = [
  { id: 0, name: 'Natural',   label: 'Tự nhiên', wrist: 0,   group: 'Vần ngắn/đơn', color: '#94a3b8' },
  { id: 1, name: 'Tilt-In',  label: 'Nghiêng vào', wrist: 15,  group: 'Vần kết thúc n/m/ng', color: '#60a5fa' },
  { id: 2, name: 'Tilt-Out', label: 'Nghiêng ra', wrist: -15, group: 'Vần kết thúc t/c/p/ch', color: '#f87171' },
  { id: 3, name: 'Raised',   label: 'Nâng cao', wrist: 0,   group: 'Vần Extra Bảng 1', color: '#a78bfa' },
  { id: 4, name: 'Lowered',  label: 'Hạ thấp', wrist: 0,   group: 'Vần Extra Bảng 2', color: '#fb923c' },
];

// Ánh xạ đầy đủ 60 vần BASE → {shapeIdx, modifierIdx, display}
// Thứ tự theo RHYMES_BASE trong data.js
export const RHYME_SIGN_MAP = {
  // ─── BẢNG 1 (RHYMES_BASE) ───
  'a':   { shape: 0, mod: 0, label: 'a',   desc: 'Nguyên âm A đơn' },
  'ac':  { shape: 0, mod: 2, label: 'ac',  desc: 'A + kết thúc C' },
  'ach': { shape: 0, mod: 2, label: 'ach', desc: 'A + kết thúc CH' },
  'ai':  { shape: 0, mod: 1, label: 'ai',  desc: 'AI' },
  'am':  { shape: 0, mod: 1, label: 'am',  desc: 'AM' },
  'an':  { shape: 6, mod: 0, label: 'an',  desc: 'AN — G-Cup tự nhiên' },
  'ang': { shape: 6, mod: 1, label: 'ang', desc: 'ANG' },
  'ôn':  { shape: 7, mod: 0, label: 'ôn',  desc: 'ÔN — H-Hook' },
  'u':   { shape: 3, mod: 0, label: 'u',   desc: 'U tròn — D-Ring' },
  'âm':  { shape: 1, mod: 1, label: 'âm',  desc: 'ÂM — B-Flat + tilt-in' },
  'ut':  { shape: 3, mod: 2, label: 'ut',  desc: 'UT — D-Ring + tilt-out' },
  'ich': { shape: 5, mod: 2, label: 'ich', desc: 'ICH — F + tilt-out' },
  'ên':  { shape: 4, mod: 1, label: 'ên',  desc: 'ÊN — E-Ext + tilt-in' },
  'ương':{ shape: 9, mod: 1, label: 'ương',desc: 'ƯƠNG — J-Hook tilt-in' },
  'ưng': { shape: 9, mod: 3, label: 'ưng', desc: 'ƯNG — J-Hook raised' },
  'ươm': { shape: 9, mod: 1, label: 'ươm', desc: 'ƯƠM' },
  'iêm': { shape: 8, mod: 1, label: 'iêm', desc: 'IÊM — I-Index tilt-in' },
  'im':  { shape: 8, mod: 1, label: 'im',  desc: 'IM' },
  'ơ':   { shape: 2, mod: 0, label: 'ơ',   desc: 'Ơ — C-Curve đơn' },
  'ôm':  { shape: 7, mod: 1, label: 'ôm',  desc: 'ÔM — H-Hook tilt-in' },
  'ưc':  { shape: 9, mod: 2, label: 'ưc',  desc: 'ƯC — J tilt-out' },
  'âp':  { shape: 1, mod: 2, label: 'âp',  desc: 'ÂP — B-Flat tilt-out' },
  'anh': { shape: 0, mod: 3, label: 'anh', desc: 'ANH — A raised' },
  'ao':  { shape: 0, mod: 4, label: 'ao',  desc: 'AO — A lowered' },
  'ap':  { shape: 0, mod: 2, label: 'ap',  desc: 'AP — A tilt-out' },
  'at':  { shape: 0, mod: 2, label: 'at',  desc: 'AT — A tilt-out biến thể' },
  'au':  { shape: 6, mod: 2, label: 'au',  desc: 'AU — G-Cup tilt-out' },
  'ay':  { shape: 6, mod: 3, label: 'ay',  desc: 'AY — G-Cup raised' },
  'ă':   { shape: 1, mod: 0, label: 'ă',   desc: 'Ă ngắn — B-Flat' },
  'ăc':  { shape: 1, mod: 2, label: 'ăc',  desc: 'ĂC' },
  'ăm':  { shape: 1, mod: 1, label: 'ăm',  desc: 'ĂM' },
  'ăn':  { shape: 1, mod: 1, label: 'ăn',  desc: 'ĂN' },
  'ăng': { shape: 1, mod: 3, label: 'ăng', desc: 'ĂNG' },
  'ăp':  { shape: 1, mod: 2, label: 'ăp',  desc: 'ĂP' },
  'ăt':  { shape: 1, mod: 2, label: 'ăt',  desc: 'ĂT' },
  'â':   { shape: 2, mod: 1, label: 'â',   desc: 'Â — C-Curve tilt-in' },
  'âc':  { shape: 2, mod: 2, label: 'âc',  desc: 'ÂC' },
  'ân':  { shape: 2, mod: 1, label: 'ân',  desc: 'ÂN' },
  'âng': { shape: 2, mod: 3, label: 'âng', desc: 'ÂNG' },
  'ât':  { shape: 2, mod: 2, label: 'ât',  desc: 'ÂT' },
  'âu':  { shape: 2, mod: 4, label: 'âu',  desc: 'ÂU' },
  'ây':  { shape: 2, mod: 4, label: 'ây',  desc: 'ÂY' },
  'e':   { shape: 4, mod: 0, label: 'e',   desc: 'E — E-Extended đơn' },
  'ec':  { shape: 4, mod: 2, label: 'ec',  desc: 'EC' },
  'em':  { shape: 4, mod: 1, label: 'em',  desc: 'EM' },
  'en':  { shape: 4, mod: 1, label: 'en',  desc: 'EN' },
  'eo':  { shape: 4, mod: 4, label: 'eo',  desc: 'EO' },
  'ep':  { shape: 4, mod: 2, label: 'ep',  desc: 'EP' },
  'et':  { shape: 4, mod: 2, label: 'et',  desc: 'ET' },
  'ê':   { shape: 4, mod: 3, label: 'ê',   desc: 'Ê — E raised' },
  'êch': { shape: 4, mod: 2, label: 'êch', desc: 'ÊCH' },
  'êm':  { shape: 4, mod: 1, label: 'êm',  desc: 'ÊM' },
  'ênh': { shape: 4, mod: 3, label: 'ênh', desc: 'ÊNH' },
  'êp':  { shape: 4, mod: 2, label: 'êp',  desc: 'ÊP' },
  'êt':  { shape: 4, mod: 2, label: 'êt',  desc: 'ÊT' },
  'êu':  { shape: 4, mod: 4, label: 'êu',  desc: 'ÊU' },
  'i':   { shape: 8, mod: 0, label: 'i',   desc: 'I — I-Index đơn' },
  'ia':  { shape: 8, mod: 4, label: 'ia',  desc: 'IA' },

  // ─── BẢNG 2 (RHYMES_EXTRA_1) — modifier 3=raised ─
  'iêc':  { shape: 8, mod: 2, label: 'iêc',  desc: 'IÊC' },
  'iên':  { shape: 8, mod: 1, label: 'iên',  desc: 'IÊN' },
  'iêng': { shape: 8, mod: 3, label: 'iêng', desc: 'IÊNG' },
  'iêp':  { shape: 8, mod: 2, label: 'iêp',  desc: 'IÊP' },
  'iêt':  { shape: 8, mod: 2, label: 'iêt',  desc: 'IÊT' },
  'iu':   { shape: 8, mod: 4, label: 'iu',   desc: 'IU' },
  'in':   { shape: 8, mod: 1, label: 'in',   desc: 'IN' },
  'iêu':  { shape: 8, mod: 4, label: 'iêu',  desc: 'IÊU' },
  'ip':   { shape: 8, mod: 2, label: 'ip',   desc: 'IP' },
  'it':   { shape: 8, mod: 2, label: 'it',   desc: 'IT' },
  'inh':  { shape: 8, mod: 3, label: 'inh',  desc: 'INH' },
  'oa':   { shape: 11, mod: 0, label: 'oa',  desc: 'OA — L-Lock' },
  'oai':  { shape: 11, mod: 1, label: 'oai', desc: 'OAI' },
  'oan':  { shape: 11, mod: 1, label: 'oan', desc: 'OAN' },
  'oc':   { shape: 2, mod: 2,  label: 'oc',  desc: 'OC — C-Curve tilt-out' },
  'oe':   { shape: 11, mod: 4, label: 'oe',  desc: 'OE' },
  'oi':   { shape: 2, mod: 4,  label: 'oi',  desc: 'OI' },
  'om':   { shape: 2, mod: 1,  label: 'om',  desc: 'OM' },
  'on':   { shape: 2, mod: 1,  label: 'on',  desc: 'ON' },
  'ong':  { shape: 2, mod: 3,  label: 'ong', desc: 'ONG' },
  'op':   { shape: 2, mod: 2,  label: 'op',  desc: 'OP' },
  'ot':   { shape: 2, mod: 2,  label: 'ot',  desc: 'OT' },
  'ô':    { shape: 10, mod: 0, label: 'ô',   desc: 'Ô — K-Angle' },
  'ôc':   { shape: 10, mod: 2, label: 'ôc',  desc: 'ÔC' },
  'ôi':   { shape: 10, mod: 4, label: 'ôi',  desc: 'ÔI' },
  'ông':  { shape: 10, mod: 3, label: 'ông', desc: 'ÔNG' },
  'ôp':   { shape: 10, mod: 2, label: 'ôp',  desc: 'ÔP' },
  'ôt':   { shape: 10, mod: 2, label: 'ôt',  desc: 'ÔT' },
  'ơi':   { shape: 2, mod: 4,  label: 'ơi',  desc: 'ƠI' },
  'ơm':   { shape: 2, mod: 1,  label: 'ơm',  desc: 'ƠM' },
  'ơn':   { shape: 2, mod: 1,  label: 'ơn',  desc: 'ƠN' },
  'ơp':   { shape: 2, mod: 2,  label: 'ơp',  desc: 'ƠP' },
  'ơt':   { shape: 2, mod: 2,  label: 'ơt',  desc: 'ƠT' },
  'o':    { shape: 2, mod: 0,  label: 'o',   desc: 'O — C-Curve đơn' },

  // ─── BẢNG 3 (RHYMES_EXTRA_2) ─
  'ua':   { shape: 3, mod: 4,  label: 'ua',   desc: 'UA — D-Ring lowered' },
  'uât':  { shape: 3, mod: 2,  label: 'uât',  desc: 'UÂT' },
  'uc':   { shape: 3, mod: 2,  label: 'uc',   desc: 'UC' },
  'uê':   { shape: 3, mod: 3,  label: 'uê',   desc: 'UÊ' },
  'ui':   { shape: 3, mod: 4,  label: 'ui',   desc: 'UI' },
  'um':   { shape: 3, mod: 1,  label: 'um',   desc: 'UM' },
  'un':   { shape: 3, mod: 1,  label: 'un',   desc: 'UN' },
  'uân':  { shape: 10, mod: 1, label: 'uân',  desc: 'UÂN — K-Angle tilt-in' },
  'ung':  { shape: 3, mod: 3,  label: 'ung',  desc: 'UNG' },
  'uôc':  { shape: 10, mod: 2, label: 'uôc',  desc: 'UÔC' },
  'uôi':  { shape: 10, mod: 4, label: 'uôi',  desc: 'UÔI' },
  'uôn':  { shape: 10, mod: 1, label: 'uôn',  desc: 'UÔN' },
  'uông': { shape: 10, mod: 3, label: 'uông', desc: 'UÔNG' },
  'uôt':  { shape: 10, mod: 2, label: 'uôt',  desc: 'UÔT' },
  'up':   { shape: 3, mod: 2,  label: 'up',   desc: 'UP' },
  'uy':   { shape: 3, mod: 4,  label: 'uy',   desc: 'UY' },
  'uyên': { shape: 3, mod: 1,  label: 'uyên', desc: 'UYÊN' },
  'uyêt': { shape: 3, mod: 2,  label: 'uyêt', desc: 'UYÊT' },
  'ư':    { shape: 9, mod: 0,  label: 'ư',    desc: 'Ư — J-Hook đơn' },
  'ưa':   { shape: 9, mod: 4,  label: 'ưa',   desc: 'ƯA' },
  'ưi':   { shape: 9, mod: 4,  label: 'ưi',   desc: 'ƯI' },
  'ưm':   { shape: 9, mod: 1,  label: 'ưm',   desc: 'ƯM' },
  'ưn':   { shape: 9, mod: 1,  label: 'ưn',   desc: 'ƯN' },
  'ươc':  { shape: 9, mod: 2,  label: 'ươc',  desc: 'ƯỢC' },
  'ươi':  { shape: 9, mod: 4,  label: 'ươi',  desc: 'ƯƠBSCK' },
  'ươn':  { shape: 9, mod: 1,  label: 'ươn',  desc: 'ƯƠNCH' },
  'ươp':  { shape: 9, mod: 2,  label: 'ươp',  desc: 'ƯƠP' },
  'ươt':  { shape: 9, mod: 2,  label: 'ươt',  desc: 'ƯƠT' },
  'ưt':   { shape: 9, mod: 2,  label: 'ưt',   desc: 'ƯT' },
  'ưu':   { shape: 9, mod: 4,  label: 'ưu',   desc: 'ƯU' },
  'y':    { shape: 8, mod: 3,  label: 'y',    desc: 'Y — I raised' },
  'yêm':  { shape: 8, mod: 1,  label: 'yêm',  desc: 'YÊM' },
  'yên':  { shape: 8, mod: 1,  label: 'yên',  desc: 'YÊN' },
  'yêt':  { shape: 8, mod: 2,  label: 'yêt',  desc: 'YÊT' },
  'yêu':  { shape: 8, mod: 4,  label: 'yêu',  desc: 'YÊU' },
};

// ─── LOOKUP HELPERS ───────────────────────────────────────────────────────────
export function getConsonantSign(consonant) {
  return CONSONANT_SIGNS[consonant] || CONSONANT_SIGNS[''];
}

export function getRhymeSign(rhyme) {
  return RHYME_SIGN_MAP[rhyme] || { shape: 0, mod: 0, label: rhyme, desc: 'Chưa có mapping' };
}

export function getToneSign(tone) {
  return TONE_SIGNS[tone] || TONE_SIGNS[0];
}

// Từ HH index → consonant sign
export function getConsonantSignByHH(hh, isExtra = false) {
  const key = isExtra ? CONSONANT_EXTRA_KEYS[hh] : CONSONANT_BASE_KEYS[hh];
  return { key, sign: getConsonantSign(key) };
}

// Demo words — 20 từ phổ biến nhất với full sign data
export const DEMO_WORDS = [
  'tôi', 'bạn', 'học', 'việt', 'nam', 'yêu', 'ăn', 'nước',
  'sức', 'khỏe', 'chào', 'xin', 'cảm', 'ơn', 'được', 'không',
  'có', 'là', 'và', 'với'
];
