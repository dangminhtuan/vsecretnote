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

function getToneMarkPath(tone, zone) {
  // Thay vì canh giữa ô, đẩy Ký hiệu dấu về góc Dưới-Trái (Co cụm vào tâm)
  const cx = zone.x + zone.w * 0.35; 
  const cy = zone.y + zone.h * 0.65;
  const r  = Math.min(zone.w, zone.h) * 0.35; 

  switch (tone) {
    case 0: // Ngang — Dấu bằng (=) gồm 2 gạch song song
      return `M${cx-r*0.4} ${cy-r*0.35} L${cx+r*0.4} ${cy-r*0.35} M${cx-r*0.4} ${cy+r*0.35} L${cx+r*0.4} ${cy+r*0.35}`;
    case 1: // Sắc ´ — chéo lên phải /
      return `M${cx-r*0.6} ${cy+r*0.7} L${cx+r*0.6} ${cy-r*0.7}`;
    case 2: // Huyền ` — chéo xuống phải \
      return `M${cx-r*0.6} ${cy-r*0.7} L${cx+r*0.6} ${cy+r*0.7}`;
    case 3: // Hỏi ̉ — móc cong (không chấm)
      return `M${cx-r*0.4} ${cy-r*0.2} C${cx-r*0.4} ${cy-r*0.9} ${cx+r*0.5} ${cy-r*0.9} ${cx+r*0.5} ${cy-r*0.1} C${cx+r*0.5} ${cy+r*0.4} ${cx} ${cy+r*0.2} ${cx} ${cy+r*0.8}`;
    case 4: // Ngã ˜ — sóng ngã cổ điển
      return `M${cx-r*0.7} ${cy+r*0.2} Q${cx-r*0.3} ${cy-r*0.7} ${cx} ${cy} Q${cx+r*0.3} ${cy+r*0.7} ${cx+r*0.7} ${cy-r*0.2}`;
    case 5: // Nặng . — chấm vuông
      const size = r*0.45;
      return `M${cx-size/2} ${cy-size/2} h${size} v${size} h-${size} Z`;
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
  allCapsFrame.style.display = 'none';
  titleFrame.style.display = 'none';

  if (!originalWord) return;

  if (originalWord.length > 0 && originalWord === originalWord.toUpperCase() && /[A-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠƯẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀỀỂỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪỬỮỰỲỴÝỶỸ]/.test(originalWord)) {
    allCapsFrame.style.display = 'block';
  } 
  else if (originalWord.length > 0 && originalWord[0] === originalWord[0].toUpperCase() && /[A-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠƯẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀỀỂỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪỬỮỰỲỴÝỶỸ]/.test(originalWord[0])) {
    titleFrame.style.display = 'block';
  }
}

// ─── Render ───────────────────────────────────────────────────────────────
function renderSVG(b60, originalWord) {
  const svg = document.getElementById('svg-main');
  svg.querySelectorAll('.glyph-path,.tone-mark').forEach(el => el.remove());
  
  updateCapitalization(originalWord);

  if (!baseFont || !b60 || (b60.length !== 3 && b60.length !== 4) || b60.startsWith('[')) return;

  const cleanB60 = (b60.startsWith('o') || b60.startsWith('O')) ? b60.slice(1) : b60;
  if (cleanB60.length !== 3) return;

  const [c1, c2, c3] = [cleanB60[0], cleanB60[1], cleanB60[2]];
  const chars = [c1, c2, c3];

  [0, 1, 2].forEach(i => {
    const d = getGlyphPath(chars[i], ZONES[i]);
    if (!d) return;
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', d);
    path.setAttribute('fill', COLORS[i]);
    path.classList.add('glyph-path');
    svg.appendChild(path);
  });

  const toneIdx = getToneIndex(c3);
  if (toneIdx >= 0) {
    const td = getToneMarkPath(toneIdx, TONE_ZONE);
    if (td) {
      const el = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      el.setAttribute('d', td);
      el.setAttribute('fill', toneIdx === 5 ? TONE_COLOR : 'none');
      el.setAttribute('stroke', TONE_COLOR);
      el.setAttribute('stroke-width', '60');
      el.setAttribute('stroke-linecap', toneIdx === 4 || toneIdx === 5 || toneIdx === 0 ? 'square' : 'round');
      el.classList.add('tone-mark');
      svg.appendChild(el);
    }
  }
}

// ─── Inputs ───────────────────────────────────────────────────────────────
const inWord = document.getElementById('input-word');
const inB60  = document.getElementById('input-b60');
const inTime = document.getElementById('input-time');
const selFont = document.getElementById('sel-font');

let _busy = false;
function sync(word, b60, time) {
  if (_busy) return; _busy = true;
  if (document.activeElement !== inWord) inWord.value = word;
  if (document.activeElement !== inB60)  inB60.value = b60;
  if (document.activeElement !== inTime) inTime.value = time;
  
  renderSVG(b60, inWord.value.trim()); 
  const cleanB60 = (b60 && (b60.startsWith('o') || b60.startsWith('O'))) ? b60.slice(1) : b60;
  updateButtonStates(inWord.value.trim(), cleanB60 ? cleanB60[2] : null);
  
  const preview = document.getElementById('ttf-preview');
  if (preview) preview.textContent = b60 || '';
  
  _busy = false;
}

function clearOn(el, fn) {
  el.addEventListener('keydown', e => { if (e.key==='Delete') { e.preventDefault(); el.value=''; fn(); }});
}

function fromWord() {
  let raw = inWord.value.trimStart();
  if (!raw) { sync('','',''); return; }
  
  // Chỉ cho phép 1 từ (chặn dấu cách và các từ phía sau)
  const w = raw.split(/\s+/)[0];
  if (inWord.value !== w && document.activeElement === inWord) {
    inWord.value = w;
  }
  
  const tc = encodeWord(w); 
  let b60 = timeToBase60(tc);
  
  const isAllCaps = w === w.toUpperCase() && /[A-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠƯẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀỀỂỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪỬỮỰỲỴÝỶỸ]/.test(w);
  const isTitle = w[0] === w[0].toUpperCase() && /[A-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠƯẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀỀỂỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪỬỮỰỲỴÝỶỸ]/.test(w[0]) && !isAllCaps;
  
  if (isAllCaps) b60 = 'O' + b60;
  else if (isTitle) b60 = 'o' + b60;

  sync(w, b60, tc);
}
function fromB60() {
  const b60 = inB60.value.trim();
  if (b60.length !== 3 && b60.length !== 4) { renderSVG('', ''); return; }
  
  let prefix = '';
  let coreB60 = b60;
  if (b60.startsWith('o') || b60.startsWith('O')) {
    prefix = b60[0];
    coreB60 = b60.slice(1);
  }
  if (coreB60.length !== 3) { renderSVG('', ''); return; }
  
  const tc = base60ToTime(coreB60);
  let decoded = tc ? decodeWord(tc) : '';
  if (decoded && !decoded.startsWith('[')) {
    if (prefix === 'o') decoded = decoded.charAt(0).toUpperCase() + decoded.slice(1);
    else if (prefix === 'O') decoded = decoded.toUpperCase();
  }
  sync(decoded, b60, tc || '');
}
function fromTime() {
  const tc = inTime.value.trim();
  if (tc.length !== 6) { renderSVG('', ''); return; }
  sync(decodeWord(tc), timeToBase60(tc), tc);
}

inWord.addEventListener('input', fromWord);
inB60.addEventListener('input', fromB60);
inTime.addEventListener('input', fromTime);
clearOn(inWord, fromWord); clearOn(inB60, fromB60); clearOn(inTime, fromTime);

selFont.addEventListener('change', (e) => loadFont(e.target.value));

// ─── Toolbar Logic ────────────────────────────────────────────────────────
window.setTone = function(newTone) {
  let w = inWord.value.trim();
  if (!w) return;
  const isAllCaps = w === w.toUpperCase() && /[A-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠƯẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀỀỂỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪỬỮỰỲỴÝỶỸ]/.test(w);
  const isTitle = w[0] === w[0].toUpperCase() && /[A-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠƯẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀỀỂỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪỬỮỰỲỴÝỶỸ]/.test(w[0]) && !isAllCaps;
  
  const { consonant, rhyme } = extractPhonetics(w);
  let newW = consonant + applyTone(rhyme, newTone);
  
  if (isAllCaps) newW = newW.toUpperCase();
  else if (isTitle) newW = newW.charAt(0).toUpperCase() + newW.slice(1);
  
  inWord.value = newW;
  fromWord();
};

window.setCase = function(type) {
  let w = inWord.value.trim();
  if (!w) return;
  w = w.toLowerCase(); 
  if (type === 'TITLE') w = w.charAt(0).toUpperCase() + w.slice(1);
  if (type === 'ALL') w = w.toUpperCase();
  
  inWord.value = w;
  fromWord();
};

loadFont(selFont.value);
