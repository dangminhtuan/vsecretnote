import { timeToBase60, base60ToTime, encodeWord, decodeWord } from './vcomp.js';
import { removeVietnameseTones, applyTone } from './vcomp.js';

import { BASE60_MAPPING, REAL_VIETNAMESE_WORDS, VOWEL_KEY_MAPPING, ABBREV_DICT, ENGLISH_DICT } from './data.js';

let dictionary = new Map();
let unaccentedDictionary = new Map();
let base60Dictionary = new Map();
let shortcutDictionary = new Map();
let validVietnameseWords = new Set();

function stripDiacritics(str) {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D');
}

class DictionaryManager {
    constructor() {
        this.registeredDicts = new Map();
        this.activeDictIds = new Set();
        this.loadActiveDicts();
    }

    loadActiveDicts() {
        try {
            const saved = localStorage.getItem('vk_active_dicts');
            if (saved) {
                this.activeDictIds = new Set(JSON.parse(saved));
            } else {
                this.activeDictIds = new Set(['dict_vn_core', 'dict_vn_full', 'dict_user_custom']);
            }
        } catch(e) {
            this.activeDictIds = new Set(['dict_vn_core', 'dict_vn_full', 'dict_user_custom']);
        }
    }

    saveActiveDicts() {
        localStorage.setItem('vk_active_dicts', JSON.stringify(Array.from(this.activeDictIds)));
    }

    register(dict) {
        try {
            const overrideData = localStorage.getItem('vk_dict_data_' + dict.id);
            if (overrideData) {
                const parsed = JSON.parse(overrideData);
                if (parsed.shortcuts) {
                    if (!dict.data) dict.data = {};
                    dict.data.shortcuts = parsed.shortcuts;
                }
            }
        } catch(e) {}
        this.registeredDicts.set(dict.id, dict);
    }

    updateDictShortcuts(id, shortcuts) {
        const dict = this.registeredDicts.get(id);
        if (dict) {
            if (!dict.data) dict.data = {};
            dict.data.shortcuts = shortcuts;
            localStorage.setItem('vk_dict_data_' + id, JSON.stringify({ shortcuts }));
            this.rebuildMaps();
        }
    }

    toggle(id, forceState) {
        if (forceState !== undefined) {
            if (forceState) this.activeDictIds.add(id);
            else this.activeDictIds.delete(id);
        } else {
            if (this.activeDictIds.has(id)) this.activeDictIds.delete(id);
            else this.activeDictIds.add(id);
        }
        this.saveActiveDicts();
        this.rebuildMaps();
    }

    rebuildMaps() {
        dictionary.clear();
        unaccentedDictionary.clear();
        base60Dictionary.clear();
        validVietnameseWords.clear();
        shortcutDictionary.clear();

        const active = Array.from(this.activeDictIds)
            .map(id => this.registeredDicts.get(id))
            .filter(d => d)
            .sort((a, b) => b.priority - a.priority);

        active.forEach(dict => {
            if (dict.data.words) {
                dict.data.words.forEach(word => {
                    validVietnameseWords.add(word);
                    
                    const [base] = removeVietnameseTones(word);
                    if (!dictionary.has(base)) dictionary.set(base, []);
                    if (!dictionary.get(base).includes(word)) dictionary.get(base).push(word);
                    
                    const unaccented = stripDiacritics(word);
                    if (!unaccentedDictionary.has(unaccented)) unaccentedDictionary.set(unaccented, []);
                    if (!unaccentedDictionary.get(unaccented).includes(word)) unaccentedDictionary.get(unaccented).push(word);
                    
                    try {
                        let b60 = timeToBase60(encodeWord(word));
                        if (b60) {
                            let b60Lower = b60.toLowerCase();
                            if (!base60Dictionary.has(b60Lower)) base60Dictionary.set(b60Lower, []);
                            if (!base60Dictionary.get(b60Lower).includes(word)) base60Dictionary.get(b60Lower).push(word);
                        }
                    } catch(e) {}
                });
            }

            if (dict.data.shortcuts) {
                for (const [key, values] of Object.entries(dict.data.shortcuts)) {
                    const k = key.toLowerCase();
                    if (!shortcutDictionary.has(k)) shortcutDictionary.set(k, []);
                    values.forEach(v => {
                        if (!shortcutDictionary.get(k).includes(v)) shortcutDictionary.get(k).push(v);
                    });
                }
            }
        });

        console.log(`Dictionaries rebuilt! Active: ${active.length}. Total shortcuts: ${shortcutDictionary.size}. Total words: ${validVietnameseWords.size}`);
        
        // Update UI if dictionary view is open
        if (window.vkInstance && typeof window.vkInstance.renderMultiDictList === 'function') {
            window.vkInstance.renderMultiDictList();
        }
    }
}

const dictManager = new DictionaryManager();
window.dictManager = dictManager; // Expose to global for debug/UI

// Register core VN dict
const coreWords = [...new Set([...REAL_VIETNAMESE_WORDS])].filter(w => w);
dictManager.register({
    id: 'dict_vn_core',
    name: 'Tiếng Việt Cơ bản',
    priority: 10,
    data: { words: coreWords }
});

// Register user custom dictionary (from legacy storage)
let userShortcuts = {};
try {
    const data = localStorage.getItem('vk_custom_dict');
    if (data) userShortcuts = JSON.parse(data);
} catch(e) {}

dictManager.register({
    id: 'dict_user_custom',
    name: 'Từ điển Cá nhân',
    priority: 100,
    data: { shortcuts: userShortcuts }
});

dictManager.register({
    id: 'dict_abbrev',
    name: 'Từ điển Viết tắt',
    priority: 200,
    data: { shortcuts: ABBREV_DICT }
});


dictManager.rebuildMaps();

// Fetch others asynchronously
fetch('/syllables.json').then(r => r.json()).then(data => {
    dictManager.register({ id: 'dict_vn_full', name: 'Tiếng Việt Đầy đủ', priority: 5, data: { words: data } });
    dictManager.rebuildMaps();
}).catch(e => console.error(e));

dictManager.register({
    id: 'dict_en_core',
    name: 'Tiếng Anh (Cơ bản)',
    priority: 4,
    data: { words: ENGLISH_DICT }
});
dictManager.rebuildMaps();

fetch('/dict_zh.json').then(r => r.json()).then(dict => {
    dictManager.register(dict);
    dictManager.rebuildMaps();
}).catch(e => console.error(e));

const LAYOUT_WEB = [
  ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
  ['Shift', 'z', 'x', 'c', 'v', 'b', 'n', 'm', 'Backspace'],
  ['?!=', ',', ' ', '.', 'Search', 'Enter']
];

const LAYOUT_ANDROID = [
  ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
  ['Shift', 'z', 'x', 'c', 'v', 'b', 'n', 'm', 'Backspace'],
  ['?!=', ',', ' ', '.', 'Search', 'Enter']
];

class SecretNoteKeyboard {
  constructor(config = {}) {
    this.config = Object.assign({ theme: 'web' }, config);
    this.activeTarget = null;
    this.isDisabled = true; // Hidden by default; toggled by ⌨️ button
    this.isSwiping = false;
    this.swipeSuggestions = null;
    this.swipePath = [];
    this.currentKeys = [];
    this.keyRects = [];
    
    this.pauseTimer = null;
      this.activePointerId = null;
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
    
    this.customDictionary = {};
    this.loadCustomDictionary();
    
    this.buildUI();
    
    this.setupEvents();
    this.setupTargetListeners();
  }

  loadCustomDictionary() {
    try {
        const data = localStorage.getItem('vk_custom_dict');
        if (data) {
            this.customDictionary = JSON.parse(data);
        }
    } catch(e) {
        this.customDictionary = {};
    }
  }

  saveCustomDictionary() {
    localStorage.setItem('vk_custom_dict', JSON.stringify(this.customDictionary));
    if (window.dictManager) {
        window.dictManager.register({
            id: 'dict_user_custom',
            name: 'Từ điển Cá nhân',
            priority: 100,
            data: { shortcuts: this.customDictionary }
        });
        window.dictManager.rebuildMaps();
    }
  }

  buildUI() {
    this.container = document.createElement('div');
    this.container.id = 'swipe-keyboard';
    this.container.className = 'gboard-wrapper theme-' + this.config.theme;
    this.container.style.zIndex = '1000';

    
      // Top bar for actions
      this.topBar = document.createElement('div');
      this.topBar.className = 'vk-topbar';
      this.topBar.style.display = 'flex';
      this.topBar.style.justifyContent = 'space-between';
      this.topBar.style.padding = '5px 10px';
      this.topBar.style.background = '#1e1e1e';
      this.topBar.style.borderBottom = '1px solid #333';
      this.topBar.style.cursor = 'move';
      this.topBar.innerHTML = `
         <div class="vk-drag-handle" style="color:#0f0; font-family:monospace;">= KÉO THẢ</div>
         <div style="display:flex; gap:10px; align-items:center;">
             <button id="vk-toggle-btn" style="background:transparent; color:#0f0; border:1px solid #0f0; padding:2px 8px; cursor:pointer;">TẮT</button>
             <button id="vk-close-btn" style="background:transparent; color:#0f0; border:1px solid #0f0; padding:2px 8px; cursor:pointer;">ĐÓNG X</button>
         </div>
      `;
      this.container.appendChild(this.topBar);

      this.container.innerHTML = `
      <!-- Suggestion Bar -->
      <div id="vk-suggestions" class="gb-suggestion-bar">
         <div id="vk-sugg-wrapper" style="display: flex; flex-grow: 1; overflow-x: auto; scrollbar-width: none;"></div>
         <div class="vk-action-group" style="display: flex;">
             <div class="gb-action-btn gb-dict-btn" title="Từ điển cá nhân" style="font-size: 18px;">⚙️</div>
             <div class="gb-action-btn gb-cb-btn" title="vSecretNote">📋</div>
         </div>
      </div>
      
      <!-- Keyboard Keys -->
      <div id="vk-keyboard-wrapper" style="display: flex; flex-direction: column;">
         <div id="vk-keys-container" class="gb-keys" style="position: relative;">
             <div class="vk-bubble"></div>
             <canvas id="vk-canvas"></canvas>
             <!-- Row elements will be appended here -->
         </div>
      </div>
      
      <!-- Clipboard View Overlay -->
      <div class="vk-clipboard-view" style="display: none;">
          <div class="vk-clipboard-topbar">
              <button class="vk-cb-back-btn">⬅️</button>
              <span class="vk-cb-title">Clipboard</span>
              <div style="flex: 1;"></div>
              <button class="vk-cb-tag-view-btn" style="padding: 2px 8px; font-size: 13px; font-weight: bold; background: rgba(52,199,89,0.2); border: 1px solid #34C759; color: #34C759; border-radius: 12px; cursor: pointer; outline: none; margin-right: 15px;">🏷️ Tags</button>
              <button class="vk-cb-toggle-btn">
                  <span style="font-size: 20px; color: #5F6368;">✎</span>
              </button>
          </div>
          <div class="vk-clipboard-grid"></div>
      </div>
    `;

    // Append inline after the #text-input
    if (typeof document !== 'undefined') {
        const textInputGroup = document.querySelector('.input-group textarea#text-input');
        if (textInputGroup) {
            textInputGroup.parentNode.insertBefore(this.container, textInputGroup.nextSibling);
        } else {
            document.body.appendChild(this.container);
        }
    }

    // Map DOM references
    this.suggestionsBar = this.container.querySelector('#vk-suggestions');
    this.suggWrapper = this.container.querySelector('#vk-sugg-wrapper');
    this.suggestionContainer = this.suggWrapper; // Android specific alias
    
    this.keyboardWrapper = this.container.querySelector('#vk-keyboard-wrapper');
    this.keysContainer = this.container.querySelector('#vk-keys-container');
    this.bubble = this.container.querySelector('.vk-bubble');
    this.canvas = this.container.querySelector('#vk-canvas');
    this.ctx = this.canvas.getContext('2d');
    
    this.clipboardView = this.container.querySelector('.vk-clipboard-view');
    
    // Dictionary Views
    
    // Append settings wrapper to body
    if (typeof document !== 'undefined') {
        this.settingsWrapper = document.createElement('div');
        this.settingsWrapper.className = 'vk-settings-wrapper theme-' + this.config.theme;
        document.body.appendChild(this.settingsWrapper);
        this.settingsWrapper.innerHTML = `
      <!-- Dictionary List View Overlay -->
      <div class="vk-dict-view" style="display: none; position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: var(--bg-color, #1e1e1e); z-index: 900; flex-direction: column;">
          <div class="vk-clipboard-topbar">
              <button class="vk-dict-back-btn">⬅️</button>
              <select class="vk-dict-selector" style="background:#2c2c2e;color:#fff;border:1px solid #555;border-radius:4px;padding:2px 5px;font-size:14px;max-width:150px;"></select>
              <div style="flex: 1;"></div>
              <button class="vk-open-multi-dict-btn" style="font-size: 16px; margin-right: 5px; background: none; border: none; cursor: pointer;" title="Quản lý bộ từ điển">📚</button>
              <button class="vk-dict-import-btn" style="font-size: 16px; margin-right: 5px; background: none; border: none; cursor: pointer;" title="Nhập (Import) từ file">📂</button>
              <button class="vk-dict-export-btn" style="font-size: 16px; margin-right: 5px; background: none; border: none; cursor: pointer;" title="Lưu (Export) ra file">💾</button>
              <button class="vk-dict-add-btn" style="font-size: 20px; background: none; border: none; cursor: pointer;" title="Thêm từ mới">➕</button>
          </div>
          <div style="padding: 10px;">
              <input type="text" class="vk-dict-search" placeholder="🔍 Tìm kiếm..." style="width:100%; padding: 8px; border-radius: 20px; border: 1px solid #555; background: #2c2c2e; color: #fff; outline: none;">
          </div>
          <div class="vk-dict-list" style="flex: 1; overflow-y: auto; padding: 10px;"></div>
      </div>

      
      <!-- Multi Dictionary Manager Overlay -->
      <div class="vk-multi-dict-view" style="display: none; position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: var(--bg-color, #1e1e1e); z-index: 905; flex-direction: column;">
          <div class="vk-clipboard-topbar">
              <button class="vk-multi-dict-back-btn">⬅️</button>
              <span class="vk-cb-title">Quản lý Từ Điển</span>
          </div>
          <div class="vk-multi-dict-list" style="flex: 1; overflow-y: auto; padding: 10px;"></div>
      </div>

      <!-- Dictionary Edit View Overlay -->
      <div class="vk-dict-edit-view" style="display: none; position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: var(--bg-color, #1e1e1e); z-index: 901; flex-direction: column;">
          <div class="vk-clipboard-topbar">
              <button class="vk-dict-edit-back-btn">⬅️</button>
              <span class="vk-cb-title">Thêm từ mới</span>
              <div style="flex: 1;"></div>
              <button class="vk-dict-save-btn" style="font-size: 14px; font-weight: bold; color: #1A73E8; background: none; border: none; cursor: pointer; padding: 5px 10px;">LƯU</button>
          </div>
          <div style="padding: 15px; flex: 1; overflow-y: auto;">
              <div style="margin-bottom: 15px;">
                  <label style="font-size: 12px; color: #aaa;">Shortcut (Tùy chọn)</label>
                  <input type="text" class="vk-dict-shortcut-input" placeholder="Ví dụ: xh" style="width:100%; padding: 10px; margin-top: 5px; border: 1px solid #555; background: #2c2c2e; color: #fff; border-radius: 8px; outline: none; font-size: 16px;">
              </div>
              <div>
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                      <label style="font-size: 12px; color: #aaa;">Từ hiển thị</label>
                      <button class="vk-dict-add-word-btn" style="background: none; border: none; color: #1A73E8; font-weight: bold; cursor: pointer; padding: 5px;">+ Thêm dòng</button>
                  </div>
                  <div class="vk-dict-words-container" style="display: flex; flex-direction: column; gap: 10px;">
                      <input type="text" class="vk-dict-word-input" placeholder="Ví dụ: Xã hội" style="width:100%; padding: 10px; border: 1px solid #555; background: #2c2c2e; color: #fff; border-radius: 8px; outline: none; font-size: 16px;">
                  </div>
              </div>
          </div>
      </div>
      

        `;
    }

    this.dictView = this.settingsWrapper.querySelector('.vk-dict-view');
    this.dictEditView = this.settingsWrapper.querySelector('.vk-dict-edit-view');

    // Event Listeners for UI
    const cbBtn = this.container.querySelector('.gb-cb-btn');
    if (cbBtn) cbBtn.onclick = () => { this.toggleClipboard(); };
    
    const dictBtn = this.container.querySelector('.gb-dict-btn');
    if (dictBtn) dictBtn.onclick = () => { this.toggleDictView(); };

    this.clipboardView.querySelector('.vk-cb-back-btn').addEventListener('click', () => {
        this.toggleClipboard();
    });
    
    this.cbTagViewBtn = this.clipboardView.querySelector('.vk-cb-tag-view-btn');
    if (this.cbTagViewBtn) {
        this.cbTagViewBtn.addEventListener('click', () => {
            this.isTagViewMode = !this.isTagViewMode;
            this.currentNetworkFilter = null;
            this.linkingSourceNote = null;
            this.renderClipboard();
        });
    }
    
    this.setupDictionaryEvents();

    // Suggestion Bar scrolling logic
    this.setupSuggestionScroll();

    // Render Keyboard Rows
    this.keyElements = new Map();
    const layoutToUse = this.config.theme === 'web' ? LAYOUT_WEB : LAYOUT_ANDROID;
    layoutToUse.forEach((row, rowIndex) => {
      const rowEl = document.createElement('div');
      rowEl.className = 'gb-row';
      
      if (this.config.theme === 'android') {
          if (rowIndex === 2) rowEl.classList.add('gb-row-padding-1');
      } else {
          if (rowIndex === 1) rowEl.classList.add('gb-row-padding-1');
      }
      
      row.forEach(key => {
        const keyEl = document.createElement('button');
        keyEl.className = 'gb-key';
        keyEl.dataset.key = key;

        if (key === '?!=') {
            keyEl.classList.add('gb-special');
            keyEl.innerHTML = '<span style="font-size: 12px; font-weight: bold;">?!</span>';
        } else if (key === 'Shift') {
            keyEl.classList.add('gb-special');
            keyEl.innerHTML = '<span style="font-size: 14px;">\u21E7</span>';
        } else if (key === 'Backspace') {
            keyEl.classList.add('gb-special');
            keyEl.innerHTML = '<span style="font-size: 14px;">\u232B</span>';
        } else if (key === ',' || key === '.') {
            keyEl.classList.add('gb-special');
            keyEl.textContent = key;
        } else if (key === ' ') {
            keyEl.classList.add('gb-space');
            keyEl.innerHTML = '<span style="font-size: 11px; font-weight: 500;">Ti\u1ebfng Vi\u1ec7t</span>';
        } else if (key === 'Search') {
            keyEl.classList.add('gb-special');
            keyEl.innerHTML = '<span style="font-size: 14px;">\uD83D\uDD0D</span>';
        } else if (key === 'Enter') {
            keyEl.classList.add('gb-special', 'gb-w-medium', 'gb-enter');
            keyEl.innerHTML = '<span style="font-size: 14px;">\u21B5</span>';
        } else {
            keyEl.textContent = key;
            if (key >= '1' && key <= '9') {
                const numHints = { '1': 'Sắc', '2': 'Huyền', '3': 'Hỏi', '4': 'Ngã', '5': 'Nặng', '6': 'dấu', '7': 'móc', '8': '•━•', '9': '⌫1' };
                keyEl.dataset.hint = numHints[key] || '';
            } else if (VOWEL_KEY_MAPPING[key]) {
                keyEl.dataset.hint = VOWEL_KEY_MAPPING[key];
            }
        }

        this.keyElements.set(key, keyEl);
        rowEl.appendChild(keyEl);
      });
      this.keysContainer.appendChild(rowEl);
    });
  }

  setupSuggestionScroll() {
    this.isDraggingSugg = false;
    this.isShiftActive = false;
    this.currentTapWord = '';
    this.lastGeoWord = '';
    this.forcedIndices = [];
    this.startXSugg = 0;
    this.scrollLeftSugg = 0;
    this.hasScrolledSugg = false;
    this.notesData = [];
    this.loadNotes();
    this.isClipboardOpen = false;
    this.isTagViewMode = false;
    this.initGlobalCopyListener();
    
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
  }

  toggleClipboard() {
      if (this.isClipboardOpen) {
          this.clipboardView.style.display = 'none';
          this.isClipboardOpen = false;
      } else {
          this.clipboardView.style.display = 'flex';
          this.isClipboardOpen = true;
          this.renderClipboard();
      }
  }

  updateDebugLog() {
      if (document.body.classList.contains('sandbox-mode')) {
          const debugLog = document.getElementById('sandbox-debug-log');
          if (debugLog) {
              let logData = '';
              if (this.lastUiSuggestions && this.lastUiSuggestions.length > 0) {
                  logData += `UI Suggestions: ${this.lastUiSuggestions.join(' | ')}\n---\n`;
              }
              if (this.lastSwipeRes) {
                  const dpLog = this.lastSwipeRes.suggestions.slice(0, 30).map((s, i) => `${i+1}. [${s.type}] ${s.text} (score: ${s.score || 0})`).join('\n');
                  const pW = this.lastCommittedWord ? this.lastCommittedWord.trim().toLowerCase() : 'null';
                  logData += `GeoFull: ${this.lastSwipeRes.geoWord}\nGeoCorners: ${this.lastSwipeRes.geoWordCorners || 'N/A'}\nForcedKeys: ${this.lastSwipeRes.forcedKeysStr || 'none'}\nTotal: ${this.lastSwipeRes.suggestions.length}\nPrevWord: ${pW}\n---\n${dpLog}`;
              }
              debugLog.value = logData;
          }
      }
  }

  initGlobalCopyListener() {
      document.addEventListener('copy', (e) => {
          let text = window.getSelection().toString();
          if (!text && document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')) {
              text = document.activeElement.value.substring(document.activeElement.selectionStart, document.activeElement.selectionEnd);
          }
          
          if (text) {
              this.addTemporaryNote(text);
              
              // Show a brief toast notification
              let toast = document.getElementById('vk-toast');
              if (!toast) {
                  toast = document.createElement('div');
                  toast.id = 'vk-toast';
                  toast.style.position = 'fixed';
                  toast.style.bottom = '100px';
                  toast.style.left = '50%';
                  toast.style.transform = 'translateX(-50%)';
                  toast.style.background = 'rgba(0,0,0,0.8)';
                  toast.style.color = 'white';
                  toast.style.padding = '8px 16px';
                  toast.style.borderRadius = '20px';
                  toast.style.zIndex = '9999';
                  toast.style.fontSize = '14px';
                  toast.style.pointerEvents = 'none';
                  toast.style.transition = 'opacity 0.3s';
                  document.body.appendChild(toast);
              }
              toast.textContent = 'Đã lưu vào Note tạm';
              toast.style.display = 'block';
              toast.style.opacity = '1';
              setTimeout(() => {
                  toast.style.opacity = '0';
                  setTimeout(() => toast.style.display = 'none', 300);
              }, 1500);
          }
      });
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
        // Prevent hiding if clicking the chat input area (like the Send button) or copy log button
        if (e.target.closest && (e.target.closest('.chat-input-area') || e.target.closest('#btn-copy-debug'))) return;
        
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
      
      // Clear any previous inline styles
      this.container.style.position = '';
      this.container.style.top = '';
      this.container.style.left = '';
      this.container.style.bottom = '';
      this.container.style.transform = '';
      this.container.style.width = '100%';
      this.container.style.maxWidth = 'none';

      // Placement Logic
      if (this.config.placement === 'inline') {
          if (this.activeTarget.parentNode) {
              this.activeTarget.parentNode.insertBefore(this.container, this.activeTarget.nextSibling);
          }
      } else if (this.config.placement === 'fixed-bottom') {
          document.body.appendChild(this.container);
          this.container.style.position = 'fixed';
          this.container.style.bottom = '0';
          this.container.style.left = '0';
          this.container.style.width = '100%';
          this.container.style.zIndex = '1000';
      } else if (this.config.placement === 'custom-div') {
          const targetId = this.activeTarget.id;
          if (targetId) {
              const customDiv = document.querySelector(`div.keyboard[targetid="${targetId}"]`);
              if (customDiv) {
                  customDiv.appendChild(this.container);
              }
          }
      } else if (this.config.placement === 'float') {
          document.body.appendChild(this.container);
          this.container.style.position = 'fixed';
          this.container.style.bottom = '20px';
          this.container.style.left = '50%';
          this.container.style.transform = 'translateX(-50%)';
          this.container.style.width = '90%';
          this.container.style.maxWidth = '800px';
          this.container.style.zIndex = '1000';
          
          if (this.savedPos && this.hasBeenDragged) {
              this.container.style.transform = 'none';
              if (this.savedPos.left) this.container.style.left = this.savedPos.left;
              if (this.savedPos.top) this.container.style.top = this.savedPos.top;
              if (this.savedPos.bottom) this.container.style.bottom = this.savedPos.bottom;
              if (this.savedPos.width) this.container.style.width = this.savedPos.width;
          }
      }
      
      this.updateKeyRects();
  }

  updateKeyRects() {
    // Delay calculation to wait for any CSS transitions (like slide-up animations) to finish
    setTimeout(() => {
        this.keyRects = [];
        if (!this.keysContainer) return;
        
        // Ensure canvas matches keys container size for correct swipe drawing
        if (this.canvas) {
            this.canvas.width = this.keysContainer.offsetWidth;
            this.canvas.height = this.keysContainer.offsetHeight;
        }
        
        const containerRect = this.keysContainer.getBoundingClientRect();
        this.keyElements.forEach((el, key) => {
          const rect = el.getBoundingClientRect();
          this.keyRects.push({
            key,
            x: (rect.left - containerRect.left) + rect.width / 2,
            y: (rect.top - containerRect.top) + rect.height / 2
          });
        });
    }, 350); // 350ms to ensure demo CSS transitions finish
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

    const openMultiDictBtn = this.container.querySelector('.vk-open-multi-dict-btn');
    if (openMultiDictBtn) {
        openMultiDictBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (this.renderMultiDictList) this.renderMultiDictList();
            this.settingsWrapper.querySelector('.vk-multi-dict-view').style.display = 'flex';
        });
    }

    const multiDictView = this.settingsWrapper.querySelector('.vk-multi-dict-view');
    const multiDictBackBtn = this.settingsWrapper.querySelector('.vk-multi-dict-back-btn');
    if (multiDictBackBtn) {
        multiDictBackBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            multiDictView.style.display = 'none';
        });
    }
    
    // Recursive Typing Binding
    const attachRecursiveTyping = () => {
        if (!this.settingsWrapper) return;
        const inputs = this.settingsWrapper.querySelectorAll('input');
        inputs.forEach(inp => {
            if (!inp.dataset.vkBound) {
                inp.dataset.vkBound = 'true';
                inp.addEventListener('focus', (e) => {
                    if (this.isDisabled) return;
                    this.activeTarget = e.target;
                    this.show();
                });
            }
        });
    };
    attachRecursiveTyping();
    // Also we need to attach to dynamically created inputs in dictEditView
    // We can observe the settingsWrapper for new inputs
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.addedNodes.length) attachRecursiveTyping();
        });
    });
    if (this.settingsWrapper) {
        observer.observe(this.settingsWrapper, { childList: true, subtree: true });
    }

    this.keysContainer.addEventListener('pointerdown', this.onPointerDown.bind(this));
    document.addEventListener('pointermove', this.onPointerMove.bind(this));
    document.addEventListener('pointerup', this.onPointerUp.bind(this));
    document.addEventListener('pointercancel', this.onPointerCancel.bind(this));
    
    // Prevent default touch behaviors (scrolling, zooming) while swiping
    this.keysContainer.addEventListener('touchstart', e => {
      if(e.cancelable) e.preventDefault();
    }, {passive: false});

    // Robust input tracking (handles Unikey/IME properly)
    document.addEventListener('input', (e) => {
        if (this._vkIsInserting) return;
        if (!this.activeTarget || e.target !== this.activeTarget) return;
        
        const target = this.activeTarget;
        const textBeforeCursor = target.value.substring(0, target.selectionStart);
        
        // If we just inserted a swipe word and haven't moved on, don't clear it!
        if (this.lastCommittedWord && textBeforeCursor.endsWith(this.lastCommittedWord)) {
            return;
        }
        
        this.lastCommittedWord = '';
        // Only match ASCII letters and numbers for tap word (since it's Base60 or unaccented)
        const match = textBeforeCursor.match(/([\p{L}0-9]+)$/u);
        
        if (match) {
            this.currentTapWord = match[1];
        } else {
            this.currentTapWord = '';
        }
        
        if (!this.isDragging) {
            this.updateTapSuggestions();
        }
    });
    
    // Update suggestions if cursor moves
    document.addEventListener('selectionchange', () => {
        if (this._vkIsInserting) return;
        if (!this.activeTarget || document.activeElement !== this.activeTarget) return;
        
        const target = this.activeTarget;
        const textBeforeCursor = target.value.substring(0, target.selectionStart);
        
        // Protect swipe suggestions from being overwritten by async selectionchange
        if (this.lastCommittedWord && textBeforeCursor.endsWith(this.lastCommittedWord)) {
            return;
        }
        
        const match = textBeforeCursor.match(/([\p{L}0-9]+)$/u);
        
        if (match) {
            this.currentTapWord = match[1];
        } else {
            this.currentTapWord = '';
        }
        
        if (!this.isDragging) {
            this.updateTapSuggestions();
        }
    });
  }

  getKeyFromPoint(x, y) {
      if (this.keyRects.length === 0 || (this.keyRects[0] && this.keyRects[0].x === 0)) {
          // Sync update
          this.keyRects = [];
          if (this.canvas && this.keysContainer) {
              this.canvas.width = this.keysContainer.offsetWidth;
              this.canvas.height = this.keysContainer.offsetHeight;
          }
          if (this.keysContainer) {
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
      }

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

  clearSwipeSuggestions() {
      if (!this.swipeSuggestions) return;
      this.keyElements.forEach((el, tKey) => {
          if (el.classList.contains('swipe-suggest-key')) {
              el.classList.remove('swipe-suggest-key');
              el.style.backgroundColor = '';
              el.style.color = '';
              el.style.fontSize = '';
              if (el.dataset.origHTML !== undefined) {
                  el.innerHTML = el.dataset.origHTML;
                  delete el.dataset.origHTML;
              }
          }
      });
      this.swipeSuggestions = null;
  }

  onPointerDown(e) {
      if (this.isDraggingSugg) return;
      // Self-healing: if no swipe is active but an ID is stuck, clear it
      if (this.activePointerId !== null && this.activePointerId !== undefined) {
          if (!this.isSwiping) {
              this.activePointerId = null;
          } else {
              return;
          }
      }
      
      let cx = e.clientX;
      let cy = e.clientY;
      
      const targetRect = this.keysContainer.getBoundingClientRect();
      cx -= targetRect.left;
      cy -= targetRect.top;
      
      const upBtn = e.target.closest('.gb-key') || e.target.closest('.vk-key');
      if (!upBtn) return;
      const key = upBtn.dataset.key || upBtn.textContent;
      if (!key) return;
      
      if (e.pointerId !== undefined) {
         try { this.keysContainer.setPointerCapture(e.pointerId); } catch(ex){}
         this.activePointerId = e.pointerId;
      }
    
    this.highlightKey(key);
    this.showBubble(key);

    if (key === ' ' || key === 'Enter' || key === 'Backspace' || key === 'Shift' || key === ',' || key === '.' || key === 'Search') {
       this.clearSwipeSuggestions();
       if (key === 'Shift') {
           this.toggleSmartShift(e);
       } else {
           this.handleImmediateKey(key);
           if (key === 'Backspace') {
               this.startContinuousBackspace();
           }
       }
       this.isSwiping = false;
       this.activePointerId = null;
       return;
    }
    
    this.isSwiping = true;
    this.currentKeys = [key];
    this.swipePath = [{ x: cx, y: cy }]; // using adjusted coordinates
    this.forcedIndices = [0];
    this.drawTrail();

    // Show suggestions on space row
    if (/^[a-z]$/i.test(key)) {
       const charLower = key.toLowerCase();
       const suggs1 = [];
       const suggs2 = [];
       const suggs = [...new Set([...suggs1, ...suggs2])].slice(0, 3);
       if (suggs.length > 0) {
           this.swipeSuggestions = { active: true, isFull: false, map: {} };
           const targets = [',', ' ', '.'];
           suggs.forEach((word, i) => {
               const tKey = targets[i];
               this.swipeSuggestions.map[tKey] = word;
               const el = this.keyElements.get(tKey);
               if (el) {
                   el.dataset.origHTML = el.innerHTML;
                   el.textContent = word;
                   el.classList.add('swipe-suggest-key');
                   el.style.backgroundColor = '#1A73E8';
                   el.style.color = '#fff';
               }
           });
       }
       this.updateTapSuggestions(this.currentTapWord + key.toLowerCase());
    }

    // Start long press timer
    if (this.longPressTimer) clearTimeout(this.longPressTimer);
    this.longPressTimer = setTimeout(() => {
        if (key === ',' || key === '.') {
            this.handleLongPress(key, cx, cy);
            this.isSwiping = false; // Cancel swipe
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }, 250); // 400ms for long press
  }

  onPointerMove(e) {
      if (!this.isSwiping) return;
      if (this.activePointerId !== null && e.pointerId !== this.activePointerId) return;
      
      const containerRect = this.keysContainer.getBoundingClientRect();
      const cx = e.clientX - containerRect.left;
      const cy = e.clientY - containerRect.top;
      const key = this.getKeyFromPoint(cx, cy);
      const lastPoint = this.swipePath[this.swipePath.length - 1];
      
      // Update trail if moved enough
      if (!lastPoint || Math.hypot(cx - lastPoint.x, cy - lastPoint.y) > 5) {
         this.swipePath.push({ x: cx, y: cy });
         this.drawTrail();
         
         if (this.swipePath.length > 0 && Math.hypot(cx - this.swipePath[0].x, cy - this.swipePath[0].y) > 10) {
             if (this.longPressTimer) clearTimeout(this.longPressTimer);
             if (this.swipeSuggestions && this.swipeSuggestions.isFull) {
                 this.clearSwipeSuggestions();
                 this.swipeSuggestions.isFull = false;
             }
         }
         
          if (key && key !== this.currentBubbleKey) {
              if (!this.isSwiping) {
                  this.showBubble(key);
              } else if (this.bubble) {
                  this.bubble.classList.remove('show');
                  // Do NOT set currentBubbleKey = null, so that we don't re-trigger this block constantly while hovering on the same key during a swipe.
              }
          }
         
         // REAL-TIME SUGGESTION PREVIEW
         if (this.swipePath.length >= 3) {
             const res = this.getSuggestionsForPath(this.swipePath, this.forcedIndices);
             if (res.geoWord !== this.lastGeoWord && res.geoWord.length > 0) {
                 this.lastGeoWord = res.geoWord;
                 if (this.suggestionContainer) {
                     this.suggestionContainer.setAttribute('data-preview', 'true');
                 }
                 
                 // Filter to only meaningful words
                 const meaningful = res.suggestions.filter(s => s.type === 'vi' || s.type === 'b60');
                 if (meaningful.length > 0) {
                     // Gboard shows exactly 1 top meaningful word during swipe
                     this.renderSuggestions([meaningful[0]]);
                 } else {
                     this.renderSuggestions([]); // Show nothing if no meaning found yet
                 }
                 
                 this.lastSwipeRes = res;
                 this.updateDebugLog();
             }
         }
         
         if (!this.pauseStartPoint || key !== this.lastPauseKey) {
              this.lastPauseKey = key;
              this.pauseStartPoint = { x: cx, y: cy };
              this.startPauseTimer(key);
          } else if (Math.hypot(cx - this.pauseStartPoint.x, cy - this.pauseStartPoint.y) > 50) {
              this.pauseStartPoint = { x: cx, y: cy };
              this.startPauseTimer(key);
          }
      }
  }

  startPauseTimer(key) {
      if (this.pauseTimer) clearTimeout(this.pauseTimer);
      this.pauseTimer = setTimeout(() => {
          if (!this.isSwiping) return;
          if (this.swipeSuggestions && this.swipeSuggestions.isFull) return;
          
          const idx = this.swipePath.length - 1;
          if (idx >= 0 && !this.forcedIndices.includes(idx)) {
              this.forcedIndices.push(idx);
          }
          if (this.swipePath.length > 0 && idx >= 0) {
              const currentP = this.swipePath[idx];
              currentP.isPause = true;
              currentP.key = key;
              this.showBubble(key);
          }
      }, 80);
  }

  onPointerCancel(e) {
    if (this.stopContinuousBackspace) this.stopContinuousBackspace();
    if (this.activePointerId !== null && e.pointerId !== this.activePointerId) return;
    this.activePointerId = null;
    this.isSwiping = false;
    if (this.ctx && this.canvas) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    if (this.pauseTimer) clearTimeout(this.pauseTimer);
    if (this.longPressTimer) clearTimeout(this.longPressTimer);
    if (this.bubble) this.bubble.classList.remove('show');
    if (this.keyElements) this.keyElements.forEach(el => el.classList.remove('active'));
    this.clearSwipeSuggestions();
  }

  onPointerUp(e) {
    if (this.stopContinuousBackspace) this.stopContinuousBackspace();
    if (this.activePointerId !== null && e.pointerId !== this.activePointerId) return;
    this.activePointerId = null;
    if (!this.isSwiping) return;

    try {
        let upEl = null;
        try { upEl = document.elementFromPoint(e.clientX, e.clientY); } catch(ex) {}
        
        let upBtn = null;
        if (upEl && typeof upEl.closest === 'function') {
            upBtn = upEl.closest('button');
        }

        if (upBtn && upBtn.closest('#suggestions')) {
            this.clearSwipeSuggestions();
            upBtn.click();
            return;
        }

        let pathDist = 0;
        for(let i=1; i<this.swipePath.length; i++){
            pathDist += Math.hypot(this.swipePath[i].x - this.swipePath[i-1].x, this.swipePath[i].y - this.swipePath[i-1].y);
        }
        
        if (pathDist >= 20 && this.swipeSuggestions && this.swipeSuggestions.active) {
            const lastPoint = this.swipePath[this.swipePath.length - 1];
            const endKey = this.getKeyFromPoint(lastPoint.x, lastPoint.y);
            if (this.swipeSuggestions.map[endKey]) {
                const wordToInsert = this.swipeSuggestions.map[endKey];
                const toInsert = this.isShiftActive ? (wordToInsert.charAt(0).toUpperCase() + wordToInsert.slice(1)) : wordToInsert;
                this.insertText(toInsert + ' ');
                this.clearSwipeSuggestions();
                this.clearSuggestions();
                return;
            }
        }
        this.clearSwipeSuggestions();

        if (pathDist < 20) {
           const key = this.currentKeys[0];
           if (key) {
               this.handleImmediateKey(key);
           }
        } else if (this.swipePath.length > 1) {
           this.processSwipe();
        }
    } catch (err) {
        console.error("Error in onPointerUp:", err);
    } finally {
        this.activePointerId = null;
        this.isSwiping = false;
        this.swipePath = [];
        this.forcedIndices = [];
        this.currentKeys = [];
        if (this.ctx && this.canvas) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
        if (this.pauseTimer) clearTimeout(this.pauseTimer);
        if (this.longPressTimer) clearTimeout(this.longPressTimer);
        if (this.bubble) this.bubble.classList.remove('show');
        if (this.keyElements) this.keyElements.forEach(el => el.classList.remove('active'));
    }
  }

  drawTrail(ctx = this.ctx) {
      if (ctx && this.canvas) {
          ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      }
      if (!this.swipePath || this.swipePath.length < 2) return;
      
      ctx.beginPath();
      ctx.moveTo(this.swipePath[0].x, this.swipePath[0].y);
      for (let i = 1; i < this.swipePath.length; i++) {
          ctx.lineTo(this.swipePath[i].x, this.swipePath[i].y);
      }
      ctx.strokeStyle = '#1A73E8';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
      
      // Draw pause circles
      this.swipePath.forEach(pt => {
          if (pt.isPause) {
              ctx.beginPath();
              ctx.arc(pt.x, pt.y, 6, 0, Math.PI * 2);
              ctx.fillStyle = '#1A73E8';
              ctx.fill();
          }
      });
  }


  updateTapSuggestions(overrideWord = null) {
      const targetWord = overrideWord !== null ? overrideWord : this.currentTapWord;
      
      if (!targetWord) {
          this.clearSuggestions();
          return;
      }
      
      const unaccented = typeof stripDiacritics === 'function' ? stripDiacritics(targetWord.toLowerCase()) : targetWord.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D');
      let matches = [];
      let customMatches = [];
      
      // 1. Check Custom Dictionary First (1-to-N)
      const typedLower = targetWord.toLowerCase();
      if (typeof shortcutDictionary !== 'undefined' && shortcutDictionary.has(typedLower)) {
          customMatches = [...shortcutDictionary.get(typedLower)];
      }
      
      // 2. Normal Unaccented Dictionary
      if (unaccentedDictionary.has(unaccented)) {
          unaccentedDictionary.get(unaccented).forEach(w => {
              if (!matches.includes(w) && !customMatches.includes(w)) matches.push(w);
          });
      }
      
      // Check Base60 case-insensitive dictionary
      if (base60Dictionary.has(typedLower)) {
          const b60Matches = base60Dictionary.get(typedLower);
          b60Matches.forEach(w => {
              if (!matches.includes(w)) matches.unshift(w); // Put exact base60 matches at the top!
          });
      }
      
      // If few exact matches, prioritize high-frequency prefix matches (TWO_DIGIT_WORDS, SHORT_WORDS)
      if (matches.length < 5) {
          const addPrefixMatches = (arr) => {
              for (let w of arr) {
                  if (w && typeof w === 'string') {
                      const wUnaccented = w.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();
                      if (wUnaccented.startsWith(unaccented)) {
                          if (!matches.includes(w)) matches.push(w);
                          if (matches.length >= 40) break;
                      }
                  }
              }
          };
          
          addPrefixMatches(REAL_VIETNAMESE_WORDS);
          
          
          // Fallback to alphabetical if still not enough
          if (matches.length < 10) {
              for (let key of unaccentedDictionary.keys()) {
                  if (key !== unaccented && key.startsWith(unaccented)) {
                      matches.push(...unaccentedDictionary.get(key));
                      if (matches.length >= 20) break;
                  }
              }
          }
      }
      
      // NEW: If the user typed a Base60 code directly, decode it!
      let decodedWord = null;
      try {
          const dec = decodeWord(base60ToTime(targetWord));
          if (dec && !dec.startsWith('[') && dec !== targetWord) {
              decodedWord = dec;
              const decodedUnaccented = typeof stripDiacritics === 'function' ? stripDiacritics(decodedWord.toLowerCase()) : decodedWord.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D');
              if (unaccentedDictionary.has(decodedUnaccented)) {
                  const moreMatches = unaccentedDictionary.get(decodedUnaccented);
                  moreMatches.forEach(m => {
                      if (!matches.includes(m)) matches.push(m);
                  });
              }
          }
      } catch (e) {}

      if (matches.length === 0 && !decodedWord) {
          this.clearSuggestions();
          return;
      }
      
      const commonOverrides = new Set(['chơi', 'cái', 'làm', 'của', 'có', 'một', 'và', 'là', 'được', 'người', 'không', 'như', 'với', 'trong', 'khi', 'cho', 'này', 'đến', 'để', 'những', 'từ', 'ra', 'thì', 'cũng', 'lại', 'rất', 'nhiều', 'hay', 'sau', 'chỉ', 'còn', 'đã', 'năm', 'vào', 'nhận', 'thấy', 'phải', 'đều', 'qua', 'chưa']);
      
      const getScore = (w) => {
          if (commonOverrides.has(w)) return 4;
          if (typeof TWO_DIGIT_WORDS !== 'undefined' && TWO_DIGIT_WORDS.includes(w)) return 3;
          if (typeof SHORT_WORDS !== 'undefined' && SHORT_WORDS.includes(w)) return 2;
          if (typeof REAL_VIETNAMESE_WORDS !== 'undefined' && REAL_VIETNAMESE_WORDS.includes(w)) return 1;
          return 0; // Rare words from syllables.json get lower priority
      };
      
      matches.sort((a, b) => {
          const diff = getScore(b) - getScore(a);
          return diff !== 0 ? diff : a.localeCompare(b);
      });
      
      // Limit to 30 suggestions to fit all possible accents
      matches = matches.slice(0, 30);
      let suggestions = [];
      
      // Push Custom Dictionary matches to the very top
      customMatches.forEach(word => {
          suggestions.push({ text: word, b60: targetWord, type: 'custom' });
      });
      
      if (decodedWord && !customMatches.includes(decodedWord)) {
          suggestions.push({ text: decodedWord, b60: targetWord, type: 'tap_edu' });
      }

      matches.forEach(word => {
          let b60 = "";
          try { b60 = timeToBase60(encodeWord(word)) || ""; } catch(e) {}
          
          if (!suggestions.find(s => s.text === word)) {
              suggestions.push({ text: word, b60: b60, type: 'tap_edu' });
          }
      });
      
      if (suggestions.length > 0) {
          this.renderSuggestions(suggestions);
      } else {
          this.clearSuggestions();
      }
  }

  highlightKey(key) {
    const el = this.keyElements.get(key);
    if (el) {
      el.classList.add('active');
    }
  }

  showBubble(key) {
      if (!key) return;
      // Don't show bubble for special keys
      if (key === ' ' || key === 'Enter' || key === 'Backspace' || key === 'Shift' || key === '?!=' || key === 'Search' || key === ',' || key === '.') return;
      const kRect = this.keyRects.find(r => r.key === key);
      if (kRect && this.bubble) {
          this.bubble.textContent = this.isShiftActive ? key.toUpperCase() : key;
          this.bubble.style.left = kRect.x + 'px';
          this.bubble.style.top = (kRect.y - 120) + 'px'; // Reduced from 140 to 120 to keep it closer to finger
          this.bubble.classList.add('show');
          this.currentBubbleKey = key;
      }
  }

  handleImmediateKey(key) {
    if (this.keysContainer && this.keysContainer.classList.contains('hint-mode-active') && key !== '0') {
        this.keysContainer.classList.remove('hint-mode-active');
    }

    if (!this.activeTarget) return;

    if (key === '?!=') {
       this.toggleSmartShift({ clientX: 0, clientY: 0 }); 
       return;
    }
    if (key === ',' || key === '.') {
      this.insertText(key);
      return;
    }
    if (key === 'Search') {
      this.hide();
      return;
    }
    const target = this.activeTarget;
    const start = target.selectionStart;
    const end = target.selectionEnd;
    
    if (key === 'Backspace') {
       if (start > 0 && start === end) {
          const textBefore = target.value.substring(0, start);
          if (this.lastCommittedWord && textBefore.endsWith(this.lastCommittedWord) && !textBefore.endsWith(' ')) {
              target.setRangeText('', start - this.lastCommittedWord.length, end, 'end');
              this.lastCommittedWord = ''; // Clear so next backspace deletes 1 char
          } else {
              target.setRangeText('', start - 1, end, 'end');
          }
       } else if (start !== end) {
          target.setRangeText('', start, end, 'end');
       }
    } else if (key === ' ') {
       target.setRangeText(' ', start, end, 'end');
    } else if (key === 'Enter') {
       target.setRangeText('\n', start, end, 'end');
    } else if (key === '0') {
       if (this.keysContainer) {
           this.keysContainer.classList.toggle('hint-mode-active');
       }
       return;
    } else if (key === '8') {
        if (this.lastCommittedWord && start === end && this.lastGeoWord && this.lastGeoWord.length >= 2) {
            const textBefore = target.value.substring(0, start);
            if (textBefore.endsWith(this.lastCommittedWord) && !textBefore.endsWith(' ')) {
                const rawWord = this.lastGeoWord[0] + this.lastGeoWord[this.lastGeoWord.length - 1];
                target.setRangeText(rawWord, start - this.lastCommittedWord.length, start, 'end');
                this.lastCommittedWord = rawWord;
                target.dispatchEvent(new Event('input', { bubbles: true }));
            }
        }
        return;
    } else if (key === '9') {
        // Single character backspace fallback
        if (start > 0) {
            target.setRangeText('', start - 1, end, 'end');
            target.dispatchEvent(new Event('input', { bubbles: true }));
            if (this.lastCommittedWord && start === end) {
                const textBefore = target.value.substring(0, start);
                if (textBefore.endsWith(this.lastCommittedWord) && !textBefore.endsWith(' ')) {
                    this.lastCommittedWord = this.lastCommittedWord.slice(0, -1);
                }
            }
        }
        return;
    } else if (key === 'Shift') {
       // TONE CORRECTION INTERCEPT FOR CAPITALIZATION
       if (this.lastCommittedWord && start === end) {
           const textBefore = target.value.substring(0, start);
           if (textBefore.endsWith(this.lastCommittedWord) && !textBefore.endsWith(' ')) {
               const newWord = this.changeToneVNI(this.lastCommittedWord, 'Shift');
               if (newWord !== this.lastCommittedWord) {
                   target.setRangeText(newWord, start - this.lastCommittedWord.length, start, 'end');
                   this.lastCommittedWord = newWord;
                   target.dispatchEvent(new Event('input', { bubbles: true }));
                   // Also reset shift state because we used it for capping word
                   this.isShiftActive = false;
                   this.keyElements.forEach((el, k) => {
                       if (k.length === 1 && /[a-z]/i.test(k)) {
                           el.textContent = k.toLowerCase();
                       }
                   });
                   return;
               }
           }
       }
       // normal shift logic is handled in pointerDown
    } else {
       // TONE CORRECTION & VOWEL SWAP INTERCEPT
       if (((key >= '0' && key <= '9') || (key.length === 1 && /[a-zA-Z]/.test(key))) && this.lastCommittedWord && start === end) {
           const textBefore = target.value.substring(0, start);
           if (textBefore.endsWith(this.lastCommittedWord) && !textBefore.endsWith(' ')) {
               let newWord = this.lastCommittedWord;
               if (key >= '0' && key <= '9') {
                   newWord = this.changeToneVNI(this.lastCommittedWord, key);
               } else if (VOWEL_KEY_MAPPING[key.toLowerCase()]) {
                   newWord = this.applyVowelSwap(this.lastCommittedWord, key);
               }
               
               if (newWord !== this.lastCommittedWord) {
                   target.setRangeText(newWord, start - this.lastCommittedWord.length, start, 'end');
                   this.lastCommittedWord = newWord;
                   target.dispatchEvent(new Event('input', { bubbles: true }));
                   return;
               } else if ((key >= '0' && key <= '9') || VOWEL_KEY_MAPPING[key.toLowerCase()]) {
                   // If they pressed a modifier key but it didn't change the word, we just return to avoid typing the key
                   return;
               }
           }
       }

       const toInsert = this.isShiftActive ? key.toUpperCase() : key;
       target.setRangeText(toInsert, start, end, 'end');
    }
    
    target.dispatchEvent(new Event('input', { bubbles: true }));
  }

  applyVowelSwap(word, key) {
      if (!word) return word;
      const lowerKey = key.toLowerCase();
      if (!VOWEL_KEY_MAPPING[lowerKey]) return word;
      
      const newVowel = VOWEL_KEY_MAPPING[lowerKey];
      const { consonant, vowel, coda, tone } = splitPhonetics(word);
      
      if (!vowel) return word;
      
      let newWord = smartCodaFixer(consonant, newVowel, coda, tone);
      
      if (word === word.toUpperCase()) return newWord.toUpperCase();
      if (word[0] === word[0].toUpperCase()) return newWord.charAt(0).toUpperCase() + newWord.slice(1);
      return newWord;
  }

  changeToneVNI(word, key) {
      if (!word) return word;
      
      if (key === 'Shift') {
          if (word === word.toUpperCase()) return word.toLowerCase();
          if (word[0] === word[0].toUpperCase() && word.length > 1 && word[1] === word[1].toLowerCase()) return word.toUpperCase();
          return word.charAt(0).toUpperCase() + word.slice(1);
      }
      
      if (key === '8') return word + '?';
      if (key === '9') return word + '!';
      
      const { consonant, rhyme, tone } = extractPhonetics(word);
      if (!rhyme) {
          if (key === '7') {
              let clean = word;
              clean = clean.replace(/đ/g, 'd').replace(/Đ/g, 'D');
              return clean;
          }
          return word;
      }
      
      let currentTone = tone;
      let currentRhyme = rhyme;
      let currentConsonant = consonant;

      if (key >= '1' && key <= '6') {
          const toneMap = {'1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 0};
          currentTone = toneMap[key];
      }
      
      if (key === '7') {
          const removeHat = (str) => {
              return str.replace(/[ươâêôă]/g, m => {
                  switch(m) {
                      case 'ư': return 'u';
                      case 'ơ': return 'o';
                      case 'â': return 'a';
                      case 'ê': return 'e';
                      case 'ô': return 'o';
                      case 'ă': return 'a';
                      default: return m;
                  }
              }).replace(/[ƯƠÂÊÔĂ]/g, m => {
                  switch(m) {
                      case 'Ư': return 'U';
                      case 'Ơ': return 'O';
                      case 'Â': return 'A';
                      case 'Ê': return 'E';
                      case 'Ô': return 'O';
                      case 'Ă': return 'A';
                      default: return m;
                  }
              });
          };
          currentRhyme = removeHat(currentRhyme);
          currentConsonant = currentConsonant.replace(/đ/g, 'd').replace(/Đ/g, 'D');
      }
      
      return currentConsonant + applyTone(currentRhyme, currentTone);
  }

  handleLongPress(key, x, y) {
      if (key === ',') {
          alert('Settings Menu (Coming soon)');
      } else if (key === '.') {
          alert('! ? # Punctuation Menu (Coming soon)');
      }
  }

  insertText(text) {
      if (!this.activeTarget) {
          this.activeTarget = document.getElementById('text-input');
      }
      if (!this.activeTarget) return;
      this._vkIsInserting = true;
      const target = this.activeTarget;
      
      if (target.tagName.toLowerCase() === 'textarea' || target.tagName.toLowerCase() === 'input') {
          const start = target.selectionStart;
          const end = target.selectionEnd;
          target.setRangeText(text, start, end, 'end');
          target.dispatchEvent(new Event('input', { bubbles: true }));
      }
      this._vkIsInserting = false;
  }

  toggleSmartShift(e) {
      if (this.smartShiftMenu) {
          this.smartShiftMenu.remove();
          this.smartShiftMenu = null;
          return;
      }
      this.smartShiftMenu = document.createElement('div');
      this.smartShiftMenu.className = 'vk-smart-shift-menu';
      this.smartShiftMenu.style.position = 'absolute';
      this.smartShiftMenu.style.bottom = '100%';
      this.smartShiftMenu.style.left = '10px';
      this.smartShiftMenu.style.background = '#2c2c2e';
      this.smartShiftMenu.style.border = '1px solid #3a3a3c';
      this.smartShiftMenu.style.borderRadius = '12px';
      this.smartShiftMenu.style.padding = '8px';
      this.smartShiftMenu.style.display = 'flex';
      this.smartShiftMenu.style.flexDirection = 'column';
      this.smartShiftMenu.style.gap = '8px';
      this.smartShiftMenu.style.zIndex = '10000';
      this.smartShiftMenu.style.boxShadow = '0 -4px 12px rgba(0,0,0,0.5)';
      
      const options = [
          { label: '🔠 Caps Lock (Gõ Hoa)', action: 'capslock' },
          { label: 'Aa Viết hoa chữ đầu từ', action: 'capitalize' },
          { label: 'AA Viết hoa toàn bộ từ', action: 'uppercase' },
          { label: '✨ Chuẩn hoá ngữ pháp', action: 'grammar' }
      ];
      
      options.forEach(opt => {
          const btn = document.createElement('button');
          btn.textContent = opt.label;
          btn.style.background = 'transparent';
          btn.style.border = 'none';
          btn.style.color = '#fff';
          btn.style.textAlign = 'left';
          btn.style.padding = '10px 15px';
          btn.style.fontSize = '14px';
          btn.style.cursor = 'pointer';
          btn.style.borderRadius = '6px';
          if (opt.action === 'capslock' && this.isShiftActive) {
              btn.style.background = '#1A73E8';
          }
          btn.onpointerdown = (ev) => ev.preventDefault();
          btn.onpointerup = (ev) => {
              ev.preventDefault();
              // Apply action
              this.smartShiftMenu.remove();
              this.smartShiftMenu = null;
          };
          this.smartShiftMenu.appendChild(btn);
      });
      
      const kRect = this.keyRects.find(r => r.key === 'Shift');
      if (kRect) {
          this.smartShiftMenu.style.left = kRect.x + 'px';
      }
      this.container.appendChild(this.smartShiftMenu);
  }

  startContinuousBackspace() {
      this.stopContinuousBackspace();
      this.backspaceTimeout = setTimeout(() => {
          this.backspaceInterval = setInterval(() => {
              this.handleImmediateKey('Backspace');
          }, 60);
      }, 400);
  }

  stopContinuousBackspace() {
      if (this.backspaceTimeout) clearTimeout(this.backspaceTimeout);
      if (this.backspaceInterval) clearInterval(this.backspaceInterval);
  }

  clearSuggestions() {
      if (this.suggestionContainer) {
          this.suggestionContainer.innerHTML = '';
      }
      this.predictNextWords();
  }

  predictNextWords() {
      if (!this.activeTarget) {
          this.activeTarget = document.getElementById('text-input');
      }
      if (!this.activeTarget) {
          return;
      }
      
      let suggestions = [];

      suggestions.push({ text: ',', type: 'raw' });
      suggestions.push({ text: '.', type: 'raw' });
      suggestions.push({ text: '?', type: 'raw' });
      
      this.renderSuggestions(suggestions);
  }

  getSuggestionsForPath(path, forcedIndices) {
    let geoKeys = [];
    let segments = [];
    let lastIdx = 0;
    
    const finalIdx = path.length - 1;
    let localForced = [...forcedIndices];
    if (!localForced.includes(finalIdx)) {
        localForced.push(finalIdx);
    }

    for (let fIdx of localForced) {
        if (fIdx >= lastIdx && fIdx < path.length) {
            segments.push(path.slice(lastIdx, fIdx + 1));
            lastIdx = fIdx;
        }
    }
    
    let corners = [];
    segments.forEach((seg, i) => {
        let simplified = this.simplifyPath(seg, 30); // Tăng epsilon lên 30 để tránh đường thẳng bị gãy vì tay người dùng hơi run (sẽ bỏ qua những phím nhiễu như y, j khi vuốt m-h-r)
        if (i > 0) simplified.shift(); 
        corners = corners.concat(simplified);
    });

    // Cần đảm bảo tất cả các điểm nhấn giữ (forced/pause indices) đều bắt buộc nằm trong corners
    localForced.forEach(idx => {
        if (idx < path.length) {
            const pt = path[idx];
            if (!corners.includes(pt)) {
                corners.push(pt);
            }
        }
    });

    // Sắp xếp lại corners theo thứ tự thời gian trong path
    corners.sort((a, b) => path.indexOf(a) - path.indexOf(b));

    let cornerKeys = [];
    corners.forEach(p => {
       const k = this.getKeyFromPoint(p.x, p.y);
       const isSpecial = k === 'Enter' || k === 'Backspace' || k === 'Shift' || k === ',' || k === '.' || k === 'Search';
       if (k && !isSpecial) {
          if (cornerKeys.length === 0 || cornerKeys[cornerKeys.length - 1] !== k) {
             cornerKeys.push(k);
          }
       }
    });
    const geoWordCorners = cornerKeys.join('');
    
    let forcedKeys = new Set();
    const firstKey = this.getKeyFromPoint(path[0].x, path[0].y);
    if (firstKey) forcedKeys.add(firstKey);
    for (let idx of forcedIndices) {
        if (idx < path.length) {
            const k = this.getKeyFromPoint(path[idx].x, path[idx].y);
            if (k) forcedKeys.add(k);
        }
    }
    const forcedNormKeys = new Set([...forcedKeys].map(k => this.normalizeForSwipe(k)));
    
    // Sử dụng toàn bộ path để lấy tất cả các phím lướt qua (spatial model thực thụ)
    path.forEach(p => {
       const k = this.getKeyFromPoint(p.x, p.y);
       const isSpecial = k === 'Enter' || k === 'Backspace' || k === 'Shift' || k === ',' || k === '.' || k === 'Search';
       if (k && !isSpecial) {
          if (geoKeys.length === 0 || geoKeys[geoKeys.length - 1] !== k) {
             geoKeys.push(k);
          }
       }
    });

    const geoWord = geoKeys.join('');
    let suggestions = [];
    
    if (geoWord.includes(' ')) {
        const parts = geoWord.split(/ +/).filter(Boolean);
        if (parts.length > 0) {
            const p1 = parts[0];
            const p2 = parts[1] || '';
            
            const decodePart = (part) => {
                if (!part) return [];
                let words = [];
                let perms = this.generatePermutations(part);
                perms.forEach(s => {
                    let isValidBase60 = true;
                    for (let char of s) {
                        if (!(char in BASE60_MAPPING)) isValidBase60 = false;
                    }
                    if (isValidBase60) {
                       try {
                          const timeStr = base60ToTime(s);
                          if (timeStr && !timeStr.includes('?')) {
                             const dec = decodeWord(timeStr);
                             if (dec && !dec.includes('?') && !dec.startsWith('[')) {
                                if (validVietnameseWords.has(dec)) words.push(dec);
                             }
                          }
                       } catch(e) {}
                    }
                });
                return words;
            };
            
            const w1Candidates = decodePart(p1);
            const w2Candidates = decodePart(p2);
            
            let validCompoundMatches = [];
            
            if (validCompoundMatches.length > 0) {
                const seen = new Set();
                validCompoundMatches.forEach(item => {
                    if (!seen.has(item.text)) {
                        seen.add(item.text);
                        suggestions.push(item);
                    }
                });
            }
        }
        
        // Bỏ push type: 'raw'
        

        return { geoWord, geoWordCorners, suggestions };
    }

    const getBase60WordsFromChunk = (chunk) => {
        let geoPerms = this.generatePermutations(chunk);
        let casePerms = [];
        geoPerms.forEach(p => {
            let current = [''];
            for (let char of p) {
               let next = [];
               for (let s of current) {
                   next.push(s + char.toLowerCase());
                   next.push(s + char.toUpperCase());
               }
               current = next;
            }
            casePerms.push(...current);
        });
        let validWords = [];
        let seenDec = new Set();
        casePerms.forEach(s => {
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
                      if (validVietnameseWords.has(dec) && !seenDec.has(dec)) {
                         seenDec.add(dec);
                         validWords.push({ dec: dec, s: s });
                      }
                   }
                }
             } catch(e) {}
          }
        });
        return validWords;
    };

    if (geoWordCorners.length > 0 && geoWordCorners.length <= 9) {
        let n = geoWordCorners.length;
        let chunks = [];
        for (let i = 0; i < Math.floor(n / 3); i++) {
            chunks.push(geoWordCorners.substring(i*3, i*3 + 3));
        }
        let remainder = geoWordCorners.substring(Math.floor(n / 3) * 3);
        
        let possiblePhrases = [[]];
        let isValidSequence = true;
        
        for (let chunk of chunks) {
            const wordsForChunk = getBase60WordsFromChunk(chunk);
            if (wordsForChunk.length === 0) { isValidSequence = false; break; }
            
            let newPhrases = [];
            for (let phrase of possiblePhrases) {
                for (let wObj of wordsForChunk) {
                    newPhrases.push([...phrase, wObj]);
                }
            }
            possiblePhrases = newPhrases;
        }
        
        if (isValidSequence) {
            let remMatches = [];
            if (remainder.length > 0) {
                let remLower = remainder.toLowerCase();
                if (typeof shortcutDictionary !== 'undefined' && shortcutDictionary.has(remLower)) {
                    remMatches.push(...shortcutDictionary.get(remLower));
                }
                if (remMatches.length === 0) isValidSequence = false;
            }
            
            if (isValidSequence) {
                possiblePhrases.forEach(phrase => {
                    let textParts = phrase.map(w => w.dec);
                    let sParts = phrase.map(w => w.s).join('');
                    
                    if (remainder.length > 0) {
                        remMatches.forEach(rm => {
                            let text = textParts.length > 0 ? [...textParts, rm].join(' ') : rm;
                            let score = 150 + (textParts.length * 50);
                            if (sParts === geoWordCorners.substring(0, sParts.length)) score += 50;
                            suggestions.push({ text: text, type: 'b60', score: score });
                        });
                    } else {
                        let text = textParts.join(' ');
                        let score = 150 + (textParts.length * 50);
                        if (sParts === geoWordCorners) score += 50;
                        
                        let hasCore = true;
                        if (typeof REAL_VIETNAMESE_WORDS !== 'undefined') {
                            for (let w of phrase) {
                                if (!REAL_VIETNAMESE_WORDS.includes(w.dec.toLowerCase())) {
                                    hasCore = false;
                                    break;
                                }
                            }
                        }
                        if (!hasCore) score -= 60;
                        
                        if (score > 0) {
                            suggestions.push({ text: text, type: 'b60', score: score });
                        }
                    }
                });
            }
        }
    }
    
    if (geoWord.length >= 2) {
      const HIGH_FREQ_SWIPE = new Set(['đi', 'được', 'có', 'không', 'với', 'trong', 'và', 'là', 'của', 'các', 'cho', 'một', 'như', 'này', 'về', 'khi', 'đến', 'để', 'những', 'từ', 'ra', 'thì', 'cũng', 'lại', 'rất', 'nhiều', 'hay', 'sau', 'chỉ', 'còn', 'đã', 'năm', 'vào', 'nhận', 'thấy', 'phải', 'đều', 'qua', 'chưa', 'ông', 'bà', 'anh', 'chị', 'em', 'tôi', 'bạn', 'đó', 'làm', 'cái', 'gì']);
      

      const ADJACENT_KEYS = {
        'q': ['w', 'a', 's'], 'w': ['q', 'e', 'a', 's', 'd'], 'e': ['w', 'r', 's', 'd', 'f'], 'r': ['e', 't', 'd', 'f', 'g'],
        't': ['r', 'y', 'f', 'g', 'h'], 'y': ['t', 'u', 'g', 'h', 'j'], 'u': ['y', 'i', 'h', 'j', 'k'], 'i': ['u', 'o', 'j', 'k', 'l'],
        'o': ['i', 'p', 'k', 'l'], 'p': ['o', 'l'], 'a': ['q', 'w', 's', 'z', 'x'], 's': ['q', 'w', 'e', 'a', 'd', 'z', 'x', 'c'],
        'd': ['w', 'e', 'r', 's', 'f', 'x', 'c', 'v'], 'f': ['e', 'r', 't', 'd', 'g', 'c', 'v', 'b'], 'g': ['r', 't', 'y', 'f', 'h', 'v', 'b', 'n'],
        'h': ['t', 'y', 'u', 'g', 'j', 'b', 'n', 'm'], 'j': ['y', 'u', 'i', 'h', 'k', 'n', 'm'], 'k': ['u', 'i', 'o', 'j', 'l', 'm'],
        'l': ['i', 'o', 'p', 'k'], 'z': ['a', 's', 'x'], 'x': ['a', 's', 'd', 'z', 'c'], 'c': ['s', 'd', 'f', 'x', 'v'],
        'v': ['d', 'f', 'g', 'c', 'b'], 'b': ['f', 'g', 'h', 'v', 'n'], 'n': ['g', 'h', 'j', 'b', 'm'], 'm': ['h', 'j', 'k', 'n']
      };

      let matchedBases = [];
      let exactMatchCount = {};
      const normalizedStr = this.normalizeForSwipe(geoWord);
      
      // Combine all dictionaries for swipe matching
      const allEntries = new Map(dictionary);
      if (typeof shortcutDictionary !== 'undefined') {
          for (const [k, v] of shortcutDictionary.entries()) {
              if (!allEntries.has(k)) allEntries.set(k, []);
              allEntries.get(k).push(...v);
          }
      }


      for (const [base, words] of allEntries.entries()) {
         const normalizedBase = this.normalizeForSwipe(base);
         
         const isFirstMatch = normalizedBase[0] === normalizedStr[0];
         const isFirstAdj = ADJACENT_KEYS[normalizedBase[0]] && ADJACENT_KEYS[normalizedBase[0]].includes(normalizedStr[0]);
         
         if (isFirstMatch || isFirstAdj) {
            let hasAllForced = true;
            for (let fk of forcedNormKeys) {
                if (!normalizedBase.includes(fk)) { hasAllForced = false; break; }
            }
            if (!hasAllForced) continue;

            let memo = Array(normalizedBase.length).fill().map(() => Array(normalizedStr.length).fill(-9999));
            
            function findMax(i, j) {
                if (i === normalizedBase.length) {
                    return -(normalizedStr.length - j) * 1; 
                }
                if (j === normalizedStr.length) {
                    return -(normalizedBase.length - i) * 10;
                }
                if (memo[i][j] !== -9999) return memo[i][j];
                
                const target = normalizedBase[i];
                const current = normalizedStr[j];
                
                let ans = -1 + findMax(i, j + 1);
                
                if (current === target) {
                    ans = Math.max(ans, 15 + findMax(i + 1, j + 1));
                } else if (ADJACENT_KEYS[target] && ADJACENT_KEYS[target].includes(current)) {
                    ans = Math.max(ans, 5 + findMax(i + 1, j + 1));
                }
                
                memo[i][j] = ans;
                return ans;
            }
            
            let dpScore = findMax(0, 0);
            if (dpScore > -50) { // filter out completely terrible matches
               matchedBases.push(base);
               exactMatchCount[base] = dpScore;
            }
         }
      }

      
      const getScore = (b) => {
         const normB = this.normalizeForSwipe(b);
         
         let score = exactMatchCount[b] || 0; 
         
         let cornerMatch = 0;
         let cIdx = 0;
         for (let i = 0; i < normB.length && cIdx < geoWordCorners.length; i++) {
             if (normB[i] === geoWordCorners[cIdx]) {
                 cornerMatch++;
                 cIdx++;
             }
         }
         
         score += cornerMatch * 15;
         
         if (normB === geoWordCorners) score += 50;
         
         if (normB === geoWord) score += 100;
         else if (normB === normalizedStr) score += 90;
         
         // Language Model Check
         const words = allEntries.get(b) || [];
         if (words.some(w => HIGH_FREQ_SWIPE.has(w))) {
             score += 20;
         }
         
         // Penalty for rare words (from full dictionary) that are not in core dictionary
         if (words.length > 0 && typeof REAL_VIETNAMESE_WORDS !== 'undefined') {
             const hasCoreWord = words.some(w => REAL_VIETNAMESE_WORDS.includes(w.toLowerCase()));
             if (!hasCoreWord) {
                 score -= 60; // Heavy penalty for non-core words like 'luya'
             }
         }
         
         let prevWord = null;
         if (this.activeTarget) {
             const textBefore = this.activeTarget.value.substring(0, this.activeTarget.selectionStart);
             const match = textBefore.match(/([a-zA-ZáàảãạăắằẳẵặâấầẩẫậéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵđĐ]+)[\s]*$/);
             if (match) prevWord = match[1].toLowerCase().normalize('NFC');
         }
         if (!prevWord && this.lastCommittedWord) {
             prevWord = this.lastCommittedWord.trim().toLowerCase().normalize('NFC');
         }
         
         return score;
      };

      matchedBases.sort((a, b) => getScore(b) - getScore(a));
      
      let prevWordContext = null;
      if (this.activeTarget) {
          const textBefore = this.activeTarget.value.substring(0, this.activeTarget.selectionStart);
          const match = textBefore.match(/([a-zA-ZáàảãạăắằẳẵặâấầẩẫậéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵđĐ]+)[\s]*$/);
          if (match) prevWordContext = match[1].toLowerCase().normalize('NFC');
      }
      if (!prevWordContext && this.lastCommittedWord) {
          prevWordContext = this.lastCommittedWord.trim().toLowerCase().normalize('NFC');
      }
      
      const topBases = matchedBases.slice(0, 8).map(b => {
          let words = [...(allEntries.get(b) || [])];
          words.sort((w1, w2) => {
              let score1 = HIGH_FREQ_SWIPE.has(w1) ? 20 : 0;
              let score2 = HIGH_FREQ_SWIPE.has(w2) ? 20 : 0;
              
              return score2 - score1;
          });
          return { base: b, score: getScore(b), words };
      });

      if (this.sandboxDebugLog) {
          const logMsg = `---
GeoFull: ${geoWord}
GeoCorners: ${geoWordCorners}
ForcedKeys: ${Array.from(forcedNormKeys).join('') || 'none'}
Total: ${matchedBases.length}
PrevWord: ${prevWordContext}
---
${topBases.slice(0,30).map((b, i) => `${i+1}. [${b.words[0] === b.base ? 'raw' : 'vi'}] ${b.words[0]} (score: ${b.score})`).join('\n')}
`;
          this.sandboxDebugLog.value = logMsg + '\n\n' + this.sandboxDebugLog.value;
      }

      let maxLen = Math.max(...topBases.map(obj => obj.words.length), 0);
      for (let i = 0; i < maxLen; i++) {
         for (let obj of topBases) {
            if (i < obj.words.length) {
               suggestions.push({ text: obj.words[i], type: 'vi', score: obj.score });
            }
         }
      }
    }
    
    // Không thêm từ vô nghĩa (raw geoWord) vào suggestions khi swipe không ra kết quả    
    const uniqueSuggestions = [];
    const seen = new Set();
    suggestions.forEach(item => {
      if (!seen.has(item.text)) {
         seen.add(item.text);
         uniqueSuggestions.push(item);
      }
    });
    
    if (!geoWord.includes(' ')) {
       const finalSuggestions = [];
       uniqueSuggestions.forEach(item => {
           finalSuggestions.push(item);
       });
       finalSuggestions.sort((a, b) => (b.score || 0) - (a.score || 0));
       return { geoWord, geoWordCorners, suggestions: finalSuggestions };
    }
    
    uniqueSuggestions.sort((a, b) => (b.score || 0) - (a.score || 0));
    return { geoWord, geoWordCorners, suggestions: uniqueSuggestions, forcedKeysStr: Array.from(forcedNormKeys).join('') };
}

  processSwipe() {
      if (this.swipePath.length === 0) return;
      const res = this.getSuggestionsForPath(this.swipePath, this.forcedIndices);
      
      if (res.geoWord.length === 1) {
           this.currentTapWord = res.geoWord;
           this.updateTapSuggestions();
      } else {
           if (this.suggestionContainer) {
               this.suggestionContainer.setAttribute('data-geo-word', res.geoWord);
           }
           
           // 1. Inject Custom Dictionary (1-to-N) at the top for Swipe
           const typedLower = res.geoWord.toLowerCase();
           if (typeof shortcutDictionary !== 'undefined' && shortcutDictionary.has(typedLower)) {
               const customMatches = shortcutDictionary.get(typedLower);
               // Remove them if they already exist in suggestions, then unshift
               res.suggestions = res.suggestions.filter(s => !customMatches.includes(s.text));
               
               // Prepend in reverse so they stay in order at the top
               for (let i = customMatches.length - 1; i >= 0; i--) {
                   res.suggestions.unshift({ text: customMatches[i], b60: res.geoWord, type: 'custom' });
               }
           }
           
           if (res.suggestions.length > 0) {
               // Prefer custom or non-raw words for auto-insertion
               let bestMatch = res.suggestions[0];
               const firstVi = res.suggestions.find(s => s.type === 'custom' || s.type !== 'raw');
               if (firstVi) bestMatch = firstVi;

               let textToInsert = bestMatch.text;
               
               let prefix = '';
               if (this.activeTarget) {
                   const textBefore = this.activeTarget.value.substring(0, this.activeTarget.selectionStart);
                   if (textBefore.length > 0 && !textBefore.endsWith(' ') && !textBefore.endsWith('\n')) {
                       prefix = ' ';
                   }
               }
               
               this.insertText(prefix + textToInsert);
               this.lastCommittedWord = textToInsert;
               
               // Render top 5 alternatives in the bar
               this.renderSuggestions(res.suggestions.slice(0, 5));
           }
      }
  }
  
  simplifyPath(points, epsilon) {
    if (points.length <= 2) return points;
    
    // Mọi phím được người dùng nhấn giữ/dừng tay (Dwell/Pause Key) bắt buộc phải là phím mỏ neo trong GeoCorners.
    // Thuật toán hình học không bao giờ được phép tự ý lọc bỏ.
    let pauseIndex = -1;
    for (let i = 1; i < points.length - 1; i++) {
        if (points[i].isPause) {
            pauseIndex = i;
            break; // Split at the first pause point we find
        }
    }
    if (pauseIndex !== -1) {
        const left = this.simplifyPath(points.slice(0, pauseIndex + 1), epsilon);
        const right = this.simplifyPath(points.slice(pauseIndex), epsilon);
        return left.slice(0, -1).concat(right);
    }
    
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
    return str.toLowerCase().normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '')
              .replace(/đ/g, 'd');
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
    if (!this.suggestionContainer) this.suggestionContainer = this.suggWrapper || this.suggestionsBar;
    this.suggestionContainer.innerHTML = '';
    if (suggestions.length === 0) return;
    
    const isCompressedTarget = this.activeTarget && this.activeTarget.id === 'compressed-input';
    
    const uiLog = [];
    
    suggestions.slice(0, 25).forEach(item => {
      const s = item.text;
      const type = item.type;
      const btn = document.createElement('button');
      btn.className = this.config.theme === 'android' ? 'gb-sugg' : 'vk-suggestion-btn';
      if (this.config.theme === 'android') {
          btn.style.background = 'transparent';
          btn.style.border = 'none';
          btn.style.borderRight = '1px solid #D1D3D8';
          btn.style.cursor = 'pointer';
      }
      
      let displayText = s;
      let insertText = s;
      
      let b60Equivalent = null;
      let vietnameseEquivalent = null;

      // If it's a base60 permutation or raw string, try to decode it
      if ((type === 'b60' || type === 'raw') && s.length <= 15 && s.match(/^[A-Za-z0-9\s]+$/)) {
          try {
              const b60words = s.split(' ');
              const decWords = b60words.map(b60 => {
                  const timeStr = base60ToTime(b60);
                  if (timeStr && !timeStr.includes('?')) {
                      const dec = decodeWord(timeStr);
                      if (dec && !dec.includes('?') && !dec.startsWith('[')) {
                          return dec;
                      }
                  }
                  return null;
              });
              if (decWords.every(w => w !== null)) {
                  vietnameseEquivalent = decWords.join(' ');
              }
          } catch(e) {}
      }

      // If it's a Vietnamese word or raw string (or decoded b60), try to encode it
      if ((type === 'vi' || type === 'b60' || type === 'raw') && s.match(/^[A-Za-z0-9àáảãạâầấẩẫậăằắẳẵặèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđs\s]+$/i)) {
          try {
              const words = s.split(' ');
              const encodedWords = words.map(w => timeToBase60(encodeWord(w)));
              if (encodedWords.every(b60 => b60 && !b60.includes('?') && !b60.includes('"') && b60.length > 0)) {
                  b60Equivalent = encodedWords.join(' ');
              }
          } catch(e) {}
      }

      const themeSubColor = this.config.theme === 'android' ? '#888' : '#0f0';

      if (type === 'tap_edu') {
          displayText = `<span>${s}</span>`;
          if (item.b60) {
              displayText += ` <span style="font-size:0.8em;color:#1A73E8;margin-left:4px">[${item.b60}]</span>`;
          }
          insertText = s;
      } else if (isCompressedTarget) {
          if (b60Equivalent) {
              displayText = `<span>${s}</span> <span style="font-size:0.7em;color:${themeSubColor}">[${b60Equivalent}]</span>`;
              insertText = b60Equivalent;
          } else if (vietnameseEquivalent) {
              displayText = `<span>${s}</span> <span style="font-size:0.7em;color:${themeSubColor}">[${vietnameseEquivalent}]</span>`;
              insertText = s;
          }
      } else {
          if (vietnameseEquivalent) {
              displayText = `<span>${s}</span> <span style="font-size:0.7em;color:${themeSubColor}">[${vietnameseEquivalent}]</span>`;
              insertText = vietnameseEquivalent;
          } else if (b60Equivalent) {
              displayText = `<span>${s}</span> <span style="font-size:0.7em;color:${themeSubColor}">[${b60Equivalent}]</span>`;
              insertText = s;
          }
      }
      
      btn.innerHTML = displayText;
      
      // Prevent focus loss when clicking suggestions with mouse (doesn't break touch scroll)
      btn.addEventListener('mousedown', (e) => e.preventDefault());
      
      // We use pointerup so we can differentiate between a tap and a scroll drag
      btn.addEventListener('pointerup', (e) => {
        if (!this.hasScrolledSugg) {
           e.preventDefault(); 
           
           if (this.currentTapWord && this.currentTapWord.length > 0) {
               const target = this.activeTarget;
               if (target) {
                   const start = Math.max(0, target.selectionStart - this.currentTapWord.length);
                   target.setRangeText('', start, target.selectionEnd, 'end');
               }
               this.currentTapWord = '';
           }
           
           // If there's a last committed word, this is an alternative replacement
           if (this.lastCommittedWord && this.lastCommittedWord.length > 0) {
               if (this.activeTarget) {
                   // Delete the last committed word
                   const target = this.activeTarget;
                   const start = target.selectionStart;
                   const len = this.lastCommittedWord.length;
                   
                   // Basic replacement (assuming cursor hasn't moved far)
                   const textBefore = target.value.substring(0, start);
                   if (textBefore.endsWith(this.lastCommittedWord)) {
                       target.setRangeText('', start - len, start, 'end');
                   }
               }
           }
           
           let prefix = '';
           if (this.activeTarget) {
               const textBefore = this.activeTarget.value.substring(0, this.activeTarget.selectionStart);
               if (textBefore.length > 0 && !textBefore.endsWith(' ') && !textBefore.endsWith('\n')) {
                   prefix = ' ';
               }
           }
           this.insertText(prefix + insertText);
           this.lastCommittedWord = insertText; 
           
           // Tracking
           const realWord = insertText.trim();
           if (realWord && typeof validVietnameseWords !== 'undefined' && validVietnameseWords.has(realWord.toLowerCase())) {
               try {
                   let stats = JSON.parse(localStorage.getItem('vk_word_stats') || '{}');
                   stats[realWord] = (stats[realWord] || 0) + 1;
                   localStorage.setItem('vk_word_stats', JSON.stringify(stats));
               } catch(e) {}
           } // become the new committed word
           
           // Restore focus to input if it lost it (fixes bug where clicking suggestion loses focus)
           if (this.activeTarget && document.activeElement !== this.activeTarget) {
               this.activeTarget.focus();
           }

           // Delay clear so global pointerdown doesn't hide keyboard
           setTimeout(() => this.clearSuggestions(), 10);
        }
      });
      this.suggestionContainer.appendChild(btn);
      
      uiLog.push(displayText.replace(/<[^>]*>?/gm, ''));
    });
    
    this.lastUiSuggestions = uiLog;
    this.updateDebugLog();
  }

  loadNotes() {
      const data = localStorage.getItem('snk_notes');
      if (data) {
          try {
              this.notesData = JSON.parse(data);
          } catch (e) {
              this.notesData = [];
          }
      } else {
          this.notesData = [];
      }
  }

  saveNotes() {
      localStorage.setItem('snk_notes', JSON.stringify(this.notesData));
  }

  exportNotes() {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(this.notesData, null, 2));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", "snk_notes_export.json");
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
  }

  importNotes() {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      input.onchange = (e) => {
          const file = e.target.files[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = (event) => {
              try {
                  const imported = JSON.parse(event.target.result);
                  if (Array.isArray(imported)) {
                      this.notesData = imported;
                      this.saveNotes();
                      this.renderClipboard();
                      alert('Import thành công!');
                  }
              } catch (e) {
                  alert('Lỗi import file!');
              }
          };
          reader.readAsText(file);
      };
      input.click();
  }

  addTemporaryNote(text) {
      this.notesData.unshift({
          id: 't' + Date.now(),
          type: 'temp',
          content: text,
          timestamp: Date.now(),
          displayMode: 0
      });
      if (this.notesData.filter(n => n.type === 'temp').length > 20) {
          const temps = this.notesData.filter(n => n.type === 'temp');
          const oldest = temps[temps.length - 1];
          this.notesData = this.notesData.filter(n => n.id !== oldest.id);
      }
      if (this.isClipboardOpen) this.renderClipboard();
  }

  getFormattedContent(note) {
      if (note.displayMode === 2) return note.content;
      
      
      try {
          const words = note.content.split(' ');
          if (note.displayMode === 1) {
              return words.map(w => {
                  const encoded = encodeWord(w);
                  return encoded ? encoded : w;
              }).join(' ');
          } else if (note.displayMode === 0) {
              return words.map(w => {
                  const encoded = encodeWord(w);
                  if (!encoded || encoded.includes('?')) return w;
                  const b60 = timeToBase60(encoded);
                  return b60 ? b60 : w;
              }).join(' ');
          }
      } catch(e) { return note.content || 'LỖI CATCH'; }
      return note.content || 'KHÔNG CÓ CONTENT';
  }

  renderClipboard() {
      const grid = this.clipboardView.querySelector('.vk-clipboard-grid');
      grid.innerHTML = '';
      
      let displayNotes = this.notesData;
      if (this.currentNetworkFilter) {
          const filterNote = this.notesData.find(n => n.id === this.currentNetworkFilter);
          if (filterNote) {
              const allowedIds = new Set([filterNote.id, ...(filterNote.relations || [])]);
              displayNotes = this.notesData.filter(n => allowedIds.has(n.id) && n.type !== 'temp');
          } else {
              this.currentNetworkFilter = null;
          }
      } else if (this.linkingSourceNote) {
          // Ẩn toàn bộ Note Tạm khi đang ở chế độ nối link
          displayNotes = this.notesData.filter(n => n.type !== 'temp');
      } else if (this.isTagViewMode) {
          // Chỉ hiện thị các Tag
          displayNotes = this.notesData.filter(n => n.type === 'tag');
      } else {
          // Màn hình chính mặc định: Ẩn toàn bộ Tag
          displayNotes = this.notesData.filter(n => n.type !== 'tag');
      }
      
      // Cập nhật UI Header
      const cbTitle = this.clipboardView.querySelector('.vk-cb-title');
      if (cbTitle) {
          if (this.isTagViewMode) {
              cbTitle.innerText = 'Danh sách Tags';
              if (this.cbTagViewBtn) this.cbTagViewBtn.style.background = 'rgba(52,199,89,0.5)';
          } else {
              cbTitle.innerText = 'Clipboard';
              if (this.cbTagViewBtn) this.cbTagViewBtn.style.background = 'rgba(52,199,89,0.2)';
          }
      }
      
      // Thêm nút Hủy lọc nếu đang ở chế độ Mạng lưới
      if (this.currentNetworkFilter) {
          const cancelFilterBtn = document.createElement('div');
          cancelFilterBtn.className = 'vk-clip-card';
          cancelFilterBtn.style.gridColumn = '1 / -1';
          cancelFilterBtn.style.background = 'rgba(255,59,48,0.2)';
          cancelFilterBtn.style.border = '1px solid #FF3B30';
          cancelFilterBtn.style.textAlign = 'center';
          cancelFilterBtn.innerHTML = '<span style="color: #FF3B30; font-weight: bold;">✕ Thoát chế độ xem Mạng lưới</span>';
          cancelFilterBtn.addEventListener('click', () => {
              this.currentNetworkFilter = null;
              this.renderClipboard();
          });
          grid.appendChild(cancelFilterBtn);
      }

      // Thêm Banner nhắc nhở nếu đang ở chế độ Linking Mode
      if (this.linkingSourceNote) {
          const linkBanner = document.createElement('div');
          linkBanner.className = 'vk-clip-card';
          linkBanner.style.gridColumn = '1 / -1';
          linkBanner.style.background = 'rgba(0,122,255,0.1)';
          linkBanner.style.border = '2px dashed #007AFF';
          linkBanner.style.textAlign = 'center';
          linkBanner.innerHTML = `<div style="color: #007AFF; font-weight: bold; margin-bottom: 5px;">Bật chế độ Liên Kết</div><div style="font-size: 13px; color: #ccc;">Hãy click vào một Note/Tag bên dưới để nối với Note hiện tại.</div><button style="margin-top: 10px; padding: 5px 15px; border-radius: 8px; background: #FF3B30; color: white; border: none;">Hủy liên kết</button>`;
          
          linkBanner.querySelector('button').addEventListener('click', () => {
              this.linkingSourceNote = null;
              this.renderClipboard();
          });
          grid.appendChild(linkBanner);
      }
      
      const tempNotes = displayNotes.filter(n => n.type === 'temp');
      const permNotes = displayNotes.filter(n => n.type !== 'temp');
      
      const allNotesToRender = [];
      if (!this.isTagViewMode && !this.currentNetworkFilter) {
          if (tempNotes.length > 0) {
              allNotesToRender.push({ isDivider: true, text: 'Gần đây (Mới copy)', color: '#FF9500' });
              allNotesToRender.push(...tempNotes);
          }
          if (permNotes.length > 0) {
              allNotesToRender.push({ isDivider: true, text: 'Đã lưu (Ghim)', color: '#007AFF', borderTop: tempNotes.length > 0 });
              allNotesToRender.push(...permNotes);
          }
      } else {
          allNotesToRender.push(...tempNotes);
          allNotesToRender.push(...permNotes);
      }
      
      allNotesToRender.forEach(item => {
          if (item.isDivider) {
              const divider = document.createElement('div');
              divider.style.gridColumn = '1 / -1';
              divider.style.color = item.color;
              divider.style.fontSize = '12px';
              divider.style.fontWeight = 'bold';
              divider.style.marginBottom = '-5px';
              if (item.borderTop) {
                  divider.style.marginTop = '5px';
                  divider.style.borderTop = '1px solid #333';
                  divider.style.paddingTop = '10px';
              }
              divider.innerText = item.text;
              grid.appendChild(divider);
              return;
          }
          
          const note = item;
          const card = document.createElement('div');
          card.className = 'vk-clip-card';
          
          // Đánh dấu nổi bật Note đang làm gốc liên kết
          if (this.linkingSourceNote && this.linkingSourceNote.id === note.id) {
              card.style.boxShadow = '0 0 10px #007AFF';
              card.style.border = '1px solid #007AFF';
          }
          
          let iconHtml = '';
          if (note.type === 'temp') {
              iconHtml = '<span style="color: #FF9500; font-weight: bold;">📋 Note tạm</span>';
              card.style.border = '1px solid #FF9500';
              card.style.background = '#FFF3E0';
          } else if (note.type === 'tag') {
              iconHtml = '<span style="color: #34C759; font-weight: bold;"># Tag</span>';
          } else {
              iconHtml = '<span style="color: #007AFF; font-weight: bold;">📌 Note</span>';
          }
          
          let tagsHtml = '';
          let linksHtml = '';
          if (note.relations && note.relations.length > 0) {
              const relatedTags = [];
              let noteLinksCount = 0;
              note.relations.forEach(rId => {
                  const related = this.notesData.find(n => n.id === rId);
                  if (related) {
                      if (related.type === 'tag') relatedTags.push(related.content);
                      else noteLinksCount++;
                  }
              });
              
              if (relatedTags.length > 0) {
                  // Thay thế chữ "📌 Note" bằng danh sách Tag để tiết kiệm diện tích
                  iconHtml = `<span style="color: #34C759; font-weight: bold; font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 70px;">${relatedTags.map(t => '#' + t).join(' ')}</span>`;
              }
              if (noteLinksCount > 0) {
                  linksHtml = `<span style="font-size: 12px; color: #aaa; margin-left: auto;">🔗 ${noteLinksCount}</span>`;
              }
          }
          
          card.innerHTML = `
             <div class="vk-clip-header" style="display: flex; align-items: center;">${iconHtml}${linksHtml}</div>
             <div class="vk-clip-content" style="margin-top: 5px;">${this.getFormattedContent(note)}</div>
          `;
          
          card.addEventListener('click', (e) => {
              // BUMP TO TOP: Tự động đẩy Note vừa dùng lên đầu mảng
              const noteIndex = this.notesData.findIndex(n => n.id === note.id);
              if (noteIndex > 0) {
                  const [bumpedNote] = this.notesData.splice(noteIndex, 1);
                  this.notesData.unshift(bumpedNote);
                  this.saveNotes();
              }

              if (this.linkingSourceNote) {
                  // Đang trong chế độ Link
                  if (this.linkingSourceNote.id === note.id) {
                      alert('Không thể tự liên kết với chính nó!');
                      return;
                  }
                  
                  // Thực hiện liên kết 2 chiều
                  if (!note.relations) note.relations = [];
                  const srcNote = this.notesData.find(n => n.id === this.linkingSourceNote.id);
                  if (srcNote) {
                      if (!srcNote.relations) srcNote.relations = [];
                      if (!srcNote.relations.includes(note.id)) srcNote.relations.push(note.id);
                      if (!note.relations.includes(srcNote.id)) note.relations.push(srcNote.id);
                      this.saveNotes();
                      this.linkingSourceNote = null; // Tắt chế độ
                      this.renderClipboard();
                      alert('🔗 Đã liên kết thành công!');
                  }
              } else {
                  // Click bình thường
                  this.showClipboardMenu(note, card, e.clientX, e.clientY);
              }
          });
          
          if (this.activeNoteId === note.id) {
              if (!card._originalBorder) {
                  card._originalBorder = card.style.border;
              }
              card.style.border = '2px solid #0f0';
              card.style.boxShadow = '0 0 15px rgba(0, 255, 0, 0.8)';
              this.lastActiveCard = card;
          }
          
          grid.appendChild(card);
      });
  }

  showClipboardMenu(note, card, x, y) {
      let menu = this.clipboardView.querySelector('.vk-clip-menu');
      if (!menu) {
          menu = document.createElement('div');
          menu.className = 'vk-clip-menu';
          this.clipboardView.appendChild(menu);
      }
      menu.innerHTML = '';
      let isHelpMode = false;
      let helpTextDiv = document.createElement('div');
      helpTextDiv.className = 'vk-clip-help-text';
      helpTextDiv.style.display = 'none';

      const explanations = {
          '❓': 'Bật/tắt chế độ Trợ giúp',
          '👁️': note.displayMode === 1 ? 'Xem bản gốc.' : 'Xem bản số (Time code).',
          '🔍': note.displayMode === 0 ? 'Xem bản gốc.' : 'Xem bản nén (Base60).',
          '🔢': 'Dán mã số (Time code).',
          '📦': 'Dán mã nén (Base60).',
          '📋': 'Dán nguyên bản nội dung.',
          '📌': 'Lưu Note tạm thành Note cố định.',
          '🏷️': 'Gắn thẻ (Tag) phân loại.',
          '🔗': 'Tạo liên kết với Note khác.',
          '🕸️': 'Lọc các Note theo mạng lưới liên kết.',
          '✏️': 'Chỉnh sửa nội dung.',
          '🗑️': 'Xóa khỏi bộ nhớ.'
      };

      const addOption = (icon, onClick) => {
          const btn = document.createElement('button');
          btn.innerHTML = `<span>${icon}</span>`;
          btn.addEventListener('click', (e) => { 
              e.stopPropagation();
              if (isHelpMode && icon !== '❓') {
                  helpTextDiv.innerHTML = `<strong>${icon}</strong>: ${explanations[icon] || 'Không có giải thích.'}`;
                  // Trigger animation
                  helpTextDiv.style.animation = 'none';
                  void helpTextDiv.offsetWidth; 
                  helpTextDiv.style.animation = 'menu-pop 0.2s forwards';
              } else {
                  onClick(btn); 
                  if (icon !== '❓') {
                      if (typeof closeMenu === 'function') closeMenu();
                  }
              }
          });
          menu.appendChild(btn);
      };
      
      addOption('❓', (btn) => {
          isHelpMode = !isHelpMode;
          if (isHelpMode) {
              btn.style.background = 'rgba(0, 255, 0, 0.4)';
              btn.style.borderColor = '#0f0';
              helpTextDiv.style.display = 'block';
              helpTextDiv.innerHTML = "<em>Đang ở Chế độ Trợ giúp. Nhấp icon bất kỳ để xem.</em>";
          } else {
              btn.style.background = '';
              btn.style.borderColor = '';
              helpTextDiv.style.display = 'none';
          }
      });
      
      // 👁️ View time code
      addOption('👁️', () => { 
          note.displayMode = note.displayMode === 1 ? 2 : 1; 
          this.renderClipboard(); 
      });
      
      // 🔍 View compressed code
      addOption('🔍', () => { 
          note.displayMode = note.displayMode === 0 ? 2 : 0; 
          this.renderClipboard(); 
      });
      
      // 🔢 Paste time code
      addOption('🔢', () => {
          if (this.activeTarget) {
              const formatted = this.getFormattedContent({ content: note.content, displayMode: 1 });
              this.activeTarget.setRangeText(formatted, this.activeTarget.selectionStart, this.activeTarget.selectionEnd, 'end');
              this.activeTarget.dispatchEvent(new Event('input', { bubbles: true }));
              this.activeTarget.focus();
          }
          this.toggleClipboard();
      });
      
      // 📦 Paste compressed code
      addOption('📦', () => {
          if (this.activeTarget) {
              const formatted = this.getFormattedContent({ content: note.content, displayMode: 0 });
              this.activeTarget.setRangeText(formatted, this.activeTarget.selectionStart, this.activeTarget.selectionEnd, 'end');
              this.activeTarget.dispatchEvent(new Event('input', { bubbles: true }));
              this.activeTarget.focus();
          }
          this.toggleClipboard();
      });
      
      // 📋 Paste original
      addOption('📋', () => {
          if (this.activeTarget) {
              this.activeTarget.setRangeText(note.content, this.activeTarget.selectionStart, this.activeTarget.selectionEnd, 'end');
              this.activeTarget.dispatchEvent(new Event('input', { bubbles: true }));
              this.activeTarget.focus();
          }
          this.toggleClipboard();
      });
      
      // Nút 📌 chỉ dành cho temp để lưu thành note thường (không làm gì thêm)
      if (note.type === 'temp') {
          addOption('📌', () => { 
              note.type = 'note'; 
              this.saveNotes(); 
              this.renderClipboard(); 
          });
      }

      // Luôn hiện 🏷️ (Gắn Tag) cho mọi note
      addOption('🏷️', () => {
          if (note.type === 'temp') {
              note.type = 'note';
          }
          const tagsStr = prompt('Nhập các Tag cách nhau bởi dấu phẩy (VD: work, idea):', '');
          if (tagsStr) {
              const tags = tagsStr.split(',').map(t => t.trim()).filter(t => t);
              if (!note.relations) note.relations = [];
              let addedCount = 0;
              
              tags.forEach(tagName => {
                  // Tìm tag đã tồn tại
                  let tagNote = this.notesData.find(n => n.type === 'tag' && n.content === tagName);
                  // Nếu chưa có thì tạo mới tag
                  if (!tagNote) {
                      tagNote = {
                          id: 'tag' + Date.now() + Math.random(),
                          type: 'tag',
                          content: tagName,
                          displayMode: 2,
                          relations: []
                      };
                      this.notesData.unshift(tagNote);
                  }
                  
                  if (!tagNote.relations) tagNote.relations = [];
                  
                  // Nối 2 chiều
                  if (!note.relations.includes(tagNote.id)) note.relations.push(tagNote.id);
                  if (!tagNote.relations.includes(note.id)) tagNote.relations.push(note.id);
                  addedCount++;
              });
              
              if (addedCount > 0) {
                  this.saveNotes();
                  this.renderClipboard();
                  alert(`Đã gắn thành công ${addedCount} tag!`);
              } else {
                  this.saveNotes();
                  this.renderClipboard();
              }
          } else {
              this.saveNotes();
              this.renderClipboard();
          }
      });

      // Luôn hiện 🔗 (Liên Kết) cho mọi note
      addOption('🔗', () => { 
          if (note.type === 'temp') {
              note.type = 'note';
          }
          this.linkingSourceNote = note;
          this.saveNotes();
          this.renderClipboard();
      });
      
      if (note.type === 'tag' || (note.relations && note.relations.length > 0)) {
          addOption('🕸️', () => {
              if (this.currentNetworkFilter === note.id) {
                  this.currentNetworkFilter = null;
              } else {
                  this.currentNetworkFilter = note.id;
              }
              this.renderClipboard();
          });
      }
      
      addOption('✏️', () => {
          const newText = prompt('Sửa nội dung:', note.content);
          if (newText !== null) { note.content = newText; this.saveNotes(); this.renderClipboard(); }
      });
      
      addOption('🗑️', () => {
          this.notesData = this.notesData.filter(n => n.id !== note.id);
          this.saveNotes();
          this.renderClipboard();
      });
      
      menu.prepend(helpTextDiv);
      menu.style.display = 'grid';
      menu.style.animation = 'slide-up 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.2) forwards';
      
      let overlay = this.clipboardView.querySelector('.vk-clip-overlay');
      if (!overlay) {
          overlay = document.createElement('div');
          overlay.className = 'vk-clip-overlay';
          this.clipboardView.appendChild(overlay);
      }
      overlay.style.display = 'block';
      
      // Highlight the active card and remove from previous
      this.activeNoteId = note.id;
      
      // The visual update can rely on renderClipboard if it's called, 
      // but to be instant without re-rendering, we apply it directly to the DOM here:
      if (this.lastActiveCard && this.lastActiveCard !== card) {
          this.lastActiveCard.style.border = this.lastActiveCard._originalBorder || '';
          this.lastActiveCard.style.boxShadow = '';
      }
      if (!card._originalBorder) {
          card._originalBorder = card.style.border;
      }
      card.style.border = '2px solid #0f0';
      card.style.boxShadow = '0 0 15px rgba(0, 255, 0, 0.8)';
      this.lastActiveCard = card;
      
      const closeMenu = () => {
          menu.style.animation = 'slide-down 0.2s forwards';
          overlay.style.display = 'none';
          setTimeout(() => {
              menu.style.display = 'none';
          }, 200);
      };
      
      overlay.onclick = closeMenu;
      
      const closeBtn = document.createElement('button');
      closeBtn.className = 'vk-clip-close-btn';
      closeBtn.innerHTML = '✕';
      closeBtn.onclick = closeMenu;
      menu.appendChild(closeBtn);
  }

  // ================= DICTIONARY UI LOGIC =================
  setupDictionaryEvents() {
      // Back buttons
      this.dictView.querySelector('.vk-dict-back-btn').addEventListener('click', () => {
          this.toggleDictView();
      });
      this.dictEditView.querySelector('.vk-dict-edit-back-btn').addEventListener('click', () => {
          this.dictEditView.style.display = 'none';
      });

      // Add New Word button
      this.dictView.querySelector('.vk-dict-add-btn').addEventListener('click', () => {
          this.openDictEditView('');
      });

      // Import / Export
      this.dictView.querySelector('.vk-dict-export-btn').addEventListener('click', () => this.exportDictionary());
      this.dictView.querySelector('.vk-dict-import-btn').addEventListener('click', () => this.importDictionary());

      // Search
      this.dictView.querySelector('.vk-dict-search').addEventListener('input', (e) => {
          this.renderDictList(e.target.value.toLowerCase());
      });

      // Save Button
      this.dictEditView.querySelector('.vk-dict-save-btn').addEventListener('click', () => {
          this.saveDictEntry();
      });

      // Add Word Input Row
      this.dictEditView.querySelector('.vk-dict-add-word-btn').addEventListener('click', () => {
          const container = this.dictEditView.querySelector('.vk-dict-words-container');
          const input = document.createElement('input');
          input.type = 'text';
          input.className = 'vk-dict-word-input';
          input.placeholder = 'Ví dụ: Xã hội';
          input.style = 'width:100%; padding: 10px; border: 1px solid #555; background: #2c2c2e; color: #fff; border-radius: 8px; outline: none; font-size: 16px;';
          container.appendChild(input);
          input.focus();
      });
  }

  toggleDictView() {
      if (this.dictView.style.display === 'flex') {
          this.dictView.style.display = 'none';
          this.updateTapSuggestions(); // refresh suggestions in case dict changed
      } else {
          // Hide clipboard if open
          this.clipboardView.style.display = 'none';
          this.dictView.style.display = 'flex';
          this.renderDictList();
      }
  }

  renderMultiDictList() {
      const list = this.settingsWrapper.querySelector('.vk-multi-dict-list');
      if (!list) return;
      list.innerHTML = '';
      
      if (!window.dictManager) return;
      
      const dicts = Array.from(window.dictManager.registeredDicts.values());
      dicts.forEach(dict => {
          const item = document.createElement('div');
          item.style.cssText = 'display: flex; justify-content: space-between; align-items: center; padding: 12px; background: #2c2c2e; margin-bottom: 8px; border-radius: 8px;';
          
          const isActive = window.dictManager.activeDictIds.has(dict.id);
          
          let nameHtml = `<div style="color: #fff; font-size: 16px;">${dict.name}</div>`;
          nameHtml += `<div style="color: #888; font-size: 12px;">Ưu tiên: ${dict.priority}</div>`;
          
          const toggleBtn = document.createElement('button');
          toggleBtn.innerHTML = isActive ? 'BẬT' : 'TẮT';
          toggleBtn.style.cssText = `padding: 6px 12px; border-radius: 16px; border: none; font-weight: bold; cursor: pointer; background: ${isActive ? '#34C759' : '#3A3A3C'}; color: ${isActive ? '#fff' : '#8E8E93'};`;
          
          toggleBtn.addEventListener('click', () => {
              window.dictManager.toggle(dict.id);
              this.renderMultiDictList(); 
          });
          
          const leftDiv = document.createElement('div');
          leftDiv.innerHTML = nameHtml;
          
          item.appendChild(leftDiv);
          item.appendChild(toggleBtn);
          list.appendChild(item);
      });
  }

  renderDictList(filterQuery = '') {
      const listContainer = this.dictView.querySelector('.vk-dict-list');
      listContainer.innerHTML = '';
      
      const selector = this.dictView.querySelector('.vk-dict-selector');
      if (selector && selector.options.length === 0 && window.dictManager) {
          const dicts = Array.from(window.dictManager.registeredDicts.values());
          dicts.forEach(d => {
              const opt = document.createElement('option');
              opt.value = d.id;
              opt.textContent = d.name;
              selector.appendChild(opt);
          });
          if (!this.editingDictId) this.editingDictId = 'dict_user_custom';
          selector.value = this.editingDictId;
          selector.onchange = (e) => {
              this.editingDictId = e.target.value;
              this.renderDictList();
          };
      }
      
      const activeDict = window.dictManager ? window.dictManager.registeredDicts.get(this.editingDictId) : null;
      const shortcutsObj = activeDict && activeDict.data && activeDict.data.shortcuts ? activeDict.data.shortcuts : {};
      
      const keys = Object.keys(shortcutsObj).sort();
      let hasItem = false;

      keys.forEach(shortcut => {
          const words = shortcutsObj[shortcut];
          if (filterQuery && !shortcut.includes(filterQuery) && !words.some(w => w.toLowerCase().includes(filterQuery))) return;
          
          hasItem = true;
          const item = document.createElement('div');
          item.style = 'background: #2c2c2e; margin-bottom: 8px; padding: 12px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center;';
          
          const textContainer = document.createElement('div');
          textContainer.style = 'flex: 1; cursor: pointer;';
          textContainer.innerHTML = `<div style="color: #1A73E8; font-weight: bold; font-size: 16px;">${shortcut}</div>
                                     <div style="color: #aaa; font-size: 14px; margin-top: 4px;">${words.join(', ')}</div>`;
          
          // Click to edit
          textContainer.addEventListener('click', () => this.openDictEditView(shortcut));
          
          const deleteBtn = document.createElement('button');
          deleteBtn.innerHTML = '🗑️';
          deleteBtn.style = 'background: none; border: none; font-size: 16px; cursor: pointer; padding: 10px;';
          deleteBtn.addEventListener('click', (e) => {
              e.stopPropagation();
              if (confirm(`Xóa phím tắt '${shortcut}'?`)) {
                  delete shortcutsObj[shortcut];
                  window.dictManager.updateDictShortcuts(this.editingDictId, shortcutsObj);
                  this.renderDictList(filterQuery);
              }
          });
          
          item.appendChild(textContainer);
          item.appendChild(deleteBtn);
          listContainer.appendChild(item);
      });
      
      if (!hasItem) {
          listContainer.innerHTML = '<div style="text-align:center; color:gray; margin-top: 20px;">Không có từ nào.</div>';
      }
  }

  openDictEditView(shortcut = '') {
      this.dictEditView.style.display = 'flex';
      const shortcutInput = this.dictEditView.querySelector('.vk-dict-shortcut-input');
      const container = this.dictEditView.querySelector('.vk-dict-words-container');
      
      shortcutInput.value = shortcut;
      container.innerHTML = ''; // Clear old inputs
      
      const activeDict = window.dictManager ? window.dictManager.registeredDicts.get(this.editingDictId) : null;
      const shortcutsObj = activeDict && activeDict.data && activeDict.data.shortcuts ? activeDict.data.shortcuts : {};
      const words = shortcutsObj[shortcut] || [''];
      words.forEach(word => {
          const input = document.createElement('input');
          input.type = 'text';
          input.className = 'vk-dict-word-input';
          input.value = word;
          input.placeholder = 'Ví dụ: Xã hội';
          input.style = 'width:100%; padding: 10px; border: 1px solid #555; background: #2c2c2e; color: #fff; border-radius: 8px; outline: none; font-size: 16px;';
          container.appendChild(input);
      });
  }

  saveDictEntry() {
      const shortcutInput = this.dictEditView.querySelector('.vk-dict-shortcut-input');
      const inputs = this.dictEditView.querySelectorAll('.vk-dict-word-input');
      
      let words = [];
      inputs.forEach(inp => {
          if (inp.value.trim()) words.push(inp.value.trim());
      });
      
      if (words.length === 0) {
          alert('Vui lòng nhập ít nhất một từ hiển thị!');
          return;
      }
      
      let shortcut = shortcutInput.value.trim().toLowerCase();
      
      // Auto-generate shortcut logic if empty
      if (!shortcut) {
          const firstWord = words[0];
          const parts = firstWord.split(/\s+/);
          if (parts.length === 1) {
              shortcut = firstWord.toLowerCase();
          } else {
              shortcut = parts.map(p => {
                  let c = p.charAt(0).toLowerCase();
                  if (c === 'đ') return 'd';
                  const unaccented = c.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
                  return unaccented;
              }).join('');
          }
      }
      
      const activeDict = window.dictManager ? window.dictManager.registeredDicts.get(this.editingDictId) : null;
      if (!activeDict) return;
      if (!activeDict.data) activeDict.data = {};
      if (!activeDict.data.shortcuts) activeDict.data.shortcuts = {};
      const shortcutsObj = activeDict.data.shortcuts;
      
      shortcutsObj[shortcut] = words;
      window.dictManager.updateDictShortcuts(this.editingDictId, shortcutsObj);
      
      this.dictEditView.style.display = 'none';
      this.renderDictList();
  }

  exportDictionary() {
      const activeDict = window.dictManager ? window.dictManager.registeredDicts.get(this.editingDictId) : null;
      if (!activeDict) return;
      const shortcutsObj = activeDict.data && activeDict.data.shortcuts ? activeDict.data.shortcuts : {};
      
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(shortcutsObj, null, 2));
      const dlAnchorElem = document.createElement('a');
      dlAnchorElem.setAttribute("href", dataStr);
      dlAnchorElem.setAttribute("download", (this.editingDictId || "secretnote_dictionary") + "_export.json");
      dlAnchorElem.click();
  }

  importDictionary() {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'application/json';
      input.onchange = e => { 
          const file = e.target.files[0]; 
          if (!file) return;
          const reader = new FileReader();
          reader.readAsText(file,'UTF-8');
          reader.onload = readerEvent => {
              try {
                  const content = readerEvent.target.result;
                  const parsed = JSON.parse(content);
                  // Merge with existing
                  const activeDict = window.dictManager ? window.dictManager.registeredDicts.get(this.editingDictId) : null;
                  if (!activeDict) return;
                  if (!activeDict.data) activeDict.data = {};
                  if (!activeDict.data.shortcuts) activeDict.data.shortcuts = {};
                  const shortcutsObj = activeDict.data.shortcuts;
                  
                  Object.keys(parsed).forEach(k => {
                      if (Array.isArray(parsed[k])) {
                          if (!shortcutsObj[k]) shortcutsObj[k] = [];
                          parsed[k].forEach(w => {
                              if (!shortcutsObj[k].includes(w)) {
                                  shortcutsObj[k].push(w);
                              }
                          });
                      }
                  });
                  window.dictManager.updateDictShortcuts(this.editingDictId, shortcutsObj);
                  this.renderDictList();
                  alert('Nhập từ điển thành công!');
              } catch(err) {
                  alert('File không hợp lệ!');
              }
          }
      }
      input.click();
  }
}

globalThis.SecretNoteKeyboard = SecretNoteKeyboard;
if (typeof window !== 'undefined') window.SecretNoteKeyboard = SecretNoteKeyboard;

// SNK Default Auto-Initialization
if (typeof document !== 'undefined') {
  const initSNK = () => {
    // Check if we're in the TimeCypher app (index.html)
    if (document.getElementById('text-input')) {
        window.snk = new SecretNoteKeyboard({ 
            theme: 'web',
            placement: 'inline',
            bindMode: 'global',
            enableClipboard: true 
        });
    }
  };
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSNK);
  } else {
    initSNK();
  }
}
