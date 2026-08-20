const fs = require('fs');
let code = fs.readFileSync('main.js', 'utf8');

// 1. Fix initQuizRound to only show b60
const oldInitOpt = "btn.textContent = opt.b60 + ' (' + opt.word + ')';";
const newInitOpt = "btn.textContent = opt.b60;";
code = code.replace(oldInitOpt, newInitOpt);

// 2. Fix handleQuizAnswer to reveal words upon clicking
const oldHandleBlock = `    if (feedbackEl && feedbackEl.innerHTML.includes('Câu hỏi tiếp')) return;

    if (selectedB60 === currentQuizTarget.b60) {`;

const newHandleBlock = `    if (feedbackEl && feedbackEl.innerHTML.includes('Câu hỏi tiếp')) return;

    // Lật bài (Hiện từ gốc cho TẤT CẢ các đáp án)
    allBtns.forEach(b => {
      b.textContent = b.dataset.b60 + ' (' + b.dataset.word + ')';
      if (b.dataset.b60 === currentQuizTarget.b60) {
        b.classList.add('correct'); // Bôi xanh đáp án đúng
      }
    });

    if (selectedB60 === currentQuizTarget.b60) {`;

code = code.replace(oldHandleBlock, newHandleBlock);

// Remove the redundant classList.add('correct') in the else branch since we already do it above
const oldElseBranch = `      btnEl.classList.add('wrong');
      gameState.quizStreak = 0;
      updateGameUI();
      allBtns.forEach(b => {
        if (b.dataset.b60 === currentQuizTarget.b60) {
          b.classList.add('correct');
        }
      });`;
const newElseBranch = `      btnEl.classList.add('wrong');
      gameState.quizStreak = 0;
      updateGameUI();`;
code = code.replace(oldElseBranch, newElseBranch);

fs.writeFileSync('main.js', code);
console.log("Patched quiz reveal logic!");
