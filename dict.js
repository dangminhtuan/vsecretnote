import { REAL_VIETNAMESE_WORDS, CONSONANTS_BASE, CONSONANTS_EXTRA, RHYMES_BASE, RHYMES_EXTRA_1, RHYMES_EXTRA_2 } from './data.js';
import { encodeWord, timeToBase60, removeVietnameseTones } from './vcomp.js';

let dictionaryData = [];
let filteredData = [];
const PAGE_SIZE = 100;
let currentPage = 1;

let sortCol = 'no';
let sortAsc = true;

const allConsonants = [...new Set([...CONSONANTS_BASE, ...CONSONANTS_EXTRA].filter(c => c !== null))].sort((a,b) => b.length - a.length);
const allRhymes = [...new Set([...RHYMES_BASE, ...RHYMES_EXTRA_1, ...RHYMES_EXTRA_2].filter(r => r !== null))].sort();

let selectedCons = new Set();
let selectedRhymes = new Set();

const TONE_NAMES = {
  0: "=Bằng",
  1: "✓Sắc",
  2: "`Huyền",
  3: "ˀHỏi",
  4: "~Ngã",
  5: "•Nặng"
};
const allTones = ["=Bằng", "✓Sắc", "`Huyền", "ˀHỏi", "~Ngã", "•Nặng"];
let selectedTones = new Set();


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

function initMultiSelect(containerId, dataList, selectedSet) {
  const container = document.getElementById(containerId);
  const header = document.getElementById(`${containerId}-header`);
  const optionsDiv = document.getElementById(`${containerId}-options`);
  const searchInput = document.getElementById(`${containerId}-search`);

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
    applyFilters();
  };

  const optionLabels = [];

  dataList.forEach(item => {
    const label = document.createElement('label');
    label.className = 'ms-option';
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.value = item;
    
    checkbox.addEventListener('change', (e) => {
      if (e.target.checked) selectedSet.add(item);
      else selectedSet.delete(item);
      updateHeader();
    });

    const text = item === '' ? '(Rỗng)' : item;
    label.appendChild(checkbox);
    label.appendChild(document.createTextNode(text));
    label.dataset.text = removeAccents(text.toLowerCase());
    optionsDiv.appendChild(label);
    optionLabels.push(label);
  });

  searchInput.addEventListener('input', (e) => {
    const query = removeAccents(e.target.value.toLowerCase());
    optionLabels.forEach(label => {
      if (label.dataset.text.includes(query)) {
        label.style.display = 'flex';
      } else {
        label.style.display = 'none';
      }
    });
  });

  return {
    syncUI: () => {
      optionsDiv.querySelectorAll('input[type="checkbox"]').forEach(cb => {
        cb.checked = selectedSet.has(cb.value);
      });
      if (selectedSet.size === 0) {
        header.textContent = 'Tất cả';
      } else {
        header.textContent = Array.from(selectedSet).join(', ') || 'Đã chọn';
      }
    }
  };
}

document.addEventListener('click', (e) => {
  if (!e.target.closest('#ms-cons')) document.getElementById('ms-cons').classList.remove('open');
  if (!e.target.closest('#ms-rhyme')) document.getElementById('ms-rhyme').classList.remove('open');
  if (!e.target.closest('#ms-tone')) document.getElementById('ms-tone').classList.remove('open');
});

function init() {
  // Populate dropdowns
  const displayConsonants = [...allConsonants].reverse();
  const msCons = initMultiSelect('ms-cons', displayConsonants, selectedCons);
  const msRhyme = initMultiSelect('ms-rhyme', allRhymes, selectedRhymes);
  const msTone = initMultiSelect('ms-tone', allTones, selectedTones);

  // Check URL params from matrix.html or external links
  const urlParams = new URLSearchParams(window.location.search);
  const pRhyme = urlParams.get('rhyme');
  const pTone = urlParams.get('tone');
  const pConsGroup = urlParams.get('consGroup');
  const pCons = urlParams.get('cons');

  if (pRhyme && allRhymes.includes(pRhyme)) {
    selectedRhymes.add(pRhyme);
  }
  if (pTone) {
    if (TONE_NAMES[pTone]) {
      selectedTones.add(TONE_NAMES[pTone]);
    } else if (allTones.includes(pTone)) {
      selectedTones.add(pTone);
    }
  }
  if (pCons) {
    pCons.split(',').forEach(c => {
      if (allConsonants.includes(c)) selectedCons.add(c);
    });
  } else if (pConsGroup === 'extra') {
    CONSONANTS_EXTRA.filter(c => c).forEach(c => selectedCons.add(c));
  } else if (pConsGroup === 'base') {
    CONSONANTS_BASE.filter(c => c !== null).forEach(c => selectedCons.add(c));
  }

  msCons.syncUI();
  msRhyme.syncUI();
  msTone.syncUI();

  // Build Data
  dictionaryData = REAL_VIETNAMESE_WORDS.map((word, idx) => {
    const enc = encodeWord(word);
    const b60 = timeToBase60(enc);
    const ph = getPhonetics(word);
    return {
      no: idx + 1,
      word,
      wordNoMark: removeAccents(word.toLowerCase()),
      enc,
      b60,
      cons: ph.consonant,
      rhyme: ph.rhyme,
        toneName: TONE_NAMES[ph.tone],
      tone: ph.tone
    };
  });

  filteredData = [...dictionaryData];
  
  // Event listeners
  document.getElementById('filter-no').addEventListener('input', applyFilters);
  document.getElementById('filter-word').addEventListener('input', applyFilters);
  document.getElementById('filter-enc').addEventListener('input', applyFilters);
  document.getElementById('filter-b60').addEventListener('input', applyFilters);
  
  document.querySelectorAll('.th-title').forEach(el => {
    el.addEventListener('click', () => {
      const col = el.getAttribute('data-sort');
      if (sortCol === col) {
        sortAsc = !sortAsc;
      } else {
        sortCol = col;
        sortAsc = true;
      }
      updateSortIcons();
      applyFilters();
    });
  });
  
  document.getElementById('btn-prev').addEventListener('click', () => { if (currentPage > 1) { currentPage--; renderTable(); } });
  document.getElementById('btn-next').addEventListener('click', () => { const max = Math.ceil(filteredData.length / PAGE_SIZE); if (currentPage < max) { currentPage++; renderTable(); } });

  applyFilters();
}

function updateSortIcons() {
  document.querySelectorAll('.sort-icon').forEach(icon => icon.textContent = '');
  const icon = document.getElementById(`sort-icon-${sortCol}`);
  if (icon) {
    icon.textContent = sortAsc ? '▲' : '▼';
  }
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

  // Exact case regex match if user used uppercase
  try {
    const regExact = new RegExp(regexPattern);
    if (regExact.test(target)) return true;
  } catch (e) {}

  // Case-insensitive regex match
  try {
    const regInsensitive = new RegExp(regexPattern, 'i');
    if (regInsensitive.test(target)) return true;
  } catch (e) {}

  if (target.includes(trimmed)) return true;
  return target.toLowerCase().includes(trimmed.toLowerCase());
}

function applyFilters() {
  const fNo = document.getElementById('filter-no').value;
  const fWord = document.getElementById('filter-word').value;
  const fEnc = document.getElementById('filter-enc').value;
  const fB60 = document.getElementById('filter-b60').value;

  filteredData = dictionaryData.filter(item => {
    if (fNo && !smartMatch(item.no.toString(), fNo)) return false;
    if (fWord && !smartMatch(item.word, fWord)) return false;
    if (fEnc && !smartMatch(item.enc, fEnc)) return false;
    if (fB60 && !smartMatchBase60(item.b60, fB60)) return false;
    
    if (selectedCons.size > 0 && !selectedCons.has(item.cons)) return false;
    if (selectedRhymes.size > 0 && !selectedRhymes.has(item.rhyme)) return false;
    if (selectedTones.size > 0 && !selectedTones.has(item.toneName)) return false;
    
    return true;
  });

  filteredData.sort((a, b) => {
    if (fWord) {
      const fWordClean = fWord.trim().toLowerCase();
      const fWordNoMark = removeAccents(fWordClean);
      // 1. Exact match priority
      const aExact = (a.word.toLowerCase() === fWordClean || a.wordNoMark === fWordNoMark);
      const bExact = (b.word.toLowerCase() === fWordClean || b.wordNoMark === fWordNoMark);
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;

      // 2. Starts with priority
      const aStarts = (a.word.toLowerCase().startsWith(fWordClean) || a.wordNoMark.startsWith(fWordNoMark));
      const bStarts = (b.word.toLowerCase().startsWith(fWordClean) || b.wordNoMark.startsWith(fWordNoMark));
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;
    }

    let valA = a[sortCol];
    let valB = b[sortCol];
    
    if (sortCol === 'toneName') {
      valA = a.tone;
      valB = b.tone;
    } else {
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();
    }
    
    if (valA < valB) return sortAsc ? -1 : 1;
    if (valA > valB) return sortAsc ? 1 : -1;
    return 0;
  });

  // Inject dynamic word if exact match not found
  if (fWord && !fWord.includes(' ')) {
    const exactExists = dictionaryData.some(item => item.word.toLowerCase() === fWord);
    if (!exactExists) {
      const enc = encodeWord(fWord);
      const b60 = enc.startsWith('[') ? '' : timeToBase60(enc);
      const ph = getPhonetics(fWord);
      const dynamicItem = {
        no: '#',
        word: fWord,
        wordNoMark: fWordNoMark,
        enc,
        b60,
        cons: ph.consonant,
        rhyme: ph.rhyme,
        toneName: TONE_NAMES[ph.tone],
        tone: ph.tone
      };
      
      // If we are sorting by exact match priority, we should just unshift it to the top.
      // Since it's an exact match of fWord, it logically belongs at the very top.
      filteredData.unshift(dynamicItem);
    }
  }

  currentPage = 1;
  renderTable();
}

function highlightText(text, query, customClass = 'search-highlight') {
  if (!text) return '';
  if (!query) return text;

  const trimmed = query.trim();
  if (!trimmed) return text;

  let regexPattern = trimmed;
  const hasWildcard = /[*?]/.test(trimmed) && !/[\\^$(){}[\]|+]/.test(trimmed);
  if (hasWildcard) {
    regexPattern = trimmed.replace(/([.+^$[\]\\(){}|-])/g, '\\$1').replace(/\*/g, '.*').replace(/\?/g, '.');
  }

  try {
    const reg = new RegExp(`(${regexPattern})`, 'gi');
    if (reg.test(text)) {
      return text.replace(reg, `<mark class="${customClass}">$1</mark>`);
    }
  } catch (e) {}

  const idx = text.toLowerCase().indexOf(trimmed.toLowerCase());
  if (idx !== -1) {
    const matchPart = text.substr(idx, trimmed.length);
    return text.substring(0, idx) + `<mark class="${customClass}">${matchPart}</mark>` + text.substring(idx + trimmed.length);
  }

  return text;
}

function renderTable() {
  const tbody = document.getElementById('table-body');
  tbody.innerHTML = '';

  const total = filteredData.length;
  const totalPages = Math.ceil(total / PAGE_SIZE) || 1;
  if (currentPage > totalPages) currentPage = totalPages;

  document.getElementById('stat-bar').textContent = `Hiển thị ${total} từ thỏa mãn điều kiện.`;
  document.getElementById('page-info').textContent = `Trang ${currentPage} / ${totalPages}`;
  document.getElementById('btn-prev').disabled = currentPage === 1;
  document.getElementById('btn-next').disabled = currentPage === totalPages;

  const start = (currentPage - 1) * PAGE_SIZE;
  const end = Math.min(start + PAGE_SIZE, total);
  const pageData = filteredData.slice(start, end);

  const fNo = document.getElementById('filter-no')?.value || '';
  const fWord = document.getElementById('filter-word')?.value || '';
  const fEnc = document.getElementById('filter-enc')?.value || '';
  const fB60 = document.getElementById('filter-b60')?.value || '';

  pageData.forEach(item => {
    const tr = document.createElement('tr');
    const isInvalid = item.enc.startsWith('[');
    
    const displayNo = highlightText(item.no.toString(), fNo);
    const displayWord = highlightText(item.word, fWord, 'search-highlight-word');
    const displayEnc = highlightText(item.enc, fEnc, 'search-highlight-time');
    const displayB60 = highlightText(item.b60, fB60, 'search-highlight-b60');

    tr.innerHTML = `
      <td>${displayNo}</td>
      <td style="font-weight:bold; color: ${isInvalid ? '#f00' : '#fff'};">${displayWord}</td>
      <td style="color: #888;">${item.cons || '-'}</td>
      <td style="color: #888;">${item.rhyme}</td>
      <td style="color: #888;">${item.toneName || '-'}</td>
      <td style="color: ${isInvalid ? '#f00' : '#ff0'}; font-weight:bold;">${displayEnc}</td>
      <td style="color: ${isInvalid ? '#f00' : '#0f0'}; font-weight:bold;">${displayB60}</td>
    `;
    tbody.appendChild(tr);
  });
}

document.addEventListener('DOMContentLoaded', init);
