const fs = require('fs');
let code = fs.readFileSync('main.js', 'utf8');

const regex = /window\.handleTopLeftQuiz\s*=\s*function\(selectedB60,\s*correctB60,\s*correctFullCode,\s*btn\)\s*\{[\s\S]*?\};\s*$/m;

const newBlock = `window.handleTopLeftQuiz = function(selectedB60, correctB60, correctFullCode, btn) {
  if (selectedB60 === correctB60) {
    btn.style.background = '#0f0';
    btn.style.color = '#000';
    
    // 1. FORCED FILL DATA
    autoFillSpecialTime(correctFullCode); // This runs syncFromTime internally
    // Cưỡng chế điền nốt nếu syncFromTime bị miss
    if (typeof txtDecrypted !== 'undefined' && txtDecrypted && !txtDecrypted.value) {
       try { txtDecrypted.value = typeof decodeWord === 'function' ? (decodeWord(correctFullCode) || correctFullCode) : correctFullCode; } catch(e){}
    }
    if (typeof txtCompressed !== 'undefined' && txtCompressed && !txtCompressed.value) {
       txtCompressed.value = correctB60;
    }
    
    // 2. AUTO COPY GỘP
    const copyStr = correctFullCode + " " + correctB60;
    navigator.clipboard.writeText(copyStr).then(() => {
       if (typeof showToast === 'function') showToast('Đã copy: ' + copyStr);
       else {
         const el = document.createElement('div');
         el.textContent = 'Đã copy: ' + copyStr;
         el.style.cssText = 'position:fixed;bottom:20px;right:20px;background:#0f0;color:#000;padding:10px;border-radius:4px;z-index:99999;font-weight:bold;font-family:monospace;';
         document.body.appendChild(el);
         setTimeout(()=>el.remove(), 2000);
       }
    });

    if (window.triggerHolyHourQuest) window.triggerHolyHourQuest();
    
    // 3. AUTO CLOSE ON SUCCESS
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
    // WRONG ANSWER - GIỮ NGUYÊN CÁC NÚT ĐỂ USER THỬ LẠI
    btn.style.background = '#f00';
    btn.style.color = '#000';
    btn.style.textDecoration = 'line-through';
  }
};`;

if (code.match(regex)) {
  code = code.replace(regex, newBlock);
  fs.writeFileSync('main.js', code);
  console.log('Successfully patched window.handleTopLeftQuiz');
} else {
  // If exact regex fails, try to find by indexOf and substring replacement
  const start = code.indexOf('window.handleTopLeftQuiz =');
  if (start !== -1) {
    const end = code.indexOf('};', start) + 2;
    code = code.substring(0, start) + newBlock + code.substring(end);
    fs.writeFileSync('main.js', code);
    console.log('Successfully patched window.handleTopLeftQuiz via indexOf');
  } else {
    console.log('Failed to find handleTopLeftQuiz');
  }
}
