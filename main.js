const btnLinkPrev = document.getElementById('btn-link-prev');
import {
  CONSONANTS_BASE, CONSONANTS_EXTRA,
  RHYMES_BASE, RHYMES_EXTRA_1, RHYMES_EXTRA_2,
  BASE60_MAPPING, ENGLISH_DICT,
  REAL_VIETNAMESE_WORDS
} from './data.js';

import {
  encodeWord, decodeWord, timeToBase60, base60ToTime, TOKEN_REGEX
, applyTone} from './vcomp.js';
import { encodeCVNSS4Word, decodeCVNSS4Word } from './cvnss4.js';

// --- UI MATRIX EFFECT ---
const canvas = document.getElementById('matrix-canvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789$+-*/=%""\'#&_(),.;:?!\\|{}<>[]^~';
const fontSize = 16;
const columns = canvas.width / fontSize;
const drops = [];
for (let x = 0; x < columns; x++) drops[x] = 1;
function drawMatrix() {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#0f0';
  ctx.font = fontSize + 'px monospace';
  for (let i = 0; i < drops.length; i++) {
    const text = letters.charAt(Math.floor(Math.random() * letters.length));
    ctx.fillText(text, i * fontSize, drops[i] * fontSize);
    if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) drops[i] = 0;
    drops[i]++;
  }
}
setInterval(drawMatrix, 33);
window.addEventListener('resize', () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});


// --- DOM LOGIC ---
const txtDecrypted = document.getElementById('text-input');
const txtEncrypted = document.getElementById('time-input');
const txtCompressed = document.getElementById('compressed-input');
const txtFakeViet = document.getElementById('fake-viet-input');
const txtTime5 = document.getElementById('time-5-input');
const txtCompressedContinuous = document.getElementById('compressed-continuous-input');
const txtCVNSS4 = document.getElementById('cvnss4-input');

const btnEncode = document.getElementById('btn-encode');
const btnDecode = document.getElementById('btn-decode');

const btnCopyText = document.getElementById('btn-copy-text');
const btnCopyTime = document.getElementById('btn-copy-time');
const btnCopyCompressed = document.getElementById('btn-copy-compressed');

const btnClearText = document.getElementById('btn-clear-text');
const btnClearTime = document.getElementById('btn-clear-time');
const btnClearCompressed = document.getElementById('btn-clear-compressed');

const breakdownList = document.getElementById('breakdown-list');


function getUtf8ByteLength(str) {
  return new Blob([str]).size;
}

let isCaseSupportEnabled = localStorage.getItem('pref_view_case') === 'true';

function formatB60WithCase(b60, originalWord) {
  if (!isCaseSupportEnabled || !b60 || b60.startsWith('[') || !originalWord) return b60;
  const isAllCaps = originalWord.length > 0 && originalWord === originalWord.toUpperCase() && /[A-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠƯẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀỀỂỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪỬỮỰỲỴÝỶỸ]/.test(originalWord);
  const isTitle = originalWord.length > 0 && originalWord[0] === originalWord[0].toUpperCase() && /[A-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠƯẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀỀỂỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪỬỮỰỲỴÝỶỸ]/.test(originalWord[0]) && !isAllCaps;
  
  if (isAllCaps) return 'O' + b60;
  if (isTitle) return 'o' + b60;
  return b60;
}

function updateCyberFontDisplay() {
  const preview = document.getElementById('cyber-font-preview');
  if (!preview) return;
  const b60 = txtCompressed ? txtCompressed.value : '';
  // Giữ nguyên khoảng trắng để font's calt feature tách đúng từng nhóm 3 ký tự
  preview.textContent = b60;

  // Cập nhật byte counter
  const bytesEl = document.getElementById('cyber-font-bytes');
  const barEl = document.getElementById('cyber-font-bar');
  if (!bytesEl || !barEl) return;

  const rawBytes = getUtf8ByteLength(txtDecrypted ? txtDecrypted.value : '');
  const currentBytes = getUtf8ByteLength(b60); // tính kể cả khoảng trắng

  if (rawBytes === 0) {
    bytesEl.textContent = currentBytes > 0 ? currentBytes + ' B' : '';
    barEl.style.width = '0%';
    return;
  }
  const pct = Math.round((currentBytes / rawBytes) * 100);
  bytesEl.textContent = `${currentBytes}/${rawBytes}B=${pct}%`;
  if (pct < 100) {
    barEl.style.background = '#0f0';
    barEl.style.width = Math.min(100, pct) + '%';
  } else if (pct === 100) {
    barEl.style.background = '#aa0';
    barEl.style.width = '100%';
  } else {
    barEl.style.background = '#f00';
    barEl.style.width = '100%';
  }
}


function toCamelCase(str) {
  if (!str) return '';
  return str.trim().split(/\s+/)
    .map((word, index) => {
      if (index === 0) return word.toLowerCase();
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join('');
}

function toNoAccentContinuous(str) {
  if (!str) return '';
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd').replace(/Đ/g, 'D')
    .replace(/\s+/g, '').toLowerCase();
}

function updateCompressionStats() {
  const rawText = txtDecrypted ? txtDecrypted.value : '';
  const rawBytes = getUtf8ByteLength(rawText);
  
  const groups = document.querySelectorAll('.input-group');
  groups.forEach(group => {
    const ta = group.querySelector('textarea');
    if (!ta) return;
    
    let barContainer = group.querySelector('.mini-byte-bar-container');
    if (!barContainer) {
      barContainer = document.createElement('div');
      barContainer.className = 'mini-byte-bar-container';
      barContainer.style.cssText = 'display: flex; align-items: center; gap: 10px; margin-top: 5px; font-size: 11px; font-family: monospace; padding: 0 4px;';
      
      const textSpan = document.createElement('span');
      textSpan.className = 'm-byte-text';
      textSpan.style.color = '#888';
      textSpan.style.minWidth = '80px';
      
      const barWrapper = document.createElement('div');
      barWrapper.style.cssText = 'flex: 1; height: 3px; background: #222; border-radius: 1px; overflow: hidden;';
      
      const barFill = document.createElement('div');
      barFill.className = 'm-byte-fill';
      barFill.style.cssText = 'width: 0%; height: 100%; transition: width 0.3s ease, background 0.3s ease;';
      
      barWrapper.appendChild(barFill);
      barContainer.appendChild(barWrapper);
      barContainer.appendChild(textSpan);
      
      // Always append below the textarea
      barContainer.style.marginTop = '2px';
      barContainer.style.marginBottom = '8px';
      barContainer.style.justifyContent = 'flex-end';
      group.insertBefore(barContainer, ta.nextSibling);
    }
    
    const textSpan = barContainer.querySelector('.m-byte-text');
    const barFill = barContainer.querySelector('.m-byte-fill');
    
    let currentBytes = 0;
    if (ta.id === 'text-input') {
      currentBytes = rawBytes;
    } else if (ta.id === 'compressed-continuous-input') {
      // Liên tiếp: không có khoảng trắng, strip để đếm chính xác
      currentBytes = getUtf8ByteLength(ta.value.replace(/\s+/g, ''));
    } else {
      currentBytes = getUtf8ByteLength(ta.value);
    }
    
    if (rawBytes === 0) {
      textSpan.textContent = currentBytes > 0 ? currentBytes + ' B' : '';
      barFill.style.width = '0%';
      return;
    }
    
    const pct = Math.round((currentBytes / rawBytes) * 100);
    textSpan.textContent = `${currentBytes}/${rawBytes}B=${pct}%`;
    
    if (ta.id === 'text-input') {
      barFill.style.background = '#888';
      barFill.style.width = '100%';
    } else if (pct < 100) {
      barFill.style.background = '#0f0'; // Green
      barFill.style.width = Math.min(100, pct) + '%';
    } else if (pct === 100) {
      barFill.style.background = '#aa0'; // Yellow
      barFill.style.width = '100%';
    } else {
      barFill.style.background = '#f00'; // Red
      barFill.style.width = '100%'; 
    }
  });
}

function _oldUpdateCompressionStats() {
  const statsEl = document.getElementById('compression-stats');
  if (!statsEl) return;
  const rawText = txtDecrypted ? txtDecrypted.value : '';
  const compText = txtCompressedContinuous ? txtCompressedContinuous.value : (txtCompressed ? txtCompressed.value.replace(/\s+/g, '') : '');
  
  if (!rawText.trim() || !compText.trim()) {
    statsEl.textContent = '';
    return;
  }
  
  const rawBytes = getUtf8ByteLength(rawText);
  const compBytes = getUtf8ByteLength(compText); // Base60 is 1 byte per char
  
  if (rawBytes === 0) return;
  
  const saved = rawBytes - compBytes;
  const ratio = Math.round((saved / rawBytes) * 100);
  
  statsEl.textContent = `| Tiết kiệm: ${ratio}% (${rawBytes}B -> ${compBytes}B)`;
}

function renderBreakdown(pairs) {
  if (typeof updateContinuousBox === 'function') updateContinuousBox();
  if (!breakdownList) return;
  breakdownList.innerHTML = '';
  
  const header = document.createElement('div');
  header.className = 'breakdown-item';
  header.style.fontWeight = 'bold';
  header.style.borderBottom = '1px solid var(--neon-green)';
  header.innerHTML = `
    <span class="bd-word">WORD</span>
    <span class="bd-code">TIME</span>
    <span class="bd-base">BASE60</span>
  `;
  breakdownList.appendChild(header);

  pairs.forEach(p => {
    const item = document.createElement('div');
    item.className = 'breakdown-item';
    const isError = p.time.includes('?') || p.time.includes('"') || p.time.includes('[');
    
    let extraClass = '';
    item.innerHTML = `
      <span class="bd-word">${p.word}</span>
      <span class="bd-code ${isError ? 'bd-error' : ''} ${extraClass}">${p.time}</span>
      <span class="bd-base ${extraClass}">${p.base60}</span>
    `;
    breakdownList.appendChild(item);
  });
}

function syncFromDecrypted() {
  const text = txtDecrypted.value;
  if (!text.trim()) {
    if (txtDecrypted) txtDecrypted.value = '';
    if (txtEncrypted) txtEncrypted.value = '';
    if (txtCompressed) txtCompressed.value = '';
          if (txtFakeViet) txtFakeViet.value = '';
      if (document.getElementById('camel-case-input')) document.getElementById('camel-case-input').value = '';
      if (document.getElementById('no-accent-input')) document.getElementById('no-accent-input').value = '';
    if (txtTime5) txtTime5.value = '';
    if (txtCompressedContinuous) txtCompressedContinuous.value = '';
    if (txtCVNSS4) txtCVNSS4.value = '';
    renderBreakdown([]);
    return;
}
  const tokens = text.split(TOKEN_REGEX);
  let encryptedParts = [];
  let compressedParts = [];
  let breakdownPairs = [];
  let cvnss4Parts = [];

  tokens.forEach(token => {
    if (!token) return;
    if (token.match(/^[a-zA-Z0-9_\u00C0-\u024F\u1E00-\u1EFF]+$/)) {
      const timeCode = encodeWord(token);
      let b60Code = timeToBase60(timeCode);
      b60Code = formatB60WithCase(b60Code, token);
      encryptedParts.push(timeCode);
      compressedParts.push(b60Code);
      cvnss4Parts.push(encodeCVNSS4Word(token));
      breakdownPairs.push({ word: token, time: timeCode, base60: b60Code });
    
    } else if (token.startsWith('[') && token.endsWith(']')) {
      encryptedParts.push(token);
      compressedParts.push(token);
      cvnss4Parts.push(token);
      breakdownPairs.push({ word: token.substring(1, token.length - 1), time: token, base60: token });
    } else {
      encryptedParts.push(token);
      compressedParts.push(token);
      cvnss4Parts.push(token);
    }
  });

  txtEncrypted.value = encryptedParts.join('');
  if(txtCompressed) txtCompressed.value = compressedParts.join('');
  if(txtCVNSS4) txtCVNSS4.value = cvnss4Parts.join('');
  
  if(txtFakeViet) txtFakeViet.value = toFakeViet(text);
  
  if(document.getElementById('camel-case-input')) document.getElementById('camel-case-input').value = typeof toCamelCase === 'function' ? toCamelCase(txtDecrypted ? txtDecrypted.value : '') : '';
  
  if(document.getElementById('no-accent-input')) document.getElementById('no-accent-input').value = typeof toNoAccentContinuous === 'function' ? toNoAccentContinuous(txtDecrypted ? txtDecrypted.value : '') : '';
  if(txtTime5) txtTime5.value = timeTo5Digit(encryptedParts.join(''));

  renderBreakdown(breakdownPairs);
  saveCurrentNote();
  if (typeof window.updateMnemonicTutorFromDecrypted === 'function') window.updateMnemonicTutorFromDecrypted();
  if (typeof updateCompressionStats === 'function') updateCompressionStats();
  updateCyberFontDisplay();
}

function syncFromTime() {
  const text = txtEncrypted.value;
  if (!text.trim()) {
    if (txtDecrypted) txtDecrypted.value = '';
    if (txtEncrypted) txtEncrypted.value = '';
    if (txtCompressed) txtCompressed.value = '';
          if (txtFakeViet) txtFakeViet.value = '';
      if (document.getElementById('camel-case-input')) document.getElementById('camel-case-input').value = '';
      if (document.getElementById('no-accent-input')) document.getElementById('no-accent-input').value = '';
    if (txtTime5) txtTime5.value = '';
    if (txtCompressedContinuous) txtCompressedContinuous.value = '';
    if (txtCVNSS4) txtCVNSS4.value = '';
    renderBreakdown([]);
    return;
}
  const tokens = text.split(TOKEN_REGEX);
  let decryptedParts = [];
  let compressedParts = [];
  let breakdownPairs = [];
  let cvnss4Parts = [];

  tokens.forEach(token => {
    if (!token) return;
    if (token.match(/^[a-zA-Z0-9_\u00C0-\u024F\u1E00-\u1EFF]+$/)) {
      const b60Code = timeToBase60(token);
      const decoded = decodeWord(token);
      decryptedParts.push(decoded);
      compressedParts.push(b60Code);
      cvnss4Parts.push(encodeCVNSS4Word(token));
      breakdownPairs.push({ time: token, word: decoded, base60: b60Code });
    
    } else if (token.startsWith('[') && token.endsWith(']')) {
      decryptedParts.push(token);
      compressedParts.push(token);
      cvnss4Parts.push(token);
      breakdownPairs.push({ time: token, word: token.substring(1, token.length - 1), base60: token });
    } else {
      decryptedParts.push(token);
      compressedParts.push(token);
      cvnss4Parts.push(token);
    }
  });

  txtDecrypted.value = decryptedParts.join('');
  if(txtCVNSS4) txtCVNSS4.value = cvnss4Parts.join('');
  if(txtCompressed) txtCompressed.value = compressedParts.join('');
  if(txtCVNSS4) txtCVNSS4.value = cvnss4Parts.join('');

  if(txtFakeViet) txtFakeViet.value = toFakeViet(txtDecrypted.value);

  if(document.getElementById('camel-case-input')) document.getElementById('camel-case-input').value = typeof toCamelCase === 'function' ? toCamelCase(txtDecrypted ? txtDecrypted.value : '') : '';

  if(document.getElementById('no-accent-input')) document.getElementById('no-accent-input').value = typeof toNoAccentContinuous === 'function' ? toNoAccentContinuous(txtDecrypted ? txtDecrypted.value : '') : '';
  if(txtTime5) txtTime5.value = timeTo5Digit(text);

  renderBreakdown(breakdownPairs);
  saveCurrentNote();
  if (typeof window.updateMnemonicTutorFromDecrypted === 'function') window.updateMnemonicTutorFromDecrypted();
}


function updateContinuousBox() {
  if (txtCompressed && txtCompressedContinuous) {
    if (document.activeElement !== txtCompressedContinuous) {
      txtCompressedContinuous.value = txtCompressed.value.replace(/\s+/g, '');
    }
  }
}

function syncFromCompressedContinuous() {
  if (!txtCompressedContinuous) return;
  const val = txtCompressedContinuous.value.replace(/\s+/g, '');
  if (!val) {
    if (txtDecrypted) txtDecrypted.value = '';
    if (txtEncrypted) txtEncrypted.value = '';
    if (txtCompressed) txtCompressed.value = '';
          if (txtFakeViet) txtFakeViet.value = '';
      if (document.getElementById('camel-case-input')) document.getElementById('camel-case-input').value = '';
      if (document.getElementById('no-accent-input')) document.getElementById('no-accent-input').value = '';
    if (txtTime5) txtTime5.value = '';
    renderBreakdown([]);
    return;
  }
  
  const chunks = [];
  for (let i = 0; i < val.length;) {
    if (val[i] === 'o' || val[i] === 'O') {
      chunks.push(val.substring(i, i + 4));
      i += 4;
    } else {
      chunks.push(val.substring(i, i + 3));
      i += 3;
    }
  }
  
  if (txtCompressed) {
    txtCompressed.value = chunks.join(' ');
    syncFromCompressed();
  }
}


function syncFromCVNSS4() {
  const text = (txtCVNSS4 ? txtCVNSS4.value : '').trim();
  if (!text) {
    if (txtDecrypted) txtDecrypted.value = '';
    if (txtEncrypted) txtEncrypted.value = '';
    if (txtCompressed) txtCompressed.value = '';
          if (txtFakeViet) txtFakeViet.value = '';
      if (document.getElementById('camel-case-input')) document.getElementById('camel-case-input').value = '';
      if (document.getElementById('no-accent-input')) document.getElementById('no-accent-input').value = '';
    if (txtTime5) txtTime5.value = '';
    if (txtCompressedContinuous) txtCompressedContinuous.value = '';
    renderBreakdown([]);
    return;
  }

  const lines = text.split('\n');
  const allTimeParts = [];
  const allDecryptedParts = [];
  const allCompressedParts = [];

  lines.forEach((line, lineIdx) => {
    if (lineIdx > 0) {
      allTimeParts.push('\n');
      allDecryptedParts.push('\n');
      allCompressedParts.push('\n');
    }
    const tokens = line.split(TOKEN_REGEX);
    tokens.forEach(token => {
      if (!token) return;
      if (/[a-zA-Z0-9_\u00C0-\u024F\u1E00-\u1EFF]+/.test(token)) {
        // Decode CVNSS4 token to original Vietnamese
        const decoded = decodeCVNSS4Word(token);
        allDecryptedParts.push(decoded);
        
        // Then re-encode to time code and b60
        const timeCode = typeof encodeWord === 'function' ? encodeWord(decoded) : '';
        let b60 = typeof timeToBase60 === 'function' ? timeToBase60(timeCode) : '';
        b60 = formatB60WithCase(b60, decoded);
        allTimeParts.push(timeCode);
        allCompressedParts.push(b60);
      } else {
        allDecryptedParts.push(token);
        allTimeParts.push(token);
        allCompressedParts.push(token);
      }
    });
  });

  if (txtDecrypted) txtDecrypted.value = allDecryptedParts.join('');
  if (txtEncrypted) txtEncrypted.value = allTimeParts.join('');
  if (txtCompressed) txtCompressed.value = allCompressedParts.join('');
  
  if(txtFakeViet) txtFakeViet.value = typeof toFakeViet === 'function' ? toFakeViet(txtDecrypted.value) : '';
  
  if(document.getElementById('camel-case-input')) document.getElementById('camel-case-input').value = typeof toCamelCase === 'function' ? toCamelCase(txtDecrypted ? txtDecrypted.value : '') : '';
  
  if(document.getElementById('no-accent-input')) document.getElementById('no-accent-input').value = typeof toNoAccentContinuous === 'function' ? toNoAccentContinuous(txtDecrypted ? txtDecrypted.value : '') : '';
  if (txtTime5) txtTime5.value = typeof timeTo5Digit === 'function' ? timeTo5Digit(txtEncrypted.value) : '';
  if (txtCompressedContinuous) txtCompressedContinuous.value = txtCompressed ? txtCompressed.value.replace(/\s+/g, '') : '';
  
  if (typeof updateCompressionStats === 'function') updateCompressionStats();
  autoResizeAll();
  forceSave();
}

function syncFromCompressed() {
  if(!txtCompressed) return;
  const rawText = txtCompressed.value;
  if (!rawText.trim()) {
    if (txtDecrypted) txtDecrypted.value = '';
    if (txtEncrypted) txtEncrypted.value = '';
    if (txtCompressed) txtCompressed.value = '';
          if (txtFakeViet) txtFakeViet.value = '';
      if (document.getElementById('camel-case-input')) document.getElementById('camel-case-input').value = '';
      if (document.getElementById('no-accent-input')) document.getElementById('no-accent-input').value = '';
    if (txtTime5) txtTime5.value = '';
    if (txtCompressedContinuous) txtCompressedContinuous.value = '';
    if (txtCVNSS4) txtCVNSS4.value = '';
    renderBreakdown([]);
    return;
}

  // Xu ly tung dong rieng de bao toan ky tu xuong dong
  const lines = rawText.split(/\r?\n/);
  const allTimeParts = [];
  const allDecryptedParts = [];
  const allBreakdownPairs = [];
  const allCvnss4Parts = [];

  lines.forEach((line, lineIdx) => {
    if (lineIdx > 0) {
      allTimeParts.push('\n');
      allDecryptedParts.push('\n');
      allCvnss4Parts.push('\n');
    }
    const tokens = line.split(TOKEN_REGEX);
    tokens.forEach(token => {
      if (!token) return;
      if (token.match(/^[a-zA-Z0-9_\u00C0-\u024F\u1E00-\u1EFF]+$/)) {
        let coreToken = token;
        let casePrefix = '';
        if (token.length === 4 && (token.startsWith('o') || token.startsWith('O'))) {
          casePrefix = token[0];
          coreToken = token.slice(1);
        }
        const timeCode = base60ToTime(coreToken);
        let decoded = decodeWord(timeCode);
        if (decoded && !decoded.startsWith('[')) {
          if (casePrefix === 'o') decoded = decoded.charAt(0).toUpperCase() + decoded.slice(1);
          else if (casePrefix === 'O') decoded = decoded.toUpperCase();
        }
        allTimeParts.push(timeCode);
        allDecryptedParts.push(decoded);
        allCvnss4Parts.push(encodeCVNSS4Word(decoded));
        allBreakdownPairs.push({ base60: token, time: timeCode, word: decoded });
      } else if (token.startsWith('[') && token.endsWith(']')) {
        allTimeParts.push(token);
        allDecryptedParts.push(token);
        allCvnss4Parts.push(token);
        allBreakdownPairs.push({ base60: token, time: token, word: token.substring(1, token.length - 1) });
      } else {
        allTimeParts.push(token);
        allDecryptedParts.push(token);
        allCvnss4Parts.push(token);
      }
    });
  });

  txtEncrypted.value = allTimeParts.join('');
  txtDecrypted.value = allDecryptedParts.join('');

  if(txtFakeViet) txtFakeViet.value = toFakeViet(txtDecrypted.value);

  if(document.getElementById('camel-case-input')) document.getElementById('camel-case-input').value = typeof toCamelCase === 'function' ? toCamelCase(txtDecrypted ? txtDecrypted.value : '') : '';

  if(document.getElementById('no-accent-input')) document.getElementById('no-accent-input').value = typeof toNoAccentContinuous === 'function' ? toNoAccentContinuous(txtDecrypted ? txtDecrypted.value : '') : '';
  if(txtTime5) txtTime5.value = timeTo5Digit(txtEncrypted.value);

  renderBreakdown(allBreakdownPairs);
  saveCurrentNote();
  if (typeof window.updateMnemonicTutorFromDecrypted === 'function') window.updateMnemonicTutorFromDecrypted();
  if (typeof updateCompressionStats === 'function') updateCompressionStats();
  updateCyberFontDisplay();
}

// ===== FAKE VIETNAMESE & 5 DIGITS LOGIC =====
const FAKE_VIET_MAP = {
  'A': '卂', 'B': '乃', 'C': '匚', 'D': 'ᗪ', 'E': '乇', 'F': '₣', 'G': 'Ꮆ',
  'H': '卄', 'I': '工', 'J': 'ﾌ', 'K': 'Ꮶ', 'L': 'ㄥ', 'M': '爪', 'N': '几',
  'O': 'ㄖ', 'P': '卩', 'Q': 'Ɋ', 'R': '尺', 'S': '丂', 'T': 'ㄒ', 'U': 'ㄩ',
  'V': 'ᐯ', 'W': 'ᗯ', 'X': '乂', 'Y': 'ㄚ', 'Z': '乙'
};
const REV_FAKE_VIET_MAP = Object.fromEntries(Object.entries(FAKE_VIET_MAP).map(([k,v])=>[v,k]));

function removeAccentsStr(str) {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D');
}

function toFakeViet(text) {
  if (!text) return '';
  let noTone = removeAccentsStr(text).toUpperCase();
  let mapped = [...noTone].map(c => {
    if (c === ' ') return '-';
    return FAKE_VIET_MAP[c] || c;
  }).join('');
  return `♰${mapped}♰`;
}

function fromFakeViet(fakeText) {
  if (!fakeText) return '';
  let clean = fakeText.replace(/♰/g, '');
  return [...clean].map(c => {
    if (c === '-') return ' ';
    return REV_FAKE_VIET_MAP[c] || c;
  }).join('');
}

function timeTo5Digit(timeStr) {
  if (!timeStr) return '';
  return timeStr.replace(/[0-9]+/g, (match) => {
    let str = match;
    let h=0, m=0, s=0;
    if (str.length === 2) {
      s = parseInt(str, 10);
    } else if (str.length === 4) {
      m = parseInt(str.substring(0,2), 10);
      s = parseInt(str.substring(2,4), 10);
    } else if (str.length === 6) {
      h = parseInt(str.substring(0,2), 10);
      m = parseInt(str.substring(2,4), 10);
      s = parseInt(str.substring(4,6), 10);
    } else {
      return match;
    }
    let total = h * 3600 + m * 60 + s;
    return total.toString().padStart(5, '0');
  });
}

function from5Digit(str5) {
  if (!str5) return '';
  return str5.replace(/[0-9]+/g, (match) => {
    let total = parseInt(match, 10);
    if (isNaN(total)) return match;
    let h = Math.floor(total / 3600);
    let rem = total % 3600;
    let m = Math.floor(rem / 60);
    let s = rem % 60;
    
    // Nếu không có giờ, trả về dạng 4 số (Phút:Giây)
    if (h === 0) {
      return `${m.toString().padStart(2,'0')}${s.toString().padStart(2,'0')}`;
    }
    // Ngược lại trả về đủ 6 số
    return `${h.toString().padStart(2,'0')}${m.toString().padStart(2,'0')}${s.toString().padStart(2,'0')}`;
  });
}

function syncFromFakeViet() {
  if(!txtFakeViet) return;
  const decoded = fromFakeViet(txtFakeViet.value);
  txtDecrypted.value = decoded;
  syncFromDecrypted();
}

function syncFromTime5() {
  if(!txtTime5) return;
  const t6 = from5Digit(txtTime5.value);
  txtEncrypted.value = t6;
  syncFromTime();
}


  if (txtCVNSS4) {
    txtCVNSS4.addEventListener('input', () => {
      syncFromCVNSS4();
      logActivity({ type: 'edit', field: 'cvnss4' });
    });
  }

  if (txtDecrypted) txtDecrypted.addEventListener('input', syncFromDecrypted);
if (txtEncrypted) txtEncrypted.addEventListener('input', syncFromTime);
if (txtCompressed) txtCompressed.addEventListener('input', syncFromCompressed);
if (txtFakeViet) txtFakeViet.addEventListener('input', syncFromFakeViet);
if (txtTime5) txtTime5.addEventListener('input', syncFromTime5);
if (txtCompressedContinuous) txtCompressedContinuous.addEventListener('input', syncFromCompressedContinuous);

let saveTimeout = null;

function forceSave() {
  if (saveTimeout) {
    clearTimeout(saveTimeout);
    saveTimeout = null;
    saveCurrentNote();
  }
}

const handleInput = (syncFn) => {
  syncFn();
  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(saveCurrentNote, 1000);
};

const tagsContainer = document.getElementById('note-tags-container');
const newTagInput = document.getElementById('new-tag-input');
const btnAddTag = document.getElementById('btn-add-tag');
const tagsDatalist = document.getElementById('all-tags-datalist');

function renderNoteTags() {
  if(!tagsContainer) return;
  tagsContainer.innerHTML = '';
  currentNoteTags.forEach(tag => {
    const pill = document.createElement('div');
    pill.className = 'cyber-btn-small';
    pill.style.display = 'inline-flex';
    pill.style.alignItems = 'center';
    pill.style.gap = '5px';
    pill.style.padding = '2px 8px';
    pill.style.textTransform = 'none';
    
    const count = currentNoteCounters[tag] || 0;
    
    const tagText = document.createElement('span');
    tagText.textContent = tag + (count > 0 ? ` (${count})` : '');
    tagText.style.cursor = 'pointer';
    tagText.onclick = () => {
      currentNoteCounters[tag] = (currentNoteCounters[tag] || 0) + 1;
      renderNoteTags();
      if(saveTimeout) clearTimeout(saveTimeout);
      saveCurrentNote();
    };
    
    const rmBtn = document.createElement('span');
    rmBtn.textContent = '×';
    rmBtn.style.cursor = 'pointer';
    rmBtn.style.color = '#ff5555';
    rmBtn.style.fontWeight = 'bold';
    rmBtn.onclick = (e) => {
      e.stopPropagation();
      currentNoteTags = currentNoteTags.filter(t => t !== tag);
      delete currentNoteCounters[tag];
      renderNoteTags();
      if(saveTimeout) clearTimeout(saveTimeout);
      saveCurrentNote();
    };
    
    pill.appendChild(tagText);
    pill.appendChild(rmBtn);
    tagsContainer.appendChild(pill);
  });
}

function updateTagsDatalist() {
  if(!tagsDatalist) return;
  const allTags = new Set();
  notesDB.forEach(n => {
    if(n.tags) n.tags.forEach(t => allTags.add(t));
  });
  tagsDatalist.innerHTML = '';
  allTags.forEach(t => {
    const opt = document.createElement('option');
    opt.value = t;
    tagsDatalist.appendChild(opt);
  });
}

if(btnAddTag && newTagInput) {
  const doAdd = () => {
    const val = newTagInput.value.trim();
    if(val && !currentNoteTags.includes(val)) {
      currentNoteTags.push(val);
      newTagInput.value = '';
      renderNoteTags();
      if(saveTimeout) clearTimeout(saveTimeout);
      saveCurrentNote();
    }
  };
  btnAddTag.addEventListener('click', doAdd);
  newTagInput.addEventListener('keydown', (e) => {
    if(e.key === 'Enter') { e.preventDefault(); doAdd(); }
  });
}

// selLinkedNote removed
// btnOpenLink removed

// selLinkedNote events removed
// btnOpenLink events removed
if(btnLinkPrev) {
  btnLinkPrev.addEventListener('click', () => {
    if(selLinkedNote && selLinkedNote.options.length > 1) {
      selLinkedNote.selectedIndex = 1; // 0 is "-- No Link --", 1 is the most recent
      selLinkedNote.dispatchEvent(new Event('change'));
    }
  });
}

function renderLinkedNoteSelect() {
  if(!selLinkedNote) return;
  const currentVal = selLinkedNote.value;
  selLinkedNote.innerHTML = '<option value="">-- No Link --</option>';
  notesDB.forEach(n => {
    if(n.id !== currentNoteId && !n.isArchived) {
      const opt = document.createElement('option');
      opt.value = n.id;
      const displayTag = n.tags && n.tags.length > 0 ? n.tags[0] : null;
      opt.textContent = displayTag ? displayTag : n.content.substring(0, 20) + '...';
      selLinkedNote.appendChild(opt);
    }
  });
  if(notesDB.find(n => n.id === currentVal && n.id !== currentNoteId)) {
    selLinkedNote.value = currentVal;
  }
}

function setupCopyClear(idBtn, idClear, targetInput) {
  const btn = document.getElementById(idBtn);
  const clear = document.getElementById(idClear);
  if (btn && targetInput) {
    btn.addEventListener('click', () => {
      targetInput.select();
      document.execCommand('copy');
      const orig = btn.innerText;
      btn.innerText = 'COPIED!';
      btn.style.color = '#ff0';
      setTimeout(() => {
        btn.innerText = orig;
        btn.style.color = '';
      }, 1500);
    });
  }
  if (clear && targetInput) {
    clear.addEventListener('click', () => {
      targetInput.value = '';
      if (targetInput === txtDecrypted) syncFromDecrypted();
      else if (targetInput === txtEncrypted) syncFromTime();
      else if (targetInput === txtCompressed) syncFromCompressed();
      else if (targetInput === txtFakeViet) syncFromFakeViet();
      else if (targetInput === txtTime5) syncFromTime5();
    });
  }
}


  // Nút copy mới
  document.getElementById('btn-copy-text')?.addEventListener('click', () => { navigator.clipboard.writeText(txtDecrypted?.value || ''); });
  document.getElementById('btn-copy-compressed')?.addEventListener('click', () => { navigator.clipboard.writeText(txtCompressed?.value || ''); });
  document.getElementById('btn-copy-continuous')?.addEventListener('click', () => { navigator.clipboard.writeText(txtCompressedContinuous?.value || ''); });
  document.getElementById('btn-copy-fake')?.addEventListener('click', () => { navigator.clipboard.writeText(txtFakeViet?.value || ''); });
  document.getElementById('btn-copy-time')?.addEventListener('click', () => { navigator.clipboard.writeText(txtEncrypted?.value || ''); });
  document.getElementById('btn-copy-time5')?.addEventListener('click', () => { navigator.clipboard.writeText(txtTime5?.value || ''); });

  // Nút clear mới
  document.getElementById('btn-clear-continuous')?.addEventListener('click', () => { if(txtCompressedContinuous) txtCompressedContinuous.value = ''; syncFromCompressedContinuous(); });

  // setupCopyClear('btn-copy-text', 'btn-clear-text', txtDecrypted);
// setupCopyClear('btn-copy-time', 'btn-clear-time', txtEncrypted);
// setupCopyClear('btn-copy-compressed', 'btn-clear-compressed', txtCompressed);
// setupCopyClear('btn-copy-fake', 'btn-clear-fake', txtFakeViet);
// setupCopyClear('btn-copy-time5', 'btn-clear-time5', txtTime5);


let multiCopyMode = false;
let multiCopySelected = []; // [{id, label, val}]

const MXC_FIELDS = [
  { id: 'text-input',                  label: 'TEXT gốc'       },
  { id: 'compressed-continuous-input', label: 'Nén liên tiếp'  },
  { id: 'compressed-input',            label: 'BASE60'          },
  { id: 'cvnss4-input',                label: 'CVNSS4'          },
  { id: 'fake-viet-input',             label: 'Fake Viet'       },
  { id: 'camel-case-input',            label: 'camelCase'       },
  { id: 'no-accent-input',             label: 'Không dấu'       },
  { id: 'time-input',                  label: 'TIME'            },
  { id: 'time-5-input',                label: 'TIME-5'          },
];

const mxcSheet   = document.getElementById('mxc-sheet');
const mxcItems   = document.getElementById('mxc-items');
const mxcCount   = document.getElementById('mxc-count');
const mxcDoCopy  = document.getElementById('mxc-do-copy');
const mxcCancel  = document.getElementById('mxc-cancel');
const btnMultiCopy = document.getElementById('btn-multi-copy');

function mxcUpdateCount() {
  if (mxcCount) mxcCount.textContent = multiCopySelected.length > 0 ? multiCopySelected.length + ' đã chọn' : '';
}

function mxcOpenSheet() {
  if (!mxcSheet || !mxcItems) return;
  multiCopySelected = [];
  mxcItems.innerHTML = '';

  MXC_FIELDS.forEach(({ id, label }) => {
    const el = document.getElementById(id);
    const val = el ? el.value.trim() : '';
    const hasVal = !!val;

    const row = document.createElement('div');
    row.style.cssText = 'display:flex; align-items:center; gap:6px; padding:6px 8px; border:1px solid #0f0; border-radius:4px; user-select:none; background:#000;';
    row.dataset.id = id;

    // --- Left badge (plain text) ---
    const badgeLeft = document.createElement('span');
    badgeLeft.className = 'mxc-badge-plain';
    badgeLeft.dataset.mode = 'plain';
    badgeLeft.dataset.fieldId = id;
    badgeLeft.style.cssText = 'width:22px; height:22px; border:1px solid ' + (hasVal ? '#0f0' : '#333') + '; border-radius:3px; display:flex; align-items:center; justify-content:center; font-family:monospace; font-size:11px; color:#0f0; flex-shrink:0; cursor:' + (hasVal ? 'pointer' : 'default') + ';';
    badgeLeft.textContent = '';

    // --- Label ---
    const labelSpan = document.createElement('span');
    labelSpan.style.cssText = 'font-family:monospace; font-size:11px; color:' + (hasVal ? '#0f0' : '#333') + '; flex-shrink:0; min-width:85px;';
    labelSpan.textContent = label;

    // --- Preview ---
    const preview = document.createElement('span');
    preview.style.cssText = 'font-family:monospace; font-size:10px; color:' + (hasVal ? '#666' : '#333') + '; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; flex:1;';
    preview.textContent = val || '(trống)';

    // --- Right badge (hashtag) ---
    const badgeRight = document.createElement('span');
    badgeRight.className = 'mxc-badge-hash';
    badgeRight.dataset.mode = 'hash';
    badgeRight.dataset.fieldId = id;
    badgeRight.style.cssText = 'width:22px; height:22px; border:1px solid ' + (hasVal ? '#0f0' : '#333') + '; border-radius:3px; display:flex; align-items:center; justify-content:center; font-family:monospace; font-size:11px; color:#0f0; flex-shrink:0; cursor:' + (hasVal ? 'pointer' : 'default') + '; flex-direction:column; line-height:1;';
    badgeRight.innerHTML = hasVal ? '<span style="font-size:8px;color:#888">#</span>' : '';

    row.appendChild(badgeLeft);
    row.appendChild(labelSpan);
    row.appendChild(preview);
    row.appendChild(badgeRight);

    if (hasVal) {
      // Helper: toggle a specific slot (plain or hash)
      const toggleSlot = (mode, badge) => {
        const slotId = id + '::' + mode;
        const outVal = mode === 'hash' ? '#' + val : val;
        const idx = multiCopySelected.findIndex(s => s.slotId === slotId);
        if (idx !== -1) {
          multiCopySelected.splice(idx, 1);
          badge.style.background = 'transparent';
          badge.style.color = '#0f0';
          badge.style.border = '1px solid #0f0';
          badge.textContent = mode === 'hash' ? '' : '';
          if (mode === 'hash') badge.innerHTML = '<span style="font-size:8px;color:#888">#</span>';
        } else {
          multiCopySelected.push({ slotId, id, mode, val: outVal });
          const order = multiCopySelected.length;
          badge.style.background = mode === 'hash' ? '#f0a' : '#0ff';
          badge.style.color = '#000';
          badge.style.border = '1px solid ' + (mode === 'hash' ? '#f0a' : '#0ff');
          badge.textContent = order;
        }
        mxcUpdateCount();
        mxcRefreshBadges();
      };

      badgeLeft.addEventListener('click', (e) => { e.stopPropagation(); toggleSlot('plain', badgeLeft); });
      badgeRight.addEventListener('click', (e) => { e.stopPropagation(); toggleSlot('hash', badgeRight); });

      // Click on label/preview area → toggle plain (convenience)
      labelSpan.style.cursor = 'pointer';
      preview.style.cursor = 'pointer';
      labelSpan.addEventListener('click', () => toggleSlot('plain', badgeLeft));
      preview.addEventListener('click', () => toggleSlot('plain', badgeLeft));
    }

    mxcItems.appendChild(row);
  });

  mxcSheet.style.display = 'block';
  mxcUpdateCount();
}

function mxcRefreshBadges() {
  // Re-number all selected badges in order
  document.querySelectorAll('.mxc-badge-plain, .mxc-badge-hash').forEach(badge => {
    const id = badge.dataset.fieldId;
    const mode = badge.dataset.mode;
    const slotId = id + '::' + mode;
    const idx = multiCopySelected.findIndex(s => s.slotId === slotId);
    if (idx !== -1) {
      badge.textContent = idx + 1;
      badge.style.background = mode === 'hash' ? '#f0a' : '#0ff';
      badge.style.color = '#000';
    } else {
      badge.style.background = 'transparent';
      badge.style.color = '#0f0';
      if (mode === 'hash') badge.innerHTML = '<span style="font-size:8px;color:#888">#</span>';
      else badge.textContent = '';
    }
  });
}


function mxcCloseSheet() {
  if (mxcSheet) mxcSheet.style.display = 'none';
  multiCopySelected = [];
  if (btnMultiCopy) {
    btnMultiCopy.style.boxShadow = 'none';
    btnMultiCopy.style.background = '#000';
  }
  multiCopyMode = false;
}

if (btnMultiCopy) {
  btnMultiCopy.addEventListener('click', () => {
    multiCopyMode = !multiCopyMode;
    if (multiCopyMode) {
      btnMultiCopy.style.boxShadow = '0 0 10px #0ff';
      btnMultiCopy.style.background = '#022';
      mxcOpenSheet();
    } else {
      mxcCloseSheet();
    }
  });
}

if (mxcCancel) {
  mxcCancel.addEventListener('click', () => mxcCloseSheet());
}

if (mxcDoCopy) {
  mxcDoCopy.addEventListener('click', () => {
    if (multiCopySelected.length === 0) {
      if (typeof showEXPToast === 'function') showEXPToast('Chưa chọn ô nào!');
      return;
    }
    const text = multiCopySelected.map(s => s.val).join(' ');
    const doCopy = () => {
      if (typeof showEXPToast === 'function') showEXPToast('✓ Đã copy ' + multiCopySelected.length + ' mục!');
      mxcCloseSheet();
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(doCopy).catch(() => {
        const ta = document.createElement('textarea');
        ta.value = text; ta.style.cssText = 'position:fixed;opacity:0;';
        document.body.appendChild(ta); ta.focus(); ta.select();
        try { document.execCommand('copy'); } catch(e){}
        document.body.removeChild(ta);
        doCopy();
      });
    } else {
      const ta = document.createElement('textarea');
      ta.value = text; ta.style.cssText = 'position:fixed;opacity:0;';
      document.body.appendChild(ta); ta.focus(); ta.select();
      try { document.execCommand('copy'); } catch(e){}
      document.body.removeChild(ta);
      doCopy();
    }
  });
}

// --- NOTE APP LOGIC ---

let notesDB = JSON.parse(localStorage.getItem('timecypher_notes') || '[]');
notesDB.forEach(n => {
  if (n.linkedNoteId) {
    if (!n.relations) n.relations = [];
    n.relations.push({ targetId: n.linkedNoteId, type: 'Liên kết' });
    delete n.linkedNoteId;
  }
  if (!n.relations) n.relations = [];
});
notesDB.forEach(note => {
  if (note.tag && !note.tags) {
    note.tags = [note.tag];
  } else if (!note.tags) {
    note.tags = [];
  }
});

let currentNoteId = null;
const selLinkedNote = null;
const btnOpenLink = null;
let currentNoteTags = [];
let currentNoteRelations = [];
let lastOpenedNoteId = null;
let currentNoteCounters = {};
let currentTab = 'active'; // 'active' or 'archive'

const btnNewNote = document.getElementById('btn-new-note');

// ===== 📊 ACTIVITY LOG =====
const ACTIVITY_LOG_KEY = 'snk_activity_log';
function logActivity(entry) {
  try {
    const log = JSON.parse(localStorage.getItem(ACTIVITY_LOG_KEY) || '[]');
    log.push({ ...entry, ts: Date.now() });
    if (log.length > 2000) log.splice(0, log.length - 2000);
    localStorage.setItem(ACTIVITY_LOG_KEY, JSON.stringify(log));
  } catch(e) {}
}
function getActivityLog() {
  try { return JSON.parse(localStorage.getItem(ACTIVITY_LOG_KEY) || '[]'); } catch(e) { return []; }
}
function renderActivityLog() {
  const content = document.getElementById('activity-log-content');
  if (!content) return;
  const log = getActivityLog();
  const now = new Date();
  const today = now.toDateString();
  const dayNames = ['CN','T2','T3','T4','T5','T6','T7'];
  const dayMap = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now); d.setDate(now.getDate() - i);
    const key = d.toDateString();
    dayMap[key] = { visits: 0, quizTotal: 0, quizCorrect: 0, label: dayNames[d.getDay()], date: d, key };
  }
  log.forEach(entry => {
    const key = new Date(entry.ts).toDateString();
    if (!dayMap[key]) return;
    if (entry.type === 'visit') dayMap[key].visits++;
    else if (entry.type === 'quiz') { dayMap[key].quizTotal++; if (entry.correct) dayMap[key].quizCorrect++; }
  });
  const days = Object.values(dayMap);
  const totalVisits = days.reduce((s,d)=>s+d.visits,0);
  const totalQuiz = days.reduce((s,d)=>s+d.quizTotal,0);
  const correctQuiz = days.reduce((s,d)=>s+d.quizCorrect,0);
  const accuracy = totalQuiz > 0 ? Math.round(correctQuiz/totalQuiz*100) : 0;
  let html = `<div style="padding:8px;border:1px solid #0a0;border-radius:4px;margin-bottom:12px;background:rgba(0,255,0,0.03);"><div style="font-size:10px;color:#666;margin-bottom:6px;letter-spacing:1px;">TỔNG 7 NGÀY QUA</div><div style="margin-bottom:3px;">📅 <strong>${totalVisits}</strong> lần truy cập</div><div>🎯 <strong>${correctQuiz}/${totalQuiz}</strong> quiz${accuracy > 0 ? ` <span style="color:${accuracy>=70?'#0f0':'#f80'}">(${accuracy}%)</span>` : ''}</div></div><div style="font-size:10px;color:#666;margin-bottom:8px;letter-spacing:1px;">THEO NGÀY</div>`;
  days.forEach(stat => {
    const isToday = stat.key === today;
    const acc = stat.quizTotal > 0 ? Math.round(stat.quizCorrect/stat.quizTotal*100) : null;
    html += `<div data-date="${stat.key}" class="activity-day-row" style="display:flex;justify-content:space-between;align-items:center;padding:6px 8px;margin-bottom:4px;border:1px solid ${isToday?'#0f0':'#222'};border-radius:3px;cursor:pointer;background:${isToday?'rgba(0,255,0,0.04)':'transparent'};"><span style="font-weight:bold;color:${isToday?'#0f0':'#666'}">${stat.label}${isToday?' ◄':''}</span><div style="display:flex;gap:8px;font-size:11px;">${stat.visits>0?`<span style="color:#0a9">📅${stat.visits}</span>`:''}${stat.quizTotal>0?`<span style="color:${acc>=70?'#0f0':acc>=50?'#f80':'#f55'}">🎯${stat.quizCorrect}/${stat.quizTotal}</span>`:''}${stat.visits===0&&stat.quizTotal===0?`<span style="color:#333">—</span>`:''}</div></div>`;
  });
  content.innerHTML = html;
  content.querySelectorAll('.activity-day-row').forEach(row => {
    row.addEventListener('click', () => showDayDetail(row.dataset.date, log));
  });
}
function showDayDetail(dateKey, log) {
  const content = document.getElementById('activity-log-content');
  if (!content) return;
  const dayEntries = log.filter(e => new Date(e.ts).toDateString() === dateKey);
  const d = new Date(dateKey);
  const dayNamesLong = ['Chủ nhật','Thứ 2','Thứ 3','Thứ 4','Thứ 5','Thứ 6','Thứ 7'];
  let html = `<div style="display:flex;align-items:center;gap:6px;margin-bottom:12px;"><button id="btn-back-activity" style="background:transparent;color:#0f0;border:1px solid #0f0;padding:2px 8px;cursor:pointer;border-radius:3px;font-size:12px;font-family:monospace;">← Trở lại</button><span style="font-size:12px;color:#888">${dayNamesLong[d.getDay()]} ${d.getDate()}/${d.getMonth()+1}</span></div>`;
  if (dayEntries.length === 0) {
    html += `<div style="color:#555;text-align:center;padding:20px;">Không có hoạt động</div>`;
  } else {
    const visits = dayEntries.filter(e=>e.type==='visit');
    const quizzes = dayEntries.filter(e=>e.type==='quiz');
    const correct = quizzes.filter(e=>e.correct).length;
    if (visits.length) {
      html += `<div style="margin-bottom:10px;padding:8px;border:1px solid #0a0;border-radius:4px;"><div style="font-size:10px;color:#666;margin-bottom:4px;">TRUY CỬP</div>`;
      visits.forEach(v => { const t=new Date(v.ts); html+=`<div style="font-size:11px;color:#0a9;">${String(t.getHours()).padStart(2,'0')}:${String(t.getMinutes()).padStart(2,'0')} – Mở ứng dụng</div>`; });
      html += `</div>`;
    }
    if (quizzes.length) {
      html += `<div style="margin-bottom:10px;padding:8px;border:1px solid #0a0;border-radius:4px;"><div style="font-size:10px;color:#666;margin-bottom:4px;">QUIZ (${correct}/${quizzes.length} đúng)</div>`;
      quizzes.forEach(q => { const t=new Date(q.ts); const hh=q.time?q.time.slice(0,2):'?'; const mm=q.time?q.time.slice(2,4):'?'; html+=`<div style="font-size:11px;color:${q.correct?'#0f0':'#f55'}">${String(t.getHours()).padStart(2,'0')}:${String(t.getMinutes()).padStart(2,'0')} ${q.correct?'✓':'✗'} ${hh}:${mm}</div>`; });
      html += `</div>`;
    }
  }
  content.innerHTML = html;
  content.querySelector('#btn-back-activity')?.addEventListener('click', () => renderActivityLog());
}

const btnPlayground = document.getElementById('btn-playground');
const searchNote = document.getElementById('search-note');
const notesList = document.getElementById('notes-list');
const tabBtns = document.querySelectorAll('.tab-btn');
const btnArchiveNote = document.getElementById('btn-archive-note');
const btnDeleteNote = document.getElementById('btn-delete-note');

window.showToast = function(msg) {
  const container = document.getElementById('exp-toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = 'exp-toast';
  toast.textContent = msg;
  toast.style.color = '#0ff';
  toast.style.borderColor = '#0ff';
  toast.style.backgroundColor = 'rgba(0, 50, 50, 0.9)';
  container.appendChild(toast);
  setTimeout(() => { toast.remove(); }, 2000);
};

function enterSandboxMode(silent = false) {
  localStorage.setItem('timecypher_last_mode', 'sandbox');
  document.body.classList.add('sandbox-mode');
  currentNoteId = 'playground';
  txtDecrypted.value = '';
  txtEncrypted.value = '';
  if(txtCompressed) txtCompressed.value = '';
  currentNoteTags = [];
  currentNoteCounters = {};
  currentNoteRelations = [];
  renderNoteTags();
  renderNoteRelations();
  if(newTagInput) newTagInput.value = '';
  renderBreakdown([]);
  document.querySelectorAll('.note-item').forEach(i => i.classList.remove('active'));
  if (!silent) {
    cyberAlert("Đã vào chế độ SANDBOX (Nháp). Mọi thứ bạn gõ ở đây sẽ KHÔNG BỊ LƯU LẠI.");
  }
}

if (btnPlayground) {
  btnPlayground.addEventListener('click', () => enterSandboxMode(false));
}

function saveCurrentNote() {
  if (currentNoteId === 'playground') return; // Sandbox mode, do not save
  
  const base60Data = txtCompressed ? txtCompressed.value.replace(/[⇧⇪]/g, '').trim() : '';
  const hasTags = currentNoteTags && currentNoteTags.length > 0;
  
  if(base60Data === '' && !hasTags) return;
  
  // linkData removed
  
  if (!currentNoteId) {
    currentNoteId = 'note_' + Date.now();
    const newNote = {
      id: currentNoteId,
      tags: [...currentNoteTags],
      relations: JSON.parse(JSON.stringify(currentNoteRelations)),
      content: base60Data,
      isArchived: false,
      updatedAt: Date.now()
    };
    notesDB.unshift(newNote);
  } else {
    const note = notesDB.find(n => n.id === currentNoteId);
    if (note) {
      note.tags = [...currentNoteTags];
      note.relations = JSON.parse(JSON.stringify(currentNoteRelations));
      note.content = base60Data;
      note.updatedAt = Date.now();
      // Move to top
      notesDB = notesDB.filter(n => n.id !== currentNoteId);
      notesDB.unshift(note);
    }
  }
  localStorage.setItem('timecypher_notes', JSON.stringify(notesDB));
  if(typeof updateTagsDatalist === 'function') updateTagsDatalist();
  renderNotesSidebar();
  if (typeof isKeepViewActive !== 'undefined' && isKeepViewActive && typeof renderKeepView === 'function') renderKeepView();
}

const backlinksContainer = document.getElementById('backlinks-container');
const backlinksList = document.getElementById('backlinks-list');

function getNoteDecryptedPreview(content, maxLen = 30) {
  if (!content) return '';
  const text = content.replace(/[⇧⇪]/g, '');
  const tokens = text.split(TOKEN_REGEX);
  let decryptedParts = [];
  tokens.forEach(token => {
    if (!token) return;
    if (token.match(/^[a-zA-Z0-9_\u00C0-\u024F\u1E00-\u1EFF]+$/)) {
      if (token.length > 3 && token.length % 3 === 0 && /^[a-zA-Z0-9]+$/.test(token) && !/^\d+$/.test(token)) {
        for (let i = 0; i < token.length; i += 3) {
          const chunk = token.substring(i, i + 3);
          const timeCode = base60ToTime(chunk);
          decryptedParts.push(decodeWord(timeCode) + ' ');
        }
      } else {
        const timeCode = base60ToTime(token);
        decryptedParts.push(decodeWord(timeCode));
      }
    } else if (token.startsWith('"') && token.endsWith('"')) {
      decryptedParts.push(token.substring(1, token.length - 1));
    } else if (token.startsWith('[') && token.endsWith(']')) {
      decryptedParts.push(token);
    } else {
      decryptedParts.push(token);
    }
  });
  let res = decryptedParts.join('').replace(/\s+/g, ' ').trim();
  if (res.length > maxLen) {
    res = res.substring(0, maxLen) + '...';
  }
  return res;
}

function getNoteDisplayLabel(note, maxLen = 25) {
  if (!note) return 'Không rõ';
  const tagStr = (note.tags && note.tags.length > 0) ? `[${note.tags.join(', ')}] ` : '';
  const preview = getNoteDecryptedPreview(note.content, maxLen) || (note.content ? note.content.substring(0, 15) + '...' : 'Ghi chú');
  const d = new Date(note.updatedAt || Date.now());
  const timeStr = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  return `${tagStr}${preview} (${timeStr})`;
}

function renderBacklinks(id) {
  if(!backlinksContainer || !backlinksList) return;
  if(!id || id === 'playground') {
    backlinksContainer.style.display = 'none';
    return;
  }
  const backlinks = notesDB.filter(n => !n.isArchived && n.relations && n.relations.some(r => r.targetId === id));
  if(backlinks.length > 0) {
    backlinksList.innerHTML = '';
    backlinks.forEach(bl => {
      const relObj = bl.relations.find(r => r.targetId === id);
      const relType = relObj ? relObj.type : 'Liên kết';
      const decodedText = getNoteDecryptedPreview(bl.content, 500) || bl.content;

      const box = document.createElement('div');
      box.style.background = 'rgba(0, 255, 255, 0.08)';
      box.style.border = '1px solid #00ffff';
      box.style.color = '#00ffff';
      box.style.padding = '8px 10px';
      box.style.borderRadius = '4px';
      box.style.marginBottom = '8px';
      box.style.width = '100%';
      box.style.boxSizing = 'border-box';

      const tagTitle = document.createElement('div');
      tagTitle.style.fontWeight = 'bold';
      tagTitle.style.marginBottom = '6px';
      tagTitle.style.fontSize = '11px';
      tagTitle.style.cursor = 'pointer';
      tagTitle.style.display = 'flex';
      tagTitle.style.justifyContent = 'space-between';
      tagTitle.style.borderBottom = '1px dashed rgba(0, 255, 255, 0.4)';
      tagTitle.style.paddingBottom = '4px';
      tagTitle.innerHTML = `<span>⚡ [${relType}] ${getNoteDisplayLabel(bl, 20)}</span> <span style="font-size:10px; color:#aaa;">↗ Mở Note</span>`;
      tagTitle.onclick = () => loadNote(bl.id);
      
      const contentDiv = document.createElement('div');
      contentDiv.style.fontFamily = 'var(--font-mono)';
      contentDiv.style.whiteSpace = 'pre-wrap';
      contentDiv.style.lineHeight = '1.4';
      contentDiv.style.fontSize = '11px';
      contentDiv.style.color = '#eee';
      contentDiv.textContent = decodedText;

      box.appendChild(tagTitle);
      box.appendChild(contentDiv);
      backlinksList.appendChild(box);
    });
    backlinksContainer.style.display = 'block';
  } else {
    backlinksContainer.style.display = 'none';
  }
}

function loadNote(id) {
  forceSave();
  localStorage.setItem('timecypher_last_mode', 'studio');
  localStorage.setItem('timecypher_last_note_id', id);
  document.body.classList.remove('sandbox-mode');
  const note = notesDB.find(n => n.id === id);
  if (!note) return;
  currentNoteId = id;
  if(txtCompressed) {
    txtCompressed.value = note.content;
    currentNoteTags = [...(note.tags || [])];
    currentNoteCounters = { ...(note.counters || {}) };
    currentNoteRelations = JSON.parse(JSON.stringify(note.relations || []));
    if (lastOpenedNoteId !== id) lastOpenedNoteId = currentNoteId;
    renderNoteTags();
    
    if(selLinkedNote) {
      selLinkedNote.value = note.linkedNoteId || '';
      if(btnOpenLink) btnOpenLink.style.display = selLinkedNote.value ? 'inline-block' : 'none';
    }
    syncFromCompressed();
    renderNoteRelations();
  }
  renderLinkedNoteSelect();
  renderBacklinks(id);
  renderNotesSidebar();
  updateActionButtons();
}

function createNewNote() {
  document.body.classList.remove('sandbox-mode');
  localStorage.setItem('timecypher_last_mode', 'studio');
  forceSave();
  currentNoteId = null;
  txtDecrypted.value = '';
  txtEncrypted.value = '';
  if(txtCompressed) txtCompressed.value = '';
  currentNoteTags = [];
  currentNoteCounters = {};
  currentNoteRelations = [];
  renderNoteTags();
  if(newTagInput) newTagInput.value = '';
  if(selLinkedNote) {
    selLinkedNote.value = '';
    if(btnOpenLink) btnOpenLink.style.display = 'none';
  }
  renderLinkedNoteSelect();
  renderBacklinks(null);
  renderNoteRelations();
  renderBreakdown([]);
  renderNotesSidebar();
  updateActionButtons();
  txtDecrypted.focus();
}

function updateActionButtons() {
  if(!currentNoteId || !btnArchiveNote) return;
  const note = notesDB.find(n => n.id === currentNoteId);
  if(note) {
    btnArchiveNote.textContent = note.isArchived ? 'UNARCHIVE NOTE' : 'ARCHIVE NOTE';
  }
}

function renderNotesSidebar() {
  if(!notesList) return;
  const query = (searchNote.value || '').trim();
  let filterStr = query;
  
  // REVERSE SEARCH: Náº¿u nháº­p Tiáº¿ng Viá»‡t, mÃ£ hÃ³a thÃ nh Base60 Ä‘á»ƒ search
  if(query && query.match(/[^\w\s]/)) { // Náº¿u cÃ³ dáº¥u tiáº¿ng Viá»‡t
    const words = query.replace(/[.,!?()[\]{}"']/g, ' ').split(/\s+/).filter(w => w.length > 0);
    filterStr = words.map(w => timeToBase60(encodeWord(w))).join(' ');
  }

  notesList.innerHTML = '';
  let filtered = notesDB.filter(n => (currentTab === 'archive' ? n.isArchived : !n.isArchived));
  
  if (query) {
    filtered = filtered.filter(n => {
      const matchContent = n.content.includes(filterStr);
      const matchTag = n.tags && n.tags.some(t => t.toLowerCase().includes(query.toLowerCase()));
      return matchContent || matchTag;
    });
  }

  function highlight(text, keyword) {
    if(!keyword || !text) return text;
    const safeWord = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${safeWord})`, 'gi');
    return text.replace(regex, '<span style="background: #ffea00; color: #000; font-weight: bold; border-radius: 2px; padding: 0 2px;">$1</span>');
  }

  filtered.forEach(n => {
    const el = document.createElement('div');
    el.className = 'note-item' + (n.id === currentNoteId ? ' selected' : '');
    el.onclick = () => loadNote(n.id);
    
    const d = new Date(n.updatedAt);
    let preview = n.content.substring(0, 25) + (n.content.length > 25 ? '...' : '');

    let tagsHtml = '';
    if (n.tags && n.tags.length > 0) {
      tagsHtml = '<div style="display: flex; gap: 4px; flex-wrap: wrap; margin-bottom: 5px;">';
      n.tags.forEach(t => {
        let displayT = t;
        if (query) displayT = highlight(t, query);
        tagsHtml += `<span style="background: rgba(0, 255, 0, 0.1); border: 1px solid var(--neon-green); color: var(--neon-green); font-size: 0.75rem; padding: 1px 4px; border-radius: 2px;">${displayT}</span>`;
      });
      tagsHtml += '</div>';
    }

    if (query) {
      preview = highlight(preview, filterStr);
    }
    
    el.innerHTML = `
      ${tagsHtml}
      <div class="note-time">${d.toLocaleDateString()} ${d.toLocaleTimeString()}</div>
      <div class="note-preview">${preview || '[Empty]'}</div>
    `;
    notesList.appendChild(el);
  });
}

if(btnNewNote) btnNewNote.addEventListener('click', createNewNote);
if(searchNote) searchNote.addEventListener('input', renderNotesSidebar);

tabBtns.forEach(btn => {
  btn.addEventListener('click', (e) => {
    forceSave();
    tabBtns.forEach(b => b.classList.remove('active'));
    e.target.classList.add('active');
    currentTab = e.target.getAttribute('data-tab');
    renderNotesSidebar();
  });
});

if(btnArchiveNote) {
  btnArchiveNote.addEventListener('click', () => {
    if(!currentNoteId) return;
    const note = notesDB.find(n => n.id === currentNoteId);
    if(note) {
      note.isArchived = !note.isArchived;
      localStorage.setItem('timecypher_notes', JSON.stringify(notesDB));
      if(note.isArchived && currentTab === 'active') createNewNote();
      else renderNotesSidebar();
      updateActionButtons();
    }
  });
}

if(btnDeleteNote) {
  btnDeleteNote.addEventListener('click', () => {
    if(!currentNoteId) return;
    cyberConfirm('Bạn có chắc chắn muốn xóa vĩnh viễn Note này?', () => {
      notesDB = notesDB.filter(n => n.id !== currentNoteId);
      localStorage.setItem('timecypher_notes', JSON.stringify(notesDB));
      createNewNote();
    });
  });
}

// Khá»Ÿi táº¡o load
// --- IMPORT / EXPORT LOGIC ---
const btnExport = document.getElementById('btn-export-json');
const btnImport = document.getElementById('btn-import-json');
const fileInput = document.getElementById('import-file');

if(btnExport) {
  btnExport.addEventListener('click', () => {
    if (notesDB.length === 0) {
      cyberAlert("Không có dữ liệu để Export!");
      return;
    }
    const dataStr = JSON.stringify(notesDB, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `timecypher_backup_${new Date().getTime()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });
}

if(btnImport && fileInput) {
  btnImport.addEventListener('click', () => {
    fileInput.click();
  });
  
  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedData = JSON.parse(event.target.result);
        if (Array.isArray(importedData)) {
          // Merge logic: avoid duplicates based on ID
          let added = 0;
          importedData.forEach(note => {
            if (!notesDB.find(n => n.id === note.id)) {
              notesDB.push(note);
              added++;
            }
          });
          notesDB.sort((a,b) => b.updatedAt - a.updatedAt);
          localStorage.setItem('timecypher_notes', JSON.stringify(notesDB));
          renderNotesSidebar();
          alert(`Import thÃ nh cÃ´ng! Ä Ã£ thÃªm ${added} ghi chÃº má»›i.`);
        } else {
          alert("File JSON khÃ´ng Ä‘Ãºng Ä‘á»‹nh dáº¡ng cá»§a TimeCypher.");
        }
      } catch (err) {
        alert("Lá»—i Ä‘á» c file: " + err.message);
      }
      fileInput.value = ''; // Reset
    };
    reader.readAsText(file);
  });
}

// --- 🗂️ GOOGLE KEEP CARDS VIEW LOGIC ---
let isKeepViewActive = false;
let keepCurrentTab = 'active';
let keepSelectedTagFilter = null;

const studioLayout = document.getElementById('studio-view-layout');
const keepViewContainer = document.getElementById('keep-view-container');
const btnToggleKeepView = document.getElementById('btn-toggle-keep-view');
const btnTopKeepView = document.getElementById('btn-top-keep-view');
const btnExitKeepView = document.getElementById('btn-exit-keep-view');
const btnKeepToggleReveal = document.getElementById('btn-keep-toggle-reveal');
const keepCardsGrid = document.getElementById('keep-cards-grid');
const keepSearchInput = document.getElementById('keep-search-input');
const keepNoteCount = document.getElementById('keep-note-count');
const keepTagsCloud = document.getElementById('keep-tags-cloud');
const keepTabActive = document.getElementById('keep-tab-active');
const keepTabArchive = document.getElementById('keep-tab-archive');
let isKeepRevealAll = false;

const keepQuickBox = document.getElementById('keep-quick-box');
const keepQuickContent = document.getElementById('keep-quick-content');
const keepQuickTags = document.getElementById('keep-quick-tags');
const keepQuickActions = document.getElementById('keep-quick-actions');
const btnKeepQuickSave = document.getElementById('btn-keep-quick-save');
const btnKeepQuickCancel = document.getElementById('btn-keep-quick-cancel');

function toggleKeepView(forceState) {
  forceSave();
  if (typeof forceState === 'boolean') {
    isKeepViewActive = forceState;
  } else {
    isKeepViewActive = !isKeepViewActive;
  }

  // Close all floating dropdowns
  const viewOptionsMenu = document.getElementById('view-options-menu');
  const toolsDropdownMenu = document.getElementById('tools-dropdown-menu');
  if (viewOptionsMenu) viewOptionsMenu.style.display = 'none';
  if (toolsDropdownMenu) toolsDropdownMenu.style.display = 'none';

  if (isKeepViewActive) {
    localStorage.setItem('timecypher_last_mode', 'keep');
    document.body.classList.remove('sandbox-mode');
    
    // Hide sandbox fixed action bars
    const sandboxTopLeft = document.getElementById('sandbox-top-left');
    const sandboxActions = document.getElementById('sandbox-actions');
    if (sandboxTopLeft) sandboxTopLeft.style.display = 'none';
    if (sandboxActions) sandboxActions.style.display = 'none';

    if (studioLayout) studioLayout.style.display = 'none';
    if (keepViewContainer) keepViewContainer.style.display = 'flex';
    if (btnToggleKeepView) {
      btnToggleKeepView.textContent = '💻 STUDIO';
      btnToggleKeepView.style.background = '#00ffcc';
      btnToggleKeepView.style.color = '#000';
    }
    if (btnTopKeepView) {
      btnTopKeepView.style.background = '#00ffcc';
      btnTopKeepView.style.color = '#000';
    }
    if (keepSearchInput && searchNote) {
      keepSearchInput.value = searchNote.value;
    }
    renderKeepView();
  } else {
    localStorage.setItem('timecypher_last_mode', 'studio');
    document.body.classList.remove('sandbox-mode');
    if (studioLayout) studioLayout.style.display = '';
    if (keepViewContainer) keepViewContainer.style.display = 'none';
    if (btnToggleKeepView) {
      btnToggleKeepView.textContent = '🗂️ KEEP';
      btnToggleKeepView.style.background = '#002b22';
      btnToggleKeepView.style.color = '#00ffcc';
    }
    if (btnTopKeepView) {
      btnTopKeepView.style.background = '#000';
      btnTopKeepView.style.color = '#00ffcc';
    }
    if (searchNote && keepSearchInput) {
      searchNote.value = keepSearchInput.value;
    }
    renderNotesSidebar();
  }
}

function renderKeepView() {
  if (!keepCardsGrid) return;

  // Always ensure fresh notesDB from localStorage
  try {
    const raw = localStorage.getItem('timecypher_notes');
    if (raw) notesDB = JSON.parse(raw);
  } catch (e) {}

  const query = (keepSearchInput ? keepSearchInput.value : '').trim();
  let filterStr = query;
  
  if (query && query.match(/[^\w\s]/)) {
    const words = query.replace(/[.,!?()[\]{}"']/g, ' ').split(/\s+/).filter(w => w.length > 0);
    filterStr = words.map(w => timeToBase60(encodeWord(w))).join(' ');
  }

  let filtered = notesDB.filter(n => (keepCurrentTab === 'archive' ? n.isArchived : !n.isArchived));

  if (keepSelectedTagFilter) {
    filtered = filtered.filter(n => n.tags && n.tags.includes(keepSelectedTagFilter));
  }

  if (query) {
    filtered = filtered.filter(n => {
      const matchContent = n.content.includes(filterStr) || n.content.toLowerCase().includes(query.toLowerCase());
      const decrypted = getNoteDecryptedPreview(n.content, 1000).toLowerCase();
      const matchDecrypted = decrypted.includes(query.toLowerCase());
      const matchTag = n.tags && n.tags.some(t => t.toLowerCase().includes(query.toLowerCase()));
      return matchContent || matchDecrypted || matchTag;
    });
  }

  if (keepNoteCount) {
    keepNoteCount.textContent = `${filtered.length} NOTE${filtered.length !== 1 ? 'S' : ''}`;
  }

  // Tags Cloud
  if (keepTagsCloud) {
    const allTags = new Set();
    notesDB.forEach(n => {
      if ((keepCurrentTab === 'archive' ? n.isArchived : !n.isArchived) && n.tags) {
        n.tags.forEach(t => allTags.add(t));
      }
    });

    keepTagsCloud.innerHTML = '';
    if (allTags.size > 0) {
      const allPill = document.createElement('div');
      allPill.className = 'keep-tag-filter-pill' + (!keepSelectedTagFilter ? ' active' : '');
      allPill.textContent = '🌟 Tất cả';
      allPill.onclick = () => {
        keepSelectedTagFilter = null;
        renderKeepView();
      };
      keepTagsCloud.appendChild(allPill);

      allTags.forEach(t => {
        const pill = document.createElement('div');
        pill.className = 'keep-tag-filter-pill' + (keepSelectedTagFilter === t ? ' active' : '');
        pill.textContent = `#${t}`;
        pill.onclick = () => {
          keepSelectedTagFilter = (keepSelectedTagFilter === t) ? null : t;
          renderKeepView();
        };
        keepTagsCloud.appendChild(pill);
      });
    }
  }

  // Cards Grid
  keepCardsGrid.innerHTML = '';
  if (filtered.length === 0) {
    keepCardsGrid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 40px 20px; color: #666; font-size: 14px; border: 1px dashed rgba(0,255,204,0.2); border-radius: 8px;">
        ${query || keepSelectedTagFilter ? '🔍 Không tìm thấy ghi chú phù hợp với bộ lọc.' : '📝 Chưa có ghi chú nào. Hãy tạo ghi chú đầu tiên ở trên!'}
      </div>
    `;
    return;
  }

  filtered.forEach(n => {
    const card = document.createElement('div');
    card.className = 'keep-card' + (n.id === currentNoteId ? ' active' : '');
    
    const d = new Date(n.updatedAt || Date.now());
    const isToday = new Date().toDateString() === d.toDateString();
    const timeFormatted = isToday
      ? `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`
      : `${d.getDate().toString().padStart(2,'0')}/${(d.getMonth()+1).toString().padStart(2,'0')} ${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`;
    const decryptedText = getNoteDecryptedPreview(n.content, 400) || '(Chưa có nội dung)';
    const b60Preview = n.content.length > 80 ? n.content.substring(0, 80) + '...' : n.content;

    let tagsHtml = '';
    if (n.tags && n.tags.length > 0) {
      tagsHtml = '<div class="keep-card-tags">';
      n.tags.forEach(t => {
        const count = n.counters && n.counters[t] ? ` (${n.counters[t]})` : '';
        tagsHtml += `<span class="keep-card-tag">${t}${count}</span>`;
      });
      tagsHtml += '</div>';
    } else {
      tagsHtml = '<div class="keep-card-tags"><span style="font-size:10px; color:#555;">[Không nhãn]</span></div>';
    }

    let relIcon = '';
    if (n.relations && n.relations.length > 0) {
      relIcon = `<span title="${n.relations.length} liên kết quan hệ" style="font-size:10px; color:#00ffcc; background:rgba(0,255,204,0.1); padding:1px 4px; border-radius:3px; border:1px solid rgba(0,255,204,0.3);">🔗 ${n.relations.length}</span>`;
    }

    card.innerHTML = `
      <div class="keep-card-header">
        ${tagsHtml}
        ${relIcon}
      </div>
      <div class="keep-card-body-b60" title="Mã Base60">${b60Preview || '[Trống]'}</div>
      <div class="keep-card-peek-hint">👁️ Chạm / Rê chuột xem dịch</div>
      <div class="keep-card-body-vi">💬 ${decryptedText}</div>
      <div class="keep-card-footer">
        <span>🕒 ${timeFormatted}</span>
        <div class="keep-card-actions">
          <button class="keep-action-btn keep-copy-vi" title="Copy Tiếng Việt">VI</button>
          <button class="keep-action-btn keep-copy-b60" title="Copy Base60">B60</button>
          <button class="keep-action-btn keep-btn-archive" title="${n.isArchived ? 'Khôi phục' : 'Lưu trữ'}">${n.isArchived ? '📥' : '📦'}</button>
          <button class="keep-action-btn danger keep-btn-delete" title="Xóa">🗑️</button>
        </div>
      </div>
    `;

    card.addEventListener('click', (e) => {
      if (e.target.closest('.keep-action-btn')) return;
      const isTouch = window.matchMedia('(pointer: coarse)').matches || window.innerWidth <= 768;
      if (isTouch && !card.classList.contains('revealed') && !isKeepRevealAll) {
        card.classList.add('revealed');
      } else {
        loadNote(n.id);
        toggleKeepView(false);
      }
    });

    const btnCopyVi = card.querySelector('.keep-copy-vi');
    if (btnCopyVi) {
      btnCopyVi.addEventListener('click', (e) => {
        e.stopPropagation();
        navigator.clipboard.writeText(decryptedText);
        showToast('✓ Đã copy Tiếng Việt');
      });
    }

    const btnCopyB60 = card.querySelector('.keep-copy-b60');
    if (btnCopyB60) {
      btnCopyB60.addEventListener('click', (e) => {
        e.stopPropagation();
        navigator.clipboard.writeText(n.content);
        showToast('✓ Đã copy mã Base60');
      });
    }

    const btnArchive = card.querySelector('.keep-btn-archive');
    if (btnArchive) {
      btnArchive.addEventListener('click', (e) => {
        e.stopPropagation();
        n.isArchived = !n.isArchived;
        localStorage.setItem('timecypher_notes', JSON.stringify(notesDB));
        renderKeepView();
        renderNotesSidebar();
        showToast(n.isArchived ? '📦 Đã lưu trữ ghi chú' : '📥 Đã khôi phục ghi chú');
      });
    }

    const btnDelete = card.querySelector('.keep-btn-delete');
    if (btnDelete) {
      btnDelete.addEventListener('click', (e) => {
        e.stopPropagation();
        cyberConfirm('Bạn có chắc chắn muốn xóa vĩnh viễn Note này?', () => {
          notesDB = notesDB.filter(item => item.id !== n.id);
          localStorage.setItem('timecypher_notes', JSON.stringify(notesDB));
          if (currentNoteId === n.id) createNewNote();
          renderKeepView();
          renderNotesSidebar();
          showToast('🗑️ Đã xóa ghi chú');
        });
      });
    }

    keepCardsGrid.appendChild(card);
  });
}

if (btnToggleKeepView) btnToggleKeepView.addEventListener('click', () => toggleKeepView());
if (btnTopKeepView) btnTopKeepView.addEventListener('click', () => toggleKeepView());
if (btnExitKeepView) btnExitKeepView.addEventListener('click', () => toggleKeepView(false));
if (btnKeepToggleReveal) {
  btnKeepToggleReveal.addEventListener('click', () => {
    isKeepRevealAll = !isKeepRevealAll;
    if (keepViewContainer) {
      keepViewContainer.classList.toggle('reveal-all', isKeepRevealAll);
    }
    btnKeepToggleReveal.textContent = isKeepRevealAll ? '👁️ ẨN VI' : '👁️ HIỆN VI';
    btnKeepToggleReveal.style.color = isKeepRevealAll ? '#00ffcc' : '#ffea00';
    btnKeepToggleReveal.style.borderColor = isKeepRevealAll ? '#00ffcc' : '#ffea00';
    btnKeepToggleReveal.style.background = isKeepRevealAll ? 'rgba(0,255,204,0.15)' : 'rgba(255,234,0,0.1)';
  });
}
if (keepSearchInput) keepSearchInput.addEventListener('input', renderKeepView);

if (keepTabActive && keepTabArchive) {
  keepTabActive.addEventListener('click', () => {
    keepTabActive.classList.add('active');
    keepTabArchive.classList.remove('active');
    keepCurrentTab = 'active';
    renderKeepView();
  });
  keepTabArchive.addEventListener('click', () => {
    keepTabArchive.classList.add('active');
    keepTabActive.classList.remove('active');
    keepCurrentTab = 'archive';
    renderKeepView();
  });
}

if (keepQuickContent) {
  keepQuickContent.addEventListener('focus', () => {
    if (keepQuickTags) keepQuickTags.style.display = 'block';
    if (keepQuickActions) keepQuickActions.style.display = 'flex';
    keepQuickContent.rows = 3;
  });
}

if (btnKeepQuickCancel) {
  btnKeepQuickCancel.addEventListener('click', () => {
    if (keepQuickTags) {
      keepQuickTags.style.display = 'none';
      keepQuickTags.value = '';
    }
    if (keepQuickActions) keepQuickActions.style.display = 'none';
    if (keepQuickContent) {
      keepQuickContent.value = '';
      keepQuickContent.rows = 1;
    }
  });
}

if (btnKeepQuickSave) {
  btnKeepQuickSave.addEventListener('click', () => {
    const text = (keepQuickContent ? keepQuickContent.value : '').trim();
    if (!text) return;

    const tokens = text.split(TOKEN_REGEX);
    let compressedParts = [];
    tokens.forEach(token => {
      if (!token) return;
      if (token.match(/^[a-zA-Z0-9_\u00C0-\u024F\u1E00-\u1EFF]+$/)) {
        const timeCode = encodeWord(token);
        const b60Code = timeToBase60(timeCode);
        compressedParts.push(b60Code);
      } else if (token.startsWith('[') && token.endsWith(']')) {
        compressedParts.push(token);
      } else {
        compressedParts.push(token);
      }
    });
    const base60Data = compressedParts.join(' ').replace(/\s+/g, ' ').trim();

    const rawTags = (keepQuickTags ? keepQuickTags.value : '').split(',').map(t => t.trim()).filter(t => t.length > 0);

    const newId = 'note_' + Date.now();
    const newNote = {
      id: newId,
      tags: rawTags,
      counters: {},
      relations: [],
      content: base60Data,
      isArchived: false,
      updatedAt: Date.now()
    };

    notesDB.unshift(newNote);
    localStorage.setItem('timecypher_notes', JSON.stringify(notesDB));

    if (keepQuickContent) {
      keepQuickContent.value = '';
      keepQuickContent.rows = 1;
    }
    if (keepQuickTags) {
      keepQuickTags.value = '';
      keepQuickTags.style.display = 'none';
    }
    if (keepQuickActions) keepQuickActions.style.display = 'none';

    renderKeepView();
    renderNotesSidebar();
    showToast('✓ Đã tạo ghi chú mới');
  });
}

renderNotesSidebar();

const lastMode = localStorage.getItem('timecypher_last_mode') || 'sandbox';
if (lastMode === 'keep') {
  toggleKeepView(true);
} else if (lastMode === 'studio') {
  document.body.classList.remove('sandbox-mode');
  const lastNoteId = localStorage.getItem('timecypher_last_note_id');
  if (lastNoteId && notesDB.find(n => n.id === lastNoteId)) {
    loadNote(lastNoteId);
  } else if (notesDB && notesDB.length > 0) {
    loadNote(notesDB[0].id);
  } else {
    createNewNote();
  }
} else {
  // Sandbox mode by default
  enterSandboxMode(true);
}

logActivity({ type: 'visit' });

// --- FULLSCREEN LOGIC ---
window.toggleFullscreen = (btn) => {
  const group = btn.closest('.input-group');
  if (!group) return;
  const backdrop = document.getElementById('fs-backdrop');
  if (group.classList.contains('fullscreen')) {
    group.classList.remove('fullscreen');
    if (backdrop) backdrop.classList.remove('active');
  } else {
    document.querySelectorAll('.fullscreen').forEach(el => el.classList.remove('fullscreen'));
    group.classList.add('fullscreen');
    if (backdrop) backdrop.classList.add('active');
    const ta = group.querySelector('textarea');
    if (ta) ta.focus();
  }
};

window.closeFullscreen = () => {
  document.querySelectorAll('.fullscreen').forEach(el => el.classList.remove('fullscreen'));
  const backdrop = document.getElementById('fs-backdrop');
  if (backdrop) backdrop.classList.remove('active');
};

// --- EASTER EGG ---
setInterval(() => {
  const now = new Date();
  const hh = now.getHours().toString().padStart(2, '0');
  const mm = now.getMinutes().toString().padStart(2, '0');
  if(hh === mm || (hh[0]===mm[1] && hh[1]===mm[0])) {
    // Hidden Easter Egg logic
  }
}, 60000);

// --- CLONE & RELATIONS LOGIC ---

// Chrome Extension: Reset Tooltip
document.getElementById('btn-reset-tooltip')?.addEventListener('click', () => {
  if (window.chrome && chrome.storage && chrome.storage.local) {
    chrome.storage.local.set({ disabledDomains: [], globalDisable: false }, () => {
      alert('Ðã khôi ph?c Tooltip trên t?t c? các trang web!');
    });
  } else {
    cyberAlert('Tính năng này chỉ hoạt động khi chạy dưới dạng Chrome Extension.');
  }
});

// --- CLONE & RELATIONS LOGIC ---
var btnCloneNote = document.getElementById('btn-clone-note');
if (btnCloneNote) {
  btnCloneNote.addEventListener('click', () => {
    if (!currentNoteId || currentNoteId === 'playground') return;
    const base60Data = txtCompressed ? txtCompressed.value.replace(/[\n\r]/g, '').trim() : '';
    const newId = 'note_' + Date.now();
    const newNote = {
      id: newId,
      tags: [...currentNoteTags],
      counters: { ...currentNoteCounters },
      relations: JSON.parse(JSON.stringify(currentNoteRelations)),
      content: base60Data,
      isArchived: false,
      updatedAt: Date.now()
    };
    notesDB.unshift(newNote);
    localStorage.setItem('timecypher_notes', JSON.stringify(notesDB));
    loadNote(newId);
    renderNotesSidebar();
  });
}

var relationsContainer = document.getElementById('note-relations-container');
var btnAddRelation = document.getElementById('btn-add-relation');
var selTargetNote = document.getElementById('sel-target-note');
var inputRelationType = document.getElementById('relation-type-input');

function renderNoteRelations() {
  if (!relationsContainer) return;
  relationsContainer.innerHTML = '';
  currentNoteRelations.forEach((rel, index) => {
    const targetNote = notesDB.find(n => n.id === rel.targetId);
    if (!targetNote) return;
    
    const badge = document.createElement('div');
    badge.className = 'cyber-btn-small';
    badge.style.display = 'inline-flex';
    badge.style.alignItems = 'center';
    badge.style.padding = '2px 8px';
    badge.style.textTransform = 'none';
    badge.style.justifyContent = 'space-between';
    badge.style.color = '#0ff';
    badge.style.borderColor = '#0ff';
    badge.title = `Click để mở: ${getNoteDisplayLabel(targetNote, 50)}`;
    
    const textSpan = document.createElement('span');
    textSpan.style.cursor = 'pointer';
    textSpan.textContent = `🔗 ${rel.type}: ${getNoteDisplayLabel(targetNote, 22)}`;
    textSpan.onclick = () => loadNote(rel.targetId);
    
    const rmBtn = document.createElement('span');
    rmBtn.textContent = '×';
    rmBtn.style.color = '#f00';
    rmBtn.style.marginLeft = '8px';
    rmBtn.style.cursor = 'pointer';
    rmBtn.style.fontWeight = 'bold';
    rmBtn.onclick = (e) => {
      e.stopPropagation();
      currentNoteRelations.splice(index, 1);
      renderNoteRelations();
      if(saveTimeout) clearTimeout(saveTimeout);
      saveCurrentNote();
    };
    
    badge.appendChild(textSpan);
    badge.appendChild(rmBtn);
    relationsContainer.appendChild(badge);
  });
  
  if (selTargetNote) {
    const currentVal = selTargetNote.value;
    selTargetNote.innerHTML = '<option value="">-- Target Note --</option>';
    notesDB.forEach(n => {
      if(n.id !== currentNoteId && n.id !== 'playground' && !n.isArchived) {
        const opt = document.createElement('option');
        opt.value = n.id;
        opt.textContent = getNoteDisplayLabel(n, 30);
        selTargetNote.appendChild(opt);
      }
    });
    if(notesDB.find(n => n.id === currentVal && n.id !== currentNoteId && !n.isArchived)) {
      selTargetNote.value = currentVal;
    }
  }
}

if (btnAddRelation && selTargetNote && inputRelationType) {
  btnAddRelation.addEventListener('click', () => {
    const targetId = selTargetNote.value;
    const type = inputRelationType.value.trim() || 'Liên kết';
    if (targetId && !currentNoteRelations.find(r => r.targetId === targetId)) {
      currentNoteRelations.push({ targetId, type });
      renderNoteRelations();
      selTargetNote.value = '';
      if(saveTimeout) clearTimeout(saveTimeout);
      saveCurrentNote();
    }
  });
}

if (btnLinkPrev) {
  btnLinkPrev.addEventListener('click', () => {
    if (lastOpenedNoteId && lastOpenedNoteId !== currentNoteId && selTargetNote) {
      if(notesDB.find(n => n.id === lastOpenedNoteId)) {
        selTargetNote.value = lastOpenedNoteId;
      }
    }
  });
}


// --- CYBER MODAL SYSTEM ---
function removeAccents(str) {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D');
}

var modalOverlay = document.getElementById('cyber-modal');
var modalText = document.getElementById('cyber-modal-text');
var modalB60 = document.getElementById('cyber-modal-b60');
var modalTime = document.getElementById('cyber-modal-time');
var modalBtnYes = document.getElementById('cyber-modal-btn-yes');
var modalBtnNo = document.getElementById('cyber-modal-btn-no');

let currentConfirmCallback = null;

function showCyberModal(msg, isConfirm, callback) {
  if (!modalOverlay) return;
  const interactiveContainer = document.getElementById('cyber-modal-interactive-b60');
  const viTextEl = document.getElementById('cyber-modal-vi-text');
  const headerEl = document.getElementById('cyber-modal-header');

  if (headerEl) {
    headerEl.innerHTML = isConfirm ? '[ ⚠️ XÁC NHẬN HÀNH ĐỘNG ]' : '[ ⚡ THÔNG BÁO HỆ THỐNG ]';
    headerEl.style.color = isConfirm ? '#ffaa00' : '#00ffcc';
  }

  if (viTextEl) {
    viTextEl.textContent = msg;
  }

  if (interactiveContainer) {
    interactiveContainer.innerHTML = '';
    const tokens = msg.split(TOKEN_REGEX);
    
    tokens.forEach(token => {
      if (!token) return;
      if (token.match(/^[a-zA-Z0-9_\u00C0-\u024F\u1E00-\u1EFF]+$/)) {
        const tc = encodeWord(token);
        const b60 = timeToBase60(tc);
        
        const span = document.createElement('span');
        span.className = 'interactive-b60-word';
        span.textContent = b60;
        span.dataset.text = removeAccents(token);
        span.dataset.time = tc;
        span.title = `${token} [${tc}]`;
        
        span.addEventListener('click', (e) => {
          e.stopPropagation();
          showTooltip(e.target);
        });
        interactiveContainer.appendChild(span);
      } else {
        if (token.length > 0) {
          interactiveContainer.appendChild(document.createTextNode(token));
        }
      }
    });
  }

  if (isConfirm) {
    if (modalBtnNo) {
      modalBtnNo.style.display = 'inline-block';
      modalBtnNo.textContent = '[ ✕ HỦY ]';
      modalBtnNo.style.borderColor = '#ff5555';
      modalBtnNo.style.color = '#ff5555';
    }
    if (modalBtnYes) {
      modalBtnYes.textContent = '[ 🗑️ XÓA ]';
      modalBtnYes.style.background = '#ff3333';
      modalBtnYes.style.borderColor = '#ff3333';
      modalBtnYes.style.color = '#ffffff';
      modalBtnYes.style.boxShadow = '0 0 12px rgba(255, 51, 51, 0.4)';
    }
    currentConfirmCallback = callback;
  } else {
    if (modalBtnNo) modalBtnNo.style.display = 'none';
    if (modalBtnYes) {
      modalBtnYes.textContent = '[ ✓ ĐÃ HIỂU ]';
      modalBtnYes.style.background = '#00ff66';
      modalBtnYes.style.borderColor = '#00ff66';
      modalBtnYes.style.color = '#000000';
      modalBtnYes.style.boxShadow = '0 0 10px rgba(0, 255, 102, 0.4)';
    }
    currentConfirmCallback = null;
  }
  
  modalOverlay.style.display = 'flex';
}

if (modalBtnNo) {
  modalBtnNo.addEventListener('click', () => {
    modalOverlay.style.display = 'none';
  });
}

if (modalBtnYes) {
  modalBtnYes.addEventListener('click', () => {
    modalOverlay.style.display = 'none';
    if (currentConfirmCallback) currentConfirmCallback();
  });
}

function cyberAlert(msg) {
  showCyberModal(msg, false);
}

function cyberConfirm(msg, callback) {
  showCyberModal(msg, true, callback);
}

function showTooltip(target) {
  let tooltip = document.getElementById('cyber-modal-word-tooltip');
  if (!tooltip) return;
  
  const rect = target.getBoundingClientRect();
  tooltip.innerHTML = `<span class="tooltip-time">${target.dataset.time}</span>|<span class="tooltip-text"> ${target.dataset.text}</span>`;
  tooltip.style.display = 'block';
  tooltip.style.left = (rect.left + rect.width/2) + 'px';
  tooltip.style.top = (rect.top - 5) + 'px'; // slightly above
}

// Close tooltip when clicking anywhere
document.addEventListener('click', (e) => {
  const tooltip = document.getElementById('cyber-modal-word-tooltip');
  if (tooltip && e.target.className !== 'interactive-b60-word') {
    tooltip.style.display = 'none';
  }
});


// --- PROMPT DROPDOWN LOGIC ---
const selPrompt = document.getElementById('sel-create-prompt');
if (selPrompt) {
  selPrompt.addEventListener('change', (e) => {
    if (e.target.value === 'square_quote') {
      const compressed = txtCompressed.value;
      if (!compressed || !compressed.trim()) {
        cyberAlert("Không có dữ liệu Base60 để xuất Prompt!");
        selPrompt.value = '';
        return;
      }
      
      const origText = txtDecrypted.value;
      if (!origText.trim()) {
        cyberAlert("Không có dữ liệu để xuất Prompt!");
        selPrompt.value = '';
        return;
      }
      
      const origWords = origText.replace(/[.,!?()[\]{}"']/g, ' ').split(/\s+/).filter(w => w.length > 0);
      let annotations = [];
      let base60Text = [];
      
      origWords.forEach(w => {
        if (w.match(/^[a-zA-Z0-9_\u00C0-\u024F\u1E00-\u1EFF]+$/)) {
          const tc = encodeWord(w);
          const b60 = timeToBase60(tc);
          base60Text.push(b60);
          annotations.push(`- ${b60} (Code: ${tc}, Meaning: ${removeAccents(w)})`);
        } else {
          base60Text.push(w);
        }
      });
      
      const promptText = `Create a visually stunning image with a beautiful, cinematic cyberpunk background. In the center, design a stylish square-shaped text block (a "square quote"). The main text is a futuristic compressed language. Under each word of the compressed language, display its numeric code and its original meaning as a smaller annotation.

Here is the data to display:
Main Compressed Text: ${base60Text.join(' ')}

Annotations to place under each word:
${annotations.join('\n')}

The typography should be modern, glowing, and highly legible. The design should look like a futuristic cipher being decoded.`;

      navigator.clipboard.writeText(promptText).then(() => {
        cyberAlert("Đã chép Prompt vào Clipboard thành công!");
      }).catch(err => {
        console.error("Lỗi copy clipboard:", err);
        cyberAlert("Không thể copy vào Clipboard!");
      });
    }
    // Reset
    selPrompt.value = '';
  });
}


// --- DICTIONARY LOOKUP LOGIC ---
const btnSearchDict = document.getElementById('btn-search-dict');
const lookupModal = document.getElementById('lookup-modal');
const closeLookup = document.getElementById('close-lookup');
const lookupInput = document.getElementById('lookup-input');
const lookupResults = document.getElementById('lookup-results');

if (btnSearchDict) {
  btnSearchDict.addEventListener('click', () => {
    lookupModal.style.display = 'block';
    lookupInput.focus();
  });
}

if (closeLookup) {
  closeLookup.addEventListener('click', () => {
    lookupModal.style.display = 'none';
  });
}

if (lookupInput) {
  lookupInput.addEventListener('input', () => {
    let rawWord = lookupInput.value.trim();
    if (!rawWord) {
      lookupResults.innerHTML = '';
      return;
    }
    
    let word = rawWord.toLowerCase();
    
    // Smart detection & Variants
    let codeVariants = [];
    if (/^[a-zA-Z0-9]{1,3}$/.test(rawWord)) {
      function getCaseVariants(str) {
        if (!str) return [''];
        let first = str[0];
        let rest = getCaseVariants(str.slice(1));
        let variants = [];
        rest.forEach(r => {
          variants.push(first.toLowerCase() + r);
          variants.push(first.toUpperCase() + r);
        });
        return [...new Set(variants)];
      }
      let allVariants = getCaseVariants(rawWord);
      allVariants.forEach(v => {
        let n = base60ToTime(v);
        if (/^\d{2,6}$/.test(n)) {
          let dec = decodeWord(n);
          if (!dec.startsWith('[ERR') && !dec.startsWith('[EN-')) {
             codeVariants.push({ code: v, word: dec });
          }
        }
      });
    }

    if (/^\d{2,6}$/.test(rawWord)) {
      let decodedWord = decodeWord(rawWord);
      if (!decodedWord.startsWith('[ERR') && !decodedWord.startsWith('[EN-')) {
        word = decodedWord.toLowerCase();
      }
    } else if (/^[a-zA-Z0-9]{1,3}$/.test(rawWord)) {
      let num = base60ToTime(rawWord);
      if (/^\d{2,6}$/.test(num)) {
        let possibleWord = decodeWord(num);
        if (!possibleWord.startsWith('[ERR') && !possibleWord.startsWith('[EN-')) {
          // Confirm it matches the exact encoding
          let testNum = encodeWord(possibleWord, false);
          let testBase60 = timeToBase60(testNum);
          let testNumOld = encodeWord(possibleWord, true);
          let testBase60Old = timeToBase60(testNumOld);
          if (rawWord === testBase60 || rawWord === testBase60Old) {
             word = possibleWord.toLowerCase();
          }
        }
      }
    }
    
    // Evaluate word
    let type = 'Từ thường';
    let exceptionArray = null;
    let exceptionIndex = -1;
    
    if (SHORT_WORDS.includes(word)) {
      type = 'Từ siêu ngắn (Ngoại lệ)';
      exceptionArray = SHORT_WORDS;
      exceptionIndex = SHORT_WORDS.indexOf(word);
    } else if (TWO_DIGIT_WORDS.includes(word)) {
      type = 'Từ 2 số (Ngoại lệ)';
      exceptionArray = TWO_DIGIT_WORDS;
      exceptionIndex = TWO_DIGIT_WORDS.indexOf(word);
    } else if (ENGLISH_DICT.includes(word)) {
      type = 'Từ Tiếng Anh';
      exceptionArray = ENGLISH_DICT;
      exceptionIndex = ENGLISH_DICT.indexOf(word);
    } else if (SHORTCUT_WORDS.includes(word)) {
      type = 'Phím tắt (Ngoại lệ)';
      exceptionArray = SHORTCUT_WORDS;
      exceptionIndex = SHORTCUT_WORDS.indexOf(word);
    }
    
    const oldNumeric = encodeWord(word, true);
    const oldBase60 = timeToBase60(oldNumeric);
    
    const newNumeric = encodeWord(word, false);
    const newBase60 = timeToBase60(newNumeric);
    
    const isInvalid = newNumeric.startsWith('"') || newNumeric.startsWith('[');
    if (isInvalid) {
       type = 'Không tồn tại';
    }
    
    let html = `
      <div style="font-size: 28px; color: ${isInvalid ? '#f00' : 'var(--neon-green)'}; text-align: center; margin-bottom: 5px; font-weight: bold; text-transform: uppercase;">
        ${word}
      </div>
      <div style="margin-bottom: 10px; text-align: center;">
        <span style="color: #fff;">Trạng thái:</span> <strong style="color: ${isInvalid ? '#f00' : (type === 'Từ thường' ? '#aaa' : '#ff0')}">${type}</strong>
      </div>
    `;
    
    if (!isInvalid) {
      if (oldNumeric === newNumeric) {
        html += `
          <div style="border: 1px solid var(--neon-green); padding: 10px; margin-bottom: 20px; max-width: 400px; margin-left: auto; margin-right: auto;">
            <div style="color: var(--neon-green); font-size: 12px; margin-bottom: 5px; text-align: center;">MÃ TỪ ĐIỂN</div>
            <div style="text-align: center;">Mã số: <strong>${newNumeric}</strong></div>
            <div style="text-align: center;">Mã nén: <strong style="color: #0f0;">${newBase60}</strong> (${newBase60.length} ký tự)</div>
          </div>
        `;
      } else {
        html += `
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px;">
            <div style="border: 1px solid #444; padding: 10px;">
              <div style="color: #888; font-size: 12px; margin-bottom: 5px;">MÃ THEO QUY LUẬT CŨ</div>
              <div>Mã số: <strong>${oldNumeric}</strong></div>
              <div>Mã nén: <strong style="color: #f00;">${oldBase60}</strong> (${oldBase60.length} ký tự)</div>
            </div>
            <div style="border: 1px solid var(--neon-green); padding: 10px;">
              <div style="color: var(--neon-green); font-size: 12px; margin-bottom: 5px;">MÃ ÁP DỤNG HIỆN TẠI</div>
              <div>Mã số: <strong>${newNumeric}</strong></div>
              <div>Mã nén: <strong style="color: #0f0;">${newBase60}</strong> (${newBase60.length} ký tự)</div>
            </div>
          </div>
        `;
      }
    }

    
    if (codeVariants.length > 0) {
      // Sort variants: REAL words first, then others
      codeVariants.sort((a, b) => {
         const aValid = REAL_VIETNAMESE_WORDS.includes(a.word) || SHORT_WORDS.includes(a.word) || TWO_DIGIT_WORDS.includes(a.word) || ENGLISH_DICT.includes(a.word);
         const bValid = REAL_VIETNAMESE_WORDS.includes(b.word) || SHORT_WORDS.includes(b.word) || TWO_DIGIT_WORDS.includes(b.word) || ENGLISH_DICT.includes(b.word);
         if (aValid && !bValid) return -1;
         if (!aValid && bValid) return 1;
         return 0;
      });

      html += `
        <div style="border-top: 1px solid #333; padding-top: 10px; margin-bottom: 10px;">
          <div style="color: #888; margin-bottom: 10px;">CÁC BIẾN THỂ TỪ MÃ NÉN:</div>
          <div style="display: flex; flex-wrap: wrap; gap: 5px;">
      `;
      codeVariants.forEach(cv => {
        const isTarget = (cv.word.toLowerCase() === word);
        const isValid = REAL_VIETNAMESE_WORDS.includes(cv.word) || SHORT_WORDS.includes(cv.word) || TWO_DIGIT_WORDS.includes(cv.word) || ENGLISH_DICT.includes(cv.word);
        
        // Emphasize real words, fade out fake phonetic words
        const bgColor = isTarget ? '#ff0' : 'transparent';
        const borderColor = isTarget ? '#ff0' : (isValid ? '#0f0' : '#444');
        const textColor = isTarget ? '#000' : (isValid ? '#0f0' : '#888');
        const opacity = isValid ? '1' : '0.5';
        const fontWeight = isValid ? 'bold' : 'normal';

        html += `<span class="neighbor-word" data-word="${cv.code}" style="padding: 3px 8px; border: 1px solid ${borderColor}; color: ${textColor}; background: ${bgColor}; cursor: pointer; opacity: ${opacity}; font-weight: ${fontWeight};">${cv.code} <small style="color: ${isTarget ? '#000' : '#888'}; font-weight: normal;">(${cv.word})</small>${isValid && !isTarget ? ' ✓' : ''}</span>`;
      });
      html += `</div></div>`;
    }
    
    if (exceptionArray && exceptionIndex !== -1 && !isInvalid) {
      const start = Math.max(0, exceptionIndex - 5);
      const end = Math.min(exceptionArray.length, exceptionIndex + 6);
      const neighbors = exceptionArray.slice(start, end);
      
      html += `
        <div style="border-top: 1px solid #333; padding-top: 10px;">
          <div style="color: #888; margin-bottom: 10px;">CÁC TỪ LÂN CẬN TRONG TỪ ĐIỂN:</div>
          <div style="display: flex; flex-wrap: wrap; gap: 5px;">
      `;
      
      neighbors.forEach(n => {
        if (!n) return;
        const isTarget = (n === word);
        html += `<span class="neighbor-word" data-word="${n}" style="padding: 3px 8px; border: 1px solid ${isTarget ? 'var(--neon-green)' : '#444'}; color: ${isTarget ? '#fff' : '#888'}; background: ${isTarget ? '#003300' : 'transparent'}; cursor: pointer;">${n}</span>`;
      });
      
      html += `</div></div>`;
    }
    
    lookupResults.innerHTML = html;
    
    lookupResults.querySelectorAll('.neighbor-word').forEach(span => {
      span.addEventListener('click', () => {
        lookupInput.value = span.dataset.word;
        lookupInput.dispatchEvent(new Event('input'));
      });
    });
  });
}

document.getElementById('btn-exit-sandbox')?.addEventListener('click', () => {
  document.body.classList.remove('sandbox-mode');
});

document.getElementById('btn-copy-debug')?.addEventListener('click', (e) => {
  const log = document.getElementById('sandbox-debug-log');
  if (log && log.value) {
    try {
      log.select();
      document.execCommand('copy');
      
      const btn = e.target;
      const originalText = btn.textContent;
      btn.textContent = 'COPIED!';
      btn.style.color = '#fff';
      setTimeout(() => {
        btn.textContent = originalText;
        btn.style.color = '#f0f';
      }, 2000);
      
      // Clear selection
      window.getSelection().removeAllRanges();
    } catch(err) {
      console.error('Copy failed:', err);
    }
  }
});

document.addEventListener('keydown', (e) => {
  // Alt + C to copy debug log
  if (e.altKey && (e.key === 'c' || e.key === 'C')) {
    e.preventDefault();
    document.getElementById('btn-copy-debug')?.click();
  }
});

document.getElementById('btn-sandbox-clear')?.addEventListener('click', () => {
  if (typeof txtDecrypted !== 'undefined' && txtDecrypted) {
    txtDecrypted.value = '';
    txtDecrypted.dispatchEvent(new Event('input')); // Đồng bộ xóa toàn bộ
    txtDecrypted.focus();
  }
});


document.addEventListener('keydown', (e) => {
  if (document.body.classList.contains('sandbox-mode')) {
    if (e.key === 'Escape') {
      e.preventDefault();
      document.getElementById('btn-exit-sandbox')?.click();
    } else if (e.key === 'Delete') {
      e.preventDefault();
      document.getElementById('btn-sandbox-clear')?.click();
    }
  }
});

function copyBase60ToClipboard() {
  const b60Val = txtCompressed?.value?.trim();
  if (!b60Val) return;
  navigator.clipboard.writeText(b60Val).then(() => {
    const btn = document.getElementById('btn-copy-b60');
    if (!btn) return;
    const spans = btn.querySelectorAll('span');
    if (spans.length >= 2) {
      const origTop = spans[0].textContent;
      const origBot = spans[1].textContent;
      spans[0].textContent = '[✓]';
      spans[1].textContent = 'COPIED';
      btn.style.color = '#ff0';
      btn.style.borderColor = '#ff0';
      setTimeout(() => {
        spans[0].textContent = origTop;
        spans[1].textContent = origBot;
        btn.style.color = '#0f0';
        btn.style.borderColor = '#0f0';
      }, 1500);
    }
  });
}

document.getElementById('btn-copy-b60')?.addEventListener('click', copyBase60ToClipboard);

// ===== 👁️ VIEW OPTIONS (DROPDOWN & 3 TOGGLES) =====
let isToolbarEnabled = localStorage.getItem('pref_view_toolbar') !== 'false';
let isTutorPrefVisible = localStorage.getItem('pref_view_tutor') !== 'false';
let isVkPrefVisible = localStorage.getItem('pref_view_vk') === 'true';

const btnViewOptions = document.getElementById('btn-view-options');
const viewOptionsMenu = document.getElementById('view-options-menu');
const btnToolsMenu = document.getElementById('btn-tools-menu');
const toolsDropdownMenu = document.getElementById('tools-dropdown-menu');
const chkViewVk = document.getElementById('chk-view-vk');
const chkViewTutor = document.getElementById('chk-view-tutor');
const chkViewToolbar = document.getElementById('chk-view-toolbar');

if (btnViewOptions && viewOptionsMenu) {
  btnViewOptions.addEventListener('click', (e) => {
    e.stopPropagation();
    const isHidden = viewOptionsMenu.style.display === 'none' || !viewOptionsMenu.style.display;
    viewOptionsMenu.style.display = isHidden ? 'flex' : 'none';
    btnViewOptions.style.background = isHidden ? 'rgba(0, 255, 204, 0.2)' : '#000';
    if (toolsDropdownMenu) toolsDropdownMenu.style.display = 'none';
    if (btnToolsMenu) btnToolsMenu.style.background = '#000';
  });

  document.addEventListener('click', (e) => {
    if (!viewOptionsMenu.contains(e.target) && e.target !== btnViewOptions) {
      viewOptionsMenu.style.display = 'none';
      btnViewOptions.style.background = '#000';
    }
  });
}

if (btnToolsMenu && toolsDropdownMenu) {
  btnToolsMenu.addEventListener('click', (e) => {
    e.stopPropagation();
    const isHidden = toolsDropdownMenu.style.display === 'none' || !toolsDropdownMenu.style.display;
    toolsDropdownMenu.style.display = isHidden ? 'flex' : 'none';
    btnToolsMenu.style.background = isHidden ? 'rgba(255, 170, 0, 0.2)' : '#000';
    if (viewOptionsMenu) viewOptionsMenu.style.display = 'none';
    if (btnViewOptions) btnViewOptions.style.background = '#000';
  });

  document.addEventListener('click', (e) => {
    if (!toolsDropdownMenu.contains(e.target) && e.target !== btnToolsMenu) {
      toolsDropdownMenu.style.display = 'none';
      btnToolsMenu.style.background = '#000';
    }
  });
}

// 1. Toggle Virtual Keyboard
if (chkViewVk) {
  chkViewVk.checked = isVkPrefVisible;
  chkViewVk.addEventListener('change', () => {
    const show = chkViewVk.checked;
    localStorage.setItem('pref_view_vk', show ? 'true' : 'false');
    if (window.snk) {
      window.snk.isDisabled = !show;
      if (show) {
        const active = document.activeElement;
        if (active && (active === txtDecrypted || active === txtEncrypted || active === txtCompressed)) {
          window.snk.activeTarget = active;
          window.snk.show();
        }
      } else {
        if (window.snk.hide) window.snk.hide();
      }
    }
  });
}

// 2. Toggle Tutor (Trợ Giảng)
if (chkViewTutor) {
  chkViewTutor.checked = isTutorPrefVisible;
  chkViewTutor.addEventListener('change', () => {
    const show = chkViewTutor.checked;
    localStorage.setItem('pref_view_tutor', show ? 'true' : 'false');
    if (typeof window.setMnemonicTutorVisible === 'function') {
      window.setMnemonicTutorVisible(show);
    }
  });
}

// 3. Toggle Floating Context Toolbar (Thanh Copy nổi)
if (chkViewToolbar) {
  chkViewToolbar.checked = isToolbarEnabled;
  chkViewToolbar.addEventListener('change', () => {
    isToolbarEnabled = chkViewToolbar.checked;
    localStorage.setItem('pref_view_toolbar', isToolbarEnabled ? 'true' : 'false');
    if (!isToolbarEnabled && typeof hideContextMenu === 'function') {
      hideContextMenu();
    }
  });
}

// 4. Toggle Case Support (Chữ Hoa o/O)
const chkViewCase = document.getElementById('chk-view-case');
if (chkViewCase) {
  chkViewCase.checked = isCaseSupportEnabled;
  chkViewCase.addEventListener('change', () => {
    isCaseSupportEnabled = chkViewCase.checked;
    localStorage.setItem('pref_view_case', isCaseSupportEnabled ? 'true' : 'false');
    if (txtDecrypted && txtDecrypted.value.trim()) {
      syncFromDecrypted();
    } else if (txtCompressed && txtCompressed.value.trim()) {
      syncFromCompressed();
    }
  });
}

// ===== 🔗 SHARE LINK =====
document.getElementById('btn-share-link')?.addEventListener('click', () => {
  const b60Val = txtCompressed?.value?.trim();
  if (!b60Val) { if (typeof cyberAlert === 'function') cyberAlert('Chưa có mã Base60 để chia sẻ!'); return; }
  const encoded = b60Val.replace(/\n/g, '-').replace(/ /g, '');
  const url = `${location.origin}${location.pathname}#${encoded}`;
  const btn = document.getElementById('btn-share-link');
  const copyFn = (text) => {
    const fallback = () => { const ta=document.createElement('textarea'); ta.value=text; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta); };
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(text).catch(fallback);
    else fallback();
  };
  copyFn(url);
  if (btn) {
    const orig = btn.innerHTML;
    btn.innerHTML = '✔'; btn.style.color = '#ff0'; btn.style.borderColor = '#ff0';
    setTimeout(() => { btn.innerHTML = orig; btn.style.color = ''; btn.style.borderColor = ''; }, 1500);
  }
});

// ===== 📊 ACTIVITY LOG TOGGLE =====
document.getElementById('btn-activity-log')?.addEventListener('click', () => {
  const panel = document.getElementById('activity-log-panel');
  if (!panel) return;
  if (panel.style.display === 'none' || !panel.style.display) {
    panel.style.display = 'flex'; renderActivityLog();
  } else {
    panel.style.display = 'none';
  }
});
document.getElementById('btn-close-activity-log')?.addEventListener('click', () => {
  const panel = document.getElementById('activity-log-panel');
  if (panel) panel.style.display = 'none';
});

// ===== ✨ PROMPT MACHINE =====
const PM_TOOLS = [
  { id: 'mj',       label: 'Midjourney', emoji: '🎨', color: '#58a6ff' },
  { id: 'flux',     label: 'Flux',       emoji: '⚡', color: '#a78bfa' },
  { id: 'dalle',    label: 'ChatGPT',    emoji: '🤖', color: '#00ff66' },
  { id: 'gemini',   label: 'Gemini',     emoji: '♊', color: '#4dd0e1' },
  { id: 'ideogram', label: 'Ideogram',   emoji: '💡', color: '#fbbf24' },
  { id: 'firefly',  label: 'Firefly',    emoji: '🔥', color: '#fb923c' },
  { id: 'sd',       label: 'Stable Diff',emoji: '🖥️', color: '#e879f9' },
  { id: 'bing',     label: 'Bing',       emoji: '🔍', color: '#38bdf8' },
];

const PM_STYLES = [
  { id: 'vn_romance',label: 'Tình Yêu VN (30 & 20)', emoji: '👩‍❤️‍👨' },
  { id: 'romantic', label: 'Ngôn tình',   emoji: '💕' },
  { id: 'scifi',    label: 'Viễn tưởng',  emoji: '🚀' },
  { id: 'cyberpunk',label: 'Cyberpunk',   emoji: '⚡' },
  { id: 'hologram', label: 'Hologram',    emoji: '🔮' },
  { id: 'anime',    label: 'Anime',       emoji: '🌸' },
  { id: 'fantasy',  label: 'Dark Fantasy',emoji: '🧙' },
  { id: 'luxury',   label: 'Sang trọng',  emoji: '💎' },
  { id: 'vintage',  label: 'Cổ điển',     emoji: '🏛️' },
  { id: 'lofi',     label: 'Lofi',        emoji: '🌊' },
  { id: 'sexy',     label: 'Gợi cảm',     emoji: '🔞' },
  { id: 'nature',   label: 'Thiên nhiên', emoji: '🌿' },
  { id: 'pixel',    label: 'Pixel Art',   emoji: '👾' },
  { id: 'gothic',   label: 'Gothic',      emoji: '🎭' },
  { id: 'popart',   label: 'Pop Art',     emoji: '☀️' },
];

const PM_RATIOS = [
  { id: '1:1',   label: '1:1',   emoji: '⬛', hint: 'Vuông',        sdSize: '1024×1024' },
  { id: '9:16',  label: '9:16',  emoji: '📱', hint: 'Story/Dọc',    sdSize: '768×1344'  },
  { id: '16:9',  label: '16:9',  emoji: '🖥️', hint: 'Ngang rộng',  sdSize: '1344×768'  },
  { id: '4:3',   label: '4:3',   emoji: '🖼️', hint: 'Ngang vừa',   sdSize: '1152×864'  },
  { id: '3:4',   label: '3:4',   emoji: '📄', hint: 'Dọc vừa',     sdSize: '864×1152'  },
  { id: '21:9',  label: '21:9',  emoji: '🎬', hint: 'Cinematic',    sdSize: '1536×656'  },
  { id: '3:2',   label: '3:2',   emoji: '📷', hint: 'Ảnh ngang',   sdSize: '1216×832'  },
  { id: '2:3',   label: '2:3',   emoji: '📐', hint: 'Ảnh dọc',     sdSize: '832×1216'  },
];

let pm_selectedTool = 'gemini';
let pm_selectedStyle = 'vn_romance';
let pm_selectedRatio = '1:1';
let pm_selectedBlocksPerRow = 0;

function pm_buildPrompt(tool, style, ratio, blocksPerRow) {
  ratio = ratio || pm_selectedRatio || '1:1';
  blocksPerRow = blocksPerRow !== undefined ? blocksPerRow : pm_selectedBlocksPerRow;
  const b60Code = (txtCompressed && txtCompressed.value.trim()) ? txtCompressed.value.trim() : '???';
  const ratioData = PM_RATIOS.find(r => r.id === ratio) || PM_RATIOS[0];
  
  let layoutInstruction = 'keep the same count and layout as the reference';
  if (blocksPerRow > 0) {
    layoutInstruction = `arrange the cipher blocks neatly in rows, with exactly ${blocksPerRow} blocks per row`;
  }

  const CIPHER_CORE = `CRITICAL INSTRUCTION FOR GLYPH REPLICATION:
1. STRICT 1:1 GLYPH FIDELITY: Closely copy every single cipher glyph block from the attached reference screenshot. Each block is a precise 2×2 square matrix containing 4 specific quadrant characters (top-left, top-right, bottom-left, bottom-right).
2. ANTI-HALLUCINATION: Do NOT replace or abstract any letters, digits, or symbols into random decorative slashes, asterisks, or "%" percentage marks. Every stroke (letters, numbers, ⊘, /, \\, =, dots, arcs, and enclosing boundary boxes) must be drawn with extreme precision matching the reference image.
3. SINGLE INSTANCE (NO DUPLICATION): Render EXACTLY ONE single instance of this text sequence. Do NOT duplicate, stack, repeat, or draw a second copy of these blocks anywhere in the image.
4. NO HUMAN LANGUAGE: Do NOT render readable Vietnamese or standard prose. Only render these exact geometric cipher blocks.
5. LAYOUT: Reproduce ALL cipher blocks visible in the reference image — ${layoutInstruction}. Position this single set cleanly in the center or lower-center foreground. (Reference string: "${b60Code}")`;

  const STYLES = {
    vn_romance:`[COMPOSITION: Background = Romantic Scene, Foreground Overlay = Exact Cipher Blocks]
A deeply romantic, cinematic, and emotional scene featuring an attractive, stylish 30-year-old Vietnamese man and a gorgeous, radiant 20-year-old Vietnamese woman sharing an intimate, tender romantic moment (gentle eye contact, warm embrace). Atmospheric golden hour backlight, soft warm bokeh on a rooftop or balcony, dreamy cinematic depth of field.
OVERLAY: Superimpose EXACTLY ONE SINGLE ROW of the cipher glyph blocks from the reference screenshot across the lower foreground in crisp, razor-sharp glowing warm gold neon with clean vector edges. Do not repeat or duplicate the row. Do not distort, blur, or stylize the anatomy of the glyphs — every quadrant symbol must match the screenshot 100% legibly and accurately. Photorealistic, authentic modern Vietnamese beauty, highly detailed, 8k resolution.`,
    scifi:    `Pure black OLED background (#050d0a). Cipher glyphs as glowing electric cyan (#58a6ff) and emerald green (#00ff66) neon vector shapes. Subtle sci-fi HUD grid lines overlay. Strong neon bloom glow effect. Minimalist space technology aesthetic. Hyper-detailed, 8k resolution.`,
    cyberpunk:`Rain-slicked neon-drenched cyberpunk alley background. Cipher glyphs in harsh magenta and cyan neon with wet street reflections. Flickering glitch artifacts. Dystopian Blade Runner noir atmosphere. Dark, gritty, cinematic.`,
    hologram: `Dark void space background. Cipher glyphs rendered as shimmering iridescent holographic light projections floating in mid-air. Prismatic rainbow diffraction halos. Transparent glassmorphic panel effect. Futuristic AR/VR interface aesthetic.`,
    romantic: `Dreamy soft-focus bokeh background in rose gold and sakura pink gradient tones. Cipher glyphs as warm luminescent gold and blush pink light sigils. Delicate falling cherry blossom petals. Gentle watercolor wash texture. Sweet romance novel cover aesthetic.`,
    anime:    `Clean cel-shaded anime illustration style. Vivid saturated colors on gradient sky background. Cipher glyphs as sharp black ink outlines with vivid flat color fills. Dynamic manga speed-line effects. J-pop album cover aesthetic.`,
    fantasy:  `Ancient mossy stone dungeon wall background. Cipher glyphs glowing with ethereal blue-purple arcane magical fire and mystical energy spirals. Floating mystical rune inscriptions. Moonlit gothic cathedral atmosphere. Dark fantasy spellbook page aesthetic.`,
    luxury:   `Polished jet-black marble with brushed 24k gold leaf vein background. Cipher glyphs as premium engraved gold relief embossing. Champagne, platinum and obsidian color palette. Minimalist luxury high-fashion editorial aesthetic.`,
    vintage:  `Aged cream parchment or dark mahogany wood texture background. Cipher glyphs as deep letterpress copper plate etchings. Sepia and rich amber tones. Art Deco geometric ornamental borders and embellishments. 1920s typographic grand poster aesthetic.`,
    lofi:     `Soft muted pastel gradient background (lavender, peach, sage mint). Cipher glyphs in gentle warm tones. Cozy film grain and light leak texture overlay. Lo-fi chill beats album artwork aesthetic. Vaporwave sunset color palette.`,
    sexy:     `Dramatic single spotlight against deep black studio background. Cipher glyphs as sleek polished chrome or liquid mercury metallic forms. Chiaroscuro shadow play. Crimson red and obsidian black color palette. Sultry high-fashion lingerie editorial aesthetic. Mysterious and seductive.`,
    nature:   `Lush emerald tropical rainforest canopy background with golden-hour dappled light. Cipher glyphs as intricate bioluminescent leaf-vein patterns and glowing moss script. Deep green, amber, and violet organic palette. National Geographic fine art nature photography aesthetic.`,
    pixel:    `Retro 8-bit pixel art style on a dark grid background. Cipher glyphs as chunky blocky pixel characters with 4-color NES dithering. Bright GameBoy green or vibrant NES color palette. Retro video game title screen aesthetic.`,
    gothic:   `Victorian gothic graveyard night background with black roses, crumbling stone, spider webs and dripping candle wax. Cipher glyphs as bone-white tombstone epitaph engravings in bas-relief. Deep black and dark crimson blood palette. Tim Burton meets Edgar Allan Poe aesthetic.`,
    popart:   `Bold flat-color blocked background in primary colors (bright yellow, red, cobalt blue). Cipher glyphs as thick black Lichtenstein-style comic book halftone outlines with solid flat color fills. Roy Lichtenstein Pop Art silkscreen print aesthetic. High contrast, energetic, bold.`,
  };

  // Chỉ các tham số THỰC SỰ đưa vào prompt (được copy)
  const TOOL_PROMPT_PARAMS = {
    mj:       `\n\n--ar ${ratio} --style raw --v 6.1 --q 2 --no text, words, letters, vietnamese, latin`,
    flux:     `\n\nAspect ratio: ${ratio}.\nNegative prompt: text, words, letters, vietnamese text, latin alphabet, readable characters, typography, watermark`,
    dalle:    `\n\nOutput format: ${ratio} aspect ratio (${ratioData.hint}).`,
    gemini:   `\n\nOutput image aspect ratio: ${ratio} (${ratioData.hint}).`,
    ideogram: `\n\nAspect ratio: ${ratio}.\nNegative prompt: text, words, vietnamese, latin, readable letters, typography, watermark`,
    firefly:  `\n\nOutput aspect ratio: ${ratio} (${ratioData.hint}).`,
    sd:       `\n\nNegative prompt: (text:1.6), (words:1.5), (letters:1.5), (vietnamese:1.6), (latin:1.5), (readable:1.5), watermark, signature, blurry\nSteps: 30, CFG Scale: 7, Sampler: DPM++ 2M Karras, Size: ${ratioData.sdSize}`,
    bing:     `\n\nOutput format: ${ratio} aspect ratio (${ratioData.hint}).`,
  };


  const styleDesc = STYLES[style] || STYLES.scifi;
  const params = TOOL_PROMPT_PARAMS[tool] || '';

  return `${CIPHER_CORE}\n\nAesthetic: ${styleDesc}${params}`;

}

function pm_renderSelectors() {
  const toolEl = document.getElementById('ai-tool-selector');
  const styleEl = document.getElementById('ai-style-selector');
  const ratioEl = document.getElementById('ai-ratio-selector');
  if (!toolEl || !styleEl) return;

  const btnBase = `display:inline-flex;align-items:center;gap:4px;border-radius:20px;padding:4px 9px;font-size:11px;font-family:monospace;cursor:pointer;border:1px solid;transition:all 0.15s;white-space:nowrap;`;

  toolEl.innerHTML = PM_TOOLS.map(t => {
    const active = t.id === pm_selectedTool;
    const col = t.color;
    return `<button onclick="pm_selectTool('${t.id}')" style="${btnBase}background:${active ? col : 'transparent'};color:${active ? '#000' : col};border-color:${col};font-weight:${active ? 'bold' : 'normal'};">${t.emoji} ${t.label}</button>`;
  }).join('');

  styleEl.innerHTML = PM_STYLES.map(s => {
    const active = s.id === pm_selectedStyle;
    return `<button onclick="pm_selectStyle('${s.id}')" style="${btnBase}background:${active ? '#ff00ea' : 'transparent'};color:${active ? '#000' : '#cc88cc'};border-color:${active ? '#ff00ea' : '#441144'};font-weight:${active ? 'bold' : 'normal'};">${s.emoji} ${s.label}</button>`;
  }).join('');

  if (ratioEl) {
    ratioEl.innerHTML = PM_RATIOS.map(r => {
      const active = r.id === pm_selectedRatio;
      return `<button onclick="pm_selectRatio('${r.id}')" style="${btnBase}background:${active ? '#facc15' : 'transparent'};color:${active ? '#000' : '#a38b20'};border-color:${active ? '#facc15' : '#3a2e05'};font-weight:${active ? 'bold' : 'normal'};">${r.emoji} ${r.label} <span style="font-size:9px;opacity:0.7;">${r.hint}</span></button>`;
    }).join('');
  }
}

function pm_refreshPrompt() {
  const el = document.getElementById('ai-prompt-content');
  if (el) el.value = pm_buildPrompt(pm_selectedTool, pm_selectedStyle, pm_selectedRatio, pm_selectedBlocksPerRow);

  const hintEl = document.getElementById('ai-prompt-hint');
  if (hintEl) hintEl.textContent = PM_TOOL_HINTS[pm_selectedTool] || '';
  
  const blockRange = document.getElementById('ai-blocks-per-row');
  const blockVal = document.getElementById('ai-blocks-per-row-val');
  if (blockRange && blockVal) {
    blockRange.value = pm_selectedBlocksPerRow;
    blockVal.textContent = pm_selectedBlocksPerRow === 0 ? 'Tự động' : pm_selectedBlocksPerRow;
  }
}

window.pm_selectBlocksPerRow = function(val) {
  pm_selectedBlocksPerRow = parseInt(val, 10);
  pm_refreshPrompt();
};

window.pm_selectTool = function(id) {
  pm_selectedTool = id;
  pm_renderSelectors();
  pm_refreshPrompt();
};

window.pm_selectStyle = function(id) {
  pm_selectedStyle = id;
  pm_renderSelectors();
  pm_refreshPrompt();
};

window.pm_selectRatio = function(id) {
  pm_selectedRatio = id;
  pm_renderSelectors();
  pm_refreshPrompt();
};



const btnGenAIPrompt = document.getElementById('btn-gen-ai-prompt');
const aiPromptModal = document.getElementById('ai-prompt-modal');
const aiPromptContent = document.getElementById('ai-prompt-content');
const btnCopyAIPrompt = document.getElementById('btn-copy-ai-prompt');
const btnCloseAIPrompt = document.getElementById('btn-close-ai-prompt');
const btnCancelAIPrompt = document.getElementById('btn-cancel-ai-prompt');

if (btnGenAIPrompt && aiPromptModal) {
  btnGenAIPrompt.addEventListener('click', () => {
    if (toolsDropdownMenu) {
      toolsDropdownMenu.style.display = 'none';
      if (btnToolsMenu) btnToolsMenu.style.background = '#000';
    }
    aiPromptModal.style.display = 'flex';
    pm_renderSelectors();
    pm_refreshPrompt();
  });

  const pm_close = () => {
    aiPromptModal.style.display = 'none';
    if (btnCopyAIPrompt) {
      btnCopyAIPrompt.textContent = '📋 SAO CHÉP PROMPT';
      btnCopyAIPrompt.style.background = '#ff00ea';
      btnCopyAIPrompt.style.color = '#000';
    }
  };

  if (btnCloseAIPrompt) btnCloseAIPrompt.addEventListener('click', pm_close);
  if (btnCancelAIPrompt) btnCancelAIPrompt.addEventListener('click', pm_close);
  aiPromptModal.addEventListener('click', e => { if (e.target === aiPromptModal) pm_close(); });

  if (btnCopyAIPrompt) {
    btnCopyAIPrompt.addEventListener('click', async () => {
      const text = document.getElementById('ai-prompt-content')?.value || '';
      try {
        await navigator.clipboard.writeText(text);
      } catch {
        const ta = document.createElement('textarea');
        ta.value = text; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta);
      }
      btnCopyAIPrompt.textContent = '✓ ĐÃ SAO CHÉP!';
      btnCopyAIPrompt.style.background = '#00ff66';
      btnCopyAIPrompt.style.color = '#000';
      setTimeout(() => {
        btnCopyAIPrompt.textContent = '📋 SAO CHÉP PROMPT';
        btnCopyAIPrompt.style.background = '#ff00ea';
      }, 2000);
    });
  }
}


document.getElementById('btn-sandbox-hashtag')?.addEventListener('click', () => {
  const txt = document.getElementById('text-input');
  const txtEnc = document.getElementById('compressed-input');
  const txtTime = document.getElementById('time-input');
  if (!txt || !txtEnc || !txtTime) return;
  
  const word = txt.value.trim();
  const b60Str = txtEnc.value.trim();
  const timeCodeStr = txtTime.value.trim();
  
  if (!word) return;
  
  const wordCount = word.split(/\s+/).filter(x => x).length;
  const capWord = word.charAt(0).toUpperCase() + word.slice(1);
  const unaccented = word.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase().replace(/[^a-z0-9]/g, '');
  
  let finalStr = `${capWord} #${unaccented}ondmt ${b60Str}`;
  if (wordCount < 3) {
      finalStr += ` ${timeCodeStr}`;
  }
  
  navigator.clipboard.writeText(finalStr);
});

// ===== ⏰ SPECIAL TIME FEATURE =====
(function() {
  const LOOKAHEAD_MINUTES = 3; // Dò trước 3 phút

  function isSpecialTime(h, m) {
    const hh = String(h).padStart(2, '0');
    const mm = String(m).padStart(2, '0');

    // Lặp đôi: 07:07, 11:11, 13:13 (hh === mm)
    if (hh === mm) return { type: 'lặp', label: `${hh}:${mm}` };

    // Lặp chéo: 11:22, 11:33, 22:11 (mỗi nhóm tự có chữ số lặp đôi)
    if (hh[0] === hh[1] && mm[0] === mm[1]) return { type: 'lặp', label: `${hh}:${mm}` };

    // Đảo: 13:31, 12:21
    if (hh === mm.split('').reverse().join('')) return { type: 'đảo', label: `${hh}:${mm}` };

    // Tiến: 01:23, 12:34
    const digits = [hh[0], hh[1], mm[0], mm[1]].map(Number);
    if (digits[1] === digits[0]+1 && digits[2] === digits[0]+2 && digits[3] === digits[0]+3) return { type: 'tiến', label: `${hh}:${mm}` };

    return null;
  }

  function findNextSpecialTime() {
    const now = new Date();
    const results = [];
    for (let i = 0; i <= LOOKAHEAD_MINUTES; i++) {
      const d = new Date(now.getTime() + i * 60000);
      const h = d.getHours();
      const m = d.getMinutes();
      const info = isSpecialTime(h, m);
      if (info) {
        // Tính giây còn lại đến đầu phút đó
        const targetMs = new Date(d.getFullYear(), d.getMonth(), d.getDate(), h, m, 0, 0).getTime();
        const diffMs = targetMs - now.getTime();
        results.push({ ...info, h, m, diffMs });
      }
    }
    // Kiểm tra đã qua: phút trước
    for (let i = 1; i <= LOOKAHEAD_MINUTES; i++) {
      const d = new Date(now.getTime() - i * 60000);
      const h = d.getHours();
      const m = d.getMinutes();
      const info = isSpecialTime(h, m);
      if (info) {
        const targetMs = new Date(d.getFullYear(), d.getMonth(), d.getDate(), h, m, 59, 999).getTime();
        if (targetMs < now.getTime()) {
          results.push({ ...info, h, m, diffMs: targetMs - now.getTime(), past: true });
        }
      }
    }
    return results;
  }

  function autoFillSpecialTime(timeStr) {
    if (!txtEncrypted) return;
    txtEncrypted.value = timeStr;
    lastAutoFilledTime = timeStr;
    syncFromTime();
  }

  let lastAutoFilledTime = null;
  let specialTimeInterval = null;
  const display = document.getElementById('special-time-display');
  let currentIsPast = false; // track trạng thái để click handler biết

  if (display) {
    display.style.cursor = 'pointer';
    display.addEventListener('click', () => {
      const actionsEl = document.getElementById('top-left-actions');
      const choicesEl = document.getElementById('quiz-choices');
      
      // Đóng quiz nếu đang mở
      if (choicesEl && choicesEl.style.display !== 'none') {
        choicesEl.style.display = 'none';
        if (actionsEl) actionsEl.style.display = 'flex';
        // Force update UI lại
        const d = new Date();
        const fh = d.getHours(), fm = d.getMinutes();
        const code = String(fh).padStart(2, '0') + String(fm).padStart(2, '0');
        if (display.dataset.timecode !== code) {
           display.dataset.timecode = code;
           display.innerHTML = `<span style="font-size:11px;color:#0f0;">🤍 ${code.substring(0,2)}:${code.substring(2)}</span>`;
        }
        return;
      }

      // Xác định giờ thiêng mục tiêu
      let targetCode = display.dataset.timecode;
      const d = new Date();
      const currentCode = String(d.getHours()).padStart(2, '0') + String(d.getMinutes()).padStart(2, '0');
      
      // Nếu đang là 🤍 (trái tim) => Tính giờ thiêng gần nhất trong TƯƠNG LAI
              // Nếu đang là trái tim => Tính giờ thiêng gần nhất
        if (display.innerHTML.includes('dY ?') || !targetCode) {
           const futureTimes = Object.keys(HOLY_HOUR_CODES).sort();
           const nextTime = futureTimes.find(t => t > currentCode) || futureTimes[0];
           targetCode = nextTime;
           display.dataset.timecode = targetCode;
           display.innerHTML = `<span style="font-size:11px;color:#0f0;font-weight:bold;">dY ? ${targetCode.substring(0,2)}:${targetCode.substring(2)}=?</span>`;
        } else {
           display.innerHTML = `<span style="font-size:11px;color:#ff0;font-weight:bold;">⭐ ${targetCode.substring(0,2)}:${targetCode.substring(2)}=?</span>`;
        }
  
        // Mở quiz
        const correctFullCode = typeof HOLY_HOUR_CODES !== 'undefined' && HOLY_HOUR_CODES[targetCode] ? HOLY_HOUR_CODES[targetCode] : targetCode + '00';
      const correctB60 = timeToBase60(correctFullCode);
      const wrongB60 = generateWrongAnswers(correctB60);
      const options = [correctB60, ...wrongB60].sort(() => Math.random() - 0.5);

      if (actionsEl) actionsEl.style.display = 'none';
      if (choicesEl) {
        choicesEl.style.display = 'flex';
        choicesEl.innerHTML = options.map(opt => 
          `<button class="cyber-btn" style="background:#000;color:#0ff;border-color:#0ff;font-size:11px;padding:3px 6px;height:24px;border-radius:4px;min-width:35px;" onclick="handleTopLeftQuiz('${opt}', '${correctB60}', '${correctFullCode}', this)">${opt}</button>`
        ).join('');
      }
    });
  }

  
  const HOLY_HOUR_CODES = {
    // 1. Trục 24 giờ kép (HH == MM)
    '0000': '000005', // cạ
    '0101': '010123', // phạc
    '0202': '020205', // gạch
    '0303': '030320', // tài
    '0404': '040429', // thiệt
    '0505': '050520', // tràn
    '0606': '060627', // xỉn
    '0707': '070700', // hôn
    '0808': '080801', // vú
    '0909': '090900', // dâm
    '1010': '101001', // mút (mms)
    '1111': '111105', // chịch
    '1212': '121200', // rên
    '1313': '131301', // sướng
    '1414': '141401', // nứng
    '1515': '151501', // bướm
    '1616': '161601', // liếm
    '1717': '171700', // chim
    '1818': '181802', // sờ
    '1919': '191900', // ôm
    '2020': '202005', // ngực
    '2121': '212101', // nhấp (yys)
    '2222': '222202', // lồn
    '2323': '232305', // nghạnh

    // 2. Thế số Đảo / Gánh (Mirror)
    '0609': '060907', // khít (KDS)
    '0906': '090605', // dạng
    '1221': '122105', // rập
    '2112': '211208', // nhoài
    '1331': '133100', // săm
    '1441': '144104', // nẫu
    '0110': '011001', // đút (dms)
    '0440': '044023', // thật
    '0550': '055000', // kê

    // 3. Thế số Sảnh Tiến (Straight)
    '0123': '012317', // được
    '1234': '123407', // rớt (r3S)
    '2345': '234503', // nghẻm
    '0234': '023423', // quặp
    '0345': '034501', // ghém
    '0012': '001214', // cuồng

    // 4. Thế số Cặp Đôi (Pairs)
    '1122': '112202', // chồn
    '2211': '221101', // lích (lick)
    '1020': '102007', // móp (liên tưởng bóp)
    '2010': '201012', // nguôi
    '0816': '081608'  // vòi
  };

  function getSpecialTimeInfo(fh, fm) {
    const hh2 = String(fh).padStart(2, '0');
    const mm2 = String(fm).padStart(2, '0');
    const timeCode = `${hh2}${mm2}`;
    let decodedWord = '', b60 = '';
    try { decodedWord = decodeWord(timeCode) || ''; } catch(e) {}
    try { b60 = timeToBase60(timeCode) || ''; } catch(e) {}
    const validWord = decodedWord && !decodedWord.includes('?') && !decodedWord.startsWith('[');
    return { timeCode, decodedWord: validWord ? decodedWord : '', b60 };
  }

  function isUserTyping() {
    const val = (txtDecrypted?.value || '').trim();
    const enc = (txtEncrypted?.value || '').trim();
    if (!val && !enc) return false;
    if (lastAutoFilledTime && enc === lastAutoFilledTime) {
      return false;
    }
    return true;
  }

  // ===== QUIZ STATE =====
  const quizChoices = document.getElementById('quiz-choices');
  let quizAnswered = false;
  let currentQuizTimeCode = null;

  function generateWrongAnswers(correctB60) {
    const wrong = [];
    const holyCodes = Object.values(HOLY_HOUR_CODES);
    const shuffled = holyCodes.sort(() => Math.random() - 0.5);
    for (const c of shuffled) {
      try {
        const b = typeof timeToBase60 === 'function' ? timeToBase60(c) : '';
        if (b && b.length === 3 && b !== correctB60 && !wrong.includes(b)) {
          wrong.push(b);
          if (wrong.length >= 2) break;
        }
      } catch(e) {}
    }
    while (wrong.length < 2) wrong.push(wrong.length === 0 ? '??' : '!!');
    return wrong;
  }

  function showQuiz(timeCode, correctB60, label) {
    if (!quizChoices) return;
    if (currentQuizTimeCode === timeCode && (quizAnswered || quizChoices.style.display !== 'none')) return;
    quizAnswered = false;
    currentQuizTimeCode = timeCode;
    const wrongAnswers = generateWrongAnswers(correctB60);
    const options = [correctB60, ...wrongAnswers].sort(() => Math.random() - 0.5);
    quizChoices.innerHTML = `<span style="font-size:10px;color:#888;align-self:center;white-space:nowrap;">${label}=?</span>`;
    quizChoices.style.display = 'flex';
    quizChoices.style.alignItems = 'center';
    quizChoices.style.gap = '6px';
    options.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'cyber-btn';
      btn.textContent = opt;
      btn.style.cssText = 'padding:3px 12px;font-size:13px;font-weight:bold;cursor:pointer;border:1px solid #0f0;color:#0f0;background:#000;border-radius:4px;font-family:monospace;transition:all 0.15s;text-transform:none;';
      btn.addEventListener('pointerdown', (e) => {
        e.stopPropagation(); e.preventDefault();
        if (quizAnswered) return;
        quizAnswered = true;
        const isCorrect = opt === correctB60;
        if (typeof logActivity === 'function') logActivity({ type: 'quiz', time: timeCode, correct: isCorrect });
        
        if (typeof txtCompressed !== 'undefined' && txtCompressed) {
          txtCompressed.value = opt;
          if (typeof syncFromCompressed === 'function') syncFromCompressed();
          
          // FORCED FILL TO BE ABSOLUTELY SURE
          if (typeof txtDecrypted !== 'undefined' && txtDecrypted && txtDecrypted.value === '') {
             try {
               const decWord = typeof decodeWord === 'function' ? decodeWord(timeCode + '00') : '';
               txtDecrypted.value = decWord || timeCode;
             } catch(e){}
          }
          if (typeof txtEncrypted !== 'undefined' && txtEncrypted && txtEncrypted.value === '') {
             txtEncrypted.value = timeCode + '00';
          }
          if (typeof txtTime5 !== 'undefined' && txtTime5 && txtTime5.value === '') {
             try { if(typeof timeTo5Digit==='function') txtTime5.value = timeTo5Digit(timeCode + '00'); }catch(e){}
          }
          
          // Auto Copy to clipboard
          const timeValue = txtEncrypted ? txtEncrypted.value : (timeCode + '00');
          const copyStr = timeValue + " " + opt;
          navigator.clipboard.writeText(copyStr).then(() => {
            if (typeof showToast === 'function') showToast('Đã copy: ' + copyStr);
            else {
              const el = document.createElement('div');
              el.textContent = 'Đã copy: ' + copyStr;
              el.style.cssText = 'position:fixed;bottom:20px;right:20px;background:#0f0;color:#000;padding:10px;border-radius:4px;z-index:99999;font-weight:bold;font-family:monospace;';
              document.body.appendChild(el);
              setTimeout(()=>el.remove(), 2000);
            }
          });

          const fullTimeStr = typeof HOLY_HOUR_CODES !== 'undefined' && HOLY_HOUR_CODES[timeCode] ? HOLY_HOUR_CODES[timeCode] : timeCode + '00';
          lastAutoFilledTime = fullTimeStr;
        }

        if (isCorrect) {
          btn.style.background = '#003300'; btn.style.color = '#0f0';
          setTimeout(() => { if(quizChoices){quizChoices.style.display='none';quizChoices.innerHTML='';} }, 1200);
        } else {
          btn.style.background = '#220000'; btn.style.color = '#f55'; btn.style.borderColor = '#f55';
          quizChoices.querySelectorAll('button').forEach(b => { if(b.textContent===correctB60){b.style.background='#003300';b.style.borderColor='#0f0';b.style.color='#0f0';} });
          setTimeout(() => { if(quizChoices){quizChoices.style.display='none';quizChoices.innerHTML='';} }, 2500);
        }
        const panel = document.getElementById('activity-log-panel');
        if (panel && panel.style.display !== 'none' && typeof renderActivityLog === 'function') renderActivityLog();
      });
      quizChoices.appendChild(btn);
    });
  }

  function hideQuiz() {
    if (!quizChoices) return;
    quizChoices.style.display = 'none';
    quizChoices.innerHTML = '';
    quizAnswered = false;
    currentQuizTimeCode = null;
  }

  function tickSpecialTime() {
    const choicesEl = document.getElementById('quiz-choices');
    if (choicesEl && choicesEl.style.display !== 'none') return;

    if (!document.body.classList.contains('sandbox-mode') || !display) return;

    const now = new Date();
    const h = now.getHours();
    const m = now.getMinutes();

    // Tìm giờ đặc biệt trong cửa sổ [-3, +3] phút
    let foundSpecial = null;
    let diffMs = 0;
    let isPast = false;

    // Kiểm tra phút HIỆN TẠI trước
    const curSpecial = isSpecialTime(h, m);
    if (curSpecial) {
      foundSpecial = curSpecial;
      foundSpecial.fh = h; foundSpecial.fm = m;
      diffMs = 0; isPast = false;
    }

    // Tìm trong 3 phút tới
    if (!foundSpecial) {
      for (let i = 1; i <= LOOKAHEAD_MINUTES; i++) {
        const d = new Date(now.getTime() + i * 60000);
        const fh = d.getHours(), fm = d.getMinutes();
        const info = isSpecialTime(fh, fm);
        if (info) {
          const targetMs = new Date(d.getFullYear(), d.getMonth(), d.getDate(), fh, fm, 0, 0).getTime();
          foundSpecial = info;
          foundSpecial.fh = fh; foundSpecial.fm = fm;
          diffMs = targetMs - now.getTime();
          break;
        }
      }
    }

    // Tìm trong 3 phút qua (đã qua)
    if (!foundSpecial) {
      for (let i = 1; i <= LOOKAHEAD_MINUTES; i++) {
        const d = new Date(now.getTime() - i * 60000);
        const ph = d.getHours(), pm = d.getMinutes();
        const info = isSpecialTime(ph, pm);
        if (info) {
          foundSpecial = info;
          foundSpecial.fh = ph; foundSpecial.fm = pm;
          diffMs = -i * 60000;
          isPast = true;
          break;
        }
      }
    }

    if (!foundSpecial) {
      currentIsPast = false;
      display.dataset.timecode = '';
      display.dataset.b60 = '';
      display.style.display = 'flex';
      display.style.borderColor = '#333';
      display.style.color = '#555';
      display.innerHTML = `<span style="font-size:22px">🤍</span>`;
      hideQuiz();
      return;
    }

    const { timeCode, decodedWord, b60 } = getSpecialTimeInfo(foundSpecial.fh, foundSpecial.fm);
    display.dataset.timecode = timeCode;
    display.dataset.b60 = b60 || '';

    if (isPast) {
      currentIsPast = true;
      display.style.display = 'flex';
      display.style.borderColor = '#555';
      display.style.color = '#888';
      display.dataset.state = 'past';
      display.innerHTML = `<span style="font-size:14px">😢</span><span style="font-size:10px;color:#666;margin-left:4px">${foundSpecial.label}</span>`;
      hideQuiz();
      return;
    }

    // Chưa qua
    currentIsPast = false;
    const label = foundSpecial.label;

    display.style.display = 'flex';
    if (diffMs <= 0) {
      // Đang trong phút thiêng ⚡
      display.style.borderColor = '#ff0';
      display.style.color = '#ff0';
      display.innerHTML = `<span style="font-size:13px;font-weight:bold">⚡ ${foundSpecial.label}</span>`;
      hideQuiz();
    } else {
      // Đếm ngược → hiện quiz
      display.style.borderColor = '#0f0';
      display.style.color = '#0f0';
      display.innerHTML = `<span style="font-size:12px;font-weight:bold">⏳ ${foundSpecial.label}</span>`;
      // Auto-show removed
    }
  }

  // Khởi động khi vào Sandbox, dừng khi thoát
  
  // ===== CONTEXT MENU LOGIC =====
  const ctxMenu = document.getElementById('floating-context-menu');
  let activeContextInput = null;

  function hideContextMenu() {
    if (ctxMenu) {
      ctxMenu.style.display = 'none';
      activeContextInput = null;
    }
  }

  // Attach click listener to all textareas
  const allTextareas = [txtDecrypted, txtEncrypted, txtCompressed, txtFakeViet, txtTime5, txtCompressedContinuous];
  allTextareas.forEach(ta => {
    if (ta) {
      ta.addEventListener('focus', (e) => {
        if (!isToolbarEnabled) return;
        // Show context menu at top right of the textarea
        activeContextInput = ta;
        const rect = ta.getBoundingClientRect();
        
        ctxMenu.style.display = 'flex';
        // Position it near the top-right of the textarea, accounting for scroll
        let topPos = rect.top + window.scrollY - 45; // a bit above
        if (rect.top < 60) {
          topPos = rect.bottom + window.scrollY + 8;
        }
        let leftPos = rect.right + window.scrollX - ctxMenu.offsetWidth;
        if (leftPos < 0) leftPos = rect.left + window.scrollX;
        
        ctxMenu.style.top = topPos + 'px';
        ctxMenu.style.left = leftPos + 'px';
      });
    }
  });

  // Hide when clicking outside
  document.addEventListener('click', (e) => {
    if (ctxMenu && ctxMenu.style.display === 'flex') {
      if (!ctxMenu.contains(e.target) && e.target.tagName !== 'TEXTAREA') {
        hideContextMenu();
      }
    }
  });

  // Context Menu Buttons
  document.getElementById('ctx-close')?.addEventListener('click', hideContextMenu);

  document.getElementById('ctx-copy')?.addEventListener('click', () => {
    if (activeContextInput && activeContextInput.value) {
      navigator.clipboard.writeText(activeContextInput.value).then(() => {
        showToast('Đã copy!');
        hideContextMenu();
      });
    }
  });

  document.getElementById('ctx-clear')?.addEventListener('click', () => {
    if (activeContextInput) {
      activeContextInput.value = '';
      activeContextInput.dispatchEvent(new Event('input'));
      hideContextMenu();
    }
  });

  document.getElementById('ctx-full')?.addEventListener('click', () => {
    if (activeContextInput) {
      // Find wrapper
      let wrapper = activeContextInput.closest('.input-group') || activeContextInput.parentElement;
      if (wrapper.classList.contains('fullscreen')) {
        wrapper.classList.remove('fullscreen');
        document.getElementById('ctx-full').textContent = '⤢ FULL';
      } else {
        wrapper.classList.add('fullscreen');
        document.getElementById('ctx-full').textContent = '⤣ EXIT';
      }
      // Re-position menu after 100ms to adapt to fullscreen
      setTimeout(() => {
        activeContextInput.focus();
      }, 100);
    }
  });

    const origEnterSandbox = window.enterSandboxMode;
  document.addEventListener('DOMContentLoaded', () => {});

  // Watch for sandbox-mode class changes
  const observer = new MutationObserver(() => {
    if (document.body.classList.contains('sandbox-mode')) {
      if (!specialTimeInterval) {
        specialTimeInterval = setInterval(tickSpecialTime, 1000);
        tickSpecialTime();
      }
    } else {
      if (specialTimeInterval) {
        clearInterval(specialTimeInterval);
        specialTimeInterval = null;
      }
      if (display) display.style.display = 'none';
    }
  });
  observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
  // Also start immediately if already in sandbox
  if (document.body.classList.contains('sandbox-mode')) {
    specialTimeInterval = setInterval(tickSpecialTime, 1000);
    tickSpecialTime();
  }
})();

/* ==========================================================================
   GAME ENGINE & GAMIFICATION MODULE (SecretNoteKeyboard Academy)
   ========================================================================== */
(function initGameEngine() {
  // Game State
  
  window.triggerHolyHourQuest = function() {
    addEXP(20, '⏱️ Trả lời đúng Giờ Thiêng');
    checkQuestComplete('q2', 100);
  };
const gameState = {
    exp: parseInt(localStorage.getItem('snk_game_exp') || '0', 10),
    combo: 1,
    savedKeys: parseInt(localStorage.getItem('snk_game_saved_keys') || '0', 10),
    quizStreak: 0,
    quests: {
      b60Typed: parseInt(localStorage.getItem('snk_quest_typed') || '0', 10),
      comboMax: parseInt(localStorage.getItem('snk_quest_combo') || '0', 10),
      specialTimes: parseInt(localStorage.getItem('snk_quest_special') || '0', 10)
    }
  };

  // Rank Names
  const ranks = [
    { minLvl: 1, name: 'Tân Thủ Base60' },
    { minLvl: 3, name: 'Tập Sự Tốc Ký' },
    { minLvl: 5, name: 'Mật Mã Viên Base60' },
    { minLvl: 8, name: 'Chuyên Gia Tốc Ký' },
    { minLvl: 12, name: 'Đại Sư Base60' },
    { minLvl: 20, name: 'Huyền Thoại TimeCypher' }
  ];

  function getLevel(exp) {
    return Math.floor(Math.sqrt(exp / 20)) + 1;
  }

  function getRankName(lvl) {
    let current = ranks[0].name;
    for (let r of ranks) {
      if (lvl >= r.minLvl) current = r.name;
    }
    return current;
  }

  function updateGameUI() {
    const lvl = getLevel(gameState.exp);
    const rankName = getRankName(lvl);
    const expForCurrentLvl = (lvl - 1) * (lvl - 1) * 20;
    const expForNextLvl = lvl * lvl * 20;
    const progress = Math.min(100, Math.max(0, ((gameState.exp - expForCurrentLvl) / (expForNextLvl - expForCurrentLvl)) * 100));

    const badgeEl = document.getElementById('game-level-badge');
    const rankEl = document.getElementById('game-rank-name');
    const expFillEl = document.getElementById('game-exp-fill');
    const statExpEl = document.getElementById('game-stat-exp');
    const statComboEl = document.getElementById('game-stat-combo');
    const statSavedEl = document.getElementById('game-stat-saved');

    if (badgeEl) badgeEl.textContent = `LVL ${lvl}`;
    if (rankEl) rankEl.textContent = rankName;
    if (expFillEl) expFillEl.style.width = `${progress}%`;
    if (statExpEl) statExpEl.textContent = gameState.exp;
    if (statComboEl) statComboEl.textContent = `x${gameState.combo}`;
    if (statSavedEl) statSavedEl.textContent = gameState.savedKeys;

    // Quest UI
    const reqWords = Math.min(5, Math.max(1, lvl));
    const q1Text = document.getElementById('quest-1-text');
    if (q1Text) q1Text.textContent = `🎯 Gõ ${reqWords} từ bằng mã Base60`;

    const q1 = document.getElementById('quest-1-prog');
    const q2 = document.getElementById('quest-2-prog');
    const q3 = document.getElementById('quest-3-prog');
    if (q1) q1.textContent = `${Math.min(reqWords, gameState.quests.b60Typed)}/${reqWords}`;
    if (q2) q2.textContent = `${Math.min(1, gameState.quests.comboMax >= 3 ? 1 : 0)}/1`;
    if (q3) q3.textContent = `${Math.min(1, gameState.quests.specialTimes)}/1`;
  }

  function saveGameState() {
    localStorage.setItem('snk_game_exp', gameState.exp);
    localStorage.setItem('snk_game_saved_keys', gameState.savedKeys);
    localStorage.setItem('snk_quest_typed', gameState.quests.b60Typed);
    localStorage.setItem('snk_quest_combo', gameState.quests.comboMax);
    localStorage.setItem('snk_quest_special', gameState.quests.specialTimes);
  }

  function addEXP(amount, reason = '') {
    gameState.exp += amount;
    saveGameState();
    updateGameUI();
    showEXPToast(`+${amount} EXP ${reason}`);
  }

  function showEXPToast(msg) {
    const container = document.getElementById('exp-toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = 'exp-toast';
    toast.textContent = msg;
    container.appendChild(toast);
    setTimeout(() => { toast.remove(); }, 1600);
  }

  // --- Real-Usage Tracking ---
  let pendingWordTimers = new Map();

  function onBase60WordTyped(word, savedKeyCount) {
    const lvl = getLevel(gameState.exp);
    const reqWords = Math.min(5, Math.max(1, lvl));
    const wasCompleted = gameState.quests.b60Typed >= reqWords;
    
    gameState.quests.b60Typed++;
    
    if (!wasCompleted && gameState.quests.b60Typed >= reqWords) {
        addEXP(50, `🎁 Hoàn thành Quest: Gõ ${reqWords} từ`);
    }
    if (pendingWordTimers.has(word)) {
      clearTimeout(pendingWordTimers.get(word));
    }
    const timer = setTimeout(() => {
      // Confirmed real usage!
      const gainExp = 10 * gameState.combo;
      gameState.savedKeys += (savedKeyCount || 3);
      if (gameState.combo > gameState.quests.comboMax) {
        gameState.quests.comboMax = gameState.combo;
      }
      addEXP(gainExp, `🔥 x${gameState.combo}`);
      gameState.combo = Math.min(5, gameState.combo + 1);
      pendingWordTimers.delete(word);
    }, 2500);

    pendingWordTimers.set(word, timer);
  }

  window.triggerBase60TypedEvent = function(word, savedKeys) {
    onBase60WordTyped(word, savedKeys);
  };

  // --- Tab Navigation ---
  document.addEventListener('DOMContentLoaded', () => {
    updateGameUI();

    const tabBtns = document.querySelectorAll('.game-tab-btn');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetTab = btn.dataset.gametab;
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        document.querySelectorAll('.game-tab-content').forEach(c => c.classList.remove('active'));
        const activeContent = document.getElementById(`gametab-${targetTab}`);
        if (activeContent) activeContent.classList.add('active');

        if (targetTab === 'quiz') initQuizRound();
      });
    });

    const btnToggle = document.getElementById('btn-toggle-game-panel');
    const gameBox = document.getElementById('game-dashboard');
    if (btnToggle && gameBox) {
      btnToggle.addEventListener('click', () => {
        gameBox.classList.toggle('collapsed');
        btnToggle.textContent = gameBox.classList.contains('collapsed') ? '🎮 ▲' : '🎮 ▼';
      });
    }

    initQuizModule();
    initSpeedTestModule();
  });

  // --- FLASH QUIZ MODULE ---
  const sampleQuizPairs = [
    { word: 'cạ', b60: 'cck', time: '000005' },
    { word: 'phạc', b60: 'ddW', time: '010123' },
    { word: 'gạch', b60: 'ggk', time: '020205' },
    { word: 'tục', b60: 'GG4', time: '030335' },
    { word: 'thiệt', b60: 'jjR', time: '040429' },
    { word: 'tràn', b60: 'kkN', time: '050520' },
    { word: 'xỉn', b60: 'KKt', time: '060627' },
    { word: 'hôn', b60: 'hhc', time: '070700' },
    { word: 'vú', b60: 'vvd', time: '080801' },
    { word: 'dâm', b60: 'DDc', time: '090900' },
    { word: 'mút', b60: 'mmc', time: '101000' },
    { word: 'chịch', b60: 'CCk', time: '111105' },
    { word: 'rên', b60: 'rrc', time: '121200' },
    { word: 'sướng', b60: 'ssd', time: '131301' },
    { word: 'nứng', b60: 'nnd', time: '141401' },
    { word: 'bướm', b60: 'bbd', time: '151501' },
    { word: 'liếm', b60: 'lld', time: '161601' },
    { word: 'chim', b60: 'QQc', time: '171700' },
    { word: 'sờ', b60: 'SSg', time: '181802' },
    { word: 'ôm', b60: 'zzc', time: '191900' },
    { word: 'ngực', b60: 'NNk', time: '202005' },
    { word: 'nhấp', b60: 'yyc', time: '212100' },
    { word: 'lồn', b60: 'LLg', time: '222202' },
    { word: 'ngành', b60: 'NWg', time: '202302' },
    { word: 'được', b60: 'dWQ', time: '012317' },
    { word: 'rớt', b60: 'r3K', time: '123406' },
    { word: 'nghẻm', b60: 'WHG', time: '234503' },
    { word: 'nghợn', b60: 'W1C', time: '233211' },
    { word: 'ấp', b60: 'zyc', time: '192100' },
    { word: 'hít', b60: 'hDK', time: '070906' },
    { word: 'vuốt', b60: 'vsr', time: '081312' },
    { word: 've', b60: 'KaA', time: '065541' },
    { word: 'xoa', b60: 'KCp', time: '061124' },
    { word: 'cưng', b60: 'cnc', time: '001400' },
    { word: 'chiều', b60: 'Ckv', time: '110508' },
    { word: 'thương', b60: 'jsS', time: '041318' },
    { word: 'nhớ', b60: 'ySd', time: '211801' },
    { word: 'nhung', b60: 'yvr', time: '210812' },
    { word: 'say', b60: 'vH5', time: '084536' },
    { word: 'đắm', b60: 'd0d', time: '013101' },
    { word: 'nồng', b60: 'ntv', time: '142708' },
    { word: 'cháy', b60: 'CTd', time: '112801' },
    { word: 'khát', b60: 'Kqc', time: '062600' },
    { word: 'khao', b60: 'Kpc', time: '062400' },
    { word: 'mong', b60: 'mzK', time: '101906' },
    { word: 'chờ', b60: 'CSg', time: '111802' },
    { word: 'thèm', b60: 'jHN', time: '044520' },
    { word: 'ngọt', b60: 'NyC', time: '202111' },
    { word: 'ngào', b60: 'Npg', time: '202402' },
    { word: 'đê', b60: 'dUc', time: '015000' },
    { word: 'mê', b60: 'mUc', time: '105000' },
    { word: 'quấn', b60: 'g7z', time: '023819' },
    { word: 'quýt', b60: 'gVx', time: '025130' },
    { word: 'mơn', b60: 'm1K', time: '103206' },
    { word: 'trớn', b60: 'k1f', time: '053225' },
    { word: 'mặn', b60: 'm1k', time: '103205' },
    { word: 'mà', b60: 'mcg', time: '100002' },
    { word: 'êm', b60: 'zXc', time: '195200' },
    { word: 'ái', b60: 'zGd', time: '190301' },
    { word: 'cắn', b60: 'c1d', time: '003201' },
    { word: 'dập', b60: 'Dyk', time: '092105' },
    { word: 'nhồi', b60: 'yqv', time: '212608' },
    { word: 'đút', b60: 'dmc', time: '011000' },
    { word: 'xóc', b60: 'Knp', time: '061424' },
    { word: 'rỉ', b60: 'riG', time: '125703' },
    { word: 'rùng', b60: 'rvn', time: '120814' },
    { word: 'mình', b60: 'mhv', time: '100708' },
    { word: 'bắn', b60: 'b1d', time: '153201' },
    { word: 'trớ', b60: 'kSz', time: '051819' },
    { word: 'xuất', b60: 'Kgx', time: '060230' },
    { word: 'tinh', b60: 'Ghp', time: '030724' },
    { word: 'rụng', b60: 'rvQ', time: '120817' },
    { word: 'rời', b60: 'rxv', time: '123008' },
    { word: 'mẩy', b60: 'mBG', time: '104203' },
    { word: 'khít', b60: 'KDK', time: '060906' },
    { word: 'trơn', b60: 'k1p', time: '053224' },
    { word: 'ướt', b60: 'ztr', time: '192712' },
    { word: 'át', b60: 'zqc', time: '192600' },
    { word: 'đãng', b60: 'dKj', time: '010604' },
    { word: 'cu', b60: 'bS9', time: '151840' },
    { word: 'cặc', b60: 'cxk', time: '003005' },
    { word: 'mông', b60: 'mtK', time: '102706' },
    { word: 'đùi', b60: 'dkn', time: '010514' },
    { word: 'eo', b60: 'zJc', time: '194700' },
    { word: 'môi', b60: 'mqK', time: '102606' },
    { word: 'lưỡi', b60: 'lpl', time: '162416' },
    { word: 'anh', b60: 'zWc', time: '192300' },
    { word: 'em', b60: 'lJ6', time: '164737' },
    { word: 'vợ', b60: 'vSk', time: '081805' },
    { word: 'chồng', b60: 'Ctv', time: '112708' },
    { word: 'bé', b60: 'bEd', time: '154301' },
    { word: 'dượng', b60: 'Dsk', time: '091305' },
    { word: 'ngoan', b60: 'NsK', time: '201306' },
    { word: 'hư', b60: 'hSr', time: '071812' },
    { word: 'gợi', b60: 'gxC', time: '023011' },
    { word: 'cảm', b60: 'cjG', time: '000403' },
    { word: 'khiêu', b60: 'KkK', time: '060506' },
    { word: 'khích', b60: 'KCc', time: '061100' },
    { word: 'quyến', b60: 'g10', time: '023231' },
    { word: 'rũ', b60: 'rvj', time: '120804' },
    { word: 'quá', b60: 'gcz', time: '020019' },
    { word: 'này', b60: 'nTg', time: '142802' },
    { word: 'nọ', b60: 'n4C', time: '143511' },
    { word: 'thích', b60: 'jCS', time: '041118' },
    { word: 'muốn', b60: 'mCs', time: '101113' },
    { word: 'ngủ', b60: 'NvG', time: '200803' },
    { word: 'chơi', b60: 'CxK', time: '113006' },
    { word: 'làm', b60: 'ljg', time: '160402' },
    { word: 'cùng', b60: 'cvn', time: '000814' },
    { word: 'nào', b60: 'npg', time: '142402' },
    { word: 'vậy', b60: 'vBk', time: '084205' },
  ];

  let currentQuizTarget = null;

  function initQuizModule() {
    initQuizRound();
  }

  function getAdaptiveDistractors(targetWord, targetB60, streak) {
    const firstChar = targetB60[0];
    const distractors = new Map();
    const wordPool = (typeof REAL_VIETNAMESE_WORDS !== 'undefined' && REAL_VIETNAMESE_WORDS.length) 
      ? REAL_VIETNAMESE_WORDS 
      : sampleWordsList;

    if (streak >= 6) {
      const samePrefixWords = wordPool.filter(w => {
        if (w === targetWord) return false;
        try {
          const b = timeToBase60(encodeWord(w));
          return b && b.length === 3 && b[0] === firstChar && b !== targetB60;
        } catch(e) { return false; }
      }).sort(() => Math.random() - 0.5);

      for (const w of samePrefixWords) {
        distractors.set(timeToBase60(encodeWord(w)), w);
        if (distractors.size >= 3) break;
      }
    } else if (streak >= 3) {
      const samePrefixWords = wordPool.filter(w => {
        if (w === targetWord) return false;
        try {
          const b = timeToBase60(encodeWord(w));
          return b && b.length === 3 && b[0] === firstChar && b !== targetB60;
        } catch(e) { return false; }
      }).sort(() => Math.random() - 0.5);

      for (const w of samePrefixWords.slice(0, 1)) {
        distractors.set(timeToBase60(encodeWord(w)), w);
      }
    }

    const otherWords = wordPool.filter(w => w !== targetWord).sort(() => Math.random() - 0.5);
    for (const w of otherWords) {
      if (distractors.size >= 3) break;
      try {
        const b = timeToBase60(encodeWord(w));
        if (b && b.length === 3 && b !== targetB60 && !distractors.has(b)) {
          distractors.set(b, w);
        }
      } catch(e) {}
    }

    const result = [];
    distractors.forEach((w, b) => result.push({ b60: b, word: w }));
    return result;
  }

  function initQuizRound() {
    const wordEl = document.getElementById('quiz-target-word');
    const gridEl = document.getElementById('quiz-options-grid');
    const feedbackEl = document.getElementById('quiz-feedback');
    const streakEl = document.getElementById('quiz-streak-count');
    if (!wordEl || !gridEl) return;

    if (feedbackEl) feedbackEl.innerHTML = '';
    
    const streak = gameState.quizStreak || 0;
    let diffBadge = '🟢 Dễ (Khác phụ âm)';
    if (streak >= 6) diffBadge = '🔥 Cao thủ (Cùng phụ âm)';
    else if (streak >= 3) diffBadge = '🟡 Trung bình (Gài bẫy)';
    
    if (streakEl) streakEl.textContent = `🔥 Streak: ${streak} | ${diffBadge}`;

    const validPairs = sampleQuizPairs.filter(p => p.b60 && p.b60.length === 3);
    const targetIndex = Math.floor(Math.random() * validPairs.length);
    currentQuizTarget = validPairs[targetIndex];
    wordEl.textContent = `"${currentQuizTarget.word}"`;

    const distractors = getAdaptiveDistractors(currentQuizTarget.word, currentQuizTarget.b60, streak);
    const options = [{ b60: currentQuizTarget.b60, word: currentQuizTarget.word }, ...distractors];
    
    options.sort(() => Math.random() - 0.5);

    gridEl.innerHTML = '';
    options.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'quiz-opt-btn';
      btn.textContent = opt.b60;
      btn.dataset.b60 = opt.b60;
      btn.dataset.word = opt.word;
      btn.addEventListener('click', () => handleQuizAnswer(opt.b60, btn));
      gridEl.appendChild(btn);
    });
  }

  function handleQuizAnswer(selectedB60, btnEl) {
    const feedbackEl = document.getElementById('quiz-feedback');
    const allBtns = document.querySelectorAll('.quiz-opt-btn');

    if (feedbackEl && feedbackEl.innerHTML.includes('Câu hỏi tiếp')) return;

    // Lật bài (Hiện từ gốc cho TẤT CẢ các đáp án)
    allBtns.forEach(b => {
      b.textContent = b.dataset.b60 + ' (' + b.dataset.word + ')';
      if (b.dataset.b60 === currentQuizTarget.b60) {
        b.classList.add('correct'); // Bôi xanh đáp án đúng
      }
    });

    if (selectedB60 === currentQuizTarget.b60) {
      btnEl.classList.add('correct');
      gameState.quizStreak++;
      addEXP(15, `🔥 Streak x${gameState.quizStreak}`);
      
      if (typeof txtDecrypted !== 'undefined' && txtDecrypted) {
        txtDecrypted.value = currentQuizTarget.word;
        if (typeof syncFromDecrypted === 'function') syncFromDecrypted();
      }
      


    } else {
      btnEl.classList.add('wrong');
      gameState.quizStreak = 0;
      updateGameUI();
    }

    if (feedbackEl) {
      feedbackEl.innerHTML = '<button id="btn-next-quiz" style="background:#0f0; color:#000; font-weight:bold; padding:8px 16px; border:none; cursor:pointer; border-radius:4px; font-family:monospace; margin-top:8px;">CÂU HỎI TIẾP ▸</button>';
      document.getElementById('btn-next-quiz').addEventListener('click', initQuizRound);
    }
  }

  // --- TIME ATTACK 60S MODULE ---
  const presetTexts = {
    cadao: "Công cha như núi Thái Sơn nghĩa mẹ như nước trong nguồn chảy ra Một lòng thờ mẹ kính cha cho tròn chữ hiếu mới là đạo con",
    thongdung: "tôi không được là của có những để một với cho trong đã này người các ra được đến thành vcomp",
    thanhngu: "Có công mài sắt có ngày nên kim Đi một ngày đàng học một sàng khôn Ăn quả nhớ kẻ trồng cây Uống nước nhớ nguồn"
  };

  let speedTimer = null;
  let speedHintTimer = null;
  let speedTimeLeft = 60;
  let speedActive = false;
  let speedWords = [];
  let speedCurrentIndex = 0;
  let speedCorrectChars = 0;
  let speedTotalB60Keys = 0;
  let speedTotalNormalKeys = 0;

  function initSpeedTestModule() {
    const btnStart = document.getElementById('btn-speed-start');
    const selPreset = document.getElementById('sel-speed-preset');
    const speedInput = document.getElementById('speed-input');
    
    if (!btnStart || !selPreset) return;

    btnStart.addEventListener('click', startSpeedTest);
    selPreset.addEventListener('change', () => {
      const box = document.getElementById('speed-prompt-box');
      if (box && !speedActive) {
        const textPrompt = presetTexts[selPreset.value] || presetTexts.cadao;
        const words = textPrompt.trim().split(/\s+/);
        box.innerHTML = words.map((w, idx) => {
          const b60 = timeToBase60(encodeWord(w));
          return `<span class="speed-word ${idx === 0 ? 'active' : ''}" data-b60="${b60}"><span class="speed-b60-top">${b60}</span><span class="speed-vi-bot">${w}</span></span>`;
        }).join('');
      }
    });

    if (speedInput) {
      speedInput.addEventListener('input', (e) => {
        if (!speedActive) return;
        const val = speedInput.value;
        if (val.includes(' ')) {
          speedInput.value = val.replace(/\s/g, '');
        }
        if (speedInput.value.trim().length === 3) {
          checkSpeedInput(speedInput.value.trim().toLowerCase());
        }
      });
    }
  }

  function startSpeedTest() {
    if (speedActive) return;
    speedActive = true;
    speedTimeLeft = 60;
    speedCurrentIndex = 0;
    speedCorrectChars = 0;
    speedTotalB60Keys = 0;
    speedTotalNormalKeys = 0;

    const selPreset = document.getElementById('sel-speed-preset');
    const textPrompt = presetTexts[selPreset?.value || 'cadao'];
    const promptBox = document.getElementById('speed-prompt-box');
    const timerText = document.getElementById('speed-timer-text');
    const resultBox = document.getElementById('speed-result-box');
    const speedInput = document.getElementById('speed-input');

    if (resultBox) resultBox.style.display = 'none';
    
    // Process words
    const rawWords = textPrompt.trim().split(/\s+/);
    speedWords = rawWords.map(w => {
      const b60 = timeToBase60(encodeWord(w));
      return { word: w, b60: b60 };
    });

    if (promptBox) {
      promptBox.innerHTML = speedWords.map((item, idx) => 
        `<span class="speed-word ${idx === 0 ? 'active' : ''}" id="speed-word-${idx}" data-b60="${item.b60}"><span class="speed-b60-top">${item.b60}</span><span class="speed-vi-bot">${item.word}</span></span>`
      ).join('');
    }

    if (speedInput) {
      speedInput.style.display = 'block';
      speedInput.value = '';
      speedInput.focus();
    }

    if (timerText) timerText.textContent = '⏳ 60s';

    resetHintTimer();

    speedTimer = setInterval(() => {
      speedTimeLeft--;
      if (timerText) timerText.textContent = `⏳ ${speedTimeLeft}s`;

      if (speedTimeLeft <= 0) {
        endSpeedTest();
      }
    }, 1000);
  }

  function resetHintTimer() {
    clearTimeout(speedHintTimer);
    if (!speedActive || speedCurrentIndex >= speedWords.length) return;
    
    const currentSpan = document.getElementById(`speed-word-${speedCurrentIndex}`);
    if (currentSpan) {
      currentSpan.classList.add('active');
    }
  }

  function checkSpeedInput(inputValue) {
    if (speedCurrentIndex >= speedWords.length) return;
    const target = speedWords[speedCurrentIndex];
    const speedInput = document.getElementById('speed-input');
    const currentSpan = document.getElementById(`speed-word-${speedCurrentIndex}`);
    
    if (inputValue === target.b60.toLowerCase()) {
      // Correct!
      speedCorrectChars += target.word.length + 1; // +1 for space
      speedTotalB60Keys += target.b60.length;
      speedTotalNormalKeys += target.word.length;
      
      currentSpan.classList.remove('active', 'wrong');
      currentSpan.classList.add('correct');
      
      speedCurrentIndex++;
      speedInput.value = '';
      
      if (speedCurrentIndex >= speedWords.length) {
        endSpeedTest();
      } else {
        const nextSpan = document.getElementById(`speed-word-${speedCurrentIndex}`);
        if (nextSpan) nextSpan.classList.add('active');
        resetHintTimer();
      }
    } else {
      // Wrong! Flash red.
      speedInput.style.backgroundColor = '#500';
      setTimeout(() => speedInput.style.backgroundColor = '', 200);
      currentSpan.classList.add('wrong');
      speedInput.value = '';
    }
  }

  function endSpeedTest() {
    clearInterval(speedTimer);
    clearTimeout(speedHintTimer);
    speedActive = false;

    const timerText = document.getElementById('speed-timer-text');
    const resultBox = document.getElementById('speed-result-box');
    const speedInput = document.getElementById('speed-input');
    const resWpm = document.getElementById('res-wpm');
    const resAcc = document.getElementById('res-acc');
    const resSaved = document.getElementById('res-saved');

    if (speedInput) speedInput.style.display = 'none';
    if (timerText) timerText.textContent = '⏱️ HẾT GIỜ!';
    
    const timeElapsed = 60 - speedTimeLeft;
    const mins = timeElapsed > 0 ? timeElapsed / 60 : 1/60;
    
    const calculatedWpm = Math.round((speedCorrectChars / 5) / mins);
    const calculatedSaved = speedTotalNormalKeys > 0 ? Math.round(100 - (speedTotalB60Keys / speedTotalNormalKeys) * 100) : 0;
    const calculatedAcc = 100; // Simplified for now since we only allow moving forward on correct

    if (resWpm) resWpm.textContent = calculatedWpm;
    if (resAcc) resAcc.textContent = `${calculatedAcc}%`;
    if (resSaved) resSaved.textContent = `${calculatedSaved}%`;

    if (resultBox) resultBox.style.display = 'block';
    
    if (speedCurrentIndex > 0) {
      addEXP(Math.min(100, speedCurrentIndex * 5), '⚡ Hoàn thành Speed Test!');
    }
  }
})();


function decodeShareHash(hash) {
  let str = decodeURIComponent(hash.replace(/^#/, ''));
  str = str.replace(/-/g, '\n');
  const b60Chars = "cdgGjkKhvDmCrsnblQSzNyLWpfqtTRx0123456789ABEFHIJMPUVXYZaeiuw";
  let unpacked = '';
  let i = 0;
  while (i < str.length) {
    if (str[i] === '\n') {
      unpacked += '\n';
      i++;
    } else if (str[i] === '[') {
      let end = str.indexOf(']', i);
      if (end === -1) end = str.length - 1;
      unpacked += str.slice(i, end + 1) + ' ';
      i = end + 1;
    } else {
      let isB60 = true;
      for (let j = 0; j < 3; j++) {
        if (i+j >= str.length || !b60Chars.includes(str[i+j])) {
          isB60 = false; break;
        }
      }
      if (isB60) {
        unpacked += str.slice(i, i+3) + ' ';
        i += 3;
      } else {
        unpacked += str[i];
        i++;
      }
    }
  }
  return unpacked.replace(/ \n/g, '\n').trim();
}

document.addEventListener('DOMContentLoaded', () => {
  if (location.hash && location.hash.length > 1 && typeof txtCompressed !== 'undefined') {
    setTimeout(() => {
      txtCompressed.value = decodeShareHash(location.hash);
      if (typeof syncFromCompressed === 'function') syncFromCompressed();
    }, 100);
  }
});

window.handleTopLeftQuiz = function(selectedB60, correctB60, correctFullCode, btn) {
  // Lấy từ gốc để hiển thị
  let wordToShow = '';
  try {
     const fullCode = (selectedB60 === correctB60) ? correctFullCode : (typeof base60ToTime === 'function' ? base60ToTime(selectedB60) : '');
     wordToShow = (typeof decodeWord === 'function' && fullCode) ? decodeWord(fullCode) : '';
  } catch(e){}

  if (selectedB60 === correctB60) {
    btn.style.background = '#0f0';
    btn.style.color = '#000';
    
    
    // 1. FORCED FILL DATA (Trực tiếp DOM để không trượt phát nào)
    const dec = document.getElementById('text-input');
    const enc = document.getElementById('time-input');
    const comp = document.getElementById('compressed-input');
    const fake = document.getElementById('fake-viet-input');
    
    if (enc) enc.value = correctFullCode;
    if (comp) comp.value = correctB60;
    if (dec) {
       try {
          const w = typeof decodeWord === 'function' ? decodeWord(correctFullCode) : correctFullCode;
          dec.value = w && w !== 'undefined' ? w : correctFullCode;
       } catch(e) { dec.value = correctFullCode; }
    }
    if (fake && typeof toFakeViet === 'function' && dec) {
       try { fake.value = toFakeViet(dec.value); } catch(e){}
    }
    
    // Ép đồng bộ các ô còn lại (Time5, Liên tục...)
    if (typeof syncFromTime === 'function') {
       try { syncFromTime(); } catch(e){}
    }
    
    // 2. AUTO COPY GỘP (Mã thời gian + Mã nén)
    const copyStr = correctFullCode + " " + correctB60;
    navigator.clipboard.writeText(copyStr).then(() => {
       if (typeof showToast === 'function') showToast('Đã copy: ' + copyStr);
       else {
         const el = document.createElement('div');
         el.textContent = 'Đã copy: ' + copyStr;
         el.style.cssText = 'position:fixed;bottom:20px;right:20px;background:#0f0;color:#000;padding:10px;border-radius:4px;z-index:99999;font-weight:bold;font-family:monospace;pointer-events:none;';
         document.body.appendChild(el);
         setTimeout(()=>el.remove(), 2000);
       }
    }).catch(err => console.log('Copy failed', err));

    if (window.triggerHolyHourQuest) window.triggerHolyHourQuest();
    
    // 3. AUTO CLOSE ON SUCCESS (Chỉ đóng khi chọn đúng)
    setTimeout(() => {
      const choicesEl = document.getElementById('quiz-choices');
      const actionsEl = document.getElementById('top-left-actions');
      if (choicesEl) {
        choicesEl.style.display = 'none';
        choicesEl.innerHTML = '';
      }
      if (actionsEl) {
        actionsEl.style.display = 'flex';
      }
      const display = document.getElementById('special-time-display');
      if (display && display.dataset.timecode) {
         const targetCode = display.dataset.timecode;
         display.innerHTML = `<span style="font-size:11px;color:#0f0;">🤍 ${targetCode.substring(0,2)}:${targetCode.substring(2)}</span>`;
      }
    }, 1000);

  } else {
    // 4. WRONG ANSWER - GIỮ NGUYÊN NÚT VÀ HIỂN THỊ TỪ GỐC
    btn.style.background = '#f00';
    btn.style.color = '#000';
    btn.style.textDecoration = 'line-through';
  }
};

// ==========================================
// 🎓 SUPER MNEMONIC TUTOR ENGINE (TRỢ GIẢNG GHI NHỚ SIÊU CẤP)
// ==========================================
function initMnemonicTutor() {
  const tutorCard = document.getElementById('tutor-card');
  const btnToggleTutor = document.getElementById('btn-toggle-tutor');
  const quickInput = document.getElementById('tutor-quick-input');
  const badgeActive = document.getElementById('tutor-active-badge');
  const formulaText = document.getElementById('tutor-formula-text');
  const colCons = document.getElementById('tutor-col-cons');
  const colRhyme = document.getElementById('tutor-col-rhyme');
  const colTone = document.getElementById('tutor-col-tone');
  const confusionBox = document.getElementById('tutor-confusion-box');
  const confusionList = document.getElementById('tutor-confusion-list');
  const sameConsEl = document.getElementById('tutor-same-cons');
  const sameRhymeEl = document.getElementById('tutor-same-rhyme');
  const sameRhymeToneEl = document.getElementById('tutor-same-rhyme-tone');
  const sameLettersEl = document.getElementById('tutor-same-letters');

  if (!tutorCard) return;

  let tutorVisible = localStorage.getItem('pref_view_tutor') !== 'false';
  tutorCard.style.display = tutorVisible ? 'block' : 'none';

  window.setMnemonicTutorVisible = function(vis) {
    tutorVisible = vis;
    if (tutorCard) tutorCard.style.display = vis ? 'block' : 'none';
  };

  // --- 1. PRE-INDEX REAL WORDS FOR 0.01ms INSTANT LOOKUP ---
  const consIndex = new Map();
  const rhymeIndex = new Map();
  const rhymeToneIndex = new Map();
  const wordRankMap = new Map();
  let isIndexed = false;

  function buildTutorIndex() {
    if (isIndexed) return;
    const realList = typeof REAL_VIETNAMESE_WORDS !== 'undefined' ? REAL_VIETNAMESE_WORDS : [];
    realList.forEach((rw, idx) => wordRankMap.set(rw, idx));

    for (const rw of realList) {
      const rEnc = encodeWord(rw);
      if (rEnc.startsWith('[')) continue;
      const rB60 = timeToBase60(rEnc);
      const c1 = rB60[0], c2 = rB60[1], c3 = rB60[2];

      if (!consIndex.has(c1)) consIndex.set(c1, []);
      if (consIndex.get(c1).length < 5) consIndex.get(c1).push({ word: rw, b60: rB60 });

      if (!rhymeIndex.has(c2)) rhymeIndex.set(c2, []);
      if (rhymeIndex.get(c2).length < 5) rhymeIndex.get(c2).push({ word: rw, b60: rB60 });

      const rtKey = c2 + '_' + c3;
      if (!rhymeToneIndex.has(rtKey)) rhymeToneIndex.set(rtKey, []);
      if (rhymeToneIndex.get(rtKey).length < 5) rhymeToneIndex.get(rtKey).push({ word: rw, b60: rB60 });
    }
    isIndexed = true;
  }
  setTimeout(buildTutorIndex, 50);

  function getWordUnderCursor(textarea) {
    if (!textarea) return '';
    const val = textarea.value || '';
    const pos = textarea.selectionStart || 0;
    const left = val.slice(0, pos).search(/\S+$/);
    const right = val.slice(pos).search(/\s/);
    if (left < 0) return '';
    const word = right < 0 ? val.slice(left) : val.slice(left, pos + right);
    return word.trim();
  }

  let lastAnalyzedKey = '';

  function updateTutor(inputStr, forceMode = 'auto') {
    if (!tutorVisible) return;
    inputStr = (inputStr || '').trim();
    if (!inputStr) inputStr = 'thành';

    // 1. ALWAYS RESOLVE TO VIETNAMESE WORD (TÂM ĐIỂM TIẾNG VIỆT GỐC)
    let word = '';
    if (forceMode === 'b60' && /^[a-zA-Z0-9]{3}$/.test(inputStr)) {
      const b60Time = base60ToTime(inputStr);
      if (/^\d{6}$/.test(b60Time)) {
        const decoded = decodeWord(b60Time);
        if (decoded && !decoded.includes('?') && !decoded.startsWith('[')) {
          word = decoded;
        }
      }
    }

    if (!word) {
      const cleanW = inputStr.replace(/^[^\p{L}\d]+|[^\p{L}\d]+$/gu, '');
      const testW = (cleanW || inputStr).toLowerCase();
      const viCode = encodeWord(testW);
      if (/^\d{6}$/.test(viCode)) {
        word = testW;
      } else if (/^[a-zA-Z0-9]{3}$/.test(inputStr)) {
        // Fallback: If input is a Base60 code, decode it to get Vietnamese word
        const b60Time = base60ToTime(inputStr);
        if (/^\d{6}$/.test(b60Time)) {
          const decoded = decodeWord(b60Time);
          if (decoded && !decoded.includes('?') && !decoded.startsWith('[')) {
            word = decoded;
          }
        }
      }
      if (!word) word = testW;
    }

    if (word === lastAnalyzedKey) return; // Skip if unchanged
    lastAnalyzedKey = word;

    // 2. ENCODE & BREAKDOWN FROM THE ORIGINAL VIETNAMESE WORD
    const code = encodeWord(word);
    const b60 = timeToBase60(code);

    if (!code || !/^\d{6}$/.test(code) || code.startsWith('[')) {
      if (formulaText) {
        formulaText.innerHTML = `⚠️ <i>Chưa tìm thấy quy tắc nén cho từ "<b>${word}</b>". Hãy thử từ khác (VD: <b>thành</b>, <b>vui</b>, <b>rớt</b>)...</i>`;
      }
      return;
    }

    const hh = parseInt(code.substring(0,2), 10);
    const mm = parseInt(code.substring(2,4), 10);
    const ss = parseInt(code.substring(4,6), 10);

    const s2 = Math.floor(ss / 6);
    const s1 = ss % 6;
    const consTable = Math.floor(s2 / 3);
    const rhymeTable = s2 % 3;

    const consonant = consTable === 0 ? CONSONANTS_BASE[hh] : CONSONANTS_EXTRA[hh];
    const rhyme = rhymeTable === 0 ? RHYMES_BASE[mm] : (rhymeTable === 1 ? RHYMES_EXTRA_1[mm] : RHYMES_EXTRA_2[mm]);

    const c1 = b60[0];
    const c2 = b60[1];
    const c3 = b60[2];

    const toneNames = ['không dấu (Bằng)', 'dấu Sắc (✓)', 'dấu Huyền (`)', 'dấu Hỏi (ˀ)', 'dấu Ngã (~)', 'dấu Nặng (•)'];
    const toneName = toneNames[s1];

    let toneMnemonic = '';
    let toneTableLabel = '';
    if (s2 === 0) { toneMnemonic = `dấu <b>${toneName}</b> kiểu Telex thường (<b style="color:#ff55ff">${c3}</b>)`; toneTableLabel = `Dấu ${toneName} ➜ [ <b style="color:#ff55ff">${c3}</b> ] (Telex)`; }
    else if (s2 === 1) { toneMnemonic = `dấu <b>${toneName}</b> kiểu Telex HOA (<b style="color:#ff55ff">${c3}</b>) ở Bảng 2`; toneTableLabel = `Dấu ${toneName} ➜ [ <b style="color:#ff55ff">${c3}</b> ] (Telex HOA B2)`; }
    else if (s2 === 2) { toneMnemonic = `dấu <b>${toneName}</b> kiểu Nguyên âm (<b style="color:#ff55ff">${c3}</b>) ở Bảng 3`; toneTableLabel = `Dấu ${toneName} ➜ [ <b style="color:#ff55ff">${c3}</b> ] (Nguyên âm B3)`; }
    else if (s2 === 3) { toneMnemonic = `dấu <b>${toneName}</b> kiểu VNI (<b style="color:#ff55ff">${c3}</b>) cho PA phụ B1`; toneTableLabel = `Dấu ${toneName} ➜ [ <b style="color:#ff55ff">${c3}</b> ] (VNI B1)`; }
    else if (s2 === 4) { toneMnemonic = `dấu <b>${toneName}</b> kiểu VNI cao (<b style="color:#ff55ff">${c3}</b>) cho PA phụ B2`; toneTableLabel = `Dấu ${toneName} ➜ [ <b style="color:#ff55ff">${c3}</b> ] (VNI B2)`; }
    else if (s2 === 5) { toneMnemonic = `dấu <b>${toneName}</b> kiểu Nguyên âm HOA (<b style="color:#ff55ff">${c3}</b>) cho PA phụ B3`; toneTableLabel = `Dấu ${toneName} ➜ [ <b style="color:#ff55ff">${c3}</b> ] (Nguyên âm HOA B3)`; }

    const consDesc = consonant === '' ? 'nguyên âm đầu (không có phụ âm)' : `phụ âm <b>"${consonant}"</b> mã là <b style="color:#00ffff">${c1}</b>`;
    const rhymeTableName = rhymeTable === 0 ? 'B1' : (rhymeTable === 1 ? 'B2' : 'B3');
    const rhymeDesc = `vần <b>"${rhyme}"</b> mã là <b style="color:#ffea00">${c2}</b>`;

    if (badgeActive) badgeActive.textContent = `${word} ➜ ${b60} (${code.substring(0,2)}:${code.substring(2,4)}:${code.substring(4,6)})`;
    if (formulaText) {
      formulaText.innerHTML = `💡 Chỉ cần nhớ: ${consDesc}, ${rhymeDesc}, ${toneMnemonic} ➜ Ghép lại thành <b style="color:#00ff66">${b60}</b>!`;
    }

    if (colCons) colCons.innerHTML = `"${consonant || '(rỗng)'}" ➜ Mã: [ <b style="color:#00ffff">${c1}</b> ] ${consTable === 1 ? '(PA phụ)' : ''}`;
    if (colRhyme) colRhyme.innerHTML = `"${rhyme}" ➜ Mã: [ <b style="color:#ffea00">${c2}</b> ] (${rhymeTableName})`;
    if (colTone) colTone.innerHTML = toneTableLabel;

    // Render Anti-Confusion Contrast Alerts
    if (confusionBox && confusionList) {
      const notes = [];
      const consContrastMap = {
        'T': { other: 't', descThis: 'phụ âm "th"', descOther: 'phụ âm "t"' },
        't': { other: 'T', descThis: 'phụ âm "t"', descOther: 'phụ âm "th"' },
        'C': { other: 'c', descThis: 'phụ âm "ch"', descOther: 'phụ âm "c/k"' },
        'c': { other: 'C', descThis: 'phụ âm "c/k"', descOther: 'phụ âm "ch"' },
        'D': { other: 'd', descThis: 'phụ âm "d/gi"', descOther: 'phụ âm "đ"' },
        'd': { other: 'D', descThis: 'phụ âm "đ"', descOther: 'phụ âm "d/gi"' },
        'G': { other: 'g', descThis: 'phụ âm "gh"', descOther: 'phụ âm "g"' },
        'g': { other: 'G', descThis: 'phụ âm "g"', descOther: 'phụ âm "gh"' },
        'K': { other: 'k', descThis: 'phụ âm "kh"', descOther: 'phụ âm "k/c"' },
        'k': { other: 'K', descThis: 'phụ âm "k/c"', descOther: 'phụ âm "kh"' },
        'N': { other: 'n', descThis: 'phụ âm "ng/ngh"', descOther: 'phụ âm "n"' },
        'n': { other: 'N', descThis: 'phụ âm "n"', descOther: 'phụ âm "ng/ngh"' },
        'q': { other: 'Q', descThis: 'phụ âm "qu"', descOther: 'phụ âm "ch" (từ chim)' },
        'Q': { other: 'q', descThis: 'phụ âm "ch" (từ chim)', descOther: 'phụ âm "qu"' },
        'R': { other: 'r', descThis: 'phụ âm "tr"', descOther: 'phụ âm "r"' },
        'r': { other: 'R', descThis: 'phụ âm "r"', descOther: 'phụ âm "tr"' },
        'L': { other: 'l', descThis: 'phụ âm "l" (nhóm 22: lồn)', descOther: 'phụ âm "l" (nhóm 16: liếm)' },
        'l': { other: 'L', descThis: 'phụ âm "l" (nhóm 16: liếm)', descOther: 'phụ âm "l" (nhóm 22: lồn)' },
        'S': { other: 's', descThis: 'phụ âm "s" (nhóm 18: sờ)', descOther: 'phụ âm "s" (nhóm 13: sướng)' },
        's': { other: 'S', descThis: 'phụ âm "s" (nhóm 13: sướng)', descOther: 'phụ âm "s" (nhóm 18: sờ)' },
        'W': { other: 'v', descThis: 'phụ âm "ngh" (nhóm 23: nghạnh)', descOther: 'phụ âm "v" (nhóm 08: vú)' }
      };

      if (consContrastMap[c1]) {
        const item = consContrastMap[c1];
        notes.push(`• <b>Phụ âm:</b> [ <b style="color:#00ffff">${c1}</b> ] là <i>${item.descThis}</i> <span style="color:#ffaa00;">≠</span> [ <b style="color:#888">${item.other}</b> ] là <i>${item.descOther}</i>`);
      } else if (c1 === 'h') {
        notes.push(`• <b>Phụ âm:</b> [ <b style="color:#00ffff">h</b> ] (thường) là <i>phụ âm "h"</i> <span style="color:#ffaa00;">≠</span> [ <b style="color:#888">H</b> ] (không phải phụ âm, là ký hiệu vần slot 33: uô/ênh)`);
      }

      const rhymeContrastMap = {
        'h': { other: 'H', descThis: `vần "${rhyme}" (slot 07: ôn/iêu/uân)`, descOther: 'slot 33 (uô/ênh/uôm)' },
        'H': { other: 'h', descThis: `vần "${rhyme}" (slot 33: uô/ênh/uôm)`, descOther: 'slot 07 (ôn/iêu/uân)' },
        'q': { other: 'Q', descThis: `vần "${rhyme}" (slot 26: at/ưt/uât)`, descOther: 'slot 42 (uơ/ơu/oai)' },
        'Q': { other: 'q', descThis: `vần "${rhyme}" (slot 42: uơ/ơu/oai)`, descOther: 'slot 26 (at/ưt/uât)' },
        'd': { other: 'D', descThis: `vần "${rhyme}" (slot 01: ac/ach/oac)`, descOther: 'slot 29 (iêc/iêt/oăt)' },
        'D': { other: 'd', descThis: `vần "${rhyme}" (slot 29: iêc/iêt/oăt)`, descOther: 'slot 01 (ac/ach/oac)' },
        'c': { other: 'C', descThis: `vần "${rhyme}" (slot 00: a/ai/ao)`, descOther: 'slot 28 (e/ec/oan)' },
        'C': { other: 'c', descThis: `vần "${rhyme}" (slot 28: e/ec/oan)`, descOther: 'slot 00 (a/ai/ao)' },
        'm': { other: 'M', descThis: `vần "${rhyme}" (slot 10: ut/un/ưng)`, descOther: 'slot 38 (om/on/oap)' },
        'M': { other: 'm', descThis: `vần "${rhyme}" (slot 38: om/on/oap)`, descOther: 'slot 10 (ut/un/ưng)' },
      };

      if (rhymeContrastMap[c2]) {
        const item = rhymeContrastMap[c2];
        notes.push(`• <b>Vần:</b> [ <b style="color:#ffea00">${c2}</b> ] là <i>${item.descThis}</i> <span style="color:#ffaa00;">≠</span> [ <b style="color:#888">${item.other}</b> ] là <i>${item.descOther}</i>`);
      }

      if (/[ZSFXRJ]/.test(c3)) {
        notes.push(`• <b>Dấu:</b> [ <b style="color:#ff55ff">${c3}</b> ] (Telex HOA) chỉ định <b>Bảng 2</b> <span style="color:#ffaa00;">≠</span> [ <b style="color:#888">${c3.toLowerCase()}</b> ] (Telex thường) chỉ định <b>Bảng 1</b>`);
      } else if (/[zsfrxj]/.test(c3)) {
        notes.push(`• <b>Dấu:</b> [ <b style="color:#ff55ff">${c3}</b> ] (Telex thường) chỉ định <b>Bảng 1</b> <span style="color:#ffaa00;">≠</span> [ <b style="color:#888">${c3.toUpperCase()}</b> ] (Telex HOA) chỉ định <b>Bảng 2</b>`);
      } else if (/[0-5]/.test(c3)) {
        notes.push(`• <b>Dấu:</b> [ <b style="color:#ff55ff">${c3}</b> ] (VNI số 0-5) dùng cho <b>Phụ âm phụ ở Bảng 1</b> (t, th, qu, ph, tr, x...)`);
      } else if (/[6-9BC]/.test(c3)) {
        notes.push(`• <b>Dấu:</b> [ <b style="color:#ff55ff">${c3}</b> ] (VNI cao 6-9, B, C) dùng cho <b>Phụ âm phụ ở Bảng 2</b>`);
      }

      if (notes.length > 0) {
        confusionList.innerHTML = notes.map(n => `<div>${n}</div>`).join('');
        confusionBox.style.display = 'block';
      } else {
        confusionBox.style.display = 'none';
      }
    }

    // Instant O(1) Lookups from Pre-built Index
    buildTutorIndex();
    const sameCons = (consIndex.get(c1) || []).filter(item => item.word !== word).slice(0, 5);
    const sameRhyme = (rhymeIndex.get(c2) || []).filter(item => item.word !== word).slice(0, 5);
    const sameRhymeTone = (rhymeToneIndex.get(c2 + '_' + c3) || []).filter(item => item.word !== word).slice(0, 5);

    // 4. Case Variants (Biến thể HOA/thường cùng bộ ký tự)
    const p1 = [c1.toLowerCase(), c1.toUpperCase()];
    const p2 = [c2.toLowerCase(), c2.toUpperCase()];
    const p3 = [c3.toLowerCase(), c3.toUpperCase()];
    const u1 = [...new Set(p1)];
    const u2 = [...new Set(p2)];
    const u3 = [...new Set(p3)];

    const caseVariants = [];
    const seenWords = new Set();
    seenWords.add(word);

    for (let x1 of u1) {
      for (let x2 of u2) {
        for (let x3 of u3) {
          const candCode = x1 + x2 + x3;
          if (candCode === b60) continue;
          const time = base60ToTime(candCode);
          if (/^\d{6}$/.test(time)) {
            const dec = decodeWord(time);
            if (dec && !dec.includes('?') && !dec.startsWith('[') && !seenWords.has(dec)) {
              const rank = wordRankMap.has(dec) ? wordRankMap.get(dec) : 99999;
              seenWords.add(dec);
              caseVariants.push({ word: dec, b60: candCode, rank });
            }
          }
        }
      }
    }
    // Ưu tiên từ phổ biến của tiếng Việt lên trước
    caseVariants.sort((a, b) => a.rank - b.rank);
    const topCaseVariants = caseVariants.slice(0, 6);

    function renderChips(container, list, color) {
      if (!container) return;
      if (!list || list.length === 0) {
        container.innerHTML = `<span style="color:#666; font-style:italic;">(không có từ phù hợp)</span>`;
        return;
      }
      container.innerHTML = list.map(item =>
        `<button class="cyber-chip-btn" data-word="${item.word}" style="background:#000; color:${color}; border:1px solid ${color}; border-radius:3px; padding:1px 5px; font-size:10px; cursor:pointer; font-family:inherit; transition:all 0.1s;">${item.word} <span style="opacity:0.75; font-size:9px;">[${item.b60}]</span></button>`
      ).join('');
    }

    renderChips(sameConsEl, sameCons, '#00ffff');
    renderChips(sameRhymeEl, sameRhyme, '#ffea00');
    renderChips(sameRhymeToneEl, sameRhymeTone, '#00ff66');
    renderChips(sameLettersEl, topCaseVariants, '#ff77ff');
  }

  // --- 2. DEBOUNCE & SPACE TRIGGER FOR 60FPS TYPING ---
  let debounceTimer = null;

  if (quickInput) {
    quickInput.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => updateTutor(quickInput.value), 100);
    });
  }

  const txtDec = document.getElementById('text-input');
  if (txtDec) {
    txtDec.addEventListener('input', (e) => {
      clearTimeout(debounceTimer);
      const isSpaceOrPunct = e.data && /[\s.,;?!]/.test(e.data);
      if (isSpaceOrPunct) {
        const w = getWordUnderCursor(txtDec);
        if (w) updateTutor(w, 'vi');
      } else {
        debounceTimer = setTimeout(() => {
          const w = getWordUnderCursor(txtDec);
          if (w) updateTutor(w, 'vi');
        }, 150);
      }
    });

    txtDec.addEventListener('click', () => {
      const w = getWordUnderCursor(txtDec);
      if (w) updateTutor(w, 'vi');
    });

    txtDec.addEventListener('keyup', (e) => {
      if (e.key === ' ' || e.key === 'Enter' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        const w = getWordUnderCursor(txtDec);
        if (w) updateTutor(w, 'vi');
      }
    });
  }

  const txtEnc = document.getElementById('compressed-continuous-input') || document.getElementById('compressed-input');
  if (txtEnc) {
    txtEnc.addEventListener('click', () => {
      const w = getWordUnderCursor(txtEnc);
      if (w && w.length === 3) updateTutor(w, 'b60');
    });
    txtEnc.addEventListener('keyup', (e) => {
      if (e.key === ' ' || e.key === 'Enter' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        const w = getWordUnderCursor(txtEnc);
        if (w && w.length === 3) updateTutor(w, 'b60');
      }
    });
  }

  tutorCard.addEventListener('click', (e) => {
    const btn = e.target.closest('.cyber-chip-btn');
    if (btn && btn.dataset.word) {
      updateTutor(btn.dataset.word);
      if (quickInput) quickInput.value = btn.dataset.word;
    }
  });

  window.updateMnemonicTutorFromDecrypted = function() {
    if (!tutorVisible) return;
    const txtDec = document.getElementById('text-input');
    if (!txtDec) return;
    const val = txtDec.value || '';
    if (!val.trim()) return;
    let w = getWordUnderCursor(txtDec);
    if (!w) {
      const words = val.trim().split(/\s+/);
      w = words[words.length - 1];
    }
    if (w) updateTutor(w, 'vi');
  };

  // Initial load
  updateTutor('thành');
}

document.addEventListener('DOMContentLoaded', () => {
  initMnemonicTutor();
});
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  initMnemonicTutor();
}