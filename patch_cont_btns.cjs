const fs = require('fs');
let code = fs.readFileSync('main.js', 'utf8');

const newLogic = `
    const btnCopyCont = document.getElementById('btn-copy-continuous');
    const btnClearCont = document.getElementById('btn-clear-continuous');
    if (btnCopyCont) {
      btnCopyCont.addEventListener('click', () => {
        if (txtCompressedContinuous) {
          navigator.clipboard.writeText(txtCompressedContinuous.value);
          showToast('Đã copy mã liên tiếp!');
        }
      });
    }
    if (btnClearCont) {
      btnClearCont.addEventListener('click', () => {
        if (txtCompressedContinuous) {
          txtCompressedContinuous.value = '';
          if (typeof syncFromCompressedContinuous === 'function') syncFromCompressedContinuous();
        }
      });
    }
`;

if (!code.includes('btnCopyCont')) {
  // Inject right before the setupCopyClear block
  code = code.replace("setupCopyClear('btn-copy-text', 'btn-clear-text', txtDecrypted);", newLogic + "\n  setupCopyClear('btn-copy-text', 'btn-clear-text', txtDecrypted);");
  fs.writeFileSync('main.js', code);
  console.log('Injected continuous button handlers');
}
