import {
  RHYMES_BASE, RHYMES_EXTRA_1, RHYMES_EXTRA_2,
  CONSONANTS_BASE, CONSONANTS_EXTRA,
  REAL_VIETNAMESE_WORDS,
  BASE60_MAPPING
} from './data.js';
import { removeVietnameseTones, encodeWord, timeToBase60 } from './vcomp.js';

// ==========================================
// 1. TAB SWITCHER
// ==========================================
document.querySelectorAll('.tab-btn[data-target]').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    btn.classList.add('active');
    const targetId = btn.getAttribute('data-target');
    const targetContent = document.getElementById(targetId);
    if (targetContent) targetContent.classList.add('active');
  });
});

const TONE_NAMES = {
  0: "=Bằng",
  1: "✓Sắc",
  2: "`Huyền",
  3: "ˀHỏi",
  4: "~Ngã",
  5: "•Nặng"
};

const allConsonants = [...new Set([...CONSONANTS_BASE, ...CONSONANTS_EXTRA].filter(c => c !== null))].sort((a,b) => b.length - a.length);
const extraConsSet = new Set(['p', 'ph', 'qu', 't', 'th', 'tr', 'x']);

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
    if (rhyme === '') rhyme = 'i';
    else if (rhyme.startsWith('ê')) rhyme = 'i' + rhyme;
    else if (!/^[aăâeêioôơuưy]/.test(rhyme)) rhyme = 'i' + rhyme;
  }
  return { consonant, rhyme, tone };
}

// Map key: `${rhyme}|${tone}|${groupKey}` -> array of { word, b60, ph }
const wordCache = new Map();

function buildWordCache() {
  REAL_VIETNAMESE_WORDS.forEach(word => {
    const ph = getPhonetics(word);
    const enc = encodeWord(word);
    const b60 = timeToBase60(enc);
    const isExtra = extraConsSet.has(ph.consonant);
    const groupKey = isExtra ? 'extra' : 'base';
    const key = `${ph.rhyme}|${ph.tone}|${groupKey}`;
    if (!wordCache.has(key)) {
      wordCache.set(key, []);
    }
    wordCache.get(key).push({ word, b60, ph });
  });
}

// ==========================================
// 2. RHYME MATRIX TAB LOGIC
// ==========================================
let allMatrixItems = [];
let filteredMatrixItems = [];
let sortMode = 'default';

function buildMatrixData() {
  const items = [];
  let stt = 1;

  const tables = [
    { list: RHYMES_BASE, tableIdx: 0 },
    { list: RHYMES_EXTRA_1, tableIdx: 1 },
    { list: RHYMES_EXTRA_2, tableIdx: 2 }
  ];

  tables.forEach(({ list, tableIdx }) => {
    list.forEach((rhyme, mm) => {
      if (!rhyme || rhyme.trim() === '') return;

      const rhymeChar = BASE60_MAPPING[mm] || '?';
      
      const tonesData = [];
      for (let t = 0; t < 6; t++) {
        const toneName = TONE_NAMES[t];
        
        // Base PA (Group 1)
        const baseWords = wordCache.get(`${rhyme}|${t}|base`) || [];
        const baseCount = baseWords.length;
        let baseCode = '';
        let firstBaseWord = '';

        if (baseCount > 0) {
          firstBaseWord = baseWords[0].word;
          baseCode = baseWords[0].b60;
        } else {
          // Synthetic code
          const hh = 19; // z
          const c1 = BASE60_MAPPING[hh];
          const c2 = rhymeChar;
          const s2 = tableIdx;
          const ss = s2 * 6 + t;
          const c3 = BASE60_MAPPING[ss];
          baseCode = `${c1}${c2}${c3}`;
        }

        // Extra PA (Group 2)
        const extraWords = wordCache.get(`${rhyme}|${t}|extra`) || [];
        const extraCount = extraWords.length;
        let extraCode = '';
        let firstExtraWord = '';

        if (extraCount > 0) {
          firstExtraWord = extraWords[0].word;
          extraCode = extraWords[0].b60;
        } else {
          const hh = 0; // p
          const c1 = BASE60_MAPPING[hh];
          const c2 = rhymeChar;
          const s2 = tableIdx + 3;
          const ss = s2 * 6 + t;
          const c3 = BASE60_MAPPING[ss];
          extraCode = `${c1}${c2}${c3}`;
        }

        tonesData.push({
          toneIdx: t,
          toneName,
          baseCode,
          baseCount,
          firstBaseWord,
          extraCode,
          extraCount,
          firstExtraWord
        });
      }

      let tableTagClass = 'tag-b1';
      let tableBadgeClass = 'code-b1';
      let tableLabel = 'B1';
      if (tableIdx === 1) { tableTagClass = 'tag-b2'; tableBadgeClass = 'code-b2'; tableLabel = 'B2'; }
      else if (tableIdx === 2) { tableTagClass = 'tag-b3'; tableBadgeClass = 'code-b3'; tableLabel = 'B3'; }

      items.push({
        stt: stt++,
        rhyme,
        rhymeChar,
        tableIdx,
        tableLabel,
        tableTagClass,
        tableBadgeClass,
        tonesData
      });
    });
  });

  allMatrixItems = items;
  filteredMatrixItems = [...items];
}

function renderMatrixTable() {
  const tbody = document.getElementById('matrix-body');
  const stat = document.getElementById('matrix-stat');
  if (!tbody) return;

  tbody.innerHTML = '';
  stat.textContent = `Hiển thị ${filteredMatrixItems.length} / ${allMatrixItems.length} vần`;

  const query = document.getElementById('matrix-search')?.value.trim().toLowerCase() || '';

  filteredMatrixItems.forEach(item => {
    const tr = document.createElement('tr');

    const tdStt = document.createElement('td');
    tdStt.textContent = item.stt;
    tr.appendChild(tdStt);

    const tdRhyme = document.createElement('td');
    tdRhyme.innerHTML = highlightMatch(item.rhyme, query);
    tr.appendChild(tdRhyme);

    const tdChar = document.createElement('td');
    tdChar.innerHTML = `<span class="rhyme-code-badge ${item.tableBadgeClass}" title="Bảng: ${item.tableLabel}">${highlightMatch(item.rhymeChar, query)}</span>`;
    tr.appendChild(tdChar);

    item.tonesData.forEach(tData => {
      const tdTone = document.createElement('td');
      
      let baseStyleClass = 'base-p1';
      if (item.tableIdx === 1) baseStyleClass = 'base-p2';
      else if (item.tableIdx === 2) baseStyleClass = 'base-p3';

      const baseDisabled = tData.baseCount === 0 ? 'disabled-code' : '';
      const extraDisabled = tData.extraCount === 0 ? 'disabled-code' : '';

      const baseTitle = tData.baseCount > 0 ? `PA chính: ${tData.firstBaseWord} (${tData.baseCount} từ)` : 'Chưa có từ thực tế';
      const extraTitle = tData.extraCount > 0 ? `PA phụ: ${tData.firstExtraWord} (${tData.extraCount} từ)` : 'Chưa có từ thực tế';

      tdTone.innerHTML = `
        <div style="display:flex; flex-direction:column; gap:2px;">
          <span class="code-badge ${baseStyleClass} ${baseDisabled}" title="${baseTitle}">${highlightMatch(tData.baseCode, query)}</span>
          <span class="code-badge extra-p ${extraDisabled}" title="${extraTitle}">${highlightMatch(tData.extraCode, query)}</span>
        </div>
      `;
      tr.appendChild(tdTone);
    });

    tbody.appendChild(tr);
  });
}

function highlightMatch(text, query) {
  if (!query || !text) return text;
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  return text.replace(regex, '<mark class="search-highlight">$1</mark>');
}

function applyMatrixFilters() {
  const query = document.getElementById('matrix-search')?.value.trim().toLowerCase() || '';
  const tableVal = document.getElementById('matrix-table-filter')?.value || 'all';

  filteredMatrixItems = allMatrixItems.filter(item => {
    if (tableVal !== 'all' && item.tableIdx.toString() !== tableVal) return false;
    if (!query) return true;

    if (item.rhyme.toLowerCase().includes(query)) return true;
    if (item.rhymeChar.toLowerCase().includes(query)) return true;

    for (const t of item.tonesData) {
      if (t.baseCode.toLowerCase().includes(query)) return true;
      if (t.extraCode.toLowerCase().includes(query)) return true;
      if (t.firstBaseWord.toLowerCase().includes(query)) return true;
      if (t.firstExtraWord.toLowerCase().includes(query)) return true;
    }
    return false;
  });

  if (sortMode === 'by-char') {
    filteredMatrixItems.sort((a, b) => a.rhymeChar.localeCompare(b.rhymeChar));
  } else {
    filteredMatrixItems.sort((a, b) => a.stt - b.stt);
  }

  renderMatrixTable();
}

// ==========================================
// 3. DICTIONARY TAB LOGIC
// ==========================================
let dictionaryData = [];
let filteredDictData = [];
const PAGE_SIZE = 100;
let currentPage = 1;
let sortCol = 'no';
let sortAsc = true;

let selectedCons = new Set();
let selectedRhymes = new Set();
let selectedTones = new Set();
const allTones = ["=Bằng", "✓Sắc", "`Huyền", "ˀHỏi", "~Ngã", "•Nặng"];

function buildDictionaryData() {
  dictionaryData = REAL_VIETNAMESE_WORDS.map((word, index) => {
    const ph = getPhonetics(word);
    const tc = encodeWord(word);
    const b60 = timeToBase60(tc);
    return {
      no: index + 1,
      word,
      consonant: ph.consonant || 'Ø',
      rhyme: ph.rhyme,
      tone: ph.tone,
      toneName: TONE_NAMES[ph.tone],
      b60,
      time: tc
    };
  });
  filteredDictData = [...dictionaryData];
}

function initMultiSelect(containerId, dataList, selectedSet) {
  const container = document.getElementById(containerId);
  const header = document.getElementById(`${containerId}-header`);
  const optionsDiv = document.getElementById(`${containerId}-options`);
  const searchInput = document.getElementById(`${containerId}-search`);

  if (!container || !header || !optionsDiv || !searchInput) return;

  header.addEventListener('click', (e) => {
    e.stopPropagation();
    container.classList.toggle('open');
    if (container.classList.contains('open')) {
      searchInput.focus();
    }
  });

  const updateHeader = () => {
    if (selectedSet.size === 0) {
      header.textContent = 'Tất cả';
    } else {
      header.textContent = Array.from(selectedSet).join(', ') || 'Đã chọn';
    }
    applyDictFilters();
  };

  const optionLabels = [];

  dataList.forEach(item => {
    const label = document.createElement('label');
    label.className = 'ms-option';
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.value = item;
    cb.addEventListener('change', () => {
      if (cb.checked) selectedSet.add(item);
      else selectedSet.delete(item);
      updateHeader();
    });
    label.appendChild(cb);
    label.appendChild(document.createTextNode(item));
    optionsDiv.appendChild(label);
    optionLabels.push({ label, text: item.toLowerCase() });
  });

  searchInput.addEventListener('input', () => {
    const q = searchInput.value.trim().toLowerCase();
    optionLabels.forEach(({ label, text }) => {
      label.style.display = text.includes(q) ? 'flex' : 'none';
    });
  });
}

function applyDictFilters() {
  const fWord = document.getElementById('filter-word')?.value.trim().toLowerCase() || '';
  const fB60 = document.getElementById('filter-b60')?.value.trim().toLowerCase() || '';
  const fTime = document.getElementById('filter-time')?.value.trim() || '';

  filteredDictData = dictionaryData.filter(item => {
    if (fWord && !item.word.toLowerCase().includes(fWord)) return false;
    if (fB60 && !item.b60.toLowerCase().includes(fB60)) return false;
    if (fTime && !item.time.includes(fTime)) return false;

    if (selectedCons.size > 0 && !selectedCons.has(item.consonant)) return false;
    if (selectedRhymes.size > 0 && !selectedRhymes.has(item.rhyme)) return false;
    if (selectedTones.size > 0 && !selectedTones.has(item.toneName)) return false;

    return true;
  });

  // Sorting
  filteredDictData.sort((a, b) => {
    let valA = a[sortCol];
    let valB = b[sortCol];
    if (typeof valA === 'string') {
      return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
    }
    return sortAsc ? valA - valB : valB - valA;
  });

  currentPage = 1;
  renderDictTable();
}

function renderDictTable() {
  const tbody = document.getElementById('dict-table-body');
  const statBar = document.getElementById('dict-stat-bar');
  const btnPrev = document.getElementById('btn-prev-page');
  const btnNext = document.getElementById('btn-next-page');
  const pageInfo = document.getElementById('page-info');

  if (!tbody) return;

  tbody.innerHTML = '';
  const total = filteredDictData.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  if (currentPage > totalPages) currentPage = totalPages;

  statBar.textContent = `Tổng cộng: ${total.toLocaleString()} từ | Trang ${currentPage} / ${totalPages}`;
  pageInfo.textContent = `Trang ${currentPage} / ${totalPages}`;
  btnPrev.disabled = currentPage === 1;
  btnNext.disabled = currentPage === totalPages;

  const start = (currentPage - 1) * PAGE_SIZE;
  const end = Math.min(start + PAGE_SIZE, total);
  const pageData = filteredDictData.slice(start, end);

  pageData.forEach(item => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td style="color:#555;">${item.no}</td>
      <td style="font-weight:bold; color:#fff;">${item.word}</td>
      <td style="color:#00ffff;">${item.consonant}</td>
      <td style="color:#ffea00;">${item.rhyme}</td>
      <td style="color:#ff55ff;">${item.toneName}</td>
      <td><span style="color:#00ff66; font-weight:bold; background:#001a00; border:1px solid #004400; padding:1px 5px; border-radius:3px;">${item.b60}</span></td>
      <td style="color:#00ffff; font-family:monospace;">${item.time}</td>
    `;
    tbody.appendChild(tr);
  });
}

// ==========================================
// 4. INITIALIZATION
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  buildWordCache();

  // Init Matrix Tab
  buildMatrixData();
  renderMatrixTable();

  document.getElementById('matrix-search')?.addEventListener('input', applyMatrixFilters);
  document.getElementById('matrix-table-filter')?.addEventListener('change', applyMatrixFilters);
  
  const sortBtn = document.getElementById('matrix-sort-btn');
  if (sortBtn) {
    sortBtn.addEventListener('click', () => {
      if (sortMode === 'default') {
        sortMode = 'by-char';
        sortBtn.textContent = 'Sắp xếp: Mã A-Z';
      } else {
        sortMode = 'default';
        sortBtn.textContent = 'Sắp xếp: Theo STT';
      }
      applyMatrixFilters();
    });
  }

  // Init Dict Tab
  buildDictionaryData();

  const allRhymesList = [...new Set([...RHYMES_BASE, ...RHYMES_EXTRA_1, ...RHYMES_EXTRA_2].filter(r => r !== null))].sort();
  initMultiSelect('ms-cons', allConsonants, selectedCons);
  initMultiSelect('ms-rhymes', allRhymesList, selectedRhymes);
  initMultiSelect('ms-tones', allTones, selectedTones);

  ['filter-word', 'filter-b60', 'filter-time'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', applyDictFilters);
  });

  document.querySelectorAll('th .th-title[data-col]').forEach(el => {
    el.addEventListener('click', () => {
      const col = el.getAttribute('data-col');
      if (sortCol === col) {
        sortAsc = !sortAsc;
      } else {
        sortCol = col;
        sortAsc = true;
      }
      document.querySelectorAll('.sort-icon').forEach(si => si.textContent = '');
      const icon = el.querySelector('.sort-icon');
      if (icon) icon.textContent = sortAsc ? '▲' : '▼';
      applyDictFilters();
    });
  });

  document.getElementById('btn-prev-page')?.addEventListener('click', () => {
    if (currentPage > 1) { currentPage--; renderDictTable(); }
  });
  document.getElementById('btn-next-page')?.addEventListener('click', () => {
    const totalPages = Math.ceil(filteredDictData.length / PAGE_SIZE);
    if (currentPage < totalPages) { currentPage++; renderDictTable(); }
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.ms-container')) {
      document.querySelectorAll('.ms-container').forEach(c => c.classList.remove('open'));
    }
  });

  renderDictTable();
});
