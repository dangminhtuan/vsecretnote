import {
  CONSONANTS_BASE, CONSONANTS_EXTRA,
  RHYMES_BASE, RHYMES_EXTRA_1, RHYMES_EXTRA_2,
  BASE60_MAPPING
} from './data.js';

import {
  encodeWord, decodeWord, timeToBase60, base60ToTime, TOKEN_REGEX
} from './vcomp.js';

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
    if (token.match(/^[a-zA-Z0-9À-ỹ_]+$/)) {
      const timeCode = encodeWord(token);
      const b60Code = timeToBase60(timeCode);
      encryptedParts.push(timeCode);
      compressedParts.push(b60Code);
      breakdownPairs.push({ word: token, time: timeCode, base60: b60Code });
    } else if (token.startsWith('"') && token.endsWith('"')) {
      encryptedParts.push(token);
      compressedParts.push(token);
      breakdownPairs.push({ word: token.substring(1, token.length - 1), time: token, base60: token });
    } else if (token.startsWith('[') && token.endsWith(']')) {
      encryptedParts.push(token);
      compressedParts.push(token);
      breakdownPairs.push({ word: token, time: token, base60: token });
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
    if (token.match(/^[a-zA-Z0-9À-ỹ_]+$/)) {
      const b60Code = timeToBase60(token);
      const decoded = decodeWord(token);
      decryptedParts.push(decoded);
      compressedParts.push(b60Code);
      breakdownPairs.push({ time: token, word: decoded, base60: b60Code });
    } else if (token.startsWith('"') && token.endsWith('"')) {
      const inner = token.substring(1, token.length - 1);
      decryptedParts.push(inner);
      compressedParts.push(token);
      breakdownPairs.push({ time: token, word: inner, base60: token });
    } else if (token.startsWith('[') && token.endsWith(']')) {
      decryptedParts.push(token);
      compressedParts.push(token);
      breakdownPairs.push({ time: token, word: token, base60: token });
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
  const text = txtCompressed.value.replace(/[⇧⇪]/g, '');
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
    if (token.match(/^[a-zA-Z0-9À-ỹ_]+$/)) {
      const timeCode = base60ToTime(token);
      const decoded = decodeWord(timeCode);
      timeParts.push(timeCode);
      decryptedParts.push(decoded);
      breakdownPairs.push({ base60: token, time: timeCode, word: decoded });
    } else if (token.startsWith('"') && token.endsWith('"')) {
      const inner = token.substring(1, token.length - 1);
      timeParts.push(token);
      decryptedParts.push(inner);
      breakdownPairs.push({ base60: token, time: token, word: inner });
    } else if (token.startsWith('[') && token.endsWith(']')) {
      timeParts.push(token);
      decryptedParts.push(token);
      breakdownPairs.push({ base60: token, time: token, word: token });
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
    
    const tagText = document.createElement('span');
    tagText.textContent = tag;
    
    const rmBtn = document.createElement('span');
    rmBtn.textContent = '×';
    rmBtn.style.cursor = 'pointer';
    rmBtn.style.color = '#ff5555';
    rmBtn.style.fontWeight = 'bold';
    rmBtn.onclick = () => {
      currentNoteTags = currentNoteTags.filter(t => t !== tag);
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

const selLinkedNote = document.getElementById('sel-linked-note');
const btnOpenLink = document.getElementById('btn-open-link');
const btnLinkPrev = document.getElementById('btn-link-prev');

if(selLinkedNote) {
  selLinkedNote.addEventListener('change', () => {
    if(btnOpenLink) btnOpenLink.style.display = selLinkedNote.value ? 'inline-block' : 'none';
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(saveCurrentNote, 1000);
  });
}
if(btnOpenLink) {
  btnOpenLink.addEventListener('click', () => {
    if(selLinkedNote && selLinkedNote.value) loadNote(selLinkedNote.value);
  });
}
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
        val = val.replace(/⇧f/gi, '⇪');
        val = val.replace(/⇪f/gi, '');
        val = val.replace(/ff/gi, '⇪');
      }
      val = val.replace(/f/gi, '⇧');
      cursor -= (oldLen - val.length);
    }

    // 2. Capitalize the typed character based on cursor state
    if (cursor >= 2) {
      const prev2 = val.substring(cursor - 2, cursor);
      if (prev2.match(/⇧[a-z]/i)) {
        const upper = prev2[1].toUpperCase();
        val = val.substring(0, cursor - 2) + upper + val.substring(cursor);
        cursor = cursor - 1; // ⇧ is consumed
      } else if (prev2.match(/⇪[a-z]/i)) {
        const upper = prev2[1].toUpperCase();
        val = val.substring(0, cursor - 2) + upper + '⇪' + val.substring(cursor);
        // ⇪ stays after the typed character, cursor stays same
      } else if (prev2.match(/⇪[^a-zA-Z⇧⇪]/i)) {
        val = val.substring(0, cursor - 2) + prev2[1] + '⇪' + val.substring(cursor);
        // ⇪ jumps past spaces/symbols
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
notesDB.forEach(note => {
  if (note.tag && !note.tags) {
    note.tags = [note.tag];
  } else if (!note.tags) {
    note.tags = [];
  }
});

let currentNoteId = null;
let currentNoteTags = [];
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
  renderNoteTags();
  if(newTagInput) newTagInput.value = '';
  renderBreakdown([]);
  document.querySelectorAll('.note-item').forEach(i => i.classList.remove('active'));
  if (!silent) {
    alert("Đã vào chế độ SANDBOX (Nháp). Mọi thứ bạn gõ ở đây sẽ KHÔNG BỊ LƯU LẠI.");
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
  
  const linkData = selLinkedNote ? selLinkedNote.value : '';
  
  if (!currentNoteId) {
    currentNoteId = 'note_' + Date.now();
    const newNote = {
      id: currentNoteId,
      tags: [...currentNoteTags],
      linkedNoteId: linkData,
      content: base60Data,
      isArchived: false,
      updatedAt: Date.now()
    };
    notesDB.unshift(newNote);
  } else {
    const note = notesDB.find(n => n.id === currentNoteId);
    if (note) {
      note.tags = [...currentNoteTags];
      note.linkedNoteId = linkData;
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
      const text = bl.content.replace(/[⇧⇪]/g, '');
      const tokens = text.split(TOKEN_REGEX);
      let decryptedParts = [];
      tokens.forEach(token => {
        if (!token) return;
        if (token.match(/^[a-zA-Z0-9À-ỹ_]+$/)) {
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
      tagTitle.textContent = `⚡ LINKED NOTE${blTag ? ': ' + blTag : ''}`;
      
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
    renderNoteTags();
    
    if(selLinkedNote) {
      selLinkedNote.value = note.linkedNoteId || '';
      if(btnOpenLink) btnOpenLink.style.display = selLinkedNote.value ? 'inline-block' : 'none';
    }
    syncFromCompressed();
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
  renderNoteTags();
  if(newTagInput) newTagInput.value = '';
  if(selLinkedNote) {
    selLinkedNote.value = '';
    if(btnOpenLink) btnOpenLink.style.display = 'none';
  }
  renderLinkedNoteSelect();
  renderBacklinks(null);
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
  
  // REVERSE SEARCH: Nếu nhập Tiếng Việt, mã hóa thành Base60 để search
  if(query && query.match(/[^\w\s]/)) { // Nếu có dấu tiếng Việt
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
    if(confirm('Bạn có chắc chắn muốn xóa vĩnh viễn Note này?')) {
      notesDB = notesDB.filter(n => n.id !== currentNoteId);
      localStorage.setItem('timecypher_notes', JSON.stringify(notesDB));
      createNewNote();
    }
  });
}

// Khởi tạo load
// --- IMPORT / EXPORT LOGIC ---
const btnExport = document.getElementById('btn-export-json');
const btnImport = document.getElementById('btn-import-json');
const fileInput = document.getElementById('import-file');

if(btnExport) {
  btnExport.addEventListener('click', () => {
    if (notesDB.length === 0) {
      alert("Không có dữ liệu để Export!");
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
          alert(`Import thành công! Đã thêm ${added} ghi chú mới.`);
        } else {
          alert("File JSON không đúng định dạng của TimeCypher.");
        }
      } catch (err) {
        alert("Lỗi đọc file: " + err.message);
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
    
    let displayWord = consonant + r;
    if (consonant === 'gi' && r.startsWith('iê')) {
       displayWord = 'gi' + r.substring(1);
    } else if (consonant === 'gi' && r.startsWith('i')) {
       displayWord = 'g' + r;
    }
    
    const b60 = BASE60_MAPPING[parseInt(hh)] + BASE60_MAPPING[parseInt(mm)] + BASE60_MAPPING[s2];
    
    const cell = document.createElement('div');
    cell.className = 'word-cell';
    
    if (hh === mm) {
      cell.classList.add('highlight-repeat');
    } else if (hh[0] === mm[1] && hh[1] === mm[0]) {
      cell.classList.add('highlight-palindrome');
    }
    
    cell.innerHTML = `
      <div class="time-code">${hh}:${mm} <span style="color:#0f0;font-weight:bold;margin-left:5px;">${b60}</span></div>
      <div class="word-text" style="margin-top:2px; font-size:1.1em;">${displayWord || '-'}</div>
      <div style="font-size:0.7em; color:#555; margin-top:2px;">S2=${s2}</div>
    `;
    rhymeMatrix.appendChild(cell);
  });
}

if (selConsonant && selRhyme) {
  selConsonant.addEventListener('change', renderConsonants);
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
