import { timeToBase60, base60ToTime, encodeWord, decodeWord } from './vcomp.js';
import { removeVietnameseTones } from './vcomp.js';
import { BASE60_MAPPING } from './data.js';

const NEXT_WORD_PREDICTIONS = {
  'chiến': ['tranh', 'đấu', 'lược', 'sĩ', 'thuật', 'tuyến'],
  'công': ['nghệ', 'ty', 'nhân', 'tác', 'lý', 'an', 'cộng', 'chúng'],
  'cộng': ['đồng', 'hòa', 'sản', 'tác'],
  'tạm': ['thời', 'biệt', 'dừng', 'nghỉ', 'ứng'],
  'đuôi': ['chuột', 'cáo', 'ngựa'],
  'bàn': ['phím', 'bạc', 'giao', 'chải', 'luận', 'cờ'],
  'làm': ['việc', 'quen', 'sao', 'ơn', 'bạn', 'phiền'],
  'xin': ['chào', 'lỗi', 'cảm', 'phép', 'chữ'],
  'cảm': ['ơn', 'thấy', 'giác', 'xúc', 'tạ', 'tình'],
  'ngôn': ['ngữ', 'từ', 'luận', 'tình'],
  'quản': ['lý', 'trị', 'gia', 'đốc'],
  'hệ': ['thống', 'điều', 'quả', 'sinh', 'trọng'],
  'thông': ['tin', 'báo', 'minh', 'qua', 'thường', 'số'],
  'nhân': ['viên', 'sự', 'vật', 'loại', 'cách', 'chứng'],
  'phát': ['triển', 'hiện', 'minh', 'ngôn', 'sóng', 'động'],
  'máy': ['tính', 'móc', 'bay', 'ảnh', 'chủ'],
  'việt': ['nam', 'kiều', 'ngữ', 'dã'],
  'hôm': ['nay', 'qua', 'kia'],
  'ngày': ['mai', 'kia', 'tháng', 'nào'],
  'bây': ['giờ'],
  'bao': ['giờ', 'lâu', 'nhiêu', 'gồm', 'bọc'],
  'trang': ['web', 'chủ', 'phục', 'trí'],
  '_default': ['và', 'là', 'của', 'có', 'không', 'những', 'để', 'một', 'được', 'với', 'cho', 'trong', 'đã', 'này']
};

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
  ['Mode', 'z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.']
];

class SwipeKeyboard {
  constructor() {
    this.activeTarget = null;
    this.isSwiping = false;
    this.swipePath = [];
    this.currentKeys = [];
    this.keyRects = [];
    this.typingMode = 'normal';
    this.pauseTimer = null;
    this.hoveredKey = null;
    
    const savedState = localStorage.getItem('vk_state');
    if (savedState) {
       try {
          this.savedPos = JSON.parse(savedState);
          this.hasBeenDragged = true;
       } catch (e) {
          this.hasBeenDragged = false;
       }
    } else {
       this.hasBeenDragged = false;
    }
    
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
    
    // Swipe-to-scroll logic
    this.isDraggingSugg = false;
    this.startXSugg = 0;
    this.scrollLeftSugg = 0;
    this.hasScrolledSugg = false;
    
    this.suggestionsBar.addEventListener('pointerdown', (e) => {
       this.isDraggingSugg = true;
       this.hasScrolledSugg = false;
       this.startXSugg = e.pageX - this.suggestionsBar.offsetLeft;
       this.scrollLeftSugg = this.suggestionsBar.scrollLeft;
    });
    this.suggestionsBar.addEventListener('pointerleave', () => this.isDraggingSugg = false);
    this.suggestionsBar.addEventListener('pointerup', () => this.isDraggingSugg = false);
    this.suggestionsBar.addEventListener('pointermove', (e) => {
       if (!this.isDraggingSugg) return;
       const x = e.pageX - this.suggestionsBar.offsetLeft;
       const walk = (x - this.startXSugg) * 1.5;
       if (Math.abs(walk) > 5) this.hasScrolledSugg = true;
       this.suggestionsBar.scrollLeft = this.scrollLeftSugg - walk;
    });
    
    this.container.appendChild(this.suggestionsBar);

    this.keysContainer = document.createElement('div');
    this.keysContainer.id = 'vk-keys-container';
    this.keysContainer.style.position = 'relative';

    this.bubble = document.createElement('div');
    this.bubble.className = 'vk-bubble';
    this.keysContainer.appendChild(this.bubble);
    
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
        keyEl.textContent = key === 'Mode' ? '🎯' : key;
        keyEl.dataset.key = key;
        this.keyElements.set(key, keyEl);
        rowEl.appendChild(keyEl);
      });
      this.keysContainer.appendChild(rowEl);
    });
    
    // Add a header/toolbar to the keyboard (and make it a drag handle)
    const toolbar = document.createElement('div');
    toolbar.className = 'vk-toolbar';
    toolbar.style.display = 'flex';
    toolbar.style.justifyContent = 'space-between';
    toolbar.style.padding = '5px 10px 10px 10px';
    toolbar.style.cursor = 'move'; // Indicate draggable
    toolbar.style.userSelect = 'none'; // Prevent text selection while dragging
    toolbar.style.flexShrink = '0';
    
    // Dragging logic
    let isDragging = false;
    let dragStartX = 0;
    let dragStartY = 0;
    let initialLeft = 0;
    let initialTop = 0;

    toolbar.addEventListener('pointerdown', (e) => {
      if (e.target.tagName === 'BUTTON') return;
      if (window.innerWidth <= 768) return; // Disable drag on mobile
      isDragging = true;
      this.hasBeenDragged = true;
      dragStartX = e.clientX;
      dragStartY = e.clientY;
      const rect = this.container.getBoundingClientRect();
      initialLeft = rect.left;
      initialTop = rect.top;
      
      // Remove transform so we can position absolutely using left/top safely
      this.container.style.transform = 'none';
      this.container.style.bottom = 'auto';
      this.container.style.left = `${initialLeft}px`;
      this.container.style.top = `${initialTop}px`;
      
      this.container.style.transition = 'none'; // disable smooth transition if any
      e.preventDefault();
    });

    document.addEventListener('pointermove', (e) => {
      if (!isDragging) return;
      const dx = e.clientX - dragStartX;
      const dy = e.clientY - dragStartY;
      this.container.style.left = `${initialLeft + dx}px`;
      this.container.style.top = `${initialTop + dy}px`;
    });

    document.addEventListener('pointerup', () => {
      if (isDragging) {
         isDragging = false;
         this.container.style.transition = '';
         this.saveState();
      }
    });

    // Label for toolbar
    const dragLabel = document.createElement('span');
    dragLabel.textContent = '≡ KÉO THẢ';
    dragLabel.style.fontSize = '12px';
    dragLabel.style.color = '#55ff55';
    dragLabel.style.display = 'flex';
    dragLabel.style.alignItems = 'center';

    const rightControls = document.createElement('div');
    rightControls.style.display = 'flex';
    rightControls.style.gap = '10px';
    
    const disableBtn = document.createElement('button');
    disableBtn.textContent = 'Tắt (Mở: Click đúp)';
    disableBtn.className = 'cyber-btn';
    disableBtn.style.padding = '4px 10px';
    disableBtn.style.fontSize = '12px';
    disableBtn.onclick = (e) => {
       e.stopPropagation();
       this.isDisabled = true;
       this.hide();
    };
    
    const closeBtn = document.createElement('button');
    closeBtn.textContent = 'ĐÓNG ✕';
    closeBtn.className = 'cyber-btn';
    closeBtn.style.padding = '4px 10px';
    closeBtn.style.fontSize = '12px';
    closeBtn.onclick = (e) => {
       e.stopPropagation();
       this.hide();
    };
    
    rightControls.appendChild(disableBtn);
    rightControls.appendChild(closeBtn);
    toolbar.appendChild(dragLabel);
    toolbar.appendChild(rightControls);
    this.container.appendChild(toolbar);

    // Add space, enter and backspace
    const bottomRow = document.createElement('div');
    bottomRow.className = 'vk-row';
    const spaceKey = document.createElement('div');
    spaceKey.className = 'vk-key vk-key-space';
    spaceKey.textContent = 'SPACE';
    spaceKey.dataset.key = ' ';
    
    const enterKey = document.createElement('div');
    enterKey.className = 'vk-key vk-key-action';
    enterKey.innerHTML = '&crarr;';
    enterKey.dataset.key = 'Enter';
    
    const bkspKey = document.createElement('div');
    bkspKey.className = 'vk-key vk-key-action';
    bkspKey.innerHTML = '&larr;';
    bkspKey.dataset.key = 'Backspace';
    
    bottomRow.appendChild(spaceKey);
    bottomRow.appendChild(enterKey);
    bottomRow.appendChild(bkspKey);
    this.keyElements.set(' ', spaceKey);
    this.keyElements.set('Enter', enterKey);
    this.keyElements.set('Backspace', bkspKey);
    this.keysContainer.appendChild(bottomRow);

    this.container.appendChild(this.keysContainer);
    document.body.appendChild(this.container);
  }

  setupTargetListeners() {
    const txtDecrypted = document.getElementById('text-input');
    const txtCompressed = document.getElementById('compressed-input');
    const txtTime = document.getElementById('time-input');
    
    const showKB = (e) => {
      if (this.isDisabled) return;
      this.activeTarget = e.target;
      this.show();
    };

    const forceShowKB = (e) => {
      this.isDisabled = false;
      this.activeTarget = e.target;
      this.show();
    };

    if(txtDecrypted) {
      txtDecrypted.addEventListener('focus', showKB);
      txtDecrypted.addEventListener('click', showKB);
      txtDecrypted.addEventListener('dblclick', forceShowKB);
    }
    if(txtCompressed) {
      txtCompressed.addEventListener('focus', showKB);
      txtCompressed.addEventListener('click', showKB);
      txtCompressed.addEventListener('dblclick', forceShowKB);
    }
    if(txtTime) {
      txtTime.addEventListener('focus', showKB);
      txtTime.addEventListener('click', showKB);
      txtTime.addEventListener('dblclick', forceShowKB);
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
    if (!this.activeTarget || this.isDisabled) return;
    this.container.style.display = 'flex';
    this.predictNextWords();
    
    const isMobile = window.innerWidth <= 768;
    if (isMobile) {
      this.container.style.position = 'absolute';
      const rect = this.activeTarget.getBoundingClientRect();
      this.container.style.top = (rect.bottom + window.scrollY + 5) + 'px';
      this.container.style.left = '50%';
      this.container.style.bottom = 'auto';
      this.container.style.transform = 'translateX(-50%)';
      this.container.style.width = '95%';
      this.container.style.maxWidth = 'none';
    } else {
      // Vị trí cố định (fixed) ở dưới cùng màn hình thay vì absolute để không bị tràn màn hình
      // Chỉ reset vị trí mặc định nếu bàn phím chưa từng bị người dùng kéo thả
      if (!this.hasBeenDragged) {
        this.container.style.position = 'fixed';
        this.container.style.bottom = '20px';
        this.container.style.top = 'auto';
        this.container.style.left = '50%';
        this.container.style.transform = 'translateX(-50%)';
        this.container.style.width = '90%';
        this.container.style.maxWidth = '800px';
      } else if (this.savedPos) {
        this.container.style.position = 'fixed';
        this.container.style.transform = 'none';
        if (this.savedPos.left) this.container.style.left = this.savedPos.left;
        if (this.savedPos.top) this.container.style.top = this.savedPos.top;
        if (this.savedPos.bottom) this.container.style.bottom = this.savedPos.bottom;
        if (this.savedPos.width) this.container.style.width = this.savedPos.width;
        if (this.savedPos.height) this.container.style.height = this.savedPos.height;
        this.savedPos = null; // Apply once
      }
    }
    
    // Auto-scroll target into view so it's not obscured by keyboard
    setTimeout(() => {
       if (this.activeTarget) {
           this.activeTarget.scrollIntoView({ behavior: 'smooth', block: 'center' });
       }
    }, 100);
    
    // Setup canvas size observer
      if (!this.resizeObserver) {
        this.resizeObserver = new ResizeObserver(() => {
          if (this.canvas && this.keysContainer.clientWidth > 0) {
            this.canvas.width = this.keysContainer.clientWidth;
            this.canvas.height = this.keysContainer.clientHeight;
            this.updateKeyRects();
            
            if (this.hasBeenDragged && this.container.style.display !== 'none') {
                this.saveState();
            }
          }
        });
        this.resizeObserver.observe(this.keysContainer);
      }
    
    setTimeout(() => {
      this.canvas.width = this.keysContainer.clientWidth;
      this.canvas.height = this.keysContainer.clientHeight;
      this.updateKeyRects();
      // Tự động cuộn trang để không che khuất textarea
      const kbRect = this.container.getBoundingClientRect();
      const targetRect = this.activeTarget.getBoundingClientRect();
      if (targetRect.bottom > kbRect.top - 10) {
        window.scrollBy({ top: (targetRect.bottom - kbRect.top) + 20, behavior: 'smooth' });
      }
    }, 50);
  }

  updateKeyRects() {
    this.keyRects = [];
    if (!this.keysContainer) return;
    const containerRect = this.keysContainer.getBoundingClientRect();
    this.keyElements.forEach((el, key) => {
      const rect = el.getBoundingClientRect();
      this.keyRects.push({
        key,
        x: (rect.left - containerRect.left) + rect.width / 2,
        y: (rect.top - containerRect.top) + rect.height / 2
      });
    });
  }

  saveState() {
     if (!this.container) return;
     const state = {
        left: this.container.style.left,
        top: this.container.style.top,
        bottom: this.container.style.bottom,
        width: this.container.style.width,
        height: this.container.style.height
     };
     localStorage.setItem('vk_state', JSON.stringify(state));
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

    const containerRect = this.keysContainer.getBoundingClientRect();
    cx = cx - containerRect.left;
    cy = cy - containerRect.top;

    const key = this.getKeyFromPoint(cx, cy);
    if (!key) return;
    
    this.keysContainer.setPointerCapture(e.pointerId);
    
    this.isSwiping = true;
    this.swipePath = [{x: cx, y: cy}];
    this.currentKeys = [key];
    this.highlightKey(key);
    this.drawTrail();
    
    // Immediate action for Space, Enter and Backspace
    if (key === ' ' || key === 'Enter' || key === 'Backspace' || key === 'Mode' || key === ',' || key === '.') {
       this.handleImmediateKey(key);
       this.isSwiping = false; // Don't swipe on space/enter/bksp
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

    const containerRect = this.keysContainer.getBoundingClientRect();
    cx = cx - containerRect.left;
    cy = cy - containerRect.top;

    this.swipePath.push({x: cx, y: cy});
    
    const key = this.getKeyFromPoint(cx, cy);
    const isSpecial = key === ' ' || key === 'Enter' || key === 'Backspace' || key === 'Mode' || key === ',' || key === '.';
    
    if (key && !isSpecial) {
      if (this.typingMode === 'normal') {
         if (key !== this.hoveredKey) {
            this.hoveredKey = key;
            this.bubble.classList.remove('show');
            if (this.pauseTimer) clearTimeout(this.pauseTimer);
            
            this.pauseTimer = setTimeout(() => {
               const lastKey = this.currentKeys[this.currentKeys.length - 1];
               if (key !== lastKey) {
                  this.currentKeys.push(key);
               }
               const kRect = this.keyRects.find(r => r.key === key);
               if (kRect) {
                  this.bubble.textContent = key;
                  this.bubble.style.left = kRect.x + 'px';
                  this.bubble.style.top = (kRect.y - 140) + 'px';
                  this.bubble.classList.add('show');
               }
            }, 150);
         }
      } else {
         const lastKey = this.currentKeys[this.currentKeys.length - 1];
         if (key !== lastKey) {
           this.currentKeys.push(key);
         }
      }
      
      this.keyElements.forEach(el => el.classList.remove('active'));
      this.highlightKey(key);
    }
    this.drawTrail();
  }

  onPointerUp(e) {
    if (!this.isSwiping) return;
    this.isSwiping = false;
    this.keysContainer.releasePointerCapture(e.pointerId);
    
    if (this.pauseTimer) clearTimeout(this.pauseTimer);
    if (this.bubble) this.bubble.classList.remove('show');
    this.hoveredKey = null;
    
    if (this.currentKeys.length === 1) {
       const key = this.currentKeys[0];
       const isSpecial = key === ' ' || key === 'Enter' || key === 'Backspace' || key === 'Mode' || key === ',' || key === '.';
       if (!isSpecial) {
          this.insertText(key);
          this.clearSuggestions();
       }
    } else {
       this.processSwipe();
    }
    
    // Clear highlights and trail
    this.keyElements.forEach(el => el.classList.remove('active'));
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.swipePath = [];
    this.currentKeys = [];
  }
  
  handleImmediateKey(key) {
    if (key === 'Mode') {
      this.typingMode = this.typingMode === 'normal' ? 'speed' : 'normal';
      const modeEl = this.keyElements.get('Mode');
      if (modeEl) modeEl.textContent = this.typingMode === 'normal' ? '🎯' : '⚡';
      return;
    }
    if (!this.activeTarget) return;
    if (key === ',' || key === '.') {
      this.insertText(key);
      return;
    }
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
    } else if (key === 'Enter') {
       target.setRangeText('\n', start, end, 'end');
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
    
    this.ctx.beginPath();
    this.ctx.lineWidth = 4;
    this.ctx.strokeStyle = '#0f0';
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    this.ctx.shadowBlur = 10;
    this.ctx.shadowColor = '#0f0';

    this.swipePath.forEach((p, i) => {
      const x = p.x;
      const y = p.y;
      if (i === 0) this.ctx.moveTo(x, y);
      else this.ctx.lineTo(x, y);
    });
    this.ctx.stroke();
  }

  processSwipe() {
    const str = this.currentKeys.join('');
    if (str.length === 0) return;
    
    let suggestions = [];
    
    let geoKeys = [];
    if (this.typingMode === 'speed') {
       // --- GEOMETRIC WORD EXTRACTION (Douglas-Peucker) ---
       const corners = this.simplifyPath(this.swipePath, 25); // 25px epsilon
       corners.forEach(p => {
          const k = this.getKeyFromPoint(p.x, p.y);
          const isSpecial = k === ' ' || k === 'Enter' || k === 'Backspace' || k === 'Mode' || k === ',' || k === '.';
          if (k && !isSpecial) {
             if (geoKeys.length === 0 || geoKeys[geoKeys.length - 1] !== k) {
                geoKeys.push(k);
             }
          }
       });
    } else {
       // Normal mode: trust user pauses entirely, no simplification
       geoKeys = [...this.currentKeys];
    }
    
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
    }
    
    // Always check Vietnamese dictionary for length >= 2 (so 'da' shows 'đã')
    if (str.length >= 2) {
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
      
      // Sort matches: Exact geoWord > Exact swipe > Ends match > Length closer to swipe
      matchedBases.sort((a, b) => {
         const normA = this.normalizeForSwipe(a);
         const normB = this.normalizeForSwipe(b);
         
         const isAGeo = normA === geoWord;
         const isBGeo = normB === geoWord;
         if (isAGeo && !isBGeo) return -1;
         if (!isAGeo && isBGeo) return 1;
         
         const isAExact = normA === normalizedStr;
         const isBExact = normB === normalizedStr;
         if (isAExact && !isBExact) return -1;
         if (!isAExact && isBExact) return 1;
         
         const aEnd = normA[normA.length - 1] === normalizedStr[normalizedStr.length - 1] ? 0 : 1;
         const bEnd = normB[normB.length - 1] === normalizedStr[normalizedStr.length - 1] ? 0 : 1;
         if (aEnd !== bEnd) return aEnd - bEnd;
         
         return Math.abs(normA.length - normalizedStr.length) - Math.abs(normB.length - normalizedStr.length);
      });
      
      matchedBases.slice(0, 8).forEach(b => {
         dictionary.get(b).forEach(w => suggestions.push({ text: w, type: 'vi' }));
      });
    }
    
    if (suggestions.length === 0) {
      suggestions.push({ text: str, type: 'raw' });
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
      
      // We use pointerup so we can differentiate between a tap and a scroll drag
      btn.addEventListener('pointerup', (e) => {
        if (!this.hasScrolledSugg) {
           e.preventDefault(); 
           this.insertText(insertText + ' ');
           // Delay clear so global pointerdown doesn't hide keyboard
           setTimeout(() => this.clearSuggestions(), 10);
        }
      });
      // Prevent focus loss during drag or tap
      btn.addEventListener('pointerdown', (e) => e.preventDefault());
      this.suggestionsBar.appendChild(btn);
    });
  }
  
    clearSuggestions() {
      this.suggestionsBar.innerHTML = '';
      this.predictNextWords();
    }
    
    predictNextWords() {
      if (!this.activeTarget) {
         this.renderSuggestions(NEXT_WORD_PREDICTIONS['_default'].map(w => ({ text: w, type: 'vi' })));
         return;
      }
      const val = this.activeTarget.value;
      const start = this.activeTarget.selectionStart;
      const beforeCursor = val.substring(0, start).trim();
      const match = beforeCursor.match(/([a-zA-ZàáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđĐ]+)$/i);
      let suggestions = [];
      if (match) {
         const lastWord = match[1].toLowerCase();
         if (NEXT_WORD_PREDICTIONS[lastWord]) {
            suggestions = NEXT_WORD_PREDICTIONS[lastWord].map(w => ({ text: w, type: 'vi' }));
         }
      }
      
      if (suggestions.length === 0) {
         suggestions = NEXT_WORD_PREDICTIONS['_default'].map(w => ({ text: w, type: 'vi' }));
      }
      
      suggestions.push({ text: ',', type: 'raw' });
      suggestions.push({ text: '.', type: 'raw' });
      suggestions.push({ text: '?', type: 'raw' });
      
      this.renderSuggestions(suggestions);
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
