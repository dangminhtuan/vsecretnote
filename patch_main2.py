import sys

content = open('main.js', 'r', encoding='utf-8').read()

patch_multi = '''
let multiCopyMode = false;
let multiCopyText = [];

const btnMultiCopy = document.getElementById('btn-multi-copy');
if (btnMultiCopy) {
  btnMultiCopy.addEventListener('click', () => {
    multiCopyMode = !multiCopyMode;
    if (multiCopyMode) {
      btnMultiCopy.style.boxShadow = '0 0 10px #0ff';
      btnMultiCopy.style.background = '#022';
      multiCopyText = [];
      if(typeof showToast === 'function') showToast('BATCH COPY MODE: ON');
    } else {
      btnMultiCopy.style.boxShadow = 'none';
      btnMultiCopy.style.background = '#000';
      multiCopyText = [];
      if(typeof showToast === 'function') showToast('BATCH COPY MODE: OFF');
    }
  });
}

function handleInputClickForCopy(e) {
  if (!multiCopyMode) return;
  const val = e.target.value.trim();
  if (val) {
    multiCopyText.push(val);
    const textToCopy = multiCopyText.join(' ');
    navigator.clipboard.writeText(textToCopy).then(() => {
      if(typeof showToast === 'function') {
        showToast('Đã copy: ' + textToCopy);
      }
    });
  }
}

['text-input', 'compressed-input', 'compressed-continuous-input', 'cvnss4-input', 'fake-viet-input', 'time-input', 'time5-input'].forEach(id => {
  const el = document.getElementById(id);
  if (el) {
    el.addEventListener('click', handleInputClickForCopy);
  }
});
'''

patch_bars = '''
function updateCompressionStats() {
  const rawText = txtDecrypted ? txtDecrypted.value : '';
  const compText = txtCompressedContinuous ? txtCompressedContinuous.value : (txtCompressed ? txtCompressed.value.replace(/\\s+/g, '') : '');
  
  const barRawText = document.getElementById('bar-raw-text');
  const barRawFill = document.getElementById('bar-raw-fill');
  const barCompText = document.getElementById('bar-comp-text');
  const barCompFill = document.getElementById('bar-comp-fill');
  
  if (!barRawText || !barCompText) return;
  
  if (!rawText.trim() || !compText.trim()) {
    barRawText.textContent = '0 Bytes';
    barRawFill.style.width = '0%';
    barCompText.textContent = '0 Bytes';
    barCompFill.style.width = '0%';
    return;
  }
  
  const rawBytes = getUtf8ByteLength(rawText);
  const compBytes = getUtf8ByteLength(compText); // Base60 is 1 byte per char
  
  barRawText.textContent = rawBytes + ' Bytes';
  barCompText.textContent = compBytes + ' Bytes';
  
  const maxBytes = Math.max(rawBytes, 1);
  barRawFill.style.width = '100%';
  barCompFill.style.width = Math.min(100, Math.round((compBytes / maxBytes) * 100)) + '%';
}
'''

if 'let multiCopyMode = false;' not in content:
    content = content.replace('// --- NOTE APP LOGIC ---', patch_multi + '\n// --- NOTE APP LOGIC ---')

if 'const barRawText' not in content:
    content = content.replace('function updateCompressionStats() {', patch_bars + '\nfunction _oldUpdateCompressionStats() {')

open('main.js', 'w', encoding='utf-8').write(content)
print("Updated main.js")
