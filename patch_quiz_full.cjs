const fs = require('fs');
let code = fs.readFileSync('main.js', 'utf8');

const regex = /function handleQuizAnswer\(selectedB60, btnEl\) \{[\s\S]*?if \(feedbackEl\) \{\s*feedbackEl\.style\.color = '#f00';\s*feedbackEl\.textContent = 'SAI RỒI! Streak = 0';\s*\}\s*setTimeout\(initQuizRound, 2000\);\s*\}/;

const newLogic = `function handleQuizAnswer(selectedB60, btnEl) {
      const feedbackEl = document.getElementById('quiz-feedback');
      const allBtns = document.querySelectorAll('.quiz-opt-btn');
  
      // Nếu nút đã được click (có chứa dấu ngoặc đơn), thì bỏ qua ngoặc để so sánh
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
        
        // --- CHỨC NĂNG FILL DATA & AUTO COPY (Đã khôi phục) ---
        if (txtDecrypted) {
          txtDecrypted.value = currentQuizTarget.word;
          if (typeof syncFromDecrypted === 'function') syncFromDecrypted();
        }
        
        // Auto copy cả mã time và mã nén
        const copyText = currentQuizTarget.time + ' ' + currentQuizTarget.b60;
        navigator.clipboard.writeText(copyText).then(() => {
          showToast('Đã copy: ' + copyText);
        });
        // -----------------------------------------------------

        setTimeout(initQuizRound, 1000);
      } else {
        btnEl.classList.add('wrong');
        
        // Tra ngược từ gốc của đáp án sai này để hiển thị
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
          feedbackEl.textContent = 'SAI RỒI! Streak = 0';
        }
        setTimeout(initQuizRound, 2000);
      }`;

if (code.match(regex)) {
  code = code.replace(regex, newLogic);
  fs.writeFileSync('main.js', code);
  console.log('Restored full quiz logic with words in parens');
} else {
  console.log('Regex did not match!');
}
