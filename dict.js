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
  0: "Bằng",
  1: "Sắc",
  2: "Huyền",
  3: "Hỏi",
  4: "Ngã",
  5: "Nặng"
};
const allTones = ["Bằng", "Sắc", "Huyền", "Hỏi", "Ngã", "Nặng"];
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
}

document.addEventListener('click', (e) => {
  if (!e.target.closest('#ms-cons')) document.getElementById('ms-cons').classList.remove('open');
  if (!e.target.closest('#ms-rhyme')) document.getElementById('ms-rhyme').classList.remove('open');
  if (!e.target.closest('#ms-tone')) document.getElementById('ms-tone').classList.remove('open');
});

function init() {
  // Populate dropdowns
  const displayConsonants = [...allConsonants].reverse();
  initMultiSelect('ms-cons', displayConsonants, selectedCons);
  initMultiSelect('ms-rhyme', allRhymes, selectedRhymes);
    initMultiSelect('ms-tone', allTones, selectedTones);

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

function applyFilters() {
  const fNo = document.getElementById('filter-no').value.toLowerCase();
  const fWord = document.getElementById('filter-word').value.toLowerCase();
  const fWordNoMark = removeAccents(fWord);
  const fEnc = document.getElementById('filter-enc').value.toLowerCase();
  const fB60 = document.getElementById('filter-b60').value.toLowerCase();

  filteredData = dictionaryData.filter(item => {
    if (fNo && !item.no.toString().includes(fNo)) return false;
    
    if (fWord) {
       const w1 = item.word.toLowerCase();
       const w2 = item.wordNoMark;
       if (fWord === fWordNoMark) {
         // Query has no accents -> match either
         if (!w1.includes(fWord) && !w2.includes(fWordNoMark)) return false;
       } else {
         // Query has accents -> strict match
         if (!w1.includes(fWord)) return false;
       }
    }
    
    if (fEnc && !item.enc.includes(fEnc)) return false;
    if (fB60 && !item.b60.toLowerCase().includes(fB60)) return false;
    
    if (selectedCons.size > 0 && !selectedCons.has(item.cons)) return false;
    if (selectedRhymes.size > 0 && !selectedRhymes.has(item.rhyme)) return false;
      if (selectedTones.size > 0 && !selectedTones.has(item.toneName)) return false;
    
    return true;
  });

  filteredData.sort((a, b) => {
    if (fWord) {
      // 1. Exact match priority
      const aExact = (a.word.toLowerCase() === fWord || a.wordNoMark === fWordNoMark);
      const bExact = (b.word.toLowerCase() === fWord || b.wordNoMark === fWordNoMark);
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;
      
      // 2. Starts with priority
      const aStarts = (a.word.toLowerCase().startsWith(fWord) || a.wordNoMark.startsWith(fWordNoMark));
      const bStarts = (b.word.toLowerCase().startsWith(fWord) || b.wordNoMark.startsWith(fWordNoMark));
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;
    }

    let valA = a[sortCol];
    let valB = b[sortCol];
    
    if (typeof valA === 'string') valA = valA.toLowerCase();
    if (typeof valB === 'string') valB = valB.toLowerCase();
    
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

  pageData.forEach(item => {
    const tr = document.createElement('tr');
    const isInvalid = item.enc.startsWith('[');
    
    tr.innerHTML = `
      <td>${item.no}</td>
      <td style="font-weight:bold; color: ${isInvalid ? '#f00' : '#fff'};">${item.word}</td>
      <td style="color: #888;">${item.cons || '-'}</td>
      <td style="color: #888;">${item.rhyme}</td>
        <td style="color: #888;">${item.toneName || '-'}</td>
      <td style="color: ${isInvalid ? '#f00' : '#ff0'}; font-weight:bold;">${item.enc}</td>
      <td style="color: ${isInvalid ? '#f00' : '#0f0'}; font-weight:bold;">${item.b60}</td>
    `;
    tbody.appendChild(tr);
  });
}

document.addEventListener('DOMContentLoaded', init);
