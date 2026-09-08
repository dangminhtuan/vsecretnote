import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { encodeWord, timeToBase60 } from '../vcomp.js';
import { REAL_VIETNAMESE_WORDS } from '../data.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const twinsPath = path.join(projectRoot, 'twins_data_full.json');

console.log("=== BẮT ĐẦU TÁI TẠO DỮ LIỆU CẶP LẶP (TWINS_DATA_FULL.JSON) ===");

const twins = [];
const seenWords = new Set();

for (const word of REAL_VIETNAMESE_WORDS) {
  if (!word || seenWords.has(word)) continue;
  seenWords.add(word);

  const time = encodeWord(word);
  if (!time || time.startsWith('[')) continue;

  const code = timeToBase60(time);
  if (!code || code.length !== 3) continue;

  const c1 = code[0];
  const c2 = code[1];
  const c3 = code[2];
  const l1 = c1.toLowerCase();
  const l2 = c2.toLowerCase();
  const l3 = c3.toLowerCase();

  let pattern = '';
  let patternName = '';
  let rep = '';
  let group = '';
  let mnemonic = '';

  if (l1 === l2 && l2 === l3) {
    pattern = 'triple';
    patternName = 'Tam Hoa (Triple 3x)';
    rep = `${c1} × 3`;
    group = `Tam hoa ${c1}${c1}${c1}`;
    mnemonic = `Ba ký tự đồng nhất ${c1} × 3 (${word})`;
  } else if (l1 === l2) {
    pattern = 'head';
    patternName = 'Lặp Đầu';
    rep = `${c1} + ${c2}`;
    group = `Lặp đầu ${c1}${c2}`;
    mnemonic = `Nhịp đôi mở đầu ${c1}${c2}, chuyển vần sang ${c3} (${word})`;
  } else if (l1 === l3) {
    pattern = 'sandwich';
    patternName = 'Kẹp Sandwich';
    rep = `${c1} ... ${c3}`;
    group = `Kẹp ${c1}...${c3}`;
    mnemonic = `Kẹp đối xứng hai đầu ${c1}...${c3} ôm vần ${c2} (${word})`;
  } else if (l2 === l3) {
    pattern = 'tail';
    patternName = 'Lặp Đuôi';
    rep = `${c2} + ${c3}`;
    group = `Lặp đuôi ${c2}${c3}`;
    mnemonic = `Khởi đầu bằng ${c1}, kết thúc bằng cặp đôi ${c2}${c3} (${word})`;
  }

  if (pattern) {
    twins.push({
      word,
      code,
      pattern,
      patternName,
      rep,
      group,
      mnemonic
    });
  }
}

fs.writeFileSync(twinsPath, JSON.stringify(twins, null, 2), 'utf8');
console.log(`✓ Đã cập nhật ${twins.length} từ lặp vào twins_data_full.json thành công!`);
