const fs = require('fs');
let code = fs.readFileSync('main.js', 'utf8');

const regex = /window\.handleTopLeftQuiz\s*=\s*function\(selectedB60,\s*correctB60,\s*correctFullCode,\s*btn\)\s*\{[\s\S]*?\};\s*$/m;

const newBlock = `window.handleTopLeftQuiz = function(selectedB60, correctB60, correctFullCode, btn) {
  if (selectedB60 === correctB60) {
    btn.style.background = '#0f0';
    btn.style.color = '#000';
    
    // 1. FORCED FILL DATA (Trực tiếp DOM để không trượt phát nào)
    const dec = document.getElementById('text-input');
    const enc = document.getElementById('time-input');
    const comp = document.getElementById('compressed-input');
    const fake = document.getElementById('fake-viet-input');
    
    if (enc) enc.value = correctFullCode;
    if (comp) comp.value = correctB60;
    if (dec) {
       try {
          const w = typeof decodeWord === 'function' ? decodeWord(correctFullCode) : correctFullCode;
          dec.value = w && w !== 'undefined' ? w : correctFullCode;
       } catch(e) { dec.value = correctFullCode; }
    }
    if (fake && typeof toFakeViet === 'function' && dec) {
       try { fake.value = toFakeViet(dec.value); } catch(e){}
    }
    
    // Ép đồng bộ các ô còn lại (Time5, Liên tục...)
    if (typeof syncFromTime === 'function') {
       try { syncFromTime(); } catch(e){}
    }
    
    // 2. AUTO COPY GỘP (Mã thời gian + Mã nén)
    const copyStr = correctFullCode + " " + correctB60;
    navigator.clipboard.writeText(copyStr).then(() => {
       if (typeof showToast === 'function') showToast('Đã copy: ' + copyStr);
       else {
         const el = document.createElement('div');
         el.textContent = 'Đã copy: ' + copyStr;
         el.style.cssText = 'position:fixed;bottom:20px;right:20px;background:#0f0;color:#000;padding:10px;border-radius:4px;z-index:99999;font-weight:bold;font-family:monospace;pointer-events:none;';
         document.body.appendChild(el);
         setTimeout(()=>el.remove(), 2000);
       }
    }).catch(err => console.log('Copy failed', err));

    if (window.triggerHolyHourQuest) window.triggerHolyHourQuest();
    
    // 3. AUTO CLOSE ON SUCCESS (Chỉ đóng khi chọn đúng)
    setTimeout(() => {
      const choicesEl = document.getElementById('quiz-choices');
      const actionsEl = document.getElementById('top-left-actions');
      if (choicesEl) {
        choicesEl.style.display = 'none';
        choicesEl.innerHTML = '';
      }
      if (actionsEl) {
        actionsEl.style.display = 'flex';
      }
      const display = document.getElementById('special-time-display');
      if (display && display.dataset.timecode) {
         const targetCode = display.dataset.timecode;
         display.innerHTML = \`<span style="font-size:11px;color:#0f0;">🤍 \${targetCode.substring(0,2)}:\${targetCode.substring(2)}</span>\`;
      }
    }, 1000);

  } else {
    // 4. WRONG ANSWER - GIỮ NGUYÊN NÚT
    btn.style.background = '#f00';
    btn.style.color = '#000';
    btn.style.textDecoration = 'line-through';
  }
};`;

if (code.match(regex)) {
  code = code.replace(regex, newBlock);
  fs.writeFileSync('main.js', code);
  console.log('Successfully patched window.handleTopLeftQuiz directly');
} else {
  console.log('Regex failed');
}
