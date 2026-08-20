const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const targetHtml = `          <!-- Compressed Base60 -->
          <div class="input-group compressed-group">
            <div class="label-row">
              <label for="compressed-input">COMPRESSED CODE [BASE60]</label>
              <div class="action-btns">
                <button id="btn-copy-compressed" class="copy-btn">COPY</button>
                <button id="btn-clear-compressed" class="copy-btn clear-btn">CLEAR</button>
                <button class="copy-btn btn-fullscreen" onclick="toggleFullscreen(this)">⛶</button>
              </div>
            </div>
            <textarea id="compressed-input" placeholder="Mã nén siêu ngắn..." spellcheck="false"></textarea>
          </div>`;

const newHtml = targetHtml + `\n
          <!-- Compressed Base60 Continuous -->
          <div class="input-group compressed-group">
            <div class="label-row">
              <label for="compressed-continuous-input">CONTINUOUS BASE60 [NO SPACE]</label>
              <div class="action-btns">
                <button id="btn-copy-continuous" class="copy-btn">COPY</button>
                <button id="btn-clear-continuous" class="copy-btn clear-btn">CLEAR</button>
                <button class="copy-btn btn-fullscreen" onclick="toggleFullscreen(this)">⛶</button>
              </div>
            </div>
            <textarea id="compressed-continuous-input" placeholder="Mã nén liên tiếp (không khoảng trắng)..." spellcheck="false"></textarea>
          </div>`;

if (!html.includes('compressed-continuous-input')) {
  // Regex to match existing block ignoring exact whitespace/newlines
  const matchHtmlRegex = /<!-- Compressed Base60 -->[\s\S]*?<textarea id="compressed-input"[\s\S]*?<\/textarea>\s*<\/div>/;
  html = html.replace(matchHtmlRegex, match => match + `\n
          <!-- Compressed Base60 Continuous -->
          <div class="input-group compressed-group">
            <div class="label-row">
              <label for="compressed-continuous-input">CONTINUOUS BASE60 [NO SPACE]</label>
              <div class="action-btns">
                <button id="btn-copy-continuous" class="copy-btn">COPY</button>
                <button id="btn-clear-continuous" class="copy-btn clear-btn">CLEAR</button>
                <button class="copy-btn btn-fullscreen" onclick="toggleFullscreen(this)">⛶</button>
              </div>
            </div>
            <textarea id="compressed-continuous-input" placeholder="Mã nén liên tiếp (không khoảng trắng)..." spellcheck="false"></textarea>
          </div>`);

  // Replace COPY BASE60
  html = html.replace(/<button id="btn-copy-b60"[\s\S]*?<\/button>/, '<button id="btn-copy-b60" class="cyber-btn" style="border-color: #0f0; color: #0f0; background: #000; cursor: pointer; padding: 4px 10px; letter-spacing: 1px; white-space: nowrap; line-height: 1.3; font-weight: bold; font-family: monospace;">[^C] TEXT</button>');
  
  fs.writeFileSync('index.html', html);
  console.log('index.html patched');
} else {
  console.log('index.html already patched');
}

// 2. Patch main.js
let code = fs.readFileSync('main.js', 'utf8');

const globalsStr = "let txtDecrypted, txtEncrypted, txtCompressed, txtFakeViet, txtTime5;";
const globalsNew = "let txtDecrypted, txtEncrypted, txtCompressed, txtFakeViet, txtTime5, txtCompressedContinuous;";
code = code.replace(globalsStr, globalsNew);

const initDOMStr = `  txtTime5 = document.getElementById('time-5-input');`;
const initDOMNew = `  txtTime5 = document.getElementById('time-5-input');\n  txtCompressedContinuous = document.getElementById('compressed-continuous-input');`;
if (!code.includes("document.getElementById('compressed-continuous-input')")) {
  code = code.replace(initDOMStr, initDOMNew);
}

const listenersStr = `  if (txtTime5) txtTime5.addEventListener('input', syncFromTime5);`;
const listenersNew = `  if (txtTime5) txtTime5.addEventListener('input', syncFromTime5);\n  if (txtCompressedContinuous) txtCompressedContinuous.addEventListener('input', syncFromCompressedContinuous);`;
if (!code.includes("syncFromCompressedContinuous")) {
  code = code.replace(listenersStr, listenersNew);
}

const clearStr = `  if(txtTime5) txtTime5.value = '';\n    renderBreakdown([]);`;
const clearNew = `  if(txtTime5) txtTime5.value = '';\n    if(txtCompressedContinuous) txtCompressedContinuous.value = '';\n    renderBreakdown([]);`;
if (!code.includes("txtCompressedContinuous.value = '';")) {
  // global replace for all sync clear functions
  code = code.replace(/if\(txtTime5\) txtTime5\.value = '';\s*renderBreakdown\(\[\]\);/g, clearNew);
}

// Add sync function and hook to update continuous box globally
const addLogicStr = `function syncFromCompressed() {`;
const newSyncFunction = `
function syncFromCompressedContinuous() {
  if (!txtCompressedContinuous) return;
  const val = txtCompressedContinuous.value.replace(/\\s+/g, '');
  if (!val) {
    if (txtDecrypted) txtDecrypted.value = '';
    if (txtEncrypted) txtEncrypted.value = '';
    if (txtCompressed) txtCompressed.value = '';
    if (txtFakeViet) txtFakeViet.value = '';
    if (txtTime5) txtTime5.value = '';
    renderBreakdown([]);
    return;
  }
  
  // Split continuous string into 3-char chunks
  const chunks = [];
  for (let i = 0; i < val.length; i += 3) {
    chunks.push(val.substring(i, i + 3));
  }
  if (txtCompressed) {
    txtCompressed.value = chunks.join(' ');
    syncFromCompressed(); // Re-use existing sync
  }
}

// Global update for continuous box whenever anything else is synced
function updateContinuousBox() {
  if (txtCompressed && txtCompressedContinuous) {
    txtCompressedContinuous.value = txtCompressed.value.replace(/\\s+/g, '');
  }
}

// We need to inject updateContinuousBox() at the end of each sync function!
`;
if (!code.includes('function syncFromCompressedContinuous()')) {
  code = code.replace(addLogicStr, newSyncFunction + '\n' + addLogicStr);
  
  // Now inject updateContinuousBox() at the end of every sync
  const syncFuncs = ['syncFromDecrypted', 'syncFromTime', 'syncFromCompressed', 'syncFromFakeViet', 'syncFromTime5'];
  syncFuncs.forEach(fn => {
    // Basic regex to find the end of the function. We'll just do a dirty replace on the '}' before the next function.
    // Easier way: replace "renderBreakdown(breakdownPairs);" with "renderBreakdown(breakdownPairs); updateContinuousBox();"
    // And for `syncFromFakeViet`, `renderBreakdown([]);`
  });
  
  // Replace renderBreakdown calls
  code = code.replace(/renderBreakdown\(breakdownPairs\);/g, "renderBreakdown(breakdownPairs); if (typeof updateContinuousBox === 'function') updateContinuousBox();");
}

// Setup context copy
const contextCopyLogic = `
let lastFocusedInput = null;
document.addEventListener('focusin', (e) => {
  if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') {
    lastFocusedInput = e.target;
  }
});
`;
if (!code.includes('lastFocusedInput')) {
  code = code.replace('document.addEventListener(\'DOMContentLoaded\', () => {', 'document.addEventListener(\'DOMContentLoaded\', () => {' + contextCopyLogic);
}

const copyB60Str = `    const btnCopyB60 = document.getElementById('btn-copy-b60');
    if (btnCopyB60) {
      btnCopyB60.addEventListener('click', () => {
        if (txtCompressed) {
          navigator.clipboard.writeText(txtCompressed.value);
          showToast('Đã copy mã nén Base60!');
        }
      });
    }`;
const copyContextNew = `    const btnCopyB60 = document.getElementById('btn-copy-b60');
    if (btnCopyB60) {
      btnCopyB60.addEventListener('click', () => {
        if (lastFocusedInput && lastFocusedInput.value) {
          navigator.clipboard.writeText(lastFocusedInput.value);
          showToast('Đã copy từ ô đang focus!');
        } else if (txtCompressed && txtCompressed.value) {
          // fallback
          navigator.clipboard.writeText(txtCompressed.value);
          showToast('Đã copy mã nén Base60!');
        } else {
          showToast('Vui lòng trỏ chuột vào một ô để copy!');
        }
      });
    }

    const btnCopyCont = document.getElementById('btn-copy-continuous');
    const btnClearCont = document.getElementById('btn-clear-continuous');
    if (btnCopyCont) {
      btnCopyCont.addEventListener('click', () => {
        if (txtCompressedContinuous) {
          navigator.clipboard.writeText(txtCompressedContinuous.value);
          showToast('Đã copy mã liên tiếp!');
        }
      });
    }
    if (btnClearCont) {
      btnClearCont.addEventListener('click', () => {
        if (txtCompressedContinuous) {
          txtCompressedContinuous.value = '';
          syncFromCompressedContinuous();
        }
      });
    }
`;
if (code.includes('btnCopyB60.addEventListener(\'click\'')) {
  code = code.replace(copyB60Str, copyContextNew);
} else {
  // If it doesn't match perfectly, use a regex
  code = code.replace(/const btnCopyB60 = document\.getElementById\('btn-copy-b60'\);[\s\S]*?showToast\('[^']+'\);\s*\}\s*\}\);\s*\}/, copyContextNew);
}

fs.writeFileSync('main.js', code);
console.log('main.js patched');
