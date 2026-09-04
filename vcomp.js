import {
  TONES, CONSONANTS_BASE, CONSONANTS_EXTRA,
  RHYMES_BASE, RHYMES_EXTRA_1, RHYMES_EXTRA_2, ENGLISH_DICT,
  BASE60_MAPPING
} from './data.js';

// --- PHONETICS ENGINE ---
export const removeVietnameseTones = (str) => {
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

export const extractPhonetics = (word) => {
  word = word.toLowerCase();
  const [cleanWord, tone] = removeVietnameseTones(word);
  
  let consonant = '';
  let rhyme = cleanWord;
  
  const consList = [...CONSONANTS_BASE, ...CONSONANTS_EXTRA]
                    .filter(c => c !== null && c.length > 0)
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

export const applyTone = (rhyme, tone) => {
  if (tone === 0 || !rhyme) return rhyme;
  const marks = ['', '\u0301', '\u0300', '\u0309', '\u0303', '\u0323'];
  const m = marks[tone];
  
  if (rhyme.startsWith('ưa')) {
    return ('ư' + m + rhyme.substring(1)).normalize('NFC');
  }
  if (rhyme.startsWith('ươ')) {
    return ('ư' + 'ơ' + m + rhyme.substring(2)).normalize('NFC');
  }
  if (rhyme.startsWith('uô')) {
    return ('u' + 'ô' + m + rhyme.substring(2)).normalize('NFC');
  }
  if (rhyme.startsWith('iê')) {
    return ('i' + 'ê' + m + rhyme.substring(2)).normalize('NFC');
  }
  
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
export const encodeWord = (word, bypassShortcut = false) => {
  word = word.toLowerCase();

  // 1. Prioritize Vietnamese Phonetics
  const { consonant, rhyme, tone } = extractPhonetics(word);
  
  let cBaseIdx = -1;
  for (let i = 0; i < CONSONANTS_BASE.length; i++) {
    if (CONSONANTS_BASE[i] === consonant) {
       if (RHYMES_BASE[i] === rhyme) {
         cBaseIdx = i;
         break;
       }
       if (cBaseIdx === -1) cBaseIdx = i;
    }
  }
  
  let cExtraIdx = CONSONANTS_EXTRA.indexOf(consonant);
  
  let rBaseIdx = RHYMES_BASE.indexOf(rhyme);
  if (cBaseIdx !== -1 && RHYMES_BASE[cBaseIdx] === rhyme) {
    rBaseIdx = cBaseIdx; // Prioritize anchor slot
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
  
  if (hh !== -1 && mm !== -1 && (consonant !== '' || rhyme !== '')) {
    const ss = s2 * 6 + s1;
    return `${hh.toString().padStart(2,'0')}${mm.toString().padStart(2,'0')}${ss.toString().padStart(2,'0')}`;
  }

  // 2. Fallback to English dictionary for non-Vietnamese words
  const engIndex = ENGLISH_DICT.indexOf(word);
  if (engIndex !== -1) {
    const ss = 36 + Math.floor(engIndex / 1440);
    const remainder = engIndex % 1440;
    const hh = Math.floor(remainder / 60);
    const mm = remainder % 60;
    return `${hh.toString().padStart(2,'0')}${mm.toString().padStart(2,'0')}${ss.toString().padStart(2,'0')}`;
  }

  return `[${word}]`;
};

// --- DECODER ---
export const decodeWord = (code) => {
  if (code.length !== 6) return code;
  
  const hh = parseInt(code.substring(0,2), 10);
  const mm = parseInt(code.substring(2,4), 10);
  const ss = parseInt(code.substring(4,6), 10);
  
  if (isNaN(hh) || isNaN(mm) || isNaN(ss)) return '[ERR:FORMAT]';
  
  // Vietnamese: ss = s2*6 + s1, max = 5*6+5 = 35
  // English:    ss >= 36 (up to 59), 24 slots x 1440 = 34560 capacity
  if (ss >= 36) {
    const engIndex = (ss - 36) * 1440 + hh * 60 + mm;
    if (engIndex < ENGLISH_DICT.length) {
      return ENGLISH_DICT[engIndex];
    }
    return '[EN-UNKNOWN]';
  }
  
  const s2 = Math.floor(ss / 6);
  const s1 = ss % 6;
  
  let consonant = '';
  let rhyme = '';
  
  const consTable = Math.floor(s2 / 3);
  const rhymeTable = s2 % 3;
  
  if (consTable === 0) {
    if (hh >= CONSONANTS_BASE.length) return '[ERR:HH]';
    consonant = CONSONANTS_BASE[hh] || '';
  } else if (consTable === 1) {
    if (hh >= CONSONANTS_EXTRA.length) return '[ERR:HH]';
    consonant = CONSONANTS_EXTRA[hh] || '';
  }
  
  if (rhymeTable === 0) rhyme = RHYMES_BASE[mm];
  else if (rhymeTable === 1) rhyme = RHYMES_EXTRA_1[mm];
  else if (rhymeTable === 2) rhyme = RHYMES_EXTRA_2[mm];
  
  if (!rhyme && consonant === '') return '[ERR:RHYME]';
  
  let prefix = consonant;
  if (consonant === 'gi' && rhyme) {
    if (rhyme.startsWith('iê')) {
      rhyme = rhyme.substring(1);
    } else if (rhyme.startsWith('i')) {
      prefix = 'g';
    }
  }

  const tonedRhyme = applyTone(rhyme || '', s1);
  return prefix + tonedRhyme;
};

// --- BASE60 COMPRESSION ENGINE (TELEX + VNI ENHANCED) ---
export const BASE60_HH = [
  'c', 'd', 'g', 'G', 'j', 'k', 'K', 'h', 'v', 'D', 'm', 'C', 'r', 's', 'n', 'b', 'l', 'Q', 'S', 'z', 'N', 'y', 'L', 'W'
];
export const BASE60_HH_EXTRA = [
  'p', 'f', 'q', 't', 'T', 'R', 'x'
];
export const BASE60_MM = BASE60_MAPPING;
export const BASE60_SS = [
  // s2=0 (Base Rhyme + Base PA): Telex thường
  'z', 's', 'f', 'r', 'x', 'j',
  // s2=1 (Extra 1 Rhyme + Base PA): Telex hoa
  'Z', 'S', 'F', 'R', 'X', 'J',
  // s2=2 (Extra 2 Rhyme + Base PA): Nguyên âm thường
  'a', 'e', 'i', 'u', 'w', 'y',
  // s2=3 (Base Rhyme + Extra PA): VNI 0-5
  '0', '1', '2', '3', '4', '5',
  // s2=4 (Extra 1 Rhyme + Extra PA): VNI cao 6-9+BC
  '6', '7', '8', '9', 'B', 'C',
  // s2=5 (Extra 2 Rhyme + Extra PA): Nguyên âm HOA (+ o)
  'A', 'E', 'o', 'U', 'W', 'Y',
  // 36..59: English dictionary slots (24 chars)
  'c', 'd', 'g', 'G', 'k', 'K', 'h', 'v', 'D', 'm', 'n', 'b', 'l', 'Q', 'N', 'L', 'p', 'q', 't', 'T', 'H', 'M', 'P', 'V'
];

export function timeToBase60(timeStr) {
  if (timeStr.includes('?') || timeStr.startsWith('[')) return timeStr;
  
  let processStr = timeStr;
  if (processStr.length === 4 && !isNaN(processStr)) {
      processStr += '00';
  }
  
  if (processStr.length === 6) {
    const hh = parseInt(processStr.substring(0,2), 10);
    const mm = parseInt(processStr.substring(2,4), 10);
    const ss = parseInt(processStr.substring(4,6), 10);
    if (!isNaN(hh) && !isNaN(mm) && !isNaN(ss)) {
      if (ss >= 36) {
        return BASE60_MAPPING[hh] + BASE60_MAPPING[mm] + BASE60_SS[ss];
      }
      const s2 = Math.floor(ss / 6);
      const isExtra = s2 >= 3 && s2 <= 5;
      const c1 = isExtra ? (BASE60_HH_EXTRA[hh] || BASE60_MAPPING[hh]) : (BASE60_HH[hh] || BASE60_MAPPING[hh]);
      const c2 = BASE60_MM[mm] || BASE60_MAPPING[mm];
      const c3 = BASE60_SS[ss] || BASE60_MAPPING[ss];
      return c1 + c2 + c3;
    }
  }
  return timeStr;
}

export function base60ToTime(base60Str) {
  if (base60Str.length === 3) {
    const c1 = base60Str[0];
    const c2 = base60Str[1];
    const c3 = base60Str[2];

    const ss = BASE60_SS.indexOf(c3);
    if (ss !== -1) {
      if (ss >= 36) {
        const hh = BASE60_MAPPING.indexOf(c1);
        const mm = BASE60_MAPPING.indexOf(c2);
        if (hh !== -1 && mm !== -1) {
          return hh.toString().padStart(2,'0') + mm.toString().padStart(2,'0') + ss.toString().padStart(2,'0');
        }
      } else {
        const s2 = Math.floor(ss / 6);
        const isExtra = s2 >= 3 && s2 <= 5;
        const hh = isExtra ? BASE60_HH_EXTRA.indexOf(c1) : BASE60_HH.indexOf(c1);
        const mm = BASE60_MM.indexOf(c2);
        if (hh !== -1 && mm !== -1) {
          return hh.toString().padStart(2,'0') + mm.toString().padStart(2,'0') + ss.toString().padStart(2,'0');
        }
      }
    }

    const i1 = BASE60_MAPPING.indexOf(base60Str[0]);
    const i2 = BASE60_MAPPING.indexOf(base60Str[1]);
    const i3 = BASE60_MAPPING.indexOf(base60Str[2]);
    if (i1 !== -1 && i2 !== -1 && i3 !== -1) {
      return i1.toString().padStart(2,'0') + i2.toString().padStart(2,'0') + i3.toString().padStart(2,'0');
    }
  }
  return base60Str;
}

export const TOKEN_REGEX = /(<[^>]+>|\[[^\]]+\]|[a-zA-Z0-9_'\u00C0-\u024F\u1E00-\u1EFF]+)/;

