import { encodeWord, timeToBase60, decodeWord, base60ToTime, BASE60_SS, applyTone, extractPhonetics } from './vcomp.js';
import * as opentype from 'opentype.js';

// ─── Zones (4 Khối) ────────────────────────────────────────────────────────
const ZONES = [
  { x: 50,  y: 550, w: 400, h: 400, ax: 1, ay: -1 },  // Bot-Left  (c1) → Dồn Lên, Phải
  { x: 550, y: 550, w: 400, h: 400, ax: -1, ay: -1 }, // Bot-Right (c2) → Dồn Lên, Trái
  { x: 50,  y: 50,  w: 400, h: 400, ax: 1, ay: 1 },   // Top-Left  (c3) → Dồn Xuống, Phải
];
const TONE_ZONE = { x: 550, y: 50, w: 400, h: 400 }; // Top-Right → Ký hiệu dấu thật

const COLORS = ['#ff7b72', '#7ee787', '#79c0ff'];
const TONE_COLOR = '#ffd700';

let baseFont = null;
const statusEl = document.getElementById('status');

// ─── Load font ────────────────────────────────────────────────────────────
async function loadFont(url) {
  try {
    statusEl.textContent = 'Đang tải font...';
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    baseFont = opentype.parse(await resp.arrayBuffer());
    statusEl.textContent = 'Font đã sẵn sàng ✓';
    statusEl.style.color = '#7ee787';
    fromWord(); // Render lại
  } catch (e) {
    statusEl.textContent = `Lỗi tải font: ${e.message}`;
    statusEl.style.color = '#ff7b72';
  }
}

// ─── Glyph helper ────────────────────────────────────────────────────────
function getGlyphPath(char, zone) {
  if (!baseFont || !char) return '';
  const PAD = 0.03; 
  const iW = zone.w * (1 - PAD * 2), iH = zone.h * (1 - PAD * 2);
  const iX = zone.x + zone.w * PAD,  iY = zone.y + zone.h * PAD;
  
  const p  = baseFont.getPath(char, 0, 0, 1000);
  const bb = p.getBoundingBox();
  const cW = bb.x2 - bb.x1, cH = bb.y2 - bb.y1;
  if (cW <= 0 || cH <= 0) return '';
  
  // Dùng chữ 'C' hoa làm mốc Scale, nhưng giới hạn tỷ lệ tối đa không vượt quá kích thước ô (tránh chữ j, g, p bị tràn mép)
  const ref = baseFont.getPath('C', 0, 0, 1000).getBoundingBox();
  const baseSc = Math.min(iW / (ref.x2 - ref.x1), iH / (ref.y2 - ref.y1));
  const sc = Math.min(baseSc, iW / cW, iH / cH);
  
  const scaledW = cW * sc;
  const scaledH = cH * sc;
  
  // Canh lề dồn vào tâm (Co cụm)
  let ox = iX + (iW - scaledW) / 2; // Default center
  if (zone.ax === -1) ox = iX;
  if (zone.ax === 1)  ox = iX + iW - scaledW;
  
  let oy = iY + (iH - scaledH) / 2; // Default center
  if (zone.ay === -1) oy = iY;
  if (zone.ay === 1)  oy = iY + iH - scaledH;

  const tx = v => ox + (v - bb.x1) * sc;
  const ty = v => oy + (v - bb.y1) * sc;
  
  let d = '';
  for (const c of p.commands) {
    if      (c.type==='M') d += `M${tx(c.x).toFixed(1)} ${ty(c.y).toFixed(1)} `;
    else if (c.type==='L') d += `L${tx(c.x).toFixed(1)} ${ty(c.y).toFixed(1)} `;
    else if (c.type==='Q') d += `Q${tx(c.x1).toFixed(1)} ${ty(c.y1).toFixed(1)} ${tx(c.x).toFixed(1)} ${ty(c.y).toFixed(1)} `;
    else if (c.type==='C') d += `C${tx(c.x1).toFixed(1)} ${ty(c.y1).toFixed(1)} ${tx(c.x2).toFixed(1)} ${ty(c.y2).toFixed(1)} ${tx(c.x).toFixed(1)} ${ty(c.y).toFixed(1)} `;
    else if (c.type==='Z') d += 'Z ';
  }
  return d;
}

// ─── Tone mark ────────────────────────────────────────────────────────────
function getToneIndex(c3char) {
  const idx = BASE60_SS.indexOf(c3char);
  if (idx < 0 || idx >= 36) return -1;
  return idx % 6; 
}

function getToneMarkPath(tone, zone, isQuadrantTopRight = false, isQuadrantTopLeft = false) {
  let cx = zone.x + zone.w * 0.5; 
  let cy = zone.y + zone.h * 0.5;
  const r = Math.min(zone.w, zone.h) * 0.38; 

  // Co cụm hướng tâm:
  // Nếu là góc Trên-Phải (↗) -> Dồn Trái (X) và Xuống (Y) về phía tâm giữa
  if (isQuadrantTopRight) {
    cx = zone.x + zone.w * 0.40; 
    cy = zone.y + zone.h * 0.60;
  }
  // Nếu là góc Trên-Trái (↖) (Loại 1) -> Dồn Phải (X) và Xuống (Y) về phía tâm giữa
  else if (isQuadrantTopLeft) {
    cx = zone.x + zone.w * 0.60; 
    cy = zone.y + zone.h * 0.60;
  }

  switch (tone) {
    case 0: // Ngang — Dấu bằng (=) gồm 2 gạch song song thanh mảnh, tách rời rõ ràng
      const gap = r * 0.40;
      const len = r * 0.65;
      return `M${cx - len} ${cy - gap} L${cx + len} ${cy - gap} M${cx - len} ${cy + gap} L${cx + len} ${cy + gap}`;
    case 1: // Sắc ´ — chéo lên phải /
      return `M${cx - r*0.6} ${cy + r*0.7} L${cx + r*0.6} ${cy - r*0.7}`;
    case 2: // Huyền ` — chéo xuống phải \
      return `M${cx - r*0.6} ${cy - r*0.7} L${cx + r*0.6} ${cy + r*0.7}`;
    case 3: // Hỏi ̉ — móc cong
      return `M${cx - r*0.4} ${cy - r*0.2} C${cx - r*0.4} ${cy - r*0.9} ${cx + r*0.5} ${cy - r*0.9} ${cx + r*0.5} ${cy - r*0.1} C${cx + r*0.5} ${cy + r*0.4} ${cx} ${cy + r*0.2} ${cx} ${cy + r*0.8}`;
    case 4: // Ngã ˜ — sóng ngã
      return `M${cx - r*0.7} ${cy + r*0.2} Q${cx - r*0.3} ${cy - r*0.7} ${cx} ${cy} Q${cx + r*0.3} ${cy + r*0.7} ${cx + r*0.7} ${cy - r*0.2}`;
    case 5: // Nặng . — chấm vuông
      const size = r * 0.5;
      return `M${cx - size/2} ${cy - size/2} h${size} v${size} h-${size} Z`;
    default: return '';
  }
}

// ─── Button States ───────────────────────────────────────────────────────
function updateButtonStates(originalWord, c3char) {
  if (!originalWord) {
    document.querySelectorAll('.toolbar button').forEach(b => b.classList.remove('active'));
    return;
  }
  
  // Case state
  const isAllCaps = originalWord === originalWord.toUpperCase() && /[A-ZÀ-Ỹ]/.test(originalWord);
  const isTitle = originalWord[0] === originalWord[0].toUpperCase() && /[A-ZÀ-Ỹ]/.test(originalWord[0]) && !isAllCaps;
  
  let caseType = 'LOWER';
  if (isAllCaps) caseType = 'ALL';
  else if (isTitle) caseType = 'TITLE';
  
  document.querySelectorAll('#group-case button').forEach(b => {
    b.classList.toggle('active', b.getAttribute('data-val') === caseType);
  });
  
  // Tone state
  const tone = c3char ? getToneIndex(c3char) : -1;
  document.querySelectorAll('#group-tone button').forEach(b => {
    b.classList.toggle('active', parseInt(b.getAttribute('data-val')) === tone);
  });
}

// ─── Capitalization Logic ────────────────────────────────────────────────
function updateCapitalization(originalWord) {
  const allCapsFrame = document.getElementById('frame-allcaps');
  const titleFrame = document.getElementById('frame-titlecase');
  if (allCapsFrame) allCapsFrame.style.display = 'none';
  if (titleFrame) titleFrame.style.display = 'none';
}

// ─── Bố cục Tam giác 3 Ký tự (C1, C2, C3) ───────────────────────────

// Phương án 1: C3 ở Trên (Đỉnh nón)
const TRI_TOP_ZONES = {
  c3: { x: 280, y: 60,  w: 440, h: 420, ax: 0,  ay: 1  }, // Đỉnh trên: C3 (dồn tâm X, dồn xuống)
  c1: { x: 70,  y: 520, w: 410, h: 420, ax: 1,  ay: -1 }, // Đáy trái:  C1 (dồn phải, dồn lên)
  c2: { x: 520, y: 520, w: 410, h: 420, ax: -1, ay: -1 }, // Đáy phải:  C2 (dồn trái, dồn lên)
};

// Phương án 2: C3 ở Dưới (Chân đế)
const TRI_BOT_ZONES = {
  c1: { x: 70,  y: 60,  w: 410, h: 420, ax: 1,  ay: 1  }, // Đáy trên trái: C1 (dồn phải, dồn xuống)
  c2: { x: 520, y: 60,  w: 410, h: 420, ax: -1, ay: 1  }, // Đáy trên phải: C2 (dồn trái, dồn xuống)
  c3: { x: 280, y: 520, w: 440, h: 420, ax: 0,  ay: -1 }, // Đỉnh dưới:     C3 (dồn tâm X, dồn lên)
};

function addGlyphToSVG(svg, char, zone, color) {
  const d = getGlyphPath(char, zone);
  if (!d) return;
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', d);
  path.setAttribute('fill', color);
  path.classList.add('glyph-path');
  svg.appendChild(path);
}

function parseSingleWord(w) {
  if (!w) return null;
  const tc = encodeWord(w);
  let b60 = timeToBase60(tc);
  const isAllCaps = w === w.toUpperCase() && /[A-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠƯẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀỀỂỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪỬỮỰỲỴÝỶỸ]/.test(w);
  const isTitle = w[0] === w[0].toUpperCase() && /[A-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠƯẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀỀỂỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪỬỮỰỲỴÝỶỸ]/.test(w[0]) && !isAllCaps;
  let prefix = '';
  if (isAllCaps) prefix = 'O';
  else if (isTitle) prefix = 'I';
  
  const fullB60 = prefix + b60;
  return {
    word: w,
    time: tc,
    b60: fullB60,
    coreB60: b60,
    isAllCaps,
    isTitle,
    isUpper: isAllCaps || isTitle,
    c1: b60[0],
    c2: b60[1],
    c3: b60[2]
  };
}

function parseSingleB60(token) {
  if (!token || token.length < 3) return null;
  let prefix = '';
  let coreB60 = token;
  if (token.startsWith('I') || token.startsWith('O')) {
    prefix = token[0];
    coreB60 = token.slice(1);
  }
  if (coreB60.length !== 3) return null;
  const tc = base60ToTime(coreB60);
  let decoded = tc ? decodeWord(tc) : '';
  if (decoded && !decoded.startsWith('[')) {
    if (prefix === 'I') decoded = decoded.charAt(0).toUpperCase() + decoded.slice(1);
    else if (prefix === 'O') decoded = decoded.toUpperCase();
    return parseSingleWord(decoded);
  }
  return null;
}

function parseSingleTime(tc) {
  if (!tc || tc.length !== 6) return null;
  const decoded = decodeWord(tc);
  if (decoded && !decoded.startsWith('[')) {
    return parseSingleWord(decoded);
  }
  return null;
}

let currentWords = [];
let currentIndex = 0;

function renderCurrentWord() {
  const svg = document.getElementById('svg-tri-demo');
  if (svg) svg.querySelectorAll('.glyph-path').forEach(el => el.remove());

  const labelEl = document.getElementById('demo-variant-label');
  const posEl = document.getElementById('demo-word-pos');
  const guideEl = document.getElementById('svg-tri-guide');
  const btnPrev = document.getElementById('btn-prev-word');
  const btnNext = document.getElementById('btn-next-word');
  const chipsEl = document.getElementById('demo-word-chips');

  if (!currentWords || currentWords.length === 0) {
    if (labelEl) labelEl.textContent = 'Chưa có từ nào';
    if (posEl) posEl.textContent = '';
    if (btnPrev) { btnPrev.disabled = true; btnPrev.style.opacity = '0.2'; btnPrev.style.cursor = 'default'; btnPrev.style.borderColor = '#30363d'; btnPrev.style.color = '#666'; }
    if (btnNext) { btnNext.disabled = true; btnNext.style.opacity = '0.2'; btnNext.style.cursor = 'default'; btnNext.style.borderColor = '#30363d'; btnNext.style.color = '#666'; }
    if (chipsEl) chipsEl.innerHTML = '';
    updateButtonStates('', null);
    return;
  }

  if (currentIndex < 0) currentIndex = 0;
  if (currentIndex >= currentWords.length) currentIndex = currentWords.length - 1;

  const cur = currentWords[currentIndex];

  // Nav buttons
  if (btnPrev) {
    const canPrev = currentIndex > 0;
    btnPrev.disabled = !canPrev;
    btnPrev.style.opacity = canPrev ? '1' : '0.25';
    btnPrev.style.cursor = canPrev ? 'pointer' : 'default';
    btnPrev.style.borderColor = canPrev ? '#58a6ff' : '#30363d';
    btnPrev.style.color = canPrev ? '#58a6ff' : '#666';
  }
  if (btnNext) {
    const canNext = currentIndex < currentWords.length - 1;
    btnNext.disabled = !canNext;
    btnNext.style.opacity = canNext ? '1' : '0.25';
    btnNext.style.cursor = canNext ? 'pointer' : 'default';
    btnNext.style.borderColor = canNext ? '#58a6ff' : '#30363d';
    btnNext.style.color = canNext ? '#58a6ff' : '#666';
  }

  // Header word position
  if (posEl) {
    if (currentWords.length > 1) {
      posEl.textContent = `[ ${currentIndex + 1} / ${currentWords.length} ] "${cur.word}"`;
    } else {
      posEl.textContent = `"${cur.word}"`;
    }
  }

  // Triangle geometry & orientation based strictly on C3 character case:
  // Nếu ký tự C3 là chữ HOA (/[A-Z]/) -> C3 ở Dưới (Tam giác ngược ▽)
  // Nếu ký tự C3 là chữ thường / số   -> C3 ở Trên (Tam giác thuận △)
  const isC3Upper = /[A-Z]/.test(cur.c3);
  if (isC3Upper) {
    if (labelEl) {
      labelEl.textContent = `▽ C3 là HOA "${cur.c3}" (C3 ở Dưới)`;
      labelEl.style.color = '#7ee787';
    }
    if (guideEl) guideEl.setAttribute('points', '70,60 930,60 500,950');
    if (svg && baseFont) {
      addGlyphToSVG(svg, cur.c1, TRI_BOT_ZONES.c1, COLORS[0]); // C1 trên-trái
      addGlyphToSVG(svg, cur.c2, TRI_BOT_ZONES.c2, COLORS[1]); // C2 trên-phải
      addGlyphToSVG(svg, cur.c3, TRI_BOT_ZONES.c3, COLORS[2]); // C3 dưới
    }
  } else {
    if (labelEl) {
      labelEl.textContent = `△ C3 là thường "${cur.c3}" (C3 ở Trên)`;
      labelEl.style.color = '#58a6ff';
    }
    if (guideEl) guideEl.setAttribute('points', '500,50 930,940 70,940');
    if (svg && baseFont) {
      addGlyphToSVG(svg, cur.c3, TRI_TOP_ZONES.c3, COLORS[2]); // C3 trên
      addGlyphToSVG(svg, cur.c1, TRI_TOP_ZONES.c1, COLORS[0]); // C1 dưới-trái
      addGlyphToSVG(svg, cur.c2, TRI_TOP_ZONES.c2, COLORS[1]); // C2 dưới-phải
    }
  }

  // Update Toolbar Tone & Case state for cur.word
  updateButtonStates(cur.word, cur.c3);

  // Render Word Chips
  if (chipsEl) {
    if (currentWords.length > 1) {
      chipsEl.innerHTML = currentWords.map((item, idx) => {
        const active = idx === currentIndex;
        return `<button type="button" onclick="selectWordIndex(${idx})" style="padding: 3px 9px; font-size: 11px; font-family: monospace; border-radius: 12px; cursor: pointer; border: 1px solid ${active ? '#ff00ea' : '#30363d'}; background: ${active ? '#ff00ea' : '#161b22'}; color: ${active ? '#000' : '#8b949e'}; font-weight: ${active ? 'bold' : 'normal'}; transition: all .15s; white-space: nowrap;">${item.word}</button>`;
      }).join('');
    } else {
      chipsEl.innerHTML = '';
    }
  }
}

window.selectWordIndex = function(idx) {
  if (idx < 0 || idx >= currentWords.length) return;
  currentIndex = idx;
  renderCurrentWord();
};

window.prevWord = function() {
  if (currentIndex > 0) {
    currentIndex--;
    renderCurrentWord();
  }
};

window.nextWord = function() {
  if (currentIndex < currentWords.length - 1) {
    currentIndex++;
    renderCurrentWord();
  }
};

// ─── Inputs ───────────────────────────────────────────────────────────────
const inWord = document.getElementById('input-word');
const inB60  = document.getElementById('input-b60');
const inTime = document.getElementById('input-time');
const selFont = document.getElementById('sel-font');

function clearOn(el, fn) {
  el.addEventListener('keydown', e => { if (e.key==='Delete') { e.preventDefault(); el.value=''; fn(); }});
}

function fromWord() {
  const raw = inWord.value.trim();
  if (!raw) {
    currentWords = [];
    currentIndex = 0;
    if (document.activeElement !== inB60) inB60.value = '';
    if (document.activeElement !== inTime) inTime.value = '';
    renderCurrentWord();
    return;
  }
  const rawWords = raw.split(/\s+/).filter(Boolean);
  currentWords = rawWords.map(w => parseSingleWord(w)).filter(Boolean);
  if (currentIndex >= currentWords.length) currentIndex = Math.max(0, currentWords.length - 1);

  if (document.activeElement !== inB60) {
    inB60.value = currentWords.map(c => c.b60).join(' ');
  }
  if (document.activeElement !== inTime) {
    inTime.value = currentWords.map(c => c.time).join(' ');
  }

  renderCurrentWord();
}

function fromB60() {
  const raw = inB60.value.trim();
  if (!raw) {
    currentWords = [];
    currentIndex = 0;
    if (document.activeElement !== inWord) inWord.value = '';
    if (document.activeElement !== inTime) inTime.value = '';
    renderCurrentWord();
    return;
  }
  const tokens = raw.split(/\s+/).filter(Boolean);
  currentWords = tokens.map(t => parseSingleB60(t)).filter(Boolean);
  if (currentIndex >= currentWords.length) currentIndex = Math.max(0, currentWords.length - 1);

  if (document.activeElement !== inWord) {
    inWord.value = currentWords.map(c => c.word).join(' ');
  }
  if (document.activeElement !== inTime) {
    inTime.value = currentWords.map(c => c.time).join(' ');
  }

  renderCurrentWord();
}

function fromTime() {
  const raw = inTime.value.trim();
  if (!raw) {
    currentWords = [];
    currentIndex = 0;
    if (document.activeElement !== inWord) inWord.value = '';
    if (document.activeElement !== inB60) inB60.value = '';
    renderCurrentWord();
    return;
  }
  const tokens = raw.split(/\s+/).filter(Boolean);
  currentWords = tokens.map(t => parseSingleTime(t)).filter(Boolean);
  if (currentIndex >= currentWords.length) currentIndex = Math.max(0, currentWords.length - 1);

  if (document.activeElement !== inWord) {
    inWord.value = currentWords.map(c => c.word).join(' ');
  }
  if (document.activeElement !== inB60) {
    inB60.value = currentWords.map(c => c.b60).join(' ');
  }

  renderCurrentWord();
}

inWord.addEventListener('input', fromWord);
inB60.addEventListener('input', fromB60);
inTime.addEventListener('input', fromTime);
clearOn(inWord, fromWord); clearOn(inB60, fromB60); clearOn(inTime, fromTime);

document.getElementById('btn-prev-word')?.addEventListener('click', window.prevWord);
document.getElementById('btn-next-word')?.addEventListener('click', window.nextWord);

document.addEventListener('keydown', (e) => {
  if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) return;
  if (e.key === 'ArrowLeft') {
    e.preventDefault();
    window.prevWord();
  } else if (e.key === 'ArrowRight') {
    e.preventDefault();
    window.nextWord();
  }
});

selFont.addEventListener('change', (e) => loadFont(e.target.value));

// ─── Toolbar Logic ────────────────────────────────────────────────────────
window.setTone = function(newTone) {
  if (!currentWords || currentWords.length === 0 || !currentWords[currentIndex]) return;
  const cur = currentWords[currentIndex];
  const { consonant, rhyme } = extractPhonetics(cur.word);
  let newW = consonant + applyTone(rhyme, newTone);
  if (cur.isAllCaps) newW = newW.toUpperCase();
  else if (cur.isTitle) newW = newW.charAt(0).toUpperCase() + newW.slice(1);

  currentWords[currentIndex] = parseSingleWord(newW);
  inWord.value = currentWords.map(c => c.word).join(' ');
  inB60.value = currentWords.map(c => c.b60).join(' ');
  inTime.value = currentWords.map(c => c.time).join(' ');
  renderCurrentWord();
};

window.setCase = function(type) {
  if (!currentWords || currentWords.length === 0 || !currentWords[currentIndex]) return;
  let curW = currentWords[currentIndex].word.toLowerCase();
  if (type === 'TITLE') curW = curW.charAt(0).toUpperCase() + curW.slice(1);
  if (type === 'ALL') curW = curW.toUpperCase();

  currentWords[currentIndex] = parseSingleWord(curW);
  inWord.value = currentWords.map(c => c.word).join(' ');
  inB60.value = currentWords.map(c => c.b60).join(' ');
  inTime.value = currentWords.map(c => c.time).join(' ');
  renderCurrentWord();
};

loadFont(selFont.value);
