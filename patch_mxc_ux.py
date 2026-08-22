import re

js = open('main.js', 'r', encoding='utf-8').read()

old_block = """  const btnMultiCopy = document.getElementById('btn-multi-copy');
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
  }"""

new_block = """  function removeAllBadges() {
    document.querySelectorAll('.mxc-badge').forEach(el => el.remove());
  }

  const btnMultiCopy = document.getElementById('btn-multi-copy');
  if (btnMultiCopy) {
    btnMultiCopy.addEventListener('click', () => {
      multiCopyMode = !multiCopyMode;
      if (multiCopyMode) {
        btnMultiCopy.style.boxShadow = '0 0 10px #0ff';
        btnMultiCopy.style.background = '#022';
        multiCopyText = [];
        removeAllBadges();
        if(typeof showToast === 'function') showToast('CHON CAC O CAN COPY...');
      } else {
        btnMultiCopy.style.boxShadow = 'none';
        btnMultiCopy.style.background = '#000';
        
        if (multiCopyText.length > 0) {
          const textToCopy = multiCopyText.join(' ');
          navigator.clipboard.writeText(textToCopy).then(() => {
            if(typeof showToast === 'function') showToast('DA COPY ' + multiCopyText.length + ' MUC');
          });
        } else {
          if(typeof showToast === 'function') showToast('DA HUY COPY');
        }
        
        multiCopyText = [];
        removeAllBadges();
      }
    });
  }
  
  function handleInputClickForCopy(e) {
    if (!multiCopyMode) return;
    const val = e.target.value.trim();
    if (val) {
      multiCopyText.push(val);
      const inputGroup = e.target.closest('.input-group') || e.target.parentElement;
      if (inputGroup) {
        inputGroup.style.position = 'relative';
        const badge = document.createElement('div');
        badge.className = 'mxc-badge';
        badge.textContent = multiCopyText.length;
        badge.style.cssText = 'position: absolute; left: -25px; top: 50%; transform: translateY(-50%); background: #0ff; color: #000; font-weight: bold; padding: 2px 6px; border-radius: 4px; font-size: 12px; z-index: 10; pointer-events: none; box-shadow: 0 0 5px #0ff;';
        inputGroup.appendChild(badge);
      }
    }
  }"""

if old_block in js:
    js = js.replace(old_block, new_block)
    open('main.js', 'w', encoding='utf-8').write(js)
    print("Patched UX successfully.")
else:
    print("Could not find the block to patch!")
