const fs = require('fs');
let code = fs.readFileSync('main.js', 'utf8');

const targetStr = `    // Hiện từ gốc cho cả 4 nút
    allBtns.forEach(b => {
      b.disabled = true; // Chặn click liên tục
      if (b.dataset.word) {
        b.textContent = \`\${b.dataset.b60} (\${b.dataset.word})\`;
      }
    });`;

const newStr = `    // Hiện từ gốc cho cả 4 nút
    allBtns.forEach(b => {
      b.style.pointerEvents = 'none'; // Chặn click mà không làm mờ nút
      if (b.dataset.word) {
        b.textContent = \`\${b.dataset.b60} (\${b.dataset.word})\`;
      }
    });`;

code = code.replace(targetStr, newStr);
fs.writeFileSync('main.js', code);
console.log('Fixed button disable styling');
