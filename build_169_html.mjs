import fs from 'fs';
import { RHYMES_BASE, RHYMES_EXTRA_1, RHYMES_EXTRA_2, BASE60_MAPPING } from './data.js';
import { extractPhonetics, encodeWord, timeToBase60, applyTone } from './vcomp.js';

// Đọc danh sách từ âm tiết tiếng Việt
const rawSyllables = JSON.parse(fs.readFileSync('./public/syllables.json', 'utf8'));

// Bảng tra cứu phụ âm a1 (Không dùng Shift)
const CONS_MAP_A1 = {
  '': 'z',     // Không phụ âm đầu
  'th': '1',   // Phụ âm kép số 1..5
  'ch': '2',
  'tr': '3',
  'nh': '4',
  'ng': '5',
  'ph': 'f',   // Phụ âm quốc tế
  'gi': 'j',
  'đ': 'w',    // Chữ đ
  'd': 'd',    // Chữ d
  'kh': 'a',   // Phụ âm nguyên âm
  'qu': 'o',
  'gh': 'u',
  'ngh': 'y',
  'b': 'b', 'c': 'c', 'g': 'g', 'h': 'h', 'k': 'k', 'l': 'l', 'm': 'm', 'n': 'n', 'p': 'p', 'r': 'r', 's': 's', 't': 't', 'v': 'v', 'x': 'x'
};

// 6 BẢNG DẤU CHUẨN (Thanh 0..5: Bằng, Sắc, Huyền, Hỏi, Ngã, Nặng)
// Nhóm vần thường (bậc 1)
const TONES_B1 = ['z', 's', 'f', 'r', 'x', 'j']; // Telex
const TONES_B2 = ['b', 'k', 'v', 'l', 'q', 'd']; // BKVLQD
const TONES_B3 = ['0', '1', '2', '3', '4', '5']; // VNI

// Nhóm vần HOA (bậc 2)
// B4: 6 Nguyên âm (a, e, i, o, u, y)
const TONES_B4 = ['a', 'e', 'i', 'o', 'u', 'y'];
// B5: 6 Phụ âm ABC (c, g, h, p, t, w)
const TONES_B5 = ['c', 'g', 'h', 'p', 't', 'w'];
// B6: Số VNI nối tiếp (6, 7, 8, 9, m, n)
const TONES_B6 = ['6', '7', '8', '9', 'm', 'n'];

function encodeA1(word) {
  const { consonant, rhyme, tone } = extractPhonetics(word);
  
  let c1 = CONS_MAP_A1[consonant];
  if (!c1) {
    if (consonant === 'đ') c1 = 'w';
    else if (consonant === 'd') c1 = 'd';
    else if (consonant === 'gi') c1 = 'j';
    else if (consonant === 'ph') c1 = 'f';
    else c1 = consonant ? consonant[0] : 'z';
  }

  let rIdx = RHYMES_BASE.indexOf(rhyme);
  let table = 1;
  if (rIdx === -1) {
    rIdx = RHYMES_EXTRA_1.indexOf(rhyme);
    table = 2;
  }
  if (rIdx === -1) {
    rIdx = RHYMES_EXTRA_2.indexOf(rhyme);
    table = 3;
  }

  if (rIdx === -1) {
    return { a1: '???', isUpper: false, c1, c2: '?', c3: '?' };
  }

  const b60Char = BASE60_MAPPING[rIdx];
  const isUpper = /^[A-Z]$/.test(b60Char);
  const c2 = b60Char.toLowerCase(); // Vần luôn là chữ thường!

  // Dấu thanh a1 chuẩn B1/B4
  const c3 = isUpper ? TONES_B4[tone] : TONES_B1[tone];

  return {
    a1: `${c1}${c2}${c3}`,
    isUpper,
    c1,
    c2,
    c3
  };
}

function computeDiff(vV1, a1) {
  if (vV1 === a1) {
    return { text: 'nn', isDiff: false };
  }
  if (!vV1 || !a1) {
    return { text: '≠', isDiff: true };
  }
  const diffs = [];
  const maxLen = Math.max(vV1.length, a1.length);
  for (let i = 0; i < maxLen; i++) {
    const cV = vV1[i] || '∅';
    const cA = a1[i] || '∅';
    if (cV !== cA) {
      diffs.push(`${cV}=>${cA}`);
    }
  }
  return {
    text: `(${diffs.join(',')})`,
    isDiff: true
  };
}

const ALL_CLUSTERS = ['th', 'ch', 'tr', 'nh', 'ng', 'kh', 'ph', 'gi', 'đ', 'qu', 'gh', 'ngh'];

function getThreeWordsForRhyme(rhyme, b60Char, rhymeIndex) {
  // Riêng vần 1 (-êt, phím c): gán đúng 3 từ mẫu của user!
  if (rhyme === 'êt' && b60Char === 'c') {
    return ['thết', 'kết', 'tết'];
  }

  const matches = rawSyllables.filter(w => {
    const p = extractPhonetics(w);
    return p.rhyme === rhyme;
  });

  const candidates = [];
  
  // 1. Luân phiên vòng tròn phụ âm kép để dùng đều cả 1..5!
  const rotatedClusters = [
    ...ALL_CLUSTERS.slice(rhymeIndex % ALL_CLUSTERS.length),
    ...ALL_CLUSTERS.slice(0, rhymeIndex % ALL_CLUSTERS.length)
  ];

  for (const cl of rotatedClusters) {
    const m = matches.find(w => extractPhonetics(w).consonant === cl && !candidates.includes(w));
    if (m) {
      candidates.push(m);
      break;
    }
  }

  // 2. Từ có phụ âm đơn thông dụng (để so sánh các trường hợp nn)
  const singleCons = ['k', 't', 'b', 'c', 'l', 'm', 'n', 's', 'v', 'h', 'd'];
  const rotatedSingle = [
    ...singleCons.slice(rhymeIndex % singleCons.length),
    ...singleCons.slice(0, rhymeIndex % singleCons.length)
  ];
  for (const sc of rotatedSingle) {
    if (candidates.length >= 2) break;
    const m = matches.find(w => extractPhonetics(w).consonant === sc && !candidates.includes(w));
    if (m) candidates.push(m);
  }

  // 3. Từ không phụ âm đầu (z) hoặc từ tiếp theo
  const emptyCons = matches.find(w => extractPhonetics(w).consonant === '' && !candidates.includes(w));
  if (emptyCons && candidates.length < 3) {
    candidates.push(emptyCons);
  }

  for (const m of matches) {
    if (candidates.length >= 3) break;
    if (!candidates.includes(m)) candidates.push(m);
  }

  // Nếu vẫn chưa đủ 3 từ, ghép phụ âm hợp lệ
  const testCons = ['t', 'k', 'b', 'c', 'l', 'm', 'n', 's', 'v', 'th', 'ch', 'tr', 'nh', 'ng', ''];
  let cIdx = 0;
  while (candidates.length < 3 && cIdx < testCons.length) {
    const cons = testCons[cIdx++];
    for (let t = 0; t <= 5; t++) {
      const w = cons + applyTone(rhyme, t);
      if (!candidates.includes(w)) {
        candidates.push(w);
        if (candidates.length >= 3) break;
      }
    }
  }

  return candidates.slice(0, 3);
}

// 169 Vần
const allRhymes = [];
const addRhymes = (arr, tableNum, tableName) => {
  arr.forEach((r, idx) => {
    if (r && r !== '-') {
      const b60 = BASE60_MAPPING[idx];
      const isUpper = /^[A-Z]$/.test(b60);
      allRhymes.push({
        id: allRhymes.length + 1,
        table: tableNum,
        tableName,
        idx,
        rhyme: r,
        b60Char: b60,
        isUpper
      });
    }
  });
};

addRhymes(RHYMES_BASE, 1, 'B1');
addRhymes(RHYMES_EXTRA_1, 2, 'B2');
addRhymes(RHYMES_EXTRA_2, 3, 'B3');

let totalWords = 0;
let totalNN = 0;
let totalDiff = 0;
const c1Stats = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 };

const processedRows = allRhymes.map((item, index) => {
  const words = getThreeWordsForRhyme(item.rhyme, item.b60Char, index);
  const wordDetails = words.map(w => {
    let vV1 = '';
    try {
      const t = encodeWord(w);
      vV1 = timeToBase60(t);
    } catch (e) {
      vV1 = 'ERR';
    }
    const a1Data = encodeA1(w);
    const diffInfo = computeDiff(vV1, a1Data.a1);

    totalWords++;
    if (diffInfo.isDiff) totalDiff++;
    else totalNN++;

    if (c1Stats[a1Data.c1] !== undefined) {
      c1Stats[a1Data.c1]++;
    }

    return {
      word: w,
      vV1,
      a1: a1Data.a1,
      evalText: diffInfo.text,
      isDiff: diffInfo.isDiff
    };
  });

  const hasDiff = wordDetails.some(w => w.isDiff);
  const allNN = wordDetails.every(w => !w.isDiff);

  return {
    ...item,
    words: wordDetails,
    hasDiff,
    allNN
  };
});

console.log(`Phụ âm số 1..5: 1(th)=${c1Stats['1']}, 2(ch)=${c1Stats['2']}, 3(tr)=${c1Stats['3']}, 4(nh)=${c1Stats['4']}, 5(ng)=${c1Stats['5']}`);
console.log(`Thống kê: Tổng từ=${totalWords}, Giống nhau (nn)=${totalNN} (${((totalNN/totalWords)*100).toFixed(1)}%), Khác nhau=${totalDiff} (${((totalDiff/totalWords)*100).toFixed(1)}%)`);

// HTML Template gọn gàng, tối ưu Mobile & Co 1 nửa
const htmlContent = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>VCOMP 169 VẦN — vV1 vs a1 (Compact 7 Cột)</title>
  <style>
    :root {
      --bg: #090d16;
      --card-bg: #111827;
      --border: rgba(255, 255, 255, 0.1);
      --border-group: rgba(0, 240, 255, 0.35);
      --cyan: #00f0ff;
      --green: #10b981;
      --orange: #f59e0b;
      --red: #ef4444;
      --text: #f1f5f9;
      --text-muted: #94a3b8;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: var(--bg);
      color: var(--text);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      padding: 10px;
      font-size: 13px;
      line-height: 1.35;
    }
    .wrapper {
      max-width: 680px;
      margin: 0 auto;
    }

    /* Header & Quick stats */
    .top-bar {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 10px 14px;
      margin-bottom: 10px;
    }
    .top-title {
      font-size: 1.05rem;
      font-weight: 800;
      color: var(--cyan);
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 6px;
    }
    .top-desc {
      font-size: 0.8rem;
      color: var(--text-muted);
      margin-bottom: 8px;
    }
    
    /* Stats Bar */
    .stats-row {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      font-size: 0.8rem;
      font-weight: 700;
      background: rgba(0,0,0,0.3);
      padding: 6px 10px;
      border-radius: 6px;
      border: 1px solid rgba(255,255,255,0.05);
      margin-bottom: 6px;
    }
    .cluster-stats {
      font-size: 0.76rem;
      color: #cbd5e1;
      background: rgba(0, 240, 255, 0.05);
      padding: 4px 8px;
      border-radius: 4px;
      margin-bottom: 8px;
      border: 1px dashed rgba(0, 240, 255, 0.2);
    }
    .cluster-tag {
      font-family: 'Consolas', monospace;
      color: var(--cyan);
      font-weight: bold;
    }
    .stat-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }
    .stat-nn { color: var(--green); }
    .stat-diff { color: var(--orange); }

    /* Filter Controls */
    .filters {
      display: flex;
      gap: 6px;
      margin-top: 4px;
      flex-wrap: wrap;
    }
    .btn-filter {
      padding: 5px 10px;
      background: rgba(255,255,255,0.06);
      border: 1px solid rgba(255,255,255,0.12);
      border-radius: 6px;
      color: var(--text);
      font-size: 0.78rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s;
    }
    .btn-filter:hover, .btn-filter.active {
      background: rgba(0, 240, 255, 0.2);
      border-color: var(--cyan);
      color: #fff;
    }
    .btn-filter.btn-diff.active {
      background: rgba(245, 158, 11, 0.25);
      border-color: var(--orange);
      color: #fbbf24;
    }
    .btn-filter.btn-nn.active {
      background: rgba(16, 185, 129, 0.25);
      border-color: var(--green);
      color: #34d399;
    }
    .search-box {
      width: 100%;
      margin-top: 8px;
      padding: 8px 12px;
      background: rgba(0,0,0,0.4);
      border: 1px solid var(--border);
      border-radius: 6px;
      color: #fff;
      font-size: 0.88rem;
      outline: none;
    }
    .search-box:focus { border-color: var(--cyan); }

    /* Compact 7-Column Table */
    .table-container {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 8px;
      overflow: hidden;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
      font-size: 0.82rem;
    }
    th {
      background: #0f172a;
      color: var(--cyan);
      padding: 8px 4px;
      font-weight: 700;
      text-transform: uppercase;
      font-size: 0.75rem;
      border-bottom: 2px solid var(--border-group);
      text-align: center;
    }
    
    /* Column Widths */
    .th-stt   { width: 34px; }
    .th-rhyme { width: 56px; }
    .th-key   { width: 34px; }
    .th-word  { width: 62px; }
    .th-vv1   { width: 52px; }
    .th-a1    { width: 52px; }
    .th-eval  { width: 95px; }

    td {
      padding: 4px 3px;
      text-align: center;
      vertical-align: middle;
      border-bottom: 1px solid rgba(255,255,255,0.05);
    }

    tbody.rhyme-block {
      border-bottom: 2px solid var(--border-group);
    }
    tbody.rhyme-block:nth-child(even) {
      background: rgba(255, 255, 255, 0.015);
    }

    .td-stt {
      font-weight: 700;
      color: var(--text-muted);
    }
    .td-rhyme {
      font-weight: 800;
      color: #fff;
      text-align: left;
      padding-left: 6px;
    }
    .td-key {
      font-family: 'Consolas', monospace;
      font-weight: 700;
    }
    .key-badge {
      display: inline-block;
      width: 22px;
      height: 22px;
      line-height: 22px;
      border-radius: 3px;
      background: rgba(255,255,255,0.06);
    }
    .key-upper {
      background: rgba(245, 158, 11, 0.25);
      color: var(--orange);
      border: 1px solid var(--orange);
    }
    .key-lower {
      color: var(--green);
      border: 1px solid rgba(16, 185, 129, 0.4);
    }

    .td-word {
      font-weight: 700;
      color: #fff;
      text-align: left;
      padding-left: 6px;
    }

    .td-vv1, .td-a1 {
      font-family: 'Consolas', monospace;
      font-size: 0.85rem;
      letter-spacing: 0.5px;
    }
    .td-vv1 {
      color: var(--orange);
    }
    .td-a1 {
      color: var(--green);
      font-weight: 700;
    }

    .td-eval {
      font-family: 'Consolas', monospace;
      font-size: 0.78rem;
    }
    .eval-nn {
      color: var(--text-muted);
      font-style: italic;
    }
    .eval-diff {
      color: #38bdf8;
      font-weight: 700;
      background: rgba(56, 189, 248, 0.12);
      padding: 1px 4px;
      border-radius: 3px;
      display: inline-block;
    }

    tr.row-hidden {
      display: none !important;
    }
    tbody.block-hidden {
      display: none !important;
    }
  </style>
</head>
<body>

<div class="wrapper">
  <!-- Top Bar -->
  <div class="top-bar">
    <div class="top-title">
      <span>⚡ VCOMP 169 VẦN — vV1 vs a1</span>
      <span style="font-size: 0.75rem; color: var(--text-muted);">Compact Mobile View</span>
    </div>
    <div class="top-desc">
      So sánh 7 cột chuẩn: <b>STT • Vần • Phím • Từ • vV1 • a1 • Đánh giá</b> (nn: như nhau, (X=&gt;Y): khác biệt)
    </div>

    <!-- Cluster Coverage Display -->
    <div class="cluster-stats">
      <b>Độ phủ 5 Phụ Âm Kép Số:</b> 
      <span class="cluster-tag">1 (th)</span>: <b>${c1Stats['1']}</b> từ • 
      <span class="cluster-tag">2 (ch)</span>: <b>${c1Stats['2']}</b> từ • 
      <span class="cluster-tag">3 (tr)</span>: <b>${c1Stats['3']}</b> từ • 
      <span class="cluster-tag">4 (nh)</span>: <b>${c1Stats['4']}</b> từ • 
      <span class="cluster-tag">5 (ng)</span>: <b>${c1Stats['5']}</b> từ 
      <span style="color: var(--green);">➔ DÙNG HẾT 100%!</span>
    </div>

    <!-- Stats -->
    <div class="stats-row">
      <span>Tổng: <b>169</b> vần / <b>507</b> từ</span>
      <span>•</span>
      <span class="stat-badge stat-nn">Giống (nn): <b id="statNN">${totalNN}</b> (${((totalNN/totalWords)*100).toFixed(1)}%)</span>
      <span>•</span>
      <span class="stat-badge stat-diff">Khác: <b id="statDiff">${totalDiff}</b> (${((totalDiff/totalWords)*100).toFixed(1)}%)</span>
    </div>

    <!-- Filters -->
    <div class="filters">
      <button class="btn-filter active" data-filter="all">Tất Cả (507)</button>
      <button class="btn-filter btn-diff" data-filter="diff">Khác Nhau (${totalDiff})</button>
      <button class="btn-filter btn-nn" data-filter="nn">Giống Nhau (${totalNN})</button>
      <button class="btn-filter" data-filter="upper">Chỉ Vần HOA (68)</button>
      <button class="btn-filter" data-filter="lower">Chỉ Vần Thường (101)</button>
    </div>

    <input type="text" id="searchInput" class="search-box" placeholder="🔍 Tìm kiếm nhanh (vd: thết, -êt, T=>1, kcs)...">
  </div>

  <!-- Table Container -->
  <div class="table-container">
    <table id="compTable">
      <thead>
        <tr>
          <th class="th-stt">STT</th>
          <th class="th-rhyme">Vần</th>
          <th class="th-key">Phím</th>
          <th class="th-word">Từ</th>
          <th class="th-vv1">vV1</th>
          <th class="th-a1">a1</th>
          <th class="th-eval">Đánh giá</th>
        </tr>
      </thead>
      ${processedRows.map(row => `
      <tbody class="rhyme-block" data-rhyme-id="${row.id}" data-upper="${row.isUpper}" data-has-diff="${row.hasDiff}" data-all-nn="${row.allNN}">
        <!-- Dòng 1 -->
        <tr data-word-idx="0" data-is-diff="${row.words[0].isDiff}" data-search="${row.id} -${row.rhyme} ${row.b60Char} ${row.words[0].word} ${row.words[0].vV1} ${row.words[0].a1} ${row.words[0].evalText}">
          <td class="td-stt">${row.words[0].isDiff && !row.words[1].isDiff ? row.id : ''}</td>
          <td class="td-rhyme"></td>
          <td class="td-key"></td>
          <td class="td-word">${row.words[0].word}</td>
          <td class="td-vv1">${row.words[0].vV1}</td>
          <td class="td-a1">${row.words[0].a1}</td>
          <td class="td-eval"><span class="${row.words[0].isDiff ? 'eval-diff' : 'eval-nn'}">${row.words[0].evalText}</span></td>
        </tr>
        <!-- Dòng 2 (Chính giữa: in STT, Vần, Phím y hệt mẫu) -->
        <tr data-word-idx="1" data-is-diff="${row.words[1].isDiff}" data-search="${row.id} -${row.rhyme} ${row.b60Char} ${row.words[1].word} ${row.words[1].vV1} ${row.words[1].a1} ${row.words[1].evalText}">
          <td class="td-stt">${row.id}</td>
          <td class="td-rhyme">-${row.rhyme}</td>
          <td class="td-key"><span class="key-badge ${row.isUpper ? 'key-upper' : 'key-lower'}">${row.b60Char}</span></td>
          <td class="td-word">${row.words[1].word}</td>
          <td class="td-vv1">${row.words[1].vV1}</td>
          <td class="td-a1">${row.words[1].a1}</td>
          <td class="td-eval"><span class="${row.words[1].isDiff ? 'eval-diff' : 'eval-nn'}">${row.words[1].evalText}</span></td>
        </tr>
        <!-- Dòng 3 -->
        <tr data-word-idx="2" data-is-diff="${row.words[2].isDiff}" data-search="${row.id} -${row.rhyme} ${row.b60Char} ${row.words[2].word} ${row.words[2].vV1} ${row.words[2].a1} ${row.words[2].evalText}">
          <td class="td-stt"></td>
          <td class="td-rhyme"></td>
          <td class="td-key"></td>
          <td class="td-word">${row.words[2].word}</td>
          <td class="td-vv1">${row.words[2].vV1}</td>
          <td class="td-a1">${row.words[2].a1}</td>
          <td class="td-eval"><span class="${row.words[2].isDiff ? 'eval-diff' : 'eval-nn'}">${row.words[2].evalText}</span></td>
        </tr>
      </tbody>
      `).join('')}
    </table>
  </div>
</div>

<script>
  const searchInput = document.getElementById('searchInput');
  const filterBtns = document.querySelectorAll('.btn-filter');
  const rhymeBlocks = document.querySelectorAll('tbody.rhyme-block');
  const statNNEl = document.getElementById('statNN');
  const statDiffEl = document.getElementById('statDiff');

  let activeFilter = 'all';

  function applyFilter() {
    const q = searchInput.value.trim().toLowerCase();
    let visibleWords = 0;
    let visibleNN = 0;
    let visibleDiff = 0;

    rhymeBlocks.forEach(block => {
      const isUpper = block.dataset.upper === 'true';
      const rows = block.querySelectorAll('tr');
      let blockVisibleCount = 0;

      rows.forEach(tr => {
        const isDiff = tr.dataset.isDiff === 'true';
        const searchStr = tr.dataset.search.toLowerCase();

        let passFilter = true;
        if (activeFilter === 'diff' && !isDiff) passFilter = false;
        if (activeFilter === 'nn' && isDiff) passFilter = false;
        if (activeFilter === 'upper' && !isUpper) passFilter = false;
        if (activeFilter === 'lower' && isUpper) passFilter = false;

        const passSearch = !q || searchStr.includes(q);

        if (passFilter && passSearch) {
          tr.classList.remove('row-hidden');
          blockVisibleCount++;
          visibleWords++;
          if (isDiff) visibleDiff++;
          else visibleNN++;
        } else {
          tr.classList.add('row-hidden');
        }
      });

      if (blockVisibleCount > 0) {
        block.classList.remove('block-hidden');
        const visibleRows = Array.from(rows).filter(r => !r.classList.contains('row-hidden'));
        if (visibleRows.length > 0 && !visibleRows.some(r => r.dataset.wordIdx === '1')) {
          visibleRows[0].querySelector('.td-stt').textContent = block.dataset.rhymeId;
          visibleRows[0].querySelector('.td-rhyme').textContent = '-' + block.querySelector('tr[data-word-idx="1"] .td-rhyme').textContent.replace(/^-/, '');
          visibleRows[0].querySelector('.td-key').innerHTML = block.querySelector('tr[data-word-idx="1"] .td-key').innerHTML;
        } else {
          rows[0].querySelector('.td-stt').textContent = '';
          rows[0].querySelector('.td-rhyme').textContent = '';
          rows[0].querySelector('.td-key').innerHTML = '';
          rows[1].querySelector('.td-stt').textContent = block.dataset.rhymeId;
          rows[2].querySelector('.td-stt').textContent = '';
        }
      } else {
        block.classList.add('block-hidden');
      }
    });

    statNNEl.textContent = visibleNN;
    statDiffEl.textContent = visibleDiff;
  }

  searchInput.addEventListener('input', applyFilter);

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeFilter = btn.dataset.filter;
      applyFilter();
    });
  });
</script>

</body>
</html>`;

fs.writeFileSync('./vcomp-169-rhymes.html', htmlContent, 'utf8');
console.log('✓ Đã cập nhật thành công vcomp-169-rhymes.html với phân bổ luân phiên 5 phụ âm kép số!');
