const fs = require('fs');
let code = fs.readFileSync('main.js', 'utf8');

// 1. Rewrite lastFocusedInput inside DOMContentLoaded
const oldFocusRegex = /let lastFocusedInput = null;\s*document\.addEventListener\('focusin', \(e\) => \{\s*if \(e\.target\.tagName === 'TEXTAREA' \|\| e\.target\.tagName === 'INPUT'\) \{\s*lastFocusedInput = e\.target;\s*\}\s*\}\);/;
const newFocusStr = `window.lastFocusedInput = null;
  document.addEventListener('focusin', (e) => {
    if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') {
      window.lastFocusedInput = e.target;
    }
  });`;

if (code.match(oldFocusRegex)) {
  code = code.replace(oldFocusRegex, newFocusStr);
} else {
  console.log("Could not find oldFocusRegex. I'll just append it to DOMContentLoaded.");
  code = code.replace("document.addEventListener('DOMContentLoaded', () => {", "document.addEventListener('DOMContentLoaded', () => {\n" + newFocusStr);
}

// 2. Rewrite copyBase60ToClipboard exactly
const oldCopyStr = `function copyBase60ToClipboard() {
  const b60Val = txtCompressed?.value?.trim();
  if (!b60Val) return;
  navigator.clipboard.writeText(b60Val).then(() => {
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
}`;

const newCopyStr = `function copyBase60ToClipboard() {
  let valToCopy = '';
  if (window.lastFocusedInput && window.lastFocusedInput.value) {
    valToCopy = window.lastFocusedInput.value;
  } else if (txtCompressed && txtCompressed.value) {
    valToCopy = txtCompressed.value;
  }
  valToCopy = valToCopy.trim();
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
}`;

code = code.replace(oldCopyStr, newCopyStr);
fs.writeFileSync('main.js', code);
console.log('Fixed copy logic!');
