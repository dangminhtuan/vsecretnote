const fs = require('fs');
let code = fs.readFileSync('main.js', 'utf8');

const regex = /function handleQuizAnswer\(selectedB60, btnEl\) \{[\s\S]*?setTimeout\(initQuizRound, 1800\);\s*\}\s*\}/;

const newLogic = `function handleQuizAnswer(selectedB60, btnEl) {
    const feedbackEl = document.getElementById('quiz-feedback');
    const allBtns = document.querySelectorAll('.quiz-opt-btn');

    // Loại bỏ ngoặc đơn nếu có (vì trước đó ta đã nối thêm (từ gốc))
    const actualSelected = selectedB60.split(' (')[0];

    if (actualSelected === currentQuizTarget.b60) {
      btnEl.textContent = currentQuizTarget.b60 + ' (' + currentQuizTarget.word + ')';
      btnEl.classList.add('correct');
      gameState.quizStreak++;
      addEXP(15, \`🔥 Streak x\${gameState.quizStreak}\`);
      if (feedbackEl) {
        feedbackEl.style.color = '#0f0';
        feedbackEl.textContent = 'CHÍNH XÁC! +15 EXP';
      }
      
      // Khôi phục: Fill Data
      if (txtDecrypted) {
        txtDecrypted.value = currentQuizTarget.word;
        if (typeof syncFromDecrypted === 'function') syncFromDecrypted();
      }
      
      // Auto copy mã time và mã nén
      const copyText = currentQuizTarget.time + " " + currentQuizTarget.b60;
      navigator.clipboard.writeText(copyText).then(() => {
        showToast('Đã copy: ' + copyText);
      });

      setTimeout(initQuizRound, 1200);
    } else {
      btnEl.classList.add('wrong');
      
      // Tra ngược từ gốc của đáp án sai này để hiển thị (tái tạo tính năng cũ)
      try {
        const fakeDecoded = decodeWord(base60ToTime(actualSelected));
        btnEl.textContent = actualSelected + ' (' + fakeDecoded + ')';
      } catch(e) {}

      gameState.quizStreak = 0;
      updateGameUI();
      allBtns.forEach(b => {
        if (b.textContent === currentQuizTarget.b60 || b.textContent.startsWith(currentQuizTarget.b60 + ' (')) {
          b.classList.add('correct');
          b.textContent = currentQuizTarget.b60 + ' (' + currentQuizTarget.word + ')';
        }
      });
      if (feedbackEl) {
        feedbackEl.style.color = '#f00';
        feedbackEl.textContent = \`SAI RỒI! Mã đúng là [\${currentQuizTarget.b60}]\`;
      }
      setTimeout(initQuizRound, 2000);
    }
  }`;

if (code.match(regex)) {
  code = code.replace(regex, newLogic);
  fs.writeFileSync('main.js', code);
  console.log('Restored fully functional handleQuizAnswer');
} else {
  console.log('Regex did not match handleQuizAnswer!');
}
