import os
import re

content = open('main.js', 'r', encoding='utf-8').read()

# 1. Update import
content = content.replace("import { encodeCVNSS4Word } from './cvnss4.js';", "import { encodeCVNSS4Word, decodeCVNSS4Word } from './cvnss4.js';")

# 2. Add syncFromCVNSS4 function
sync_cvnss = """
function syncFromCVNSS4() {
  const text = (txtCVNSS4 ? txtCVNSS4.value : '').trim();
  if (!text) {
    if (txtDecrypted) txtDecrypted.value = '';
    if (txtEncrypted) txtEncrypted.value = '';
    if (txtCompressed) txtCompressed.value = '';
    if (txtFakeViet) txtFakeViet.value = '';
    if (txtTime5) txtTime5.value = '';
    if (txtCompressedContinuous) txtCompressedContinuous.value = '';
    renderBreakdown([]);
    return;
  }

  const lines = text.split('\\n');
  const allTimeParts = [];
  const allDecryptedParts = [];
  const allCompressedParts = [];

  lines.forEach((line, lineIdx) => {
    if (lineIdx > 0) {
      allTimeParts.push('\\n');
      allDecryptedParts.push('\\n');
      allCompressedParts.push('\\n');
    }
    const tokens = line.split(TOKEN_REGEX);
    tokens.forEach(token => {
      if (!token) return;
      if (/[a-zA-Z0-9_\\u00C0-\\u024F\\u1E00-\\u1EFF]+/.test(token)) {
        // Decode CVNSS4 token to original Vietnamese
        const decoded = decodeCVNSS4Word(token);
        allDecryptedParts.push(decoded);
        
        // Then re-encode to time code and b60
        const timeCode = typeof encodeWord === 'function' ? encodeWord(decoded) : '';
        const b60 = typeof timeToBase60 === 'function' ? timeToBase60(timeCode) : '';
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
  
  if (txtFakeViet) txtFakeViet.value = typeof toFakeViet === 'function' ? toFakeViet(txtDecrypted.value) : '';
  if (txtTime5) txtTime5.value = typeof timeTo5Digit === 'function' ? timeTo5Digit(txtEncrypted.value) : '';
  if (txtCompressedContinuous) txtCompressedContinuous.value = txtCompressed ? txtCompressed.value.replace(/\\s+/g, '') : '';
  
  if (typeof updateCompressionStats === 'function') updateCompressionStats();
  autoResizeAll();
  forceSave();
}
"""

if "function syncFromCVNSS4" not in content:
    content = content.replace("function syncFromCompressed() {", sync_cvnss + "\nfunction syncFromCompressed() {")

# 3. Add listener
listener = """
if (txtCVNSS4) {
  txtCVNSS4.addEventListener('input', () => {
    syncFromCVNSS4();
    logActivity({ type: 'edit', field: 'cvnss4' });
  });
}
"""
if "txtCVNSS4.addEventListener" not in content:
    # find where other listeners are added, like txtCompressed.addEventListener
    content = content.replace("if (txtCompressed) {", listener + "\n  if (txtCompressed) {")


open('main.js', 'w', encoding='utf-8').write(content)
print("Updated main.js with CVNSS4 decoding integration")
