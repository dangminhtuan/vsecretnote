import { encodeWord, timeToBase60, decodeWord, base60ToTime } from './vcomp.js';
import TWINS_DATA from './twins_data_full.json';

export { TWINS_DATA };

// --- AUDIO SPEECH SYNTHESIS (TTS) ---
export function speakWordAndCode(word, code) {
  if (!('speechSynthesis' in window)) {
    alert('Trình duyệt của bạn không hỗ trợ tính năng đọc phát âm (Web Speech API).');
    return;
  }

  window.speechSynthesis.cancel();

  // 1. Speak the Vietnamese word
  const uWord = new SpeechSynthesisUtterance(word);
  uWord.lang = 'vi-VN';
  uWord.rate = 0.92;

  // 2. Speak the Base60 characters in English
  const spelledCode = code.split('').map(c => {
    if (c === c.toUpperCase() && c !== c.toLowerCase()) {
      return 'Capital ' + c;
    }
    return c;
  }).join(', ');

  const uCode = new SpeechSynthesisUtterance(spelledCode);
  uCode.lang = 'en-US';
  uCode.rate = 0.88;

  window.speechSynthesis.speak(uWord);
  setTimeout(() => {
    window.speechSynthesis.speak(uCode);
  }, 700);
}

// --- DYNAMIC WORD ANALYZER ---
export function analyzeAnyWord(input) {
  input = input.trim();
  if (!input) return null;

  // 1. Prioritize Vietnamese word encoding first
  const time = encodeWord(input);
  if (time && !time.startsWith('[')) {
    const code = timeToBase60(time);
    return analyzeWordResult(input, code, time);
  }

  // 2. Fallback: check if input is a valid 3-char Base60 code
  if (input.length === 3 && /^[a-zA-Z0-9]{3}$/.test(input)) {
    const bTime = base60ToTime(input);
    if (bTime && bTime.length === 6 && /^\d{6}$/.test(bTime)) {
      const decoded = decodeWord(bTime);
      if (decoded && !decoded.startsWith('[')) {
        return analyzeWordResult(decoded, input, bTime);
      }
    }
  }

  return {
    word: input,
    code: '---',
    isTwin: false,
    message: 'Từ không có trong quy tắc âm học tiếng Việt của Base60.'
  };
}

function analyzeWordResult(word, code, time) {
  const c1 = code[0];
  const c2 = code[1];
  const c3 = code[2];
  const l1 = c1.toLowerCase();
  const l2 = c2.toLowerCase();
  const l3 = c3.toLowerCase();

  let pattern = '';
  let patternName = '';
  let rep = '';
  let swipe = '';

  if (l1 === l2 && l2 === l3) {
    pattern = 'triple';
    patternName = 'Tam Hoa (Triple 3x)';
    rep = c1 + ' × 3';
    swipe = `Chạm nhấp 3 lần tại phím ${l1.toUpperCase()} (hoặc xoay vòng 2 lần)`;
  } else if (l2 === l3) {
    pattern = 'tail';
    patternName = 'Lặp Đuôi (Tail Double)';
    rep = `${c2} + ${c3}`;
    swipe = `Vuốt ${l1.toUpperCase()} ➔ ${l2.toUpperCase()}, xoay nhẹ hoặc bật ngược tại ${l2.toUpperCase()}`;
  } else if (l1 === l2) {
    pattern = 'head';
    patternName = 'Lặp Đầu (Head Double)';
    rep = `${c1} + ${c2}`;
    swipe = `Bấm đúp/xoay vòng tại ${l1.toUpperCase()} ➔ trượt sang ${l3.toUpperCase()}`;
  } else if (l1 === l3) {
    pattern = 'sandwich';
    patternName = 'Kẹp Sandwich';
    rep = `${c1} ... ${c3}`;
    swipe = `Vuốt ${l1.toUpperCase()} ➔ ${l2.toUpperCase()} ➔ quay ngược về ${l3.toUpperCase()}`;
  }

  return {
    word,
    code,
    time,
    isTwin: !!pattern,
    pattern,
    patternName,
    rep,
    swipe,
    breakdown: `C1=${c1} (${time.substring(0,2)}) • C2=${c2} (${time.substring(2,4)}) • C3=${c3} (${time.substring(4,6)})`
  };
}
