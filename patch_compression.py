import sys

content = open('index.html', 'r', encoding='utf-8').read()
content = content.replace('<label for="text-input">TEXT DECRYPTED [VI/EN]</label>', '<label for="text-input">TEXT DECRYPTED [VI/EN] <span id="compression-stats" style="color:#0f0; font-size:12px; font-weight:normal; margin-left:10px;"></span></label>')
open('index.html', 'w', encoding='utf-8').write(content)

content = open('main.js', 'r', encoding='utf-8').read()

patch = '''
function getUtf8ByteLength(str) {
  return new Blob([str]).size;
}

function updateCompressionStats() {
  const statsEl = document.getElementById('compression-stats');
  if (!statsEl) return;
  const rawText = txtDecrypted ? txtDecrypted.value : '';
  const compText = txtCompressedContinuous ? txtCompressedContinuous.value : (txtCompressed ? txtCompressed.value.replace(/\\s+/g, '') : '');
  
  if (!rawText.trim() || !compText.trim()) {
    statsEl.textContent = '';
    return;
  }
  
  const rawBytes = getUtf8ByteLength(rawText);
  const compBytes = getUtf8ByteLength(compText); // Base60 is 1 byte per char
  
  if (rawBytes === 0) return;
  
  const saved = rawBytes - compBytes;
  const ratio = Math.round((saved / rawBytes) * 100);
  
  statsEl.textContent = `| Tiết kiệm: ${ratio}% (${rawBytes}B -> ${compBytes}B)`;
}
'''
if 'function updateCompressionStats' not in content:
    content = content.replace('function renderBreakdown(pairs)', patch + '\nfunction renderBreakdown(pairs)')

content = content.replace('renderBreakdown(breakdownPairs);\n    saveCurrentNote();', 'renderBreakdown(breakdownPairs);\n    updateCompressionStats();\n    saveCurrentNote();')
content = content.replace('renderBreakdown([]);\n      return;', 'renderBreakdown([]);\n      updateCompressionStats();\n      return;')

open('main.js', 'w', encoding='utf-8').write(content)
print('Patched successfully')
