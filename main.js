const btnLinkPrev = document.getElementById('btn-link-prev');
import {
  CONSONANTS_BASE, CONSONANTS_EXTRA,
  RHYMES_BASE, RHYMES_EXTRA_1, RHYMES_EXTRA_2,
  BASE60_MAPPING, SHORT_WORDS, TWO_DIGIT_WORDS, ENGLISH_DICT, SHORTCUT_WORDS,
  REAL_VIETNAMESE_WORDS
} from './data.js';

import {
  encodeWord, decodeWord, timeToBase60, base60ToTime, TOKEN_REGEX
, applyTone} from './vcomp.js';

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

const btnEncode = document.getElementById('btn-encode');
const btnDecode = document.getElementById('btn-decode');

const btnCopyText = document.getElementById('btn-copy-text');
const btnCopyTime = document.getElementById('btn-copy-time');
const btnCopyCompressed = document.getElementById('btn-copy-compressed');

const btnClearText = document.getElementById('btn-clear-text');
const btnClearTime = document.getElementById('btn-clear-time');
const btnClearCompressed = document.getElementById('btn-clear-compressed');

const breakdownList = document.getElementById('breakdown-list');

function renderBreakdown(pairs) {
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
    txtEncrypted.value = '';
    if(txtCompressed) txtCompressed.value = '';
    renderBreakdown([]);
    return;
  }
  const tokens = text.split(TOKEN_REGEX);
  let encryptedParts = [];
  let compressedParts = [];
  let breakdownPairs = [];

  tokens.forEach(token => {
    if (!token) return;
    if (token.match(/^[a-zA-Z0-9_\u00C0-\u024F\u1E00-\u1EFF]+$/)) {
      const timeCode = encodeWord(token);
      const b60Code = timeToBase60(timeCode);
      encryptedParts.push(timeCode);
      compressedParts.push(b60Code);
      breakdownPairs.push({ word: token, time: timeCode, base60: b60Code });
    
    } else if (token.startsWith('[') && token.endsWith(']')) {
      encryptedParts.push(token);
      compressedParts.push(token);
      breakdownPairs.push({ word: token.substring(1, token.length - 1), time: token, base60: token });
    } else {
      encryptedParts.push(token);
      compressedParts.push(token);
    }
  });

  txtEncrypted.value = encryptedParts.join('');
  if(txtCompressed) txtCompressed.value = compressedParts.join('');
  renderBreakdown(breakdownPairs);
  saveCurrentNote();
}

function syncFromTime() {
  const text = txtEncrypted.value;
  if (!text.trim()) {
    txtDecrypted.value = '';
    if(txtCompressed) txtCompressed.value = '';
    renderBreakdown([]);
    return;
  }
  const tokens = text.split(TOKEN_REGEX);
  let decryptedParts = [];
  let compressedParts = [];
  let breakdownPairs = [];

  tokens.forEach(token => {
    if (!token) return;
    if (token.match(/^[a-zA-Z0-9_\u00C0-\u024F\u1E00-\u1EFF]+$/)) {
      const b60Code = timeToBase60(token);
      const decoded = decodeWord(token);
      decryptedParts.push(decoded);
      compressedParts.push(b60Code);
      breakdownPairs.push({ time: token, word: decoded, base60: b60Code });
    
    } else if (token.startsWith('[') && token.endsWith(']')) {
      decryptedParts.push(token);
      compressedParts.push(token);
      breakdownPairs.push({ time: token, word: token.substring(1, token.length - 1), base60: token });
    } else {
      decryptedParts.push(token);
      compressedParts.push(token);
    }
  });

  txtDecrypted.value = decryptedParts.join('');
  if(txtCompressed) txtCompressed.value = compressedParts.join('');
  renderBreakdown(breakdownPairs);
  saveCurrentNote();
}

function syncFromCompressed() {
  if(!txtCompressed) return;
  const text = txtCompressed.value.replace(/[\n\r]/g, '');
  if (!text.trim()) {
    txtDecrypted.value = '';
    txtEncrypted.value = '';
    renderBreakdown([]);
    return;
  }
  const tokens = text.split(TOKEN_REGEX);
  let timeParts = [];
  let decryptedParts = [];
  let breakdownPairs = [];

  tokens.forEach(token => {
    if (!token) return;
    if (token.match(/^[a-zA-Z0-9_\u00C0-\u024F\u1E00-\u1EFF]+$/)) {
      const timeCode = base60ToTime(token);
      const decoded = decodeWord(timeCode);
      timeParts.push(timeCode);
      decryptedParts.push(decoded);
      breakdownPairs.push({ base60: token, time: timeCode, word: decoded });
    
    } else if (token.startsWith('[') && token.endsWith(']')) {
      timeParts.push(token);
      decryptedParts.push(token);
      breakdownPairs.push({ base60: token, time: token, word: token.substring(1, token.length - 1) });
    } else {
      timeParts.push(token);
      decryptedParts.push(token);
    }
  });

  txtEncrypted.value = timeParts.join('');
  txtDecrypted.value = decryptedParts.join('');
  renderBreakdown(breakdownPairs);
  saveCurrentNote();
}

btnEncode.addEventListener('click', syncFromDecrypted);
btnDecode.addEventListener('click', syncFromTime);

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

txtDecrypted.addEventListener('input', () => {
  if (document.activeElement === txtDecrypted) handleInput(syncFromDecrypted);
});
txtEncrypted.addEventListener('input', () => {
  if (document.activeElement === txtEncrypted) handleInput(syncFromTime);
});

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

if(txtCompressed) {
  txtCompressed.addEventListener('input', (e) => {
    let val = txtCompressed.value;
    let cursor = txtCompressed.selectionStart;
    
    // 1. Cycle state when 'f' is typed
    if (val.toLowerCase().includes('f')) {
      let oldLen = val.length;
      let temp = '';
      while (temp !== val) {
        temp = val;
        val = val.replace(/â‡§f/gi, 'â‡ª');
        val = val.replace(/â‡ªf/gi, '');
        val = val.replace(/ff/gi, 'â‡ª');
      }
      val = val.replace(/f/gi, 'â‡§');
      cursor -= (oldLen - val.length);
    }

    // 2. Capitalize the typed character based on cursor state
    if (cursor >= 2) {
      const prev2 = val.substring(cursor - 2, cursor);
      if (prev2.match(/â‡§[a-z]/i)) {
        const upper = prev2[1].toUpperCase();
        val = val.substring(0, cursor - 2) + upper + val.substring(cursor);
        cursor = cursor - 1; // â‡§ is consumed
      } else if (prev2.match(/â‡ª[a-z]/i)) {
        const upper = prev2[1].toUpperCase();
        val = val.substring(0, cursor - 2) + upper + 'â‡ª' + val.substring(cursor);
        // â‡ª stays after the typed character, cursor stays same
      } else if (prev2.match(/â‡ª[^a-zA-Zâ‡§â‡ª]/i)) {
        val = val.substring(0, cursor - 2) + prev2[1] + 'â‡ª' + val.substring(cursor);
        // â‡ª jumps past spaces/symbols
      }
    }
    
    if (txtCompressed.value !== val) {
      txtCompressed.value = val;
      txtCompressed.selectionStart = txtCompressed.selectionEnd = Math.max(0, cursor);
    }
    if (document.activeElement === txtCompressed) handleInput(syncFromCompressed);
  });
}

const setupClearCopy = (btnCopy, btnClear, txtInput) => {
  if(btnClear) {
    btnClear.addEventListener('click', () => {
      txtInput.value = '';
      if(txtInput === txtDecrypted) syncFromDecrypted();
      else if(txtInput === txtEncrypted) syncFromTime();
      else if(txtInput === txtCompressed) syncFromCompressed();
    });
  }
  if(btnCopy) {
    btnCopy.addEventListener('click', () => {
      navigator.clipboard.writeText(txtInput.value).then(() => {
        const orig = btnCopy.textContent;
        btnCopy.textContent = 'COPIED!';
        setTimeout(() => btnCopy.textContent = orig, 2000);
      });
    });
  }
};

setupClearCopy(btnCopyText, btnClearText, txtDecrypted);
setupClearCopy(btnCopyTime, btnClearTime, txtEncrypted);
setupClearCopy(btnCopyCompressed, btnClearCompressed, txtCompressed);

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
const btnPlayground = document.getElementById('btn-playground');
const searchNote = document.getElementById('search-note');
const notesList = document.getElementById('notes-list');
const tabBtns = document.querySelectorAll('.tab-btn');
const btnArchiveNote = document.getElementById('btn-archive-note');
const btnDeleteNote = document.getElementById('btn-delete-note');

function enterSandboxMode(silent = false) {
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
  
  const base60Data = txtCompressed ? txtCompressed.value.replace(/[â‡§â‡ª]/g, '').trim() : '';
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
}

const backlinksContainer = document.getElementById('backlinks-container');
const backlinksList = document.getElementById('backlinks-list');

function renderBacklinks(id) {
  if(!backlinksContainer || !backlinksList) return;
  if(!id || id === 'playground') {
    backlinksContainer.style.display = 'none';
    return;
  }
  const backlinks = notesDB.filter(n => n.linkedNoteId === id && !n.isArchived);
  if(backlinks.length > 0) {
    backlinksList.innerHTML = '';
    backlinks.forEach(bl => {
      // Decode content from Base60
      const text = bl.content.replace(/[â‡§â‡ª]/g, '');
      const tokens = text.split(TOKEN_REGEX);
      let decryptedParts = [];
      tokens.forEach(token => {
        if (!token) return;
        if (token.match(/^[a-zA-Z0-9_\u00C0-\u024F\u1E00-\u1EFF]+$/)) {
          const timeCode = base60ToTime(token);
          decryptedParts.push(decodeWord(timeCode));
        } else if (token.startsWith('"') && token.endsWith('"')) {
          decryptedParts.push(token.substring(1, token.length - 1));
        } else if (token.startsWith('[') && token.endsWith(']')) {
          decryptedParts.push(token);
        } else {
          decryptedParts.push(token);
        }
      });
      const decodedText = decryptedParts.join('');

      const box = document.createElement('div');
      box.style.background = 'rgba(255, 234, 0, 0.15)';
      box.style.border = '1px solid #ffea00';
      box.style.color = '#ffea00';
      box.style.padding = '12px';
      box.style.borderRadius = '3px';
      box.style.marginBottom = '10px';
      box.style.width = '100%';
      box.style.boxSizing = 'border-box';

      const tagTitle = document.createElement('div');
      tagTitle.style.fontWeight = 'bold';
      tagTitle.style.marginBottom = '8px';
      tagTitle.style.textTransform = 'uppercase';
      tagTitle.style.borderBottom = '1px dashed #ffea00';
      tagTitle.style.paddingBottom = '5px';
      const blTag = bl.tags && bl.tags.length > 0 ? bl.tags[0] : '';
      tagTitle.textContent = `âš¡ LINKED NOTE${blTag ? ': ' + blTag : ''}`;
      
      const contentDiv = document.createElement('div');
      contentDiv.style.fontFamily = 'var(--font-mono)';
      contentDiv.style.whiteSpace = 'pre-wrap';
      contentDiv.style.lineHeight = '1.4';
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
          alert(`Import thÃ nh cÃ´ng! ÄÃ£ thÃªm ${added} ghi chÃº má»›i.`);
        } else {
          alert("File JSON khÃ´ng Ä‘Ãºng Ä‘á»‹nh dáº¡ng cá»§a TimeCypher.");
        }
      } catch (err) {
        alert("Lá»—i Ä‘á»c file: " + err.message);
      }
      fileInput.value = ''; // Reset
    };
    reader.readAsText(file);
  });
}

renderNotesSidebar();
enterSandboxMode(true);

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

// --- DICTIONARY UI ---
const consonantGrid = document.getElementById('consonant-grid');
const rhymeMatrix = document.getElementById('rhyme-matrix');
const selConsonant = document.getElementById('sel-consonant');
const selRhyme = document.getElementById('sel-rhyme');

function renderConsonants() {
  if (!consonantGrid) return;
  consonantGrid.innerHTML = '';
  const isBaseCons = selConsonant.value === 'base';
  const consArray = isBaseCons ? CONSONANTS_BASE : CONSONANTS_EXTRA;
  
  consArray.forEach((c, idx) => {
    if (c === null || c === undefined) return;
    const btn = document.createElement('button');
    btn.className = 'cons-btn';
    btn.textContent = `[${idx.toString().padStart(2, '0')}] ${c === '' ? 'Ø' : c}`;
    btn.onclick = (e) => renderRhymeMatrix(idx, c, e.target);
    consonantGrid.appendChild(btn);
  });
  
  if (consonantGrid.children.length > 0) {
    consonantGrid.children[0].click();
  } else {
    if (rhymeMatrix) rhymeMatrix.innerHTML = '';
  }
}

function renderRhymeMatrix(consIdx, consonant, clickedBtn) {
  if (!rhymeMatrix) return;
  document.querySelectorAll('.cons-btn').forEach(b => b.classList.remove('active'));
  if (clickedBtn) clickedBtn.classList.add('active');
  
  rhymeMatrix.innerHTML = '';
  const isBaseCons = selConsonant.value === 'base';
  
  let rArray, s2;
  if (selRhyme.value === 'base') {
    rArray = RHYMES_BASE;
    s2 = isBaseCons ? 0 : 3;
  } else if (selRhyme.value === 'extra1') {
    rArray = RHYMES_EXTRA_1;
    s2 = isBaseCons ? 1 : 4;
  } else {
    rArray = RHYMES_EXTRA_2;
    s2 = isBaseCons ? 2 : 5;
  }
  
  rArray.forEach((r, rIdx) => {
    if (r === null || r === undefined) return;
    
    const hh = consIdx.toString().padStart(2, '0');
    const mm = rIdx.toString().padStart(2, '0');
    
    let baseWord = consonant + r;
    if (consonant === 'gi' && r.startsWith('iê')) {
       baseWord = 'gi' + r.substring(1);
    } else if (consonant === 'gi' && r.startsWith('i')) {
       baseWord = 'g' + r;
    }
    
    let validTones = [0, 1, 2, 3, 4, 5];
    if (/[cpt]$|ch$/.test(r)) {
       validTones = [1, 5];
    }
    
    const cell = document.createElement('div');
    cell.className = 'word-cell';
    let isExpanded = false;
    let variantCells = [];
    
    const renderContent = (targetCell, s1, isVariant) => {
      let displayWord = applyTone(baseWord, s1);
      let b60 = '';
      if (s1 === 0 && s2 === 0) {
        b60 = BASE60_MAPPING[parseInt(hh)] + BASE60_MAPPING[parseInt(mm)];
      } else {
        b60 = BASE60_MAPPING[parseInt(hh)] + BASE60_MAPPING[parseInt(mm)] + BASE60_MAPPING[s1] + BASE60_MAPPING[s2];
      }
      
      const timeCode = `${hh}:${mm}`;
      
      targetCell.innerHTML = `
        <div class="time-code">${timeCode} <span style="color:#0f0;font-weight:bold;margin-left:5px;">${b60}</span></div>
        <div class="word-text" style="margin-top:2px; font-size:1.1em; cursor:pointer;">${displayWord || '-'}</div>
        <div style="font-size:0.7em; color:#555; margin-top:2px;">S1=${s1}, S2=${s2}</div>
      `;
      
      if (!isVariant) {
        if (hh === mm) {
          targetCell.classList.add('highlight-repeat');
        } else if (hh[0] === mm[1] && hh[1] === mm[0]) {
          targetCell.classList.add('highlight-palindrome');
        }
      } else {
        targetCell.style.border = '1px dashed var(--neon-green)';
        targetCell.style.background = 'rgba(0, 40, 0, 0.9)';
      }
    };
    
    // Default tone is the first valid tone
    renderContent(cell, validTones[0], false);
    
    cell.onclick = () => {
      if (!isExpanded) {
        isExpanded = true;
        let insertRef = cell;
        for (let i = 1; i < validTones.length; i++) {
          const vCell = document.createElement('div');
          vCell.className = 'word-cell variant-cell';
          renderContent(vCell, validTones[i], true);
          insertRef.after(vCell);
          insertRef = vCell;
          variantCells.push(vCell);
        }
      } else {
        isExpanded = false;
        variantCells.forEach(vc => vc.remove());
        variantCells = [];
      }
    };
    
    rhymeMatrix.appendChild(cell);
  });
}

if (selConsonant && selRhyme) {
  selConsonant.addEventListener('change', renderConsonants);
  
const selDictMode = document.getElementById('sel-dict-mode');
const selShortBlock = document.getElementById('sel-short-block');

selDictMode.addEventListener('change', () => {
  const mode = selDictMode.value;
  if (mode === 'base') {
    selConsonant.style.display = 'inline-block';
    selRhyme.style.display = 'inline-block';
    selShortBlock.style.display = 'none';
    renderConsonants();
    rhymeMatrix.innerHTML = '<div class="matrix-placeholder">SELECT A CONSONANT TO INITIALIZE MATRIX...</div>';
  } else if (mode === 'short-words') {
    selConsonant.style.display = 'none';
    selRhyme.style.display = 'none';
    selShortBlock.style.display = 'inline-block';
    populateShortBlocks();
    renderShortWordsGrid();
  } else if (mode === 'two-digit') {
    selConsonant.style.display = 'none';
    selRhyme.style.display = 'none';
    selShortBlock.style.display = 'none';
    renderTwoDigitGrid();
  } else if (mode === 'english') {
    selConsonant.style.display = 'none';
    selRhyme.style.display = 'none';
    selShortBlock.style.display = 'none';
    renderEnglishGrid();
  }
});

function populateShortBlocks() {
  if (selShortBlock.children.length > 0) return;
  for (let hh = 32; hh <= 59; hh++) {
    const opt = document.createElement('option');
    opt.value = hh;
    opt.textContent = `Block ${hh}`;
    selShortBlock.appendChild(opt);
  }
  selShortBlock.addEventListener('change', renderShortWordsGrid);
}

function renderShortWordsGrid() {
  const hh = parseInt(selShortBlock.value || 32);
  const startIndex = (hh - 32) * 60;
  
  consonantGrid.innerHTML = '';
  rhymeMatrix.innerHTML = '';
  
  for (let i = 0; i < 60; i++) {
    const wordIdx = startIndex + i;
    if (wordIdx >= SHORT_WORDS.length) break;
    const word = SHORT_WORDS[wordIdx];
    
    const mm = i;
    const b60Code = `${hh.toString().padStart(2,'0')}${mm.toString().padStart(2,'0')}`;
    const mapped = timeToBase60(b60Code);
    
    const item = document.createElement('div');
    item.className = 'rhyme-item valid';
    item.innerHTML = `<div class="code-val">${mapped}</div><div class="code-idx">[${b60Code}] ${word}</div>`;
    rhymeMatrix.appendChild(item);
  }
}

function renderTwoDigitGrid() {
  consonantGrid.innerHTML = '';
  rhymeMatrix.innerHTML = '';
  TWO_DIGIT_WORDS.forEach((word, idx) => {
    if (!word) return;
    const codeStr = idx.toString().padStart(2, '0');
    const mapped = timeToBase60(codeStr);
    const item = document.createElement('div');
    item.className = 'rhyme-item valid';
    item.innerHTML = `<div class="code-val">${mapped}</div><div class="code-idx">[${codeStr}] ${word}</div>`;
    rhymeMatrix.appendChild(item);
  });
}

function renderEnglishGrid() {
  consonantGrid.innerHTML = '';
  rhymeMatrix.innerHTML = '';
  
  ENGLISH_DICT.forEach((word, idx) => {
    const s2State = Math.floor(idx / 1440) + 6;
    const remainder = idx % 1440;
    const hh = Math.floor(remainder / 60);
    const mm = remainder % 60;
    const b60Code = `${hh.toString().padStart(2,'0')}${mm.toString().padStart(2,'0')}0${s2State}`;
    const mapped = timeToBase60(b60Code);
    
    const item = document.createElement('div');
    item.className = 'rhyme-item valid';
    item.innerHTML = `<div class="code-val">${mapped}</div><div class="code-idx">[${b60Code}] ${word}</div>`;
    rhymeMatrix.appendChild(item);
  });
  
  // Also render SHORTCUT_WORDS
  SHORTCUT_WORDS.forEach((word, idx) => {
    const hh = 32 + Math.floor(idx / 60);
    const mm = idx % 60;
    const b60Code = `${hh.toString().padStart(2,'0')}${mm.toString().padStart(2,'0')}`;
    const mapped = timeToBase60(b60Code);
    
    const item = document.createElement('div');
    item.className = 'rhyme-item valid';
    item.innerHTML = `<div class="code-val">${mapped}</div><div class="code-idx">[${b60Code}] ${word}</div>`;
    rhymeMatrix.appendChild(item);
  });
}

selRhyme.addEventListener('change', () => {
    const activeBtn = consonantGrid.querySelector('.active');
    if (activeBtn) activeBtn.click();
    else if (consonantGrid.children.length > 0) consonantGrid.children[0].click();
  });
  renderConsonants();
}

// Init Link Select on startup
updateTagsDatalist();
renderLinkedNoteSelect();
renderNotesSidebar();

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
    
    const textSpan = document.createElement('span');
    textSpan.style.cursor = 'pointer';
    textSpan.textContent = `🔗 ${rel.type}: ${targetNote.tags && targetNote.tags.length > 0 ? targetNote.tags[0] : rel.targetId.substring(0, 10)}`;
    textSpan.onclick = () => loadNote(rel.targetId);
    
    const rmBtn = document.createElement('span');
    rmBtn.textContent = '×';
    rmBtn.style.color = '#f00';
    rmBtn.style.marginLeft = '10px';
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
      if(n.id !== currentNoteId && n.id !== 'playground') {
        const opt = document.createElement('option');
        opt.value = n.id;
        const displayTag = n.tags && n.tags.length > 0 ? n.tags[0] : n.id.substring(0,10);
        opt.textContent = displayTag;
        selTargetNote.appendChild(opt);
      }
    });
    if(notesDB.find(n => n.id === currentVal && n.id !== currentNoteId)) {
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
    if (modalBtnNo) modalBtnNo.style.display = 'inline-block';
    currentConfirmCallback = callback;
  } else {
    if (modalBtnNo) modalBtnNo.style.display = 'none';
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
      
      const origText = txtInput.value;
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
