const fs = require('fs');
let code = fs.readFileSync('main.js', 'utf8');

// We need to inject Context Menu logic
const ctxMenuLogic = `
  // ===== CONTEXT MENU LOGIC =====
  const ctxMenu = document.getElementById('floating-context-menu');
  let activeContextInput = null;

  function hideContextMenu() {
    if (ctxMenu) {
      ctxMenu.style.display = 'none';
      activeContextInput = null;
    }
  }

  // Attach click listener to all textareas
  const allTextareas = [txtDecrypted, txtEncrypted, txtCompressed, txtFakeViet, txtTime5, txtCompressedContinuous];
  allTextareas.forEach(ta => {
    if (ta) {
      ta.addEventListener('focus', (e) => {
        // Show context menu at top right of the textarea
        activeContextInput = ta;
        const rect = ta.getBoundingClientRect();
        
        ctxMenu.style.display = 'flex';
        // Position it near the top-right of the textarea, accounting for scroll
        const topPos = rect.top + window.scrollY - 40; // a bit above
        let leftPos = rect.right + window.scrollX - ctxMenu.offsetWidth;
        if (leftPos < 0) leftPos = rect.left + window.scrollX;
        
        ctxMenu.style.top = Math.max(10, topPos) + 'px';
        ctxMenu.style.left = leftPos + 'px';
      });
    }
  });

  // Hide when clicking outside
  document.addEventListener('click', (e) => {
    if (ctxMenu && ctxMenu.style.display === 'flex') {
      if (!ctxMenu.contains(e.target) && e.target.tagName !== 'TEXTAREA') {
        hideContextMenu();
      }
    }
  });

  // Context Menu Buttons
  document.getElementById('ctx-close')?.addEventListener('click', hideContextMenu);

  document.getElementById('ctx-copy')?.addEventListener('click', () => {
    if (activeContextInput && activeContextInput.value) {
      navigator.clipboard.writeText(activeContextInput.value).then(() => {
        showToast('Đã copy!');
        hideContextMenu();
      });
    }
  });

  document.getElementById('ctx-clear')?.addEventListener('click', () => {
    if (activeContextInput) {
      activeContextInput.value = '';
      activeContextInput.dispatchEvent(new Event('input'));
      hideContextMenu();
    }
  });

  document.getElementById('ctx-full')?.addEventListener('click', () => {
    if (activeContextInput) {
      // Find wrapper
      let wrapper = activeContextInput.closest('.input-group') || activeContextInput.parentElement;
      if (wrapper.classList.contains('fullscreen')) {
        wrapper.classList.remove('fullscreen');
        document.getElementById('ctx-full').textContent = '⤢ FULL';
      } else {
        wrapper.classList.add('fullscreen');
        document.getElementById('ctx-full').textContent = '⤣ EXIT';
      }
      // Re-position menu after 100ms to adapt to fullscreen
      setTimeout(() => {
        activeContextInput.focus();
      }, 100);
    }
  });
`;

// Inject ctxMenuLogic inside DOMContentLoaded
const insertPoint = `const origEnterSandbox = window.enterSandboxMode;`;
if (!code.includes('ctx-copy')) {
  code = code.replace(insertPoint, ctxMenuLogic + "\n    " + insertPoint);
}

// Disable setupCopyClear
code = code.replace(/setupCopyClear\(/g, '// setupCopyClear(');

fs.writeFileSync('main.js', code);
console.log('Context menu JS injected!');
