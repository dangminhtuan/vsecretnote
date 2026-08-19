const fs = require('fs');
let code = fs.readFileSync('main.js', 'utf8');

const displayNew = `display.addEventListener('click', () => {
      const actionsEl = document.getElementById('top-left-actions');
      const choicesEl = document.getElementById('quiz-choices');
      
      // Đóng quiz nếu đang mở
      if (choicesEl && choicesEl.style.display !== 'none') {
        choicesEl.style.display = 'none';
        if (actionsEl) actionsEl.style.display = 'flex';
        // Force update UI lại
        const d = new Date();
        const fh = d.getHours(), fm = d.getMinutes();
        const code = String(fh).padStart(2, '0') + String(fm).padStart(2, '0');
        if (display.dataset.timecode !== code) {
           display.dataset.timecode = code;
           display.innerHTML = \`<span style="font-size:11px;color:#0f0;">🤍 \${code.substring(0,2)}:\${code.substring(2)}</span>\`;
        }
        return;
      }

      // Xác định giờ thiêng mục tiêu
      let targetCode = display.dataset.timecode;
      const d = new Date();
      const currentCode = String(d.getHours()).padStart(2, '0') + String(d.getMinutes()).padStart(2, '0');
      
      // Nếu đang là 🤍 (trái tim) => Tính giờ thiêng gần nhất trong TƯƠNG LAI
      if (display.innerHTML.includes('🤍') || !HOLY_HOUR_CODES[targetCode]) {
         const futureTimes = Object.keys(HOLY_HOUR_CODES).sort();
         const nextTime = futureTimes.find(t => t > currentCode) || futureTimes[0];
         targetCode = nextTime;
         // Tạm hiển thị giờ tương lai lên nút
         display.dataset.timecode = targetCode;
         display.innerHTML = \`<span style="font-size:11px;color:#0f0;font-weight:bold;">🤍 \${targetCode.substring(0,2)}:\${targetCode.substring(2)}=?</span>\`;
      } else {
         display.innerHTML = \`<span style="font-size:11px;color:#ff0;font-weight:bold;">⚡ \${targetCode.substring(0,2)}:\${targetCode.substring(2)}=?</span>\`;
      }

      // Mở quiz
      const correctFullCode = HOLY_HOUR_CODES[targetCode];
      const correctB60 = timeToBase60(correctFullCode);
      const wrongB60 = generateWrongAnswers(correctB60);
      const options = [correctB60, ...wrongB60].sort(() => Math.random() - 0.5);

      if (actionsEl) actionsEl.style.display = 'none';
      if (choicesEl) {
        choicesEl.style.display = 'flex';
        choicesEl.innerHTML = options.map(opt => 
          \`<button class="cyber-btn" style="background:#000;color:#0ff;border-color:#0ff;font-size:11px;padding:3px 6px;height:24px;border-radius:4px;min-width:35px;" onclick="handleTopLeftQuiz('\${opt}', '\${correctB60}', '\${correctFullCode}', this)">\${opt}</button>\`
        ).join('');
      }
    });`;

const startIdx = code.indexOf("display.addEventListener('click', () => {");
const endStr = "    });\n  }\n\n  \n  const HOLY_HOUR_CODES = {";
const endIdx = code.indexOf(endStr);

if (startIdx !== -1 && endIdx !== -1) {
  code = code.substring(0, startIdx) + displayNew + "\n  }\n\n  \n  const HOLY_HOUR_CODES = {" + code.substring(endIdx + endStr.length);
  fs.writeFileSync('main.js', code);
  console.log('Successfully replaced display listener via slicing!');
} else {
  console.log('Could not find slice boundaries:', startIdx, endIdx);
}
