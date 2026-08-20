const fs = require('fs');
let code = fs.readFileSync('main.js', 'utf8');

const startIdx = code.indexOf("document.getElementById('btn-sandbox-clear')?.addEventListener('click', () => {");
const endIdx = code.indexOf("});", startIdx) + 3;
const oldClearBlock = code.substring(startIdx, endIdx);

const newClearBlock = `document.getElementById('btn-sandbox-clear')?.addEventListener('click', () => {
  if (typeof txtDecrypted !== 'undefined' && txtDecrypted) {
    txtDecrypted.value = '';
    txtDecrypted.dispatchEvent(new Event('input')); // Đồng bộ xóa toàn bộ
    txtDecrypted.focus();
  }
});`;

if (startIdx > -1) {
  code = code.replace(oldClearBlock, newClearBlock);
  fs.writeFileSync('main.js', code);
  console.log("Patched btn-sandbox-clear successfully!");
} else {
  console.log("Could not find the block.");
}
