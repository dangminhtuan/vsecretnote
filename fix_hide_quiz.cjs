const fs = require('fs');
let code = fs.readFileSync('main.js', 'utf8');

const targetStr = `function hideQuiz() {
    if (!quizChoices) return;
    quizChoices.style.display = 'none';
    quizChoices.innerHTML = '';
    quizAnswered = false;
    currentQuizTimeCode = null;
  }`;

const newStr = `function hideQuiz() {
    if (!quizChoices) return;
    quizChoices.style.display = 'none';
    quizChoices.innerHTML = '';
    quizAnswered = false;
    currentQuizTimeCode = null;
    const actionsEl = document.getElementById('top-left-actions');
    if (actionsEl) actionsEl.style.display = 'flex';
  }`;

if (code.includes(targetStr)) {
  code = code.replace(targetStr, newStr);
  fs.writeFileSync('main.js', code);
  console.log('Fixed hideQuiz');
} else {
  console.log('Could not find hideQuiz block');
}
