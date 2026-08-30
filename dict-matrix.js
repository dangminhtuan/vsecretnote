import {
  RHYMES_BASE, RHYMES_EXTRA_1, RHYMES_EXTRA_2,
  CONSONANTS_BASE, CONSONANTS_EXTRA,
  REAL_VIETNAMESE_WORDS, ENGLISH_DICT,
  BASE60_MAPPING
} from './data.js';
import {
  removeVietnameseTones, encodeWord, decodeWord,
  timeToBase60, base60ToTime,
  BASE60_HH, BASE60_HH_EXTRA, BASE60_SS
} from './vcomp.js';

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
          baseWords,
          firstBaseWord,
          extraCode,
          extraCount,
          extraWords,
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
    tdRhyme.style.cursor = 'pointer';
    tdRhyme.title = `Vần "${item.rhyme}" (${item.tableLabel}) ➔ Bấm để xem tất cả từ có vần này trong Từ điển`;
    tdRhyme.innerHTML = highlightMatch(item.rhyme, query);
    tdRhyme.onclick = () => window.jumpToDictionary({ rhyme: item.rhyme });
    tr.appendChild(tdRhyme);

    const tdChar = document.createElement('td');
    tdChar.style.cursor = 'pointer';
    tdChar.title = `Mã vần: ${item.rhymeChar} (${item.tableLabel}) ➔ Bấm để lọc Từ điển theo vần "${item.rhyme}"`;
    tdChar.innerHTML = `<span class="rhyme-code-badge ${item.tableBadgeClass}">${highlightMatch(item.rhymeChar, query)}</span>`;
    tdChar.onclick = () => window.jumpToDictionary({ rhyme: item.rhyme });
    tr.appendChild(tdChar);

    item.tonesData.forEach(tData => {
      const tdTone = document.createElement('td');
      
      let baseStyleClass = 'base-p1';
      if (item.tableIdx === 1) baseStyleClass = 'base-p2';
      else if (item.tableIdx === 2) baseStyleClass = 'base-p3';

      const baseDisabled = tData.baseCount === 0;
      const extraDisabled = tData.extraCount === 0;

      const baseWordsPreview = tData.baseWords && tData.baseWords.length > 0
        ? tData.baseWords.map(w => w.word).slice(0, 6).join(', ') + (tData.baseCount > 6 ? '...' : '')
        : '';
      const extraWordsPreview = tData.extraWords && tData.extraWords.length > 0
        ? tData.extraWords.map(w => w.word).slice(0, 6).join(', ') + (tData.extraCount > 6 ? '...' : '')
        : '';

      const baseTitle = !baseDisabled
        ? `PA chính: ${tData.firstBaseWord} (${tData.baseCount} từ: ${baseWordsPreview})\n👉 Bấm để nhảy sang Từ Điển xem tất cả từ cùng quy luật`
        : 'Chưa có từ thực tế';
      const extraTitle = !extraDisabled
        ? `PA phụ: ${tData.firstExtraWord} (${tData.extraCount} từ: ${extraWordsPreview})\n👉 Bấm để nhảy sang Từ Điển xem tất cả từ cùng quy luật`
        : 'Chưa có từ thực tế';

      const baseHtml = !baseDisabled
        ? `<span class="code-badge ${baseStyleClass}" title="${baseTitle}" onclick="window.jumpToDictionary({ rhyme: '${item.rhyme}', toneName: '${tData.toneName}', consGroup: 'base' })">${highlightMatch(tData.baseCode, query)}</span>`
        : `<span class="code-badge disabled-code" title="${baseTitle}">${highlightMatch(tData.baseCode, query)}</span>`;

      const extraHtml = !extraDisabled
        ? `<span class="code-badge extra-p" title="${extraTitle}" onclick="window.jumpToDictionary({ rhyme: '${item.rhyme}', toneName: '${tData.toneName}', consGroup: 'extra' })">${highlightMatch(tData.extraCode, query)}</span>`
        : `<span class="code-badge disabled-code" title="${extraTitle}">${highlightMatch(tData.extraCode, query)}</span>`;

      tdTone.innerHTML = `
        <div style="display:flex; flex-direction:column; gap:2px;">
          ${baseHtml}
          ${extraHtml}
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
let wordsDictionaryData = [];
let all10kData = [];
let currentDataset = [];
let filteredDictData = [];
const PAGE_SIZE = 100;
let currentPage = 1;
let sortCol = 'no';
let sortAsc = true;

let selectedCons = new Set();
let selectedRhymes = new Set();
let selectedTones = new Set();
const allTones = ["=Bằng", "✓Sắc", "`Huyền", "ˀHỏi", "~Ngã", "•Nặng"];

const time6ToWordMap = new Map();

function buildDictionaryData() {
  // 1. Build words dataset
  wordsDictionaryData = REAL_VIETNAMESE_WORDS.map((word, index) => {
    const ph = getPhonetics(word);
    const tc = encodeWord(word);
    const b60 = timeToBase60(tc);
    
    // Calculate 5-digit number (total seconds)
    const h = parseInt(tc.substring(0, 2), 10);
    const m = parseInt(tc.substring(2, 4), 10);
    const s = parseInt(tc.substring(4, 6), 10);
    const totSec = h * 3600 + m * 60 + s;
    const time5 = totSec.toString().padStart(5, '0');

    const item = {
      no: index + 1,
      word,
      consonant: ph.consonant || 'Ø',
      rhyme: ph.rhyme,
      tone: ph.tone,
      toneName: TONE_NAMES[ph.tone],
      b60,
      time: tc,
      time5,
      totSec,
      hasWord: true
    };

    if (!time6ToWordMap.has(tc)) {
      time6ToWordMap.set(tc, item);
    }
    return item;
  });

  // 2. Build 10,000 continuous numbers sequence (00000 - 09999)
  all10kData = [];
  for (let N = 0; N < 10000; N++) {
    const h = Math.floor(N / 3600);
    const rem = N % 3600;
    const m = Math.floor(rem / 60);
    const s = rem % 60;

    const hh = h.toString().padStart(2, '0');
    const mm = m.toString().padStart(2, '0');
    const ss = s.toString().padStart(2, '0');
    const tc = `${hh}${mm}${ss}`;
    const time5 = N.toString().padStart(5, '0');

    const c1 = BASE60_MAPPING[h] || '?';
    const c2 = BASE60_MAPPING[m] || '?';
    const c3 = BASE60_MAPPING[s] || '?';
    const b60 = `${c1}${c2}${c3}`;

    const existing = time6ToWordMap.get(tc);
    if (existing) {
      all10kData.push({
        no: N + 1,
        word: existing.word,
        consonant: existing.consonant,
        rhyme: existing.rhyme,
        tone: existing.tone,
        toneName: existing.toneName,
        b60,
        time: tc,
        time5,
        totSec: N,
        hasWord: true
      });
    } else {
      // Decode slot properties
      let cons = CONSONANTS_BASE[h] !== undefined ? (CONSONANTS_BASE[h] || 'Ø') : 'Ø';
      const s2 = Math.floor(s / 6);
      const s1 = s % 6;
      const toneName = TONE_NAMES[s1] || '-';
      let rhyme = '-';

      if (s2 === 0) rhyme = RHYMES_BASE[m] || '-';
      else if (s2 === 1) rhyme = RHYMES_EXTRA_1[m] || '-';
      else if (s2 === 2) rhyme = RHYMES_EXTRA_2[m] || '-';
      else if (s2 === 3) { cons = CONSONANTS_EXTRA[h] || cons; rhyme = RHYMES_BASE[m] || '-'; }
      else if (s2 === 4) { cons = CONSONANTS_EXTRA[h] || cons; rhyme = RHYMES_EXTRA_1[m] || '-'; }
      else if (s2 === 5) { cons = CONSONANTS_EXTRA[h] || cons; rhyme = RHYMES_EXTRA_2[m] || '-'; }

      all10kData.push({
        no: N + 1,
        word: '—',
        consonant: cons,
        rhyme: rhyme,
        tone: s1,
        toneName: toneName,
        b60,
        time: tc,
        time5,
        totSec: N,
        hasWord: false
      });
    }
  }

  currentDataset = wordsDictionaryData;
  filteredDictData = [...currentDataset];
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
  const fTime5 = document.getElementById('filter-time5')?.value.trim() || '';

  filteredDictData = currentDataset.filter(item => {
    if (fWord && !item.word.toLowerCase().includes(fWord)) return false;
    if (fB60 && !item.b60.toLowerCase().includes(fB60)) return false;
    if (fTime && !item.time.includes(fTime)) return false;
    if (fTime5 && !item.time5.includes(fTime5)) return false;

    if (selectedCons.size > 0 && !selectedCons.has(item.consonant)) return false;
    if (selectedRhymes.size > 0 && !selectedRhymes.has(item.rhyme)) return false;
    if (selectedTones.size > 0 && !selectedTones.has(item.toneName)) return false;

    return true;
  });

  // Sorting
  filteredDictData.sort((a, b) => {
    if (sortCol === 'time5' || sortCol === 'totSec') {
      return sortAsc ? a.totSec - b.totSec : b.totSec - a.totSec;
    }
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

  const modeName = document.getElementById('dict-view-mode')?.value === 'all10k' ? '10.000 số liên tục' : 'Từ thực tế';
  statBar.textContent = `[${modeName}] Tổng: ${total.toLocaleString()} mục | Trang ${currentPage} / ${totalPages}`;
  pageInfo.textContent = `Trang ${currentPage} / ${totalPages}`;
  btnPrev.disabled = currentPage === 1;
  btnNext.disabled = currentPage === totalPages;

  const start = (currentPage - 1) * PAGE_SIZE;
  const end = Math.min(start + PAGE_SIZE, total);
  const pageData = filteredDictData.slice(start, end);

  pageData.forEach(item => {
    const tr = document.createElement('tr');
    if (!item.hasWord) {
      tr.style.opacity = '0.55';
    }

    const wordDisplay = item.hasWord
      ? `<span style="font-weight:bold; color:#fff;">${item.word}</span>`
      : `<span style="color:#555; font-style:italic;">—</span>`;

    tr.innerHTML = `
      <td style="color:#555;">${item.no}</td>
      <td>${wordDisplay}</td>
      <td style="color:#00ffff;">${item.consonant}</td>
      <td style="color:#ffea00;">${item.rhyme}</td>
      <td style="color:#ff55ff;">${item.toneName}</td>
      <td><span style="color:#00ff66; font-weight:bold; background:#001a00; border:1px solid #004400; padding:1px 5px; border-radius:3px;">${item.b60}</span></td>
      <td style="color:#00ffff; font-family:monospace;">${item.time}</td>
      <td style="color:#ffaa00; font-family:monospace; font-weight:bold;">${item.time5}</td>
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

  ['filter-word', 'filter-b60', 'filter-time', 'filter-time5'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', applyDictFilters);
  });

  const viewModeSelect = document.getElementById('dict-view-mode');
  if (viewModeSelect) {
    viewModeSelect.addEventListener('change', () => {
      if (viewModeSelect.value === 'all10k') {
        currentDataset = all10kData;
      } else {
        currentDataset = wordsDictionaryData;
      }
      applyDictFilters();
    });
  }

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

function syncMultiSelectUI(containerId, selectedSet) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const header = document.getElementById(`${containerId}-header`);
  const optionsDiv = document.getElementById(`${containerId}-options`);
  if (!header || !optionsDiv) return;

  const checkboxes = optionsDiv.querySelectorAll('input[type="checkbox"]');
  checkboxes.forEach(cb => {
    cb.checked = selectedSet.has(cb.value);
  });

  if (selectedSet.size === 0) {
    header.textContent = 'Tất cả';
  } else {
    header.textContent = Array.from(selectedSet).join(', ') || 'Đã chọn';
  }
}

window.jumpToDictionary = function({ rhyme, toneName, consGroup, consonant, word } = {}) {
  // 1. Switch to Dict Tab
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  
  const dictTabBtn = document.getElementById('tab-btn-dict');
  const dictTabContent = document.getElementById('tab-dict');
  if (dictTabBtn) dictTabBtn.classList.add('active');
  if (dictTabContent) dictTabContent.classList.add('active');

  // 2. Clear previous filters
  selectedCons.clear();
  selectedRhymes.clear();
  selectedTones.clear();

  const fWord = document.getElementById('filter-word');
  const fB60 = document.getElementById('filter-b60');
  const fTime = document.getElementById('filter-time');
  const fTime5 = document.getElementById('filter-time5');
  if (fWord) fWord.value = word || '';
  if (fB60) fB60.value = '';
  if (fTime) fTime.value = '';
  if (fTime5) fTime5.value = '';

  // 3. Set filters
  if (rhyme) selectedRhymes.add(rhyme);
  if (toneName) selectedTones.add(toneName);
  if (consonant) selectedCons.add(consonant);
  else if (consGroup === 'base') {
    CONSONANTS_BASE.forEach(c => {
      if (c !== null) selectedCons.add(c || 'Ø');
    });
  } else if (consGroup === 'extra') {
    CONSONANTS_EXTRA.forEach(c => {
      if (c !== null) selectedCons.add(c);
    });
  }

  // 4. Update UI
  syncMultiSelectUI('ms-rhymes', selectedRhymes);
  syncMultiSelectUI('ms-tones', selectedTones);
  syncMultiSelectUI('ms-cons', selectedCons);

  // 5. Apply filters & reset to page 1
  currentPage = 1;
  applyDictFilters();

  const dictTab = document.getElementById('tab-dict');
  if (dictTab) dictTab.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

function evaluateOmnibox(query) {
  query = (query || '').trim();
  if (!query) return null;
  
  const qLower = query.toLowerCase();

  // 1. Check 6 Tone Tables: b1 -> b6
  if (/^b[1-6]$/i.test(query)) {
    const s2 = parseInt(query.substring(1), 10) - 1;
    const tones = BASE60_SS.slice(s2 * 6, s2 * 6 + 6);
    const tableNames = [
      'B1: PA Chính + Vần B1 (Telex thường)',
      'B2: PA Chính + Vần B2 (Telex HOA)',
      'B3: PA Chính + Vần B3 (Nguyên âm thường)',
      'B4: PA Phụ + Vần B1 (VNI 1: 0-5)',
      'B5: PA Phụ + Vần B2 (VNI 2: 6-9+BC)',
      'B6: PA Phụ + Vần B3 (Nguyên âm HOA)'
    ];
    const toneLabels = ['0: Ngang', '1: Sắc', '2: Huyền', '3: Hỏi', '4: Ngã', '5: Nặng'];
    return {
      title: `📋 ${tableNames[s2]}`,
      html: tones.map((code, idx) => `<span style="display:inline-block; margin:2px 4px; padding:3px 8px; background:#002211; border:1px solid #00ffcc; border-radius:4px; color:#fff;"><b>${code}</b> <span style="color:#88d; font-size:11px;">(${toneLabels[idx]})</span></span>`).join('')
    };
  }

  // 2. Check Consonant tables: cm / c1, cp / c2
  if (qLower === 'cm' || qLower === 'c1' || qLower === 'pa1') {
    const c1Clean = CONSONANTS_BASE.map((c, idx) => {
      const code = BASE60_HH[idx];
      if (!c) return `Ø➔<b>${code}</b>`;
      return c === code ? `<b>${c}</b>` : `${c}➔<b>${code}</b>`;
    }).join(', ');
    return {
      title: '📋 24 Phụ Âm Chính (Bảng cm / c1)',
      html: `<div style="line-height:1.7; color:#eee; font-size:12.5px;">${c1Clean}</div>`
    };
  }

  if (qLower === 'cp' || qLower === 'cp2' || qLower === 'c2' || qLower === 'pa2') {
    const c2Clean = CONSONANTS_EXTRA.filter(c => c).map((c, idx) => {
      const code = BASE60_HH_EXTRA[idx];
      return c === code ? `<b>${c}</b>` : `${c}➔<b>${code}</b>`;
    }).join(', ');
    return {
      title: '📋 7 Phụ Âm Phụ (Bảng cp / c2)',
      html: `<div style="line-height:1.7; color:#eee; font-size:13px;">${c2Clean}</div>`
    };
  }

  // 3. Check Tone shortcuts: dz, ds, df, dr, dx, dj and symbols (= / \ ? ~ .)
  const toneSymbolsMap = {
    'dz': { name: 'Dấu Ngang (0)', idx: 0 },
    'dn': { name: 'Dấu Ngang (0)', idx: 0 },
    'd0': { name: 'Dấu Ngang (0)', idx: 0 },
    '=': { name: 'Dấu Ngang (0)', idx: 0 },
    'ds': { name: 'Dấu Sắc (1)', idx: 1 },
    'd1': { name: 'Dấu Sắc (1)', idx: 1 },
    '/': { name: 'Dấu Sắc (1)', idx: 1 },
    'df': { name: 'Dấu Huyền (2)', idx: 2 },
    'dh': { name: 'Dấu Huyền (2)', idx: 2 },
    'd2': { name: 'Dấu Huyền (2)', idx: 2 },
    '\\': { name: 'Dấu Huyền (2)', idx: 2 },
    'dr': { name: 'Dấu Hỏi (3)', idx: 3 },
    'd3': { name: 'Dấu Hỏi (3)', idx: 3 },
    '?': { name: 'Dấu Hỏi (3)', idx: 3 },
    'dx': { name: 'Dấu Ngã (4)', idx: 4 },
    'd4': { name: 'Dấu Ngã (4)', idx: 4 },
    '~': { name: 'Dấu Ngã (4)', idx: 4 },
    'dj': { name: 'Dấu Nặng (5)', idx: 5 },
    'd5': { name: 'Dấu Nặng (5)', idx: 5 },
    '.': { name: 'Dấu Nặng (5)', idx: 5 }
  };
  if (toneSymbolsMap[qLower] || toneSymbolsMap[query]) {
    const { name, idx } = toneSymbolsMap[qLower] || toneSymbolsMap[query];
    const codes = [];
    for (let s2 = 0; s2 < 6; s2++) {
      codes.push(`B${s2+1}: <b>${BASE60_SS[s2 * 6 + idx]}</b>`);
    }
    return {
      title: `⚡ ${name} ở 6 Bảng Mã (Shortcut: d + telex)`,
      html: `<div style="display:flex; gap:8px; flex-wrap:wrap; font-size:12.5px;">${codes.map(c => `<span style="padding:3px 8px; background:#002211; border:1px solid #00ffcc; border-radius:4px;">${c}</span>`).join('')}</div>`
    };
  }

  // 4. Check Vowel/Letter Shortcuts: av, ev, iv, uv, yv, ov or single letters
  if (qLower === 'ov') {
    return {
      title: '📖 Vần [ O ] trong Tiếng Việt ➔ Mã Base60: 4',
      html: `
        <div style="font-size:12.5px; line-height:1.7; color:#eee;">
          <div>• <b>Vần 'o'</b> nằm ở <b>Bảng 2 (Index 35)</b> ➔ Mã ký tự Base60 là: <b style="color:#00ffcc; font-size:15px;">4</b></div>
          <div>• <b>Ví dụ:</b> <i>cho</i> ➔ <b style="color:#00ff66;">C4Z</b> | <i>bò</i> ➔ <b style="color:#00ff66;">b4F</b> | <i>cỏ</i> ➔ <b style="color:#00ff66;">c4R</b> | <i>to</i> ➔ <b style="color:#00ff66;">T4Z</b></div>
          <div style="color:#aaa; font-size:11.5px;">(Lưu ý: Mặt chữ O/o không dùng trong Base60 để tránh nhầm với số 0).</div>
        </div>
      `
    };
  }

  let targetChar = null;
  if (/^[aeiuy]v$/i.test(query)) {
    targetChar = query[0].toLowerCase();
  } else if (/^[a-z]$/i.test(query)) {
    targetChar = query.toLowerCase();
  }

  if (targetChar) {
    if (targetChar === 'o') {
      return {
        title: '🚫 Ký tự [ O / o ] trong Base60',
        html: '<div style="color:#ffaa00; font-size:12.5px;">Chữ <b>O/o</b> đã bị loại trừ khỏi hệ thống Base60 để tránh nhầm với <b>Số 0</b>! Để tra vần <i>o</i>, hãy gõ <b>ov</b>.</div>'
      };
    }

    const char = targetChar;
    const upper = char.toUpperCase();

    // PA
    const paList = [];
    CONSONANTS_BASE.forEach((c, idx) => {
      const code = BASE60_HH[idx];
      if (code === char || code === upper) {
        const n = c || 'Ø';
        paList.push(n === code ? `<b>${n}</b>` : `${n}➔<b>${code}</b>`);
      }
    });
    CONSONANTS_EXTRA.forEach((c, idx) => {
      if (!c) return;
      const code = BASE60_HH_EXTRA[idx];
      if (code === char || code === upper) {
        paList.push(c === code ? `[Phụ] <b>${c}</b>` : `[Phụ] ${c}➔<b>${code}</b>`);
      }
    });

    // Vần
    const vList = [];
    [char, upper].forEach(k => {
      const mmIdx = BASE60_MAPPING.indexOf(k);
      if (mmIdx !== -1) {
        const r1 = RHYMES_BASE[mmIdx] || '-';
        const r2 = RHYMES_EXTRA_1[mmIdx] || '-';
        const r3 = RHYMES_EXTRA_2[mmIdx] || '-';
        vList.push(`<b>${k}</b>: B1=${r1} | B2=${r2} | B3=${r3}`);
      }
    });

    // Dấu
    const toneList = [];
    const toneNames = ['Ngang', 'Sắc', 'Huyền', 'Hỏi', 'Ngã', 'Nặng'];
    [char, upper].forEach(k => {
      const ssIdx = BASE60_SS.indexOf(k);
      if (ssIdx !== -1 && ssIdx < 36) {
        const bIdx = Math.floor(ssIdx / 6) + 1;
        const tName = toneNames[ssIdx % 6];
        toneList.push(`<b>${k}</b> (B${bIdx} ${tName})`);
      }
    });

    return {
      title: `🔤 Phím [ ${upper} / ${char} ] trong Ma Trận TimeCypher`,
      html: `
        <div style="display:flex; flex-direction:column; gap:5px; font-size:12.5px;">
          ${paList.length > 0 ? `<div><span style="color:#ffaa00; font-weight:bold;">Phụ âm:</span> ${paList.join(', ')}</div>` : ''}
          ${vList.length > 0 ? `<div><span style="color:#00ffcc; font-weight:bold;">Vần:</span> ${vList.join(' · ')}</div>` : ''}
          ${toneList.length > 0 ? `<div><span style="color:#ff55ff; font-weight:bold;">Dấu thanh:</span> ${toneList.join(', ')}</div>` : ''}
        </div>
      `
    };
  }

  // 5. Check Single Digit: 0-9 or 0v-9v
  let targetDigit = null;
  if (/^[0-9]v$/i.test(query)) {
    targetDigit = query[0];
  } else if (/^[0-9]$/.test(query)) {
    targetDigit = query;
  }

  if (targetDigit !== null) {
    const d = targetDigit;
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
      toneList.push(`<b>${d}</b> (B${bIdx} ${tName})`);
    }

    return {
      title: `🔢 Chữ số [ ${d} ] trong Base60 (Vị trí Phút mm=${mmIdx})`,
      html: `
        <div style="display:flex; flex-direction:column; gap:5px; font-size:12.5px;">
          <div><span style="color:#00ffcc; font-weight:bold;">Vần (B1/B2/B3):</span> <b>${d}</b>: ${r1} / ${r2} / ${r3}</div>
          ${toneList.length > 0 ? `<div><span style="color:#ff55ff; font-weight:bold;">Dấu thanh:</span> ${toneList.join(', ')}</div>` : ''}
        </div>
      `
    };
  }

  // 6. Check if Vietnamese word
  const encoded = encodeWord(query);
  if (encoded && !encoded.startsWith('[')) {
    const b60 = timeToBase60(encoded);
    const ph = getPhonetics(query);
    return {
      title: `📖 Từ Tiếng Việt: <b style="color:#fff; font-size:14px;">"${query}"</b> ➔ Mã Base60: <span style="color:#00ff66; font-size:16px; font-weight:bold; background:#002200; padding:2px 7px; border:1px solid #00ff66; border-radius:3px;">${b60}</span>`,
      html: `
        <div style="display:flex; gap:12px; align-items:center; flex-wrap:wrap; font-size:12.5px;">
          <span>Mã 6 Số: <b style="color:#00ffff;">${encoded}</b></span>
          <span>Phụ âm: <b style="color:#ffaa00;">${ph.consonant || 'Ø'}</b></span>
          <span>Vần: <b style="color:#ffea00;">${ph.rhyme}</b></span>
          <span>Dấu: <b style="color:#ff55ff;">${TONE_NAMES[ph.tone]}</b></span>
          <button class="cyber-btn-small" style="background:#00ffcc; color:#000; border:none; padding:3px 9px; cursor:pointer; font-weight:bold; border-radius:3px;" onclick="window.jumpToDictionary({ word: '${query}' })">🔍 Xem trong Từ Điển</button>
        </div>
      `
    };
  }

  // 6. Check if Base60 code (length 3)
  if (query.length === 3) {
    const decoded = decodeWord(base60ToTime(query));
    if (decoded && !decoded.startsWith('[ERR') && !decoded.startsWith('[')) {
      return {
        title: `🔐 Mã Base60: <b style="color:#00ff66; font-size:15px;">"${query}"</b> ➔ Từ Tiếng Việt: <span style="color:#fff; font-size:16px; font-weight:bold; background:#002211; padding:2px 7px; border:1px solid #00ffcc; border-radius:3px;">${decoded}</span>`,
        html: `
          <div style="display:flex; gap:12px; align-items:center; flex-wrap:wrap; font-size:12.5px;">
            <span>Mã 6 số: <b style="color:#00ffff;">${base60ToTime(query)}</b></span>
            <button class="cyber-btn-small" style="background:#00ffcc; color:#000; border:none; padding:3px 9px; cursor:pointer; font-weight:bold; border-radius:3px;" onclick="window.jumpToDictionary({ word: '${decoded}' })">🔍 Xem trong Từ Điển</button>
          </div>
        `
      };
    }
  }

  return null;
}

function initSmartOmnibox() {
  const input = document.getElementById('smart-omnibox-input');
  const resultDiv = document.getElementById('smart-omnibox-result');
  const btnClear = document.getElementById('btn-clear-omnibox');

  if (!input || !resultDiv) return;

  const handleInput = () => {
    const val = input.value.trim();
    if (btnClear) btnClear.style.display = val ? 'inline-block' : 'none';

    if (!val) {
      resultDiv.style.display = 'none';
      resultDiv.innerHTML = '';
      return;
    }

    const res = evaluateOmnibox(val);
    if (res) {
      resultDiv.innerHTML = `
        <div style="color:#00ffcc; font-weight:bold; font-size:13px; margin-bottom:6px;">${res.title}</div>
        <div>${res.html}</div>
      `;
      resultDiv.style.display = 'block';
    } else {
      resultDiv.style.display = 'none';
    }
  };

  input.addEventListener('input', handleInput);
  if (btnClear) {
    btnClear.addEventListener('click', () => {
      input.value = '';
      handleInput();
      input.focus();
    });
  }
}

function checkUrlParams() {
  const params = new URLSearchParams(window.location.search);
  const rhyme = params.get('rhyme');
  const tone = params.get('tone');
  const consGroup = params.get('consGroup');
  const cons = params.get('cons');
  const word = params.get('word');

  if (rhyme || tone || consGroup || cons || word) {
    window.jumpToDictionary({
      rhyme: rhyme || undefined,
      toneName: tone || undefined,
      consGroup: consGroup || undefined,
      consonant: cons || undefined,
      word: word || undefined
    });
  }
}

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.ms-container')) {
      document.querySelectorAll('.ms-container').forEach(c => c.classList.remove('open'));
    }
  });

  // ==========================================
  // DYNAMIC GBOARD DICTIONARY COMBINATIONS
  // ==========================================
  function updateGboardDownloadLink() {
    const chkR = document.getElementById('chk-r');
    const chkF = document.getElementById('chk-f');
    const chkB = document.getElementById('chk-b');
    const chkL = document.getElementById('chk-l');
    if (!chkR || !chkF || !chkB || !chkL) return;

    const activeKeys = [];
    if (chkR.checked) activeKeys.push('R');
    if (chkF.checked) activeKeys.push('F');
    if (chkB.checked) activeKeys.push('B');
    if (chkL.checked) activeKeys.push('L');

    const activeStr = activeKeys.length > 0 ? activeKeys.join('_') : 'EMPTY';
    const zipName = `Gboard_Dict_${activeStr}.zip`;

    const dlLink = document.getElementById('dl-link');
    const dlFilename = document.getElementById('dl-filename');
    if (dlLink) {
      dlLink.href = `/${zipName}`;
      dlLink.download = zipName;
    }
    if (dlFilename) {
      dlFilename.textContent = zipName;
    }
  }

  ['chk-r', 'chk-f', 'chk-b', 'chk-l'].forEach(id => {
    document.getElementById(id)?.addEventListener('change', updateGboardDownloadLink);
  });
  
  // Chạy lần đầu khởi tạo
  updateGboardDownloadLink();

  renderDictTable();
  initSmartOmnibox();
  checkUrlParams();
});
