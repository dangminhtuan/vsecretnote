const fs = require('fs');
let code = fs.readFileSync('main.js', 'utf8');

// 1. Add globals
if (!code.includes('txtCompressedContinuous')) {
  code = code.replace("const txtTime5 = document.getElementById('time-5-input');", "const txtTime5 = document.getElementById('time-5-input');\nconst txtCompressedContinuous = document.getElementById('compressed-continuous-input');");
}

// 2. Add event listener
if (!code.includes('syncFromCompressedContinuous')) {
  code = code.replace("if (txtTime5) txtTime5.addEventListener('input', syncFromTime5);", "if (txtTime5) txtTime5.addEventListener('input', syncFromTime5);\nif (txtCompressedContinuous) txtCompressedContinuous.addEventListener('input', syncFromCompressedContinuous);");
}

// 3. Add syncFromCompressedContinuous and updateContinuousBox
const logicBlock = `
function updateContinuousBox() {
  if (txtCompressed && txtCompressedContinuous) {
    if (document.activeElement !== txtCompressedContinuous) {
      txtCompressedContinuous.value = txtCompressed.value.replace(/\\s+/g, '');
    }
  }
}

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
  
  const chunks = [];
  for (let i = 0; i < val.length; i += 3) {
    chunks.push(val.substring(i, i + 3));
  }
  if (txtCompressed) {
    txtCompressed.value = chunks.join(' ');
    syncFromCompressed();
  }
}
`;

if (!code.includes('function syncFromCompressedContinuous()')) {
  code = code.replace("function syncFromCompressed() {", logicBlock + "\nfunction syncFromCompressed() {");
}

// 4. Inject updateContinuousBox into renderBreakdown
if (!code.includes("typeof updateContinuousBox === 'function'")) {
  code = code.replace("function renderBreakdown(pairs) {", "function renderBreakdown(pairs) {\n  if (typeof updateContinuousBox === 'function') updateContinuousBox();");
}

// 5. Clear continuous box when others are cleared
if (!code.includes("txtCompressedContinuous.value = '';")) {
  code = code.replace(/if\(txtTime5\) txtTime5\.value = '';/g, "if(txtTime5) txtTime5.value = '';\n    if(txtCompressedContinuous) txtCompressedContinuous.value = '';");
}

// 6. Hook up the copy buttons
const copyLogic = `
  // Nút copy mới
  document.getElementById('btn-copy-text')?.addEventListener('click', () => { navigator.clipboard.writeText(txtDecrypted?.value || ''); });
  document.getElementById('btn-copy-compressed')?.addEventListener('click', () => { navigator.clipboard.writeText(txtCompressed?.value || ''); });
  document.getElementById('btn-copy-continuous')?.addEventListener('click', () => { navigator.clipboard.writeText(txtCompressedContinuous?.value || ''); });
  document.getElementById('btn-copy-fake')?.addEventListener('click', () => { navigator.clipboard.writeText(txtFakeViet?.value || ''); });
  document.getElementById('btn-copy-time')?.addEventListener('click', () => { navigator.clipboard.writeText(txtEncrypted?.value || ''); });
  document.getElementById('btn-copy-time5')?.addEventListener('click', () => { navigator.clipboard.writeText(txtTime5?.value || ''); });

  // Nút clear mới
  document.getElementById('btn-clear-continuous')?.addEventListener('click', () => { if(txtCompressedContinuous) txtCompressedContinuous.value = ''; syncFromCompressedContinuous(); });
`;

if (!code.includes('btn-copy-continuous')) {
  code = code.replace("setupCopyClear('btn-copy-text', 'btn-clear-text', txtDecrypted);", copyLogic + "\n  setupCopyClear('btn-copy-text', 'btn-clear-text', txtDecrypted);");
}

fs.writeFileSync('main.js', code);
console.log('Clean patch applied to main.js');
