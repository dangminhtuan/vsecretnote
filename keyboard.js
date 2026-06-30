import { timeToBase60, base60ToTime, encodeWord, decodeWord } from './vcomp.js';
import { removeVietnameseTones } from './vcomp.js';
import { BASE60_MAPPING } from './data.js';

let dictionary = new Map();
let validVietnameseWords = new Set();

// Fetch dictionary
fetch('/syllables.json')
  .then(res => res.json())
  .then(data => {
    data.forEach(word => {
      validVietnameseWords.add(word);
      const [base] = removeVietnameseTones(word);
      if (!dictionary.has(base)) dictionary.set(base, []);
      dictionary.get(base).push(word);
    });
    console.log('Swipe Keyboard Dictionary loaded:', dictionary.size, 'base syllables');
  })
  .catch(err => console.error('Failed to load syllables.json', err));

const LAYOUT = [
  ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
  ['z', 'x', 'c', 'v', 'b', 'n', 'm']
];

class SwipeKeyboard {
  constructor() {
    this.activeTarget = null;
    this.isSwiping = false;
    this.swipePath = [];
    this.currentKeys = [];
    this.keyRects = [];
    this.buildUI();
    this.setupEvents();
    this.setupTargetListeners();
  }

  buildUI() {
    this.container = document.createElement('div');
    this.container.id = 'swipe-keyboard';
    this.container.style.display = 'none';

    this.suggestionsBar = document.createElement('div');
    this.suggestionsBar.id = 'vk-suggestions';
    this.container.appendChild(this.suggestionsBar);

    this.keysContainer = document.createElement('div');
    this.keysContainer.id = 'vk-keys-container';
    
    // Canvas for drawing swipe trail
    this.canvas = document.createElement('canvas');
    this.canvas.id = 'vk-canvas';
    this.ctx = this.canvas.getContext('2d');
    this.keysContainer.appendChild(this.canvas);

    this.keyElements = new Map();

    LAYOUT.forEach(row => {
      const rowEl = document.createElement('div');
      rowEl.className = 'vk-row';
      row.forEach(key => {
        const keyEl = document.createElement('div');
        keyEl.className = 'vk-key';
        keyEl.textContent = key;
        keyEl.dataset.key = key;
        this.keyElements.set(key, keyEl);
        rowEl.appendChild(keyEl);
      });
      this.keysContainer.appendChild(rowEl);
    });
    
    // Add space and backspace
    const bottomRow = document.createElement('div');
    bottomRow.className = 'vk-row';
    const spaceKey = document.createElement('div');
    spaceKey.className = 'vk-key vk-key-space';
    spaceKey.textContent = 'SPACE';
    spaceKey.dataset.key = ' ';
    const bkspKey = document.createElement('div');
    bkspKey.className = 'vk-key vk-key-action';
    bkspKey.innerHTML = '&larr;';
    bkspKey.dataset.key = 'Backspace';
    bottomRow.appendChild(spaceKey);
    bottomRow.appendChild(bkspKey);
    this.keyElements.set(' ', spaceKey);
    this.keyElements.set('Backspace', bkspKey);
    this.keysContainer.appendChild(bottomRow);

    this.container.appendChild(this.keysContainer);
    document.body.appendChild(this.container);
  }

  setupTargetListeners() {
    const txtDecrypted = document.getElementById('text-input');
    const txtCompressed = document.getElementById('compressed-input');
    
    const showKB = (e) => {
      this.activeTarget = e.target;
      this.show();
    };

    if(txtDecrypted) {
      txtDecrypted.addEventListener('focus', showKB);
      txtDecrypted.addEventListener('click', showKB);
    }
    if(txtCompressed) {
      txtCompressed.addEventListener('focus', showKB);
      txtCompressed.addEventListener('click', showKB);
    }
    
    // Hide keyboard if clicked outside
    document.addEventListener('pointerdown', (e) => {
      if (this.container.style.display !== 'none') {
        if (!this.container.contains(e.target) && e.target !== this.activeTarget) {
          this.hide();
        }
      }
    });
  }

  show() {
    if (!this.activeTarget) return;
    this.container.style.display = 'flex';
    
    // Vị trí cố định (fixed) ở dưới cùng màn hình thay vì absolute để không bị tràn màn hình
    this.container.style.position = 'fixed';
    this.container.style.bottom = '20px';
    this.container.style.top = 'auto';
    this.container.style.left = '50%';
    this.container.style.transform = 'translateX(-50%)';
    this.container.style.width = '90%';
    this.container.style.maxWidth = '800px';
    
    // Setup canvas size
    setTimeout(() => {
      this.canvas.width = this.keysContainer.clientWidth;
      this.canvas.height = this.keysContainer.clientHeight;
      this.updateKeyRects();
    }, 50);
  }

  updateKeyRects() {
    this.keyRects = [];
    this.keyElements.forEach((el, key) => {
      const rect = el.getBoundingClientRect();
      this.keyRects.push({
        key,
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
      });
    });
  }

  hide() {
    this.container.style.display = 'none';
    this.clearSuggestions();
  }

  setupEvents() {
    this.keysContainer.addEventListener('pointerdown', this.onPointerDown.bind(this));
    document.addEventListener('pointermove', this.onPointerMove.bind(this));
    document.addEventListener('pointerup', this.onPointerUp.bind(this));
    
    // Prevent default touch behaviors (scrolling, zooming) while swiping
    this.keysContainer.addEventListener('touchstart', e => {
      if(e.cancelable) e.preventDefault();
    }, {passive: false});
  }
  
  getKeyFromPoint(x, y) {
    let closestKey = null;
    let minDist = Infinity;
    this.keyRects.forEach(k => {
      const dist = Math.hypot(k.x - x, k.y - y);
      if (dist < minDist && dist < 45) { // 45px radius for forgiveness
        minDist = dist;
        closestKey = k.key;
      }
    });
    return closestKey;
  }

  onPointerDown(e) {
    if (!e.isPrimary && e.type !== 'mousedown' && e.type !== 'touchstart') return;
    
    // Extract coords (handle touch vs pointer/mouse)
    let cx = e.clientX;
    let cy = e.clientY;
    if (e.touches && e.touches.length > 0) {
      cx = e.touches[0].clientX;
      cy = e.touches[0].clientY;
    }

    const key = this.getKeyFromPoint(cx, cy);
    if (!key) return;
    
    this.keysContainer.setPointerCapture(e.pointerId);
    
    this.isSwiping = true;
    this.swipePath = [{x: cx, y: cy}];
    this.currentKeys = [key];
    this.highlightKey(key);
    this.drawTrail();
    
    // Immediate action for Space and Backspace
    if (key === ' ' || key === 'Backspace') {
       this.handleImmediateKey(key);
       this.isSwiping = false; // Don't swipe on space/bksp
    }
  }

  onPointerMove(e) {
    if (!this.isSwiping) return;
    
    let cx = e.clientX;
    let cy = e.clientY;
    if (e.touches && e.touches.length > 0) {
      cx = e.touches[0].clientX;
      cy = e.touches[0].clientY;
    }

    this.swipePath.push({x: cx, y: cy});
    
    const key = this.getKeyFromPoint(cx, cy);
    if (key && key !== ' ' && key !== 'Backspace') {
      const lastKey = this.currentKeys[this.currentKeys.length - 1];
      
      // Chỉ làm sáng (highlight) phím hiện tại đang chạm, tắt các phím cũ
      this.keyElements.forEach(el => el.classList.remove('active'));
      this.highlightKey(key);

      if (key !== lastKey) {
        this.currentKeys.push(key);
      }
    }
    this.drawTrail();
  }

  onPointerUp(e) {
    if (!this.isSwiping) return;
    this.isSwiping = false;
    this.keysContainer.releasePointerCapture(e.pointerId);
    this.processSwipe();
    
    // Clear highlights and trail
    this.keyElements.forEach(el => el.classList.remove('active'));
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.swipePath = [];
    this.currentKeys = [];
  }
  
  handleImmediateKey(key) {
    if (!this.activeTarget) return;
    const target = this.activeTarget;
    let val = target.value;
    let start = target.selectionStart;
    let end = target.selectionEnd;
    
    if (key === 'Backspace') {
       if (start === end && start > 0) {
         start--;
       }
       target.setRangeText('', start, end, 'end');
    } else if (key === ' ') {
       target.setRangeText(' ', start, end, 'end');
    }
    
    target.dispatchEvent(new Event('input'));
  }

  highlightKey(key) {
    const el = this.keyElements.get(key);
    if (el) {
      el.classList.add('active');
    }
  }

  drawTrail() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    if (this.swipePath.length < 2) return;
    
    const rect = this.keysContainer.getBoundingClientRect();
    
    this.ctx.beginPath();
    this.ctx.lineWidth = 4;
    this.ctx.strokeStyle = '#0f0';
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    this.ctx.shadowBlur = 10;
    this.ctx.shadowColor = '#0f0';

    this.swipePath.forEach((p, i) => {
      const x = p.x - rect.left;
      const y = p.y - rect.top;
      if (i === 0) this.ctx.moveTo(x, y);
      else this.ctx.lineTo(x, y);
    });
    
    this.ctx.stroke();
  }

  processSwipe() {
    const str = this.currentKeys.join('');
    if (str.length === 0) return;
    
    let suggestions = [];
    
    // --- GEOMETRIC WORD EXTRACTION (Douglas-Peucker) ---
    const corners = this.simplifyPath(this.swipePath, 25); // 25px epsilon
    const geoKeys = [];
    corners.forEach(p => {
       const k = this.getKeyFromPoint(p.x, p.y);
       if (k && k !== ' ' && k !== 'Backspace') {
          if (geoKeys.length === 0 || geoKeys[geoKeys.length - 1] !== k) {
             geoKeys.push(k);
          }
       }
    });
    const geoWord = geoKeys.join('');
    
    // If we extracted a short geometric word (like je0), add its permutations if valid Base60
    if (geoWord.length > 0 && geoWord.length <= 3) {
      let geoPerms = this.generatePermutations(geoWord);
      geoPerms.forEach(s => {
        let isValidBase60 = true;
        for (let char of s) {
          if (!BASE60_MAPPING.includes(char)) isValidBase60 = false;
        }
        if (isValidBase60) {
           try {
              const timeStr = base60ToTime(s);
              if (timeStr && !timeStr.includes('?')) {
                 const dec = decodeWord(timeStr);
                 if (dec && !dec.includes('?') && !dec.startsWith('[')) {
                    if (validVietnameseWords.has(dec)) {
                       suggestions.push({ text: s, type: 'b60' });
                    }
                 }
              }
           } catch(e) {}
        }
      });
    }
    
    if (geoWord.length > 0 && !suggestions.find(x => x.text === geoWord)) {
      suggestions.push({ text: geoWord, type: 'raw' });
    }
    // ---------------------------------------------------

    if (str.length <= 3) {
      let perms = this.generatePermutations(str);
      perms.forEach(s => {
        let isValidBase60 = true;
        for (let char of s) {
          if (!BASE60_MAPPING.includes(char)) isValidBase60 = false;
        }
        if (isValidBase60) {
           try {
              const timeStr = base60ToTime(s);
              if (timeStr && !timeStr.includes('?')) {
                 const dec = decodeWord(timeStr);
                 if (dec && !dec.includes('?') && !dec.startsWith('[')) {
                    if (validVietnameseWords.has(dec)) {
                       suggestions.push({ text: s, type: 'b60' });
                    }
                 }
              }
           } catch(e) {}
        }
      });
    } else {
      // 4+ keys -> Vietnamese dictionary match (Fuzzy Subsequence)
      let matchedBases = [];
      const normalizedStr = this.normalizeForSwipe(str);
      for (const [base, words] of dictionary.entries()) {
         const normalizedBase = this.normalizeForSwipe(base);
         if (normalizedBase[0] === normalizedStr[0]) {
            let i = 0, j = 0;
            while (i < normalizedBase.length && j < normalizedStr.length) {
               if (normalizedBase[i] === normalizedStr[j]) i++;
               j++;
            }
            if (i === normalizedBase.length) {
               matchedBases.push(base);
            }
         }
      }
      
      // Sort matches: Exact ends match first, then shorter words
      matchedBases.sort((a, b) => {
         const normA = this.normalizeForSwipe(a);
         const normB = this.normalizeForSwipe(b);
         const aEnd = normA[normA.length - 1] === normalizedStr[normalizedStr.length - 1] ? 0 : 1;
         const bEnd = normB[normB.length - 1] === normalizedStr[normalizedStr.length - 1] ? 0 : 1;
         if (aEnd !== bEnd) return aEnd - bEnd;
         return Math.abs(normA.length - normalizedStr.length) - Math.abs(normB.length - normalizedStr.length);
      });
      
      matchedBases.slice(0, 8).forEach(b => {
        if (!suggestions.find(x => x.text === b)) {
           dictionary.get(b).forEach(w => suggestions.push({ text: w, type: 'vi' }));
        }
      });
      
      if (suggestions.length === 0) {
        suggestions.push({ text: str, type: 'raw' });
      }
    }
    
    // Remove duplicates
    const uniqueSuggestions = [];
    const seen = new Set();
    suggestions.forEach(item => {
      if (!seen.has(item.text)) {
         seen.add(item.text);
         uniqueSuggestions.push(item);
      }
    });
    
    this.renderSuggestions(uniqueSuggestions);
  }
  
  simplifyPath(points, epsilon) {
    if (points.length <= 2) return points;
    let maxDist = 0;
    let index = 0;
    const start = points[0];
    const end = points[points.length - 1];
    
    for (let i = 1; i < points.length - 1; i++) {
        const pt = points[i];
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const mag2 = dx*dx + dy*dy;
        let dist = 0;
        if (mag2 === 0) {
           dist = Math.hypot(pt.x - start.x, pt.y - start.y);
        } else {
           let t = ((pt.x - start.x) * dx + (pt.y - start.y) * dy) / mag2;
           t = Math.max(0, Math.min(1, t));
           const closestX = start.x + t * dx;
           const closestY = start.y + t * dy;
           dist = Math.hypot(pt.x - closestX, pt.y - closestY);
        }
        
        if (dist > maxDist) {
            maxDist = dist;
            index = i;
        }
    }
    
    if (maxDist > epsilon) {
        const left = this.simplifyPath(points.slice(0, index + 1), epsilon);
        const right = this.simplifyPath(points.slice(index), epsilon);
        return left.slice(0, -1).concat(right);
    } else {
        return [start, end];
    }
  }

  normalizeForSwipe(str) {
    return str.normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '')
              .replace(/đ/g, 'd')
              .replace(/Đ/g, 'D');
  }

  generatePermutations(str) {
    if (str.length === 0) return [''];
    const first = str[0];
    const rest = this.generatePermutations(str.slice(1));
    const result = [];
    rest.forEach(r => {
      result.push(first.toLowerCase() + r);
      result.push(first.toUpperCase() + r);
    });
    return result;
  }

  renderSuggestions(suggestions) {
    this.suggestionsBar.innerHTML = '';
    if (suggestions.length === 0) return;
    
    const isCompressedTarget = this.activeTarget && this.activeTarget.id === 'compressed-input';
    
    suggestions.slice(0, 10).forEach(item => {
      const s = item.text;
      const type = item.type;
      const btn = document.createElement('button');
      btn.className = 'vk-suggestion-btn';
      
      let displayText = s;
      let insertText = s;
      
      let b60Equivalent = null;
      let vietnameseEquivalent = null;

      // If it's a base60 permutation or raw string, try to decode it
      if ((type === 'b60' || type === 'raw') && s.length <= 4 && s.match(/^[A-Za-z0-9]+$/)) {
          try {
              const timeStr = base60ToTime(s);
              if (timeStr && !timeStr.includes('?')) {
                  const dec = decodeWord(timeStr);
                  if (dec && !dec.includes('?') && !dec.startsWith('[')) {
                      vietnameseEquivalent = dec;
                  }
              }
          } catch(e) {}
      }

      // If it's a Vietnamese word or raw string, try to encode it
      if ((type === 'vi' || type === 'raw') && s.match(/^[A-Za-z0-9àáảãạâầấẩẫậăằắẳẵặèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ\s]+$/i)) {
          try {
              const b60 = timeToBase60(encodeWord(s));
              if (b60 && !b60.includes('?') && !b60.includes('"') && b60.length > 0) {
                  b60Equivalent = b60;
              }
          } catch(e) {}
      }

      if (isCompressedTarget) {
          if (b60Equivalent) {
              displayText = `<span style="color:#fff">${s}</span> <span style="font-size:0.7em;color:#0f0">[${b60Equivalent}]</span>`;
              insertText = b60Equivalent;
          } else if (vietnameseEquivalent) {
              displayText = `<span style="color:#fff">${s}</span> <span style="font-size:0.7em;color:#0f0">[${vietnameseEquivalent}]</span>`;
              insertText = s;
          }
      } else {
          if (vietnameseEquivalent) {
              displayText = `<span style="color:#fff">${s}</span> <span style="font-size:0.7em;color:#0f0">[${vietnameseEquivalent}]</span>`;
              insertText = vietnameseEquivalent;
          } else if (b60Equivalent) {
              displayText = `<span style="color:#fff">${s}</span> <span style="font-size:0.7em;color:#0f0">[${b60Equivalent}]</span>`;
              insertText = s;
          }
      }
      
      btn.innerHTML = displayText;
      
      // We use pointerdown instead of click so that it fires before focus is lost
      btn.addEventListener('pointerdown', (e) => {
        e.preventDefault(); 
        this.insertText(insertText + ' ');
        this.clearSuggestions();
      });
      this.suggestionsBar.appendChild(btn);
    });
  }
  
  clearSuggestions() {
    this.suggestionsBar.innerHTML = '';
  }
  
  insertText(text) {
    if (!this.activeTarget) return;
    const target = this.activeTarget;
    // ensure target remains focused
    target.focus();
    target.setRangeText(text, target.selectionStart, target.selectionEnd, 'end');
    target.dispatchEvent(new Event('input'));
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.swipeKeyboard = new SwipeKeyboard();
});
