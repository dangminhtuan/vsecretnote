import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { REAL_VIETNAMESE_WORDS, BASE60_MAPPING, RHYMES_BASE, RHYMES_EXTRA_1, RHYMES_EXTRA_2, CONSONANTS_BASE, CONSONANTS_EXTRA } from 'file:///d:/__G%20AG%20Projects/vsecretnote_hkC_20260815/data.js';
import { removeVietnameseTones, encodeWord, timeToBase60, BASE60_HH } from 'file:///d:/__G%20AG%20Projects/vsecretnote_hkC_20260815/vcomp.js';

const projectRoot = 'd:/__G AG Projects/vsecretnote_hkC_20260815';
const publicDir = path.join(projectRoot, 'public');

console.log("=== BẮT ĐẦU TẠO 3 GÓI TỪ ĐIỂN TIỆN ÍCH CHO APP NGÂN HÀNG & HỌC VẦN ===");

// 1. TELEX CONVERTER
const VOWEL_TELEX = {
  'á': { base: 'a', tone: 's' }, 'à': { base: 'a', tone: 'f' }, 'ả': { base: 'a', tone: 'r' }, 'ã': { base: 'a', tone: 'x' }, 'ạ': { base: 'a', tone: 'j' },
  'ắ': { base: 'aw', tone: 's' }, 'ằ': { base: 'aw', tone: 'f' }, 'ẳ': { base: 'aw', tone: 'r' }, 'ẵ': { base: 'aw', tone: 'x' }, 'ặ': { base: 'aw', tone: 'j' }, 'ă': { base: 'aw', tone: '' },
  'ấ': { base: 'aa', tone: 's' }, 'ầ': { base: 'aa', tone: 'f' }, 'ẩ': { base: 'aa', tone: 'r' }, 'ẫ': { base: 'aa', tone: 'x' }, 'ậ': { base: 'aa', tone: 'j' }, 'â': { base: 'aa', tone: '' },
  'é': { base: 'e', tone: 's' }, 'è': { base: 'e', tone: 'f' }, 'è': { base: 'e', tone: 'f' }, 'ẻ': { base: 'e', tone: 'r' }, 'ẽ': { base: 'e', tone: 'x' }, 'ẹ': { base: 'e', tone: 'j' },
  'ế': { base: 'ee', tone: 's' }, 'ề': { base: 'ee', tone: 'f' }, 'ể': { base: 'ee', tone: 'r' }, 'ễ': { base: 'ee', tone: 'x' }, 'ệ': { base: 'ee', tone: 'j' }, 'ê': { base: 'ee', tone: '' },
  'í': { base: 'i', tone: 's' }, 'ì': { base: 'i', tone: 'f' }, 'ỉ': { base: 'i', tone: 'r' }, 'ĩ': { base: 'i', tone: 'x' }, 'ị': { base: 'i', tone: 'j' },
  'ó': { base: 'o', tone: 's' }, 'ò': { base: 'o', tone: 'f' }, 'ỏ': { base: 'o', tone: 'r' }, 'õ': { base: 'o', tone: 'x' }, 'ọ': { base: 'o', tone: 'j' },
  'ố': { base: 'oo', tone: 's' }, 'ồ': { base: 'oo', tone: 'f' }, 'ổ': { base: 'oo', tone: 'r' }, 'ỗ': { base: 'oo', tone: 'x' }, 'ộ': { base: 'oo', tone: 'j' }, 'ô': { base: 'oo', tone: '' },
  'ớ': { base: 'ow', tone: 's' }, 'ờ': { base: 'ow', tone: 'f' }, 'ở': { base: 'ow', tone: 'r' }, 'ỡ': { base: 'ow', tone: 'x' }, 'ợ': { base: 'ow', tone: 'j' }, 'ơ': { base: 'ow', tone: '' },
  'ú': { base: 'u', tone: 's' }, 'ù': { base: 'u', tone: 'f' }, 'ủ': { base: 'u', tone: 'r' }, 'ũ': { base: 'u', tone: 'x' }, 'ụ': { base: 'u', tone: 'j' },
  'ứ': { base: 'uw', tone: 's' }, 'ừ': { base: 'uw', tone: 'f' }, 'ử': { base: 'uw', tone: 'r' }, 'ữ': { base: 'uw', tone: 'x' }, 'ự': { base: 'uw', tone: 'j' }, 'ư': { base: 'uw', tone: '' },
  'ý': { base: 'y', tone: 's' }, 'ỳ': { base: 'y', tone: 'f' }, 'ỷ': { base: 'y', tone: 'r' }, 'ỹ': { base: 'y', tone: 'x' }, 'ỵ': { base: 'y', tone: 'j' },
  'đ': { base: 'dd', tone: '' }
};

export function toTelex(word) {
  let tone = '';
  let res = '';
  for (let i = 0; i < word.length; i++) {
    const ch = word[i].toLowerCase();
    if (VOWEL_TELEX[ch]) {
      res += VOWEL_TELEX[ch].base;
      if (VOWEL_TELEX[ch].tone) tone = VOWEL_TELEX[ch].tone;
    } else {
      res += ch;
    }
  }
  return res + tone;
}

// 2. VNI CONVERTER
const VNI_TONES = {
  'á': 1, 'à': 2, 'ả': 3, 'ã': 4, 'ạ': 5,
  'ắ': 1, 'ằ': 2, 'ẳ': 3, 'ẵ': 4, 'ặ': 5,
  'ấ': 1, 'ầ': 2, 'ẩ': 3, 'ẫ': 4, 'ậ': 5,
  'é': 1, 'è': 2, 'ẻ': 3, 'ẽ': 4, 'ẹ': 5,
  'ế': 1, 'ề': 2, 'ể': 3, 'ễ': 4, 'ệ': 5,
  'í': 1, 'ì': 2, 'ỉ': 3, 'ĩ': 4, 'ị': 5,
  'ó': 1, 'ò': 2, 'ỏ': 3, 'õ': 4, 'ọ': 5,
  'ố': 1, 'ồ': 2, 'ổ': 3, 'ỗ': 4, 'ộ': 5,
  'ớ': 1, 'ờ': 2, 'ở': 3, 'ỡ': 4, 'ợ': 5,
  'ú': 1, 'ù': 2, 'ủ': 3, 'ũ': 4, 'ụ': 5,
  'ứ': 1, 'ừ': 2, 'ử': 3, 'ữ': 4, 'ự': 5,
  'ý': 1, 'ỳ': 2, 'ỷ': 3, 'ỹ': 4, 'ỵ': 5
};

export function toCanonicalVni(word) {
  const w = word.toLowerCase();
  let baseChars = '';
  let hatNum = 0;
  let toneNum = 0;
  let hasDd = false;

  for (let i = 0; i < w.length; i++) {
    const ch = w[i];
    if (ch === 'đ') {
      baseChars += 'd';
      hasDd = true;
    } else if (/[ăắằẳẵặ]/.test(ch)) {
      baseChars += 'a';
      hatNum = 8;
      if (VNI_TONES[ch]) toneNum = VNI_TONES[ch];
    } else if (/[âấầẩẫậ]/.test(ch)) {
      baseChars += 'a';
      hatNum = 6;
      if (VNI_TONES[ch]) toneNum = VNI_TONES[ch];
    } else if (/[êếềểễệ]/.test(ch)) {
      baseChars += 'e';
      hatNum = 6;
      if (VNI_TONES[ch]) toneNum = VNI_TONES[ch];
    } else if (/[ôốồổỗộ]/.test(ch)) {
      baseChars += 'o';
      hatNum = 6;
      if (VNI_TONES[ch]) toneNum = VNI_TONES[ch];
    } else if (/[ơớờởỡợ]/.test(ch)) {
      baseChars += 'o';
      hatNum = 7;
      if (VNI_TONES[ch]) toneNum = VNI_TONES[ch];
    } else if (/[ưứừửữự]/.test(ch)) {
      baseChars += 'u';
      hatNum = 7;
      if (VNI_TONES[ch]) toneNum = VNI_TONES[ch];
    } else if (VNI_TONES[ch]) {
      const unaccentedVowel = ch.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      baseChars += unaccentedVowel;
      toneNum = VNI_TONES[ch];
    } else {
      baseChars += ch;
    }
  }

  // Bỏ qua các từ thuần không dấu (xem, phim, ra, ngon...)
  if (!hatNum && !toneNum && !hasDd) return null;

  // Dồn số cuối theo thứ tự GIẢM DẦN: 9 (đ) > 8/7/6 (mũ) > 1..5 (dấu thanh)
  let suffix = '';
  if (hasDd) suffix += '9';
  if (hatNum) suffix += hatNum.toString();
  if (toneNum) suffix += toneNum.toString();

  return baseChars + suffix;
}

// 3. UNACCENTED FORMULA EXTRACTOR
export function stripAllAccents(str) {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase();
}

const allConsonants = [...new Set([...CONSONANTS_BASE, ...CONSONANTS_EXTRA].filter(Boolean))].sort((a,b) => b.length - a.length);

function getPhonetics(word) {
  const [cleanWord, tone] = removeVietnameseTones(word.toLowerCase());
  let consonant = '';
  let rhyme = cleanWord;
  for (const c of allConsonants) {
    if (cleanWord.startsWith(c)) {
      consonant = c;
      rhyme = cleanWord.substring(c.length);
      break;
    }
  }
  if (consonant === 'gi') {
    consonant = 'd';
  }
  return { consonant, rhyme, tone };
}

function getTwinAnchor(rhyme) {
  let rIdx = RHYMES_BASE.indexOf(rhyme);
  if (rIdx === -1) rIdx = RHYMES_EXTRA_1.indexOf(rhyme);
  if (rIdx === -1) rIdx = RHYMES_EXTRA_2.indexOf(rhyme);
  if (rIdx === -1) return null;

  const rhymeChar = BASE60_MAPPING[rIdx];
  const cIdx = BASE60_HH.indexOf(rhymeChar);
  if (cIdx !== -1 && cIdx < CONSONANTS_BASE.length) {
    const cons = CONSONANTS_BASE[cIdx];
    const matches = REAL_VIETNAMESE_WORDS.filter(w => {
      const ph = getPhonetics(w);
      return (ph.consonant === cons || (cons === 'g' && ph.consonant === 'gi')) && ph.rhyme === rhyme;
    });
    if (matches.length > 0) {
      matches.sort((a,b) => getPhonetics(a).tone - getPhonetics(b).tone);
      const anchorWord = matches[0];
      const enc = encodeWord(anchorWord);
      if (enc && !enc.startsWith('[')) {
        return { word: anchorWord, code: timeToBase60(enc) };
      }
    }
  }
  return null;
}

// DỮ LIỆU CÁC GÓI
const telexLines = [];
const vniLines = [];
const unaccentedGroups = new Map();

const filteredWords = REAL_VIETNAMESE_WORDS.filter(w => w !== 'pết' && w !== 'pềt');

filteredWords.forEach(word => {
  const enc = encodeWord(word);
  if (!enc || enc.startsWith('[')) return;
  const b60 = timeToBase60(enc);
  if (!b60 || b60.includes('?')) return;

  const unaccented = stripAllAccents(word);

  // Gói 1: Banking Telex (CHỈ từ có phím dấu Telex, loại trừ từ thuần không dấu như xem, phim)
  const tlx = toTelex(word);
  if (tlx && tlx !== unaccented && tlx !== b60) {
    telexLines.push(`${tlx}\t${b60}\t\t`);
  }

  // Gói 2: Banking VNI (CHỈ từ có số VNI theo thứ tự giảm dần: duoc975, muon61)
  const vni = toCanonicalVni(word);
  if (vni && vni !== unaccented && /\d/.test(vni)) {
    vniLines.push(`${vni}\t${b60}\t\t`);
  }

  // Gom nhóm cho Gói 3 (Học vần không dấu)
  if (!unaccentedGroups.has(unaccented)) {
    unaccentedGroups.set(unaccented, []);
  }
  unaccentedGroups.get(unaccented).push(word);
});

// Gói 3: Học vần không dấu (GỢI Ý TỪ THỰC TẾ KÈM MỎ NEO CẶP LẶP)
const realWordsSet = new Set(REAL_VIETNAMESE_WORDS.map(w => w.toLowerCase()));
const learnNoToneLines = [];

unaccentedGroups.forEach((words, unaccented) => {
  const byRhyme = new Map();
  words.forEach(w => {
    const ph = getPhonetics(w);
    if (!byRhyme.has(ph.rhyme)) byRhyme.set(ph.rhyme, []);
    byRhyme.get(ph.rhyme).push(w);
  });

  const formulas = [];
  byRhyme.forEach((groupWords, rhyme) => {
    groupWords.sort((a, b) => getPhonetics(a).tone - getPhonetics(b).tone);
    const bestWord = groupWords[0];
    const bestEnc = encodeWord(bestWord);
    if (!bestEnc || bestEnc.startsWith('[')) return;
    const bestCode = timeToBase60(bestEnc);

    const anchor = getTwinAnchor(rhyme);
    if (anchor && anchor.word !== bestWord && anchor.code !== bestCode) {
      formulas.push(`${bestWord}=${bestCode} (${anchor.word}=${anchor.code})`);
    } else {
      formulas.push(`${bestWord}=${bestCode}`);
    }
  });

  if (formulas.length > 0) {
    const formulaStr = formulas.join('  ');
    const isRealWord = realWordsSet.has(unaccented);
    if (isRealWord) {
      // Từ này vốn là từ tiếng Việt có thật -> BẮT BUỘC có đuôi 'z' để bảo vệ gõ thường
      learnNoToneLines.push(`${unaccented}z\t${formulaStr}\t\t`);
    } else {
      // Từ này KHÔNG có thật trong tiếng Việt -> Gõ tự nhiên 100% không cần 'z'
      learnNoToneLines.push(`${unaccented}\t${formulaStr}\t\t`);
      // Thêm cả alias đuôi 'z' nếu người dùng quen tay gõ 'z'
      learnNoToneLines.push(`${unaccented}z\t${formulaStr}\t\t`);
    }
  }
});

const header = '# Gboard Dictionary version:2\n# Gboard Dictionary format:shortcut\tword\tlanguage_tag\tpos_tag\n';

function createZip(zipFileName, contentLines) {
  const tempTxtFile = path.join(publicDir, 'dictionary.txt');
  const fullContent = header + contentLines.join('\n');
  fs.writeFileSync(tempTxtFile, fullContent, 'utf8');

  const destZip = path.join(publicDir, zipFileName);
  if (fs.existsSync(destZip)) {
    fs.unlinkSync(destZip);
  }

  execSync(`powershell -Command "Compress-Archive -Path '${tempTxtFile}' -DestinationPath '${destZip}' -Force"`);
  console.log(`✓ Đã tạo thành công: ${zipFileName} (${contentLines.length} mục)`);
}

createZip('Gboard_Banking_Telex.zip', telexLines);
createZip('Gboard_Banking_VNI.zip', vniLines);
createZip('Gboard_Learn_NoTone.zip', learnNoToneLines);

// Dọn dẹp temp
const tempTxtFile = path.join(publicDir, 'dictionary.txt');
if (fs.existsSync(tempTxtFile)) {
  fs.unlinkSync(tempTxtFile);
}
console.log("=== HOÀN TẤT TẠO 3 GÓI TIỆN ÍCH ĐỘC LẬP! ===");
