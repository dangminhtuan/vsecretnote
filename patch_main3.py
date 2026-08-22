import sys

content = open('main.js', 'r', encoding='utf-8').read()

patch = '''
function toCamelCase(str) {
  if (!str) return '';
  return str.trim().split(/\\s+/)
    .map((word, index) => {
      if (index === 0) return word.toLowerCase();
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join('');
}

function toNoAccentContinuous(str) {
  if (!str) return '';
  return str.normalize("NFD").replace(/[\\u0300-\\u036f]/g, "")
    .replace(/đ/g, "d").replace(/Đ/g, "D")
    .replace(/\\s+/g, '').toLowerCase();
}

function updateCompressionStats() {
  const rawText = txtDecrypted ? txtDecrypted.value : '';
  const rawBytes = getUtf8ByteLength(rawText);
  
  const groups = document.querySelectorAll('.input-group');
  groups.forEach(group => {
    const ta = group.querySelector('textarea');
    if (!ta) return;
    
    let barContainer = group.querySelector('.mini-byte-bar-container');
    if (!barContainer) {
      barContainer = document.createElement('div');
      barContainer.className = 'mini-byte-bar-container';
      barContainer.style.cssText = 'display: flex; align-items: center; gap: 10px; margin-top: 5px; font-size: 11px; font-family: monospace;';
      
      const textSpan = document.createElement('span');
      textSpan.className = 'm-byte-text';
      textSpan.style.color = '#888';
      textSpan.style.minWidth = '100px';
      
      const barWrapper = document.createElement('div');
      barWrapper.style.cssText = 'flex: 1; height: 4px; background: #222; border-radius: 2px; overflow: hidden;';
      
      const barFill = document.createElement('div');
      barFill.className = 'm-byte-fill';
      barFill.style.cssText = 'width: 0%; height: 100%; transition: width 0.3s ease, background 0.3s ease;';
      
      barWrapper.appendChild(barFill);
      barContainer.appendChild(barWrapper);
      barContainer.appendChild(textSpan);
      
      group.appendChild(barContainer);
    }
    
    const textSpan = barContainer.querySelector('.m-byte-text');
    const barFill = barContainer.querySelector('.m-byte-fill');
    
    let currentBytes = 0;
    if (ta.id === 'text-input') {
      currentBytes = rawBytes;
    } else if (ta.id.includes('compressed')) {
      currentBytes = getUtf8ByteLength(ta.value.replace(/\\s+/g, ''));
    } else {
      currentBytes = getUtf8ByteLength(ta.value);
    }
    
    if (rawBytes === 0) {
      textSpan.textContent = currentBytes > 0 ? currentBytes + ' B' : '';
      barFill.style.width = '0%';
      return;
    }
    
    const pct = Math.round((currentBytes / rawBytes) * 100);
    textSpan.textContent = `${currentBytes}/${rawBytes} B = ${pct}%`;
    
    if (ta.id === 'text-input') {
      barFill.style.background = '#888';
      barFill.style.width = '100%';
    } else if (pct < 100) {
      barFill.style.background = '#0f0'; // Green
      barFill.style.width = Math.min(100, pct) + '%';
    } else if (pct === 100) {
      barFill.style.background = '#aa0'; // Yellow
      barFill.style.width = '100%';
    } else {
      barFill.style.background = '#f00'; // Red
      barFill.style.width = '100%'; 
    }
  });
}
'''

# We also need to add the document DOM element variables and update logic in syncFromDecrypted
elements = '''
const txtCamelCase = document.getElementById('camel-case-input');
const txtNoAccent = document.getElementById('no-accent-input');
'''

if 'const txtCamelCase' not in content:
    content = content.replace("const txtDecrypted = document.getElementById('text-input');", "const txtDecrypted = document.getElementById('text-input');\n" + elements)

# In syncFromDecrypted, add values
sync_updates = '''
    if(txtFakeViet) txtFakeViet.value = toFakeViet(text);
    if(txtCamelCase) txtCamelCase.value = toCamelCase(text);
    if(txtNoAccent) txtNoAccent.value = toNoAccentContinuous(text);
'''
content = content.replace('if(txtFakeViet) txtFakeViet.value = toFakeViet(text);', sync_updates)

# Add to the clear block in syncFromDecrypted
clear_updates = '''
      if (txtFakeViet) txtFakeViet.value = '';
      if (txtCamelCase) txtCamelCase.value = '';
      if (txtNoAccent) txtNoAccent.value = '';
'''
content = content.replace("if (txtFakeViet) txtFakeViet.value = '';", clear_updates)


# Overwrite the old updateCompressionStats entirely
# We'll just replace everything between 'function updateCompressionStats() {' and 'function _oldUpdateCompressionStats'
import re
content = re.sub(r'function updateCompressionStats\(\) \{[\s\S]*?(?=function _oldUpdateCompressionStats)', patch + '\n', content)

# ensure multi copy binds to the new inputs
content = content.replace("['text-input', 'compressed-input', 'compressed-continuous-input', 'cvnss4-input', 'fake-viet-input', 'time-input', 'time5-input']", "['text-input', 'compressed-input', 'compressed-continuous-input', 'cvnss4-input', 'fake-viet-input', 'time-input', 'time5-input', 'camel-case-input', 'no-accent-input']")

open('main.js', 'w', encoding='utf-8').write(content)
print("Updated main.js")
