const fs = require('fs');
let code = fs.readFileSync('main.js', 'utf8');

// 1. PATCH HOLY_HOUR_CODES
code = code.replace(/'0202':\s*'[^']+'/, "'0202': '020205'"); // gạch
code = code.replace(/'0303':\s*'[^']+'/, "'0303': '030324'"); // tiếp
code = code.replace(/'0404':\s*'[^']+'/, "'0404': '040429'"); // thiệt
code = code.replace(/'0505':\s*'[^']+'/, "'0505': '050520'"); // tràn
code = code.replace(/'0123':\s*'[^']+'/, "'0123': '012317'"); // được
code = code.replace(/'1234':\s*'[^']+'/, "'1234': '123400'"); // rắp
code = code.replace(/'2323':\s*'[^']+'/, "'2323': '232315'"); // nghưởc
code = code.replace(/'2345':\s*'[^']+'/, "'2345': '234514'"); // nghuỳnh
code = code.replace(/'2332':\s*'[^']+'/, "'2332': '233208'"); // nghờn

// 2. PATCH DISPLAY EVENT LISTENER
const displayOld = `display.addEventListener('click', () => {
      const code = display.dataset.timecode;
      if (!code) return;

      if (currentIsPast) {
        // Trạng thái 😢: click → điền đủ 3 ô
        const fullTimeStr = typeof HOLY_HOUR_CODES !== 'undefined' && HOLY_HOUR_CODES[code] ? HOLY_HOUR_CODES[code] : code + '00';
        autoFillSpecialTime(fullTimeStr);
        // Flash toàn bộ input xanh để user thấy
        [txtDecrypted, txtEncrypted, txtCompressed].forEach(el => {
          if (!el) return;
          const prev = el.style.outline;
          el.style.outline = '2px solid #0f0';
          setTimeout(() => { el.style.outline = prev; }, 900);
        });
      } else {
        // Trạng thái ⏳/⚡/🤍: click → copy số (mã thời gian) + mã nén tương ứng vào clipboard
        const b60 = display.dataset.b60 || '';
        const copyText = b60 ? \`\${code} \${b60}\` : code;
        navigator.clipboard.writeText(copyText).then(() => {
          const prev = display.innerHTML;
          const prevBorder = display.style.borderColor;
          display.style.borderColor = '#fff';
          display.innerHTML = \`<span style="font-size:11px;color:#fff;font-weight:bold">✓ \${copyText}</span>\`;
          setTimeout(() => {
            display.innerHTML = prev;
            display.style.borderColor = prevBorder;
          }, 1200);
        });
      }
    });`;

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

if (code.includes(displayOld)) {
  code = code.replace(displayOld, displayNew);
  console.log('Replaced display event listener!');
} else {
  console.log('Could not find display event listener block.');
}

// 3. ADD handleTopLeftQuiz TO WINDOW (if not exists)
if (!code.includes('window.handleTopLeftQuiz')) {
  const handlerCode = `
window.handleTopLeftQuiz = function(selectedB60, correctB60, correctFullCode, btn) {
  if (selectedB60 === correctB60) {
    btn.style.background = '#0f0';
    btn.style.color = '#000';
    autoFillSpecialTime(correctFullCode);
    navigator.clipboard.writeText(correctB60);
    if (window.triggerHolyHourQuest) window.triggerHolyHourQuest();
  } else {
    btn.style.background = '#f00';
    btn.style.color = '#000';
    btn.style.textDecoration = 'line-through';
  }
};
`;
  code += handlerCode;
}

// 4. PREVENT TICK UPDATING WHEN QUIZ IS OPEN
const tickOld = `const hh2 = String(fh).padStart(2, '0');
    const mm2 = String(fm).padStart(2, '0');
    const timeCode = \`\${hh2}\${mm2}\`;`;

const tickNew = `const choicesEl = document.getElementById('quiz-choices');
    if (choicesEl && choicesEl.style.display !== 'none') return; // Freeze UI if quiz is active

    const hh2 = String(fh).padStart(2, '0');
    const mm2 = String(fm).padStart(2, '0');
    const timeCode = \`\${hh2}\${mm2}\`;`;

if (code.includes(tickOld) && !code.includes('Freeze UI if quiz is active')) {
  code = code.replace(tickOld, tickNew);
}

// 5. INJECT triggerHolyHourQuest IN initGameEngine
const engineOld = `let exp = loadEXP();
  let gameState = {`;
const engineNew = `let exp = loadEXP();
  let gameState = {`;

const triggerFunc = `
  window.triggerHolyHourQuest = function() {
    addEXP(20, '⏱️ Trả lời đúng Giờ Thiêng');
    checkQuestComplete('q2', 100);
  };
`;
const idxEngine = code.indexOf(engineOld);
if (idxEngine !== -1 && !code.includes('window.triggerHolyHourQuest = function() {')) {
  code = code.substring(0, idxEngine) + triggerFunc + code.substring(idxEngine);
}

fs.writeFileSync('main.js', code);
console.log('Patch complete.');
