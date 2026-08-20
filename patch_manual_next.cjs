const fs = require('fs');
let code = fs.readFileSync('main.js', 'utf8');

const startHandle = code.indexOf('function handleQuizAnswer(selectedB60');
let endHandle = code.indexOf('function startSpeedTest', startHandle);
if (endHandle === -1) endHandle = code.indexOf('// --- TIME ATTACK', startHandle);

const newHandle = `function handleQuizAnswer(selectedB60, btnEl) {
    const feedbackEl = document.getElementById('quiz-feedback');
    const allBtns = document.querySelectorAll('.quiz-opt-btn');

    // Hiện từ gốc cho cả 4 nút
    allBtns.forEach(b => {
      b.disabled = true; // Chặn click liên tục
      if (b.dataset.word) {
        b.textContent = \`\${b.dataset.b60} (\${b.dataset.word})\`;
      }
    });

    if (selectedB60 === currentQuizTarget.b60) {
      btnEl.classList.add('correct');
      gameState.quizStreak++;
      addEXP(15, \`🎯 Streak x\${gameState.quizStreak}\`);
      if (feedbackEl) {
        feedbackEl.style.color = '#0f0';
        feedbackEl.innerHTML = 'CHÍNH XÁC! +15 EXP<br/>';
      }
    } else {
      btnEl.classList.add('wrong');
      gameState.quizStreak = 0;
      updateGameUI();
      allBtns.forEach(b => {
        if (b.dataset.b60 === currentQuizTarget.b60) {
          b.classList.add('correct');
        }
      });
      if (feedbackEl) {
        feedbackEl.innerHTML = ''; // Xóa dòng chữ đỏ sai rồi
      }
    }

    if (feedbackEl) {
      const nextBtn = document.createElement('button');
      nextBtn.textContent = 'CÂU HỎI TIẾP ➔';
      nextBtn.style.cssText = 'margin-top: 15px; padding: 10px 20px; font-family: monospace; font-size: 14px; font-weight: bold; background: #ffff00; color: #000; border: none; border-radius: 4px; cursor: pointer; width: 100%; max-width: 300px; display: inline-block; text-transform: uppercase;';
      nextBtn.onclick = () => initQuizRound();
      feedbackEl.appendChild(nextBtn);
    }
  }

  `;

if (startHandle !== -1 && endHandle !== -1) {
  code = code.substring(0, startHandle) + newHandle + code.substring(endHandle);
  fs.writeFileSync('main.js', code);
  console.log('Replaced handleQuizAnswer successfully');
} else {
  console.log('Could not find bounds', startHandle, endHandle);
}
