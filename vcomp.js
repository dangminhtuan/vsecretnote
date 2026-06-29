import {
  TONES, CONSONANTS_BASE, CONSONANTS_EXTRA,
  RHYMES_BASE, RHYMES_EXTRA_1, RHYMES_EXTRA_2, ENGLISH_DICT, SHORTCUT_WORDS, TWO_DIGIT_WORDS,
  BASE60_MAPPING
} from './data.js';

// --- PHONETICS ENGINE ---
const removeVietnameseTones = (str) => {
  let tone = 0;
  const nfd = str.normalize('NFD');
  if (nfd.includes('\u0301')) tone = 1;      // sắc
  else if (nfd.includes('\u0300')) tone = 2; // huyền
  else if (nfd.includes('\u0309')) tone = 3; // hỏi
  else if (nfd.includes('\u0303')) tone = 4; // ngã
  else if (nfd.includes('\u0323')) tone = 5; // nặng
  
  const clean = nfd.replace(/[\u0301\u0300\u0309\u0303\u0323]/g, '').normalize('NFC');
  return [clean, tone];
};

const extractPhonetics = (word) => {
  word = word.toLowerCase();
  const [cleanWord, tone] = removeVietnameseTones(word);
  
  let consonant = '';
  let rhyme = cleanWord;
  
  const consList = [...CONSONANTS_BASE, ...CONSONANTS_EXTRA]
                    .filter(c => c && c.length > 0)
                    .sort((a,b) => b.length - a.length);
  
  for (const c of consList) {
    if (cleanWord.startsWith(c)) {
      consonant = c;
      rhyme = cleanWord.substring(c.length);
      break;
    }
  }

  if (consonant === 'gi') {
    if (rhyme === '') {
      rhyme = 'i';
    } else if (rhyme.startsWith('ê')) {
      rhyme = 'i' + rhyme;
    } else if (!/^[aăâeêioôơuưy]/.test(rhyme)) {
      rhyme = 'i' + rhyme;
    }
  }
  return { consonant, rhyme, tone };
};

const applyTone = (rhyme, tone) => {
  if (tone === 0 || !rhyme) return rhyme;
  const marks = ['', '\u0301', '\u0300', '\u0309', '\u0303', '\u0323'];
  const m = marks[tone];
  
  const VOWEL_PRIORITY = ['a', 'ă', 'â', 'e', 'ê', 'o', 'ô', 'ơ', 'y', 'ư', 'u', 'i'];
  for (let v of VOWEL_PRIORITY) {
    if (rhyme.includes(v)) {
      let idx = rhyme.indexOf(v);
      return (rhyme.substring(0, idx+1) + m + rhyme.substring(idx+1)).normalize('NFC');
    }
  }
  return rhyme + m;
};

// --- ENCODER ---
let shortcutDecodeMap = null;

export const encodeWord = (word, bypassShortcut = false) => {
  word = word.toLowerCase();
  
  if (!bypassShortcut) {
    const twoDigitIndex = TWO_DIGIT_WORDS.indexOf(word);
    if (twoDigitIndex !== -1) {
      return twoDigitIndex.toString().padStart(2, '0');
    }
  }

  const engIndex = ENGLISH_DICT.indexOf(word);
  if (engIndex !== -1 && !SHORTCUT_WORDS.includes(word)) {
    const s2State = Math.floor(engIndex / 1440) + 6;
    const remainder = engIndex % 1440;
    const hh = Math.floor(remainder / 60);
    const mm = remainder % 60;
    return `${hh.toString().padStart(2,'0')}${mm.toString().padStart(2,'0')}0${s2State}`;
  }

  const { consonant, rhyme, tone } = extractPhonetics(word);
  
  let cBaseIdx = CONSONANTS_BASE.indexOf(consonant);
  for (let i = 0; i < CONSONANTS_BASE.length; i++) {
    if (CONSONANTS_BASE[i] === consonant && RHYMES_BASE[i] === rhyme) {
      cBaseIdx = i;
      break;
    }
  }
  
  let cExtraIdx = CONSONANTS_EXTRA.indexOf(consonant);
  
  let rBaseIdx = RHYMES_BASE.indexOf(rhyme);
  if (cBaseIdx !== -1 && RHYMES_BASE[cBaseIdx] === rhyme) {
    rBaseIdx = cBaseIdx;
  }
  
  let rExtra1Idx = RHYMES_EXTRA_1.indexOf(rhyme);
  let rExtra2Idx = RHYMES_EXTRA_2.indexOf(rhyme);

  let hh = -1, mm = -1;
  let s1 = tone;
  let s2 = 0;

  if (cBaseIdx !== -1) {
    hh = cBaseIdx;
    if (rBaseIdx !== -1) { mm = rBaseIdx; s2 = 0; }
    else if (rExtra1Idx !== -1) { mm = rExtra1Idx; s2 = 1; }
    else if (rExtra2Idx !== -1) { mm = rExtra2Idx; s2 = 2; }
  } else if (cExtraIdx !== -1) {
    hh = cExtraIdx;
    if (rBaseIdx !== -1) { mm = rBaseIdx; s2 = 3; }
    else if (rExtra1Idx !== -1) { mm = rExtra1Idx; s2 = 4; }
    else if (rExtra2Idx !== -1) { mm = rExtra2Idx; s2 = 5; }
  }
  
  if (hh === -1 || mm === -1) {
    return `"${word}"`;
  }
  
  const fullCode = `${hh.toString().padStart(2,'0')}${mm.toString().padStart(2,'0')}${s1}${s2}`;
  
  if (!bypassShortcut) {
    const hhmm = fullCode.substring(0, 4);
    if (SHORTCUT_WORDS.includes(word)) {
      return hhmm;
    }
    if (fullCode.endsWith('00') && shortcutDecodeMap && !shortcutDecodeMap[hhmm]) {
      return hhmm;
    }
  }
  
  return fullCode;
};

shortcutDecodeMap = {};
SHORTCUT_WORDS.forEach(w => {
  const fullCode = encodeWord(w, true);
  if (fullCode.length === 6 && !fullCode.includes('"')) {
    shortcutDecodeMap[fullCode.substring(0, 4)] = w;
  }
});

// --- DECODER ---
export const decodeWord = (code) => {
  if (code.length === 2) {
    const idx = parseInt(code, 10);
    if (!isNaN(idx) && idx >= 0 && idx < TWO_DIGIT_WORDS.length) {
      return TWO_DIGIT_WORDS[idx];
    }
    return '[ERR:2D]';
  }

  if (code.length === 4) {
    if (shortcutDecodeMap[code]) return shortcutDecodeMap[code];
    code = code + '00';
  }

  if (code.length !== 6) return code;
  const hh = parseInt(code.substring(0,2), 10);
  const mm = parseInt(code.substring(2,4), 10);
  const s1 = parseInt(code.substring(4,5), 10);
  const s2 = parseInt(code.substring(5,6), 10);
  
  if (isNaN(hh) || isNaN(mm) || isNaN(s1) || isNaN(s2)) return code;
  
  if (s2 >= 6 && s2 <= 9) {
    const engIndex = (s2 - 6) * 1440 + (hh * 60) + mm;
    if (engIndex < ENGLISH_DICT.length) {
      return ENGLISH_DICT[engIndex];
    }
    return '[EN-UNKNOWN]';
  }
  
  let consonant = '';
  let rhyme = '';
  
  if (s2 === 0 || s2 === 1 || s2 === 2) {
    if (hh >= CONSONANTS_BASE.length) return '[ERR:HH]';
    consonant = CONSONANTS_BASE[hh];
  } else if (s2 === 3 || s2 === 4 || s2 === 5) {
    if (hh >= CONSONANTS_EXTRA.length) return '[ERR:HH]';
    consonant = CONSONANTS_EXTRA[hh];
  }
  
  if (s2 === 0 || s2 === 3) rhyme = RHYMES_BASE[mm] || '';
  else if (s2 === 1 || s2 === 4) rhyme = RHYMES_EXTRA_1[mm] || '';
  else if (s2 === 2 || s2 === 5) rhyme = RHYMES_EXTRA_2[mm] || '';
  
  if (!rhyme && consonant === '') return '[ERR:RHYME]';

  if (consonant === 'gi' && rhyme.startsWith('iê')) {
    rhyme = rhyme.substring(1);
  }

  const tonedRhyme = applyTone(rhyme, s1);
  return consonant + tonedRhyme;
};

// --- BASE60 COMPRESSION ENGINE ---
export function timeToBase60(timeStr) {
  if (timeStr.includes('?') || timeStr.includes('"') || timeStr.startsWith('[')) return timeStr;
  
  if (timeStr.length === 2) {
    const hh = parseInt(timeStr, 10);
    if (!isNaN(hh)) return BASE60_MAPPING[hh];
  } else if (timeStr.length === 4) {
    const hh = parseInt(timeStr.substring(0,2), 10);
    const mm = parseInt(timeStr.substring(2,4), 10);
    if (!isNaN(hh) && !isNaN(mm)) return BASE60_MAPPING[hh] + BASE60_MAPPING[mm];
  } else if (timeStr.length === 6) {
    const hh = parseInt(timeStr.substring(0,2), 10);
    const mm = parseInt(timeStr.substring(2,4), 10);
    const ss = parseInt(timeStr.substring(4,6), 10);
    if (!isNaN(hh) && !isNaN(mm) && !isNaN(ss)) return BASE60_MAPPING[hh] + BASE60_MAPPING[mm] + BASE60_MAPPING[ss];
  }
  return timeStr;
}

export function base60ToTime(base60Str) {
  if (base60Str.length === 1) {
    const i1 = BASE60_MAPPING.indexOf(base60Str[0]);
    if (i1 !== -1) return i1.toString().padStart(2,'0');
  } else if (base60Str.length === 2) {
    const i1 = BASE60_MAPPING.indexOf(base60Str[0]);
    const i2 = BASE60_MAPPING.indexOf(base60Str[1]);
    if (i1 !== -1 && i2 !== -1) return i1.toString().padStart(2,'0') + i2.toString().padStart(2,'0');
  } else if (base60Str.length === 3) {
    const i1 = BASE60_MAPPING.indexOf(base60Str[0]);
    const i2 = BASE60_MAPPING.indexOf(base60Str[1]);
    const i3 = BASE60_MAPPING.indexOf(base60Str[2]);
    if (i1 !== -1 && i2 !== -1 && i3 !== -1) {
      return i1.toString().padStart(2,'0') + i2.toString().padStart(2,'0') + i3.toString().padStart(2,'0');
    }
  }
  return base60Str;
}

export const TOKEN_REGEX = /("[^"]+"|\[[^\]]+\]|[a-zA-Z0-9À-ỹ_]+)/;
