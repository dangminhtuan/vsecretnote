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
          const baseSuffix = rhymeChar + BASE60_MAPPING[ss_base];
          baseCode = BASE60_MAPPING[0] + baseSuffix;
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
          const extraSuffix = rhymeChar + BASE60_MAPPING[ss_extra];
          extraCode = BASE60_MAPPING[27] + extraSuffix;
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
    statText.textContent = `Hiển thị ${filteredMatrixItems.length} / ${allMatrixItems.length} vần.`;
  }

  filteredMatrixItems.forEach(item => {
    const tr = document.createElement('tr');
    
    let html = `
      <td>${item.stt}</td>
      <td>${item.rhyme}</td>
    `;

    item.tones.forEach(t => {
      const baseHtml = t.baseCount > 0
        ? `<a href="${t.baseLink}" class="code-badge base-p" title="${t.firstBaseWord} (${t.baseCount} từ: ${t.baseWords.map(w => w.word).slice(0, 6).join(', ')}${t.baseCount > 6 ? '...' : ''})">${t.baseCode}</a>`
        : `<span class="code-badge disabled-code" title="Không có từ thực tế">${t.baseCode}</span>`;

      const extraHtml = t.extraCount > 0
        ? `<a href="${t.extraLink}" class="code-badge extra-p" title="${t.firstExtraWord} (${t.extraCount} từ: ${t.extraWords.map(w => w.word).slice(0, 6).join(', ')}${t.extraCount > 6 ? '...' : ''})">${t.extraCode}</a>`
        : `<span class="code-badge disabled-code" title="Không có từ thực tế">${t.extraCode}</span>`;

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

function applySearch() {
  const searchInput = document.getElementById('search-rhyme');
  const query = searchInput ? searchInput.value.trim().toLowerCase() : '';
  const queryNoMark = removeAccents(query);

  if (!query) {
    filteredMatrixItems = [...allMatrixItems];
  } else {
    filteredMatrixItems = allMatrixItems.filter(item => {
      return item.rhyme.toLowerCase().includes(query) ||
             item.rhymeNoMark.includes(queryNoMark) ||
             item.rhymeChar.toLowerCase() === query ||
             item.tones.some(t => t.baseCode.toLowerCase().includes(query) || t.extraCode.toLowerCase().includes(query) ||
                                  (t.firstBaseWord && t.firstBaseWord.toLowerCase().includes(query)) ||
                                  (t.firstExtraWord && t.firstExtraWord.toLowerCase().includes(query)));
    });
  }

  renderMatrix();
}

function init() {
  buildWordCache();
  allMatrixItems = buildMatrixData();
  filteredMatrixItems = [...allMatrixItems];

  const searchInput = document.getElementById('search-rhyme');
  if (searchInput) {
    searchInput.addEventListener('input', applySearch);
    searchInput.focus();
  }

  renderMatrix();
}

document.addEventListener('DOMContentLoaded', init);
