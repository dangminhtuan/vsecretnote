const fs = require('fs');
let code = fs.readFileSync('main.js', 'utf8');

const regex = /function handleQuizAnswer\(selectedB60, btnEl\) \{[\s\S]*?setTimeout\(initQuizRound, 1000\);\s*\} else \{/;

const newLogic = `function handleQuizAnswer(selectedB60, btnEl) {
      const feedbackEl = document.getElementById('quiz-feedback');
      const allBtns = document.querySelectorAll('.quiz-opt-btn');
  
      if (selectedB60 === currentQuizTarget.b60 || selectedB60 === currentQuizTarget.b60 + ' (' + currentQuizTarget.word + ')') {
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
        
        // Auto copy
        const copyText = currentQuizTarget.b60;
        navigator.clipboard.writeText(copyText).then(() => {
          showToast('Đã copy: ' + copyText);
        });
        // -----------------------------------------------------

        setTimeout(initQuizRound, 1000);
      } else {`;

if (code.match(regex)) {
  code = code.replace(regex, newLogic);
  fs.writeFileSync('main.js', code);
  console.log('Fixed handleQuizAnswer logic');
} else {
  console.log('Regex did not match');
}
