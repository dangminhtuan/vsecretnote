/**
 * ====================================================================
 * 🎬 VSECRETNOTE - SUBTITLE CIPHER STUDIO (SRT VIDEO MULTI-LAYER CIPHER)
 * ====================================================================
 */

import { encodeWord, timeToBase60, TOKEN_REGEX } from './vcomp.js';
import { encodeCVNSS4Word } from './cvnss4.js';
import { TWINS_DATA } from './twins.js';

// ===== 15 SUBTITLE FORMAT DEFINITIONS =====
export const SUB_FORMATS = [
  { id: 'group-text', shortLabel: 'Tiếng Việt gốc', icon: '🟢', color: '#00ff66', defaultActive: true },
  { id: 'group-compressed', shortLabel: 'Base60', icon: '🟣', color: '#a855f7', defaultActive: true },
  { id: 'group-continuous', shortLabel: 'Base60 liền', icon: '🔤', color: '#00ffcc', defaultActive: false },
  { id: 'group-holy', shortLabel: 'Giờ thiêng [4 số]', icon: '🟡', color: '#ffaa00', defaultActive: false },
  { id: 'group-twins', shortLabel: 'Kỳ quan gần nhất', icon: '✨', color: '#00ffaa', defaultActive: false },
  { id: 'group-cyber-font', shortLabel: 'Cyber Font [TTF]', icon: '🔠', color: '#58a6ff', defaultActive: false },
  { id: 'group-viscript-font', shortLabel: 'ViScript Font [V2B]', icon: '🖋️', color: '#00f2fe', defaultActive: false },
  { id: 'group-unicode-symbols', shortLabel: 'Ký hiệu Unicode [Zero]', icon: '🔶', color: '#ffd166', defaultActive: false },
  { id: 'group-time', shortLabel: 'Thời gian [6 số]', icon: '⏱️', color: '#00f0ff', defaultActive: false },
  { id: 'group-time5', shortLabel: 'Thời gian [5 số]', icon: '🔢', color: '#38bdf8', defaultActive: false },
  { id: 'group-cvnss4', shortLabel: 'CVNSS 4.0', icon: '⚡', color: '#ff55ff', defaultActive: false },
  { id: 'group-fakeviet', shortLabel: 'Mã Giả Việt', icon: '♰', color: '#ff5555', defaultActive: false },
  { id: 'group-fakeviet-minimal', shortLabel: 'Giả Việt Tối giản', icon: '✨', color: '#ff77aa', defaultActive: false },
  { id: 'group-camel', shortLabel: 'camelCase', icon: '🐫', color: '#ffaa00', defaultActive: false },
  { id: 'group-noaccent', shortLabel: 'Không dấu liền', icon: '📝', color: '#888888', defaultActive: false }
];

const DEFAULT_ORDER = SUB_FORMATS.map(f => f.id);
const DEFAULT_ACTIVE = ['group-text', 'group-compressed'];

// ===== 🔶 UNICODE GEOMETRIC SYMBOLS (ZERO-FONT MAPPING) =====
const B60_TO_UNICODE = {
  'c': '⊂', 'd': 'ᑯ', 'g': '↯', 'G': '⊃', 'j': 'j', 'k': '<', 'K': '>', 'h': '♡', 'v': '∨', 'D': 'D',
  'm': 'm', 'C': 'C', 'r': '┌', 's': '┘', 'n': '∩', 'b': 'b', 'l': 'l', 'Q': '□', 'S': 'S', 'z': '┐',
  'N': 'N', 'y': 'y', 'L': '└', 'W': 'W', 'p': 'p', 'f': '⊥', 'q': '⊏', 't': '+', 'T': '⊤', 'R': 'R',
  'x': '×', '0': '⊙', '1': '1', '2': '2', '3': '3', '4': '4', '5': '5', '6': '6', '7': '7', '8': '8',
  '9': '9', 'A': '\\', 'B': 'B', 'E': '⊢', 'F': '⊣', 'H': '⊓', 'o': 'o', 'J': 'J', 'M': 'M', 'P': '⊐',
  'U': '⊔', 'V': '∧', 'X': 'X', 'Y': 'Y', 'Z': 'Z', 'a': '—', 'e': '=', 'i': '⸝', 'u': '∪', 'w': 'w'
};

function b60ToUnicodeSymbols(b60) {
  if (!b60) return '';
  return b60.split('').map(ch => B60_TO_UNICODE[ch] || ch).join('');
}

// ===== ♰ FAKE VIETNAMESE MAPPING =====
const FAKE_VIET_MAP = {
  'A': '卂', 'B': '乃', 'C': '匚', 'D': 'ᗪ', 'E': '乇', 'F': '₣', 'G': 'Ꮆ',
  'H': '卄', 'I': '工', 'J': 'ﾌ', 'K': 'Ꮶ', 'L': 'ㄥ', 'M': '爪', 'N': '几',
  'O': 'ㄖ', 'P': '卩', 'Q': 'Ɋ', 'R': '尺', 'S': '丂', 'T': 'ㄒ', 'U': 'ㄩ',
  'V': 'ᐯ', 'W': 'ᗯ', 'X': '乂', 'Y': 'ㄚ', 'Z': '乙'
};

function removeAccentsStr(str) {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D');
}

function toFakeViet(text) {
  if (!text) return '';
  let noTone = removeAccentsStr(text).toUpperCase();
  let mapped = [...noTone].map(c => {
    if (c === ' ') return '-';
    return FAKE_VIET_MAP[c] || c;
  }).join('');
  return `♰${mapped}♰`;
}

// ===== ✨ FAKE VIET MINIMAL (ZERO-FONT BYPASS) =====
const FAKE_VIET_MINIMAL_MAP = {
  'c': '⊂', 'k': '<', 't': '+', 'p': 'p', 'g': '↯', 'n': '∩',
  'r': '┌', 's': '┘', 'b': 'b', 'l': '|', 'm': 'm', 'v': '∨',
  'x': '×', 'h': '♡', 'a': '—', 'e': '=', 'i': '⸝', 'u': '∪', 'o': 'o',
  'd': 'ᑯ', 'f': '⊥', 'j': 'j', 'q': '⊏', 'w': 'w', 'y': 'y', 'z': '┐',
  'A': '\\', 'B': 'B', 'C': 'C', 'D': 'D', 'E': '⊢', 'F': '⊣', 'G': '⊃',
  'H': 'H', 'I': '⸝', 'J': 'J', 'K': '>', 'L': '└', 'M': 'M', 'N': 'N',
  'O': 'o', 'P': '⊐', 'Q': '□', 'R': 'R', 'S': 'S', 'T': '⊤', 'U': '⊔',
  'V': '∧', 'W': 'W', 'X': 'X', 'Y': 'Y', 'Z': 'Z'
};

function toFakeVietMinimal(text) {
  if (!text) return '';
  let clean = text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // 1. Phụ âm tiếng Việt gốc trước
  clean = clean.replace(/ngh/gi, 'W');
  clean = clean.replace(/nh/gi, 'H');
  clean = clean.replace(/ch/gi, 'C');
  clean = clean.replace(/tr/gi, 'R');
  clean = clean.replace(/ng/gi, 'N');
  clean = clean.replace(/kh/gi, '>');
  clean = clean.replace(/th/gi, '⊤');
  clean = clean.replace(/ph/gi, '⊥');
  clean = clean.replace(/gh/gi, '⊃');
  clean = clean.replace(/qu/gi, '⊏');
  clean = clean.replace(/gi/gi, 'j');
  clean = clean.replace(/[đd]/gi, 'ᑯ');

  // 2. Ký hiệu gõ rời / tương thích ngược
  clean = clean.replace(/N[h♡]/g, 'W');
  clean = clean.replace(/∩[↯g][h♡]/gi, 'W');
  clean = clean.replace(/∩[↯g]/gi, 'N');
  clean = clean.replace(/<[h♡]/gi, '>');
  clean = clean.replace(/\+[h♡]/gi, '⊤');
  clean = clean.replace(/p[h♡]/gi, '⊥');
  clean = clean.replace(/⊂[h♡]/gi, 'C');
  clean = clean.replace(/\+[r┌]/gi, 'R');
  clean = clean.replace(/∩[h♡]/gi, 'H');
  clean = clean.replace(/↯[h♡]/gi, '⊃');
  clean = clean.replace(/⊏[u∪]/gi, '⊏');
  clean = clean.replace(/[↯g][i⸝]/gi, 'j');

  const COMPOUND_SET = new Set(['W', 'N', '>', '⊤', '⊥', 'C', 'R', 'H', '⊃', '⊏', 'j', 'ᑯ']);
  return [...clean].map(ch => {
    if (COMPOUND_SET.has(ch)) return ch;
    const lower = ch.toLowerCase();
    return FAKE_VIET_MINIMAL_MAP[lower] || ch;
  }).join('');
}

// ===== 🐫 CAMELCASE & 📝 NO ACCENT =====
function toCamelCase(str) {
  if (!str) return '';
  return str.trim().split(/\s+/)
    .map((word, index) => {
      if (index === 0) return word.toLowerCase();
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join('');
}

function toNoAccentContinuous(str) {
  if (!str) return '';
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd').replace(/Đ/g, 'D')
    .replace(/\s+/g, '').toLowerCase();
}

// ===== ⏱️ TIME ENCODERS =====
function encodeLineToTime(text) {
  if (!text) return '';
  const tokens = text.split(TOKEN_REGEX);
  return tokens.map(token => {
    if (!token) return '';
    if (token.match(/^[a-zA-Z0-9_\u00C0-\u024F\u1E00-\u1EFF]+$/)) {
      const timeCode = encodeWord(token);
      return timeCode || token;
    }
    return token;
  }).join('');
}

function timeTo5Digit(timeStr) {
  if (!timeStr) return '';
  return timeStr.replace(/[0-9]{6}/g, (match) => {
    let h = parseInt(match.substring(0, 2), 10);
    let m = parseInt(match.substring(2, 4), 10);
    let s = parseInt(match.substring(4, 6), 10);
    let total = h * 3600 + m * 60 + s;
    return total.toString().padStart(5, '0');
  });
}

// ===== 🟡 GIỜ THIÊNG [4 SỐ] =====
const HOLY_HOUR_CODES = {
  '0000': '000005', '0101': '010123', '0202': '020205', '0303': '030320',
  '0404': '040429', '0505': '050520', '0606': '060627', '0707': '070700',
  '0808': '080801', '0909': '090900', '1010': '101001', '1111': '111105',
  '1212': '121200', '1313': '131301', '1414': '141401', '1515': '151501',
  '1616': '161601', '1717': '171700', '1818': '181805', '1919': '191900',
  '2020': '202005', '2121': '212101', '2222': '222202', '2323': '232305'
};
const holyHourList = Object.keys(HOLY_HOUR_CODES);

function findNearestHolyHour(hhmm) {
  if (!hhmm || hhmm.length < 4) return hhmm;
  if (HOLY_HOUR_CODES[hhmm]) return hhmm;
  const hh = hhmm.substring(0, 2);
  const mm = parseInt(hhmm.substring(2, 4), 10);
  const sameHH = holyHourList.filter(h => h.startsWith(hh));
  if (sameHH.length > 0) {
    sameHH.sort((a, b) => {
      const mmA = parseInt(a.substring(2, 4), 10);
      const mmB = parseInt(b.substring(2, 4), 10);
      return Math.abs(mmA - mm) - Math.abs(mmB - mm);
    });
    return sameHH[0];
  }
  const targetVal = parseInt(hhmm, 10);
  let closest = holyHourList[0];
  let minDiff = 99999;
  for (const h of holyHourList) {
    const diff = Math.abs(parseInt(h, 10) - targetVal);
    if (diff < minDiff) { minDiff = diff; closest = h; }
  }
  return closest;
}

function wordToHolyHour(word) {
  if (!word) return '';
  const time = encodeWord(word);
  if (!time || time.startsWith('[')) return word;
  const hhmm = time.substring(0, 4);
  return findNearestHolyHour(hhmm);
}

function encodeLineToHoly(text) {
  if (!text) return '';
  const tokens = text.split(TOKEN_REGEX);
  return tokens.map(token => {
    if (!token) return '';
    if (token.match(/^[a-zA-Z0-9_\u00C0-\u024F\u1E00-\u1EFF]+$/)) {
      return wordToHolyHour(token) || token;
    }
    return token;
  }).join('');
}

// ===== ✨ KỲ QUAN GẦN NHẤT (TWINS) =====
const twinsWordMap = new Map();
if (Array.isArray(TWINS_DATA)) {
  TWINS_DATA.forEach(t => {
    if (t.word && t.code) twinsWordMap.set(t.word.toLowerCase(), t.code);
  });
}

function encodeLineToTwins(text) {
  if (!text) return '';
  const tokens = text.split(TOKEN_REGEX);
  return tokens.map(token => {
    if (!token) return '';
    if (token.match(/^[a-zA-Z0-9_\u00C0-\u024F\u1E00-\u1EFF]+$/)) {
      const lower = token.toLowerCase();
      if (twinsWordMap.has(lower)) return twinsWordMap.get(lower);
      const b60 = timeToBase60(encodeWord(token));
      return b60 || token;
    }
    return token;
  }).join('');
}

// ===== 🟣 BASE60 ENCODERS =====
function encodeLineToBase60(text) {
  if (!text) return '';
  const tokens = text.split(TOKEN_REGEX);
  return tokens.map(token => {
    if (!token) return '';
    if (token.match(/^[a-zA-Z0-9_\u00C0-\u024F\u1E00-\u1EFF]+$/)) {
      const timeCode = encodeWord(token);
      const b60 = timeToBase60(timeCode);
      return b60 || token;
    }
    return token;
  }).join('');
}

function encodeLineToBase60Continuous(text) {
  if (!text) return '';
  const tokens = text.split(TOKEN_REGEX);
  let res = '';
  tokens.forEach(token => {
    if (!token) return;
    if (token.match(/^[a-zA-Z0-9_\u00C0-\u024F\u1E00-\u1EFF]+$/)) {
      const timeCode = encodeWord(token);
      const b60 = timeToBase60(timeCode);
      res += (b60 || token);
    } else if (token === ' ' || token === '\t') {
      // bỏ khoảng trắng thường
    } else {
      res += token;
    }
  });
  return res;
}

// ===== ⚡ CVNSS4 ENCODER =====
function encodeLineToCVNSS4(text) {
  if (!text) return '';
  const tokens = text.split(TOKEN_REGEX);
  return tokens.map(token => {
    if (!token) return '';
    if (token.match(/^[a-zA-Z0-9_\u00C0-\u024F\u1E00-\u1EFF]+$/)) {
      return encodeCVNSS4Word(token) || token;
    }
    return token;
  }).join('');
}

// ===== 🖋️ VISCRIPT FONT PUA ENCODER =====
let V2B_MAPPING = null;
fetch('/v2b-mapping.json')
  .then(res => res.ok ? res.json() : null)
  .then(data => { V2B_MAPPING = data; })
  .catch(() => {});

function encodeToV2bPua(text) {
  if (!text) return '';
  if (!V2B_MAPPING) return text;
  const regex = /([a-zA-Z\u00C0-\u024F\u1E00-\u1EFF]+)|([^a-zA-Z\u00C0-\u024F\u1E00-\u1EFF]+)/g;
  let res = '';
  let match;
  while ((match = regex.exec(text)) !== null) {
    if (match[1]) {
      const cp = V2B_MAPPING[match[1].toLowerCase()];
      if (cp !== undefined) res += String.fromCodePoint(cp);
      else res += match[1];
    } else if (match[2]) {
      res += match[2];
    }
  }
  return res;
}

// ====================================================================
// 📝 CORE FORMATTER FOR 15 BOX TYPES
// ====================================================================
export function encodeLineByFormat(line, formatId) {
  switch (formatId) {
    case 'group-text':
      return line;
    case 'group-compressed':
      return encodeLineToBase60(line);
    case 'group-continuous':
      return encodeLineToBase60Continuous(line);
    case 'group-holy':
      return encodeLineToHoly(line);
    case 'group-twins':
      return encodeLineToTwins(line);
    case 'group-cyber-font':
      return encodeLineToBase60(line); // Base60 để font TTF chuyển hóa
    case 'group-viscript-font':
      return encodeToV2bPua(line);
    case 'group-unicode-symbols':
      return b60ToUnicodeSymbols(encodeLineToBase60(line));
    case 'group-time':
      return encodeLineToTime(line);
    case 'group-time5':
      return timeTo5Digit(encodeLineToTime(line));
    case 'group-cvnss4':
      return encodeLineToCVNSS4(line);
    case 'group-fakeviet':
      return toFakeViet(line);
    case 'group-fakeviet-minimal':
      return toFakeVietMinimal(line);
    case 'group-camel':
      return toCamelCase(line);
    case 'group-noaccent':
      return toNoAccentContinuous(line);
    default:
      return line;
  }
}

// ====================================================================
// 🎬 SRT PARSER & SERIALIZER
// ====================================================================
export function parseSRT(srtString) {
  if (!srtString || !srtString.trim()) return [];

  const normalized = srtString.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const blocks = normalized.split(/\n\s*\n+/);
  const items = [];

  const timeRegex = /(\d{1,2}:\d{2}:\d{2}[,\.]\d{3})\s*-->\s*(\d{1,2}:\d{2}:\d{2}[,\.]\d{3})/;

  blocks.forEach((block) => {
    const rawLines = block.trim().split('\n').map(l => l.trim()).filter(l => l.length > 0);
    if (rawLines.length === 0) return;

    let index = '';
    let timestamp = '';
    let textStartIndex = 0;

    if (/^\d+$/.test(rawLines[0])) {
      index = rawLines[0];
      textStartIndex = 1;
    } else {
      index = String(items.length + 1);
    }

    if (rawLines[textStartIndex] && timeRegex.test(rawLines[textStartIndex])) {
      timestamp = rawLines[textStartIndex];
      textStartIndex++;
    } else if (rawLines[0] && timeRegex.test(rawLines[0])) {
      timestamp = rawLines[0];
      index = String(items.length + 1);
      textStartIndex = 1;
    }

    const textLines = rawLines.slice(textStartIndex);

    if (timestamp && textLines.length > 0) {
      items.push({
        index: index || String(items.length + 1),
        timestamp,
        textLines
      });
    }
  });

  return items;
}

export function generateSRT(items, activeFormatsInOrder) {
  if (!items || items.length === 0) return '';
  if (!activeFormatsInOrder || activeFormatsInOrder.length === 0) {
    activeFormatsInOrder = ['group-text'];
  }

  const outputBlocks = [];

  items.forEach(item => {
    const linesForThisBlock = [];

    activeFormatsInOrder.forEach(fmtId => {
      const translatedLines = item.textLines.map(line => encodeLineByFormat(line, fmtId));
      linesForThisBlock.push(...translatedLines);
    });

    outputBlocks.push(`${item.index}\n${item.timestamp}\n${linesForThisBlock.join('\n')}`);
  });

  return outputBlocks.join('\n\n') + '\n';
}

// ====================================================================
// 💡 SAMPLE VIETNAMESE SRT DATA
// ====================================================================
export const SAMPLE_SRT = `1
00:00:01,200 --> 00:00:04,500
Chào mừng các bạn đến với TimeCypher!

2
00:00:05,100 --> 00:00:08,400
Giao thức nén tiếng Việt siêu cấp và bảo mật dữ liệu.

3
00:00:09,000 --> 00:00:12,850
Phụ đề này đang được hiển thị theo chế độ song mã.

4
00:00:13,500 --> 00:00:17,200
Dòng trên là lời thoại tiếng Việt, dòng dưới là mã nén Base60.

5
00:00:18,000 --> 00:00:22,500
Chúc bạn có những trải nghiệm sáng tạo tuyệt vời!`;

// ====================================================================
// 🖥️ UI INTERACTION CONTROLLER
// ====================================================================
document.addEventListener('DOMContentLoaded', () => {
  const inputSrt = document.getElementById('input-srt');
  const outputSrt = document.getElementById('output-srt');
  const fileInput = document.getElementById('file-input');
  const btnUpload = document.getElementById('btn-upload');
  const btnSample = document.getElementById('btn-sample');
  const btnClear = document.getElementById('btn-clear');
  const btnDownload = document.getElementById('btn-download');
  const btnCopy = document.getElementById('btn-copy');
  const btnPaste = document.getElementById('btn-paste');

  // Quick preset buttons
  const btnPresetMinimal = document.getElementById('btn-preset-minimal');
  const btnPresetOnlyB60 = document.getElementById('btn-preset-only-b60');
  const btnPresetOnlyText = document.getElementById('btn-preset-only-text');
  const btnPresetAll = document.getElementById('btn-preset-all');
  const btnPresetReset = document.getElementById('btn-preset-reset');

  // Layers List Container
  const layersListEl = document.getElementById('subtitle-layers-list');
  const badgeActiveLayers = document.getElementById('badge-active-layers');

  // Thống kê
  const statInputLines = document.getElementById('stat-input-lines');
  const statInputWords = document.getElementById('stat-input-words');
  const statInputBytes = document.getElementById('stat-input-bytes');
  const statOutputLines = document.getElementById('stat-output-lines');
  const statOutputBytes = document.getElementById('stat-output-bytes');
  const statOutputRatio = document.getElementById('stat-output-ratio');

  // Visual Mockup Player
  const playerSubDisplay = document.getElementById('player-sub-display');
  const playerTimestamp = document.getElementById('player-timestamp');
  const playerCounter = document.getElementById('player-counter');
  const btnPlayerPrev = document.getElementById('btn-player-prev');
  const btnPlayerNext = document.getElementById('btn-player-next');
  const btnPlayerPlay = document.getElementById('btn-player-play');

  // --- STATE QUẢN LÝ THỨ TỰ & TRẠNG THÁI BẬT/TẮT CÁC TẦNG ---
  let subOrder = [...DEFAULT_ORDER];
  let subActiveFormats = [...DEFAULT_ACTIVE];

  // Khôi phục từ localStorage nếu có
  try {
    const savedOrder = localStorage.getItem('vsn_sub_order');
    if (savedOrder) {
      const parsed = JSON.parse(savedOrder);
      if (Array.isArray(parsed) && parsed.length > 0) {
        subOrder = parsed.filter(id => DEFAULT_ORDER.includes(id));
        DEFAULT_ORDER.forEach(id => { if (!subOrder.includes(id)) subOrder.push(id); });
      }
    }
    const savedActive = localStorage.getItem('vsn_sub_active');
    if (savedActive) {
      const parsed = JSON.parse(savedActive);
      if (Array.isArray(parsed) && parsed.length > 0) {
        subActiveFormats = parsed.filter(id => DEFAULT_ORDER.includes(id));
      }
    }
  } catch (e) {
    console.error(e);
  }

  let currentParsedItems = [];
  let currentPlayerIndex = 0;
  let autoPlayTimer = null;

  const defMap = new Map(SUB_FORMATS.map(f => [f.id, f]));

  function getActiveFormatsInOrder() {
    return subOrder.filter(id => subActiveFormats.includes(id));
  }

  function saveState() {
    localStorage.setItem('vsn_sub_order', JSON.stringify(subOrder));
    localStorage.setItem('vsn_sub_active', JSON.stringify(subActiveFormats));
  }

  // ===== RENDER DANH SÁCH TẦNG PHỤ ĐỀ (CÓ NÚT ▲ ▼ VÀ CHECKBOX) =====
  function renderLayersList() {
    if (!layersListEl) return;
    const prevScroll = layersListEl.scrollTop;
    layersListEl.innerHTML = '';

    const activeInOrder = getActiveFormatsInOrder();

    subOrder.forEach((id, index) => {
      const def = defMap.get(id);
      if (!def) return;

      const isChecked = subActiveFormats.includes(id);
      const isFirst = index === 0;
      const isLast = index === subOrder.length - 1;
      const activeLineNumber = isChecked ? (activeInOrder.indexOf(id) + 1) : null;

      const row = document.createElement('div');
      row.className = 'layer-row-item';
      row.style.cssText = `display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 5px 8px; min-height: 36px; border-radius: 5px; background: ${isChecked ? 'rgba(0, 255, 204, 0.04)' : '#020905'}; border: 1px solid ${isChecked ? (def.color || '#00ffcc') : '#15251c'}; transition: all 0.15s;`;

      // 1. Cụm nút ▲ ▼
      const reorderDiv = document.createElement('div');
      reorderDiv.style.cssText = 'display: flex; gap: 3px; flex-shrink: 0;';

      const btnUp = document.createElement('button');
      btnUp.innerHTML = '▲';
      btnUp.title = isFirst ? 'Đang ở trên cùng' : 'Đưa tầng này lên trên (ưu tiên dòng trước)';
      btnUp.disabled = isFirst;
      btnUp.style.cssText = `width: 24px; height: 24px; background: #00150c; border: 1px solid ${isFirst ? '#1c2b22' : '#00ffcc'}; color: ${isFirst ? '#3a4f43' : '#00ffcc'}; border-radius: 4px; font-size: 11px; cursor: ${isFirst ? 'default' : 'pointer'}; display: flex; align-items: center; justify-content: center; padding: 0;`;
      if (!isFirst) {
        btnUp.addEventListener('click', (e) => {
          e.stopPropagation();
          const temp = subOrder[index];
          subOrder[index] = subOrder[index - 1];
          subOrder[index - 1] = temp;
          saveState();
          renderLayersList();
          renderOutput();
        });
      }

      const btnDown = document.createElement('button');
      btnDown.innerHTML = '▼';
      btnDown.title = isLast ? 'Đang ở dưới cùng' : 'Đưa tầng này xuống dưới';
      btnDown.disabled = isLast;
      btnDown.style.cssText = `width: 24px; height: 24px; background: #00150c; border: 1px solid ${isLast ? '#1c2b22' : '#00ffcc'}; color: ${isLast ? '#3a4f43' : '#00ffcc'}; border-radius: 4px; font-size: 11px; cursor: ${isLast ? 'default' : 'pointer'}; display: flex; align-items: center; justify-content: center; padding: 0;`;
      if (!isLast) {
        btnDown.addEventListener('click', (e) => {
          e.stopPropagation();
          const temp = subOrder[index];
          subOrder[index] = subOrder[index + 1];
          subOrder[index + 1] = temp;
          saveState();
          renderLayersList();
          renderOutput();
        });
      }

      reorderDiv.appendChild(btnUp);
      reorderDiv.appendChild(btnDown);

      // 2. Checkbox & Nhãn
      const label = document.createElement('label');
      label.style.cssText = 'display: flex; align-items: center; gap: 8px; flex: 1; min-width: 0; cursor: pointer; user-select: none; margin: 0;';

      const chk = document.createElement('input');
      chk.type = 'checkbox';
      chk.checked = isChecked;
      chk.style.cssText = `accent-color: ${def.color}; width: 16px; height: 16px; flex-shrink: 0; cursor: pointer;`;
      chk.addEventListener('change', () => {
        if (chk.checked) {
          if (!subActiveFormats.includes(id)) subActiveFormats.push(id);
        } else {
          subActiveFormats = subActiveFormats.filter(x => x !== id);
        }
        saveState();
        renderLayersList();
        renderOutput();
      });

      const spanText = document.createElement('span');
      spanText.style.cssText = `font-size: 12.5px; color: ${isChecked ? '#fff' : '#66776c'}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-family: monospace; font-weight: ${isChecked ? 'bold' : 'normal'};`;
      spanText.textContent = `${index + 1}. ${def.icon} ${def.shortLabel}`;

      label.appendChild(chk);
      label.appendChild(spanText);

      // 3. Tag chỉ thị thứ tự dòng xuất hiện trong phụ đề
      const tagLine = document.createElement('span');
      if (isChecked) {
        tagLine.textContent = `[Dòng ${activeLineNumber}]`;
        tagLine.style.cssText = `font-size: 11px; color: ${def.color || '#00ffcc'}; background: rgba(0, 255, 204, 0.1); border: 1px solid ${def.color || '#00ffcc'}; padding: 1px 6px; border-radius: 3px; font-weight: bold; flex-shrink: 0;`;
      } else {
        tagLine.textContent = `[Tắt]`;
        tagLine.style.cssText = `font-size: 10.5px; color: #44554b; flex-shrink: 0;`;
      }

      row.appendChild(reorderDiv);
      row.appendChild(label);
      row.appendChild(tagLine);

      layersListEl.appendChild(row);
    });

    layersListEl.scrollTop = prevScroll;
    updateLayerBadge(activeInOrder);
  }

  function updateLayerBadge(activeInOrder) {
    if (!badgeActiveLayers) return;
    if (activeInOrder.length === 0) {
      badgeActiveLayers.textContent = '⚠️ Chưa chọn tầng nào (Phụ đề sẽ xuất Tiếng Việt gốc)';
      badgeActiveLayers.style.color = '#ffaa00';
      return;
    }
    const names = activeInOrder.map((id, i) => {
      const d = defMap.get(id);
      return `Dòng ${i + 1}: ${d ? d.shortLabel : id}`;
    }).join(' ➜ ');
    badgeActiveLayers.textContent = `Đang bật ${activeInOrder.length} tầng: ${names}`;
    badgeActiveLayers.style.color = '#00ffcc';
  }

  function renderOutput() {
    const rawInput = inputSrt ? inputSrt.value : '';
    currentParsedItems = parseSRT(rawInput);
    const activeInOrder = getActiveFormatsInOrder();

    if (currentParsedItems.length === 0) {
      if (outputSrt) outputSrt.value = '';
      updateStats(rawInput, '');
      renderMockupPlayer();
      return;
    }

    const generated = generateSRT(currentParsedItems, activeInOrder);
    if (outputSrt) outputSrt.value = generated;

    updateStats(rawInput, generated);
    renderMockupPlayer();
  }

  function updateStats(inText, outText) {
    const inBytes = new TextEncoder().encode(inText).length;
    const outBytes = new TextEncoder().encode(outText).length;
    const totalWords = inText.trim().split(/\s+/).filter(w => w.length > 0).length;

    if (statInputLines) statInputLines.textContent = `${currentParsedItems.length} câu`;
    if (statInputWords) statInputWords.textContent = `${totalWords} từ`;
    if (statInputBytes) statInputBytes.textContent = `${inBytes.toLocaleString()} B`;

    if (statOutputLines) statOutputLines.textContent = `${currentParsedItems.length} câu`;
    if (statOutputBytes) statOutputBytes.textContent = `${outBytes.toLocaleString()} B`;
    if (statOutputRatio) {
      if (inBytes > 0 && outBytes > 0) {
        const pct = Math.round((outBytes / inBytes) * 100);
        statOutputRatio.textContent = `${pct}% so với gốc`;
        statOutputRatio.style.color = pct <= 100 ? '#00ff66' : '#ffaa00';
      } else {
        statOutputRatio.textContent = '-';
      }
    }
  }

  // ===== LIVE MOCKUP VIDEO SUBTITLE PLAYER =====
  function renderMockupPlayer() {
    if (!playerSubDisplay) return;
    if (currentParsedItems.length === 0) {
      playerSubDisplay.innerHTML = '<span style="color:#555;font-size:13px;">(Chưa có phụ đề để xem thử)</span>';
      if (playerTimestamp) playerTimestamp.textContent = '00:00:00,000 --> 00:00:00,000';
      if (playerCounter) playerCounter.textContent = '0 / 0';
      return;
    }

    if (currentPlayerIndex >= currentParsedItems.length) currentPlayerIndex = 0;
    if (currentPlayerIndex < 0) currentPlayerIndex = currentParsedItems.length - 1;

    const item = currentParsedItems[currentPlayerIndex];
    const activeInOrder = getActiveFormatsInOrder();
    const effectiveFormats = activeInOrder.length > 0 ? activeInOrder : ['group-text'];

    if (playerTimestamp) playerTimestamp.textContent = item.timestamp;
    if (playerCounter) playerCounter.textContent = `${currentPlayerIndex + 1} / ${currentParsedItems.length}`;

    // Render từng dòng theo style phụ đề video
    let html = '';
    effectiveFormats.forEach((fmtId, i) => {
      const def = defMap.get(fmtId);
      const translated = item.textLines.map(l => encodeLineByFormat(l, fmtId)).join(' ');
      const colorStyle = def ? def.color : '#ffffff';

      html += `<div style="color:${colorStyle}; font-size:16.5px; font-family:monospace; font-weight:bold; text-shadow: 0 0 4px #000, 1.5px 1.5px 2px #000, -1.5px -1.5px 2px #000; margin: 3px 0; letter-spacing: 0.5px;">${translated}</div>`;
    });

    playerSubDisplay.innerHTML = html;
  }

  // Mockup Controls
  if (btnPlayerPrev) {
    btnPlayerPrev.addEventListener('click', () => {
      if (currentParsedItems.length === 0) return;
      currentPlayerIndex--;
      renderMockupPlayer();
    });
  }

  if (btnPlayerNext) {
    btnPlayerNext.addEventListener('click', () => {
      if (currentParsedItems.length === 0) return;
      currentPlayerIndex++;
      renderMockupPlayer();
    });
  }

  if (btnPlayerPlay) {
    btnPlayerPlay.addEventListener('click', () => {
      if (autoPlayTimer) {
        clearInterval(autoPlayTimer);
        autoPlayTimer = null;
        btnPlayerPlay.textContent = '▶ Tự chạy';
        btnPlayerPlay.style.borderColor = '#00ffcc';
        btnPlayerPlay.style.color = '#00ffcc';
      } else {
        if (currentParsedItems.length === 0) return;
        btnPlayerPlay.textContent = '⏸ Tạm dừng';
        btnPlayerPlay.style.borderColor = '#ffaa00';
        btnPlayerPlay.style.color = '#ffaa00';
        autoPlayTimer = setInterval(() => {
          currentPlayerIndex++;
          renderMockupPlayer();
        }, 2800);
      }
    });
  }

  // ===== PRESET BUTTONS =====
  if (btnPresetMinimal) {
    btnPresetMinimal.addEventListener('click', () => {
      subActiveFormats = ['group-text', 'group-compressed'];
      saveState();
      renderLayersList();
      renderOutput();
      showToast('📌 Đã chọn cấu hình Gọn: Tiếng Việt gốc + Base60');
    });
  }

  if (btnPresetOnlyB60) {
    btnPresetOnlyB60.addEventListener('click', () => {
      subActiveFormats = ['group-compressed'];
      saveState();
      renderLayersList();
      renderOutput();
      showToast('🟣 Đã chọn: Chỉ mã nén Base60');
    });
  }

  if (btnPresetOnlyText) {
    btnPresetOnlyText.addEventListener('click', () => {
      subActiveFormats = ['group-text'];
      saveState();
      renderLayersList();
      renderOutput();
      showToast('🟢 Đã chọn: Chỉ Tiếng Việt gốc');
    });
  }

  if (btnPresetAll) {
    btnPresetAll.addEventListener('click', () => {
      subActiveFormats = [...DEFAULT_ORDER];
      saveState();
      renderLayersList();
      renderOutput();
      showToast('⚡ Đã bật toàn bộ 15 tầng mã');
    });
  }

  if (btnPresetReset) {
    btnPresetReset.addEventListener('click', () => {
      subOrder = [...DEFAULT_ORDER];
      subActiveFormats = [...DEFAULT_ACTIVE];
      saveState();
      renderLayersList();
      renderOutput();
      showToast('🔄 Đã đặt lại thứ tự và cấu hình mặc định');
    });
  }

  // Textarea input
  if (inputSrt) {
    inputSrt.addEventListener('input', () => {
      renderOutput();
    });
  }

  // Upload File
  if (btnUpload && fileInput) {
    btnUpload.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (evt) => {
        if (inputSrt) inputSrt.value = evt.target.result;
        renderOutput();
        showToast(`📁 Đã nạp file: ${file.name}`);
      };
      reader.readAsText(file, 'utf-8');
      fileInput.value = '';
    });
  }

  // Drag & Drop on input area
  const dropZone = document.getElementById('drop-zone');
  if (dropZone) {
    ['dragenter', 'dragover'].forEach(name => {
      dropZone.addEventListener(name, (e) => {
        e.preventDefault();
        dropZone.classList.add('drag-over');
      });
    });
    ['dragleave', 'drop'].forEach(name => {
      dropZone.addEventListener(name, (e) => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
      });
    });
    dropZone.addEventListener('drop', (e) => {
      const dt = e.dataTransfer;
      const file = dt.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (evt) => {
          if (inputSrt) inputSrt.value = evt.target.result;
          renderOutput();
          showToast(`📁 Đã nạp file kéo thả: ${file.name}`);
        };
        reader.readAsText(file, 'utf-8');
      }
    });
  }

  // Sample SRT
  if (btnSample) {
    btnSample.addEventListener('click', () => {
      if (inputSrt) inputSrt.value = SAMPLE_SRT;
      currentPlayerIndex = 0;
      renderOutput();
      showToast('💡 Đã nạp mẫu phụ đề tiếng Việt chuẩn!');
    });
  }

  // Clear
  if (btnClear) {
    btnClear.addEventListener('click', () => {
      if (inputSrt) inputSrt.value = '';
      if (outputSrt) outputSrt.value = '';
      currentParsedItems = [];
      currentPlayerIndex = 0;
      if (autoPlayTimer) {
        clearInterval(autoPlayTimer);
        autoPlayTimer = null;
        if (btnPlayerPlay) {
          btnPlayerPlay.textContent = '▶ Tự chạy';
          btnPlayerPlay.style.color = '#00ffcc';
        }
      }
      renderOutput();
      showToast('🗑️ Đã làm sạch toàn bộ nội dung');
    });
  }

  // Paste from clipboard
  if (btnPaste) {
    btnPaste.addEventListener('click', async () => {
      try {
        const text = await navigator.clipboard.readText();
        if (text && inputSrt) {
          inputSrt.value = text;
          renderOutput();
          showToast('📋 Đã dán phụ đề từ Clipboard!');
        }
      } catch (err) {
        showToast('⚠️ Không thể đọc clipboard tự động, hãy bấm Ctrl+V!');
      }
    });
  }

  // Copy Output
  if (btnCopy) {
    btnCopy.addEventListener('click', () => {
      const text = outputSrt ? outputSrt.value : '';
      if (!text.trim()) {
        showToast('⚠️ Không có nội dung để sao chép!');
        return;
      }
      if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(text).then(() => {
          showToast('✓ Đã sao chép toàn bộ file SRT vào Clipboard!');
        });
      } else {
        outputSrt.select();
        document.execCommand('copy');
        showToast('✓ Đã sao chép toàn bộ file SRT vào Clipboard!');
      }
    });
  }

  // Download .SRT File
  if (btnDownload) {
    btnDownload.addEventListener('click', () => {
      const text = outputSrt ? outputSrt.value : '';
      if (!text.trim()) {
        showToast('⚠️ Chưa có nội dung phụ đề để tải về!');
        return;
      }

      const activeInOrder = getActiveFormatsInOrder();
      const tag = activeInOrder.map(id => id.replace('group-', '')).join('_') || 'cipher';
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
      const filename = `sub_${tag}_${timestamp}.srt`;

      const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showToast(`📥 Đã tải về: ${filename}`);
    });
  }

  // Toast Helper
  function showToast(msg) {
    let container = document.getElementById('exp-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'exp-toast-container';
      container.style.cssText = 'position:fixed;bottom:20px;right:20px;z-index:99999;display:flex;flex-direction:column;gap:8px;pointer-events:none;';
      document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = 'exp-toast';
    toast.textContent = msg;
    toast.style.cssText = 'background:rgba(5,20,15,0.95);color:#00ffcc;border:1px solid #00ffcc;padding:8px 14px;border-radius:5px;font-family:monospace;font-size:12px;box-shadow:0 4px 15px rgba(0,255,204,0.3);animation:fadeIn 0.2s;';
    container.appendChild(toast);
    setTimeout(() => { toast.remove(); }, 2200);
  }

  // Khởi chạy render danh sách và phụ đề ban đầu
  renderLayersList();
  if (inputSrt && !inputSrt.value.trim()) {
    inputSrt.value = SAMPLE_SRT;
    renderOutput();
  }
});
