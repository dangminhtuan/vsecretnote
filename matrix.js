import {
  RHYMES_BASE, RHYMES_EXTRA_1, RHYMES_EXTRA_2,
  CONSONANTS_BASE, CONSONANTS_EXTRA,
  REAL_VIETNAMESE_WORDS,
  BASE60_MAPPING
} from './data.js';
import { removeVietnameseTones, encodeWord, timeToBase60 } from './vcomp.js';

const TONE_NAMES = {
  0: "=Bằng",
  1: "✓Sắc",
  2: "`Huyền",
  3: "ˀHỏi",
  4: "~Ngã",
  5: "•Nặng"
};

const TABLE_NAMES = {
  0: "Bảng 1 (Base)",
  1: "Bảng 2 (Extra 1)",
  2: "Bảng 3 (Extra 2)"
};

const allConsonants = [...new Set([...CONSONANTS_BASE, ...CONSONANTS_EXTRA].filter(c => c !== null))].sort((a,b) => b.length - a.length);
const extraConsSet = new Set(['p', 'ph', 'qu', 't', 'th', 'tr', 'x']);

function removeAccents(str) {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D');
}

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

let allMatrixItems = [];
let filteredMatrixItems = [];
let sortMode = 'default'; // 'default' | 'by-char'

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
          // Fallback code when disabled
          const s2_base = tableIdx;
          const ss_base = s2_base * 6 + t;
          const fakeTime = '00' + mm.toString().padStart(2,'0') + ss_base.toString().padStart(2,'0');
          baseCode = timeToBase60(fakeTime);
        }
        const baseLink = `/dict.html?rhyme=${encodeURIComponent(rhyme)}&tone=${encodeURIComponent(toneName)}&consGroup=base`;

        // Extra PA (Group 2)
        const extraWords = wordCache.get(`${rhyme}|${t}|extra`) || [];
        const extraCount = extraWords.length;
        let extraCode = '';
        let firstExtraWord = '';

        if (extraCount > 0) {
          firstExtraWord = extraWords[0].word;
          extraCode = extraWords[0].b60;
        } else {
          // Fallback code when disabled
          const s2_extra = 3 + tableIdx;
          const ss_extra = s2_extra * 6 + t;
          const fakeTime = '03' + mm.toString().padStart(2,'0') + ss_extra.toString().padStart(2,'0');
          extraCode = timeToBase60(fakeTime);
        }
        const extraLink = `/dict.html?rhyme=${encodeURIComponent(rhyme)}&tone=${encodeURIComponent(toneName)}&consGroup=extra`;

        tonesData.push({
          toneIndex: t,
          toneName,
          baseCode,
          firstBaseWord,
          baseLink,
          baseWords,
          baseCount,
          extraCode,
          firstExtraWord,
          extraSuffix: extraCode.substring(1),
          extraLink,
          extraWords,
          extraCount
        });
      }

      items.push({
        stt: stt++,
        rhyme,
        rhymeNoMark: removeAccents(rhyme.toLowerCase()),
        rhymeChar,
        mmIndex: mm,
        tableIdx,
        tableName: TABLE_NAMES[tableIdx],
        tones: tonesData
      });
    });
  });

  return items;
}

function renderMatrix() {
  const tbody = document.getElementById('matrix-tbody');
  if (!tbody) return;
  tbody.innerHTML = '';

  const statText = document.getElementById('stat-text');
  if (statText) {
    const modeLabel = sortMode === 'by-char' ? '(Gom theo Ký tự)' : '(Mặc định)';
    statText.textContent = `Hiển thị ${filteredMatrixItems.length} / ${allMatrixItems.length} vần ${modeLabel}`;
  }

  const btnSort = document.getElementById('btn-sort-mode');
  if (btnSort) {
    if (sortMode === 'by-char') {
      btnSort.textContent = '📑 Theo Thứ tự Bảng';
      btnSort.style.color = '#ffea00';
      btnSort.style.borderColor = '#ffea00';
    } else {
      btnSort.textContent = '🔀 Gom theo Ký tự Vần';
      btnSort.style.color = '#0ff';
      btnSort.style.borderColor = '#0ff';
    }
  }

  const searchInput = document.getElementById('search-rhyme');
  const query = searchInput ? searchInput.value.trim() : '';

  filteredMatrixItems.forEach((item, index) => {
    const tr = document.createElement('tr');
    
    const displayStt = sortMode === 'by-char' ? index + 1 : item.stt;
    const tagClass = item.tableIdx === 0 ? 'tag-b1' : (item.tableIdx === 1 ? 'tag-b2' : 'tag-b3');
    const tagText = item.tableIdx === 0 ? 'B1' : (item.tableIdx === 1 ? 'B2' : 'B3');
    const codeBadgeClass = item.tableIdx === 0 ? 'code-b1' : (item.tableIdx === 1 ? 'code-b2' : 'code-b3');
    
    const highlightedRhyme = highlightText(item.rhyme, query);
    const highlightedRhymeChar = highlightText(item.rhymeChar, query);

    const rhymeCellContent = sortMode === 'by-char'
      ? `<span class="rhyme-tag ${tagClass}">${tagText}</span>${highlightedRhyme}`
      : highlightedRhyme;

    let html = `
      <td>${displayStt}</td>
      <td class="rhyme-cell-click" data-rhyme="${item.rhyme}" style="cursor:pointer;" title="Nhấp để lọc vần ${item.rhyme} (${item.tableName})">${rhymeCellContent}</td>
      <td title="Nhấp để lọc riêng mã: ${item.rhymeChar} (${item.tableName})"><span class="rhyme-code-badge ${codeBadgeClass}" data-code="${item.rhymeChar}">${highlightedRhymeChar}</span></td>
    `;

    // Select color class for Base PA based on tableIdx
    const baseColorClass = item.tableIdx === 0 ? 'base-p1' : (item.tableIdx === 1 ? 'base-p2' : 'base-p3');

    item.tones.forEach(t => {
      const highlightedBaseCode = highlightText(t.baseCode, query);
      const highlightedExtraCode = highlightText(t.extraCode, query);

      const baseHtml = t.baseCount > 0
        ? `<a href="${t.baseLink}" class="code-badge ${baseColorClass}" title="${t.firstBaseWord} (${t.baseCount} từ: ${t.baseWords.map(w => w.word).slice(0, 6).join(', ')}${t.baseCount > 6 ? '...' : ''})">${highlightedBaseCode}</a>`
        : `<span class="code-badge disabled-code" title="Không có từ thực tế">${highlightedBaseCode}</span>`;

      const extraHtml = t.extraCount > 0
        ? `<a href="${t.extraLink}" class="code-badge extra-p" title="${t.firstExtraWord} (${t.extraCount} từ: ${t.extraWords.map(w => w.word).slice(0, 6).join(', ')}${t.extraCount > 6 ? '...' : ''})">${highlightedExtraCode}</a>`
        : `<span class="code-badge disabled-code" title="Không có từ thực tế">${highlightedExtraCode}</span>`;

      html += `
        <td>
          <div class="cell-codes">
            ${baseHtml}
            ${extraHtml}
          </div>
        </td>
      `;
    });

    tr.innerHTML = html;
    tbody.appendChild(tr);
  });
}

function highlightText(text, query, customClass = 'search-highlight') {
  if (!text) return '';
  if (!query) return text;

  let cleanQuery = query.trim();
  // Strip prefixes like : or m: or v: for clean highlighting
  cleanQuery = cleanQuery.replace(/^(:|m:|M:|v:|V:)\s*/, '');
  if (!cleanQuery) return text;

  let regexPattern = cleanQuery;
  const hasWildcard = /[*?]/.test(cleanQuery) && !/[\\^$(){}[\]|+]/.test(cleanQuery);
  if (hasWildcard) {
    regexPattern = cleanQuery.replace(/([.+^$[\]\\(){}|-])/g, '\\$1').replace(/\*/g, '.*').replace(/\?/g, '.');
  }

  try {
    const reg = new RegExp(`(${regexPattern})`, 'gi');
    if (reg.test(text)) {
      return text.replace(reg, `<mark class="${customClass}">$1</mark>`);
    }
  } catch (e) {}

  const idx = text.toLowerCase().indexOf(cleanQuery.toLowerCase());
  if (idx !== -1) {
    const matchPart = text.substr(idx, cleanQuery.length);
    return text.substring(0, idx) + `<mark class="${customClass}">${matchPart}</mark>` + text.substring(idx + cleanQuery.length);
  }

  return text;
}

function smartMatch(target, query) {
  if (!query) return true;
  if (!target) return false;

  const trimmed = query.trim();
  if (!trimmed) return true;

  let regexPattern = trimmed;
  const hasWildcard = /[*?]/.test(trimmed) && !/[\\^$(){}[\]|+]/.test(trimmed);
  if (hasWildcard) {
    regexPattern = '^' + trimmed.replace(/([.+^$[\]\\(){}|-])/g, '\\$1').replace(/\*/g, '.*').replace(/\?/g, '.') + '$';
  }

  try {
    const reg = new RegExp(regexPattern, 'i');
    if (reg.test(target)) return true;

    const targetNoMark = removeAccents(target);
    const patternNoMark = removeAccents(regexPattern);
    const regNoMark = new RegExp(patternNoMark, 'i');
    if (regNoMark.test(targetNoMark)) return true;
  } catch (e) {}

  const tStr = target.toLowerCase();
  const qStr = trimmed.toLowerCase();
  if (tStr.includes(qStr)) return true;

  const tNoMark = removeAccents(tStr);
  const qNoMark = removeAccents(qStr);
  return tNoMark.includes(qNoMark);
}

function smartMatchBase60(target, query) {
  if (!query) return true;
  if (!target) return false;
  const trimmed = query.trim();
  if (!trimmed) return true;

  let regexPattern = trimmed;
  const hasWildcard = /[*?]/.test(trimmed) && !/[\\^$(){}[\]|+]/.test(trimmed);
  if (hasWildcard) {
    regexPattern = '^' + trimmed.replace(/([.+^$[\]\\(){}|-])/g, '\\$1').replace(/\*/g, '.*').replace(/\?/g, '.') + '$';
  }

  try {
    const regExact = new RegExp(regexPattern);
    if (regExact.test(target)) return true;
  } catch (e) {}

  try {
    const regInsensitive = new RegExp(regexPattern, 'i');
    if (regInsensitive.test(target)) return true;
  } catch (e) {}

  if (target.includes(trimmed)) return true;
  return target.toLowerCase().includes(trimmed.toLowerCase());
}

function applySortAndFilter() {
  const searchInput = document.getElementById('search-rhyme');
  const query = searchInput ? searchInput.value.trim() : '';

  const btnClear = document.getElementById('btn-clear-search');
  if (btnClear) {
    btnClear.style.display = query ? 'block' : 'none';
  }

  let items = [...allMatrixItems];

  if (query) {
    if (/^(:|m:|M:)/.test(query)) {
      // Chỉ tìm trong cột Mã
      const codeQuery = query.replace(/^(:|m:|M:)\s*/, '');
      if (codeQuery) {
        items = items.filter(item => smartMatchBase60(item.rhymeChar, codeQuery));
      }
    } else if (/^(v:|V:)/.test(query)) {
      // Chỉ tìm trong cột Vần
      const rhymeQuery = query.replace(/^(v:|V:)\s*/, '');
      if (rhymeQuery) {
        items = items.filter(item => smartMatch(item.rhyme, rhymeQuery));
      }
    } else {
      // Tìm trên tất cả các trường
      items = items.filter(item => {
        return smartMatch(item.rhyme, query) ||
               smartMatchBase60(item.rhymeChar, query) ||
               item.tones.some(t => smartMatchBase60(t.baseCode, query) ||
                                    smartMatchBase60(t.extraCode, query) ||
                                    (t.firstBaseWord && smartMatch(t.firstBaseWord, query)) ||
                                    (t.firstExtraWord && smartMatch(t.firstExtraWord, query)));
      });
    }
  }

  if (sortMode === 'by-char') {
    items.sort((a, b) => {
      const idxA = a.mmIndex;
      const idxB = b.mmIndex;
      if (idxA !== idxB) return idxA - idxB;
      return a.tableIdx - b.tableIdx;
    });
  } else {
    items.sort((a, b) => a.stt - b.stt);
  }

  filteredMatrixItems = items;
  renderMatrix();
}

function toggleSortMode() {
  sortMode = sortMode === 'default' ? 'by-char' : 'default';
  applySortAndFilter();
}

function init() {
  buildWordCache();
  allMatrixItems = buildMatrixData();
  filteredMatrixItems = [...allMatrixItems];

  const searchInput = document.getElementById('search-rhyme');
  if (searchInput) {
    searchInput.addEventListener('input', applySortAndFilter);
    searchInput.focus();
  }

  const btnClear = document.getElementById('btn-clear-search');
  if (btnClear) {
    btnClear.addEventListener('click', () => {
      if (searchInput) {
        searchInput.value = '';
        searchInput.focus();
        applySortAndFilter();
      }
    });
  }

  const tbody = document.getElementById('matrix-tbody');
  if (tbody) {
    tbody.addEventListener('click', (e) => {
      const badge = e.target.closest('.rhyme-code-badge');
      if (badge && badge.dataset.code) {
        const code = badge.dataset.code;
        if (searchInput) {
          if (searchInput.value.trim() === ':' + code) {
            searchInput.value = '';
          } else {
            searchInput.value = ':' + code;
          }
          applySortAndFilter();
        }
        return;
      }

      const rhymeCell = e.target.closest('.rhyme-cell-click');
      if (rhymeCell && rhymeCell.dataset.rhyme) {
        const rhyme = rhymeCell.dataset.rhyme;
        if (searchInput) {
          if (searchInput.value.trim() === 'v:' + rhyme) {
            searchInput.value = '';
          } else {
            searchInput.value = 'v:' + rhyme;
          }
          applySortAndFilter();
        }
      }
    });
  }

  const btnSort = document.getElementById('btn-sort-mode');
  if (btnSort) {
    btnSort.addEventListener('click', toggleSortMode);
  }

  const thRhyme = document.getElementById('th-rhyme');
  if (thRhyme) {
    thRhyme.addEventListener('click', toggleSortMode);
  }

  const thCode = document.getElementById('th-code');
  if (thCode) {
    thCode.addEventListener('click', toggleSortMode);
  }

  renderMatrix();
}

document.addEventListener('DOMContentLoaded', init);
