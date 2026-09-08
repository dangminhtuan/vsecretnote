import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { BASE60_HH, BASE60_HH_EXTRA, BASE60_SS, timeToBase60, encodeWord } from 'file:///d:/__G AG Projects/vsecretnote_hkC_20260815/vcomp.js';
import { CONSONANTS_BASE, CONSONANTS_EXTRA, RHYMES_BASE, RHYMES_EXTRA_1, RHYMES_EXTRA_2, BASE60_MAPPING, REAL_VIETNAMESE_WORDS } from 'file:///d:/__G AG Projects/vsecretnote_hkC_20260815/data.js';

const projectRoot = 'd:/__G AG Projects/vsecretnote_hkC_20260815';
const publicDir = path.join(projectRoot, 'public');

console.log("=== TÁI TẠO ĐỒNG BỘ 100% TẤT CẢ CÁC TỪ ĐIỂN VÀ GÓI ZIP CHO HỆ THỐNG ===");

// 1. COMPONENT R (RULES)
const topRules = [];
let ruleIndex = 1;

// 1.1. Sáu Bảng Dấu (b1 -> b6)
const tableNames = [
  'Telex thường (z s f r x j)',
  'Telex HOA (Z S F R X J)',
  'Nguyên âm thường (a e i u w y)',
  'VNI 1 (0 1 2 3 4 5)',
  'VNI 2 (6 7 8 9 B C)',
  'Nguyên âm A, E, o, U, W, Y'
];
for (let s2 = 0; s2 < 6; s2++) {
  const tones = BASE60_SS.slice(s2 * 6, s2 * 6 + 6).join(' ');
  const numStr = (ruleIndex++).toString().padStart(2, '0');
  topRules.push(`b${s2 + 1}\t${numStr} [B${s2 + 1}] ${tones} (${tableNames[s2]})`);
}

// 1.2. Phụ Âm Chính & Phụ (cm, cp)
const c1Clean = CONSONANTS_BASE.map((c, idx) => {
  const code = BASE60_HH[idx];
  if (!c) return `Ø➔${code}`;
  return c === code ? c : `${c}➔${code}`;
}).join(', ');
const numCm = (ruleIndex++).toString().padStart(2, '0');
topRules.push(`cm\t${numCm} [PA-Chính] 24 PA Chính: ${c1Clean}`);

const c2Clean = CONSONANTS_EXTRA.filter(c => c).map((c, idx) => {
  const code = BASE60_HH_EXTRA[idx];
  return c === code ? c : `${c}➔${code}`;
}).join(', ');
const numCp = (ruleIndex++).toString().padStart(2, '0');
topRules.push(`cp\t${numCp} [PA-Phụ] 7 PA Phụ: ${c2Clean}`);

// 1.3. 6 Dấu Thanh Điệu (dz, ds, df, dr, dx, dj)
const toneRules = [
  { key: 'dz', name: 'Ngang (0)', idx: 0 },
  { key: 'ds', name: 'Sắc (1)', idx: 1 },
  { key: 'df', name: 'Huyền (2)', idx: 2 },
  { key: 'dr', name: 'Hỏi (3)', idx: 3 },
  { key: 'dx', name: 'Ngã (4)', idx: 4 },
  { key: 'dj', name: 'Nặng (5)', idx: 5 }
];
toneRules.forEach(t => {
  const codes = [];
  for (let s2 = 0; s2 < 6; s2++) {
    codes.push(BASE60_SS[s2 * 6 + t.idx]);
  }
  const numStr = (ruleIndex++).toString().padStart(2, '0');
  topRules.push(`${t.key}\t${numStr} [Dấu-${t.name.split(' ')[0]}] ${codes.join(' ')} (B1..B6)`);
});

// 1.4. Bảng Chữ Cái 26 Ký Tự
const vowels = new Set(['a', 'e', 'i', 'o', 'u', 'y']);
const alphabet26 = 'abcdefghijklmnopqrstuvwxyz'.split('');
alphabet26.forEach(char => {
  const lower = char;
  const upper = char.toUpperCase();

  const paList = [];
  CONSONANTS_BASE.forEach((c, idx) => {
    const code = BASE60_HH[idx];
    if (code === lower || code === upper) {
      const name = c || 'Ø';
      paList.push(name === code ? code : `${name}➔${code}`);
    }
  });
  CONSONANTS_EXTRA.forEach((c, idx) => {
    if (!c) return;
    const code = BASE60_HH_EXTRA[idx];
    if (code === lower || code === upper) {
      paList.push(c === code ? c : `${c}➔${code}`);
    }
  });

  const vList = [];
  [lower, upper].forEach(k => {
    const mmIdx = BASE60_MAPPING.indexOf(k);
    if (mmIdx !== -1) {
      const r1 = RHYMES_BASE[mmIdx] || '-';
      const r2 = RHYMES_EXTRA_1[mmIdx] || '-';
      const r3 = RHYMES_EXTRA_2[mmIdx] || '-';
      vList.push(`${k}: ${r1}/${r2}/${r3}`);
    }
  });

  const toneList = [];
  const toneNames = ['Ngang', 'Sắc', 'Huyền', 'Hỏi', 'Ngã', 'Nặng'];
  [lower, upper].forEach(k => {
    const ssIdx = BASE60_SS.indexOf(k);
    if (ssIdx !== -1 && ssIdx < 36) {
      const bIdx = Math.floor(ssIdx / 6) + 1;
      const tName = toneNames[ssIdx % 6];
      toneList.push(`${k} (B${bIdx} ${tName})`);
    }
  });

  const numStr = (ruleIndex++).toString().padStart(2, '0');
  let displayStr = `${numStr} [${upper}] `;
  if (paList.length > 0) displayStr += `PA: ${paList.join(', ')} | `;
  if (vList.length > 0) displayStr += `Vần: ${vList.join(' | ')}`;
  if (toneList.length > 0) displayStr += ` | Dấu: ${toneList.join(', ')}`;

  // Đặc tả thêm vai trò đặc biệt cho i và o
  if (char === 'i') {
    displayStr += ` | Tiền tố Hoa: I (Title Case), O (UPPERCASE)`;
  }

  const shortcut = vowels.has(char) ? `${char}v` : char;
  topRules.push(`${shortcut}\t${displayStr}`);
});

// 1.5. Bổ sung riêng cho vần 'o' tiếng Việt
const numOv = (ruleIndex++).toString().padStart(2, '0');
topRules.push(`ov\t${numOv} [Vần O & Ký tự o] Vần 'o' Tiếng Việt ➔ Mã: 4 (Index 35, ví dụ cho➔C4Z, to➔T4Z) | Ký tự Base60 'o' ➔ Vần: en (đen➔doz), Dấu: B6 Huyền`);

// 1.6. 10 Chữ Số 0 -> 9
const digits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
const digitEntries = [];
digits.forEach(d => {
  const mmIdx = BASE60_MAPPING.indexOf(d);
  const r1 = RHYMES_BASE[mmIdx] || '-';
  const r2 = RHYMES_EXTRA_1[mmIdx] || '-';
  const r3 = RHYMES_EXTRA_2[mmIdx] || '-';

  const toneList = [];
  const toneNames = ['Ngang', 'Sắc', 'Huyền', 'Hỏi', 'Ngã', 'Nặng'];
  const ssIdx = BASE60_SS.indexOf(d);
  if (ssIdx !== -1 && ssIdx < 36) {
    const bIdx = Math.floor(ssIdx / 6) + 1;
    const tName = toneNames[ssIdx % 6];
    toneList.push(`Dấu: ${d} (B${bIdx} ${tName})`);
  }

  const numStr = (ruleIndex++).toString().padStart(2, '0');
  let displayStr = `${numStr} [Số ${d}] Vần: ${d}: ${r1}/${r2}/${r3}`;
  if (toneList.length > 0) displayStr += ` | ${toneList.join(', ')}`;

  topRules.push(`${d}\t${displayStr}`);
  digitEntries.push({ shortcut: d, word: displayStr });
});

// 2. HELPER CHO LEARNING BREAKDOWN
function getConsonantText(char) {
  const hhIdx = BASE60_HH.indexOf(char);
  if (hhIdx !== -1) return CONSONANTS_BASE[hhIdx] || 'Ø';
  const hhExtraIdx = BASE60_HH_EXTRA.indexOf(char);
  if (hhExtraIdx !== -1) return CONSONANTS_EXTRA[hhExtraIdx] || '';
  return '';
}

function getRhymeText(char) {
  const mmIdx = BASE60_MAPPING.indexOf(char);
  if (mmIdx === -1) return '';
  const parts = [RHYMES_BASE[mmIdx], RHYMES_EXTRA_1[mmIdx], RHYMES_EXTRA_2[mmIdx]].filter(Boolean);
  return parts.join('/');
}

const TONE_SYMBOLS = ['-', '/', '\\', '?', '~', '.'];
function getToneText(char) {
  const ssIdx = BASE60_SS.indexOf(char);
  if (ssIdx === -1) return '';
  const bIdx = Math.floor(ssIdx / 6) + 1;
  const tSymbol = TONE_SYMBOLS[ssIdx % 6];
  return `B${bIdx}${tSymbol}`;
}

function getCaseAlt(char) {
  if (char === char.toUpperCase()) return char.toLowerCase();
  return char.toUpperCase();
}

function buildBreakdown(b60) {
  if (b60.length !== 3) return '';
  
  const c1 = b60[0];
  const c2 = b60[1];
  const c3 = b60[2];

  // 1. Phụ âm
  const pa1 = getConsonantText(c1);
  const c1Alt = getCaseAlt(c1);
  const pa2 = getConsonantText(c1Alt);
  const c1Str = `[${c1}:${pa1}${pa2 ? `|${c1Alt}:${pa2}` : ''}]`;

  // 2. Vần
  const r1 = getRhymeText(c2);
  const c2Alt = getCaseAlt(c2);
  const r2 = getRhymeText(c2Alt);
  let c2AltStr = '';
  if (r2) {
    c2AltStr = `|${c2Alt}:${r2}`;
  } else {
    const t2 = getToneText(c2Alt);
    if (t2) c2AltStr = `|${c2Alt}:${t2}`;
  }
  const c2Str = `[${c2}:${r1 || '-'}${c2AltStr}]`;

  // 3. Dấu
  const t1 = getToneText(c3);
  const c3Alt = getCaseAlt(c3);
  const t2 = getToneText(c3Alt);
  const c3Str = `[${c3}:${t1 || '-'}${t2 ? `|${c3Alt}:${t2}` : ''}]`;

  return `${c1Str} ${c2Str} ${c3Str}`;
}

// 3. BUILD FORWARD (F), BACKWARD (B), LEARNING (L)
const filteredWords = REAL_VIETNAMESE_WORDS.filter(w => w !== 'pết' && w !== 'pềt');

const F_lines = [];
const B_lines = [];
const L_lines = [];

filteredWords.forEach(word => {
  const enc = encodeWord(word);
  if (!enc || enc.startsWith('[')) return;
  const b60 = timeToBase60(enc);
  if (!b60 || b60.includes('?')) return;

  // F (Forward): Mã -> Từ
  F_lines.push(`${b60}\t${word}\t\t`);

  // B (Backward): Từ -> Mã
  B_lines.push(`${word}\t${b60}\t\t`);

  // L (Learning): Từ + l -> 99. Mã [ Breakdown ]
  const bd = buildBreakdown(b60);
  L_lines.push(`${word}l\t99. ${b60} ${bd}\t\t`);
});

const header = '# Gboard Dictionary version:2\n# Gboard Dictionary format:shortcut\tword\tlanguage_tag\tpos_tag\n';
const R_lines = topRules.map(line => line.includes('\t') ? `${line}\t\t` : `${line}\t\t\t`);

const components = {
  R: R_lines,
  F: F_lines,
  B: B_lines,
  L: L_lines
};

function createZip(zipFileName, contentLines) {
  const tempTxtFile = path.join(publicDir, 'dictionary.txt');
  const fullContent = header + contentLines.join('\n');
  fs.writeFileSync(tempTxtFile, fullContent, 'utf8');

  const destZip = path.join(publicDir, zipFileName);
  if (fs.existsSync(destZip)) {
    fs.unlinkSync(destZip);
  }

  execSync(`powershell -Command "Compress-Archive -Path '${tempTxtFile}' -DestinationPath '${destZip}' -Force"`);
}

// 4. SINH 16 TỔ HỢP MODULAR CHO GBOARD
console.log("-> Bắt đầu tạo 16 file Zip tổ hợp...");
const keys = ['R', 'F', 'B', 'L'];
for (let i = 0; i < 16; i++) {
  const activeKeys = [];
  const contentLines = [];

  keys.forEach((key, index) => {
    if ((i & (1 << index)) !== 0) {
      activeKeys.push(key);
      contentLines.push(...components[key]);
    }
  });

  const activeStr = activeKeys.length > 0 ? activeKeys.join('_') : 'EMPTY';
  const zipName = `Gboard_Dict_${activeStr}.zip`;
  createZip(zipName, contentLines);
  console.log(`   ✓ ${zipName} (${contentLines.length} mục)`);
}

// 5. SINH CÁC FILE TEXT VÀ CÁC ZIP MẶC ĐỊNH CHO MENU
console.log("-> Bắt đầu đồng bộ các file Text và Zip mặc định...");

// 5.1. File 1 chiều (R + F): dictionary_1way.txt, PersonalDictionary_1Way.zip, PersonalDictionary.zip, gboard_dictionary.zip
const content1Way = header + [...R_lines, ...F_lines].join('\n');
fs.writeFileSync(path.join(publicDir, 'dictionary_1way.txt'), content1Way, 'utf8');
fs.writeFileSync(path.join(publicDir, 'gboard_dictionary.txt'), content1Way, 'utf8');

// Copy Gboard_Dict_R_F.zip làm PersonalDictionary.zip, PersonalDictionary_1Way.zip, gboard_dictionary.zip
fs.copyFileSync(path.join(publicDir, 'Gboard_Dict_R_F.zip'), path.join(publicDir, 'PersonalDictionary.zip'));
fs.copyFileSync(path.join(publicDir, 'Gboard_Dict_R_F.zip'), path.join(publicDir, 'PersonalDictionary_1Way.zip'));
fs.copyFileSync(path.join(publicDir, 'Gboard_Dict_R_F.zip'), path.join(publicDir, 'gboard_dictionary.zip'));
console.log("   ✓ PersonalDictionary.zip, PersonalDictionary_1Way.zip, gboard_dictionary.zip (R + F)");

// 5.2. File 2 chiều (R + F + B): dictionary_2way.txt, PersonalDictionary_2Way.zip
const content2Way = header + [...R_lines, ...F_lines, ...B_lines].join('\n');
fs.writeFileSync(path.join(publicDir, 'dictionary_2way.txt'), content2Way, 'utf8');
fs.copyFileSync(path.join(publicDir, 'Gboard_Dict_R_F_B.zip'), path.join(publicDir, 'PersonalDictionary_2Way.zip'));
console.log("   ✓ PersonalDictionary_2Way.zip, dictionary_2way.txt (R + F + B)");

// 5.3. File Rules: rules_dictionary.txt, Gboard_ToneRules.zip
const contentRules = header + R_lines.join('\n');
fs.writeFileSync(path.join(publicDir, 'rules_dictionary.txt'), contentRules, 'utf8');
fs.copyFileSync(path.join(publicDir, 'Gboard_Dict_R.zip'), path.join(publicDir, 'Gboard_ToneRules.zip'));
console.log("   ✓ Gboard_ToneRules.zip, rules_dictionary.txt (R)");

// 5.4. File Digits: digits_dictionary.txt, Gboard_O_and_Digits.zip
const digitRulesLines = [
  `ov\t${numOv} [Vần O & Ký tự o] Vần 'o' Tiếng Việt ➔ Mã: 4 (Index 35) | Ký tự Base60 'o' ➔ Vần: en (đen➔doz), Dấu: B6 Huyền\t\t`,
  ...digitEntries.map(e => `${e.shortcut}\t${e.word}\t\t`)
];
const contentDigits = header + digitRulesLines.join('\n');
fs.writeFileSync(path.join(publicDir, 'digits_dictionary.txt'), contentDigits, 'utf8');
createZip('Gboard_O_and_Digits.zip', digitRulesLines);
console.log("   ✓ Gboard_O_and_Digits.zip, digits_dictionary.txt");

// Dọn dẹp dictionary.txt tạm trong public
const tempTxt = path.join(publicDir, 'dictionary.txt');
if (fs.existsSync(tempTxt)) fs.unlinkSync(tempTxt);

console.log("🎉 ĐÃ TÁI TẠO XONG 100% CÁC FILE TỪ ĐIỂN!");
