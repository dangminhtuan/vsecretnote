const fs = require('fs');
let code = fs.readFileSync('main.js', 'utf8');

const regex = /function copyBase60ToClipboard\(\) \{[\s\S]*?\}\n/;
const newCopyFunc = `function copyBase60ToClipboard() {
  let valToCopy = '';
  // lastFocusedInput might be inside DOMContentLoaded scope, let's just make it global
  if (typeof window.lastFocusedInput !== 'undefined' && window.lastFocusedInput && window.lastFocusedInput.value) {
    valToCopy = window.lastFocusedInput.value;
  } else if (txtCompressed && txtCompressed.value) {
    valToCopy = txtCompressed.value;
  }
  
  if (!valToCopy) return;
  navigator.clipboard.writeText(valToCopy).then(() => {
    const btn = document.getElementById('btn-copy-b60');
    if (!btn) return;
    const spans = btn.querySelectorAll('span');
    if (spans.length >= 2) {
      const origTop = spans[0].textContent;
      const origBot = spans[1].textContent;
      spans[0].textContent = '[✓]';
      spans[1].textContent = 'COPIED';
      btn.style.color = '#ff0';
      btn.style.borderColor = '#ff0';
      setTimeout(() => {
        spans[0].textContent = origTop;
        spans[1].textContent = origBot;
        btn.style.color = '#0f0';
        btn.style.borderColor = '#0f0';
      }, 1500);
    }
  });
}\n`;

if (code.match(regex)) {
  code = code.replace(regex, newCopyFunc);
}

// Make lastFocusedInput global
const oldFocusRegex = /let lastFocusedInput = null;\s*document\.addEventListener\('focusin', \(e\) => \{[\s\S]*?\}\);/;
const newFocusStr = `window.lastFocusedInput = null;
  document.addEventListener('focusin', (e) => {
    if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') {
      window.lastFocusedInput = e.target;
    }
  });`;

if (code.match(oldFocusRegex)) {
  code = code.replace(oldFocusRegex, newFocusStr);
}

fs.writeFileSync('main.js', code);
console.log('Fixed copy logic globally');
