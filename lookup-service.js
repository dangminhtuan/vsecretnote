import { 
  encodeWord, 
  timeToBase60, 
  decodeWord, 
  base60ToTime, 
  BASE60_SS, 
  BASE60_HH, 
  BASE60_HH_EXTRA, 
  BASE60_MM 
} from './vcomp.js';
import { 
  CONSONANTS_BASE, 
  CONSONANTS_EXTRA, 
  RHYMES_BASE, 
  RHYMES_EXTRA_1, 
  RHYMES_EXTRA_2, 
  BASE60_MAPPING 
} from './data.js';

const TONE_NAMES = ['Ngang (Bằng)', 'Sắc', 'Huyền', 'Hỏi', 'Ngã', 'Nặng'];
const TABLE_NAMES = [
  'B1: PA Chính + Vần B1 (Telex thường)',
  'B2: PA Chính + Vần B2 (Telex HOA)',
  'B3: PA Chính + Vần B3 (Nguyên âm thường)',
  'B4: PA Phụ + Vần B1 (VNI 0-5)',
  'B5: PA Phụ + Vần B2 (VNI cao 6-9, B, C)',
  'B6: PA Phụ + Vần B3 (Nguyên âm A, E, o, U, W, Y)'
];

function getBreakdownForCode(code3) {
  if (code3.length !== 3) return null;
  const c1 = code3[0];
  const c2 = code3[1];
  const c3 = code3[2];

  const time = base60ToTime(code3);
  if (time.length !== 6) return null;

  const hh = parseInt(time.substring(0, 2), 10);
  const mm = parseInt(time.substring(2, 4), 10);
  const ss = parseInt(time.substring(4, 6), 10);

  if (ss >= 36) {
    const word = decodeWord(time);
    return {
      language: 'English / Ngoại ngữ',
      time,
      word,
      c1: { char: c1, index: hh },
      c2: { char: c2, index: mm },
      c3: { char: c3, index: ss, type: 'English Slot' },
      summary: `Mã Tiếng Anh: ${code3} ➔ "${word}"`
    };
  }

  const s2 = Math.floor(ss / 6);
  const s1 = ss % 6;
  const isExtraCons = s2 >= 3;
  const rhymeTableIdx = s2 % 3;

  const consonant = isExtraCons 
    ? (CONSONANTS_EXTRA[hh] || '') 
    : (CONSONANTS_BASE[hh] || '');
  
  let rhyme = '';
  if (rhymeTableIdx === 0) rhyme = RHYMES_BASE[mm] || '';
  else if (rhymeTableIdx === 1) rhyme = RHYMES_EXTRA_1[mm] || '';
  else if (rhymeTableIdx === 2) rhyme = RHYMES_EXTRA_2[mm] || '';

  const toneName = TONE_NAMES[s1];
  const tableName = TABLE_NAMES[s2];
  const consDesc = consonant ? `phụ âm '${consonant}'` : 'nguyên âm mở đầu';
  const word = decodeWord(time);

  return {
    language: 'Vietnamese',
    time,
    word,
    c1: {
      char: c1,
      hh,
      consonant: consonant || 'Ø',
      table: isExtraCons ? 'Phụ âm Phụ (7 PA)' : 'Phụ âm Chính (24 PA)'
    },
    c2: {
      char: c2,
      mm,
      rhyme: rhyme || 'Ø',
      table: `Vần Bảng ${rhymeTableIdx + 1} (B${rhymeTableIdx + 1})`
    },
    c3: {
      char: c3,
      ss,
      s1_toneIndex: s1,
      s2_tableIndex: s2,
      toneName,
      table: tableName
    },
    summary: `[${c1}: ${consDesc}] + [${c2}: vần '${rhyme}'] + [${c3}: ${toneName} (${tableName})]`
  };
}

export function encodeSingleWord(rawWord) {
  const w = (rawWord || '').trim();
  if (!w) return null;

  const isAllUpper = w === w.toUpperCase() && w !== w.toLowerCase();
  const isTitle = !isAllUpper && w[0] === w[0].toUpperCase() && w.length > 1;

  const lowerWord = w.toLowerCase();
  const time = encodeWord(lowerWord);

  if (!time || time.startsWith('[') || time.includes('?')) {
    return {
      success: false,
      word: w,
      error: 'Không tìm thấy từ trong kho từ vựng tiếng Việt / tiếng Anh'
    };
  }

  const baseCode = timeToBase60(time);
  let finalCode = baseCode;
  let caseType = 'lowercase';

  if (isTitle) {
    finalCode = 'I' + baseCode;
    caseType = 'TitleCase';
  } else if (isAllUpper) {
    finalCode = 'O' + baseCode;
    caseType = 'UPPERCASE';
  }

  const breakdown = getBreakdownForCode(baseCode);

  return {
    success: true,
    word: w,
    code: finalCode,
    baseCode,
    caseType,
    time,
    breakdown,
    mnemonic: breakdown?.summary || ''
  };
}

export function decodeSingleToken(rawToken) {
  let token = (rawToken || '').trim();
  if (!token) return null;

  let caseType = 'lowercase';
  let baseToken = token;

  if (token.length === 4 && (token.startsWith('I') || token.startsWith('O'))) {
    caseType = token.startsWith('I') ? 'TitleCase' : 'UPPERCASE';
    baseToken = token.substring(1);
  }

  if (baseToken.length !== 3) {
    return {
      success: false,
      code: token,
      error: 'Độ dài mã không hợp lệ (chuẩn: 3 ký tự viết thường hoặc 4 ký tự với tiền tố I/O)'
    };
  }

  const time = base60ToTime(baseToken);
  let word = decodeWord(time);

  if (!word || word.startsWith('[') || word.includes('?')) {
    return {
      success: false,
      code: token,
      time,
      error: 'Không thể giải mã được chuỗi Base60 này'
    };
  }

  if (caseType === 'TitleCase') {
    word = word.charAt(0).toUpperCase() + word.slice(1);
  } else if (caseType === 'UPPERCASE') {
    word = word.toUpperCase();
  }

  const breakdown = getBreakdownForCode(baseToken);

  return {
    success: true,
    code: token,
    baseCode: baseToken,
    caseType,
    word,
    time,
    breakdown,
    mnemonic: breakdown?.summary || ''
  };
}

export function processLookup(query) {
  const q = (query || '').trim();
  if (!q) {
    return {
      success: false,
      error: 'Vui lòng cung cấp tham số w (word) hoặc c (code)'
    };
  }

  // If query contains spaces -> phrase processing
  if (q.includes(' ')) {
    const tokens = q.split(/\s+/).filter(Boolean);
    
    // Check if tokens look like Base60 codes (3 or 4 chars)
    const isCodeList = tokens.every(t => /^[a-zA-Z0-9]{3,4}$/.test(t));
    if (isCodeList) {
      const decodedList = tokens.map(decodeSingleToken);
      const fullText = decodedList.map(item => item.word || `[${item.code}]`).join(' ');
      return {
        success: true,
        type: 'phrase_decode',
        input: q,
        result: fullText,
        items: decodedList
      };
    } else {
      const encodedList = tokens.map(encodeSingleWord);
      const codes = encodedList.map(item => item.code || `[${item.word}]`);
      return {
        success: true,
        type: 'phrase_encode',
        input: q,
        result: codes.join(' '),
        continuous: codes.join(''),
        items: encodedList
      };
    }
  }

  // Single token: detect if it is Base60 code or Vietnamese word
  // A Base60 code is either 3 chars (e.g. TW2, doz) or 4 chars starting with I or O (e.g. IvjJ, Odoz)
  const isLikelyCode = (q.length === 3 && /^[a-zA-Z0-9]{3}$/.test(q)) || 
                       (q.length === 4 && /^[IO][a-zA-Z0-9]{3}$/.test(q));

  if (isLikelyCode) {
    const res = decodeSingleToken(q);
    if (res.success) {
      return {
        type: 'decode',
        ...res
      };
    }
  }

  // Otherwise try encode as word
  const res = encodeSingleWord(q);
  if (res.success) {
    return {
      type: 'encode',
      ...res
    };
  }

  // If both failed, return decode error or encode error
  return isLikelyCode ? decodeSingleToken(q) : res;
}
